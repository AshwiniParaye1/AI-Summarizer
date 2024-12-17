document.getElementById("summarize-btn").addEventListener("click", async () => {
  const articleText = document.getElementById("article-input").value.trim();

  // Checking if articleText is empty
  if (!articleText) {
    document.getElementById("summary").innerText =
      "Please paste some article content to summarize.";
    return;
  }

  try {
    const summary = await getAISummary(articleText);
    document.getElementById("summary").innerText = summary;
  } catch (error) {
    document.getElementById("summary").innerText =
      "Error summarizing article: " + error.message;
  }
});

async function getAISummary(articleText) {
  const response = await fetch("http://localhost:3000/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ articleText })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch summary");
  }

  const data = await response.json();

  return data.summary;
}
