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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generate_response') {
    handleGenerateResponse(request, sender.tab.id);
  }
});

async function handleGenerateResponse(data, tabId) {
  try {
    const { prompt, content, resume } = data;

    // Retrieve API Key
    const result = await chrome.storage.local.get(['openai_apikey']);
    const apiKey = result.openai_apikey;

    if (!apiKey) {
      chrome.tabs.sendMessage(tabId, {
        action: 'stream_error',
        error: 'OpenAI API Key is missing. Please set it in the extension popup.'
      });
      return;
    }

    const messages = [
      { role: "system", content: "You are a helpful assistant for optimizing resumes and applications." },
      { role: "user", content: `Here is the job description or content: "${content}".\n\nHere is my resume: "${resume}".\n\n${prompt}` }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last part in buffer if it doesn't end with a newline
      // Actually, split removes the separator.
      // If buffer was "A\nB\nC", lines is ["A", "B", "C"].
      // If buffer was "A\nB\nC", and C is incomplete...
      // We should pop the last element back into buffer?
      // Wait, standard SSE messages end with \n\n.
      // OpenAI stream chunks usually end with \n.

      // Correct buffer logic:
      // split by \n. The last element is potentially incomplete.
      buffer = lines.pop();

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
          try {
            const json = JSON.parse(trimmedLine.substring(6));
            if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
              chrome.tabs.sendMessage(tabId, {
                action: 'stream_update',
                chunk: json.choices[0].delta.content
              });
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }
    }

    chrome.tabs.sendMessage(tabId, { action: 'stream_end' });

  } catch (error) {
    console.error("Error generating response:", error);
    chrome.tabs.sendMessage(tabId, {
      action: 'stream_error',
      error: error.message
    });
  }
}
