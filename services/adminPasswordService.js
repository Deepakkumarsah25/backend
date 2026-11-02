import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export const hashAdminPassword = async (password) => {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${HASH_PREFIX}$${salt.toString("hex")}$${Buffer.from(derivedKey).toString("hex")}`;
};

export const verifyAdminPassword = async (password, storedValue) => {
  if (typeof password !== "string" || typeof storedValue !== "string") return false;

  const [scheme, saltHex, keyHex, extra] = storedValue.split("$");
  if (scheme !== HASH_PREFIX || !saltHex || !keyHex || extra !== undefined) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (!salt.length || expected.length !== KEY_LENGTH) return false;

  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return timingSafeEqual(actual, expected);
};

export const verifyLegacyAdminPassword = (password, storedValue) => {
  if (typeof password !== "string" || typeof storedValue !== "string") return false;
  const provided = Buffer.from(password);
  const expected = Buffer.from(storedValue);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
};
