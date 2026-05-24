import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await pbkdf2Async(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );

  return `pbkdf2:${DIGEST}:${ITERATIONS}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [scheme, digest, iterations, salt, hash] = storedHash.split(":");
  if (scheme !== "pbkdf2" || !digest || !iterations || !salt || !hash) {
    return false;
  }

  const derivedKey = await pbkdf2Async(
    password,
    salt,
    Number(iterations),
    Buffer.from(hash, "hex").length,
    digest
  );

  const storedKey = Buffer.from(hash, "hex");
  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKey);
}
