import React, { useState, useEffect } from "react";
import "./App.css";
import useSound from 'use-sound';
import { PersonalityForm } from "./components/personalityForm";
import { useWeb3 } from "./components/connectWallet";
import loadingAnimation from "./loaders/loading.gif";
import bgAudio from "./sounds/bg_sound.mp3";
import logo from "./assets/onepiece_logo.png";
import luffyAudio from "./sounds/luffy.mp3";
import sanjiAudio from "./sounds/sanji.mp3";
import zoroAudio from "./sounds/zoro.mp3";
import usoppAudio from "./sounds/usopp.mp3";
import brookAudio from "./sounds/brook.mp3";
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: process.env.REACT_APP_SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

function App() {
  const { web3, nftcontract, account, connectWallet, disconnectWallet, connected } = useWeb3();
  const [showPersonalityForm, setShowPersonalityForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [started, setStarted] = useState(false);
  const [Minted, setMinted] = useState(false);
  const [tokenURI, setTokenURI] = useState('');
  const [character, setCharacter] = useState(``);


  //Initialize audio
  const [playBgSound, { stop: stopBgSound }] = useSound(bgAudio, { loop: true, volume: 0.2 });
  const [playLuffySound, { stop: stopLuffySound }] = useSound(luffyAudio, { loop: false });
  const [playSanjiSound, { stop: stopSanjiSound }] = useSound(sanjiAudio, { loop: false });
  const [playZoroSound, { stop: stopZoroSound }] = useSound(zoroAudio, { loop: false });
  const [playUsoppSound, { stop: stopUsoppSound }] = useSound(usoppAudio, { loop: false });
  const [playBrookSound, { stop: stopBrookSound }] = useSound(brookAudio, { loop: false });

  // Simulate loading process
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 2000); // Adjust the loading duration as needed
  }, []);

  useEffect(() => {
    if (connected) {
      playBgSound();
      checkMinted();
    } else {
      stopBgSound();
    }
  }, [connected]);

  const checkMinted = async () => {
    setLoading(true);
    const bool = await nftcontract.methods.hasMinted(account).call();
    if(bool) {
      setMinted(true);
      fetchURI();
      setShowPersonalityForm(false);
    }
    else {
      setMinted(false);
      setShowPersonalityForm(true); 
    }
    setLoading(false);
  };

  const checkMintedEvent = async (minter) => {
    const query = gql`
      query GetNftMintedEvent($minter: Bytes!) {
        nftMinteds(where: { minter: $minter }) {
          id
          characterId
          minter
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;
  
    const variables = {
      minter: minter,
    };
  
    let timedOut = false;
  
    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      timedOut = true;
      console.log('Timeout occurred after 60 seconds.');
    }, 60000);
  
    const checkEvent = async () => {
      try {
        const result = await client.query({ query, variables });
        const nftMinted = result.data.nftMinteds[0];
        if (nftMinted) {
          console.log('NFT minted successfully');
          clearTimeout(timeout); // Clear the timeout if the minted event is found
          checkMinted();
        } else {
          if (!timedOut) {
            setTimeout(checkEvent, 3000); // Check again after 3 seconds
          }
        }
      } catch (error) {
        console.error("Error occurred while querying the subgraph:", error);
        setLoading(false);
        // Handle the error case, e.g., show an error message to the user
      }
    };
  
    // Start after a 4-second delay
    setTimeout(checkEvent, 4000);
  };
  

  const fetchURI = async () => {
    setLoading(true);
    const tokenID = await nftcontract.methods.userTokenID(account).call();
    const metadataIpfsLink = await nftcontract.methods.tokenURI(tokenID).call();
    const response = await fetch(metadataIpfsLink);
    const metadata = await response.json();
    getCharacter(metadata);
    console.log(metadata.image);
    setTokenURI(metadata.image);
    setLoading(false);
  };
  // Play audio once loaded
  const handleStart = () => {
    setStarted(true);
    setAnswers([]); // Reset the answers array
    console.log('Start Array', JSON.stringify(answers));
    if (connected) {
      checkMinted();
    } else {
      connectWallet();
    }
  };

  const getCharacter = (metadata) => {
    setCharacter(metadata.name);
    if (metadata.name === "Monkey D. Luffy") {
      playLuffySound();
      }
    else if (metadata.name === "Roronoa Zoro") {
      playZoroSound();
    }
    else if (metadata.name === "Sanji") {
      playSanjiSound();
    }
    else if (metadata.name === "Brook") {
      playBrookSound();
    }
    else if (metadata.name === "Usopp") {
      playUsoppSound();
    }
  }


  const handleDisconnect = () => {
    disconnectWallet();
    setStarted(false);
    setLoading(false);
    setTokenURI(false);
  }

  const handleConnect = () => {
    connectWallet();
    setStarted(true);
  };

  const handleAnswerSubmit = (answer) => {
    console.log('Received answer:', answer);
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers, answer];
      console.log('Current Array:', JSON.stringify(newAnswers));
      return newAnswers;
    });
  };


  const handleFormSubmit = async () => {

    await nftcontract.methods
    .requestNFT(answers)
    .send({from: account})
    .on("transactionHash", function (hash) {
        console.log("Transaction sent. Transaction hash:", hash);
        setLoading(true); // Set loading to true before sending the transaction
    })
    .on("receipt", function (receipt) {
        console.log("Transaction successful:", receipt.transactionHash);
        checkMintedEvent(account);
    })
    .on("error", (error) => {
        console.error("Error requesting NFT:", error);
        setLoading(false); // Set loading back to false if there's an error during the transaction
    });

    setShowPersonalityForm(false);
  };


  return (
    <div className="App">
      <div className="top-right-buttons">
        {started ? (
          connected ? (
            <button onClick={handleDisconnect}>Disconnect</button>
          ) : (
            <button onClick={handleConnect}>Connect</button>
          )
        ) : null}
      </div>
      <div className="content-container">
        {loading ? (
          <img src={loadingAnimation} alt="Loading..." />
        ) : (
          <>
            {!started ? (
              <div className="start-container">
                <img className="logo" src={logo} alt="logo" />
                <button className="start-button" onClick={handleStart}>Enter Grand Line</button>
              </div>
            ) : (
              <>
               {Minted ? (
                <div className="character-container">
                <div className="character-image-container">
                  <img className="character-image" src={tokenURI} alt="NFT" />
                </div>
                <h3 className="character-name">{character}</h3>
              </div>
                
              ) : showPersonalityForm ? (
                <PersonalityForm onSubmit={handleAnswerSubmit}  showForm={setShowPersonalityForm} 
                />
              ) : (
                <div className="reveal-personality">
                  <button className="reveal-button" onClick={handleFormSubmit}>
                    Reveal My Pirate Personality
                  </button>
                </div>
              )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;