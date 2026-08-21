/* =========================================================
   KHANHOS AI - FRONTEND
========================================================= */

const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const welcome = document.getElementById("welcome");
const messages = document.getElementById("messages");
const chatArea = document.getElementById("chatArea");

const newChatBtn = document.getElementById("newChatBtn");
const searchChatBtn = document.getElementById("searchChatBtn");

const sidebarSearch = document.getElementById("sidebarSearch");
const chatSearchInput = document.getElementById("chatSearchInput");
const closeSearchBtn = document.getElementById("closeSearchBtn");

const chatList = document.getElementById("chatList");
const emptyChats = document.getElementById("emptyChats");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

const profileButton = document.getElementById("profileButton");
const accountMenu = document.getElementById("accountMenu");

const settingsBtn = document.getElementById("settingsBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const helpBtn = document.getElementById("helpBtn");

const settingsOverlay = document.getElementById("settingsOverlay");
const settingsClose = document.getElementById("settingsClose");

const settingsPageTitle =
  document.getElementById("settingsPageTitle");

const settingsPage =
  document.getElementById("settingsPage");

const themeSelect =
  document.getElementById("themeSelect");

const enterSendToggle =
  document.getElementById("enterSendToggle");

const historyToggle =
  document.getElementById("historyToggle");

const modelSelector =
  document.getElementById("modelSelector");

const modelMenu =
  document.getElementById("modelMenu");

const modelName =
  document.getElementById("modelName");

const fileButton =
  document.getElementById("fileButton");

const fileInput =
  document.getElementById("fileInput");

const contextMenu =
  document.getElementById("contextMenu");

const renameChatBtn =
  document.getElementById("renameChatBtn");

const deleteChatBtn =
  document.getElementById("deleteChatBtn");


/* =========================================================
   API CONFIG
========================================================= */

/*
  Nếu frontend và backend chạy cùng domain:

      /api/chat

  Nếu backend nằm ở domain khác, đổi thành:

      https://YOUR-BACKEND-DOMAIN/api/chat

  KHÔNG đặt API KEY ở đây.
*/

const API_URL =
  localStorage.getItem("khanhos-api-url") ||
  "/api/chat";


/* =========================================================
   MODEL
========================================================= */

let selectedProvider =
  localStorage.getItem("khanhos-provider") ||
  "openai";

let selectedModel =
  localStorage.getItem("khanhos-model") ||
  "gpt-5-mini";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
  "khanhos-chats-v2";

const SETTINGS_KEY =
  "khanhos-settings";

let chats = loadChats();

let currentChatId = null;

let aiGenerating = false;

let contextChatId = null;


/* =========================================================
   HELPERS
========================================================= */

function generateId() {

  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}


function loadChats() {

  try {

    const data =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

    return Array.isArray(data)
      ? data
      : [];

  } catch {

    return [];
  }
}


function saveChats() {

  try {

    const settings =
      loadSettings();

    if (
      settings.history === false
    ) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );

  } catch (error) {

    console.error(
      "Không thể lưu lịch sử:",
      error
    );
  }
}


function loadSettings() {

  try {

    return {
      history: true,
      enterSend: true,
      theme: "dark",
      ...JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "{}"
      )
    };

  } catch {

    return {
      history: true,
      enterSend: true,
      theme: "dark"
    };
  }
}


function saveSettings(settings) {

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}


function makeChatTitle(text) {

  const clean =
    text
      .replace(/\s+/g, " ")
      .trim();

  if (!clean) {
    return "Cuộc chat mới";
  }

  return clean.length <= 38
    ? clean
    : clean.slice(0, 38) + "...";
}


/* =========================================================
   CHAT
========================================================= */

function createChat() {

  const chat = {

    id: generateId(),

    title: "Cuộc chat mới",

    messages: [],

    createdAt: Date.now(),

    updatedAt: Date.now()

  };

  chats.unshift(chat);

  currentChatId =
    chat.id;

  saveChats();

  renderChatList();

  return chat;
}


function getCurrentChat() {

  return chats.find(
    chat =>
      chat.id === currentChatId
  ) || null;
}


function startNewChat() {

  currentChatId = null;

  messages.innerHTML = "";

  welcome.style.display = "flex";

  input.value = "";

  input.style.height = "auto";

  updateInputState();

  closeContextMenu();

  renderChatList();

  input.focus();

  if (
    window.innerWidth <= 800
  ) {
    sidebar.classList.remove("open");
  }
}


