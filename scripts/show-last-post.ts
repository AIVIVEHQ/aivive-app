import "dotenv/config";
import { db } from "../src/db";
import { twitterPosts } from "../src/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const rows = await db()
    .select()
    .from(twitterPosts)
    .orderBy(desc(twitterPosts.created_at))
    .limit(3);

  for (const r of rows) {
    console.log("---");
    console.log("uuid:", r.uuid);
    console.log("status:", r.status);
    console.log("tweet_text:", r.tweet_text?.slice(0, 100));
    console.log("error_message:", r.error_message);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
