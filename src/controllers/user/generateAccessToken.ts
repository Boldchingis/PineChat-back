import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string) => {
  const token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "4h",
  });
  return token;
};