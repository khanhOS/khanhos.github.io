"use strict";

/* =========================================================
   KHANHOS
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

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  document.querySelectorAll(selector);


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
  settingsSearch: $("#settingsSearch"),

  accountBtn: $("#accountBtn"),
  headerAccountBtn: $("#headerAccountBtn"),
  accountMenu: $("#accountMenu"),
  menuSettingsBtn: $("#menuSettingsBtn"),

  mobileMenuBtn: $("#mobileMenuBtn"),

  themeToggle: $("#themeToggle"),
  changeNameBtn: $("#changeNameBtn"),
  clearHistoryBtn: $("#clearHistoryBtn"),

  sidebarUsername: $("#sidebarUsername"),
  menuUsername: $("#menuUsername"),
  currentUsername: $("#currentUsername"),
  settingsAccountName: $("#settingsAccountName"),

  sidebarAvatar: $("#sidebarAvatar"),
  bigAvatar: $("#bigAvatar"),

  toast: $("#toast")
};


/* =========================================================
   SAFETY DOM CHECK
========================================================= */

function exists(element) {
  return element !== null && element !== undefined;
}


/* =========================================================
   SETTINGS STORAGE
========================================================= */

function getSettings() {

  try {

    const saved =
      localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return { ...defaultSettings };
    }

    const parsed =
      JSON.parse(saved);

    return {
      ...defaultSettings,
      ...(parsed || {})
    };

  } catch (error) {

    console.error(
      "Không thể đọc Settings:",
      error
    );

    return {
      ...defaultSettings
    };

  }

}


function saveSettings(settings) {

  try {

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );

  } catch (error) {

    console.error(
      "Không thể lưu Settings:",
      error
    );

  }

}


/* =========================================================
   UPDATE USER UI
========================================================= */

function updateUserUI() {

  const settings =
    getSettings();

  const username =
    String(
      settings.username || "Khanh"
    ).trim() || "Khanh";

  const firstLetter =
    username
      .charAt(0)
      .toUpperCase();


  if (exists(elements.sidebarUsername)) {
    elements.sidebarUsername.textContent =
      username;
  }

  if (exists(elements.menuUsername)) {
    elements.menuUsername.textContent =
      username;
  }

  if (exists(elements.currentUsername)) {
    elements.currentUsername.textContent =
      username;
  }

  if (exists(elements.settingsAccountName)) {
    elements.settingsAccountName.textContent =
      username;
  }

  if (exists(elements.sidebarAvatar)) {
    elements.sidebarAvatar.textContent =
      firstLetter;
  }

  if (exists(elements.headerAccountBtn)) {
    elements.headerAccountBtn.textContent =
      firstLetter;
  }

  if (exists(elements.bigAvatar)) {
    elements.bigAvatar.textContent =
      firstLetter;
  }

}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

  const settings =
    getSettings();

  const isLight =
    settings.theme === "light";


  document.body.classList.toggle(
    "light",
    isLight
  );


  if (exists(elements.themeToggle)) {

    elements.themeToggle.innerHTML =
      isLight
        ? `Sáng <span>⌄</span>`
        : `Tối <span>⌄</span>`;

  }

}


/* =========================================================
   STORAGE - CHAT
========================================================= */

function loadChats() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    state.chats =
      saved
        ? JSON.parse(saved)
        : [];

    if (!Array.isArray(state.chats)) {
      state.chats = [];
    }

  } catch (error) {

    console.error(
      "Không thể tải lịch sử:",
      error
    );

    state.chats = [];

  }

  renderHistory();

}


function saveChats() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.chats)
    );

  } catch (error) {

    console.error(
      "Không thể lưu lịch sử:",
      error
    );

  }

}


/* =========================================================
   CHAT
========================================================= */

function createChat() {

  state.currentChatId = null;

  clearMessages();

  if (exists(elements.welcome)) {
    elements.welcome.style.display =
      "flex";
  }

  if (exists(elements.messageInput)) {
    elements.messageInput.value = "";
  }

  state.attachedFiles = [];

  autoResizeTextarea();
  updateSendButton();

  closeAllMenus();
  closeAllModals();
  closeMobileSidebar();

  setTimeout(() => {

    if (exists(elements.messageInput)) {
      elements.messageInput.focus();
    }

  }, 50);

}