function openChat(id) {

  const chat =
    chats.find(
      item => item.id === id
    );

  if (!chat) {
    return;
  }

  currentChatId =
    chat.id;

  messages.innerHTML = "";

  if (
    chat.messages.length === 0
  ) {

    welcome.style.display =
      "flex";

  } else {

    welcome.style.display =
      "none";

    chat.messages.forEach(
      message => {

        renderMessage(
          message.text,
          message.role
        );

      }
    );
  }

  renderChatList();

  requestAnimationFrame(
    () => {

      chatArea.scrollTop =
        chatArea.scrollHeight;

    }
  );

  if (
    window.innerWidth <= 800
  ) {
    sidebar.classList.remove("open");
  }
}


/* =========================================================
   DATE GROUP
========================================================= */

function getDateLabel(timestamp) {

  const date =
    new Date(timestamp);

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return "Hôm nay";
  }

  if (
    date.toDateString() ===
    yesterday.toDateString()
  ) {
    return "Hôm qua";
  }

  return date.toLocaleDateString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


/* =========================================================
   RENDER SIDEBAR
========================================================= */

function renderChatList() {

  chatList.innerHTML = "";

  const search =
    chatSearchInput
      .value
      .trim()
      .toLowerCase();

  const filtered =
    chats.filter(chat => {

      if (!search) {
        return true;
      }

      return (
        chat.title
          .toLowerCase()
          .includes(search)
      );

    });

  emptyChats.style.display =
    filtered.length === 0
      ? "block"
      : "none";

  let lastDate = "";

  filtered.forEach(chat => {

    const dateLabel =
      getDateLabel(
        chat.updatedAt
      );

    if (
      dateLabel !== lastDate
    ) {

      const heading =
        document.createElement("div");

      heading.className =
        "recent-title";

      heading.textContent =
        dateLabel;

      chatList.appendChild(
        heading
      );

      lastDate =
        dateLabel;
    }


    const item =
      document.createElement("div");

    item.className =
      "chat-item";

    if (
      chat.id === currentChatId
    ) {
      item.classList.add("active");
    }


    const icon =
      document.createElement("span");

    icon.className =
      "chat-icon";

    icon.textContent =
      "💬";


    const name =
      document.createElement("span");

    name.className =
      "chat-name";

    name.textContent =
      chat.title;


    const more =
      document.createElement("button");

    more.className =
      "chat-more";

    more.textContent =
      "⋯";

    more.title =
      "Tùy chọn";


    item.appendChild(icon);

    item.appendChild(name);

    item.appendChild(more);

    chatList.appendChild(item);


    item.addEventListener(
      "click",
      event => {

        if (
          event.target === more
        ) {
          return;
        }

        openChat(chat.id);

      }
    );


    more.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        openContextMenu(
          chat.id,
          more
        );

      }
    );

  });
}


/* =========================================================
   CONTEXT MENU
========================================================= */

function openContextMenu(
  chatId,
  element
) {

  contextChatId =
    chatId;

  const rect =
    element.getBoundingClientRect();

  contextMenu.style.left =
    `${rect.right + 5}px`;

  contextMenu.style.top =
    `${rect.top}px`;

  contextMenu.classList.add(
    "open"
  );
}


function closeContextMenu() {

  contextMenu.classList.remove(
    "open"
  );

  contextChatId =
    null;
}


renameChatBtn.addEventListener(
  "click",
  () => {

    if (!contextChatId) {
      return;
    }

    const chat =
      chats.find(
        item =>
          item.id === contextChatId
      );

    if (!chat) {
      return;
    }

    const name =
      prompt(
        "Tên cuộc trò chuyện:",
        chat.title
      );

    if (
      name &&
      name.trim()
    ) {

      chat.title =
        name
          .trim()
          .slice(0, 80);

      chat.updatedAt =
        Date.now();

      saveChats();

      renderChatList();
    }

    closeContextMenu();

  }
);


deleteChatBtn.addEventListener(
  "click",
  () => {

    if (!contextChatId) {
      return;
    }

    const id =
      contextChatId;

    chats =
      chats.filter(
        chat =>
          chat.id !== id
      );

    if (
      currentChatId === id
    ) {

      startNewChat();

    }

    saveChats();

    renderChatList();

    closeContextMenu();

  }
);


