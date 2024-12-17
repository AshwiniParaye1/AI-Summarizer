document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const summaryContainer = document.getElementById("summary");
  const summarizeBtn = document.getElementById("summarize-btn");

  if (!status || !summarizeBtn) {
    console.error("Required elements not found in popup.html");
    return;
  }

  // Added click event listener to summarize button
  summarizeBtn.addEventListener("click", () => {
    // Reset status and summary
    status.innerText = "Fetching page URL...";
    summaryContainer.innerText = "Generating summary...";

    // get the current tab's URL
    chrome.runtime.sendMessage(
      { action: "getCurrentTabUrl" },
      async (response) => {
        if (!response || response.error) {
          status.innerText = "Failed to get page URL.";
          summaryContainer.innerText = response?.error || "No URL received";
          console.error(response?.error || "No URL received");
          return;
        }

        try {
          status.innerText = "Summarizing content...";
          const summary = await summarizeContent(response.url);

          status.style.display = "none";
          summaryContainer.innerText = summary;
        } catch (error) {
          console.error("Error summarizing content:", error);
          status.style.display = "block";
          status.innerText = "Error summarizing content.";
          summaryContainer.innerText = `Error: ${error.message}`;
        }
      }
    );
  });
});

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
