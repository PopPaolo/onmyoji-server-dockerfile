import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTIONS } from "./system-instructions";
import dotenv from "dotenv";

import { craftPrompt } from "./promptHandling";

dotenv.config();

const app = express();
const httpServer = createServer(app);
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const port = 3001;

io.on("connection", (socket: Socket) => {
  console.log(`conn: ${socket.id}`);

  socket.on("client_command", async (data) => {
    try {
      // Initialize Google AI
      const apiKey = process.env.GEMINI_API_KEY as string;
      const genAI = new GoogleGenerativeAI(apiKey);

      // Get the model with system instructions
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro-exp-03-25",
        systemInstruction: SYSTEM_INSTRUCTIONS,
      });

      // Setup generation config
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 65536,
        responseMimeType: "text/plain",
      };

      // Start chat session
      const chatSession = model.startChat({
        generationConfig,
        history: [], // You may want to maintain chat history
      });

      // Format the user message with the craftPrompt function
      const formattedPrompt = craftPrompt(data.message);

      // Send user command to AI
      const result = await chatSession.sendMessage(formattedPrompt);
      const resultText = result.response.text();
      const aiResponse = resultText.substring(8, resultText.length - 3);

      // Parse AI response
      const parsedResponse = JSON.parse(aiResponse);

      // TODO: Implement source handling based on parsedResponse.source_handling
      // For example: if(parsedResponse.source_handling === "handleYouTube") { ... }

      // Send AI response back to client
      socket.emit("system_response", {
        message: parsedResponse.response_message,
        noteState: parsedResponse.current_note_state,
        isSystemMessage: true,
      });
    } catch (error) {
      console.error("Error processing command:", error);
      socket.emit("system_response", {
        message: "Sorry, I couldn't process that command.",
        isSystemMessage: true,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`disc: ${socket.id}`);
  });
});

httpServer.listen(port);
