// ============================================================
// chat.js - 聊天窗口 + AI 对话
// ============================================================
let chatTyping = false;
let pendingReply = false;

// ===== 聊天窗口 =====
function openChat(characterId) {
  if (characterId) {
    state.activeRoleId = characterId;
    const char = getCharacter(characterId);
    char.unread = 0;
    char.read = true;
  }
  saveState();
  pendingReply = false;
  $('chatWindow').classList.add('open');
  renderChat();
}

function closeChat() { pendingReply = false; $('chatWindow').classList.remove('open'); hidePanels(); }

function renderChat() {
  const char = activeCharacter();
  $('chatName').innerText = char.name;
  const relEl = $('chatRel');
  if (relEl) relEl.innerText = char.relation ? '· ' + char.relation : (char.online ? '· 在线' : '· 离线');
  const typing = chatTyping ? `<div class="msg left"><div class="avatar">${renderAvatar(char.avatar, char.name)}</div><div class="bubble typing"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>` : '';
  let lastDate = '';
  $('chatBody').innerHTML = (char.chat || []).map(msg => {
    if (msg.role === 'system') return `<div class="bubble system">${escapeHTML(msg.content)}</div>`;
    const isUser = msg.role === 'user';
    const prof = activeProfile();
    const av = isUser ? prof.avatar : char.avatar;
    const nm = isUser ? prof.name : char.name;
    let mediaHtml = '';
    if (msg.media && msg.media.type === 'image') {
      mediaHtml = `<img src="${escapeHTML(msg.media.src)}" style="max-width:180px;border-radius:12px;display:block;margin-top:4px">`;
    } else if (msg.media && msg.media.type === 'audio') {
      mediaHtml = `<audio src="${escapeHTML(msg.media.src)}" controls style="max-width:200px;margin-top:4px"></audio>`;
    } else if (msg.media && msg.media.type === 'file') {
      mediaHtml = `<a href="${escapeHTML(msg.media.src)}" download="${escapeHTML(msg.media.name || 'file')}" style="display:inline-block;margin-top:4px;color:inherit;text-decoration:none"><div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.18);padding:8px 10px;border-radius:10px"><span style="font-size:22px">📄</span><span style="font-size:13px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(msg.media.name || '文件')}</span></div></a>`;
    }
    const textHtml = msg.content ? `<div>${escapeHTML(msg.content)}</div>` : '';
    const msgDate = msg.time ? msg.time.slice(0, 10) : '';
    const divider = (msgDate && msgDate !== lastDate) ? `<div class="time-divider">${msgDate}</div>` : '';
    lastDate = msgDate || lastDate;
    const tick = isUser ? `<div class="read-tick">${char.read ? '已读' : '已发送'}</div>` : '';
    return `${divider}<div class="msg ${isUser ? 'right' : 'left'}" oncontextmenu="if(confirm('删除这条消息？'))deleteMessage('${char.id}', ${char.chat.indexOf(msg)})"><div class="avatar">${renderAvatar(av, nm)}</div><div class="bubble ${isUser ? 'right' : 'left'}">${textHtml}${mediaHtml}</div>${tick}</div>`;
  }).join('') + typing;
  $('chatBody').scrollTop = $('chatBody').scrollHeight;
}

function deleteMessage(charId, index) {
  const char = getCharacter(charId);
  if (!char.chat[index]) return;
  char.chat.splice(index, 1);
  saveState();
  renderChat();
}

function setChatTyping(value) {
  chatTyping = value;
  renderChat();
}

function appendBubble(role, content, media) {
  const msg = { role, content: content || '', time: new Date().toLocaleString() };
  if (media) msg.media = media;
  activeCharacter().chat.push(msg);
  if (role === 'assistant') {
    const char = activeCharacter();
    char.unread = (char.unread || 0) + 1;
    char.read = false;
  }
  saveState();
  renderChat();
}

// ===== AI 对话 =====
async function sendChat() {
  const input = $('chatInput');
  const text = input.value.trim();
  if (!state.api.key || !state.api.url || !state.api.model) {
    alert('还没连上，先去设置里连接一下。');
    return;
  }
  hidePanels();
  if (text) {
    appendBubble('user', text);
    input.value = '';
    pendingReply = true;
    renderChat();
    setChatTyping(true);
    try {
      const reply = await callAI(text);
      setChatTyping(false);
      appendBubble('assistant', reply);
    } catch (err) {
      setChatTyping(false);
      appendBubble('system', '对方暂时没有回应，稍后再试。');
    } finally {
      $('sendBtn').disabled = false;
      $('sendBtn').innerText = '发送';
    }
    return;
  }
  pendingReply = false;
  $('sendBtn').disabled = true;
  setChatTyping(true);
  try {
    const reply = await callAI('（用户没有继续输入文字，请你根据当前角色卡、记忆和最近聊天，自然地回应或主动续上对话。）', false, true);
    setChatTyping(false);
    appendBubble('assistant', reply);
  } catch (err) {
    setChatTyping(false);
    appendBubble('system', '对方暂时没有回应，稍后再试。');
  } finally {
    $('sendBtn').disabled = false;
    $('sendBtn').innerText = '发送';
  }
}