function createRealChat(firstMessage) {

  const chat = {

    id:
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),

    title:
      generateTitle(firstMessage),

    model:
      state.selectedModel,

    provider:
      state.selectedProvider,

    apiModel:
      state.selectedApiModel,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    messages: []

  };


  state.chats.unshift(chat);

  state.currentChatId =
    chat.id;

  saveChats();

  return chat;

}


function generateTitle(text) {

  const clean =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();

  if (clean.length <= 32) {
    return clean;
  }

  return clean.substring(0, 32) + "...";

}


function getCurrentChat() {

  return state.chats.find(
    chat =>
      chat.id ===
      state.currentChatId
  );

}


/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(chatId) {

  const chat =
    state.chats.find(
      chat =>
        chat.id === chatId
    );

  if (!chat) {
    return;
  }


  state.currentChatId =
    chat.id;


  if (chat.model) {
    state.selectedModel =
      chat.model;
  }

  if (chat.provider) {
    state.selectedProvider =
      chat.provider;
  }

  if (chat.apiModel) {
    state.selectedApiModel =
      chat.apiModel;
  }


  if (exists(elements.currentModel)) {
    elements.currentModel.textContent =
      state.selectedModel;
  }


  clearMessages();


  if (exists(elements.welcome)) {
    elements.welcome.style.display =
      "none";
  }


  (chat.messages || [])
    .forEach(message => {

      renderMessage(
        message.role,
        message.content
      );

    });


  updateModelMenu();
  renderHistory();

  closeAllMenus();
  closeAllModals();
  closeMobileSidebar();

  requestAnimationFrame(() => {

    if (exists(elements.chatArea)) {
      elements.chatArea.scrollTop =
        elements.chatArea.scrollHeight;
    }

  });


  if (exists(elements.messageInput)) {
    elements.messageInput.focus();
  }

}


/* =========================================================
   MESSAGES
========================================================= */

function clearMessages() {

  if (exists(elements.messages)) {
    elements.messages.innerHTML = "";
  }

}


function renderMessage(role, content) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    `message-row ${
      role === "assistant"
        ? "assistant"
        : "user"
    }`;


  const message =
    document.createElement("div");

  message.className =
    "message";


  if (role === "user") {

    message.textContent =
      content;

  } else {

    message.innerHTML =
      formatAIMessage(content);

  }


  wrapper.appendChild(message);

  elements.messages.appendChild(wrapper);

  scrollToBottom();

  return wrapper;

}


/* =========================================================
   FORMAT AI MESSAGE
========================================================= */

function formatAIMessage(text) {

  if (!text) {
    return "";
  }


  let escaped =
    escapeHTML(text);


  escaped =
    escaped.replace(
      /```([\s\S]*?)```/g,
      "<pre><code>$1</code></pre>"
    );


  escaped =
    escaped.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );


  escaped =
    escaped.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  escaped =
    escaped.replace(
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
   SEND MESSAGE
========================================================= */

async function sendMessage() {

  if (!exists(elements.messageInput)) {
    return;
  }


  const text =
    elements.messageInput.value.trim();


  if (
    !text ||
    state.isGenerating
  ) {
    return;
  }


  let chat =
    getCurrentChat();


  if (!chat) {
    chat =
      createRealChat(text);
  }


  if (exists(elements.welcome)) {
    elements.welcome.style.display =
      "none";
  }


  chat.messages.push({

    role: "user",

    content: text,

    timestamp:
      Date.now()

  });


  chat.updatedAt =
    Date.now();


  renderMessage(
    "user",
    text
  );


  elements.messageInput.value = "";

  autoResizeTextarea();
  updateSendButton();

  renderHistory();
  saveChats();


  state.isGenerating =
    true;

  updateSendButton();


  const loading =
    createLoadingMessage();


  try {

    const response =
      await callChatAPI(
        chat.messages,
        chat.provider ||
          state.selectedProvider,
        chat.apiModel ||
          state.selectedApiModel
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

      timestamp:
        Date.now()

    });


    chat.updatedAt =
      Date.now();


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


    const message =
      `⚠️ ${errorText}`;


    chat.messages.push({

      role: "assistant",

      content: message,

      timestamp:
        Date.now()

    });


    renderMessage(
      "assistant",
      message
    );


    saveChats();

  } finally {

    state.isGenerating =
      false;

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
    await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            provider,
            model,
            messages
          })

      }
    );


  let data = {};


  try {

    data =
      await response.json();

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

  if (!exists(elements.chatHistory)) {
    return;
  }


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
              chat.title ||
              "Cuộc trò chuyện"
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
        () =>
          openChat(chat.id)
      );


      moreButton.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          $$(".history-menu.open")
            .forEach(openMenu => {

              if (
                openMenu !==
                menu
              ) {

                openMenu
                  .classList
                  .remove("open");

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


          if (
            action === "rename"
          ) {

            renameChat(chat.id);

          }


          if (
            action === "delete"
          ) {

            deleteChat(chat.id);

          }

        }
      );


      elements.chatHistory
        .appendChild(item);

    });

}


