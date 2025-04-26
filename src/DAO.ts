import dotenv from "dotenv";

dotenv.config();

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function authenticate() {
  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email: "paolopop2000ll@gmail.com",
      password: "password123",
    });

  if (loginError) {
    console.error("Login failed:", loginError.message);
    throw loginError;
  } else {
    const accessToken = loginData.session.access_token;
    console.log("✅ Authenticated and client ready");
  }
}

(async () => {
  await authenticate();
})();

// Insert note in resources table of the database
export const createNote = async (
  noteData: Note,
  tagIds: number[], // Ids of existing tags to be related to the note
  newTags?: string[], // Array of new tags to be added to the tags table and then related to the note
): Promise<{ success: boolean; message: string }> => {
  // Insert new tags into database and collect their IDs
  let new_tag_ids: number[] = [];
  if (newTags && newTags.length > 0) {
    new_tag_ids = await insertNewTags(newTags);
  }

  // TODO - for some reason tagIds is not iterable
  console.log(tagIds);

  // Merge new tag IDs with existing ones
  const tag_ids = [...tagIds, ...new_tag_ids];

  // Insert the resource
  const { data: insertedResources, error: resourceError } =
    await supabase.from("resources").insert(noteData).select(); // Select to retrieve the new ID

  if (resourceError) {
    return { success: false, message: resourceError.message };
  }

  const resourceId = insertedResources?.[0]?.id;
  if (!resourceId) throw new Error("Resource insert failed to return an ID");

  // Link tags to the resource
  if (tag_ids.length > 0) {
    const tagInserts = tag_ids.map((tag_id) => ({
      resource_id: resourceId,
      tag_id,
    }));

    const { error: tagError } = await supabase
      .from("resource_tags")
      .insert(tagInserts);

    if (tagError) throw tagError;
  }

  return { success: true, message: resourceId };
};

// TODO
//  export const fetchNote(): Promise<Note[]>{
//     return await supabase.from("resources").select("*").eq("");
//  }

export const getTags = async (): Promise<
  | {
      id: number;
      name: string;
    }[]
  | null
> => {
  const { data: tags } = await supabase.from("tags").select("*");

  return tags;
};

export const insertNewTags = async (newTags: string[]): Promise<number[]> => {
  // Prepare the tag objects
  const tagObjects = newTags.map((name) => ({ name }));

  tagObjects.forEach((tag) => {
    console.log(`attempting insertion of: "${tag.name}"`);
  });

  // Insert all tags and return their IDs
  const { data, error } = await supabase
    .from("tags")
    .insert(tagObjects)
    .select("id");

  if (error) {
    throw new Error(`Error inserting tags: ${error.message}`);
  }

  return data?.map((tag) => tag.id) || [];
};
