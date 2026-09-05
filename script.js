"use strict";

/* =====================================================
   CONFIG
===================================================== */

/*
  GITHUB PAGES:
  Thay URL bên dưới bằng API Vercel thật của bạn.

  Ví dụ:
  const API_URL =
    "https://khanhos-ai.vercel.app/api/chat";
*/

const API_URL = "/api/chat";

const STORAGE_KEY = "khanhos_chat_history";
const SETTINGS_KEY = "khanhos_settings";


/* =====================================================
   STATE
===================================================== */

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
    saveHistory: true
  }
};


/* =====================================================
   HELPERS
===================================================== */

function $(selector, parent = document) {
  return parent.querySelector(selector);
}

function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

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
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

function getInitials(name = "K") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "K";

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

function showToast(message) {
  const container =
    $("#toastContainer");

  if (!container) return;

  const toast =
    document.createElement("div");

  toast.className = "toast";

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";

    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 2500);
}

function closeAllPopovers() {
  $$(".popover").forEach(
    (element) => {
      element.classList.add("hidden");
    }
  );
}

function openModal(id) {
  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("hidden");

  document.body.style.overflow =
    "hidden";
}

function closeModal(id) {
  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.classList.add("hidden");

  const openModalExists =
    $$(".modal-overlay").some(
      (element) =>
        !element.classList.contains(
          "hidden"
        )
    );

  if (!openModalExists) {
    document.body.style.overflow = "";
  }
}

function closeAllModals() {
  $$(".modal-overlay").forEach(
    (element) => {
      element.classList.add("hidden");
    }
  );

  document.body.style.overflow = "";
}


/* =====================================================
   SETTINGS STORAGE
===================================================== */

function loadSettings() {
  try {
    const saved =
      localStorage.getItem(
        SETTINGS_KEY
      );

    if (!saved) return;

    const parsed =
      JSON.parse(saved);

    state.settings = {
      ...state.settings,
      ...parsed
    };

  } catch (error) {
    console.error(
      "Settings error:",
      error
    );
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(
        state.settings
      )
    );
  } catch (error) {
    console.error(
      "Save settings error:",
      error
    );
  }
}


/* =====================================================
   THEME
===================================================== */

function applyTheme() {
  let dark = false;

  if (
    state.settings.theme ===
    "dark"
  ) {
    dark = true;
  }

  if (
    state.settings.theme ===
    "system"
  ) {
    dark =
      window.matchMedia &&
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
  }

  document.body.classList.toggle(
    "dark",
    dark
  );

  const select =
    $("#themeSelect");

  if (select) {
    select.value =
      state.settings.theme;
  }
}


/* =====================================================
   CHAT STORAGE
===================================================== */

function loadChats() {
  if (
    !state.settings.saveHistory
  ) {
    state.chats = [];
    return;
  }

  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      state.chats = [];
      return;
    }

    const parsed =
      JSON.parse(saved);

    state.chats =
      Array.isArray(parsed)
        ? parsed
        : [];

  } catch (error) {
    console.error(
      "Chat storage error:",
      error
    );

    state.chats = [];
  }
}

function saveChats() {
  if (
    !state.settings.saveHistory
  ) {
    localStorage.removeItem(
      STORAGE_KEY
    );

    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        state.chats
      )
    );
  } catch (error) {
    console.error(
      "Save chats error:",
      error
    );
  }
}


/* =====================================================
   HISTORY UI
===================================================== */

function renderHistory() {
  const list =
    $("#historyList");

  if (!list) return;

  if (!state.chats.length) {
    list.innerHTML = `
      <div class="history-empty">
        Chưa có cuộc trò chuyện nào
      </div>
    `;

    return;
  }

  const chats =
    [...state.chats].sort(
      (a, b) =>
        (b.updatedAt || 0) -
        (a.updatedAt || 0)
    );

  list.innerHTML =
    chats
      .map(
        (chat) => `
          <button
            class="history-item ${
              chat.id ===
              state.currentChatId
                ? "active"
                : ""
            }"
            data-chat-id="${escapeHTML(
              chat.id
            )}"
            type="button"
          >

            <span>💬</span>

            <span class="history-item-title">
              ${escapeHTML(
                chat.title ||
                  "New Chat"
              )}
            </span>

            <span
              class="history-delete"
              data-delete-chat="${escapeHTML(
                chat.id
              )}"
              title="Xóa"
            >
              ×
            </span>

          </button>
        `
      )
      .join("");

  $$(".history-item", list)
    .forEach((button) => {

      button.addEventListener(
        "click",
        (event) => {

          const deleteButton =
            event.target.closest(
              "[data-delete-chat]"
            );

          if (deleteButton) {
            deleteChat(
              deleteButton.dataset
                .deleteChat,
              event
            );

            return;
          }

          loadChat(
            button.dataset.chatId
          );
        }
      );

    });
}


/* =====================================================
   NEW CHAT
===================================================== */

