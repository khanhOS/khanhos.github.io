"use strict";

/* =========================================================
   KHANHOS FRONTEND
========================================================= */

const STORAGE_KEY = "khanhos_chats";
const SETTINGS_KEY = "khanhos_settings";

const state = {
  chats: [],
  currentChatId: null,

  selectedModel: "KhanhOS",
  selectedProvider: "openai",
  selectedApiModel: "gpt-5-mini",

  isGenerating: false,
  attachedFiles: []
};

const defaultSettings = {
  username: "Khanh",
  theme: "dark"
};


/* =========================================================
   DOM
========================================================= */

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const elements = {
  sidebar: $("#sidebar"),
  mobileOverlay: $("#mobileOverlay"),

  brandButton: $("#brandButton"),

  newChatBtn: $("#newChatBtn"),
  searchBtn: $("#searchBtn"),
  settingsBtn: $("#settingsBtn"),

  chatHistory: $("#chatHistory"),

  chatArea: $("#chatArea"),
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

  sidebarAvatar: $("#sidebarAvatar"),
  bigAvatar: $("#bigAvatar"),

  toast: $("#toast")
};


/* =========================================================
   SETTINGS
========================================================= */

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

  const username =
    settings.username?.trim() || "Khanh";

  const firstLetter =
    username.charAt(0).toUpperCase();

  elements.sidebarUsername.textContent = username;
  elements.menuUsername.textContent = username;
  elements.currentUsername.textContent = username;

  elements.sidebarAvatar.textContent = firstLetter;
  elements.headerAccountBtn.textContent = firstLetter;
  elements.bigAvatar.textContent = firstLetter;
}


function applyTheme() {
  const settings = getSettings();

  document.body.classList.toggle(
    "light",
    settings.theme === "light"
  );

  elements.themeToggle.textContent =
    settings.theme === "dark"
      ? "Tối"
      : "Sáng";
}


/* =========================================================
   STORAGE
========================================================= */

function loadChats() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    state.chats =
      saved ? JSON.parse(saved) : [];

    if (!Array.isArray(state.chats)) {
      state.chats = [];
    }

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


/* =========================================================
   CHAT
========================================================= */

function createChat() {
  state.currentChatId = null;

  clearMessages();

  elements.welcome.style.display = "flex";

  elements.messageInput.value = "";

  autoResizeTextarea();
  updateSendButton();

  closeAllMenus();
  closeMobileSidebar();

  elements.messageInput.focus();
}


function createRealChat(firstMessage) {
  const chat = {
    id:
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),

    title: generateTitle(firstMessage),

    model: state.selectedModel,
    provider: state.selectedProvider,
    apiModel: state.selectedApiModel,

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
  const clean =
    text
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


/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(chatId) {
  const chat =
    state.chats.find(
      chat => chat.id === chatId
    );

  if (!chat) return;

  state.currentChatId = chat.id;

  if (chat.model) {
    state.selectedModel = chat.model;
  }

  if (chat.provider) {
    state.selectedProvider = chat.provider;
  }

  if (chat.apiModel) {
    state.selectedApiModel = chat.apiModel;
  }

  elements.currentModel.textContent =
    state.selectedModel;

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
  closeMobileSidebar();

  requestAnimationFrame(() => {
    elements.chatArea.scrollTop =
      elements.chatArea.scrollHeight;
  });

  elements.messageInput.focus();
}


/* =========================================================
   MESSAGES
========================================================= */

function clearMessages() {
  elements.messages.innerHTML = "";
}


function renderMessage(role, content) {
  const wrapper =
    document.createElement("div");

  wrapper.className =
    `message-row ${role === "assistant" ? "assistant" : "user"}`;

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

  escaped = escaped.replace(
    /```([\s\S]*?)```/g,
    "<pre><code>$1</code></pre>"
  );

  escaped = escaped.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );

  escaped = escaped.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  escaped = escaped.replace(
    /\n/g,
    "<br>"
  );

  return escaped;
}


function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   SEND
========================================================= */

