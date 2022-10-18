import jwt from "jsonwebtoken";

export const generarJWT = (id: string) =>
  jwt.sign(
    {
      id,
    },
    process.env["SECRETA"] as string,
    {
      expiresIn: Math.floor(Date.now() / 1000) + 60 * 60,
    }
  );