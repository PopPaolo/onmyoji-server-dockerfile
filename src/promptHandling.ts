export function craftPrompt(message: string): string {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const promptObject = {
        "command_type": "user_command",
        "command_string": message,
        "existing_tags": [
            "cooking", "travel", "finance", "gardening", "photography",
            "technology", "cars", "fitness", "art", "history",
            "music", "books", "programming", "pets", "sports",
            "fashion", "movies", "design", "home", "organization", "minimalism"
        ],
        "current_note_state": null,
        "date": today
    };

    return JSON.stringify(promptObject);
}