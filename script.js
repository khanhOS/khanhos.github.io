// ============================================================
// KhanhOS static chat client — có đăng nhập nhiều tài khoản
// LƯU Ý BẢO MẬT: tài khoản/mật khẩu chỉ lưu trong localStorage
// của trình duyệt này. Đây KHÔNG phải hệ thống auth server thật —
// ai mở DevTools trên chính máy đó vẫn xem được dữ liệu thô.
// Chỉ phù hợp để tách lịch sử chat giữa nhiều người dùng chung 1 máy.
// ============================================================

const DEFAULT_SYSTEM_PROMPT = `Bạn là KhanhOS, một trợ lý AI lập trình. Trả lời chính xác, ngắn gọn,
có ví dụ code khi cần, dùng Markdown, code luôn để trong code block có gắn ngôn ngữ.`;

const LS_USERS = 'khanhos_users';     // { [username]: { passwordHash, chats, settings } }
const LS_SESSION = 'khanhos_session'; // username hiện đang đăng nhập

// ---------- Simple hash (KHÔNG phải mã hoá bảo mật cấp production) ----------
function simpleHash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function genId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch { /* fall through */ }
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// ---------- Users storage ----------
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  } catch {
    return {};
  }
}
function saveUsers(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

function registerUser(username, password) {
  const users = loadUsers();
  if (users[username]) return { ok: false, error: 'Tên đăng nhập đã tồn tại.' };
  users[username] = {
    passwordHash: simpleHash(password),
    chats: [],
    settings: {
      endpoint: 'https://api.cerebras.ai/v1/chat/completions',
      apiKey: '',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    },
  };
  saveUsers(users);
  return { ok: true };
}

function verifyUser(username, password) {
  const users = loadUsers();
  const user = users[username];
  if (!user) return { ok: false, error: 'Tài khoản không tồn tại.' };
  if (user.passwordHash !== simpleHash(password)) return { ok: false, error: 'Sai mật khẩu.' };
  return { ok: true };
}

function getSessionUsername() {
  return localStorage.getItem(LS_SESSION);
}
function setSessionUsername(username) {
  if (username) localStorage.setItem(LS_SESSION, username);
  else localStorage.removeItem(LS_SESSION);
}

function getCurrentUserData() {
  const username = getSessionUsername();
  if (!username) return null;
  const users = loadUsers();
  return users[username] || null;
}
function saveCurrentUserData(data) {
  const username = getSessionUsername();
  if (!username) return;
  const users = loadUsers();
  users[username] = data;
  saveUsers(users);
}

// ---------- App state ----------
let state = {
  chats: [],
  activeChatId: null,
  streaming: false,
  abortController: null,
};

let settings = {
  endpoint: 'https://api.cerebras.ai/v1/chat/completions',
  apiKey: '',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const els = {};

function cacheEls() {
  [
    'authScreen', 'tabLogin', 'tabRegister', 'loginForm', 'registerForm',
    'loginUsername', 'loginPassword', 'loginError',
    'registerUsername', 'registerPassword', 'registerPassword2', 'registerError',
    'app', 'sidebar', 'chatList', 'messages', 'welcome', 'chatForm', 'chatInput',
    'btnSend', 'btnStop', 'chatTitle', 'modelSelect', 'settingsModal',
    'apiEndpoint', 'apiKey', 'systemPrompt', 'toastContainer',
    'userAvatar', 'userName', 'btnLogout',
    'btnNewChat', 'btnCollapseSidebar', 'btnOpenSidebar', 'btnSettings',
    'btnCloseSettings', 'btnSaveSettings',
  ].forEach((id) => { els[id] = $(id); });
}

// ---------- Toast ----------
function showToast(message, isError = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = message;
  els.toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---------- Persist current user's chats/settings ----------
function persistUser() {
  saveCurrentUserData({
    passwordHash: loadUsers()[getSessionUsername()]?.passwordHash,
    chats: state.chats,
    settings: settings,
  });
}

// ---------- Chat management ----------
function createChat() {
  const chat = { id: genId(), title: 'Đoạn chat mới', messages: [] };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  persistUser();
  renderChatList();
  renderMessages();
}

function getActiveChat() {
  return state.chats.find((c) => c.id === state.activeChatId) || null;
}

function deleteChat(id) {
  state.chats = state.chats.filter((c) => c.id !== id);
  if (state.activeChatId === id) state.activeChatId = state.chats[0]?.id ?? null;
  persistUser();
  renderChatList();
  renderMessages();
}

function selectChat(id) {
  state.activeChatId = id;
  renderChatList();
  renderMessages();
  if (window.innerWidth <= 768) els.sidebar.classList.remove('open');
}

// ---------- Rendering ----------
function renderChatList() {
  els.chatList.innerHTML = '';
  for (const chat of state.chats) {
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === state.activeChatId ? ' active' : '');
    item.innerHTML = `<span></span><button class="btn-delete" title="Xoá">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
    </button>`;
    item.querySelector('span').textContent = chat.title;
    item.addEventListener('click', () => selectChat(chat.id));
    item.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });
    els.chatList.appendChild(item);
  }
}