/* =========================================================
   INPUT
========================================================= */

function updateInputState() {

  sendButton.disabled =
    aiGenerating ||
    input.value.trim() === "";
}


function resizeInput() {

  input.style.height =
    "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      180
    ) + "px";
}


input.addEventListener(
  "input",
  () => {

    resizeInput();

    updateInputState();

  }
);


input.addEventListener(
  "keydown",
  event => {

    const settings =
      loadSettings();

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      settings.enterSend
    ) {

      event.preventDefault();

      sendMessage();
    }

  }
);


sendButton.addEventListener(
  "click",
  sendMessage
);


/* =========================================================
   RENDER MESSAGE
========================================================= */

function renderMessage(
  text,
  role,
  isError = false
) {

  const message =
    document.createElement("div");

  message.className =
    `message ${role}`;


  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent =
    role === "ai"
      ? "K"
      : "U";


  const content =
    document.createElement("div");

  content.className =
    "message-content";

  if (isError) {
    content.classList.add(
      "error"
    );
  }

  content.textContent =
    text;


  message.appendChild(
    avatar
  );

  message.appendChild(
    content
  );

  messages.appendChild(
    message
  );


  requestAnimationFrame(
    () => {

      chatArea.scrollTop =
        chatArea.scrollHeight;

    }
  );

  return message;
}


/* =========================================================
   THINKING
========================================================= */

function showThinking() {

  const message =
    document.createElement("div");

  message.className =
    "message ai";

  message.dataset.thinking =
    "true";


  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent =
    "K";


  const content =
    document.createElement("div");

  content.className =
    "message-content";

  content.innerHTML = `
    KhanhOS AI đang suy nghĩ
    <span class="thinking-dots">
      <span></span>
      <span></span>
      <span></span>
    </span>
  `;


  message.appendChild(
    avatar
  );

  message.appendChild(
    content
  );

  messages.appendChild(
    message
  );


  requestAnimationFrame(
    () => {

      chatArea.scrollTop =
        chatArea.scrollHeight;

    }
  );

  return message;
}


/* =========================================================
   AI REQUEST
========================================================= */

async function askKhanhOSAI(
  chat
) {

  const history =
    chat.messages
      .filter(
        message =>
          message.role === "user" ||
          message.role === "ai"
      )
      .map(
        message => ({
          role:
            message.role === "ai"
              ? "assistant"
              : "user",

          content:
            message.text
        })
      );


  const response =
    await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            provider:
              selectedProvider,

            model:
              selectedModel,

            messages:
              history

          })
      }
    );


  let data;

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  if (
    contentType.includes(
      "application/json"
    )
  ) {

    data =
      await response.json();

  } else {

    const text =
      await response.text();

    throw new Error(
      text ||
      `HTTP ${response.status}`
    );
  }


  if (!response.ok) {

    throw new Error(
      data.error ||
      `Server lỗi HTTP ${response.status}`
    );
  }


  if (
    typeof data.reply !==
    "string"
  ) {

    throw new Error(
      "Server không trả về trường reply hợp lệ."
    );
  }


  return data.reply;
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

  if (aiGenerating) {
    return;
  }


  const text =
    input.value.trim();

  if (!text) {
    return;
  }


  let chat =
    getCurrentChat();


  if (!chat) {

    chat =
      createChat();

  }


  if (
    chat.messages.length === 0
  ) {

    chat.title =
      makeChatTitle(text);
  }


  chat.messages.push({

    role: "user",

    text,

    createdAt: Date.now()

  });


  chat.updatedAt =
    Date.now();


  saveChats();

  renderChatList();


  welcome.style.display =
    "none";


  renderMessage(
    text,
    "user"
  );


  input.value = "";

  input.style.height =
    "auto";


  aiGenerating =
    true;

  updateInputState();


  const thinking =
    showThinking();


  try {

    const reply =
      await askKhanhOSAI(
        chat
      );


    const activeChat =
      chats.find(
        item =>
          item.id === chat.id
      );


    if (!activeChat) {
      return;
    }


    activeChat.messages.push({

      role: "ai",

      text: reply,

      createdAt: Date.now()

    });


    activeChat.updatedAt =
      Date.now();


    saveChats();


    thinking.remove();


    if (
      currentChatId ===
      activeChat.id
    ) {

      renderMessage(
        reply,
        "ai"
      );

    }

  } catch (error) {

    console.error(
      "KhanhOS AI:",
      error
    );


    thinking.remove();


    const errorText =
      `❌ Không thể kết nối KhanhOS AI.\n\n${error.message}`;


    const activeChat =
      chats.find(
        item =>
          item.id === chat.id
      );


    if (activeChat) {

      activeChat.messages.push({

        role: "ai",

        text: errorText,

        createdAt: Date.now()

      });

      activeChat.updatedAt =
        Date.now();

      saveChats();

    }


    if (
      currentChatId ===
      chat.id
    ) {

      renderMessage(
        errorText,
        "ai",
        true
      );

    }

  } finally {

    aiGenerating =
      false;

    updateInputState();

    renderChatList();

  }
}


