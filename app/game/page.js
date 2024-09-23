"use client";

import { useState, useEffect} from 'react';
import axios from 'axios';
import styles from './Game.module.css';  // Import the CSS module
import { SignedIn, SignedOut, SignOutButton, UserButton } from '@clerk/nextjs';
import { useAuth } from '@clerk/clerk-react'
import ShareIcon from '@mui/icons-material/Share';

import { Box, Typography, Stack, Grid} from "@mui/material";

import { FiMenu } from "react-icons/fi";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CloseIcon from '@mui/icons-material/Close';
import { TextField, InputAdornment, Modal, Button } from '@mui/material';
import { Alfa_Slab_One } from "next/font/google";
import useSound from 'use-sound';

const alfaSlabOne = Alfa_Slab_One({
  weight: '400', 
  subsets: ['latin'], 
  display: 'swap',
});

export default function Game() {
  
  const [clues, setClues] = useState([]);
  const [cluesUsed, setCluesUsed] = useState(Array(15).fill(false));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [guessedWords, setGuessedWords] = useState(Array(8).fill(''));  // Track which words have been guessed
  const [totalCluesUsed, setTotalCluesUsed] = useState(0);  // Track total number of clues used
  const [time, setTime] = useState(0);
  const [open, setOpen] = useState(false);
  const [endGameTitle, setEndGameTitle] = useState('')
  const [endGameGuesses, setEndGameGuesses] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [numCorrect, setNumCorrect] = useState(0);
  
  //userdata
  const { userId, isSignedIn } = useAuth();
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastDatePlayed, setLastDatePlayed] = useState('');
  const date = new Date().toLocaleDateString('en-CA');

  const [count, setCount] = useState(15);
  const [shake, setShake] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [win] = useSound('/audio/win.mp3');
  const [lose] = useSound('/audio/lose.mp3');
  const [correct] = useSound('/audio/correct.mp3');
  const [incorrect] = useSound('/audio/incorrect.mp3');
  const [reveal] = useSound('/audio/reveal.mp3')

  //modal clues used
  const [isCluesModalOpen, setIsCluesModalOpen] = useState(false); // New state for clue modal

  const handleOpenCluesModal = () => setIsCluesModalOpen(true);
  const handleCloseCluesModal = () => setIsCluesModalOpen(false);

  const getCluesForDisplay = () => {
    return clues[currentWordIndex]?.clues.slice(0, currentClueIndex + 1) || [];
  };

  const [isClient, setIsClient] = useState(false);
  

  useEffect(() => {
    // Set this state to true once the component has mounted on the client
    setIsClient(true);
  }, []);

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
    if (isSignedIn) {
      createUserData(userId);
      getUserData(userId);
    }
  }, []);

  useEffect(() => {
    const todayDate = new Date().toLocaleDateString('en-CA');
    const savedGameState = JSON.parse(localStorage.getItem('gameState'));

    if (savedGameState && savedGameState.date === todayDate && !savedGameState.isGameOver) {
      setGuessedWords(savedGameState.guessedWords);
      setCurrentWordIndex(savedGameState.currentWordIndex);
      setCurrentClueIndex(savedGameState.currentClueIndex);
      setCurrentGuess(savedGameState.currentGuess);
      setTotalCluesUsed(savedGameState.totalCluesUsed);
      setCount(savedGameState.count);
      setNumCorrect(savedGameState.numCorrect);
      setTime(savedGameState.time);
      setActiveSegments(savedGameState.activeSegments);
      setCluesUsed(savedGameState.cluesUsed);
    } else {
      localStorage.removeItem('gameState');
    }
  }, []);

  // useEffect(() => {
  //   const circle = document.getElementById('circle');
  //   const totalTicks = 8; // Number of ticks you want around the circle
  //   const radius = circle.offsetWidth * 0.48; // Adjust based on your circle size

  //   for (let i = 0; i < totalTicks; i++) {
  //     const tick = document.createElement('div');
  //     tick.classList.add(styles.tick);

  //     // Calculate the angle for each tick
  //     const angle = (360 / totalTicks) * i;

  //     // Position each tick based on its angle
  //     tick.style.position = 'absolute'; // Make sure ticks are positioned relative to the circle
  //     tick.style.transformOrigin = '0 0'; // Set the transform origin for correct positioning
  //     tick.style.transform = `rotate(${angle}deg) translate(${radius}px)`; // Moves ticks outward by the radius

  //     // Append each tick to the circle
  //     circle.appendChild(tick);
  //   }
  // }, []);

  const startGame = async () => {
    const todayDate = new Date().toLocaleDateString('en-CA');
    const savedGameState = JSON.parse(localStorage.getItem('gameState'));
    if (savedGameState && savedGameState.date === todayDate && !savedGameState.isGameOver) {
      if (savedGameState.clues && savedGameState.clues.length > 0) {
        setGuessedWords(savedGameState.guessedWords);
        setCurrentWordIndex(savedGameState.currentWordIndex);
        setCurrentClueIndex(savedGameState.currentClueIndex);
        setCurrentGuess(savedGameState.currentGuess);
        setTotalCluesUsed(savedGameState.totalCluesUsed);
        setCount(savedGameState.count);
        setNumCorrect(savedGameState.numCorrect);
        setTime(savedGameState.time);
        setActiveSegments(savedGameState.activeSegments);
        setCluesUsed(savedGameState.cluesUsed);
        setClues(savedGameState.clues)
        return;
      } else {
        console.error("No clues available in the saved game state.");
      }
    } else {
      localStorage.removeItem('gameState');
    }

    // For signed-in users
    if (isSignedIn) {
      try {
        const response = await axios.post('/api/check-last-played', { userId: userId });
        if (response.data.playable) {
          setIsGameOver(false);
        } else {
          setIsGameOver(true);
          setOpen(true);
          return;
        }
      } catch (error) {
        console.error("Error checking last played date for signed-in user:", error);
      }
    } else {
      // For anonymous users
      const lastDatePlayed = localStorage.getItem('lastDatePlayed');
      if (lastDatePlayed === date) {
        setIsGameOver(true);
        return;
      }
    }

    const response = await axios.get('/api/start-game');
    setClues(response.data.clues);
    setCurrentWordIndex(0);
    setCurrentClueIndex(0);
    setCurrentGuess('');
    setIsGameOver(false);
    setGuessedWords(Array(8).fill(''));  // Reset guessed words for a new game
    setTotalCluesUsed(0);  // Reset total clues used for a new game
    setTime(0);  // Reset the timer for a new game
    setActiveSegments(Array(8).fill(false));
    setCluesUsed(Array(15).fill(false));
    setEndGameTitle(''); // Set Endgame Title based on win or loss
    setEndGameGuesses('');  // Set Endgame guesses based on win or loss
    setActiveSegments(Array(8).fill(false));  // Reset circle segments
    setCluesUsed(Array(15).fill(false)); // Reset clue grid container
    setCount(15); // Reset clue countdown 
    setNumCorrect(0);
    setLastDatePlayed(date);

    saveGameState(); // save initial game state
  };

  const getUserData = async (u) => {
    if (!userId) return;  // Ensure userId is available
    try {
      const response = await axios.get("/api/get-user-data", {
        params: {
          user: u
        }
      });

      const responseData = response.data.data

      setCurrentStreak(responseData.currentStreak)
      setLastDatePlayed(responseData.lastDatePlayed)
      setGamesPlayed(responseData.gamesPlayed)
      setGamesWon(responseData.gamesWon)
      
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        return new Response(JSON.stringify({ error: error.response }), { status: 500 });
      } else {
        console.log("Error retrieving user data");
      }
    }
  }

  const createUserData = async (userId) => {
    if (!userId) return;  // Ensure userId is available
    try {
      const response = await axios.post('/api/create-user-data', {
        user: userId,
      });

      return new Response(JSON.stringify({success: true, message: "Successfully updated user data"  }), { status: 200 });
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error("Error submitting data:", error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
      } else {
        // Something else caused an error
        console.error("Error:", error.message);
      }
    }
  };

  const updateUserData = async (userId, gamesPlayed, gamesWon, currentStreak, lastDatePlayed) => {
    if (!userId) return;  // Ensure userId is available
    try {

      const response = await axios.post('/api/update-user-data', {
          userId,
          gamesPlayed,
          gamesWon,
          currentStreak,
          lastDatePlayed,
      });

      return new Response(JSON.stringify({success: true, message: "Successfully updated user data"  }), { status: 200 });
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error("Error submitting data:", error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
      } else {
        // Something else caused an error
        console.error("Error:", error.message);
      }
    }
  };

  // Inside your Game component

