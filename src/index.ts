import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

import { createNote } from "./DAO";
import { handleClientCommand, handleServerCommand } from "./AI_interaction";

let myCache: Record<string, any> = {};
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

  socket.on(
    "client_command",
    async (data: {
      message: string;
      isSystemMessage: boolean;
    }): Promise<void> => {
      try {
        // Fetch note currently stored locally
        const current_note = myCache[socket.id] as Note;

        console.log(`current note: ${current_note}`);

        // Send user command and current note state to AI for analysis
        const { response_message, action, new_note, tagIds, new_tags } =
          await handleClientCommand(data.message, current_note);

        // Handle note based on action defined by AI
        switch (action) {
          // This action will add the current note state to the database,
          // The transaction response will be given to the AI for response generation.
          // If the transaction is successful an action termination message will be returned,
          // Otherwise error handling will take over.
          case "Create": {
            // Database transaction is attempted
            const { success, message } = await createNote(new_note, tagIds, new_tags);

            // Transaction result is given to AI which will generate an appropriate response.
            const aiResponse = await handleServerCommand(success, message);
            // TODO eventually note will only be deleted on successful creation
            //  if (success) { // If the transaction was successful, a short message will notify the user.
            //    delete myCache[socket.id];
            //  } else { // If the transaction failed, a message will guide the user through error handling.
            //    errorHandling();
            //  }

            // For now cached note is deleted regardless.
            delete myCache[socket.id];

            // For now emit system response with database transaction message (assumes transaction is always successful)
            socket.emit("system_response", {
              message: aiResponse,
              isSystemMessage: true,
            });
            break;
          }
          // TODO
          //  This action will fetch a note using the filters provided.
          case "Fetch": {
            break;
          }
          // TODO
          //  This action will delete a note given it's id.
          case "Delete": {
            break;
          }
          // This action assumes more data is needed to complete note
          case undefined: {
            // Cache current note
            myCache[socket.id] = new_note;

            // Send system response asking for more details
            socket.emit("system_response", {
              message: response_message,
              isSystemMessage: true,
            });
            break;
          }
        }
      } catch (error) {
        // Default error handling
        console.error("Error processing command:", error);
        socket.emit("system_response", {
          message: "Sorry, I couldn't process that command.",
          isSystemMessage: true,
        });
      }

      // if (action === "Create") {
      //   // Database transaction is attempted
      //   const { success, message } = await createNote(new_note);
      //
      //   // Transaction result is given to AI which will generate an appropriate response.
      //   const aiResponse = await handleServerCommand(success, message);
      //   // TODO eventually note will only be deleted on successful creation
      //   //  if (success) { // If the transaction was successful, a short message will notify the user.
      //   //    delete myCache[socket.id];
      //   //  } else { // If the transaction failed, a message will guide the user through error handling.
      //   //    errorHandling();
      //   //  }
      //
      //   // For now cached note is deleted regardless.
      //   delete myCache[socket.id];
      //
      //   // For now emit system response with database transaction message (assumes transaction is always successful)
      //   socket.emit("system_response", {
      //     message: aiResponse,
      //     isSystemMessage: true,
      //   });
      // }
      //
      // TODO
      //  This action will fetch a note using the filters provided.
      // else if (action === "Fetch") {
      // }
      //
      // TODO
      //  This action will delete a note given it's id.
      // else if (action === "Delete") {
      // }
      //
      // This action assumes more data is needed to complete note
      // else if (action === undefined) {
      //   // Send system response asking for more details
      //   socket.emit("system_response", {
      //     message: response_message,
      //     isSystemMessage: true,
      //   });
      // }
    },
  );

  socket.on("disconnect", () => {
    console.log(`disc: ${socket.id}`);
  });
});

httpServer.listen(port);
