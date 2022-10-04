import express from "express";
import morgan from 'morgan';
import "dotenv/config";

function main() {
  const PORT = process.env["PORT"] || 4000;
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(morgan('dev'));

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el http://localhost:${PORT}`);
  });
}

main();