async function sendMessage() {
  const text =
    elements.messageInput.value.trim();

  if (!text || state.isGenerating) {
    return;
  }

  let chat = getCurrentChat();

  if (!chat) {
    chat = createRealChat(text);
  }

  elements.welcome.style.display = "none";

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

  state.isGenerating = true;

  const loading =
    createLoadingMessage();

  try {
    const response =
      await callChatAPI(
        chat.messages,
        chat.provider || state.selectedProvider,
        chat.apiModel || state.selectedApiModel
      );

    loading.remove();

    const aiText =
      response.message ||
      response.content ||
      response.reply ||
      response.text ||
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
      error?.message ||
      "Không thể kết nối tới KhanhOS API.";

    chat.messages.push({
      role: "assistant",
      content:
        `⚠️ ${errorText}`,
      timestamp: Date.now()
    });

    renderMessage(
      "assistant",
      `⚠️ ${errorText}`
    );

    saveChats();

  } finally {
    state.isGenerating = false;

    updateSendButton();

    elements.messageInput.focus();
  }
}


/* =========================================================
   API
========================================================= */

async function callChatAPI(
  messages,
  provider,
  model
) {
  const response =
    await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        provider,
        model,
        messages
      })
    });

  let data = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `API trả về dữ liệu không hợp lệ (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `API error ${response.status}`
    );
  }

  return data;
}


/* =========================================================
   LOADING
========================================================= */

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


/* =========================================================
   HISTORY
========================================================= */

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
    .sort(
      (a, b) =>
        (b.updatedAt || 0) -
        (a.updatedAt || 0)
    )
    .forEach(chat => {
      const item =
        document.createElement("div");

      item.className =
        "history-item";

      if (
        chat.id ===
        state.currentChatId
      ) {
        item.classList.add("active");
      }

      item.innerHTML = `
        <button
          class="history-main"
          type="button"
        >
          <span class="history-icon">
            💬
          </span>

          <span class="history-title-text">
            ${escapeHTML(
              chat.title || "Cuộc trò chuyện"
            )}
          </span>
        </button>

        <button
          class="history-more"
          type="button"
          title="Tùy chọn"
        >
          ⋯
        </button>

        <div class="history-menu">

          <button
            type="button"
            data-action="rename"
          >
            ✏️ Đổi tên
          </button>

          <button
            type="button"
            data-action="delete"
          >
            🗑️ Xóa
          </button>

        </div>
      `;

      const mainButton =
        item.querySelector(
          ".history-main"
        );

      const moreButton =
        item.querySelector(
          ".history-more"
        );

      const menu =
        item.querySelector(
          ".history-menu"
        );

      mainButton.addEventListener(
        "click",
        () => openChat(chat.id)
      );

      moreButton.addEventListener(
        "click",
        event => {
          event.stopPropagation();

          $$(".history-menu.open")
            .forEach(openMenu => {
              if (openMenu !== menu) {
                openMenu.classList.remove("open");
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


/* =========================================================
   RENAME / DELETE
========================================================= */

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

  if (!name?.trim()) {
    return;
  }

  chat.title =
    name.trim();

  chat.updatedAt =
    Date.now();

  saveChats();
  renderHistory();

  showToast("Đã đổi tên cuộc trò chuyện");
}


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

  if (!confirmed) {
    return;
  }

  state.chats =
    state.chats.filter(
      c => c.id !== chatId
    );

  if (
    state.currentChatId ===
    chatId
  ) {
    createChat();
  }

  saveChats();
  renderHistory();

  showToast("Đã xóa cuộc trò chuyện");
}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {
  closeAllMenus();

  elements.searchModal.classList.add("open");

  elements.searchInput.value = "";

  renderSearchResults("");

  setTimeout(() => {
    elements.searchInput.focus();
  }, 100);
}


function renderSearchResults(query) {
  const clean =
    query
      .trim()
      .toLowerCase();

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
        (chat.title || "")
          .toLowerCase()
          .includes(clean);

      const messageMatch =
        chat.messages?.some(message =>
          String(message.content || "")
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

    item.type = "button";

    item.className =
      "search-result";

    item.innerHTML = `
      <span>💬</span>

      <div>
        <strong>
          ${escapeHTML(
            chat.title || "Cuộc trò chuyện"
          )}
        </strong>

        <small>
          ${chat.messages?.length || 0} tin nhắn
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


/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {
  closeAllMenus();

  elements.settingsModal
    .classList.add("open");
}


