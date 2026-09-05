"use strict";

/*
  KhanhOS AI
  Frontend controller

  Backend expected:
  POST /api/chat
  GET  /api/auth/me
  POST /api/auth/signin
  POST /api/auth/signup
  POST /api/auth/signout

  The API key for Cerebras MUST stay on the server.
*/

const STORAGE_KEY = "khanhos_chat_history";
const SETTINGS_KEY = "khanhos_settings";

const state = {
  currentChatId: null,
  messages: [],
  chats: [],
  isLoading: false,
  user: null,
  selectedModel: "gpt-oss-120b",
  settings: {
    theme: "system",
    enterToSend: true,
    compactMode: false,
    saveHistory: true,
  },
};

/* =========================================================
   HELPERS
========================================================= */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getInitials(name = "K") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "K";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (
    words[0][0] + words[words.length - 1][0]
  ).toUpperCase();
}

function showToast(message) {
  const container = $("#toastContainer");

  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";

    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 2600);
}

function closeAllPopovers() {
  $$(".popover").forEach((el) => {
    el.classList.add("hidden");
  });
}

function openModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.add("hidden");

  const anotherOpen = $$(".modal-overlay").some(
    (el) => !el.classList.contains("hidden")
  );

  if (!anotherOpen) {
    document.body.style.overflow = "";
  }
}

function closeAllModals() {
  $$(".modal-overlay").forEach((modal) => {
    modal.classList.add("hidden");
  });

  document.body.style.overflow = "";
}

/* =========================================================
   STORAGE
========================================================= */

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);

    if (!raw) return;

    const saved = JSON.parse(raw);

    state.settings = {
      ...state.settings,
      ...saved,
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(state.settings)
    );
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

function loadChats() {
  if (!state.settings.saveHistory) {
    state.chats = [];
    return;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      state.chats = [];
      return;
    }

    const chats = JSON.parse(raw);

    if (!Array.isArray(chats)) {
      state.chats = [];
      return;
    }

    state.chats = chats;
  } catch (error) {
    console.error("Failed to load chats:", error);
    state.chats = [];
  }
}

function saveChats() {
  if (!state.settings.saveHistory) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.chats)
    );
  } catch (error) {
    console.error("Failed to save chats:", error);
  }
}

/* =========================================================
   THEME
========================================================= */

function applyTheme() {
  const theme = state.settings.theme;

  let dark = false;

  if (theme === "dark") {
    dark = true;
  }

  if (theme === "system") {
    dark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  document.body.classList.toggle("dark", dark);

  const select = $("#themeSelect");

  if (select) {
    select.value = theme;
  }
}

/* =========================================================
   AUTH
========================================================= */

async function loadCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      state.user = null;
      updateAuthUI();
      return;
    }

    const data = await response.json();

    state.user = data.user || data || null;

    updateAuthUI();
  } catch (error) {
    console.warn("Auth check failed:", error);
    state.user = null;
    updateAuthUI();
  }
}

function updateAuthUI() {
  const profileName = $(".profile-name");
  const profileTier = $(".profile-tier");
  const avatar = $(".profile-button .avatar");

  if (!state.user) {
    if (profileName) profileName.textContent = "Khách";
    if (profileTier) profileTier.textContent = "Đăng nhập để đồng bộ";
    if (avatar) avatar.textContent = "K";
    return;
  }

  const name =
    state.user.name ||
    state.user.email ||
    "User";

  if (profileName) {
    profileName.textContent = name;
  }

  if (profileTier) {
    profileTier.textContent =
      state.user.tier
        ? String(state.user.tier).toUpperCase()
        : "FREE";
  }

  if (avatar) {
    avatar.textContent = getInitials(name);
  }
}

async function signIn(email, password) {
  const errorBox = $("#loginError");

  if (errorBox) {
    errorBox.classList.remove("show");
    errorBox.textContent = "";
  }

  try {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Đăng nhập thất bại."
      );
    }

    state.user = data.user || null;

    updateAuthUI();
    closeModal("authModal");

    showToast("Đăng nhập thành công.");
  } catch (error) {
    if (errorBox) {
      errorBox.textContent = error.message;
      errorBox.classList.add("show");
    }
  }
}

async function signUp(name, email, password) {
  const errorBox = $("#signupError");

  if (errorBox) {
    errorBox.classList.remove("show");
    errorBox.textContent = "";
  }

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Đăng ký thất bại."
      );
    }

    state.user = data.user || null;

    updateAuthUI();
    closeModal("authModal");

    showToast("Tạo tài khoản thành công.");
  } catch (error) {
    if (errorBox) {
      errorBox.textContent = error.message;
      errorBox.classList.add("show");
    }
  }
}

