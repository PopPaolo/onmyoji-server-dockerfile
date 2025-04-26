import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTIONS } from "./system-instructions";
import dotenv from "dotenv";

import { craftServerPrompt, craftUserPrompt } from "./promptHandling";

// Load env vars
dotenv.config();

// Init Gemini model
const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-exp-03-25",
  systemInstruction: SYSTEM_INSTRUCTIONS,
});

// Generation config
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseMimeType: "text/plain",
};

// TODO Cache session and store history

// Start chat session
const chatSession = model.startChat({
  generationConfig,
  history: [],
});

// Craft a user command prompt for the AI model, gets a response and returns it
export const handleClientCommand = async (
  message: string,
  current_note: Note,
): Promise<{
  response_message: string;
  action?: string;
  new_note: Note;
  tagIds: number[];
  new_tags?: string[];
}> => {
  try {
    // Format prompt with command type, the message string, existing tags and current note state
    const prompt = await craftUserPrompt(message, current_note);
    console.log(`user prompt crafted: ${prompt}`);

    // Send prompt to Gemini for analysis
    const result = await chatSession.sendMessage(prompt);
    const rawText = result.response.text();

    // Trim response of json formatting
    const aiResponse = rawText.substring(8, rawText.length - 3);

    console.log(`ai response: ${aiResponse}`);

    // Parse json and return
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error("Error in handleClientCommand:", error);
    throw error;
  }
};

// Craft a server command prompt for the AI model, gets a response and returns it
export const handleServerCommand = async (
  success: boolean,
  message: string,
): Promise<string> => {
  try {
    // Format prompt with command type and transaction response
    const prompt = craftServerPrompt(success, message);

    console.log(`server prompt crafted: ${prompt}`);

    // Send prompt to Gemini for analysis
    const result = await chatSession.sendMessage(prompt);
    const rawText = result.response.text();

    // Trim response of json formatting
    const aiResponse = rawText.substring(8, rawText.length - 3);

    console.log(`ai response: ${aiResponse}`);

    // Parse json and return
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error("Error in handleServerCommand:", error);
    throw error;
  }
};
