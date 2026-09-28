import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = 5000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const prompt = req.body?.prompt?.trim();

    // Basic validation
    if (!prompt) {
      return res.status(400).json({
        error: "Please enter a question.",
      });
    }

    if (prompt.length > 5000) {
      return res.status(400).json({
        error: "Question must be less than 5000 characters.",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      instructions:
        "You are a helpful AI study assistant. Explain topics clearly and use examples when appropriate.",
      input: prompt,
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      return res.status(502).json({
        error: "The AI returned an empty response.",
      });
    }

    res.json({ answer });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to generate a response. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});