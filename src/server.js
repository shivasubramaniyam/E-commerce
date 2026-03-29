import app from "./app.js";
import dotenv from "dotenv";
import express from "express";
app.use(express.static("public"));
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server running on PORT ${PORT}`);
});
