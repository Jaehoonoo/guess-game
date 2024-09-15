import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google";
import "./globals.css";
import { neobrutalism } from "@clerk/themes";
import { Alfa_Slab_One } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "15 or Less",
  description: "Generated by create next app",
};

const alfaSlabOne = Alfa_Slab_One({
  weight: '400',
  subsets: ['latin'],
  display: 'auto',
});

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: neobrutalism,
        variables: {
          colorPrimary: "#919D89",
          fontSize: '1rem',
          border: 'none',
        },
      }}>
      <html lang="en">
        <body className={`${inter.className} ${alfaSlabOne.className}`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}