/* =========================================================
   NEW CHAT
========================================================= */

newChatBtn.addEventListener(
  "click",
  startNewChat
);


/* =========================================================
   SEARCH
========================================================= */

searchChatBtn.addEventListener(
  "click",
  () => {

    sidebarSearch.classList.add(
      "open"
    );

    chatSearchInput.focus();

  }
);


closeSearchBtn.addEventListener(
  "click",
  () => {

    sidebarSearch.classList.remove(
      "open"
    );

    chatSearchInput.value = "";

    renderChatList();

  }
);


chatSearchInput.addEventListener(
  "input",
  renderChatList
);


/* =========================================================
   MOBILE
========================================================= */

mobileMenu.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );

  }
);


/* =========================================================
   PROFILE
========================================================= */

profileButton.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    accountMenu.classList.toggle(
      "open"
    );

  }
);


document.addEventListener(
  "click",
  event => {

    if (
      !accountMenu.contains(
        event.target
      ) &&
      event.target !==
        profileButton
    ) {

      accountMenu.classList.remove(
        "open"
      );

    }

    if (
      !contextMenu.contains(
        event.target
      )
    ) {

      closeContextMenu();

    }

  }
);


/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {

  settingsOverlay.classList.add(
    "open"
  );

  accountMenu.classList.remove(
    "open"
  );

}


function closeSettings() {

  settingsOverlay.classList.remove(
    "open"
  );

}


settingsBtn.addEventListener(
  "click",
  openSettings
);


settingsClose.addEventListener(
  "click",
  closeSettings
);


settingsOverlay.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      settingsOverlay
    ) {

      closeSettings();

    }

  }
);


/* SETTINGS PAGES */

document
  .querySelectorAll(
    ".settings-nav-item"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".settings-nav-item"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );

          button.classList.add(
            "active"
          );


          const page =
            button.dataset.page;


          const titles = {

            general:
              "Chung",

            appearance:
              "Giao diện",

            notifications:
              "Thông báo",

            data:
              "Dữ liệu",

            security:
              "Bảo mật"

          };


          settingsPageTitle.textContent =
            titles[page] ||
            "Cài đặt";


          if (
            page === "general"
          ) {

            settingsPage.innerHTML = `
              <div class="upgrade-card">
                <div>
                  <strong>KhanhOS Free</strong>
                  <p>Bạn đang sử dụng KhanhOS AI.</p>
                </div>
                <span class="free-badge">FREE</span>
              </div>

              <div class="setting-row">
                <div class="setting-text">
                  <strong>Giao diện</strong>
                  <p>Chọn giao diện KhanhOS.</p>
                </div>

                <select id="themeSelect">
                  <option value="dark">Tối</option>
                  <option value="light">Sáng</option>
                </select>
              </div>

              <div class="setting-row">
                <div class="setting-text">
                  <strong>Gửi bằng Enter</strong>
                  <p>Enter để gửi, Shift + Enter để xuống dòng.</p>
                </div>

                <label class="switch">
                  <input type="checkbox" id="enterSendToggle">
                  <span></span>
                </label>
              </div>

              <div class="setting-row">
                <div class="setting-text">
                  <strong>Lưu lịch sử</strong>
                  <p>Lưu cuộc trò chuyện trên thiết bị.</p>
                </div>

                <label class="switch">
                  <input type="checkbox" id="historyToggle">
                  <span></span>
                </label>
              </div>
            `;

            bindSettings();

          } else {

            settingsPage.innerHTML = `
              <div class="upgrade-card">
                <div>
                  <strong>${titles[page]}</strong>
                  <p>
                    Khu vực này đang được KhanhOS phát triển.
                  </p>
                </div>
              </div>
            `;

          }

        }

      );

    }
  );


