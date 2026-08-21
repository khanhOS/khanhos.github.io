"use strict";

/* =========================================================
   KHANHOS
   SETTINGS + CHAT SYSTEM
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
  theme: "dark",
  notifications: true,
  personalization: true,
  plugins: true,
  voice: false,
  memory: true,
  safeMode: true,
  contrast: "system",
  accent: "default",
  language: "vi"
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
  settingsSearch: $("#settingsSearch"),

  accountBtn: $("#accountBtn"),
  headerAccountBtn: $("#headerAccountBtn"),
  accountMenu: $("#accountMenu"),

  mobileMenuBtn: $("#mobileMenuBtn"),

  themeToggle: $("#themeToggle"),
  changeNameBtn: $("#changeNameBtn"),
  clearHistoryBtn: $("#clearHistoryBtn"),

  menuSettingsBtn: $("#menuSettingsBtn"),

  sidebarUsername: $("#sidebarUsername"),
  menuUsername: $("#menuUsername"),
  currentUsername: $("#currentUsername"),
  settingsAccountName: $("#settingsAccountName"),

  sidebarAvatar: $("#sidebarAvatar"),
  bigAvatar: $("#bigAvatar"),

  toast: $("#toast")
};


/* =========================================================
   SETTINGS STORAGE
========================================================= */

function getSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return { ...defaultSettings };
    }

    const parsed = JSON.parse(saved);

    return {
      ...defaultSettings,
      ...parsed
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


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {
  const settings = getSettings();

  const username =
    settings.username?.trim() || "Khanh";

  const firstLetter =
    username.charAt(0).toUpperCase();

  if (elements.sidebarUsername) {
    elements.sidebarUsername.textContent = username;
  }

  if (elements.menuUsername) {
    elements.menuUsername.textContent = username;
  }

  if (elements.currentUsername) {
    elements.currentUsername.textContent = username;
  }

  if (elements.settingsAccountName) {
    elements.settingsAccountName.textContent = username;
  }

  if (elements.sidebarAvatar) {
    elements.sidebarAvatar.textContent = firstLetter;
  }

  if (elements.headerAccountBtn) {
    elements.headerAccountBtn.textContent = firstLetter;
  }

  if (elements.bigAvatar) {
    elements.bigAvatar.textContent = firstLetter;
  }
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {
  const settings = getSettings();

  document.body.classList.toggle(
    "light",
    settings.theme === "light"
  );

  if (elements.themeToggle) {
    elements.themeToggle.innerHTML =
      settings.theme === "dark"
        ? `Tối <span>⌄</span>`
        : `Sáng <span>⌄</span>`;
  }
}


function toggleTheme() {
  const settings = getSettings();

  settings.theme =
    settings.theme === "dark"
      ? "light"
      : "dark";

  saveSettings(settings);

  applyTheme();

  showToast(
    settings.theme === "light"
      ? "Đã chuyển sang giao diện sáng"
      : "Đã chuyển sang giao diện tối"
  );
}


/* =========================================================
   SETTINGS VALUES
========================================================= */

function setSetting(key, value, message) {
  const settings = getSettings();

  settings[key] = value;

  saveSettings(settings);

  if (message) {
    showToast(message);
  }
}


function getSetting(key) {
  return getSettings()[key];
}


/* =========================================================
   SETTINGS INTERACTIVE
========================================================= */

function createSettingControl(row, type = "toggle") {
  if (!row) return;

  let button = row.querySelector(".setting-select");

  if (!button) return;

  const title =
    row.querySelector("strong")?.textContent?.trim() || "";

  if (title === "Độ tương phản") {
    button.addEventListener("click", () => {

      const settings = getSettings();

      const values = [
        "system",
        "low",
        "high"
      ];

      const currentIndex =
        values.indexOf(settings.contrast);

      const next =
        values[
          (currentIndex + 1) % values.length
        ];

      settings.contrast = next;

      saveSettings(settings);

      const labels = {
        system: "Hệ thống",
        low: "Thấp",
        high: "Cao"
      };

      button.innerHTML =
        `${labels[next]} <span>⌄</span>`;

      showToast(
        `Độ tương phản: ${labels[next]}`
      );

    });

    const labels = {
      system: "Hệ thống",
      low: "Thấp",
      high: "Cao"
    };

    button.innerHTML =
      `${labels[getSetting("contrast")]} <span>⌄</span>`;

    return;
  }


  if (title === "Màu nhấn") {
    button.addEventListener("click", () => {

      const settings = getSettings();

      const values = [
        "default",
        "blue",
        "purple",
        "green"
      ];

      const current =
        values.indexOf(settings.accent);

      const next =
        values[(current + 1) % values.length];

      settings.accent = next;

      saveSettings(settings);

      applyAccent(next);

      const labels = {
        default: "Mặc định",
        blue: "Xanh",
        purple: "Tím",
        green: "Xanh lá"
      };

      button.innerHTML =
        `<span class="accent-dot"></span>
         ${labels[next]}
         <span>⌄</span>`;

      showToast(
        `Màu nhấn: ${labels[next]}`
      );

    });

    updateAccentButton(button);
  }


  if (title === "Ngôn ngữ") {
    button.addEventListener("click", () => {

      const settings = getSettings();

      settings.language =
        settings.language === "vi"
          ? "en"
          : "vi";

      saveSettings(settings);

      button.innerHTML =
        `${settings.language === "vi"
          ? "Tiếng Việt"
          : "English"}
        <span>⌄</span>`;

      showToast(
        settings.language === "vi"
          ? "Đã chọn Tiếng Việt"
          : "Đã chọn English"
      );

    });

    button.innerHTML =
      `${getSetting("language") === "vi"
        ? "Tiếng Việt"
        : "English"}
      <span>⌄</span>`;
  }
}


function updateAccentButton(button) {
  const accent = getSetting("accent");

  const labels = {
    default: "Mặc định",
    blue: "Xanh",
    purple: "Tím",
    green: "Xanh lá"
  };

  button.innerHTML =
    `<span class="accent-dot"></span>
     ${labels[accent] || "Mặc định"}
     <span>⌄</span>`;
}


function applyAccent(accent) {
  document.documentElement.dataset.accent =
    accent || "default";
}


/* =========================================================
   TOGGLE SETTINGS PAGES
========================================================= */

function setupAdvancedSettings() {

  /* -----------------------------------------
     NOTIFICATIONS
  ----------------------------------------- */

  const notificationPage =
    document.querySelector(
      '[data-page="notifications"]'
    );

  if (notificationPage) {

    notificationPage.innerHTML = `
      <div class="settings-content-header">
        <h2>Thông báo</h2>
      </div>

      <div class="settings-scroll">

        <div class="setting-row">
          <div>
            <strong>Thông báo</strong>
            <small>Cho phép KhanhOS hiển thị thông báo</small>
          </div>

          <button
            class="setting-button"
            id="notificationsToggle"
          ></button>
        </div>

      </div>
    `;

    const button =
      $("#notificationsToggle");

    function update() {
      button.textContent =
        getSetting("notifications")
          ? "Bật"
          : "Tắt";
    }

    update();

    button.addEventListener("click", () => {

      const value =
        !getSetting("notifications");

      setSetting(
        "notifications",
        value,
        value
          ? "Đã bật thông báo"
          : "Đã tắt thông báo"
      );

      update();
    });
  }


  /* -----------------------------------------
     PERSONALIZATION
  ----------------------------------------- */

  const personalizationPage =
    document.querySelector(
      '[data-page="personalization"]'
    );

  if (personalizationPage) {

    personalizationPage.innerHTML = `
      <div class="settings-content-header">
        <h2>Cá nhân hóa</h2>
      </div>

      <div class="settings-scroll">

        <div class="setting-row">
          <div>
            <strong>Cá nhân hóa phản hồi</strong>
            <small>Cho phép KhanhOS ghi nhớ cách bạn muốn AI phản hồi</small>
          </div>

          <button
            class="setting-button"
            id="personalizationToggle"
          ></button>
        </div>

      </div>
    `;

    const button =
      $("#personalizationToggle");

    function update() {
      button.textContent =
        getSetting("personalization")
          ? "Bật"
          : "Tắt";
    }

    update();

    button.addEventListener("click", () => {

      const value =
        !getSetting("personalization");

      setSetting(
        "personalization",
        value,
        value
          ? "Đã bật cá nhân hóa"
          : "Đã tắt cá nhân hóa"
      );

      update();
    });
  }


  /* -----------------------------------------
     PLUGINS
  ----------------------------------------- */

  const pluginsPage =
    document.querySelector(
      '[data-page="plugins"]'
    );

  if (pluginsPage) {

    pluginsPage.innerHTML = `
      <div class="settings-content-header">
        <h2>Plugin</h2>
      </div>

      <div class="settings-scroll">

        <div class="setting-row">
          <div>
            <strong>Plugin KhanhOS</strong>
            <small>Cho phép các tính năng mở rộng hoạt động</small>
          </div>

          <button
            class="setting-button"
            id="pluginsToggle"
          ></button>
        </div>

      </div>
    `;

    const button =
      $("#pluginsToggle");

    function update() {
      button.textContent =
        getSetting("plugins")
          ? "Bật"
          : "Tắt";
    }

    update();

    button.addEventListener("click", () => {

      const value =
        !getSetting("plugins");

      setSetting(
        "plugins",
        value,
        value
          ? "Đã bật Plugin"
          : "Đã tắt Plugin"
      );

      update();
    });
  }


  /* -----------------------------------------
     VOICE
  ----------------------------------------- */

  const voicePage =
    document.querySelector(
      '[data-page="voice"]'
    );

  if (voicePage) {

    voicePage.innerHTML = `
      <div class="settings-content-header">
        <h2>Giọng nói</h2>
      </div>

      <div class="settings-scroll">

        <div class="setting-row">
          <div>
            <strong>Giọng nói</strong>
            <small>Bật tính năng tương tác bằng giọng nói</small>
          </div>

          <button
            class="setting-button"
            id="voiceToggle"
          ></button>
        </div>

      </div>
    `;

    const button =
      $("#voiceToggle");

    function update() {
      button.textContent =
        getSetting("voice")
          ? "Bật"
          : "Tắt";
    }

    update();

    button.addEventListener("click", () => {

      const value =
        !getSetting("voice");

      setSetting(
        "voice",
        value,
        value
          ? "Đã bật giọng nói"
          : "Đã tắt giọng nói"
      );

      update();
    });
  }


  /* -----------------------------------------
     BILLING
  ----------------------------------------- */

  const billingPage =
    document.querySelector(
      '[data-page="billing"]'
    );

  if (billingPage) {

    billingPage.innerHTML = `
      <div class="settings-content-header">
        <h2>Thanh toán</h2>
      </div>

      <div class="settings-placeholder">
        <span>▭</span>
        <h3>KhanhOS Free</h3>
        <p>Bạn đang sử dụng gói Free.</p>
        <button
          class="setting-button"
          id="billingInfoBtn"
        >
          Xem thông tin
        </button>
      </div>
    `;

    $("#billingInfoBtn")?.addEventListener(
      "click",
      () => showToast("Bạn đang sử dụng gói Free")
    );
  }


  /* -----------------------------------------
     DATA
  ----------------------------------------- */

  const dataPage =
    document.querySelector(
      '[data-page="data"]'
    );

  if (dataPage) {

    dataPage.innerHTML = `
      <div class="settings-content-header">
        <h2>Kiểm soát dữ liệu</h2>
      </div>

      <div class="settings-scroll">

        <div class="setting-row">
          <div>
            <strong>Xuất dữ liệu</strong>
            <small>Tải toàn bộ lịch sử KhanhOS xuống máy</small>
          </div>

          <button
            class="setting-button"
            id="exportDataBtn"
          >
            Xuất
          </button>
        </div>

        <div class="setting-row danger-row">
          <div>
            <strong>Xóa dữ liệu</strong>
            <small>Xóa dữ liệu KhanhOS trên trình duyệt</small>
          </div>

          <button
            class="setting-button danger"
            id="deleteDataBtn"
          >
            Xóa
          </button>
        </div>

      </div>
    `;

    $("#exportDataBtn")?.addEventListener(
      "click",
      exportData
    );

    $("#deleteDataBtn")?.addEventListener(
      "click",
      clearAllHistory
    );
  }


  /* -----------------------------------------
     MEMORY
  ----------------------------------------- */

  const memoryPage =
    document.querySelector(
      '[data-page="memory"]'
    );

  if (memoryPage) {

    memoryPage.innerHTML = `
      <div class="settings-content-header">
        <h2>Bộ nhớ</h2>
      </div>

      <div class="settings-scroll">

        <div class="setting-row">
          <div>
            <strong>Bộ nhớ KhanhOS</strong>
            <small>Cho phép lưu thông tin cần thiết trong trình duyệt</small>
          </div>

          <button
            class="setting-button"
            id="memoryToggle"
          ></button>
        </div>

      </div>
    `;

    const button =
      $("#memoryToggle");

    function update() {
      button.textContent =
        getSetting("memory")
          ? "Bật"
          : "Tắt";
    }

    update();

    button.addEventListener("click", () => {

      const value =
        !getSetting("memory");

      setSetting(
        "memory",
        value,
        value
          ? "Đã bật bộ nhớ"
          : "Đã tắt bộ nhớ"
      );

      update();
    });
  }


  /* -----------------------------------------
     SECURITY
  ----------------------------------------- */

  const securityPage =
    document.querySelector(
      '[data-page="security"]'
    );

  if (securityPage) {

    securityPage.innerHTML = `
      <div class="settings-content-header">
        <h2>An toàn</h2>
      </div>

      <div class="settings-scroll">

        <div class="setting-row">
          <div>
            <strong>Chế độ an toàn</strong>
            <small>Bảo vệ các thao tác nguy hiểm trong giao diện</small>
          </div>

          <button
            class="setting-button"
            id="safeModeToggle"
          ></button>
        </div>

      </div>
    `;

    const button =
      $("#safeModeToggle");

    function update() {
      button.textContent =
        getSetting("safeMode")
          ? "Bật"
          : "Tắt";
    }

    update();

    button.addEventListener("click", () => {

      const value =
        !getSetting("safeMode");

      setSetting(
        "safeMode",
        value,
        value
          ? "Đã bật chế độ an toàn"
          : "Đã tắt chế độ an toàn"
      );

      update();
    });
  }


  /* -----------------------------------------
     ACCOUNT
  ----------------------------------------- */

  const accountPage =
    document.querySelector(
      '[data-page="account"]'
    );

  if (accountPage) {

    accountPage.innerHTML = `
      <div class="settings-content-header">
        <h2>Tài khoản</h2>
      </div>

      <div class="settings-scroll">

        <div class="settings-placeholder">
          <span>♧</span>

          <h3 id="accountPageName">
            Khanh
          </h3>

          <p>
            Tài khoản KhanhOS Free.
          </p>

          <button
            class="setting-button"
            id="accountRenameBtn"
          >
            Đổi tên
          </button>
        </div>

      </div>
    `;

    $("#accountRenameBtn")?.addEventListener(
      "click",
      changeUsername
    );
  }
}


/* =========================================================
   STORAGE
========================================================= */

function loadChats() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    state.chats =
      saved
        ? JSON.parse(saved)
        : [];

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
  closeAllModals();
  closeMobileSidebar();

  setTimeout(() => {
    elements.messageInput.focus();
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

  if (!chat) return;

  state.currentChatId =
    chat.id;

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

  elements.welcome.style.display =
    "none";

  (chat.messages || []).forEach(
    message => {
      renderMessage(
        message.role,
        message.content
      );
    }
  );

  updateModelMenu();
  renderHistory();

  closeAllMenus();
  closeAllModals();
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
   SEND
========================================================= */

async function sendMessage() {

  const text =
    elements.messageInput.value.trim();

  if (!text || state.isGenerating) {
    return;
  }

  let chat =
    getCurrentChat();

  if (!chat) {
    chat =
      createRealChat(text);
  }

  elements.welcome.style.display =
    "none";

  chat.messages.push({
    role: "user",
    content: text,
    timestamp: Date.now()
  });

  chat.updatedAt =
    Date.now();

  renderMessage("user", text);

  elements.messageInput.value = "";

  autoResizeTextarea();
  updateSendButton();
  renderHistory();
  saveChats();

  state.isGenerating = true;

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
      timestamp: Date.now()
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

    chat.messages.push({
      role: "assistant",
      content: `⚠️ ${errorText}`,
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
          <span class="history-icon">💬</span>

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
                openMenu !== menu
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

          if (action === "rename") {
            renameChat(chat.id);
          }

          if (action === "delete") {
            deleteChat(chat.id);
          }

        }
      );

      elements.chatHistory
        .appendChild(item);
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

  if (!name?.trim()) return;

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

  elements.searchModal
    .classList.add("open");

  elements.searchInput.value = "";

  renderSearchResults("");

  setTimeout(
    () =>
      elements.searchInput.focus(),
    100
  );
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
        chat.messages?.some(
          message =>
            String(
              message.content || ""
            )
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
   SETTINGS MODAL
========================================================= */

function openSettings() {

  closeAllMenus();

  elements.settingsModal
    .classList.add("open");

  setupAdvancedSettings();

  switchSettingsPage("general");

  setTimeout(() => {
    updateAdvancedSettingButtons();
  }, 10);
}


function updateAdvancedSettingButtons() {

  const values = [
    ["notificationsToggle", "notifications"],
    ["personalizationToggle", "personalization"],
    ["pluginsToggle", "plugins"],
    ["voiceToggle", "voice"],
    ["memoryToggle", "memory"],
    ["safeModeToggle", "safeMode"]
  ];

  values.forEach(([id, key]) => {

    const button = $("#" + id);

    if (!button) return;

    button.textContent =
      getSetting(key)
        ? "Bật"
        : "Tắt";
  });
}


function changeUsername() {

  const settings =
    getSettings();

  const name =
    prompt(
      "Nhập tên tài khoản:",
      settings.username
    );

  if (!name?.trim()) return;

  settings.username =
    name.trim();

  saveSettings(settings);

  updateUserUI();

  showToast(
    "Đã cập nhật tên"
  );
}


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

  if (!confirmed) return;

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
   EXPORT DATA
========================================================= */

function exportData() {

  const data = {
    settings: getSettings(),
    chats: state.chats,
    exportedAt: new Date().toISOString()
  };

  const blob =
    new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    "khanhos-data.json";

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);

  showToast(
    "Đã xuất dữ liệu KhanhOS"
  );
}


/* =========================================================
   SETTINGS NAVIGATION
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


function searchSettings(query) {

  const clean =
    query
      .trim()
      .toLowerCase();

  $$(".settings-nav-item")
    .forEach(item => {

      const text =
        item.textContent.toLowerCase();

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
    .classList.toggle("open");

  elements.accountMenu
    .classList.remove("open");
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
          selected ? "✓" : "";
      }
    });
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
    .classList
    .remove("open");
}


function closeAllMenus() {

  elements.modelMenu
    .classList
    .remove("open");

  closeAccountMenu();

  $$(".history-menu.open")
    .forEach(menu =>
      menu.classList.remove("open")
    );
}


function closeAllModals() {

  elements.searchModal
    .classList
    .remove("open");

  elements.settingsModal
    .classList
    .remove("open");
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

elements.brandButton?.addEventListener(
  "click",
  createChat
);

elements.newChatBtn?.addEventListener(
  "click",
  createChat
);

elements.searchBtn?.addEventListener(
  "click",
  openSearch
);

elements.settingsBtn?.addEventListener(
  "click",
  openSettings
);

$("#headerSearchBtn")?.addEventListener(
  "click",
  openSearch
);

elements.menuSettingsBtn?.addEventListener(
  "click",
  openSettings
);


/* MODEL */

elements.modelSelector?.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleModelMenu();
  }
);


elements.modelMenu
  ?.querySelectorAll(
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


/* ACCOUNT */

elements.accountBtn?.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleAccountMenu();
  }
);


elements.headerAccountBtn?.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleAccountMenu();
  }
);


