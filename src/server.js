import dotenv from "dotenv";
dotenv.config(); // ✅ Must be first — loads env vars before any module reads them

import express from "express";
import app from "./app.js";

app.use(express.static("public"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