const saveGameState = () => {
  const gameState = {
    guessedWords,
    currentWordIndex,
    currentClueIndex,
    currentGuess,
    totalCluesUsed,
    count,
    numCorrect,
    time,
    activeSegments,
    cluesUsed,
    clues,
    date: new Date().toLocaleDateString('en-CA'), // Add this line
    isGameOver,
  };
  localStorage.setItem('gameState', JSON.stringify(gameState));
};


  const handleGuess = async () => {
    // Check if the text field is empty
    if (currentGuess.trim() === '') {
      // Optionally set an error message or highlight the text field
      setIsError(true);
      setTimeout(() => {
        setIsError(false); // Hide error after a short time
      }, 800);
      setShake(true);
        setTimeout(() => {
          setShake(false);  // Stop shaking after animation
        }, 500);  // Shake duration (match CSS animation)
      return; // Exit the function early if no input
    }

    const currentWord = clues[currentWordIndex]?.word;
    if (!currentWord) {
      console.error("No current word available");
      return;
    }

    setTotalCluesUsed((prev) => prev + 1);  // Increment total clues used

    setCluesUsed((prev) => {
      const updatedCluesUsed = [...prev];
      updatedCluesUsed[totalCluesUsed] = true;  // Mark the clue as used
      return updatedCluesUsed;
    });

    // decrement 15
    setCount((prev) => prev - 1);
    
    // Normalize both the guess and the correct word
    const normalizedGuess = currentGuess.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const normalizedWord = currentWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  
    const guessResponse = await axios.post('/api/submit-guess', {
      guess: normalizedGuess,
      word: normalizedWord,
    });

    if (guessResponse.data.result === 'correct') {
      setShake(false);
      setIsError(false);
      setIsCorrect(true);
      setNumCorrect((prev) => prev + 1)

      setTimeout(() => {
        setIsCorrect(false);
      }, 800)

      // Light up the corresponding segment
      setActiveSegments((prev) =>
        prev.map((val, i) => (i === currentWordIndex ? true : val))
      );

      const newGuessedWords = [...guessedWords];
      newGuessedWords[currentWordIndex] = currentWord;  // Mark the word as guessed
      setGuessedWords(newGuessedWords);

      // Edge cases
      if (totalCluesUsed >= 14 && numCorrect >= 7) {
        setIsGameOver(true);
        setTimeout(() => endGame(true), 2000);
      } else if (totalCluesUsed >= 14 && numCorrect < 7) {
        // Checks if last guess is correct but user still loses
        correct() // Play correct sound
        setTimeout(() => endGame(false, true), 2000);
      }
      
      if (currentWordIndex < clues.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setCurrentClueIndex(0);
        setCurrentGuess('');
        if (!isGameOver && totalCluesUsed < 14) {
          correct() // Play correct sound
        }
      } else {
        // User wins
        setIsGameOver(true);
        setTimeout(() => endGame(true), 2000);
      }
    } else {
      if (currentClueIndex < clues[currentWordIndex].clues.length - 1) {
        setCurrentClueIndex(currentClueIndex + 1); // Indexes to next clue for word

        // Edge cases
        if (totalCluesUsed >= 14 && numCorrect >= 7) {
          setTimeout(endGame, 2000);
        }
        if (count <= 1) {
          setTimeout(endGame, 2000);
        }
        
        setIsError(true);
        setTimeout(() => {
          setIsError(false);
        }, 800)

        setShake(true);
        setTimeout(() => {
          setShake(false);  // Stop shaking after animation
        }, 500);  // Shake duration (match CSS animation)

        if (!isGameOver) {
          incorrect() // Play incorrect sound
        }
        
      } else {
        // User loses
        setTimeout(endGame, 2000);
      }
    }
    setCurrentGuess('');

    saveGameState();

  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGuess();  // Trigger the handleGuess function when Enter is pressed
    } 
  };

  const endGame = async (isWon = false, first = false) => {
    // End game message and sound
    if (isWon) {
      setEndGameTitle('You got 15 or less!')
      if ((14 - totalCluesUsed) === 0) {
        setEndGameGuesses('Phew! All guesses used')
      } else {
        setEndGameGuesses(`${14 - totalCluesUsed} guesses remaining`)
      }
      handleOpen()
      win() // Play win sound
    } else {
      setEndGameTitle('Next time!')
      setEndGameGuesses(`Ran out of guesses`)

      // Sequentially reveal remaining words one by one using recursive setTimeout
      const revealWords = (index) => {
        if (index >= clues.length) {
          handleOpen();
          lose();
          return; // Stop when all words are revealed
        }

        setGuessedWords((prevGuessedWords) =>
            prevGuessedWords.map((word, i) =>
                i === index && !word ? clues[i].word : word
            )
        );
        reveal() // audio

        // Call revealWords again after a delay to reveal the next word
        setTimeout(() => {
            revealWords(index + 1);
        }, 1000); // Adjust delay (1000ms = 1 second)
      };

      if (first) {
        revealWords(currentWordIndex + 1)
      } else {
        revealWords(currentWordIndex)
      }

    }

    setIsGameOver(true);
    const todayDate = new Date().toLocaleDateString('en-CA');
    setLastDatePlayed(todayDate);
    localStorage.setItem('lastDatePlayed', todayDate);

    // Increment user's total games played
    setGamesPlayed((prevGamesPlayed) => prevGamesPlayed + 1)
    
    // Increment user's total wins
    if (isWon) {
      setGamesWon((prevGamesWon) => prevGamesWon + 1)
    }

    //update last date played
    console.log(lastDatePlayed)


    //validate for streak here
    // if {
    // }
    // else {

    // }
    localStorage.removeItem('gameState'); // Instead of removing gameState at endGame, we remove at new day local to player
    return;
  }

  // update data for user after every game played
  if (isGameOver && isSignedIn) {
    updateUserData(userId, gamesPlayed, gamesWon, currentStreak, lastDatePlayed)
  }

  // for end game modal
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  }

  const handleHelpOpen = () => { setIsHelpOpen(true) }
  const handleHelpClose = () => { setIsHelpOpen(false) }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);  // Toggle sidebar visibility
  };

  const toggleSidebarMain = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }

  return (
    
    <div className={styles.container}>
      {/* Header Section with Title */}
      <div className={styles.header} onClick={toggleSidebarMain}>
        <div className={styles.menu} onClick={toggleSidebar}> <FiMenu /> </div>
        <h1 className={styles.title}>{count} or Less</h1>
      </div>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <Button onClick={toggleSidebar} sx={{ 
            fontSize: '2rem',
            color: 'black', 
            "&:hover": { backgroundColor: 'transparent' },
            }}
            >
              <CloseIcon fontSize='20px' />
          </Button>
          <h3>Menu</h3>
        </div>
        <div className={styles.sidebarContent}>
          <div className={styles.content} onClick={handleOpen}>
            <LeaderboardIcon sx={{
              fontSize: '1.8rem',
            }} />
            Stats
          </div>

          <div className={styles.content} onClick={handleHelpOpen}>
            <HelpOutlineIcon sx={{
              fontSize: '1.8rem',
            }} />
            How to Play
          </div>

          <div className={styles.profile}>
            <SignedIn>
              <span className={styles.userButton}>
                Profile: <UserButton appearance={
                  {
                    elements: {
                      userButtonAvatarBox: {
                        width: 45,
                        height: 45,
                      },
                    }
                  }
                } />
              </span>
            </SignedIn>
            <SignedOut>
              <Button
                href="/sign-in"
                variant="contained" 
                disableRipple
                sx={{
                  mt: '1.5rem',
                  py: 0.8,
                  width: '80%',
                  fontSize: { xs: '16px', sm: '20px' },
                  color: 'black',
                  background: '#C4C9C1', 
                  border: '3px solid black',
                  borderRadius: 1,
                  cursor: 'pointer',
                  textTransform: 'none',
                  boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                  '&:hover': {
                    boxShadow: '7px 7px 0px 0px rgba(0, 0, 0, 1)',
                  }, 
                  '&:active': {
                    boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
                  }, 
                  fontFamily: alfaSlabOne.style.fontFamily,
                }}
              >
                Log In
              </Button>
              
            </SignedOut>

            <SignedIn>
              <SignOutButton>
                <Button
                  variant="contained" 
                  disableRipple
                  sx={{
                    py: 0.8,
                    width: '80%',
                    fontSize: { xs: '16px', sm: '20px' },
                    color: 'black',
                    background: '#C4C9C1', 
                    border: '3px solid black',
                    borderRadius: 1,
                    cursor: 'pointer',
                    textTransform: 'none',
                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                    '&:hover': {
                      boxShadow: '7px 7px 0px 0px rgba(0, 0, 0, 1)',
                    }, 
                    '&:active': {
                      boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
                    }, 
                    fontFamily: alfaSlabOne.style.fontFamily,
                  }}
                >
                  Sign Out
                </Button>
              </SignOutButton>
            </SignedIn>
          </div>

        </div>
      </div>

      {/* Main content container */}
      <div className={styles.mainContentContainer} onClick={toggleSidebarMain}>

        {/* Gray boxes for words */}
        <div className={styles.boxContainer}>
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
        <div className={styles.circleContainer} id='circle'>
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


            {/* Clue Modal */}
            <Button onClick={handleOpenCluesModal}
            variant="contained" 
            disableRipple
            sx={{
              p: 0.6,
              my: 1,
              width: '30%',
              fontSize: { xs: '12px', md: '14px', lg: '16px' },
              color: 'black',
              background: '#C4C9C1', 
              border: '3px solid black',
              borderRadius: 1,
              cursor: 'pointer',
              textTransform: 'none',
              boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
              '&:hover': {
                boxShadow: '7px 7px 0px 0px rgba(0, 0, 0, 1)',
              }, 
              '&:active': {
                boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
              }, 
              fontFamily: alfaSlabOne.style.fontFamily,
            }}>
              Clue Bank
            </Button>
            <Modal
              open={isCluesModalOpen}
              onClose={handleCloseCluesModal}
              aria-labelledby="clue-modal-title"
              aria-describedby="clue-modal-description"
            >
              <Box 
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              alignItems="center"
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                bgcolor: 'background.paper', 
                border: "3px solid black",
                boxShadow: '2px 2px 2px 1px rgba(0, 0, 0, 1)',
                borderRadius: 1,
                width: '400px',
                maxWidth: '90%',
                height: '500px',

                
              }}>
                <Box sx={{ p: 1.2,bgcolor: '#909D89', borderBottom: '4px solid black', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography id="clue-modal-title" variant="h6" height='auto' sx={{fontFamily: alfaSlabOne.style.fontFamily}}>
                    Clues:
                  </Typography>
                </Box>

                <Box overflow='scroll' width='100%' height='100%' sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                <Grid container pl={6} pr={6} pt={3} pb={3} gap={2} >
                  {getCluesForDisplay().map((clue, index) => (
                    <Grid item xs={12} key={index} >
                      {clue && (
                      <Box sx={{ 
                        p: 1, 
                        bgcolor: '#BCD4B4',
                        height: '50px',  
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        border: `3px solid ${clue ? 'black' : '#999999'}`,
                        boxShadow: clue 
                          ? '2px 2px 2px 1px rgba(0, 0, 0, 1)' // Dark shadow if clue exists
                          : '2px 2px 2px 1px rgba(153, 153, 153, 1)',
                        borderRadius: 1,
                        overflow: 'hidden' 
                      }}>
                        {clue || ' '}
                      </Box>
                      )}
                    </Grid>
                  ))}
                </Grid>
                </Box>

                <Box sx={{ width: '100%', borderTop: '4px solid black', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#909D89', p: 1.2 }}>
                  <Button onClick={handleCloseCluesModal}
                  variant="contained" 
                  disableRipple
                  sx={{
                    py: 0.8,
                    width: '80%',
                    fontSize: { xs: '12px', sm: '14px', md: '16px' },
                    color: 'black',
                    background: '#C4C9C1', 
                    border: '3px solid black',
                    borderRadius: 1,
                    cursor: 'pointer',
                    textTransform: 'none',
                    boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)',
                    '&:hover': {
                      boxShadow: '4.5px 4.5px 0px 0px rgba(0, 0, 0, 1)',
                    }, 
                    '&:active': {
                      boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
                    }, 
                    fontFamily: alfaSlabOne.style.fontFamily,

                  }}>
                    Close
                  </Button>
                </Box>

              </Box>
            </Modal>


            {/* Length of word */}
            <div className={styles.underscoresContainer}>
              {clues.length > 0 &&
                clues[currentWordIndex]?.word
                  .split('')
                  .map((letter, index) => (
                    <span key={index} className={styles.underscore}>
                      _
                    </span>
                  ))}
                <span>{clues[currentWordIndex]?.word.length}</span>
            </div>


            <TextField
              className={`${styles.textField} ${shake ? styles.shake : ''}`}
              error={isError} // Set error state for incorrect guesses
              label="Guess"
              color={isCorrect ? 'success' : 'primary'}
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              onKeyDown={handleKeyPress}
              variant="outlined" // Adjust as necessary
              disabled={totalCluesUsed > 14 || isGameOver} // Disable the input field when the game is over
              inputProps={{ maxLength: 20 }} // Set the maximum length of the input field 
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <span style={{ color: 'black' }}>{currentGuess.length}</span>
                  </InputAdornment>
                ),
              }}
            />

          </div>
          

        </div>
        
        <div className={styles.timerGuessContainer}>
          {/* Clues Used Desktop */}
          <div className={styles.text}>Guesses Used:</div>
          <div className={styles.cluesGridContainer}>
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className={`${styles.clueBox} ${cluesUsed[index] ? styles.blurred : styles.guessed}`}
              >
                {index + 1}
              </div>
            ))}
          </div>

        </div>

      {/* Endgame Modal Win */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="how-to-play-title"
        aria-describedby="how-to-play-description"
        sx = {{ 
          background: numCorrect > 7 ? 'url(/confetti.gif)' : 'url(/bg-image.png)',
        }}
       >
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width="90%"
            height="90%"
            maxWidth="1000px"
            maxHeight="600px"
            bgcolor="white"
            boxShadow="5px 5px 0px 0px rgba(0, 0, 0, 1)"
            p={3}
            sx={{
              transform: "translate(-50%, -50%)", 
              border: "3px solid black",
              outline: "none",
              borderRadius: 1,
            }}
          >
            <Typography variant="h2" component="h2" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center' }}>
              {endGameTitle}
            </Typography>

            <Stack direction="row" spacing={25} sx = {{ pt: 10, justifyContent: 'center'}}>
                <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                  {`${numCorrect} out of 8`} <br />  {`words correct!`}
                  </Typography>
                

                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    {endGameGuesses}
                  </Typography>

                  
                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    <span className={styles.timeEndGame}>Time: </span>{Math.floor(time / 60)}:{time % 60 < 10 ? `0${time % 60}` : time % 60}
                  </Typography>
            </Stack>

            <Stack direction="row" spacing={15} sx = {{ pt: 10, textAlign: 'center', justifyContent: 'center'}}>
                <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                  Games Completed: {gamesPlayed}
                  </Typography>
                

                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    Win %: {Math.round((gamesWon / gamesPlayed) * 100)}
                  </Typography>

                  
                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    Current Streak
                  </Typography>

                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    Max Streak
                  </Typography>
            </Stack>



            <Stack direction = 'row' spacing = {2} sx = {{ pt: 8, pl: 25, pr: 25, textAlign: 'center', justifyContent: 'center'}}>
              <Button variant="contained" onClick = {handleClose}
                disableRipple
              sx={{
                py: 1.5,
                width: '80%',
                fontSize: { xs: '16px', sm: '20px' },
                color: 'black',
                background: 'white', 
                border: '3px solid black',
                borderRadius: 50,
                cursor: 'pointer',
                textTransform: 'none',
                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                '&:hover': {
                  boxShadow: '7px 7px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                '&:active': {
                  boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                fontFamily: alfaSlabOne.style.fontFamily,
              }}>
                Back to Puzzle
              </Button>
              <Button variant="contained" 
              disableRipple
              sx={{
                py: 1.5,
                gap: 1,
                width: '80%',
                fontSize: { xs: '16px', sm: '20px' },
                color: 'black',
                background: '#BDD2B6', 
                border: '3px solid black',
                borderRadius: 50,
                cursor: 'pointer',
                textTransform: 'none',
                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                '&:hover': {
                  boxShadow: '7px 7px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                '&:active': {
                  boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                fontFamily: alfaSlabOne.style.fontFamily,
              }}>
                Share <ShareIcon />
              </Button>
            </Stack>

          </Box>
        </Modal>
        
        {/* How to Play Modal */}
        <Modal
          open={isHelpOpen}
          onClose={handleHelpClose}
          aria-labelledby="how-to-play-title"
          aria-describedby="how-to-play-description"
        >
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width="90%"
            height="90%"
            maxWidth="500px"
            maxHeight="800px"
            bgcolor="white"
            boxShadow="5px 5px 0px 0px rgba(0, 0, 0, 1)"
            p={3}
            overflow={isClient && window.innerHeight < 800 ? 'scroll' : 'hidden'}
            sx={{
              transform: "translate(-50%, -50%)", 
              border: "3px solid black",
              outline: "none",
              borderRadius: 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography id="how-to-play-title" variant="h5" component="h2" sx={{ fontFamily: alfaSlabOne.style.fontFamily }}>
                How to Play
              </Typography>
              <Button onClick={handleHelpClose} color="black" sx={{ position: 'absolute', top: '16px', right: '0' }}>
                <CloseIcon />
              </Button>
            </div>

            <Typography id="how-to-play-description" variant="h6" sx={{ mt: 1 }}>
              Guess all <span style={{fontWeight: 'bold'}}>8 words</span> within <span style={{ fontWeight: 'bold' }}>15 tries or less</span>.
            </Typography>
            
            <div style={{ marginTop: 1, marginBottom: 6, paddingLeft: 24, fontFamily: "'Roboto', sans-serif", fontSize: '18px', lineHeight: '1.4' }}>
              <ul>
                <li>Each guess must be singular.</li>
                <li>Every wrong guess will provide you with another clue.</li>
                <li>Make connections with the clues given to you for your guesses.</li>
              </ul>
            </div>
            
            <Typography sx={{ fontFamily: alfaSlabOne.style.fontFamily, mb: 1 }}>
              Example:
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', mb: 4}}>
              <Box
                component="img"
                sx={{
                  width: "100%",
                  height: "auto",
                  objectFit: "cover"
                }}
                alt="Circle component from Game"
                src="/gameExample.gif"
              />
            </Box>

            <Typography>
              A new puzzle will be released daily after midnight.
            </Typography>
          </Box>
        </Modal>

        </div>
    </div>
  );
}