/* MOBILE */

elements.mobileMenuBtn?.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleSidebar();
  }
);


elements.mobileOverlay?.addEventListener(
  "click",
  closeMobileSidebar
);


/* FILE */

elements.attachBtn?.addEventListener(
  "click",
  openFilePicker
);


elements.fileInput?.addEventListener(
  "change",
  event =>
    handleFiles(event.target.files)
);


/* MESSAGE */

elements.messageInput?.addEventListener(
  "input",
  () => {

    autoResizeTextarea();

    updateSendButton();
  }
);


elements.messageInput?.addEventListener(
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


elements.composer?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    sendMessage();
  }
);


/* SEARCH */

elements.searchInput?.addEventListener(
  "input",
  event =>
    renderSearchResults(
      event.target.value
    )
);


/* THEME */

elements.themeToggle?.addEventListener(
  "click",
  toggleTheme
);


/* USERNAME */

elements.changeNameBtn?.addEventListener(
  "click",
  changeUsername
);


/* CLEAR */

elements.clearHistoryBtn?.addEventListener(
  "click",
  clearAllHistory
);


/* =========================================================
   SETTINGS NAV
========================================================= */

$$(".settings-nav-item")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        switchSettingsPage(
          button.dataset.settingPage
        );

        updateAdvancedSettingButtons();
      }
    );
  });


elements.settingsSearch
  ?.addEventListener(
    "input",
    event =>
      searchSettings(
        event.target.value
      )
  );


/* =========================================================
   SUGGESTIONS
========================================================= */

$$(".suggestion")
  .forEach(button => {

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

$$("[data-close]")
  .forEach(button => {

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
      !elements.modelMenu.contains(event.target) &&
      !elements.modelSelector.contains(event.target)
    ) {

      elements.modelMenu
        .classList
        .remove("open");
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


/* =========================================================
   MODAL BACKDROP
========================================================= */

elements.searchModal?.addEventListener(
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


elements.settingsModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      elements.settingsModal
    ) {

      elements.settingsModal
        .classList
        .remove("open");
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

  applyAccent(
    getSetting("accent")
  );

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

  /*
     Khởi tạo Settings sau khi DOM
     đã sẵn sàng.
  */
  setupAdvancedSettings();
}


init();
