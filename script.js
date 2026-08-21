"use strict";

/*
|--------------------------------------------------------------------------
| KhanhOS Frontend
|--------------------------------------------------------------------------
*/

const STORAGE_KEY = "khanhos_chats";
const SETTINGS_KEY = "khanhos_settings";

const state = {
  chats: [],
  currentChatId: null,
  selectedModel: "KhanhOS",
  isGenerating: false,
  attachedFiles: []
};

const defaultSettings = {
  username: "Khanh",
  theme: "dark"
};


/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  sidebar: $("#sidebar"),

  newChatBtn: $("#newChatBtn"),
  searchBtn: $("#searchBtn"),
  settingsBtn: $("#settingsBtn"),

  chatHistory: $("#chatHistory"),

  messages: $("#messages"),
  welcome: $("#welcome"),

  composer: $("#composer"),
  messageInput: $("#messageInput"),
  sendBtn: $("#sendBtn"),

  attachBtn: $("#attachBtn"),
  fileInput: $("#fileInput"),

  modelSelector: $("#modelSelector"),
  modelMenu: $("#modelMenu"),
  currentModel: $("#currentModel"),

  searchModal: $("#searchModal"),
  searchInput: $("#searchInput"),
  searchResults: $("#searchResults"),

  settingsModal: $("#settingsModal"),

  accountBtn: $("#accountBtn"),
  headerAccountBtn: $("#headerAccountBtn"),
  accountMenu: $("#accountMenu"),

  mobileMenuBtn: $("#mobileMenuBtn"),

  themeToggle: $("#themeToggle"),
  changeNameBtn: $("#changeNameBtn"),
  clearHistoryBtn: $("#clearHistoryBtn"),

  menuSettingsBtn: $("#menuSettingsBtn"),
  menuNewChatBtn: $("#menuNewChatBtn"),

  sidebarUsername: $("#sidebarUsername"),
  menuUsername: $("#menuUsername"),
  currentUsername: $("#currentUsername"),

  toast: $("#toast")
};


/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
*/

function getSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return { ...defaultSettings };
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved)
    };

  } catch {
    return { ...defaultSettings };
  }
}


function saveSettings(settings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}


function updateUserUI() {
  const settings = getSettings();

  elements.sidebarUsername.textContent =
    settings.username;

  elements.menuUsername.textContent =
    settings.username;

  elements.currentUsername.textContent =
    settings.username;

  const firstLetter =
    settings.username.trim().charAt(0).toUpperCase() || "K";

  $("#sidebarAvatar").textContent = firstLetter;
  elements.headerAccountBtn.textContent = firstLetter;
  $(".big-avatar").textContent = firstLetter;
}


function applyTheme() {
  const settings = getSettings();

  document.documentElement.dataset.theme =
    settings.theme;

  elements.themeToggle.textContent =
    settings.theme === "dark"
      ? "Tối"
      : "Sáng";
}


/*
|--------------------------------------------------------------------------
| CHAT STORAGE
|--------------------------------------------------------------------------
*/

function loadChats() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    state.chats =
      saved ? JSON.parse(saved) : [];

  } catch {
    state.chats = [];
  }

  renderHistory();
}


function saveChats() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state.chats)
  );
}


/*
|--------------------------------------------------------------------------
| CHAT CREATION
|--------------------------------------------------------------------------
*/

function createChat() {

  /*
   * Không tạo lịch sử ngay khi bấm "Chat mới".
   * Chỉ tạo chat thật khi user gửi tin đầu tiên.
   */

  state.currentChatId = null;

  clearMessages();

  elements.welcome.style.display = "flex";

  elements.messageInput.value = "";

  updateSendButton();

  closeAllMenus();

  elements.messageInput.focus();
}


function createRealChat(firstMessage) {

  const chat = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(),

    title: generateTitle(firstMessage),

    model: state.selectedModel,

    createdAt: Date.now(),

    updatedAt: Date.now(),

    messages: []
  };

  state.chats.unshift(chat);

  state.currentChatId = chat.id;

  saveChats();

  return chat;
}


function generateTitle(text) {

  const clean = text
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= 32) {
    return clean;
  }

  return clean.substring(0, 32) + "...";
}