async function signOut() {
  try {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.warn("Signout request failed:", error);
  }

  state.user = null;
  updateAuthUI();

  closeAllPopovers();

  showToast("Đã đăng xuất.");
}

/* =========================================================
   CHAT
========================================================= */

function createNewChat() {
  state.currentChatId = generateId();
  state.messages = [];

  renderMessages();
  renderHistory();

  const textarea = $("#messageInput");

  if (textarea) {
    textarea.value = "";
    textarea.focus();
    autoResizeTextarea(textarea);
  }

  hideWelcome(false);
}

function hideWelcome(hide = true) {
  const welcome = $("#welcome");

  if (!welcome) return;

  welcome.classList.toggle("hidden", hide);
}

function getCurrentChat() {
  return state.chats.find(
    (chat) => chat.id === state.currentChatId
  );
}

function createChatRecord(firstMessage = "") {
  const id = state.currentChatId || generateId();

  state.currentChatId = id;

  const title =
    firstMessage
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 55) ||
    "New Chat";

  const chat = {
    id,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };

  state.chats.unshift(chat);

  saveChats();
  renderHistory();

  return chat;
}

function syncCurrentChat() {
  if (!state.currentChatId) return;

  let chat = getCurrentChat();

  if (!chat) {
    chat = createChatRecord(
      state.messages[0]?.content || "New Chat"
    );
  }

  chat.messages = state.messages;
  chat.updatedAt = Date.now();

  if (
    chat.title === "New Chat" &&
    state.messages[0]?.content
  ) {
    chat.title = state.messages[0].content
      .replace(/\s+/g, " ")
      .slice(0, 55);
  }

  saveChats();
  renderHistory();
}

function loadChat(chatId) {
  const chat = state.chats.find(
    (item) => item.id === chatId
  );

  if (!chat) return;

  state.currentChatId = chat.id;
  state.messages = Array.isArray(chat.messages)
    ? [...chat.messages]
    : [];

  hideWelcome(state.messages.length > 0);
  renderMessages();
  renderHistory();

  closeAllPopovers();

  const chatArea = $("#chatArea");

  if (chatArea) {
    chatArea.scrollTop = 0;
  }
}

function deleteChat(chatId, event) {
  if (event) {
    event.stopPropagation();
  }

  state.chats = state.chats.filter(
    (chat) => chat.id !== chatId
  );

  saveChats();

  if (state.currentChatId === chatId) {
    state.currentChatId = null;
    state.messages = [];

    renderMessages();
    hideWelcome(false);
  }

  renderHistory();
  showToast("Đã xóa cuộc trò chuyện.");
}

function renderHistory() {
  const list = $("#historyList");

  if (!list) return;

  if (!state.chats.length) {
    list.innerHTML = `
      <div class="history-empty">
        Chưa có cuộc trò chuyện nào.
      </div>
    `;

    return;
  }

  const sorted = [...state.chats].sort(
    (a, b) =>
      (b.updatedAt || 0) -
      (a.updatedAt || 0)
  );

  list.innerHTML = sorted
    .map((chat) => {
      const active =
        chat.id === state.currentChatId
          ? "active"
          : "";

      return `
        <button
          class="history-item ${active}"
          data-chat-id="${escapeHTML(chat.id)}"
          type="button"
        >
          <span>💬</span>
          <span class="history-item-title">
            ${escapeHTML(chat.title || "New Chat")}
          </span>
          <span
            class="history-delete"
            data-delete-chat="${escapeHTML(chat.id)}"
            title="Xóa"
          >×</span>
        </button>
      `;
    })
    .join("");

  $$(".history-item", list).forEach((button) => {
    button.addEventListener("click", (event) => {
      const deleteTarget =
        event.target.closest("[data-delete-chat]");

      if (deleteTarget) {
        deleteChat(
          deleteTarget.dataset.deleteChat,
          event
        );

        return;
      }

      loadChat(button.dataset.chatId);
    });
  });
}

/* =========================================================
   MESSAGE RENDERING
========================================================= */

function simpleMarkdown(text) {
  let html = escapeHTML(text);

  /*
    This is intentionally lightweight.
    Do not render arbitrary HTML from the AI response.
  */

  html = html.replace(
    /```([\s\S]*?)```/g,
    (_, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    }
  );

  html = html.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );

  html = html.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  html = html.replace(
    /\*(.*?)\*/g,
    "<em>$1</em>"
  );

  html = html.replace(
    /^### (.+)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^## (.+)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^# (.+)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^\s*[-*] (.+)$/gm,
    "<li>$1</li>"
  );

  html = html.replace(
    /(<li>.*<\/li>)/gs,
    "<ul>$1</ul>"
  );

  html = html.replace(
    /\n{2,}/g,
    "</p><p>"
  );

  html = html.replace(
    /\n/g,
    "<br>"
  );

  return `<p>${html}</p>`;
}

