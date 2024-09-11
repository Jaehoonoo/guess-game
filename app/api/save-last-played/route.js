// app/api/save-last-played/route.js
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { DateTime } from 'luxon';  // Import Luxon

export async function POST(req) {
  try {
    const { userId } = await req.json();  // Extract the userId from the request

    // Get today's date in EST (Eastern Standard Time)
    const todayEST = DateTime.now().setZone('America/New_York').toISODate();  // Returns YYYY-MM-DD format

    // Save the last played date in Firestore under the 'user-plays' collection for the user
    const userRef = doc(db, "user-plays", userId);
    await setDoc(userRef, { lastPlayedDate: todayEST }, { merge: true });

    return new Response(JSON.stringify({ success: true, message: "Last played date saved." }), { status: 200 });
  } catch (error) {
    console.error("Error saving last played date:", error);
    return new Response(JSON.stringify({ success: false, message: "Error saving last played date: " + error.message }), { status: 500 });
  }
}
