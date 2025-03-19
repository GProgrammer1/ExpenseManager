const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const geminiRouter = express.Router();
geminiRouter.use(express.json()); 

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("GEMINI_API_KEY: ", GEMINI_API_KEY);

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

geminiRouter.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const body = {
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    };

    const response = await axios.post(GEMINI_URL, body, {
      headers: { "Content-Type": "application/json" },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error calling Gemini API:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch response from Gemini" });
  }
});


module.exports = geminiRouter;

