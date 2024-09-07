"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Game.module.css';  // Import the CSS module
import { FaArrowCircleRight } from "react-icons/fa";
import { TextField, IconButton, InputAdornment, Modal } from '@mui/material';


export default function Game() {
  const [clues, setClues] = useState([]);
  const [cluesUsed, setCluesUsed] = useState(Array(15).fill(false));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [result, setResult] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [guessedWords, setGuessedWords] = useState(Array(8).fill(''));  // Track which words have been guessed
  const [totalCluesUsed, setTotalCluesUsed] = useState(0);  // Track total number of clues used
  const [time, setTime] = useState(0);

  useEffect(() => {
    let timer;
    if (!isGameOver) {
      timer = setInterval(() => setTime((prevTime) => prevTime + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isGameOver]);

  const [activeSegments, setActiveSegments] = useState(Array(8).fill(false));

  useEffect(() => {
    startGame();
  }, []);

  const startGame = async () => {
    const response = await axios.get('/api/start-game');
    setClues(response.data.clues);
    setCurrentWordIndex(0);
    setCurrentClueIndex(0);
    setCurrentGuess('');
    setResult(null);
    setIsGameOver(false);
    setGuessedWords(Array(8).fill(false));  // Reset guessed words for a new game
    setTotalCluesUsed(0);  // Reset total clues used for a new game
    setTime(0);  // Reset the timer for a new game
    setActiveSegments(Array(8).fill(false));
    setCluesUsed(Array(15).fill(false));
  };

  const handleGuess = async () => {
    const currentWord = clues[currentWordIndex].word;
    
    // Normalize both the guess and the correct word
    const normalizedGuess = currentGuess.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const normalizedWord = currentWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  
    const guessResponse = await axios.post('/api/submit-guess', {
      guess: normalizedGuess,
      word: normalizedWord,
    });

    if (guessResponse.data.result === 'correct') {
      setResult('Correct');

      // Light up the corresponding segment
      setActiveSegments((prev) =>
        prev.map((val, i) => (i === currentWordIndex ? true : val))
      );

      const newGuessedWords = [...guessedWords];
      newGuessedWords[currentWordIndex] = currentWord;  // Mark the word as guessed
      setGuessedWords(newGuessedWords);

      setTotalCluesUsed((prev) => prev + 1);  // Increment total clues used

        setCluesUsed((prev) => {
          const updatedCluesUsed = [...prev];
          updatedCluesUsed[totalCluesUsed] = true;  // Mark the clue as used
          return updatedCluesUsed;
        });

      if (currentWordIndex < clues.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setCurrentClueIndex(0);
        setCurrentGuess('');
      } else {
        setIsGameOver(true);
        setResult('You have guessed all the words correctly!');
      }
    } else {
      if (currentClueIndex < clues[currentWordIndex].clues.length - 1) {
        setCurrentClueIndex(currentClueIndex + 1);
        setTotalCluesUsed((prev) => prev + 1);  // Increment total clues used

        setCluesUsed((prev) => {
          const updatedCluesUsed = [...prev];
          updatedCluesUsed[totalCluesUsed] = true;  // Mark the clue as used
          return updatedCluesUsed;
        });

        setResult('Incorrect');
      } else {
        setResult('No more clues available for this word.');
        setIsGameOver(true);
      }
    }
    setCurrentGuess('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isGameOver) {
      handleGuess();  // Trigger the handleGuess function when Enter is pressed
    }
  };

  return (
    <div className={styles.container}>

      {/* Header Section with Title */}
      <div className={styles.header}>
        <h1 className={styles.title}>15 or Less</h1>
      </div>

      {/* Main content container */}
      <div className={styles.mainContentContainer}>

        {/* Gray boxes for words */}
        <div className={styles.boxContainer}>
          <div className={styles.text}>Correct Words:</div>
            {guessedWords.map((guessed, index) => (
              <div
                key={index}
                className={`${styles.guessedBox} ${guessed ? styles.guessedWord : styles.blurred}`}
              >
                {guessed}
              </div>
            ))}
          </div>

        {/* Circle Ring */}
        <div className={styles.circleContainer}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className={`${styles.circleSegment} ${
                activeSegments[index] ? styles.active : ''
              }`}
            ></div>
          ))}

          <div className={styles.gameArea}>
            <div>
              Clue:
            </div>
            <div className={styles.clue}>
              {clues.length > 0 && clues[currentWordIndex]?.clues ? clues[currentWordIndex].clues[currentClueIndex] : 'Loading...'}
            </div>

            <TextField
              label="Enter your guess"
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              onKeyDown={handleKeyPress}
              variant="outlined" // Adjust as necessary
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleGuess} edge="end" disabled={isGameOver}>
                      <FaArrowCircleRight color='black' />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {result && <p className={styles.result}>{result}</p>}
            <button onClick={startGame} disabled={!isGameOver} className={styles.button}>Start New Game</button>
          </div>
          

        </div>
        
        <div className={styles.timerGuessContainer}>
          {/* Timer */}
          <div className={styles.timer}>{Math.floor(time / 60)}:{time % 60 < 10 ? `0${time % 60}` : time % 60}</div>

          {/* Clues Used */}
          <div className={styles.text}>Guesses Remaining:</div>
          <div className={styles.cluesGridContainer}>
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className={`${styles.clueBox} ${cluesUsed[index] ? styles.guessed : styles.blurred}`}
              >
                {index + 1}
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}