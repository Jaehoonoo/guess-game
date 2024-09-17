import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export async function GET() {
  try {
    const wordsCollection = collection(db, "words");
    const snapshot = await getDocs(wordsCollection);

    if (snapshot.empty) {
      console.log("No word lists found in the collection.");
      return new Response(JSON.stringify({ message: "No word lists available." }), { status: 404 });
    }

    const wordLists = [];
    snapshot.forEach((docSnapshot) => {
      wordLists.push(docSnapshot.data().words);
    });

    //function to simulate dates for testing
    // function getRandomDate(startYear, endYear) {
    //   const start = new Date(startYear, 0, 1); 
    //   const end = new Date(endYear, 11, 31); 
    //   const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      
    //   const randomLocalDate = randomDate.toLocaleDateString('en-CA');  // 
    //   return randomLocalDate;
    // }
    
    // const todaysLocalDate = 'x' + getRandomDate(2000, 2023);  
    // console.log(todaysLocalDate);  
    

    // Get the current time local to user
    const todaysLocalDate = new Date().toLocaleDateString('en-CA');  // Format as YYYY-MM-DD

    // Check if a word set for today exists in the 'dailygame' collection
    const dailyWordsetDoc = doc(db, "dailyWordsets", todaysLocalDate);
    const dailyWordsetSnapshot = await getDoc(dailyWordsetDoc);

    const docs = snapshot.docs;

    let randomDoc;
    let wordset;

    if (dailyWordsetSnapshot.exists()) {
      // Word set for today exists, return it
      wordset = dailyWordsetSnapshot.data().words;
    } else {
      // No word set for today, select a random word set and save it for today and delete that wordset
      randomDoc = docs[Math.floor(Math.random() * docs.length)];
      wordset = randomDoc.data().words
      await setDoc(dailyWordsetDoc, { words: wordset });
      await deleteDoc(randomDoc.ref)
      console.log('Deleted ', randomDoc.id);
    }

    console.log("Returning daily word set for 12:00 AM EST:", wordset);
    return new Response(JSON.stringify({ clues: wordset }), { status: 200 });
  } catch (error) {
    console.error("Error in start-game:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