function renderMessages() {
  const chat = getActiveChat();
  els.messages.innerHTML = '';

  if (!chat || chat.messages.length === 0) {
    els.chatTitle.textContent = 'KhanhOS';
    const welcome = document.createElement('div');
    welcome.className = 'welcome';
    welcome.innerHTML = '<h1>KhanhOS</h1><p>Trợ lý AI chuyên về lập trình — viết code, gỡ lỗi, thiết kế kiến trúc.</p>';
    els.messages.appendChild(welcome);
    return;
  }

  els.chatTitle.textContent = chat.title;
  for (const msg of chat.messages) {
    els.messages.appendChild(renderMessageRow(msg.role, msg.content));
  }
  scrollToBottom();
}

function renderMessageRow(role, content) {
  const row = document.createElement('div');
  row.className = 'msg-row ' + role;
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = 'K';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = renderMarkdown(content);
  row.appendChild(avatar);
  row.appendChild(bubble);
  attachCopyButtons(bubble);
  return row;
}

function scrollToBottom() {
  els.messages.scrollTop = els.messages.scrollHeight;
}

// ---------- Minimal Markdown renderer ----------
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderMarkdown(md) {
  const blocks = [];
  let text = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = blocks.length;
    blocks.push({ lang, code });
    return `\u0000CODEBLOCK${idx}\u0000`;
  });

  text = escapeHtml(text);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const lines = text.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${trimmed.replace(/^[-*]\s+/, '')}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (trimmed === '') continue;
      // Code-block placeholders shouldn't be wrapped in <p>
      if (/^\u0000CODEBLOCK\d+\u0000$/.test(trimmed)) {
        html += trimmed;
      } else {
        html += `<p>${line}</p>`;
      }
    }
  }
  if (inList) html += '</ul>';

  html = html.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (_, i) => {
    const { lang, code } = blocks[i];
    return `<pre><button class="copy-btn" data-code="${encodeURIComponent(code)}">Copy</button><code class="lang-${escapeHtml(lang || 'text')}">${escapeHtml(code)}</code></pre>`;
  });
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function attachCopyButtons(container) {
  container.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = decodeURIComponent(btn.dataset.code);
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'Đã chép!';
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      } catch {
        showToast('Không thể copy', true);
      }
    });
  });
}

// ---------- Sending messages / streaming ----------
function setStreaming(isStreaming) {
  state.streaming = isStreaming;
  els.btnSend.classList.toggle('hidden', isStreaming);
  els.btnStop.classList.toggle('hidden', !isStreaming);
  els.chatInput.disabled = isStreaming;
}

async function sendMessage(content) {
  if (!content.trim()) return;

  if (!settings.apiKey) {
    showToast('Vui lòng nhập API key trong Cài đặt trước.', true);
    openSettings();
    return;
  }

  let chat = getActiveChat();
  if (!chat) {
    chat = { id: genId(), title: 'Đoạn chat mới', messages: [] };
    state.chats.unshift(chat);
    state.activeChatId = chat.id;
  }

  chat.messages.push({ role: 'user', content });
  if (chat.title === 'Đoạn chat mới') {
    chat.title = content.slice(0, 40) + (content.length > 40 ? '…' : '');
  }
  persistUser();
  renderChatList();
  renderMessages();

  const assistantMsg = { role: 'assistant', content: '' };
  chat.messages.push(assistantMsg);
  const row = renderMessageRow('assistant', '');
  els.messages.appendChild(row);
  const bubble = row.querySelector('.msg-bubble');
  bubble.innerHTML = '<span class="typing-cursor"></span>';
  scrollToBottom();

  setStreaming(true);
  state.abortController = new AbortController();

  try {
    const apiMessages = [
      { role: 'system', content: settings.systemPrompt || DEFAULT_SYSTEM_PROMPT },
      ...chat.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch(settings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: els.modelSelect.value,
        messages: apiMessages,
        stream: true,
      }),
      signal: state.abortController.signal,
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API lỗi (${res.status}): ${errText.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            fullText += delta;
            assistantMsg.content = fullText;
            bubble.innerHTML = renderMarkdown(fullText) + '<span class="typing-cursor"></span>';
            attachCopyButtons(bubble);
            scrollToBottom();
          }
        } catch { /* bỏ qua dòng keepalive không phải JSON */ }
      }
    }

    bubble.innerHTML = renderMarkdown(fullText || '(không có phản hồi)');
    attachCopyButtons(bubble);
    persistUser();
  } catch (err) {
    if (err.name === 'AbortError') {
      bubble.innerHTML = renderMarkdown(assistantMsg.content || '_(đã dừng)_');
    } else {
      console.error(err);
      bubble.innerHTML = `<p style="color:#e5484d">${escapeHtml(err.message || 'Có lỗi xảy ra khi gọi API')}</p>`;
      showToast(err.message || 'Lỗi khi gọi API', true);
    }
    persistUser();
  } finally {
    setStreaming(false);
    state.abortController = null;
  }
}

