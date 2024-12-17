document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const summaryContainer = document.getElementById("summary");
  const summarizeBtn = document.getElementById("summarize-btn");

  if (!status || !summarizeBtn) {
    console.error("Required elements not found in popup.html");
    return;
  }

  // Add click event listener to summarize button
  summarizeBtn.addEventListener("click", () => {
    // Reset status and summary
    status.innerText = "Fetching page URL...";
    summaryContainer.innerHTML = "<p>Generating summary...</p>";

    // First, get the current tab's URL
    chrome.runtime.sendMessage(
      { action: "getCurrentTabUrl" },
      async (response) => {
        if (!response || response.error) {
          status.innerText = "Failed to get page URL.";
          summaryContainer.innerHTML = `<p>${
            response?.error || "No URL received"
          }</p>`;
          console.error(response?.error || "No URL received");
          return;
        }

        try {
          status.innerText = "Summarizing content...";
          const summary = await summarizeContent(response.url);

          status.style.display = "none";

          // Convert summary to bullet points if it's not already in HTML format
          const formattedSummary = summary.includes("<ul>")
            ? summary
            : formatToBulletPoints(summary);

          summaryContainer.innerHTML = formattedSummary;
        } catch (error) {
          console.error("Error summarizing content:", error);
          status.style.display = "block";
          status.innerText = "Error summarizing content.";
          summaryContainer.innerHTML = `<p>Error: ${error.message}</p>`;
        }
      }
    );
  });
});

// Function to convert text to bullet points
function formatToBulletPoints(text) {
  // Split the text by newline and filter out empty lines
  const lines = text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter((line) => line.length > 0);

  // Create an HTML unordered list
  const bulletPoints = lines.map((line) => `<li>${line}</li>`).join("");
  return `<ul>${bulletPoints}</ul>`;
}

// Function to send URL to the server for summarization
async function summarizeContent(url) {
  try {
    const response = await fetch("http://localhost:3000/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Server error response:", errorBody);
      throw new Error(`Server responded with ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (!data.summary) {
      throw new Error("No summary was generated");
    }

    return data.summary;
  } catch (error) {
    console.error("Detailed fetch error:", error);
    throw error;
  }
}