/* =========================================================
   RENAME / DELETE CHAT
========================================================= */

function renameChat(chatId) {

  const chat =
    state.chats.find(
      c => c.id === chatId
    );


  if (!chat) {
    return;
  }


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


  showToast(
    "Đã đổi tên cuộc trò chuyện"
  );

}


function deleteChat(chatId) {

  const chat =
    state.chats.find(
      c => c.id === chatId
    );


  if (!chat) {
    return;
  }


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


  showToast(
    "Đã xóa cuộc trò chuyện"
  );

}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {

  closeAllMenus();


  if (!exists(elements.searchModal)) {
    return;
  }


  elements.searchModal
    .classList
    .add("open");


  elements.searchInput.value = "";

  renderSearchResults("");


  setTimeout(() => {

    elements.searchInput.focus();

  }, 100);

}


function renderSearchResults(query) {

  if (!exists(elements.searchResults)) {
    return;
  }


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
        chat.messages?.some(
          message =>
            String(
              message.content || ""
            )
              .toLowerCase()
              .includes(clean)
        );


      return (
        titleMatch ||
        messageMatch
      );

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
            chat.title ||
            "Cuộc trò chuyện"
          )}
        </strong>

        <small>
          ${chat.messages?.length || 0}
          tin nhắn
        </small>

      </div>

    `;


    item.addEventListener(
      "click",
      () => {

        openChat(chat.id);

        elements.searchModal
          .classList
          .remove("open");

      }
    );


    elements.searchResults
      .appendChild(item);

  });

}


/* =========================================================
   SETTINGS - OPEN
========================================================= */

function openSettings() {

  /* Đóng toàn bộ menu trước */
  closeAllMenus();

  /* Đóng search */
  if (exists(elements.searchModal)) {

    elements.searchModal
      .classList
      .remove("open");

  }


  /* MỞ SETTINGS */
  if (exists(elements.settingsModal)) {

    elements.settingsModal
      .classList
      .add("open");

  }


  /* Luôn mở trang Chung khi vào Settings */
  switchSettingsPage("general");


  /* Reset tìm kiếm Settings */
  if (exists(elements.settingsSearch)) {

    elements.settingsSearch.value = "";

    searchSettings("");

  }


  /* Đóng sidebar mobile */
  closeMobileSidebar();

}


/* =========================================================
   SETTINGS - CLOSE
========================================================= */

function closeSettings() {

  if (exists(elements.settingsModal)) {

    elements.settingsModal
      .classList
      .remove("open");

  }

}


/* =========================================================
   SETTINGS - USERNAME
========================================================= */

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


  showToast(
    "Đã cập nhật tên tài khoản"
  );

}


/* =========================================================
   SETTINGS - THEME
========================================================= */

function toggleTheme() {

  const settings =
    getSettings();


  settings.theme =
    settings.theme === "dark"
      ? "light"
      : "dark";


  saveSettings(settings);

  applyTheme();


  showToast(
    settings.theme === "dark"
      ? "Đã chuyển sang giao diện tối"
      : "Đã chuyển sang giao diện sáng"
  );

}


/* =========================================================
   SETTINGS - CLEAR HISTORY
========================================================= */

function clearAllHistory() {

  if (!state.chats.length) {

    showToast(
      "Lịch sử đang trống"
    );

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
   SETTINGS - NAVIGATION
========================================================= */

function switchSettingsPage(page) {

  $$(".settings-nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.settingPage === page
      );

    });


  $$(".settings-page")
    .forEach(section => {

      section.classList.toggle(
        "active",
        section.dataset.page === page
      );

    });

}


/* =========================================================
   SETTINGS - SEARCH
========================================================= */

function searchSettings(query) {

  const clean =
    String(query || "")
      .trim()
      .toLowerCase();


  $$(".settings-nav-item")
    .forEach(item => {

      const text =
        item.textContent
          .toLowerCase();


      item.style.display =
        !clean ||
        text.includes(clean)
          ? "flex"
          : "none";

    });

}


/* =========================================================
   MODEL
========================================================= */

function toggleModelMenu() {

  elements.modelMenu
    .classList
    .toggle("open");


  elements.accountMenu
    .classList
    .remove("open");

}


function updateModelMenu() {

  elements.modelMenu
    .querySelectorAll(
      "button[data-model]"
    )
    .forEach(button => {

      const selected =
        button.dataset.model ===
        state.selectedModel;


      button.classList.toggle(
        "selected",
        selected
      );


      const check =
        button.querySelector("b");


      if (check) {

        check.textContent =
          selected
            ? "✓"
            : "";

      }

    });

}


function selectModel(
  model,
  provider = null,
  apiModel = null
) {

  state.selectedModel =
    model;


  if (provider) {
    state.selectedProvider =
      provider;
  }


  if (apiModel) {
    state.selectedApiModel =
      apiModel;
  }


  elements.currentModel.textContent =
    model;


  updateModelMenu();


  elements.modelMenu
    .classList
    .remove("open");


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

  if (!exists(elements.messageInput)) {
    return;
  }


  const input =
    elements.messageInput;


  input.style.height =
    "auto";


  input.style.height =
    Math.min(
      input.scrollHeight,
      180
    ) + "px";

}


function updateSendButton() {

  if (!exists(elements.sendBtn)) {
    return;
  }


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

    if (exists(elements.chatArea)) {

      elements.chatArea.scrollTop =
        elements.chatArea.scrollHeight;

    }

  });

}


function closeAccountMenu() {

  if (exists(elements.accountMenu)) {

    elements.accountMenu
      .classList
      .remove("open");

  }

}


function closeAllMenus() {

  if (exists(elements.modelMenu)) {

    elements.modelMenu
      .classList
      .remove("open");

  }


  closeAccountMenu();


  $$(".history-menu.open")
    .forEach(menu =>
      menu.classList.remove("open")
    );

}


function closeAllModals() {

  if (exists(elements.searchModal)) {

    elements.searchModal
      .classList
      .remove("open");

  }


  if (exists(elements.settingsModal)) {

    elements.settingsModal
      .classList
      .remove("open");

  }

}


function showToast(message) {

  if (!exists(elements.toast)) {
    return;
  }


  elements.toast.textContent =
    message;


  elements.toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timeout
  );


  showToast.timeout =
    setTimeout(
      () => {

        elements.toast
          .classList
          .remove("show");

      },
      2200
    );

}


/* =========================================================
   ACCOUNT
========================================================= */

function toggleAccountMenu() {

  elements.accountMenu
    .classList
    .toggle("open");


  elements.modelMenu
    .classList
    .remove("open");

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleSidebar() {

  elements.sidebar
    .classList
    .toggle("mobile-open");


  elements.mobileOverlay
    .classList
    .toggle(
      "open",
      elements.sidebar
        .classList
        .contains("mobile-open")
    );

}


function closeMobileSidebar() {

  elements.sidebar
    .classList
    .remove("mobile-open");


  elements.mobileOverlay
    .classList
    .remove("open");

}


/* =========================================================
   EVENTS
========================================================= */

/* BRAND */

if (exists(elements.brandButton)) {

  elements.brandButton.addEventListener(
    "click",
    createChat
  );

}


/* NEW CHAT */

if (exists(elements.newChatBtn)) {

  elements.newChatBtn.addEventListener(
    "click",
    createChat
  );

}


/* SEARCH */

if (exists(elements.searchBtn)) {

  elements.searchBtn.addEventListener(
    "click",
    openSearch
  );

}


const headerSearchBtn =
  $("#headerSearchBtn");


if (exists(headerSearchBtn)) {

  headerSearchBtn.addEventListener(
    "click",
    openSearch
  );

}


/* =========================================================
   SETTINGS BUTTONS
========================================================= */

/* Sidebar Settings */

if (exists(elements.settingsBtn)) {

  elements.settingsBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      openSettings();

    }
  );

}


/* Account menu Settings */

if (exists(elements.menuSettingsBtn)) {

  elements.menuSettingsBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      openSettings();

    }
  );

}


/* =========================================================
   MODEL
========================================================= */

if (exists(elements.modelSelector)) {

  elements.modelSelector.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      toggleModelMenu();

    }
  );

}


if (exists(elements.modelMenu)) {

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

}


/* =========================================================
   ACCOUNT
========================================================= */

if (exists(elements.accountBtn)) {

  elements.accountBtn.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      toggleAccountMenu();

    }
  );

}


if (exists(elements.headerAccountBtn)) {

  elements.headerAccountBtn.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      toggleAccountMenu();

    }
  );

}


/* =========================================================
   MOBILE
========================================================= */

if (exists(elements.mobileMenuBtn)) {

  elements.mobileMenuBtn.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      toggleSidebar();

    }
  );

}


if (exists(elements.mobileOverlay)) {

  elements.mobileOverlay.addEventListener(
    "click",
    closeMobileSidebar
  );

}


/* =========================================================
   FILE
========================================================= */

if (exists(elements.attachBtn)) {

  elements.attachBtn.addEventListener(
    "click",
    openFilePicker
  );

}


if (exists(elements.fileInput)) {

  elements.fileInput.addEventListener(
    "change",
    event =>
      handleFiles(
        event.target.files
      )
  );

}


/* =========================================================
   MESSAGE INPUT
========================================================= */

if (exists(elements.messageInput)) {

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

}


/* =========================================================
   COMPOSER
========================================================= */

if (exists(elements.composer)) {

  elements.composer.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      sendMessage();

    }
  );

}


/* =========================================================
   SEARCH INPUT
========================================================= */

if (exists(elements.searchInput)) {

  elements.searchInput.addEventListener(
    "input",
    event =>
      renderSearchResults(
        event.target.value
      )
  );

}


/* =========================================================
   THEME
========================================================= */

if (exists(elements.themeToggle)) {

  elements.themeToggle.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      toggleTheme();

    }
  );

}


/* =========================================================
   CHANGE NAME
========================================================= */

if (exists(elements.changeNameBtn)) {

  elements.changeNameBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      changeUsername();

    }
  );

}


/* =========================================================
   CLEAR HISTORY
========================================================= */

if (exists(elements.clearHistoryBtn)) {

  elements.clearHistoryBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      clearAllHistory();

    }
  );

}


/* =========================================================
   SETTINGS NAV
========================================================= */

$$(".settings-nav-item")
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        switchSettingsPage(
          button.dataset.settingPage
        );

      }
    );

  });


/* =========================================================
   SETTINGS SEARCH
========================================================= */

if (exists(elements.settingsSearch)) {

  elements.settingsSearch
    .addEventListener(
      "input",
      event => {

        searchSettings(
          event.target.value
        );

      }
    );

}


/* =========================================================
   SUGGESTIONS
========================================================= */

$$(".suggestion")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (!exists(elements.messageInput)) {
          return;
        }


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

$$("[data-close]")
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();


        const target =
          document.getElementById(
            button.dataset.close
          );


        if (!target) {
          return;
        }


        target.classList.remove(
          "open"
        );


        if (
          button.dataset.close ===
          "settingsModal"
        ) {

          closeSettings();

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

    /* MODEL MENU */

    if (
      exists(elements.modelMenu) &&
      exists(elements.modelSelector) &&
      !elements.modelMenu.contains(event.target) &&
      !elements.modelSelector.contains(event.target)
    ) {

      elements.modelMenu
        .classList
        .remove("open");

    }


    /* ACCOUNT MENU */

    if (
      exists(elements.accountMenu) &&
      exists(elements.accountBtn) &&
      exists(elements.headerAccountBtn) &&
      !elements.accountMenu.contains(event.target) &&
      !elements.accountBtn.contains(event.target) &&
      !elements.headerAccountBtn.contains(event.target)
    ) {

      closeAccountMenu();

    }

  }
);


/* =========================================================
   SEARCH MODAL BACKDROP
========================================================= */

if (exists(elements.searchModal)) {

  elements.searchModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        elements.searchModal
      ) {

        elements.searchModal
          .classList
          .remove("open");

      }

    }
  );

}


/* =========================================================
   SETTINGS MODAL BACKDROP
========================================================= */

if (exists(elements.settingsModal)) {

  elements.settingsModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        elements.settingsModal
      ) {

        closeSettings();

      }

    }
  );

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
    ) {
      return;
    }


    closeAllMenus();
    closeAllModals();
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


  state.currentChatId =
    null;


  clearMessages();


  if (exists(elements.welcome)) {

    elements.welcome.style.display =
      "flex";

  }


  autoResizeTextarea();

}


init();