function createNewChat() {
  state.currentChatId =
    generateId();

  state.messages = [];

  renderMessages();

  renderHistory();

  hideWelcome(false);

  const input =
    $("#messageInput");

  if (input) {
    input.value = "";

    autoResizeTextarea(input);

    input.focus();
  }

  closeMobileSidebar();
}


/* =====================================================
   CHAT RECORD
===================================================== */

function createChatRecord(
  firstMessage = ""
) {

  const id =
    state.currentChatId ||
    generateId();

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

    createdAt:
      Date.now(),

    updatedAt:
      Date.now(),

    messages: []
  };

  state.chats.unshift(chat);

  saveChats();

  renderHistory();

  return chat;
}

function getCurrentChat() {
  return state.chats.find(
    (chat) =>
      chat.id ===
      state.currentChatId
  );
}

function syncCurrentChat() {
  if (
    !state.currentChatId
  ) {
    return;
  }

  let chat =
    getCurrentChat();

  if (!chat) {
    chat =
      createChatRecord(
        state.messages[0]
          ?.content || ""
      );
  }

  chat.messages =
    state.messages;

  chat.updatedAt =
    Date.now();

  if (
    chat.title ===
      "New Chat" &&
    state.messages[0]
      ?.content
  ) {
    chat.title =
      state.messages[0]
        .content
        .replace(/\s+/g, " ")
        .slice(0, 55);
  }

  saveChats();

  renderHistory();
}


/* =====================================================
   LOAD CHAT
===================================================== */

function loadChat(chatId) {
  const chat =
    state.chats.find(
      (item) =>
        item.id === chatId
    );

  if (!chat) return;

  state.currentChatId =
    chat.id;

  state.messages =
    Array.isArray(
      chat.messages
    )
      ? [...chat.messages]
      : [];

  hideWelcome(
    state.messages.length > 0
  );

  renderMessages();

  renderHistory();

  closeAllPopovers();

  closeMobileSidebar();
}


/* =====================================================
   DELETE CHAT
===================================================== */

function deleteChat(
  chatId,
  event
) {
  event?.stopPropagation();

  state.chats =
    state.chats.filter(
      (chat) =>
        chat.id !== chatId
    );

  saveChats();

  if (
    state.currentChatId ===
    chatId
  ) {

    state.currentChatId =
      null;

    state.messages = [];

    renderMessages();

    hideWelcome(false);
  }

  renderHistory();

  showToast(
    "Đã xóa cuộc trò chuyện."
  );
}


/* =====================================================
   WELCOME
===================================================== */

function hideWelcome(hide) {
  const welcome =
    $("#welcome");

  if (!welcome) return;

  welcome.classList.toggle(
    "hidden",
    hide
  );
}


/* =====================================================
   MARKDOWN
===================================================== */

function renderMarkdown(text) {
  let html =
    escapeHTML(text);

  html =
    html.replace(
      /```([\s\S]*?)```/g,
      (_, code) =>
        `<pre><code>${code.trim()}</code></pre>`
    );

  html =
    html.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );

  html =
    html.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

  html =
    html.replace(
      /\*(.*?)\*/g,
      "<em>$1</em>"
    );

  html =
    html.replace(
      /^### (.+)$/gm,
      "<h3>$1</h3>"
    );

  html =
    html.replace(
      /^## (.+)$/gm,
      "<h3>$1</h3>"
    );

  html =
    html.replace(
      /^# (.+)$/gm,
      "<h3>$1</h3>"
    );

  html =
    html.replace(
      /^\s*[-*] (.+)$/gm,
      "<li>$1</li>"
    );

  html =
    html.replace(
      /(<li>.*<\/li>)/gs,
      "<ul>$1</ul>"
    );

  html =
    html.replace(
      /\n{2,}/g,
      "</p><p>"
    );

  html =
    html.replace(
      /\n/g,
      "<br>"
    );

  return `<p>${html}</p>`;
}


/* =====================================================
   RENDER MESSAGES
===================================================== */

function renderMessages() {
  const container =
    $("#messages");

  if (!container) return;

  if (!state.messages.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML =
    state.messages
      .map(
        (message, index) => {

          const user =
            message.role ===
            "user";

          const content =
            user
              ? escapeHTML(
                  message.content
                ).replace(
                  /\n/g,
                  "<br>"
                )
              : renderMarkdown(
                  message.content
                );

          return `
            <div
              class="message ${
                user
                  ? "user"
                  : "assistant"
              }"
            >

              <div class="message-avatar">
                ${
                  user
                    ? "U"
                    : "K"
                }
              </div>

              <div class="message-body">

                <div class="message-content">
                  ${content}
                </div>

                ${
                  !user
                    ? `
                      <div class="message-actions">

                        <button
                          class="message-action"
                          data-copy-message="${index}"
                          type="button"
                          title="Sao chép"
                        >
                          ⧉
                        </button>

                      </div>
                    `
                    : ""
                }

              </div>

            </div>
          `;
        }
      )
      .join("");

  $(
    "[data-copy-message]",
    container
  ).forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const index =
          Number(
            button.dataset
              .copyMessage
          );

        const message =
          state.messages[index];

        if (!message) return;

        copyText(
          message.content
        );
      }
    );

  });

  scrollToBottom();
}


