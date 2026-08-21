/* =========================================================
   ELEMENTS
========================================================= */

const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const fileButton = document.getElementById("fileButton");
const fileInput = document.getElementById("fileInput");

const welcome = document.getElementById("welcome");
const messages = document.getElementById("messages");
const chatArea = document.getElementById("chatArea");

const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

const profileButton = document.getElementById("profileButton");
const accountMenu = document.getElementById("accountMenu");

const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsClose = document.getElementById("settingsClose");

const settingsPageTitle =
  document.getElementById("settingsPageTitle");

const generalSettings =
  document.getElementById("generalSettings");

const otherSettings =
  document.getElementById("otherSettings");

const otherSettingsTitle =
  document.getElementById("otherSettingsTitle");

const themeSelect =
  document.getElementById("themeSelect");


/* =========================================================
   AI CONFIG
========================================================= */

/*
  API KEY KHÔNG nằm ở đây.

  Browser chỉ gọi:
      /api/chat

  Server mới giữ:
      OPENAI_API_KEY
      ANTHROPIC_API_KEY
*/

/*
  Đổi provider tại đây:

  "openai"
  "claude"
*/

let selectedProvider = "openai";


/*
  Model mặc định.

  Server sẽ kiểm tra model
  trước khi gửi tới AI.
*/

let selectedModel = "gpt-5-mini";


/*
  Cho phép đổi AI bằng code sau này:

  OpenAI:
      selectedProvider = "openai";
      selectedModel = "gpt-5-mini";

  Claude:
      selectedProvider = "claude";
      selectedModel = "claude-sonnet-4-5";
*/


/* =========================================================
   STATE
========================================================= */

const STORAGE_KEY = "khanhos-chats";

let chats = loadChats();
let currentChatId = null;

let aiGenerating = false;


/* =========================================================
   STORAGE
========================================================= */

function loadChats() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const data =
      JSON.parse(saved);

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    console.error(
      "Không thể đọc lịch sử chat:",
      error
    );

    return [];
  }
}


function saveChats() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );

  } catch (error) {

    console.error(
      "Không thể lưu lịch sử chat:",
      error
    );
  }
}


/* =========================================================
   CHAT ID
========================================================= */

function generateChatId() {

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


/* =========================================================
   CHAT TITLE
========================================================= */

function makeChatTitle(text) {

  const clean =
    text.replace(/\s+/g, " ").trim();

  if (clean.length <= 35) {
    return clean;
  }

  return clean.slice(0, 35) + "...";
}


/* =========================================================
   CREATE CHAT
========================================================= */

function createChat(firstMessage = "") {

  const chat = {

    id: generateChatId(),

    title:
      firstMessage
        ? makeChatTitle(firstMessage)
        : "Cuộc chat mới",

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


/* =========================================================
   GET CURRENT CHAT
========================================================= */

function getCurrentChat() {

  if (!currentChatId) {
    return null;
  }

  return (
    chats.find(
      chat => chat.id === currentChatId
    ) || null
  );
}


/* =========================================================
   START NEW CHAT
========================================================= */

function startNewChat() {

  currentChatId = null;

  messages.innerHTML = "";

  welcome.style.display = "flex";

  input.value = "";

  input.style.height = "auto";

  updateInputState();

  renderChatList();

  input.focus();

  if (window.innerWidth <= 800) {

    sidebar.classList.remove("open");
  }
}


/* =========================================================
   OPEN OLD CHAT
========================================================= */

function openChat(chatId) {

  const chat =
    chats.find(
      item => item.id === chatId
    );

  if (!chat) {
    return;
  }

  currentChatId =
    chat.id;

  messages.innerHTML = "";

  if (chat.messages.length === 0) {

    welcome.style.display = "flex";

  } else {

    welcome.style.display = "none";

    chat.messages.forEach(message => {

      renderMessage(
        message.text,
        message.role
      );

    });
  }

  renderChatList();

  requestAnimationFrame(() => {

    chatArea.scrollTop =
      chatArea.scrollHeight;

  });
}


/* =========================================================
   RENDER CHAT LIST
========================================================= */

function renderChatList() {

  chatList.innerHTML = "";

  chats.forEach(chat => {

    const item =
      document.createElement("button");

    item.className =
      "chat-item";

    if (chat.id === currentChatId) {

      item.classList.add("active");
    }

    item.innerHTML = `
      <span class="chat-icon">💬</span>
      <span class="chat-name"></span>
    `;

    item
      .querySelector(".chat-name")
      .textContent =
      chat.title;

    item.addEventListener(
      "click",
      () => {

        openChat(chat.id);

      }
    );

    chatList.appendChild(item);

  });
}


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

    updateInputState();

    resizeInput();

  }
);


/* =========================================================
   AI REQUEST
========================================================= */

async function askKhanhOSAI(chat) {

  /*
    Lấy lịch sử hiện tại.

    role:
      user
      ai

    sẽ được đổi thành:
      user
      assistant
  */

  const history =
    chat.messages
      .filter(message =>
        message.role === "user" ||
        message.role === "ai"
      )
      .map(message => ({

        role:
          message.role === "ai"
            ? "assistant"
            : "user",

        content:
          message.text

      }));


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

  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      "Server trả về dữ liệu không hợp lệ."
    );
  }


  if (!response.ok) {

    throw new Error(
      data.error ||
      "KhanhOS AI không thể xử lý yêu cầu."
    );
  }


  if (
    typeof data.reply !== "string"
  ) {

    throw new Error(
      "AI không trả về nội dung."
    );
  }


  return data.reply;
}


