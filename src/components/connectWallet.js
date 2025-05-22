import React, { useEffect, useState, createContext, useContext } from 'react';
import Web3 from 'web3';
import nftABI from '../contract/OnePieceMint.json';

// Create a context for Web3
const Web3Context = createContext();

// Custom hook to use the Web3 context
export const useWeb3 = () => useContext(Web3Context);

export function ConnectWallet({ children }) {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);
  const [nftcontract, setNftcontract] = useState(null);

  const nftContractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

  useEffect(() => {
    async function loadWeb3() {
      console.log("Loading Web3...");
      if (window.ethereum) {
        const provider = window.ethereum.providers
          ? window.ethereum.providers.find((p) => p.isMetaMask) || window.ethereum
          : window.ethereum;

        if (!provider.isMetaMask) {
          console.warn("MetaMask is required.");
          return;
        }

        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        console.log("Web3 loaded:", web3Instance);
      } else {
        console.warn("MetaMask not detected.");
      }
    }
    loadWeb3();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAccount = localStorage.getItem("account");
      if (storedAccount) {
        setAccount(storedAccount);
        setConnected(true);
        console.log("Stored account found:", storedAccount);
      }
    }
  }, []);

  const switchToCoreTestnet = async () => {
    try {
      console.log("Switching to Core Testnet...");
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x45b" }], // Core Testnet chain ID
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x45b",
                chainName: "Core Blockchain Testnet",
                rpcUrls: ["https://rpc.testnet.coredao.org"],
                blockExplorerUrls: ["https://scan.testnet.coredao.org"],
                nativeCurrency: {
                  name: "Core Testnet",
                  symbol: "tCORE",
                  decimals: 18,
                },
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Core Testnet:", addError);
          return false;
        }
      } else {
        console.error("Error switching to Core Testnet:", error);
        return false;
      }
    }
  };

  const connectWallet = async () => {
    try {
      console.log("Connecting wallet...");
      if (!window.ethereum) {
        alert("MetaMask is required.");
        return;
      }

      const provider = window.ethereum.providers
        ? window.ethereum.providers.find((p) => p.isMetaMask) || window.ethereum
        : window.ethereum;

      if (!provider.isMetaMask) {
        alert("MetaMask is required. Please disable other wallets.");
        return;
      }

      await provider.request({ method: "eth_requestAccounts" });

      setTimeout(async () => {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        if (!accounts.length) {
          alert("No account found.");
          return;
        }

        const currentChainId = await provider.request({
          method: "eth_chainId",
        });

        if (currentChainId !== "0x45b") {
          const switched = await switchToCoreTestnet();
          if (!switched) {
            alert("Please switch to Core Testnet (0x45b).");
            return;
          }
        }

        const instance = new web3Instance.eth.Contract(nftABI.abi, nftContractAddress);
        setNftcontract(instance);
        setAccount(accounts[0]);
        setConnected(true);
        localStorage.setItem("account", accounts[0]);

        console.log("Wallet Connected:", accounts[0]);
        console.log("Contract Instance:", instance);
      }, 1000);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setConnected(false);
    setNftcontract(null);
    localStorage.removeItem("account");
  };

  return (
    <Web3Context.Provider
      value={{ web3, account, disconnectWallet, connectWallet, connected, nftcontract }}
    >
      <div>
        {children}
      </div>
    </Web3Context.Provider>
  );
}