function getCurrentChat() {

  return state.chats.find(
    chat => chat.id === state.currentChatId
  );
}


/*
|--------------------------------------------------------------------------
| LOAD CHAT
|--------------------------------------------------------------------------
*/

function openChat(chatId) {

  const chat =
    state.chats.find(
      chat => chat.id === chatId
    );

  if (!chat) return;

  state.currentChatId = chat.id;

  clearMessages();

  elements.welcome.style.display = "none";

  chat.messages.forEach(message => {
    renderMessage(
      message.role,
      message.content
    );
  });

  renderHistory();

  closeAllMenus();

  elements.messageInput.focus();
}


/*
|--------------------------------------------------------------------------
| MESSAGE RENDER
|--------------------------------------------------------------------------
*/

function clearMessages() {
  elements.messages.innerHTML = "";
}


function renderMessage(role, content) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    `message-row ${role}`;

  const message =
    document.createElement("div");

  message.className = "message";

  if (role === "user") {

    message.textContent = content;

  } else {

    message.innerHTML =
      formatAIMessage(content);
  }

  wrapper.appendChild(message);

  elements.messages.appendChild(wrapper);

  scrollToBottom();

  return wrapper;
}


function formatAIMessage(text) {

  if (!text) return "";

  let escaped = escapeHTML(text);

  /*
   * Code blocks
   */

  escaped = escaped.replace(
    /```([\s\S]*?)```/g,
    "<pre><code>$1</code></pre>"
  );

  /*
   * Inline code
   */

  escaped = escaped.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );

  /*
   * Bold
   */

  escaped = escaped.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  /*
   * Line breaks
   */

  escaped = escaped.replace(
    /\n/g,
    "<br>"
  );

  return escaped;
}


function escapeHTML(text) {

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/*
|--------------------------------------------------------------------------
| SEND MESSAGE
|--------------------------------------------------------------------------
*/

async function sendMessage() {

  const text =
    elements.messageInput.value.trim();

  if (!text || state.isGenerating) {
    return;
  }

  /*
   * Nếu chưa có chat thật thì tạo ở đây.
   */

  let chat = getCurrentChat();

  if (!chat) {
    chat = createRealChat(text);
  }

  elements.welcome.style.display = "none";

  /*
   * User message
   */

  chat.messages.push({
    role: "user",
    content: text,
    timestamp: Date.now()
  });

  chat.updatedAt = Date.now();

  renderMessage("user", text);

  elements.messageInput.value = "";

  autoResizeTextarea();

  updateSendButton();

  renderHistory();

  saveChats();

  /*
   * AI loading
   */

  state.isGenerating = true;

  const loading =
    createLoadingMessage();

  try {

    const response =
      await callChatAPI(
        chat.messages,
        chat.model
      );

    loading.remove();

    const aiText =
      response.message ||
      response.content ||
      response.reply ||
      "KhanhOS không nhận được phản hồi.";

    chat.messages.push({
      role: "assistant",
      content: aiText,
      timestamp: Date.now()
    });

    chat.updatedAt = Date.now();

    renderMessage(
      "assistant",
      aiText
    );

    saveChats();

    renderHistory();

  } catch (error) {

    loading.remove();

    console.error(error);

    const errorText =
      "Không thể kết nối tới KhanhOS API. Kiểm tra server.js và endpoint `/api/chat`.";

    chat.messages.push({
      role: "assistant",
      content: errorText,
      timestamp: Date.now()
    });

    renderMessage(
      "assistant",
      errorText
    );

    saveChats();

  } finally {

    state.isGenerating = false;

    updateSendButton();

    elements.messageInput.focus();
  }
}


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

async function callChatAPI(messages, model) {

  const response =
    await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model,
        messages
      })
    });

  if (!response.ok) {

    let errorMessage =
      `API error ${response.status}`;

    try {

      const error =
        await response.json();

      if (error.message) {
        errorMessage = error.message;
      }

    } catch {}

    throw new Error(errorMessage);
  }

  return response.json();
}


/*
|--------------------------------------------------------------------------
| LOADING MESSAGE
|--------------------------------------------------------------------------
*/

