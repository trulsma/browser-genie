const SUMMARIZE_CONTEXT_MENU_ID = "brower-assistant-summarize";


const capabilties = [
  {
    id: "llama-1234",
    model: "gemma:instruct",
    title: "Summarize (selection)",
    context: "selection",
    prompt: "Summarize the following text:\n {context}\n\n",
    need_user_input: false
  },
  {
    id: "lllama-12345",
    model: "gemma:instruct",
    title: "Summarize (document)",
    context: "document",
    prompt: "Summarize the following text:\n {context}\n\n",
    need_user_input: false
  },
  {
    id: "lllama-123456999",
    model: "gemma:instruct",
    title: "Ask (selection)",
    context: "selection",
    prompt: "Use the following information to help answer questions:\n {context}\n\n",
    need_user_input: true
  },
  {
    id: "lllama-1234562",
    model: "gemma:instruct",
    title: "Ask (no context)",
    context: "none",
    prompt: "You are a helpful assistant.\n\n",
    need_user_input: true
  },
  {
    id: "lllama-123457",
    model: "gemma:instruct",
    title: "Ask (document)",
    context: "document",
    prompt: "Use the following information to help answer questions:\n {context}\n\n",
    need_user_input: true
  },
];

for (const capability of capabilties) {
  const contextMenuContext = capability.context == "selection" ? "selection" : "all";
  chrome.contextMenus.create({
    title: capability.title,
    id: capability.id,
    contexts: [contextMenuContext],
  });
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  for (const capability of capabilties) {
    if (info.menuItemId == capability.id) {
      startCapability(capability, info)
      break;
    }
  }
});

let conversation = [];
let currentCapability = null;

async function handleUserMessage(req) {
  const tabs = await new Promise(res => chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    res(tabs);
  }));
  const tabId = tabs[0].id;
  conversation.push({
    role: "user",
    content: req.content
  });

  const request = {
    "stream": true,
    "model": currentCapability.model,
    "messages": conversation
  };

  await streamResponse(request, tabId);
}

async function startCapability(capability, info) {
  const tabs = await new Promise(res => chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    res(tabs);
  }));
  const tabId = tabs[0].id;

  let context = "";
  currentCapability = capability;

  if (capability.context == "selection") {
    context = info.selectionText;
  } else if (capability.context == "document") {
    const response = await chrome.tabs.sendMessage(tabs[0].id, { action: "get_document" });
    context = response.document;
  }

  chrome.tabs.sendMessage(tabId, { action: "clear" });
  chrome.tabs.sendMessage(tabId, { action: "open", model: capability.model, title: capability.title });

  const prompt = capability.prompt.replaceAll("{context}", context);
  const systemMessage = {
    role: "system",
    content: prompt
  };
  conversation = [systemMessage];

  const request = {
    "stream": true,
    "model": capability.model,
    "messages": conversation
  };

  if (capability.need_user_input) {
    return;
  }

  await streamResponse(request, tabId);
}

async function streamResponse(request, tabId) {

  const response = await fetch("http://localhost:11434/api/chat", {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify(request)
  });

  let answer = "";
  for await (const chunk of streamAsyncIterator(response.body)) {
    const string = new TextDecoder().decode(chunk);
    for (const rawResp of string.split("\n")) {
      if (rawResp == "") {
        continue;
      }
      const resp = JSON.parse(rawResp);
      console.log(resp.response);
      chrome.tabs.sendMessage(tabId, { action: "partial_message", content: resp.message.content });
      answer += resp.message.content;
    }
  }
  conversation.push({
    role: "assistant",
    content: answer
  });
  chrome.tabs.sendMessage(tabId, { action: "done" });
}

async function* streamAsyncIterator(stream) {
  // Get a lock on the stream
  const reader = stream.getReader();

  try {
    while (true) {
      // Read from the stream
      const { done, value } = await reader.read();
      // Exit if we're done
      if (done) return;
      // Else yield the chunk
      yield value;
    }
  }
  finally {
    reader.releaseLock();
  }
}

chrome.runtime.onMessage.addListener((req, sender, _) => {
  if (req.action == "user_message") {
    handleUserMessage(req);
  }
});