function changeUsername() {
  const settings =
    getSettings();

  const name =
    prompt(
      "Nhập tên tài khoản:",
      settings.username
    );

  if (!name?.trim()) {
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

  showToast(
    "Đã xóa toàn bộ lịch sử"
  );
}


/* =========================================================
   MODEL
========================================================= */

function toggleModelMenu() {
  elements.modelMenu
    .classList.toggle("open");

  elements.accountMenu
    .classList.remove("open");
}


function selectModel(
  model,
  provider = null,
  apiModel = null
) {
  state.selectedModel = model;

  if (provider) {
    state.selectedProvider = provider;
  }

  if (apiModel) {
    state.selectedApiModel = apiModel;
  }

  elements.currentModel.textContent =
    model;

  elements.modelMenu
    .querySelectorAll(
      "button[data-model]"
    )
    .forEach(button => {
      const selected =
        button.dataset.model === model;

      button.classList.toggle(
        "selected",
        selected
      );

      const check =
        button.querySelector(
          "span:last-child"
        );

      if (check) {
        check.textContent =
          selected ? "✓" : "";
      }
    });

  elements.modelMenu
    .classList.remove("open");

  const chat =
    getCurrentChat();

  if (chat) {
    chat.model =
      state.selectedModel;

    chat.provider =
      state.selectedProvider;

    chat.apiModel =
      state.selectedApiModel;

    saveChats();
  }
}


/* =========================================================
   FILES
========================================================= */

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


/* =========================================================
   TEXTAREA
========================================================= */

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
    elements.messageInput.value
      .trim()
      .length > 0;

  elements.sendBtn.disabled =
    !hasText ||
    state.isGenerating;
}


/* =========================================================
   UI
========================================================= */

function scrollToBottom() {
  requestAnimationFrame(() => {
    elements.chatArea.scrollTop =
      elements.chatArea.scrollHeight;
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

  $$(".history-menu.open")
    .forEach(menu =>
      menu.classList.remove("open")
    );
}


function showToast(message) {
  elements.toast.textContent =
    message;

  elements.toast.classList.add(
    "show"
  );

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


/* =========================================================
   ACCOUNT
========================================================= */

function toggleAccountMenu() {
  elements.accountMenu
    .classList.toggle("open");

  elements.modelMenu
    .classList.remove("open");
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleSidebar() {
  elements.sidebar
    .classList.toggle("mobile-open");

  elements.mobileOverlay
    .classList.toggle(
      "open",
      elements.sidebar.classList.contains(
        "mobile-open"
      )
    );
}


function closeMobileSidebar() {
  elements.sidebar
    .classList.remove("mobile-open");

  elements.mobileOverlay
    .classList.remove("open");
}


/* =========================================================
   EVENTS
========================================================= */

elements.brandButton.addEventListener(
  "click",
  createChat
);


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


$("#headerSearchBtn")
  .addEventListener(
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
  .querySelectorAll(
    "button[data-model]"
  )
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        selectModel(
          button.dataset.model,
          button.dataset.provider,
          button.dataset.apiModel
        );
      }
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
  event => {
    event.stopPropagation();

    toggleSidebar();
  }
);


elements.mobileOverlay.addEventListener(
  "click",
  closeMobileSidebar
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


/* =========================================================
   SUGGESTIONS
========================================================= */

$$(".suggestion").forEach(button => {
  button.addEventListener(
    "click",
    () => {
      elements.messageInput.value =
        button.dataset.prompt || "";

      autoResizeTextarea();
      updateSendButton();

      elements.messageInput.focus();
    }
  );
});


/* =========================================================
   CLOSE BUTTONS
========================================================= */

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


/* =========================================================
   OUTSIDE CLICK
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      !elements.modelMenu.contains(
        event.target
      ) &&
      !elements.modelSelector.contains(
        event.target
      )
    ) {
      elements.modelMenu
        .classList.remove("open");
    }

    if (
      !elements.accountMenu.contains(
        event.target
      ) &&
      !elements.accountBtn.contains(
        event.target
      ) &&
      !elements.headerAccountBtn.contains(
        event.target
      )
    ) {
      closeAccountMenu();
    }
  }
);


/* =========================================================
   ESC
========================================================= */

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

    closeMobileSidebar();
  }
);


/* =========================================================
   INIT
========================================================= */

function init() {
  loadChats();

  updateUserUI();

  applyTheme();

  updateSendButton();

  selectModel(
    "KhanhOS",
    "openai",
    "gpt-5-mini"
  );

  state.currentChatId = null;

  clearMessages();

  elements.welcome.style.display =
    "flex";

  autoResizeTextarea();

  elements.messageInput.focus();
}


init();
