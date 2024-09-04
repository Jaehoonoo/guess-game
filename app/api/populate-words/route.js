import { OpenAI } from 'openai';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have this key in your .env.local
});

export async function POST(req) {
  try {
    const wordsCollection = collection(db, "words");

    const generatedWordsList = [];
    const usedWords = new Set();

    // Fetch all existing words in Firestore
    const allWordsSnapshot = await getDocs(wordsCollection);
    allWordsSnapshot.forEach((doc) => {
      const wordsData = doc.data().words;
      wordsData.forEach(word => usedWords.add(word.word.toLowerCase()));
    });

    while (generatedWordsList.length < 8) {
      // Generate the word with OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: generatePrompt() }],
        max_tokens: 300,
      });

      const generatedWord = parseOpenAIResponse(response.choices)[0];
      const normalizedWord = generatedWord.word.toLowerCase();

      // Check if the word already exists in Firestore or the current list
      if (!usedWords.has(normalizedWord)) {
        usedWords.add(normalizedWord);  // Add to the set of used words
        generatedWordsList.push({
          word: normalizedWord,
          clues: generatedWord.clues.slice(0, 15),  // Ensure exactly 15 clues are used
        });
      } else {
        console.log(`Word "${normalizedWord}" already exists in Firestore or the current list. Generating a new word...`);
      }
    }

    // Add the list of 8 words to Firestore as a single document
    await addDoc(wordsCollection, {
      words: generatedWordsList,
    });

    console.log("List of 8 words added to Firestore successfully!");
    return new Response(JSON.stringify({ success: true, message: "List of 8 words added to Firebase successfully!" }), { status: 200 });

  } catch (error) {
    console.error("Error in word generation:", error);
    return new Response(JSON.stringify({ success: false, message: "Error adding words: " + error.message }), { status: 500 });
  }
}

function generatePrompt() {
  return `Generate a word that represents a commonly recognized object, concept, or item (e.g., apple, river, chair) that is simple yet challenging to guess.
  For this word, generate 15 clues that are directly related to the word (e.g., 'fruit' for 'apple', 'water' for 'river'). 
  The clues should be single words that are closely related to the word but not overly obvious.
  Ensure that the word or any of the clues do not contain any commas.
  Format the response as plain JSON with the word having a "word" key and a "clues" key that contains an array of 15 single-word clues.
  Do not include any code blocks or backticks.`;
}

function parseOpenAIResponse(choices) {
  return choices.map((choice) => {
    const cleanedContent = choice.message.content.trim().replace(/```json|```/g, '');

    try {
      const data = JSON.parse(cleanedContent);
      if (data && data.word && data.clues) {
        // Truncate clues if there are more than 15
        const truncatedClues = data.clues.slice(0, 15);
        return {
          word: data.word,
          clues: truncatedClues,
        };
      } else {
        console.warn("Incomplete data received, retrying...");
        return null;
      }
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return null;
    }
  }).filter(word => word !== null);
}