/* =====================================================
   TYPING
===================================================== */

function renderTyping() {
  const container =
    $("#messages");

  if (!container) return;

  removeTyping();

  const element =
    document.createElement(
      "div"
    );

  element.className =
    "message assistant";

  element.id =
    "typingMessage";

  element.innerHTML = `
    <div class="message-avatar">
      K
    </div>

    <div class="message-body">

      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>
  `;

  container.appendChild(
    element
  );

  scrollToBottom();
}

function removeTyping() {
  $("#typingMessage")
    ?.remove();
}


/* =====================================================
   SCROLL
===================================================== */

function scrollToBottom() {
  const area =
    $("#chatArea");

  if (!area) return;

  requestAnimationFrame(() => {
    area.scrollTop =
      area.scrollHeight;
  });
}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage(
  presetText = null
) {

  if (state.isLoading) {
    return;
  }

  const input =
    $("#messageInput");

  const text =
    presetText !== null
      ? presetText.trim()
      : input?.value.trim();

  if (!text) return;

  if (
    !state.currentChatId
  ) {
    createChatRecord(text);
  }

  hideWelcome(true);

  const userMessage = {
    id: generateId(),

    role: "user",

    content: text,

    createdAt:
      Date.now()
  };

  state.messages.push(
    userMessage
  );

  if (input) {
    input.value = "";

    autoResizeTextarea(
      input
    );
  }

  renderMessages();

  syncCurrentChat();

  state.isLoading = true;

  updateSendButton();

  renderTyping();


  /* ===================================
     CALL BACKEND
  =================================== */

  try {

    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "application/json"
          },

          body: JSON.stringify({
            model:
              state.selectedModel,

            messages:
              state.messages.map(
                (message) => ({
                  role:
                    message.role,

                  content:
                    message.content
                })
              ),

            chatId:
              state.currentChatId
          })
        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(
        data.error ||
        data.message ||
        `HTTP ${response.status}`
      );
    }


    /*
      Support several backend formats.
    */

    const reply =
      data.reply ||
      data.content ||
      data.message?.content ||
      data.choices?.[0]
        ?.message?.content ||
      data.choices?.[0]
        ?.text;


    if (!reply) {

      throw new Error(
        "API không trả về nội dung."
      );
    }


    state.messages.push({
      id: generateId(),

      role: "assistant",

      content:
        String(reply),

      createdAt:
        Date.now()
    });


    syncCurrentChat();

    renderMessages();


  } catch (error) {

    console.error(
      "Chat API error:",
      error
    );


    state.messages.push({
      id: generateId(),

      role: "assistant",

      content:
        "Không thể kết nối tới KhanhOS AI.\n\n" +
        `Lỗi: ${error.message}`,

      createdAt:
        Date.now()
    });


    syncCurrentChat();

    renderMessages();

    showToast(
      "Không thể kết nối API."
    );


  } finally {

    state.isLoading =
      false;

    removeTyping();

    updateSendButton();

    input?.focus();
  }
}


/* =====================================================
   SEND BUTTON
===================================================== */

function updateSendButton() {
  const button =
    $("#sendButton");

  const input =
    $("#messageInput");

  if (!button) return;

  const hasText =
    Boolean(
      input?.value.trim()
    );

  button.disabled =
    state.isLoading ||
    !hasText;
}


/* =====================================================
   TEXTAREA
===================================================== */

function autoResizeTextarea(
  textarea
) {

  if (!textarea) return;

  textarea.style.height =
    "auto";

  textarea.style.height =
    Math.min(
      textarea.scrollHeight,
      180
    ) + "px";

  updateSendButton();
}


/* =====================================================
   COPY
===================================================== */

async function copyText(
  text
) {

  try {

    await navigator
      .clipboard
      .writeText(text);

    showToast(
      "Đã sao chép."
    );

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value = text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    showToast(
      "Đã sao chép."
    );
  }
}


/* =====================================================
   AUTH
===================================================== */

async function loadCurrentUser() {

  try {

    const response =
      await fetch(
        "/api/auth/me",
        {
          credentials:
            "include"
        }
      );

    if (!response.ok) {
      state.user = null;

      updateAuthUI();

      return;
    }

    const data =
      await response.json();

    state.user =
      data.user ||
      data ||
      null;

    updateAuthUI();

  } catch {

    state.user = null;

    updateAuthUI();
  }
}


function updateAuthUI() {

  const names =
    $$(".profile-name");

  const tiers =
    $$(".profile-tier");

  const avatar =
    $(".profile-button .avatar");

  const accountName =
    $("#accountName");

  const accountTier =
    $("#accountTier");


  if (!state.user) {

    names.forEach(
      (element) => {
        element.textConten
