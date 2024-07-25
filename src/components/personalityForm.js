import React, { useState } from "react";
import '../form.css'

export const PersonalityForm = ({ onSubmit, onFormSubmit, showForm }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const questions = [
    {
      question: "What's your role on the ship?",
      options: [
        "Navigator - Guiding the crew through treacherous waters",
        "Cook - Keeping the crew well-fed and energized",
        "Doctor - Tending to the crew's injuries and ailments",
        "Shipwright - Maintaining and repairing the ship",
        "Musician - Lifting the crew's spirits with lively tunes",
      ],
    },
    {
      question: "How do you handle a tough battle?",
      options: [
        "Strategize like Nami - Plan meticulously and outsmart the enemy",
        "Fight like Zoro - Rely on raw strength and swordsmanship",
        "Support like Chopper - Provide medical aid and assist the crew",
        "Invent like Usopp - Use clever gadgets and trickery",
        "Inspire like Luffy - Never give up and rally the crew's spirit",
      ],
    },
    {
      question: "What's your ultimate dream?",
      options: [
        "Discover the All Blue - The legendary sea of diverse fish",
        "Become the World's Greatest Swordsman",
        "Find the cure for all diseases",
        "Build a ship that can sail to the end of the Grand Line",
        "Bring joy and laughter to people through music",
      ],
    },
    {
      question: "How do you bond with your crewmates?",
      options: [
        "Cooking delicious meals together",
        "Training and sparring to become stronger",
        "Sharing stories and laughter around the campfire",
        "Working together to maintain and improve the ship",
        "Jamming and creating music to lift everyone's spirits",
      ],
    },
    {
      question: "When faced with a powerful enemy, you...",
      options: [
        "Analyze their weaknesses and exploit them",
        "Charge head-on with unwavering determination",
        "Provide support and ensure the crew's safety",
        "Use unconventional tactics to catch them off guard",
        "Believe in the power of friendship and teamwork",
      ],
    },
  ];

  const handleNextQuestion = () => {
    if (selectedOption !== null) {
      onSubmit(selectedOption + 1); // Submit the selected option
      setSelectedOption(null); // Reset selected option for the current question
      if (questionIndex === questions.length - 1) {
        showForm(false);
      } else {
        setQuestionIndex(questionIndex + 1); // Move to the next question
      }
    }
  };

  const handleOptionSelect = (index) => {
    setSelectedOption(index);
  };

  return (
    <div className="personality-form">
      <h3>{questions[questionIndex].question}</h3>
      <ul>
        {questions[questionIndex].options.map((option, index) => (
          <li key={index}>
            <button
              className={`option-button ${selectedOption === index ? "selected" : ""}`}
              onClick={() => handleOptionSelect(index)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
      <button className="next-button" onClick={handleNextQuestion}>
        {questionIndex === questions.length - 1 ? "Submit" : "Next Question"}
      </button>
    </div>
  );
};
