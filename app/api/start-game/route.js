import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { DateTime } from "luxon";  // Using luxon for time zone handling

export async function GET(req) {
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

    // Get the current time in EST
    const now = DateTime.now().setZone('America/New_York');  // Use EST time zone
    const todayDate = now.toFormat('yyyy-MM-dd');  // Format as YYYY-MM-DD

    // Check if a word set for today exists in the 'dailygame' collection
    const dailyGameDoc = doc(db, "dailygame", todayDate);
    const dailyGameSnapshot = await getDoc(dailyGameDoc);

    let wordSet;

    if (dailyGameSnapshot.exists()) {
      // Word set for today exists, return it
      wordSet = dailyGameSnapshot.data().words;
    } else {
      // No word set for today, select a random word set and save it for today
      wordSet = wordLists[Math.floor(Math.random() * wordLists.length)];
      await setDoc(dailyGameDoc, { words: wordSet });
    }

    console.log("Returning daily word set for 12:00 AM EST:", wordSet);
    return new Response(JSON.stringify({ clues: wordSet }), { status: 200 });
  } catch (error) {
    console.error("Error in start-game:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
