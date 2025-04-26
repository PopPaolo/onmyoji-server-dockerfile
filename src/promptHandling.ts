import { getTags } from "./DAO";

// Craft a user command prompt
export async function craftUserPrompt(
  message: string,
  noteState?: Note,
): Promise<string> {
  // Fetch existing tags from the database
  const tags = await getTags();

  const promptObject = {
    command_type: "user_command",
    command_string: message,
    existing_tags: tags,
    current_note: noteState,
  };

  return JSON.stringify(promptObject);
}

// Craft a server command prompt
export function craftServerPrompt(success: boolean, message: string): string {
  const promptObject = {
    command_type: "server_command",
    success: success,
    message: message,
  };

  return JSON.stringify(promptObject);
}
