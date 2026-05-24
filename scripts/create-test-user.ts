import "dotenv/config";
import { findUserByEmail, insertUser } from "../src/models/user";
import { getUuid } from "../src/lib/hash";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = "test@aivive.local";
  const password = "Test123456!";

  const existing = await findUserByEmail(email);
  if (existing) {
    console.log("User already exists:", email);
    return;
  }

  const passwordHash = await hashPassword(password);
  await insertUser({
    uuid: getUuid(),
    email,
    nickname: "test",
    avatar_url: "",
    signin_type: "credentials",
    signin_provider: "credentials",
    signin_openid: email,
    signin_ip: "127.0.0.1",
    created_at: new Date(),
    updated_at: new Date(),
    password_hash: passwordHash,
  });

  console.log("Created user:", email);
  console.log("Password:", password);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
