import { Request, Response } from "express";

export function GetTesting(req: Request, res: Response) {
  return res.json({
    msg: "Funciona de maravilla",
    error: 0,
  });
}