function bindSettings() {

  const settings =
    loadSettings();


  const theme =
    document.getElementById(
      "themeSelect"
    );

  const enter =
    document.getElementById(
      "enterSendToggle"
    );

  const history =
    document.getElementById(
      "historyToggle"
    );


  if (theme) {

    theme.value =
      settings.theme;

    theme.addEventListener(
      "change",
      () => {

        settings.theme =
          theme.value;

        saveSettings(
          settings
        );

        applyTheme();

      }
    );

  }


  if (enter) {

    enter.checked =
      settings.enterSend;

    enter.addEventListener(
      "change",
      () => {

        settings.enterSend =
          enter.checked;

        saveSettings(
          settings
        );

      }
    );

  }


  if (history) {

    history.checked =
      settings.history;

    history.addEventListener(
      "change",
      () => {

        settings.history =
          history.checked;

        saveSettings(
          settings
        );

      }
    );

  }
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

  const settings =
    loadSettings();

  document.body.classList.toggle(
    "light",
    settings.theme === "light"
  );

}


applyTheme();

bindSettings();


/* =========================================================
   MODEL SELECTOR
========================================================= */

modelSelector.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    modelMenu.classList.toggle(
      "open"
    );

  }
);


document
  .querySelectorAll(
    ".model-option"
  )
  .forEach(
    option => {

      option.addEventListener(
        "click",
        () => {

          selectedProvider =
            option.dataset.provider;

          selectedModel =
            option.dataset.model;

          modelName.textContent =
            option.dataset.name;


          localStorage.setItem(
            "khanhos-provider",
            selectedProvider
          );

          localStorage.setItem(
            "khanhos-model",
            selectedModel
          );


          document
            .querySelectorAll(
              ".model-option"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );

          option.classList.add(
            "active"
          );

          modelMenu.classList.remove(
            "open"
          );

        }
      );

    }
  );


document.addEventListener(
  "click",
  () => {

    modelMenu.classList.remove(
      "open"
    );

  }
);


/* =========================================================
   FILE
========================================================= */

fileButton.addEventListener(
  "click",
  () => {

    fileInput.click();

  }
);


fileInput.addEventListener(
  "change",
  () => {

    if (
      fileInput.files.length
    ) {

      const names =
        Array.from(
          fileInput.files
        )
        .map(
          file => file.name
        )
        .join(", ");

      input.value +=
        input.value
          ? `\n[File: ${names}]`
          : `[File: ${names}]`;

      updateInputState();

    }

  }
);


/* =========================================================
   CLEAR HISTORY
========================================================= */

clearHistoryBtn.addEventListener(
  "click",
  () => {

    const ok =
      confirm(
        "Xóa toàn bộ lịch sử trò chuyện?"
      );

    if (!ok) {
      return;
    }

    chats = [];

    localStorage.removeItem(
      STORAGE_KEY
    );

    startNewChat();

    accountMenu.classList.remove(
      "open"
    );

  }
);


/* =========================================================
   HELP
========================================================= */

helpBtn.addEventListener(
  "click",
  () => {

    alert(
      "KhanhOS AI\n\n" +
      "• Chat mới: tạo cuộc trò chuyện\n" +
      "• Tìm kiếm: tìm lịch sử chat\n" +
      "• Model: chọn AI\n" +
      "• Cài đặt: thay đổi giao diện và lịch sử"
    );

    accountMenu.classList.remove(
      "open"
    );

  }
);


/* =========================================================
   INIT
========================================================= */

function init() {

  if (chats.length > 0) {

    openChat(
      chats[0].id
    );

  } else {

    startNewChat();

  }

  renderChatList();

  modelName.textContent =
    document
      .querySelector(
        `.model-option[data-model="${selectedModel}"]`
      )
      ?.dataset.name ||
    "GPT-5 mini";

}


init();
