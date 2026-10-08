// This file sets up and starts the Express server.
//
// You do NOT need to modify this file for Assignment 2.
// It is provided fully configured so you can focus on
// implementing database, routes and validation logic.

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { errorHandler, requestLogger } from "./middleware";
import routes from "./routes";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/api", routes);

// Error handling
app.use(errorHandler);

// ------------------------------------------------------------
// Start the server only when this file is the entry point
//
// - When running `npm start`, this file is executed directly,
//   so we start listening on a port.
// - When running tests, this file is imported by Jest/Supertest,
//   so we do NOT start the server (avoids port conflicts).
//
// We compare the current module's file path (import.meta.url)
// with the actual entry script passed to Node/tsx.
// ------------------------------------------------------------
const isEntry =
  fileURLToPath(import.meta.url) ===
  path.resolve(process.argv[process.argv.length - 1]);

if (isEntry) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
