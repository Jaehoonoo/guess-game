import React from 'react'
import { Box } from '@mui/material'
import { SignIn } from '@clerk/nextjs'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Alfa_Slab_One } from "next/font/google";
import Head from 'next/head';

const alfaSlabOne = Alfa_Slab_One({
  weight: '400', 
  subsets: ['latin'], 
  display: 'swap',
});



export default function SignInPage() {
    return (
        <>
        <Head>
            <link rel="preconnect" href="https://fonts.gstatic.com" />
        </Head>

        <Box
            width="100vw"
            height="100vh"
            display="flex"
            sx={{
                backgroundImage: "url('/bg-image.png')",
                backgroundSize: "cover", 
                backgroundPosition: "center", 
                backgroundRepeat: "no-repeat", 
            }}
        >
            
            <Box
                ml="50%"
                width="50%"
                height="100%"
                bgcolor="white"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                sx={{
                    '.cl-internal-1dauvpw': {
                      display: 'none',
                    },
                  }}
            >
                <a href="/" style={{ textDecoration: 'none', cursor: 'pointer', marginBottom: '16px'  }}>
                    <ArrowBackIcon />
                </a>

                <SignIn
                    signUpUrl='/sign-up'
                    appearance={{
                        elements: {
                            formButtonPrimary: {
                                fontSize: 24,
                            },
                            cardBox:{
                                border: "none",
                                boxShadow: "none", 
                                width: "100%"
                            }, 
                            card:{
                                border: "none", 
                                boxShadow: "none"
                            }, 
                            headerTitle:{
                                fontSize: 40,
                            },
                            
                        },
                        variables: {
                            fontFamily: alfaSlabOne.style.fontFamily,
                        }
                    }}
                />
            </Box>
        </Box>
        </>
    )
}