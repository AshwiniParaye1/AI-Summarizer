const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/summarize", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Fetch webpage content
    const fetchResponse = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    // Extract text content (you might want to use a more robust method like cheerio)
    const articleText = fetchResponse.data.toString().substring(0, 4000);

    if (!articleText || articleText.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "No content found at the provided URL" });
    }

    // Summarize the fetched content with explicit bullet point request
    const summaryResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Provide a summary of the following webpage content. Format the summary as a bulleted list. Each bullet point should be concise and capture a key insight or important piece of information. If the content is too technical or unclear, explain that a proper summary cannot be generated."
          },
          { role: "user", content: articleText }
        ],
        max_tokens: 300
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const summary = summaryResponse.data.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ error: "No summary could be generated" });
    }

    res.json({ summary });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Unexpected server error",
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
