"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Game.module.css';  
import { FaArrowCircleRight } from "react-icons/fa";
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { useUser } from "@clerk/nextjs";  // Clerk integration

export default function Game() {
  const { user } = useUser();  // Clerk user
  const [clues, setClues] = useState([]);
  const [cluesUsed, setCluesUsed] = useState(Array(15).fill(false));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [result, setResult] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [guessedWords, setGuessedWords] = useState(Array(8).fill(''));
  const [totalCluesUsed, setTotalCluesUsed] = useState(0);
  const [time, setTime] = useState(0);
  const [gamePlayable, setGamePlayable] = useState(true);
  const [activeSegments, setActiveSegments] = useState(Array(8).fill(false));

  useEffect(() => {
    if (user) {
      checkIfUserCanPlay();
    }
  }, [user]);

  useEffect(() => {
    let timer;
    if (!isGameOver && gamePlayable) {
      timer = setInterval(() => setTime((prevTime) => prevTime + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isGameOver, gamePlayable]);

  const checkIfUserCanPlay = async () => {
    try {
      const response = await axios.post('/api/check-user-play', { userId: user.id });
      if (!response.data.playable) {
        setGamePlayable(false);
      }
    } catch (error) {
      console.error("Error checking last played date:", error);
    }
  };

  const startGame = async () => {
    try {
      const response = await axios.get('/api/start-game');

      if (response.data && response.data.clues && response.data.clues.length > 0) {
        setClues(response.data.clues); // Set clues if available
        setCurrentWordIndex(0);
        setCurrentClueIndex(0);
        setCurrentGuess('');
        setResult(null);
        setIsGameOver(false);
        setGuessedWords(Array(8).fill(''));
        setTotalCluesUsed(0);
        setTime(0);
        setCluesUsed(Array(15).fill(false));
        setGamePlayable(true);  // Allow game play after a new word set is fetched
      } else {
        console.error("No clues found in the response");
      }
    } catch (error) {
      console.error("Error fetching word set:", error);
    }
  };

  const saveLastPlayedDate = async () => {
    try {
      await axios.post('/api/save-last-played', { userId: user.id });
    } catch (error) {
      console.error("Error saving last played date:", error);
    }
  };

  const handleGuess = async () => {
    const currentWord = clues[currentWordIndex].word;
    const normalizedGuess = currentGuess.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const normalizedWord = currentWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  
    const guessResponse = await axios.post('/api/submit-guess', {
      guess: normalizedGuess,
      word: normalizedWord,
    });

    if (guessResponse.data.result === 'correct') {
      setResult('Correct');
      const newGuessedWords = [...guessedWords];
      newGuessedWords[currentWordIndex] = currentWord;
      setGuessedWords(newGuessedWords);

      setTotalCluesUsed((prev) => prev + 1);

      if (currentWordIndex < clues.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setCurrentClueIndex(0);
        setCurrentGuess('');
      } else {
        setIsGameOver(true);
        setResult('You have guessed all the words correctly!');
        await saveLastPlayedDate();
        setGamePlayable(false);
      }
    } else {
      if (currentClueIndex < clues[currentWordIndex].clues.length - 1) {
        setCurrentClueIndex(currentClueIndex + 1);
        setTotalCluesUsed((prev) => prev + 1);
        setResult('Incorrect');
      } else {
        setResult('No more clues available for this word.');
        setIsGameOver(true);
        await saveLastPlayedDate();
        setGamePlayable(false);
      }
    }
    setCurrentGuess('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isGameOver && gamePlayable) {
      handleGuess();
    }
  };

  if (!gamePlayable) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>15 or Less</h1>
        <p>You have already played today. Please come back tomorrow!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>15 or Less</h1>
      </div>

      <div className={styles.mainContentContainer}>
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
            <div>Clue:</div>
            <div className={styles.clue}>
              {clues.length > 0 && clues[currentWordIndex]?.clues ? clues[currentWordIndex.clues[currentClueIndex]] : 'Loading...'}
            </div>

            <TextField
              label="Enter your guess"
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              onKeyDown={handleKeyPress}
              variant="outlined"
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
          <div className={styles.timer}>{Math.floor(time / 60)}:{time % 60 < 10 ? `0${time % 60}` : time % 60}</div>
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
