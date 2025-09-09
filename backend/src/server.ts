import dotenv from "dotenv";
dotenv.config();
console.log("DEBUG ENV:", {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? "LOADED" : "MISSING"
});

import express from "express";
import cors from "cors";
import emailRoutes from "./routes/email.js";

//dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/", (_req, res) => res.send("Guest Registration Backend is running"));
app.use("/", emailRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
