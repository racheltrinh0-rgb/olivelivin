import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.storage" });

const oldClient = createClient(
  process.env.OLD_SUPABASE_URL!,
  process.env.OLD_SERVICE_ROLE_KEY!
);

const newClient = createClient(
  process.env.NEW_SUPABASE_URL!,
  process.env.NEW_SERVICE_ROLE_KEY!
);

const bucket = process.env.BUCKET!;

async function listAll(prefix = ""): Promise<string[]> {
  let results: string[] = [];

  const { data, error } = await oldClient.storage
    .from(bucket)
    .list(prefix, {
      limit: 1000,
    });

  if (error) {
    console.error(error);
    return results;
  }

  for (const item of data) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;

    if ((item as any).id === null) {
      results.push(...await listAll(full));
    } else {
      results.push(full);
    }
  }

  return results;
}

async function copyFile(file: string) {

  console.log("Downloading:", file);

  const { data, error } = await oldClient.storage
    .from(bucket)
    .download(file);

  if (error) {
    console.log(error.message);
    return;
  }

  const arr = await data.arrayBuffer();

  console.log("Uploading:", file);

  const { error: uploadError } = await newClient.storage
    .from(bucket)
    .upload(
      file,
      Buffer.from(arr),
      {
        upsert: true
      }
    );

  if (uploadError) {
    console.log(uploadError.message);
  } else {
    console.log("OK:", file);
  }

}

async function main(){

    const files = await listAll();

    console.log("Total:",files.length);

    for(const file of files){
        await copyFile(file);
    }

    console.log("DONE");

}

main();