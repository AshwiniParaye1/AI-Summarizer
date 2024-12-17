const express = require("express");
const axios = require("axios");
const cors = require("cors"); // Add cors middleware
require("dotenv").config();

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to fetch and summarize web content
app.post("/summarize", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Fetch webpage content
    let fetchResponse;
    try {
      fetchResponse = await axios.get(url, {
        // Add timeout and headers to mimic browser request
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
    } catch (fetchError) {
      console.error("Failed to fetch URL:", fetchError.message);
      return res.status(500).json({
        error: "Could not fetch webpage content",
        details: fetchError.message
      });
    }

    // Extract text content
    const articleText = fetchResponse.data.toString().substring(0, 4000); // Limit text length

    // Validate content
    if (!articleText || articleText.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "No content found at the provided URL" });
    }

    // Summarize the fetched content
    let summaryResponse;
    try {
      summaryResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Summarize the following webpage content in clear, concise bullet points. If the content is too technical or unclear, explain that a proper summary cannot be generated."
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
    } catch (openaiError) {
      console.error(
        "OpenAI API Error:",
        openaiError.response ? openaiError.response.data : openaiError.message
      );
      return res.status(500).json({
        error: "Failed to generate summary",
        details: openaiError.response
          ? openaiError.response.data
          : openaiError.message
      });
    }

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