function stopStreaming() {
  if (state.abortController) state.abortController.abort();
}

// ---------- Settings modal ----------
function openSettings() {
  els.apiEndpoint.value = settings.endpoint;
  els.apiKey.value = settings.apiKey;
  els.systemPrompt.value = settings.systemPrompt;
  els.settingsModal.classList.remove('hidden');
}
function closeSettings() {
  els.settingsModal.classList.add('hidden');
}
function saveSettingsFromModal() {
  settings.endpoint = els.apiEndpoint.value.trim() || settings.endpoint;
  settings.apiKey = els.apiKey.value.trim();
  settings.systemPrompt = els.systemPrompt.value.trim() || DEFAULT_SYSTEM_PROMPT;
  persistUser();
  closeSettings();
  showToast('Đã lưu cài đặt.');
}

// ---------- Textarea auto-resize ----------
function autoResize() {
  els.chatInput.style.height = 'auto';
  els.chatInput.style.height = Math.min(els.chatInput.scrollHeight, 200) + 'px';
}

// ---------- Auth screen ----------
function showAuthScreen() {
  els.authScreen.classList.remove('hidden');
  els.app.classList.add('hidden');
}
function showApp() {
  els.authScreen.classList.add('hidden');
  els.app.classList.remove('hidden');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  els.tabLogin.classList.toggle('active', isLogin);
  els.tabRegister.classList.toggle('active', !isLogin);
  els.loginForm.classList.toggle('hidden', !isLogin);
  els.registerForm.classList.toggle('hidden', isLogin);
  els.loginError.classList.add('hidden');
  els.registerError.classList.add('hidden');
}

function loginAsUser(username) {
  setSessionUsername(username);
  const data = getCurrentUserData();
  state.chats = data?.chats || [];
  state.activeChatId = state.chats[0]?.id ?? null;
  settings = data?.settings || {
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    apiKey: '',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  };
  els.userName.textContent = username;
  els.userAvatar.textContent = username.slice(0, 1);
  renderChatList();
  renderMessages();
  showApp();
}

function logout() {
  setSessionUsername(null);
  state = { chats: [], activeChatId: null, streaming: false, abortController: null };
  switchAuthTab('login');
  els.loginForm.reset();
  showAuthScreen();
}

// ---------- Event wiring ----------
function init() {
  cacheEls();

  els.tabLogin.addEventListener('click', () => switchAuthTab('login'));
  els.tabRegister.addEventListener('click', () => switchAuthTab('register'));

  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value;
    const result = verifyUser(username, password);
    if (!result.ok) {
      els.loginError.textContent = result.error;
      els.loginError.classList.remove('hidden');
      return;
    }
    loginAsUser(username);
  });

  els.registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = els.registerUsername.value.trim();
    const password = els.registerPassword.value;
    const password2 = els.registerPassword2.value;
    if (username.length < 3) {
      els.registerError.textContent = 'Tên đăng nhập cần ít nhất 3 ký tự.';
      els.registerError.classList.remove('hidden');
      return;
    }
    if (password.length < 4) {
      els.registerError.textContent = 'Mật khẩu cần ít nhất 4 ký tự.';
      els.registerError.classList.remove('hidden');
      return;
    }
    if (password !== password2) {
      els.registerError.textContent = 'Mật khẩu nhập lại không khớp.';
      els.registerError.classList.remove('hidden');
      return;
    }
    const result = registerUser(username, password);
    if (!result.ok) {
      els.registerError.textContent = result.error;
      els.registerError.classList.remove('hidden');
      return;
    }
    showToast('Tạo tài khoản thành công!');
    loginAsUser(username);
  });

  els.btnLogout.addEventListener('click', logout);

  els.btnNewChat.addEventListener('click', createChat);
  els.btnCollapseSidebar.addEventListener('click', () => els.sidebar.classList.toggle('collapsed'));
  els.btnOpenSidebar.addEventListener('click', () => els.sidebar.classList.toggle('open'));

  els.btnSettings.addEventListener('click', openSettings);
  els.btnCloseSettings.addEventListener('click', closeSettings);
  els.btnSaveSettings.addEventListener('click', saveSettingsFromModal);
  els.settingsModal.addEventListener('click', (e) => {
    if (e.target === els.settingsModal) closeSettings();
  });

  els.btnStop.addEventListener('click', stopStreaming);

  els.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.streaming) return;
    const val = els.chatInput.value;
    els.chatInput.value = '';
    autoResize();
    sendMessage(val);
  });

  els.chatInput.addEventListener('input', autoResize);
  els.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      els.chatForm.requestSubmit();
    }
  });

  // Auto-login if a session already exists
  const existingSession = getSessionUsername();
  if (existingSession && loadUsers()[existingSession]) {
    loginAsUser(existingSession);
  } else {
    setSessionUsername(null);
    showAuthScreen();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    init();
  } catch (err) {
    console.error('KhanhOS init error:', err);
    alert('Có lỗi khi khởi tạo app, xem Console (F12) để biết chi tiết: ' + err.message);
  }
});
  
