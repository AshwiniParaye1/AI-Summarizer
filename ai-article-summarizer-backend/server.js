const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to summarize articles
app.post("/summarize", async (req, res) => {
  const { articleText } = req.body;

  if (!articleText) {
    return res.status(400).json({ error: "Article text is required" });
  }

  try {
    const response = await axios.post(
      OPENAI_ENDPOINT_URL,
      {
        model: "gpt-3.5-turbo", // using GPT-3.5 model
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that summarizes articles in bullet points."
          },
          { role: "user", content: articleText }
        ],
        max_tokens: 1000
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const summary = response.data.choices[0].message.content.trim();

    console.log({ summary });

    res.json({ summary });
  } catch (error) {
    console.error("Error interacting with OpenAI API:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
