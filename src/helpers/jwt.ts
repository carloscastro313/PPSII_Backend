import jwt, { JwtPayload } from "jsonwebtoken";

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

export const getTokenId = (token: string) => {
  token = token.slice(7);
  return jwt.decode(token) as JwtPayload;
};