async function callAI(text, shortTest = false, proactive = false) {
  const char = activeCharacter();
  const systemPrompt = shortTest ? state.api.preset : buildRoleSystemPrompt(char, text);
  const history = shortTest ? [] : char.chat.slice(-12).filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content || (m.media ? '[' + m.media.type + ']' : '') }));
  const userContent = proactive ? '用户没有输入文字。请你以当前角色身份，结合最近聊天和记忆，主动发起一句自然的消息。' : text;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), shortTest ? 15000 : 45000);
  try {
    const response = await fetch(joinUrl(state.api.url, 'chat/completions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.api.key },
      signal: controller.signal,
      body: JSON.stringify({
        model: state.api.model,
        messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userContent }],
        max_tokens: shortTest ? 20 : 500,
        temperature: 0.8
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || response.status);
    return data.choices?.[0]?.message?.content?.trim() || '我在。';
  } finally {
    clearTimeout(timer);
  }
}

function buildRoleSystemPrompt(char, userText) {
  const memories = pickRelevantMemories(char, userText);
  return [
    state.api.preset,
    '【当前角色卡】',
    `名字：${char.name}`,
    `角色别名/小名：${char.aliases || '未填写'}`,
    `与用户关系：${char.relation || '未填写'}`,
    `性格：${char.personality || '未填写'}`,
    `说话风格：${char.style || '未填写'}`,
    `背景故事：${char.background || '未填写'}`,
    `额外规则：${char.prompt || '无'}`,
    '',
    '【用户自己的人设】',
    `昵称：${activeProfile().name}`,
    `用户背景：${activeProfile().persona || '未填写'}`,
    `用户喜好：${activeProfile().likes || '未填写'}`,
    `用户边界/雷点：${activeProfile().boundaries || '未填写'}`,
    `用户说话方式：${activeProfile().speaking || '未填写'}`,
    '',
    '【相关记忆】',
    memories.length ? memories.map(mem => `- ${mem.title ? mem.title + '：' : ''}${mem.text}`).join('\n') : '暂无相关记忆',
    '',
    '【回复要求】',
    '你正在和用户进行一对一聊天。保持角色身份，不要自称 AI 或模型。用户用角色本名、别名、小名呼唤你时，都要知道是在叫你。回复要自然、有情绪、有上下文，避免机械总结。'
  ].join('\n');
}

function pickRelevantMemories(char, text) {
  const memories = char.memories || [];
  const query = (text || '').toLowerCase();
  return memories
    .map(mem => {
      const hay = `${mem.title || ''} ${mem.text || ''}`.toLowerCase();
      let score = 0;
      query.split(/[\s,，。！？!?、]+/).filter(Boolean).forEach(word => {
        if (word.length > 1 && hay.includes(word)) score += 2;
      });
      [...query].forEach(ch => { if (/[\u4e00-\u9fa5]/.test(ch) && hay.includes(ch)) score += 0.2; });
      return { ...mem, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function rememberLastUserMessage() {
  const char = activeCharacter();
  const lastUser = [...char.chat].reverse().find(msg => msg.role === 'user');
  if (!lastUser) return alert('还没有可加入记忆的用户消息');
  char.memories.unshift({
    id: 'mem-' + Date.now(),
    title: '聊天记忆',
    text: lastUser.content,
    date: new Date().toLocaleString()
  });
  saveState();
  hidePanels();
  alert('已加入当前角色记忆库');
}

// ===== 聊天设置 =====
function openSettings() {
  $('chatSettings').classList.add('open');
  $('pinSwitch').classList.toggle('on', state.settings.pinned);
}
function closeSettings() { $('chatSettings').classList.remove('open'); }
function togglePin() { state.settings.pinned = !state.settings.pinned; saveState(); $('pinSwitch').classList.toggle('on', state.settings.pinned); }
function clearHistory() {
  if (!confirm('清空聊天记录？')) return;
  activeCharacter().chat = [];
  saveState();
  renderChat();
  closeSettings();
}

// ===== 面板控制 =====
function toggleMore() { togglePanel('morePanel'); }
function toggleEmoji() { togglePanel('emojiPanel'); }

// ===== 快捷操作 =====
function sendRed() {
  state.profile.wallet -= 5.20;
  appendBubble('user', '🧧 [红包] 5.20元');
  if (window.addLedgerQuick) addLedgerQuick(-5.2, '聊天红包', false);
  hidePanels();
}

function inviteStudy() {
  const char = activeCharacter();
  closeChat();
  if (window.openApp) openApp('自习');
  state.study.companion = true;
  if (!state.study.companionMsg) {
    const pool = ['我陪你一起专注，開始吧～', '加油，我就在这儿。', '我在呢，放心。'];
    const prefix = char && char.name && char.name !== '未命名角色' ? char.name + '：' : '';
    state.study.companionMsg = prefix + pool[Math.floor(Math.random() * pool.length)];
  }
  saveState();
  if (window.renderStudy) renderStudy();
}
