chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentTabUrl") {
    // Get the current active tab's URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ error: "Could not retrieve current tab URL" });
      }
    });

    // Return true to indicate asynchronous sendResponse
    return true;
  }
});
