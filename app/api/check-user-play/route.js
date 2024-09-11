import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { DateTime } from 'luxon';  // Import Luxon for consistent time handling

// Get today's date in EST (YYYY-MM-DD)
const getTodayDateInEST = () => {
  return DateTime.now().setZone('America/New_York').toISODate();
};

export async function POST(req) {
  try {
    const { userId } = await req.json();  // Ensure you're passing the userId from the client

    const todayEST = getTodayDateInEST();  // Get today's date in EST
    const userPlayDoc = doc(db, "user-plays", userId);  // A document for each user

    const userPlaySnapshot = await getDoc(userPlayDoc);
    const userPlayData = userPlaySnapshot.data();

    // If user has already played today, return that information
    if (userPlayData?.lastPlayed === todayEST) {
      return new Response(JSON.stringify({ playable: false, message: "You have already played today!" }), { status: 200 });
    }

    // If the user hasn't played today, update Firestore with the EST date
    await setDoc(userPlayDoc, {
      lastPlayed: todayEST
    }, { merge: true });

    return new Response(JSON.stringify({ playable: true, message: "You can play today!" }), { status: 200 });
  } catch (error) {
    console.error("Error checking user play status:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