function createLoadingMessage() {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message-row assistant";

  const message =
    document.createElement("div");

  message.className =
    "message loading-message";

  message.innerHTML = `
    <span class="loading-dot"></span>
    <span class="loading-dot"></span>
    <span class="loading-dot"></span>
  `;

  wrapper.appendChild(message);

  elements.messages.appendChild(wrapper);

  scrollToBottom();

  return wrapper;
}


/*
|--------------------------------------------------------------------------
| HISTORY
|--------------------------------------------------------------------------
*/

function renderHistory() {

  if (!state.chats.length) {

    elements.chatHistory.innerHTML = `
      <div class="empty-history">
        Chưa có cuộc trò chuyện
      </div>
    `;

    return;
  }

  elements.chatHistory.innerHTML = "";

  state.chats
    .sort((a, b) =>
      b.updatedAt - a.updatedAt
    )
    .forEach(chat => {

      const item =
        document.createElement("div");

      item.className =
        "history-item";

      if (chat.id === state.currentChatId) {
        item.classList.add("active");
      }

      item.innerHTML = `
        <button class="history-main">
          <span class="history-icon">💬</span>
          <span class="history-title-text">
            ${escapeHTML(chat.title)}
          </span>
        </button>

        <button class="history-more">
          ⋯
        </button>

        <div class="history-menu">
          <button data-action="rename">
            ✏️ Đổi tên
          </button>

          <button data-action="delete">
            🗑️ Xóa
          </button>
        </div>
      `;

      const mainButton =
        item.querySelector(".history-main");

      const moreButton =
        item.querySelector(".history-more");

      const menu =
        item.querySelector(".history-menu");

      mainButton.addEventListener(
        "click",
        () => openChat(chat.id)
      );

      moreButton.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          document
            .querySelectorAll(".history-menu.open")
            .forEach(m => {
              if (m !== menu) {
                m.classList.remove("open");
              }
            });

          menu.classList.toggle("open");
        }
      );

      menu.addEventListener(
        "click",
        event => {

          const action =
            event.target.dataset.action;

          if (action === "rename") {
            renameChat(chat.id);
          }

          if (action === "delete") {
            deleteChat(chat.id);
          }

        }
      );

      elements.chatHistory.appendChild(item);
    });
}


/*
|--------------------------------------------------------------------------
| RENAME CHAT
|--------------------------------------------------------------------------
*/

function renameChat(chatId) {

  const chat =
    state.chats.find(
      c => c.id === chatId
    );

  if (!chat) return;

  const name =
    prompt(
      "Tên mới của cuộc trò chuyện:",
      chat.title
    );

  if (!name || !name.trim()) {
    return;
  }

  chat.title =
    name.trim();

  chat.updatedAt =
    Date.now();

  saveChats();

  renderHistory();
}


/*
|--------------------------------------------------------------------------
| DELETE CHAT
|--------------------------------------------------------------------------
*/

function deleteChat(chatId) {

  const chat =
    state.chats.find(
      c => c.id === chatId
    );

  if (!chat) return;

  const confirmed =
    confirm(
      `Xóa cuộc trò chuyện "${chat.title}"?`
    );

  if (!confirmed) return;

  state.chats =
    state.chats.filter(
      c => c.id !== chatId
    );

  if (state.currentChatId === chatId) {
    createChat();
  }

  saveChats();

  renderHistory();

  showToast("Đã xóa cuộc trò chuyện");
}


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

function openSearch() {

  elements.searchModal.classList.add("open");

  elements.searchInput.value = "";

  renderSearchResults("");

  setTimeout(
    () => elements.searchInput.focus(),
    100
  );
}


