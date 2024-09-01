'use client'

import { Box, Button, Modal, Typography } from "@mui/material";
import Head from "next/head";
import Image from "next/image";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Alfa_Slab_One } from "next/font/google";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useState } from "react";

const alfaSlabOne = Alfa_Slab_One({
  weight: '400', 
  subsets: ['latin'], 
  display: 'swap',
});


export default function Home() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);


  return (
    <>
    
    <Head>
      <link rel="preconnect" href="https://fonts.gstatic.com" />
    </Head>
    
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={30}
      py={15}
      sx={{
        backgroundImage: "url('/bg-image.png')",
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        backgroundRepeat: "no-repeat", 
      }}
      >

        <Box
          height="100%"
          width="100%"
          bgcolor="white"
          border="3px solid black"
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{
            boxShadow: '10px 10px 0px 0px rgba(0, 0, 0, 1)',
          }}>
            <Typography
              variant="h2"
              pt={3}
              sx={{
                fontWeight: 'bold', 
                fontFamily: alfaSlabOne.style.fontFamily,
              }}>
              15 Or Less
            </Typography>

            <Typography
              variant="h5"
              py={8}>
              8 Words, 15 Chances. Can You Guess It?
            </Typography>

            <Button 
              href="/sign-in"
              variant="contained" 
              disableRipple
              sx={{
                py: 2,
                width: '50%',
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'black',
                background: 'white', 
                border: '3px solid black',
                borderRadius: '3',
                cursor: 'pointer',
                textTransform: 'none',
                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                '&:hover': {
                  boxShadow: '7px 7px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                '&:active': {
                  boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                fontWeight: 'bold', 
                fontFamily: alfaSlabOne.style.fontFamily,
              }}>
                Log In
            </Button>

            <Button 
              variant="contained" 
              disableRipple
              sx={{
                mt: 3,
                mb: 4,
                py: 2,
                width: '50%',
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                background: '#E867EA', 
                border: '3px solid black',
                borderRadius: '3',
                cursor: 'pointer',
                textTransform: 'none',
                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                '&:hover': {
                  boxShadow: '7px 7px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                '&:active': {
                  boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
                }, 
                fontWeight: 'bold', 
                fontFamily: alfaSlabOne.style.fontFamily,
              }}>
                Start Playing
            </Button>

            <Box onClick={handleOpen} sx={{ cursor: 'pointer', '&:hover': {
                '& .MuiSvgIcon-root': {
                  color: 'black', 
                  transform: 'scale(1.1)', 
                },
                fontWeight: 'bold'
              } }}>
              <HelpOutlineIcon 
              style={{ fontSize: 40 }}/>
            </Box>
            
        </Box>
    </Box>
    <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="how-to-play-title"
        aria-describedby="how-to-play-description"
      >
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          height={400}
          bgcolor="white"
          boxShadow="5px 5px 0px 0px rgba(0, 0, 0, 1)"
          p={4}
          sx={{
            transform: "translate(-50%, -50%)", 
            border: "3px solid black",
            outline: "none"
          }}
          >
          <Typography id="how-to-play-title" variant="h6" component="h2" sx={{ fontFamily: alfaSlabOne.style.fontFamily }}>
            How to Play
          </Typography>
          <Typography id="how-to-play-description" sx={{ mt: 2 }}>
            Explain rules....
          </Typography>
        </Box>
      </Modal>
    </>
  );
}
