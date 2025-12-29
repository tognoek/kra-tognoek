import crypto from "crypto";

export const getAvatarUrl = (email: string) => {
  const hash = crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=100&d=identicon`;
};