function renderMessages() {
  const container = $("#messages");

  if (!container) return;

  if (!state.messages.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = state.messages
    .map((message, index) => {
      const isUser = message.role === "user";

      const content = isUser
        ? escapeHTML(message.content).replace(
            /\n/g,
            "<br>"
          )
        : simpleMarkdown(message.content);

      return `
        <div class="message ${isUser ? "user" : "assistant"}">
          <div class="message-avatar">
            ${isUser ? "U" : "K"}
          </div>

          <div class="message-body">
            <div class="message-content">
              ${content}
            </div>

            ${
              !isUser
                ? `
                  <div class="message-actions">
                    <button
                      class="message-action"
                      type="button"
                      data-copy-message="${index}"
                      title="Sao chép"
                    >⧉</button>
                  </div>
                `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");

  $$("[data-copy-message]", container).forEach(
    (button) => {
      button.addEventListener("click", () => {
        const index = Number(
          button.dataset.copyMessage
        );

        const message = state.messages[index];

        if (!message) return;

        copyText(message.content);
      });
    }
  );

  scrollToBottom();
}

function renderTyping() {
  const container = $("#messages");

  if (!container) return;

  const typing = document.createElement("div");

  typing.className = "message assistant";
  typing.id = "typingMessage";

  typing.innerHTML = `
    <div class="message-avatar">K</div>

    <div class="message-body">
      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  container.appendChild(typing);

  scrollToBottom();
}

function removeTyping() {
  $("#typingMessage")?.remove();
}

function scrollToBottom() {
  const chatArea = $("#chatArea");

  if (!chatArea) return;

  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(textFromButton = null) {
  if (state.isLoading) return;

  const textarea = $("#messageInput");

  const text =
    textFromButton !== null
      ? textFromButton.trim()
      : textarea?.value.trim();

  if (!text) return;

  if (!state.currentChatId) {
    createChatRecord(text);
  }

  hideWelcome(true);

  const userMessage = {
    id: generateId(),
    role: "user",
    content: text,
    createdAt: Date.now(),
  };

  state.messages.push(userMessage);

  if (textarea) {
    textarea.value = "";
    autoResizeTextarea(textarea);
  }

  renderMessages();
  syncCurrentChat();

  state.isLoading = true;
  updateSendButton();
  renderTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        model: state.selectedModel,
        messages: state.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        chatId: state.currentChatId,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `Server error ${response.status}`
      );
    }

    const reply =
      data.reply ||
      data.message?.content ||
      data.content ||
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text;

    if (!reply) {
      throw new Error(
        "API không trả về nội dung phản hồi."
      );
    }

    state.messages.push({
      id: generateId(),
      role: "assistant",
      content: String(reply),
      createdAt: Date.now(),
    });

    syncCurrentChat();
    renderMessages();
  } catch (error) {
    console.error(error);

    state.messages.push({
      id: generateId(),
      role: "assistant",
      content:
        "Xin lỗi, mình không thể kết nối tới máy chủ AI lúc này.\n\n" +
        `Chi tiết: ${error.message}`,
      createdAt: Date.now(),
      error: true,
    });

    syncCurrentChat();
    renderMessages();

    showToast("Không thể gửi tin nhắn.");
  } finally {
    state.isLoading = false;

    removeTyping();
    updateSendButton();

    textarea?.focus();
  }
}

function updateSendButton() {
  const button = $("#sendButton");

  if (!button) return;

  const textarea = $("#messageInput");

  const hasText =
    textarea?.value.trim().length > 0;

  button.disabled =
    state.isLoading || !hasText;
}

/* =========================================================
   TEXTAREA
========================================================= */

function autoResizeTextarea(textarea) {
  if (!textarea) return;

  textarea.style.height = "auto";

  const height = Math.min(
    textarea.scrollHeight,
    180
  );

  textarea.style.height = `${height}px`;

  updateSendButton();
}

/* =========================================================
   COPY
========================================================= */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Đã sao chép.");
  } catch {
    const textarea =
      document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    document.execCommand("copy");
    textarea.remove();

    showToast("Đã sao chép.");
  }
}

/* =========================================================
   AUTH MODAL
========================================================= */

function openAuth(mode = "login") {
  closeAllPopovers();
  openModal("authModal");

  switchAuthTab(mode);
}

function switchAuthTab(mode) {
  const loginTab = $("#loginTab");
  const signupTab = $("#signupTab");

  const loginForm = $("#loginForm");
  const signupForm = $("#signupForm");

    
