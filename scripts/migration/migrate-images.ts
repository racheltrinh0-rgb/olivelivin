import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import mime from "mime-types";

dotenv.config({ path: ".env.storage" });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const oldClient = createClient(
  process.env.OLD_SUPABASE_URL!,
  process.env.OLD_SERVICE_ROLE_KEY!
);


const bucket = "website OLive";

async function listAll(prefix = ""): Promise<string[]> {
  let results: string[] = [];

  const { data, error } = await oldClient.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error) {
    console.error(error);
    return results;
  }

  for (const item of data) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;

    if (!item.metadata) {
      results.push(...await listAll(full));
    } else {
      results.push(full);
    }
  }

  return results;
}

async function copyFile(file: string) {
  try {
    console.log("Downloading:", file);

    const { data, error } = await oldClient.storage
      .from(bucket)
      .download(file);

    if (error) {
      console.log("Download error:", error.message);
      return;
    }

    const arr = await data.arrayBuffer();
    const buffer = Buffer.from(arr);

    console.log("Uploading:", file);

    await Promise.race([
      r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: file,
          Body: buffer,
          ContentType: mime.lookup(file) || "application/octet-stream",
        })
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Upload timeout")), 120000)
      ),
    ]);

    console.log("OK:", file);
  } catch (err: any) {
    console.log("ERROR:", file);
    console.log(err.message);
  }
}

async function main(){

    const files = await listAll();

    console.log("Total:",files.length);

   const CONCURRENCY = 10;

for (let i = 0; i < files.length; i += CONCURRENCY) {
  const batch = files.slice(i, i + CONCURRENCY);

  await Promise.all(
    batch.map(file => copyFile(file))
  );

  console.log(
    `Progress: ${Math.min(i + CONCURRENCY, files.length)}/${files.length}`
  );
}

    console.log("DONE");

}

main();