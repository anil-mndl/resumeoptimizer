chrome.runtime.onInstalled.addListener(() => {
  console.log('Shell Chrome Extension installed.');

  chrome.contextMenus.create({
    id: "init-resume-optimizer",
    title: "Init Resume Optimizer",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "init-resume-optimizer") {
    // Send a message to the content script in the active tab
    // We catch the error in case the content script hasn't loaded (e.g., restricted pages like chrome://)
    chrome.tabs.sendMessage(tab.id, {
      action: "init_optimizer",
      selectionText: info.selectionText
    }).catch(err => {
      console.warn("Could not send message to content script:", err);
    });
  }
});
