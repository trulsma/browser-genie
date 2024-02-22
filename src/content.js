
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action == "get_document") {
		sendResponse({ action: "document_content", document: document.documentElement.innerText });
	}
	if (message.action == "open") {
		showPopup();
		focusInput();
		headerEl.innerHTML = message.model;
	}
	if (message.action == "clear") {
		answerEl.innerHTML = "";
	}
	if (message.action == "done") {
		partialAnswerEl = undefined;
	}
	if (message.action == "partial_message") {
		console.log(message);
		if (!partialAnswerEl) {
			partialAnswerEl = document.createElement("p");
			partialAnswerEl.innerText = "assistant: ";
			answerEl.append(partialAnswerEl);
		}
		partialAnswerEl.innerHTML += message.content;
	}
});

function showPopup() {
	el.style.display = "flex";
}
function hidePopup() {
	el.style.display = "none";
}
function focusInput() {
	inputEl.focus();
}
function sendMessage(message) {
	const el = document.createElement("p");
	el.innerText = "user: " + message;
	answerEl.append(el);
	chrome.runtime.sendMessage({ action: "user_message", content: message });
}

const el = document.createElement("div");

el.style.position = "fixed";
el.style.height = "600px";
el.style.width = "800px";
el.style.background = "#212121";
el.style.border = "1px solid black";
el.style.zIndex = "99999999999999";
el.style.top = "calc(50vh - 300px)";
el.style.left = "calc(50vw - 400px)";
el.style.flexDirection = "column";
el.style.display = "none";
el.style.lineHeight = "1";
el.style.justifyContent = "space-between";
el.id = "brower-assistant-modal";

document.body.append(el);

const headerEl = document.createElement("h1");
headerEl.style.color = "#ececec";
headerEl.style.padding = "8px";
headerEl.style.margin = "0";
headerEl.style.fontSize = "1rem";
headerEl.style.fontFamily = "system-ui";
headerEl.style.lineHeight = "1.2";
headerEl.style.textDecoration = "underline";
// headerEl.innerHTML = "llama2";
el.append(headerEl);


const answerEl = document.createElement("div");
answerEl.style.color = "#ececec";
answerEl.style.padding = "8px";
answerEl.style.fontSize = "1.1rem";
answerEl.style.lineHeight = "1.2";
answerEl.style.margin = "0";
answerEl.style.fontFamily = "system-ui";
answerEl.style.flex = "1";
answerEl.style.overflowY = "scroll";
el.append(answerEl);
let partialAnswerEl;

const inputEl = document.createElement("input");
inputEl.type = "textarea";
inputEl.style.color = "#212121";
inputEl.style.padding = "8px";
inputEl.style.fontSize = "1.1rem";
inputEl.style.margin = "0";
inputEl.style.fontFamily = "system-ui";

inputEl.addEventListener("keyup", (evt) => {
	console.log(evt);
	if (evt.code == "Enter") {
		sendMessage(inputEl.value);
		// Add text input
		inputEl.value = "";
		console.log(evt);
	}
});

el.append(inputEl);

document.addEventListener("keyup", (evt) => {
	if (evt.code == "Space" && evt.ctrlKey) {
		if (el.style.display == "none") {
			showPopup();
			focusInput();
		} else {
			hidePopup();
		}
	}
	if (evt.code == "Escape" && el.style.display != "none") {
		hidePopup();
	}
});
