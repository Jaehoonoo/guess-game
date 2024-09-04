"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Game.module.css';  // Import the CSS module
import { FaArrowCircleRight } from "react-icons/fa";
import { TextField, IconButton, InputAdornment } from '@mui/material';


export default function Game() {
  const [clues, setClues] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [result, setResult] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [guessedWords, setGuessedWords] = useState(Array(8).fill(false));  // Track which words have been guessed
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
    // Example: Activating segments one by one with a delay
    activeSegments.forEach((segment, index) => {
      setTimeout(() => {
        setActiveSegments((prev) =>
          prev.map((val, i) => (i === index ? true : val))
        );
      }, (index + 1) * 1000);
    });
  }, [activeSegments]);

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
      const newGuessedWords = [...guessedWords];
      newGuessedWords[currentWordIndex] = true;  // Mark the word as guessed
      setGuessedWords(newGuessedWords);

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
        setTotalCluesUsed(totalCluesUsed + 1);  // Increment total clues used
        setResult('Incorrect');
      } else {
        setResult('No more clues available for this word.');
        setIsGameOver(true);
      }
    }
    setTotalCluesUsed(totalCluesUsed + 1);  // Increment total clues used for every guess
    setCurrentGuess('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isGameOver) {
      handleGuess();  // Trigger the handleGuess function when Enter is pressed
    }
  };

  return (
    <div className={styles.container}>
      {/* Timer */}
      <div className={styles.timer}>Time: {Math.floor(time / 60)}:{time % 60 < 10 ? `0${time % 60}` : time % 60}</div>
      <h1 className={styles.title}>15 or Less</h1>

      {/* Border to be lit up */}
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
          <div>
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
        </div>

      </div>

      {/* Gray boxes for words */}
      <div className={styles.boxContainer}>
        {guessedWords.map((guessed, index) => (
          <div
            key={index}
            className={`${styles.box} ${guessed ? styles.guessed : ''}`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Move result under the grey boxes */}
      {result && <p className={styles.result}>{result}</p>}

      <p className={styles.cluesUsed}>Clues Used: {totalCluesUsed} / 15</p>
      <button onClick={startGame} disabled={!isGameOver} className={styles.button}>Start New Game</button>
    </div>
  );
}