/* =========================================================
   AI LOADING
========================================================= */

function renderThinkingMessage() {

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

  content.textContent =
    "KhanhOS AI đang suy nghĩ...";


  message.appendChild(avatar);

  message.appendChild(content);

  messages.appendChild(message);


  requestAnimationFrame(() => {

    chatArea.scrollTop =
      chatArea.scrollHeight;

  });


  return message;
}


function removeThinkingMessage() {

  const thinking =
    messages.querySelector(
      '[data-thinking="true"]'
    );

  if (thinking) {

    thinking.remove();

  }
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


  /*
    Nếu chưa có chat,
    tạo chat ngay khi gửi.
  */

  let chat =
    getCurrentChat();


  if (!chat) {

    chat =
      createChat(text);
  }


  /*
    Tin nhắn đầu tiên
    trở thành tiêu đề.
  */

  if (chat.messages.length === 0) {

    chat.title =
      makeChatTitle(text);
  }


  /*
    Lưu user message.
  */

  chat.messages.push({

    role: "user",

    text: text,

    createdAt: Date.now()

  });


  chat.updatedAt =
    Date.now();


  saveChats();


  /*
    Hiện message user.
  */

  welcome.style.display =
    "none";


  renderMessage(
    text,
    "user"
  );


  /*
    Xóa input.
  */

  input.value = "";

  input.style.height =
    "auto";


  aiGenerating =
    true;

  updateInputState();

  renderChatList();


  /*
    Loading.
  */

  const thinking =
    renderThinkingMessage();


  try {

    /*
      Gọi backend.

      API key KHÔNG xuất hiện
      trong browser.
    */

    const reply =
      await askKhanhOSAI(chat);


    /*
      Kiểm tra chat còn tồn tại.
    */

    const activeChat =
      chats.find(
        item =>
          item.id === chat.id
      );


    if (!activeChat) {

      return;
    }


    /*
      Lưu câu trả lời AI.
    */

    activeChat.messages.push({

      role: "ai",

      text: reply,

      createdAt: Date.now()

    });


    activeChat.updatedAt =
      Date.now();


    saveChats();


    /*
      Xóa loading.
    */

    if (thinking) {
      thinking.remove();
    }


    /*
      Chỉ render nếu
      user vẫn đang ở chat đó.
    */

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


    if (thinking) {
      thinking.remove();
    }


    const errorText =
      "❌ Không thể kết nối KhanhOS AI.\n\n" +
      error.message;


    /*
      Lưu lỗi như phản hồi AI
      để lịch sử vẫn nhất quán.
    */

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
      currentChatId === chat.id
    ) {

      renderMessage(
        errorText,
        "ai"
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
   RENDER MESSAGE
========================================================= */

function renderMessage(
  text,
  role
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


  requestAnimationFrame(() => {

    chatArea.scrollTop =
      chatArea.scrollHeight;

  });
}


/* =========================================================
   SEND EVENTS
========================================================= */

sendButton.addEventListener(
  "click",
  sendMessage
);


input.addEventListener(
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


/* =========================================================
   CHAT MỚI
========================================================= */

newChatBtn.addEventListener(
  "click",
  startNewChat
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

    const files =
      Array.from(
        fileInput.files
      );


    if (!files.length) {
      return;
    }


    let chat =
      getCurrentChat();


    if (!chat) {

      chat =
        createChat(
          files[0].name
        );

    }


    const fileNames =
      files
        .map(
          file =>
            `• ${file.name}`
        )
        .join("\n");


    const text =
      `Đã chọn file:\n${fileNames}`;


    chat.messages.push({

      role: "user",

      text: text,

      createdAt: Date.now()

    });


    chat.updatedAt =
      Date.now();


    saveChats();


    welcome.style.display =
      "none";


    renderMessage(
      text,
      "user"
    );


    renderChatList();


    fileInput.value = "";

  }
);


/* =========================================================
   SUGGESTIONS
========================================================= */

document
  .querySelectorAll(".suggestion")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        input.value =
          button.dataset.text;

        updateInputState();

        resizeInput();

        input.focus();

      }
    );

  });


