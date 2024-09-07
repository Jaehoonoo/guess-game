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
      const wordsData = doc.data();
      if (wordsData.words) {  // Ensure 'words' field exists before trying to use it
        wordsData.words.forEach(word => usedWords.add(word.word.toLowerCase()));
      }
    });

    // Create a prompt based on whether words already exist in Firestore
    let prompt;
    if (usedWords.size === 0) {
      prompt = generateDefaultPrompt();  // Default if no words exist
    } else {
      prompt = generatePromptWithExclusions([...usedWords]);  // Exclude words already in Firestore
    }

    // Try generating 50 words to ensure uniqueness
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 4000, // Adjust token count to generate more words and clues
      temperature: 0.9,
    });

    const generatedWords = parseOpenAIResponse(response.choices);

    // Filter and keep only unique words up to 8
    for (const generatedWord of generatedWords) {
      const normalizedWord = generatedWord.word.toLowerCase();

      // Ensure the generated word is unique
      if (!usedWords.has(normalizedWord) && generatedWordsList.length < 8) {
        usedWords.add(normalizedWord);
        generatedWordsList.push({
          word: normalizedWord,
          clues: generatedWord.clues.slice(0, 15),  // Ensure 15 clues max
        });
      }

      // If we've reached 8 unique words, break out of the loop
      if (generatedWordsList.length === 8) {
        break;
      }
    }

    // Add the list of 8 words to Firestore as a single document
    if (generatedWordsList.length === 8) {
      await addDoc(wordsCollection, {
        words: generatedWordsList,
      });

      console.log("List of 8 words added to Firestore successfully!");
      return new Response(JSON.stringify({ success: true, message: "List of 8 words added to Firebase successfully!" }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false, message: "Could not generate 8 unique words." }), { status: 200 });
    }

  } catch (error) {
    console.error("Error in word generation:", error);
    return new Response(JSON.stringify({ success: false, message: "Error generating words: " + error.message }), { status: 500 });
  }
}

function generateDefaultPrompt() {
  return `Generate 50 words that represent commonly recognized objects, concepts, or items (e.g., apple, river, chair).
  For each word, generate 15 clues that are directly related to the word (e.g., 'fruit' for 'apple', 'water' for 'river').
  The clues should be single words that are closely related to the word but not overly obvious.
  Ensure that the words or any of the clues do not contain any commas.
  Format the response as plain JSON, with each word having a "word" key and a "clues" key that contains an array of 15 single-word clues.
  Do not include any code blocks or backticks.`;
}

function generatePromptWithExclusions(excludedWords) {
  const excludedWordsList = excludedWords.join(", ");
  return `Generate 50 words that represent commonly recognized objects, concepts, or items (e.g., apple, river, chair).
  Do not generate any of the following words: ${excludedWordsList}.
  For each word, generate 15 clues that are directly related to the word (e.g., 'fruit' for 'apple', 'water' for 'river').
  The clues should be single words that are closely related to the word but not overly obvious.
  Ensure that the words or any of the clues do not contain any commas.
  Format the response as plain JSON, with each word having a "word" key and a "clues" key that contains an array of 15 single-word clues.
  Do not include any code blocks or backticks.`;
}

function parseOpenAIResponse(choices) {
  return choices.map((choice) => {
    const cleanedContent = choice.message.content.trim().replace(/```json|```/g, '');

    try {
      const data = JSON.parse(cleanedContent);
      if (data && Array.isArray(data) && data.length > 0) {
        return data.map(item => ({
          word: item.word,
          clues: item.clues.slice(0, 15),
        }));
      } else {
        console.warn("Incomplete data received, retrying...");
        return null;
      }
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return null;
    }
  }).filter(word => word !== null).flat();
}