function renderSearchResults(query) {

  const clean =
    query.trim().toLowerCase();

  if (!clean) {

    elements.searchResults.innerHTML = `
      <div class="search-empty">
        Nhập từ khóa để tìm kiếm
      </div>
    `;

    return;
  }

  const results =
    state.chats.filter(chat => {

      const titleMatch =
        chat.title
          .toLowerCase()
          .includes(clean);

      const messageMatch =
        chat.messages.some(message =>
          message.content
            .toLowerCase()
            .includes(clean)
        );

      return titleMatch || messageMatch;
    });

  if (!results.length) {

    elements.searchResults.innerHTML = `
      <div class="search-empty">
        Không tìm thấy cuộc trò chuyện
      </div>
    `;

    return;
  }

  elements.searchResults.innerHTML = "";

  results.forEach(chat => {

    const item =
      document.createElement("button");

    item.className =
      "search-result";

    item.innerHTML = `
      <span>💬</span>
      <div>
        <strong>
          ${escapeHTML(chat.title)}
        </strong>

        <small>
          ${chat.messages.length} tin nhắn
        </small>
      </div>
    `;

    item.addEventListener(
      "click",
      () => {

        openChat(chat.id);

        elements.searchModal
          .classList.remove("open");
      }
    );

    elements.searchResults.appendChild(item);
  });
}


/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
*/

function openSettings() {

  elements.settingsModal
    .classList.add("open");

  closeAccountMenu();
}


function changeUsername() {

  const settings =
    getSettings();

  const name =
    prompt(
      "Nhập tên tài khoản:",
      settings.username
    );

  if (!name || !name.trim()) {
    return;
  }

  settings.username =
    name.trim();

  saveSettings(settings);

  updateUserUI();

  showToast("Đã cập nhật tên");
}


function toggleTheme() {

  const settings =
    getSettings();

  settings.theme =
    settings.theme === "dark"
      ? "light"
      : "dark";

  saveSettings(settings);

  applyTheme();
}


function clearAllHistory() {

  if (!state.chats.length) {
    showToast("Lịch sử đang trống");
    return;
  }

  const confirmed =
    confirm(
      "Xóa toàn bộ lịch sử trò chuyện?"
    );

  if (!confirmed) {
    return;
  }

  state.chats = [];

  state.currentChatId = null;

  saveChats();

  createChat();

  renderHistory();

  showToast("Đã xóa toàn bộ lịch sử");
}


/*
|--------------------------------------------------------------------------
| MODEL SELECTOR
|--------------------------------------------------------------------------
*/

function toggleModelMenu() {

  elements.modelMenu
    .classList.toggle("open");
}


function selectModel(model) {

  state.selectedModel = model;

  elements.currentModel.textContent =
    model;

  elements.modelMenu
    .classList.remove("open");

  const buttons =
    elements.modelMenu.querySelectorAll(
      "button"
    );

  buttons.forEach(button => {

    const selected =
      button.dataset.model === model;

    button.classList.toggle(
      "selected",
      selected
    );

    const check =
      button.querySelector("span:last-child");

    if (check) {
      check.textContent =
        selected ? "✓" : "";
    }
  });

  const chat =
    getCurrentChat();

  if (chat) {
    chat.model = model;
    saveChats();
  }
}


/*
|--------------------------------------------------------------------------
| FILE ATTACHMENT
|--------------------------------------------------------------------------
*/

function openFilePicker() {
  elements.fileInput.click();
}


function handleFiles(files) {

  state.attachedFiles =
    Array.from(files);

  if (!state.attachedFiles.length) {
    return;
  }

  showToast(
    `${state.attachedFiles.length} file đã được chọn`
  );
}


/*
|--------------------------------------------------------------------------
| TEXTAREA
|--------------------------------------------------------------------------
*/

function autoResizeTextarea() {

  const input =
    elements.messageInput;

  input.style.height = "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      180
    ) + "px";
}


function updateSendButton() {

  const hasText =
    elements.messageInput.value.trim()
      .length > 0;

  elements.sendBtn.disabled =
    !hasText ||
    state.isGenerating;
}


/*
|--------------------------------------------------------------------------
| UI
|--------------------------------------------------------------------------
*/

function scrollToBottom() {

  requestAnimationFrame(() => {

    elements.messages.scrollTop =
      elements.messages.scrollHeight;

  });
}


function closeAccountMenu() {

  elements.accountMenu
    .classList.remove("open");
}


function closeAllMenus() {

  elements.modelMenu
    .classList.remove("open");

  closeAccountMenu();

  document
    .querySelectorAll(".history-menu.open")
    .forEach(menu =>
      menu.classList.remove("open")
    );
}