/* =========================================================
   ACCOUNT MENU
========================================================= */

profileButton.addEventListener(
  "click",
  event => {

    event.preventDefault();

    event.stopPropagation();

    accountMenu.classList.toggle(
      "open"
    );

  }
);


accountMenu.addEventListener(
  "click",
  event => {

    event.stopPropagation();

  }
);


document.addEventListener(
  "click",
  event => {

    if (
      !profileButton.contains(
        event.target
      ) &&
      !accountMenu.contains(
        event.target
      )
    ) {

      accountMenu.classList.remove(
        "open"
      );

    }

  }
);


/* =========================================================
   SETTINGS
========================================================= */

settingsBtn.addEventListener(
  "click",
  event => {

    event.preventDefault();

    event.stopPropagation();

    accountMenu.classList.remove(
      "open"
    );

    settingsOverlay.classList.add(
      "open"
    );

  }
);


settingsClose.addEventListener(
  "click",
  () => {

    settingsOverlay.classList.remove(
      "open"
    );

  }
);


settingsOverlay.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      settingsOverlay
    ) {

      settingsOverlay.classList.remove(
        "open"
      );

    }

  }
);


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


    accountMenu.classList.remove(
      "open"
    );


    settingsOverlay.classList.remove(
      "open"
    );

  }
);


/* =========================================================
   SETTINGS NAVIGATION
========================================================= */

document
  .querySelectorAll(
    ".settings-nav-item"
  )
  .forEach(item => {

    item.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".settings-nav-item"
          )
          .forEach(nav => {

            nav.classList.remove(
              "active"
            );

          });


        item.classList.add(
          "active"
        );


        const title =
          item.dataset.title;


        settingsPageTitle.textContent =
          title;


        if (
          title === "Chung"
        ) {

          generalSettings.style.display =
            "block";

          otherSettings.style.display =
            "none";

        } else {

          generalSettings.style.display =
            "none";

          otherSettings.style.display =
            "flex";

          otherSettingsTitle.textContent =
            title;

        }

      }
    );

  });


/* =========================================================
   SETTINGS SEARCH
========================================================= */

const settingsSearch =
  document.getElementById(
    "settingsSearch"
  );


settingsSearch.addEventListener(
  "input",
  () => {

    const query =
      settingsSearch.value
        .trim()
        .toLowerCase();


    document
      .querySelectorAll(
        ".settings-nav-item"
      )
      .forEach(item => {

        const title =
          item.dataset.title
            .toLowerCase();


        item.style.display =
          !query ||
          title.includes(query)
            ? "flex"
            : "none";

      });

  }
);


/* =========================================================
   THEME
========================================================= */

function applyTheme(theme) {

  if (
    theme === "light"
  ) {

    document.body.classList.add(
      "light-theme"
    );

  } else {

    document.body.classList.remove(
      "light-theme"
    );

  }
}


themeSelect.addEventListener(
  "change",
  () => {

    const theme =
      themeSelect.value;


    localStorage.setItem(
      "khanhos-theme",
      theme
    );


    applyTheme(theme);

  }
);


const savedTheme =
  localStorage.getItem(
    "khanhos-theme"
  );


if (savedTheme) {

  themeSelect.value =
    savedTheme;

  applyTheme(
    savedTheme
  );

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

mobileMenu.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    sidebar.classList.toggle(
      "open"
    );

  }
);


document.addEventListener(
  "click",
  event => {

    if (
      window.innerWidth > 800
    ) {

      return;
    }


    if (
      sidebar.contains(
        event.target
      ) ||
      mobileMenu.contains(
        event.target
      )
    ) {

      return;
    }


    sidebar.classList.remove(
      "open"
    );

  }
);


/* =========================================================
   STARTUP
========================================================= */

currentChatId =
  null;

messages.innerHTML =
  "";

welcome.style.display =
  "flex";

renderChatList();

updateInputState();
