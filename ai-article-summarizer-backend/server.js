const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Function to extract main content
function extractMainContent(html) {
  const $ = cheerio.load(html);

  // Remove all unwanted elements
  $(`
    script, style, nav, header, footer, aside, iframe, 
    img, svg, .advertisement, .ad, .sidebar, 
    .comment-section, #comment-section, 
    .meta-info, .author-bio, .publication-info,
    [class*='meta'], [class*='author'], [class*='byline'],
    [id*='meta'], [id*='author'], [id*='byline']
  `).remove();

  // Try to find the main content using comprehensive selectors
  const contentSelectors = [
    "main",
    "article",
    ".main-content",
    "#main-content",
    ".content",
    "#content",
    ".article-body",
    "#article-body",
    ".post-content",
    "#post-content",
    'div[class*="content"]',
    'div[id*="content"]'
  ];

  let mainContent = "";

  // Try each selector
  for (let selector of contentSelectors) {
    const content = $(selector).text().trim();
    if (content && content.length > 200) {
      mainContent = content;
      break;
    }
  }

  // If no specific content found, try body text
  if (!mainContent) {
    mainContent = $("body").text().trim();
  }

  // Remove references to author, publication, metadata
  const cleanContent = mainContent
    .replace(/authored\s+by\s+[\w\s]+/gi, "")
    .replace(/published\s+in\s+[\w\s]+/gi, "")
    .replace(/meta\s+tags?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleanContent.substring(0, 4000);
}

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

    // Extract main content
    const articleText = extractMainContent(fetchResponse.data);

    if (!articleText || articleText.trim().length < 100) {
      return res
        .status(400)
        .json({ error: "No substantive content found at the provided URL" });
    }

    // Summarize the extracted content
    const summaryResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Extract and summarize ONLY the core textual content of the webpage. Completely ignore:" +
              "- Author information" +
              "- Publication details" +
              "- Metadata" +
              "- Image descriptions" +
              "- Promotional text" +
              "\n\nFocus strictly on the substantive, informative text. Provide a clear, concise bulleted summary of the main content and key points."
          },
          {
            role: "user",
            content: `Analyze and summarize ONLY the substantive content from this text. Remove any references to authorship, publication, or metadata. Focus on the core information:\n\n${articleText}`
          }
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
