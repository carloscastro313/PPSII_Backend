import express from "express";
import "dotenv/config";
import testingRouter from "./routes/testing.route";

function main() {
  const PORT = process.env["PORT"] || 4000;
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  //Routes
  //Testing
  app.use(testingRouter);

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el http://localhost:${PORT}`);
  });
}

main();
