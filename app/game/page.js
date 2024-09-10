"use client";

import { useState, useEffect} from 'react';
import axios from 'axios';
import styles from './Game.module.css';  // Import the CSS module
import { SignedIn, SignedOut, SignOutButton, UserButton, UserProfile, useUser } from '@clerk/nextjs';
import ShareIcon from '@mui/icons-material/Share';

import { Box, Typography, Stack, List, ListItem, Grid, Paper} from "@mui/material";
import { useRouter } from 'next/navigation';

import { FiMenu } from "react-icons/fi";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CloseIcon from '@mui/icons-material/Close';
import { TextField, IconButton, InputAdornment, Modal, Button } from '@mui/material';
import { Alfa_Slab_One } from "next/font/google";
import useSound from 'use-sound';
import { BorderTop } from '@mui/icons-material';

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
  const [result, setResult] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [guessedWords, setGuessedWords] = useState(Array(8).fill(''));  // Track which words have been guessed
  const [totalCluesUsed, setTotalCluesUsed] = useState(0);  // Track total number of clues used
  const [time, setTime] = useState(0);
  const [open, setOpen] = useState(false);
  const [endGameTitle, setEndGameTitle] = useState('')
  const [endGameGuesses, setEndGameGuesses] = useState('')
  const router = useRouter(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  //userdata
  const [userId, setUserId] = useState('irfan@gmail.com');
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastDatePlayed, setLastDatePlayed] = useState('');

  const [count, setCount] = useState(15);
  const [shake, setShake] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [anchorEl, setAnchorEl] = useState(null);
  
  //const { isSignedIn } = useUser();

  const [win] = useSound('/audio/win.mp3');
  const [lose] = useSound('/audio/lose.mp3');
  const [correct] = useSound('/audio/correct.mp3');
  const [incorrect] = useSound('/audio/incorrect.mp3');

  //modal clues used
  const [isCluesModalOpen, setIsCluesModalOpen] = useState(false); // New state for clue modal

  const handleOpenCluesModal = () => setIsCluesModalOpen(true);
  const handleCloseCluesModal = () => setIsCluesModalOpen(false);

  const getCluesForDisplay = () => {
    return clues[currentWordIndex]?.clues.slice(0, currentClueIndex + 1) || [];
    return usedClues.concat(Array(15 - usedClues.length).fill(''));
  };


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
    createUserData(userId)
    getUserData(userId)
  }, []);

  useEffect(() => {
    const circle = document.getElementById('circle');
    const totalTicks = 8; // Number of ticks you want around the circle
    const radius = circle.offsetWidth * 0.48; // Adjust based on your circle size

    for (let i = 0; i < totalTicks; i++) {
      const tick = document.createElement('div');
      tick.classList.add(styles.tick);

      // Calculate the angle for each tick
      const angle = (360 / totalTicks) * i;

      // Position each tick based on its angle
      tick.style.transform = `rotate(${angle}deg) translate(${radius}px)`; // Moves ticks outward by the radius

      // Append each tick to the circle
      circle.appendChild(tick);
    }
  }, []);

  const startGame = async () => {
    const response = await axios.get('/api/start-game');
    setClues(response.data.clues);
    setCurrentWordIndex(0);
    setCurrentClueIndex(0);
    setCurrentGuess('');
    setResult(null);
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
  };

  const getUserData = async (u) => {
    try {
      const response = await axios.get("/api/get-user-data", {
        params: {
          user: u
        }
        
      });

      const data = await response.json();
      console.log('HI')
      console.log(data.gamesPlayed)

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
    try {
      const response = await axios.post('/api/create-user-data', {
        user: userId,
      });

      console.log(response)

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
    try {

      const response = await axios.post('/api/handle-user-data', {
          userId,
          gamesPlayed,
          gamesWon,
          currentStreak,
          lastDatePlayed,
      });

      console.log(response)

      // const response = await fetch('/api/handle-user-data', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     userId,
      //     gamesPlayed,
      //     gamesWon,
      //     currentStreak,
      //     lastDatePlayed,
      //   })
      // });

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

  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };


  const handleGuess = async () => {
    const currentWord = clues[currentWordIndex].word;

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

      
      if (currentWordIndex < clues.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setCurrentClueIndex(0);
        setCurrentGuess('');
        if (!isGameOver) {
          correct() // Play correct sound
        }
      } else {
        // User wins
        setEndGameTitle('You got 15 or less!')
        if ((14 - totalCluesUsed) === 0) {
          setEndGameGuesses('Phew! All guesses used')
        } else {
          setEndGameGuesses(`${14 - totalCluesUsed} guesses remaining`)
        }
        setGamesWon((prevGamesWon) => prevGamesWon + 1)
        win() // Play win sound
        endGame();
      }
    } else {
      if (currentClueIndex < clues[currentWordIndex].clues.length - 1 && totalCluesUsed < 14) {
        setCurrentClueIndex(currentClueIndex + 1); // Indexes to next clue for word
        

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
        setEndGameTitle('Next time!')
        setEndGameGuesses(`Ran out of guesses`)
        lose() // Play lose sound
        endGame()
      }
    }
    setCurrentGuess('');

    
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isGameOver) {
      handleGuess();  // Trigger the handleGuess function when Enter is pressed
    }
  };


  const endGame = async () => {
    setIsGameOver(true)
    setOpen(true)
    if (gamesPlayed == 0) {
      setGamesPlayed(1)
    }
    else {
      setGamesPlayed((prevGamesPlayed) => prevGamesPlayed + 1)
    }
    //check for win

    //update last date played

    //validate for streak here
    // if {
    // }
    // else {

    // }

    updateUserData(userId, gamesPlayed, gamesWon, currentStreak, lastDatePlayed)
  }

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

  return (
    
    <div className={styles.container}>
      {/* Header Section with Title */}
      <div className={styles.header}>
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
          <div className={styles.content}>
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
      <div className={styles.mainContentContainer}>

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
        <div className={styles.circleContainer} id = 'circle'>
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
              py: 0.8,
              my: 1,
              width: '30%',
              fontSize: { xs: '8px', sm: '12px', md: '14px', lg: '16px' },
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
              disabled={isGameOver} // Disable the input field when the game is over
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
          
          <Button onClick={endGame}>Endgame</Button>

        </div>

      {/* Endgame Modal Win */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="how-to-play-title"
        aria-describedby="how-to-play-description"
        sx = {{ backgroundImage: "url('/bg-image.png')" }}
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
                  {`${guessedWords.filter(Boolean).length} out of 8`} <br />  {`words correct!`}
                  </Typography>
                

                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    {endGameGuesses}
                  </Typography>

                  
                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    <span className={styles.timeEndGame}>Time: </span>{Math.floor(time / 60)}:{time % 60 < 10 ? `0${time % 60}` : time % 60}
                  </Typography>
            </Stack>

            <Stack direction="row" spacing={25} sx = {{ pt: 10, textAlign: 'center', justifyContent: 'center'}}>
                <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                  All time stats
                  </Typography>
                

                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    win %
                  </Typography>

                  
                  <Typography variant = "h5" component = "h4" sx={{ fontFamily: alfaSlabOne.style.fontFamily, textAlign: 'center'}}>
                    current streak
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
            overflow={window.innerHeight < 800 ? 'scroll' : 'hidden'}
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
            
            <Typography sx={{ mt: 1, mb: 1, pl: 4 }}>
              <ul>
                <li>Each guess must be singular.</li>
                <li>Every wrong guess will provide you with another clue.</li>
                <li>Make connections with the clues given to you for your guesses.</li>
              </ul>
            </Typography>
            
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
