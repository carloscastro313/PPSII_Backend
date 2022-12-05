import jwt, { JwtPayload } from "jsonwebtoken";

export const generarJWT = (id: string) =>
  jwt.sign(
    {
      id,
    },
    process.env["SECRETA"] as string,
    {
      expiresIn:"10h",
    }
  );

export const getTokenId = (token: string) => {
  console.log(token);
  token = token.slice(7);
  return jwt.decode(token) as JwtPayload;
};