function showToast(message) {

  elements.toast.textContent =
    message;

  elements.toast.classList.add("show");

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    setTimeout(() => {

      elements.toast.classList.remove(
        "show"
      );

    }, 2200);
}


/*
|--------------------------------------------------------------------------
| ACCOUNT
|--------------------------------------------------------------------------
*/

function toggleAccountMenu() {

  elements.accountMenu
    .classList.toggle("open");

  elements.modelMenu
    .classList.remove("open");
}


/*
|--------------------------------------------------------------------------
| MOBILE SIDEBAR
|--------------------------------------------------------------------------
*/

function toggleSidebar() {

  elements.sidebar
    .classList.toggle("mobile-open");
}


/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

elements.newChatBtn.addEventListener(
  "click",
  createChat
);


elements.menuNewChatBtn.addEventListener(
  "click",
  createChat
);


elements.searchBtn.addEventListener(
  "click",
  openSearch
);


$("#headerSearchBtn").addEventListener(
  "click",
  openSearch
);


elements.settingsBtn.addEventListener(
  "click",
  openSettings
);


elements.menuSettingsBtn.addEventListener(
  "click",
  openSettings
);


elements.modelSelector.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleModelMenu();
  }
);


elements.modelMenu
  .querySelectorAll("button[data-model]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () =>
        selectModel(
          button.dataset.model
        )
    );

  });


elements.accountBtn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleAccountMenu();
  }
);


elements.headerAccountBtn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleAccountMenu();
  }
);


elements.mobileMenuBtn.addEventListener(
  "click",
  toggleSidebar
);


elements.attachBtn.addEventListener(
  "click",
  openFilePicker
);


elements.fileInput.addEventListener(
  "change",
  event =>
    handleFiles(event.target.files)
);


elements.messageInput.addEventListener(
  "input",
  () => {

    autoResizeTextarea();

    updateSendButton();
  }
);


elements.messageInput.addEventListener(
  "keydown",
  event => {

    /*
     * Enter = gửi
     * Shift + Enter = xuống dòng
     */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();
    }
  }
);


elements.composer.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    sendMessage();
  }
);


elements.searchInput.addEventListener(
  "input",
  event =>
    renderSearchResults(
      event.target.value
    )
);


elements.themeToggle.addEventListener(
  "click",
  toggleTheme
);


elements.changeNameBtn.addEventListener(
  "click",
  changeUsername
);


elements.clearHistoryBtn.addEventListener(
  "click",
  clearAllHistory
);


/*
|--------------------------------------------------------------------------
| CLOSE BUTTONS
|--------------------------------------------------------------------------
*/

$$("[data-close]").forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const target =
        document.getElementById(
          button.dataset.close
        );

      if (target) {
        target.classList.remove("open");
      }
    }
  );

});


/*
|--------------------------------------------------------------------------
| OUTSIDE CLICK
|--------------------------------------------------------------------------
*/

document.addEventListener(
  "click",
  event => {

    if (
      !elements.modelMenu.contains(event.target) &&
      !elements.modelSelector.contains(event.target)
    ) {
      elements.modelMenu
        .classList.remove("open");
    }

    if (
      !elements.accountMenu.contains(event.target) &&
      !elements.accountBtn.contains(event.target) &&
      !elements.headerAccountBtn.contains(event.target)
    ) {
      closeAccountMenu();
    }

  }
);


/*
|--------------------------------------------------------------------------
| ESCAPE
|--------------------------------------------------------------------------
*/

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") {
      return;
    }

    closeAllMenus();

    elements.searchModal
      .classList.remove("open");

    elements.settingsModal
      .classList.remove("open");
  }
);


/*
|--------------------------------------------------------------------------
| INIT
|--------------------------------------------------------------------------
*/

function init() {

  loadChats();

  updateUserUI();

  applyTheme();

  updateSendButton();

  selectModel(
    state.selectedModel
  );

  /*
   * Luôn bắt đầu ở trạng thái Chat mới.
   * Chat cũ chỉ hiện trong sidebar.
   */

  state.currentChatId = null;

  clearMessages();

  elements.welcome.style.display =
    "flex";

  elements.messageInput.focus();
}


init();
