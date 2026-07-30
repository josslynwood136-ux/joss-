// ============================================================
// chat.js - 聊天窗口 + AI 对话
// ============================================================
let chatTyping = false;
let pendingReply = false;
let activeAbort = null;
let noteTimer = null;

// ===== 消息弹窗 =====
function showMsgNote(charId, name, avatar, text) {
  var exist = document.getElementById('msgNote');
  if (exist) { clearTimeout(noteTimer); exist.remove(); noteTimer = null; }
  var n = document.createElement('div');
  n.id = 'msgNote';
  n.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:99999;background:#fdfaf6;border-radius:14px;padding:8px 14px 8px 10px;display:flex;align-items:center;gap:9px;box-shadow:0 6px 20px rgba(120,100,80,.12),0 0 0 1px rgba(200,185,165,.15);max-width:250px;width:auto;cursor:pointer;animation:msgNoteIn .3s ease';
  n.onclick = function() { this.remove(); clearTimeout(noteTimer); noteTimer = null; openChat(charId); };
  n.innerHTML = '<div style="width:22px;height:22px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#ede4d8;font-size:12px;display:flex;align-items:center;justify-content:center">' + renderAvatar(avatar, name).replace('<img', '<img style="width:100%;height:100%;object-fit:cover"') + '</div><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:#5a5045">' + escapeHTML(name) + '</div><div style="font-size:11px;color:#a09588;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px">' + escapeHTML(text || '发来一条消息') + '</div></div><div style="font-size:8px;color:#c8b8a8;flex-shrink:0;align-self:flex-start;margin-top:2px">now</div>';
  document.body.appendChild(n);
  noteTimer = setTimeout(function() { var el = document.getElementById('msgNote'); if (el) el.remove(); noteTimer = null; }, 4000);
}
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

function closeChat() {
  pendingReply = false;
  $('chatWindow').classList.remove('open');
  hidePanels();
}

function renderChat() {
  const char = activeCharacter();
  $('chatName').innerText = char.name;
  const relEl = $('chatRel');
  if (relEl) relEl.innerText = char.relation ? '· ' + char.relation : (char.online ? '· 在线' : '· 离线');
  const typing = chatTyping ? `<div class="msg left"><div class="avatar">${renderAvatar(char.avatar, char.name)}</div><div class="bubble typing"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>` : '';
  let lastDate = '';
  $('chatBody').innerHTML = (char.chat || []).map((msg, i) => {
    if (msg.role === 'system') return `<div class="bubble system">${escapeHTML(msg.content)}</div>`;
    const isUser = msg.role === 'user';
    const prof = activeProfile();
    const av = isUser ? prof.avatar : char.avatar;
    const nm = isUser ? prof.name : char.name;
    if (msg.type === 'redpacket') {
      const opened = msg.opened;
      const amount = msg.amount || 0;
      const note = msg.note || '';
      const amtText = amount.toFixed(amount % 1 ? 2 : 0);
      const msgDate = msg.time ? msg.time.slice(0, 10) : '';
      const divider = (msgDate && msgDate !== lastDate) ? `<div class="time-divider">${msgDate}</div>` : '';
      lastDate = msgDate || lastDate;
      const tick = isUser ? `<div class="read-tick">${char.read ? '已读' : '已发送'}</div>` : '';
      return `${divider}<div class="msg ${isUser ? 'right' : 'left'}" oncontextmenu="if(confirm('删除这条消息？'))deleteMessage('${char.id}',${i})"><div class="avatar">${renderAvatar(av, nm)}</div><div class="rp-card ${opened ? 'rp-opened' : ''} rp-msg-${i}" ${!isUser && !opened ? `onclick="openRedPacket('${char.id}',${i})"` : ''}>
        <span class="rp-card-icon">🧧</span>
        <span class="rp-card-label">${isUser ? '你' : escapeHTML(nm)}</span>
        ${opened ? `<div class="rp-card-amount">¥ ${amtText}</div>` : `<div class="rp-card-btn">開</div>`}
        <div class="rp-card-note">${escapeHTML(note || '恭喜发财')}</div>
      </div>${tick}</div>`;
    }
    let mediaHtml = '';
    if (msg.media && msg.media.type === 'image') {
      mediaHtml = `<img src="${escapeHTML(msg.media.src)}" style="max-width:180px;border-radius:12px;display:block;margin-top:4px">`;
    } else if (msg.media && msg.media.type === 'audio') {
      mediaHtml = `<audio src="${escapeHTML(msg.media.src)}" controls style="max-width:200px;margin-top:4px"></audio>`;
    } else if (msg.media && msg.media.type === 'file') {
      mediaHtml = `<a href="${escapeHTML(msg.media.src)}" download="${escapeHTML(msg.media.name || 'file')}" style="display:inline-block;margin-top:4px;color:inherit;text-decoration:none"><div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.18);padding:8px 10px;border-radius:10px"><span style="font-size:22px">📄</span><span style="font-size:13px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(msg.media.name || '文件')}</span></div></a>`;
    }
    const textHtml = msg.content ? `<div>${escapeHTML(msg.content)}</div>` : '';
    var transHtml = '';
    if (!isUser && msg.translatedText) {
      transHtml = '<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(0,0,0,.06)">' + escapeHTML(msg.translatedText) + '</div>';
    }
    const msgDate = msg.time ? msg.time.slice(0, 10) : '';
    const divider = (msgDate && msgDate !== lastDate) ? `<div class="time-divider">${msgDate}</div>` : '';
    lastDate = msgDate || lastDate;
    const tick = isUser ? `<div class="read-tick">${char.read ? '已读' : '已发送'}</div>` : '';
    return `${divider}<div class="msg ${isUser ? 'right' : 'left'}" oncontextmenu="if(confirm('删除这条消息？'))deleteMessage('${char.id}', ${i})"><div class="avatar">${renderAvatar(av, nm)}</div><div class="bubble ${isUser ? 'right' : 'left'}">${textHtml}${mediaHtml}${transHtml}</div>${tick}</div>`;
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

function appendBubble(role, content, media, translatedText) {
  const msg = { role, content: content || '', time: new Date().toLocaleString() };
  if (media) msg.media = media;
  if (translatedText) msg.translatedText = translatedText;
  activeCharacter().chat.push(msg);
  if (role === 'assistant') {
    const char = activeCharacter();
    char.unread = (char.unread || 0) + 1;
    char.read = false;
    var cw = $('chatWindow');
    if (cw && !cw.classList.contains('open')) {
      showMsgNote(char.id, char.name, char.avatar, content || '发来一条消息');
    }
  }
  saveState();
  renderChat();
}

// ===== AI 对话 =====
async function sendChat() {
  if (_voiceRec) stopVoice();
  if (_voiceMediaRecorder) stopVoiceRecord();
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
      var char = activeCharacter();
      var trans = null;
      if (char.translate && char.lang && char.lang !== '中文') {
        var cleanText = reply.replace(/[（(][^）)]*[）)]/g, '').trim();
        if (cleanText) trans = await translateText(cleanText);
      }
      setChatTyping(false);
      appendBubble('assistant', reply, null, trans);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setChatTyping(false);
      appendBubble('system', '暂时没回应（' + err.message + '）');
    } finally {
      $('sendBtn').disabled = false;
    }
    return;
  }
  pendingReply = false;
  $('sendBtn').disabled = true;
  setChatTyping(true);
  try {
    const reply = await callAI('（用户没有继续输入文字，请你根据当前角色卡、记忆和最近聊天，自然地回应或主动续上对话。）', false, true);
    var trans2 = null;
    var char2 = activeCharacter();
    if (char2.translate && char2.lang && char2.lang !== '中文') {
      var cleanText2 = reply.replace(/[（(][^）)]*[）)]/g, '').trim();
      if (cleanText2) trans2 = await translateText(cleanText2);
    }
    setChatTyping(false);
    appendBubble('assistant', reply, null, trans2);
  } catch (err) {
    if (err.name === 'AbortError') return;
    setChatTyping(false);
    appendBubble('system', '暂时没回应（' + err.message + '）');
  } finally {
    $('sendBtn').disabled = false;
  }
}

async function callAI(text, shortTest = false, proactive = false) {
  const char = activeCharacter();
  const systemPrompt = shortTest ? state.api.preset || '你是以下角色' : buildRoleSystemPrompt(char, text);
  const history = shortTest ? [] : char.chat.slice(-12).filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content || (m.media ? '[' + m.media.type + ']' : '') }));
  const userContent = proactive ? '用户没有输入文字。请你以当前角色身份，结合最近聊天和记忆，主动发起一句自然的消息。' : text;
  if (activeAbort) try { activeAbort.abort(); } catch(e) {}
  const controller = new AbortController();
  activeAbort = controller;
  const timer = setTimeout(() => { try { controller.abort(); } catch(e) {} }, shortTest ? 20000 : 90000);
  var ap = state.apiProfiles && state.activeApiProfile
    ? state.apiProfiles.find(function(p) { return p.id === state.activeApiProfile; }) : null;
  var cfg = ap || state.api;
  try {
    const response = await fetch(joinUrl(cfg.url, 'chat/completions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key },
      signal: controller.signal,
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userContent }],
        max_tokens: shortTest ? 20 : (cfg.maxTokens || 500),
        temperature: cfg.temp ?? 0.75,
        top_p: cfg.topP ?? 0.9,
        presence_penalty: cfg.presencePenalty ?? 0,
        frequency_penalty: cfg.frequencyPenalty ?? 0
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || response.status);
    return data.choices?.[0]?.message?.content?.trim() || '我在。';
  } finally {
    clearTimeout(timer);
    if (activeAbort === controller) activeAbort = null;
  }
}

async function translateText(text) {
  if (!text) return null;
  var ap = state.apiProfiles && state.activeApiProfile
    ? state.apiProfiles.find(function(p) { return p.id === state.activeApiProfile; }) : null;
  var cfg = ap || state.api;
  var ctrl = new AbortController();
  var tmr = setTimeout(function() { ctrl.abort(); }, 15000);
  try {
    var res = await fetch(joinUrl(cfg.url, 'chat/completions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: '只翻译，不要解释。' },
          { role: 'user', content: '翻译成中文：' + text }
        ],
        max_tokens: 300,
        temperature: 0.3
      })
    });
    var data = await res.json().catch(function() { return {}; });
    if (!res.ok) return null;
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(tmr);
  }
}

function buildRoleSystemPrompt(char, userText) {
  const memories = pickRelevantMemories(char, userText);
  var profile = activeProfile();
  var parts = [
    '你是 ' + char.name + '。你必须完全代入这个角色，用角色的语气和性格说话。你不是 AI，不是语言模型。',
    '',
    '【角色设定】',
    '名字：' + char.name,
    '别名：' + (char.aliases || '无'),
    '与用户关系：' + (char.relation || '未设定'),
    '性格：' + (char.personality || '未设定'),
    '说话风格：' + (char.style || '未设定'),
    '背景：' + (char.background || '未设定'),
    '额外规则：' + (char.prompt || '无'),
    '',
    '【用户信息】',
    '名字：' + profile.name,
    '背景：' + (profile.persona || '未填写'),
    '喜好：' + (profile.likes || '未填写'),
    '雷点：' + (profile.boundaries || '未填写'),
    '说话方式：' + (profile.speaking || '未填写'),
    '',
    '【相关记忆】',
    memories.length ? memories.map(function(mem) { return '- ' + (mem.title ? mem.title + '：' : '') + mem.text; }).join('\n') : '暂无',
    '',
    '【回复要求】',
    '用 ' + char.name + ' 的身份自然回应，不要提 AI 相关话题，不要自我总结。'
  ];
  if (char.lang && char.lang !== '中文') {
    parts.push('只能用 ' + char.lang + ' 回复，不要出现中文。');
  }
  return parts.join('\n');
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
  var char = activeCharacter();
  $('autoPostSwitch').classList.toggle('on', char && char.autoPost);
  if (char) {
    $('charLang').value = char.lang || '中文';
    $('translateSwitch').classList.toggle('on', char.translate === true);
  }
}
function closeSettings() { $('chatSettings').classList.remove('open'); }
function togglePin() { state.settings.pinned = !state.settings.pinned; saveState(); $('pinSwitch').classList.toggle('on', state.settings.pinned); }
function toggleAutoPost() {
  var char = activeCharacter();
  if (!char) return;
  char.autoPost = !char.autoPost;
  saveState();
  $('autoPostSwitch').classList.toggle('on', char.autoPost);
}
function setCharLang(val) {
  var char = activeCharacter();
  if (!char) return;
  char.lang = val;
  saveState();
}
function toggleTranslate() {
  var char = activeCharacter();
  if (!char) return;
  char.translate = !char.translate;
  saveState();
  $('translateSwitch').classList.toggle('on', char.translate);
}
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
  showRedPacketDialog();
}

function showRedPacketDialog() {
  hidePanels();
  const overlay = document.createElement('div');
  overlay.id = 'rpOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease';
  overlay.innerHTML = `
    <div class="rp-dialog">
      <div class="rp-dialog-header">
        <span class="rp-dialog-title">发红包</span>
        <button class="rp-dialog-close" onclick="document.getElementById('rpOverlay').remove()">✕</button>
      </div>
      <div class="rp-amount-presets">
        ${[1,2,5.2,6.66,8.88,13.14,52,99].map(n =>
          `<button class="rp-preset-btn" data-amount="${n}" onclick="selectRpAmount(this)">${n.toFixed(n%1?2:0)}<span class="rp-unit">元</span></button>`
        ).join('')}
      </div>
      <div class="rp-custom-row">
        <span class="rp-label">金额</span>
        <div class="rp-input-wrap">
          <span class="rp-currency">¥</span>
          <input type="number" id="rpCustomAmount" class="rp-input" step="0.01" min="0.01" max="999" placeholder="0.00" oninput="onRpAmountInput(this.value)">
        </div>
      </div>
      <div class="rp-note-row">
        <span class="rp-label">附言</span>
        <input type="text" id="rpNote" class="rp-note-input" placeholder="恭喜发财" maxlength="20">
      </div>
      <div class="rp-balance-row">
        余额 <b id="rpBalanceDisplay">${(state.profile.wallet || 0).toFixed(2)}</b> 元
      </div>
      <button class="rp-send-btn" id="rpSendBtn" onclick="confirmRedPacket()" disabled>塞进红包</button>
    </div>`;
  document.body.appendChild(overlay);
}

function selectRpAmount(btn) {
  document.querySelectorAll('.rp-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('rpCustomAmount').value = '';
  document.getElementById('rpSendBtn').disabled = false;
  document.getElementById('rpSendBtn')._amount = parseFloat(btn.dataset.amount);
}

function onRpAmountInput(val) {
  document.querySelectorAll('.rp-preset-btn').forEach(b => b.classList.remove('active'));
  const num = parseFloat(val);
  document.getElementById('rpSendBtn').disabled = !(val && num > 0);
  if (val && num > 0) {
    document.getElementById('rpSendBtn')._amount = num;
  }
}

function confirmRedPacket() {
  const btn = document.getElementById('rpSendBtn');
  const amount = btn._amount;
  if (!amount || amount <= 0) return alert('请输入金额');
  const note = document.getElementById('rpNote').value.trim() || '恭喜发财';
  const wallet = state.profile.wallet || 0;
  if (amount > wallet) return alert('余额不足');
  state.profile.wallet = +(wallet - amount).toFixed(2);
  const msg = {
    role: 'user',
    type: 'redpacket',
    amount: amount,
    note: note,
    content: '[红包] ' + note + '：' + amount.toFixed(2) + '元',
    opened: true,
    time: new Date().toLocaleString()
  };
  activeCharacter().chat.push(msg);
  saveState();
  if (window.addLedgerQuick) addLedgerQuick(-amount, '聊天红包：' + note, false);
  renderChat();
  document.getElementById('rpOverlay').remove();
  hidePanels();
  setChatTyping(true);
  callAI('用户给你发了一个红包（' + amount + '元，附言：' + note + '），请根据当前聊天氛围自然回复。').then(reply => {
    setChatTyping(false);
    appendBubble('assistant', reply);
  }).catch(function(e) {
    setChatTyping(false);
    appendBubble('assistant', '谢谢你～收到红包了！');
  });
}

function openRedPacket(charId, msgIndex) {
  const char = getCharacter(charId);
  const msg = char.chat[msgIndex];
  if (!msg || msg.type !== 'redpacket' || msg.opened) return;
  msg.opened = true;
  saveState();
  renderChat();
  const el = document.querySelector(`.rp-msg-${msgIndex}`);
  if (el) {
    el.classList.add('rp-opening');
    setTimeout(() => el.classList.remove('rp-opening'), 600);
  }
}

function sendAIRedPacket(amount, note) {
  const amt = amount || parseFloat((Math.random() * 10 + 0.5).toFixed(2));
  const nt = note || '';
  const msg = {
    role: 'assistant',
    type: 'redpacket',
    amount: amt,
    note: nt,
    content: nt ? '[红包] ' + nt + '：' + amt.toFixed(2) + '元' : '[红包] ' + amt.toFixed(2) + '元',
    opened: false,
    time: new Date().toLocaleString()
  };
  activeCharacter().chat.push(msg);
  saveState();
  renderChat();
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

// ===== 发送真实照片（文件选择） =====
function openAlbumPicker() {
  hidePanels();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const dataUrl = ev.target.result;
      appendBubble('user', '[图片]', { type: 'image', src: dataUrl });
      setChatTyping(true);
      saveState();
      callAI('用户给你发了一张照片，请根据当前聊天氛围自然回复。').then(reply => {
        setChatTyping(false);
        appendBubble('assistant', reply);
      }).catch(() => {
        setChatTyping(false);
        appendBubble('assistant', '我看到你发的照片啦～');
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  };
  input.click();
}

// ===== 拍摄 =====
function startCapture() {
  hidePanels();
  const overlay = document.createElement('div');
  overlay.id = 'captureOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column;';
  overlay.innerHTML = `
    <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:#111">
      <video id="captureVideo" autoplay playsinline style="width:100%;height:100%;object-fit:contain"></video>
      <img id="capturePreview" style="display:none;width:100%;height:100%;object-fit:contain">
      <canvas id="captureCanvas" style="display:none"></canvas>
    </div>
    <div id="captureActions" style="display:flex;align-items:center;justify-content:space-evenly;padding:20px 0 40px;background:#111">
      <button id="captureCancelBtn" style="border:none;background:transparent;color:#fff;font-size:14px;cursor:pointer;padding:8px 16px">取消</button>
      <button id="captureBtn" style="width:64px;height:64px;border-radius:50%;border:4px solid #fff;background:transparent;cursor:pointer;position:relative"><div style="position:absolute;inset:4px;border-radius:50%;background:#fff"></div></button>
      <span style="width:60px"></span>
    </div>
    <div id="captureConfirm" style="display:none;align-items:center;justify-content:space-evenly;padding:20px 0 40px;background:#111">
      <button id="retakeBtn" style="border:none;background:#333;color:#fff;padding:10px 24px;border-radius:12px;font-size:14px;cursor:pointer">重拍</button>
      <button id="sendPhotoBtn" style="border:none;background:#3897f0;color:#fff;padding:10px 28px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer">发送</button>
    </div>`;
  document.body.appendChild(overlay);
  let stream = null;
  let photoDataUrl = null;
  const video = document.getElementById('captureVideo');
  const preview = document.getElementById('capturePreview');
  const cancelBtn = document.getElementById('captureCancelBtn');
  const captureBtn = document.getElementById('captureBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const sendBtn = document.getElementById('sendPhotoBtn');
  const actionsArea = document.getElementById('captureActions');
  const confirmArea = document.getElementById('captureConfirm');
  function stopStream() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }
  function closeOverlay() { stopStream(); overlay.remove(); }
  function showViewfinder() {
    video.style.display = 'block';
    preview.style.display = 'none';
    actionsArea.style.display = 'flex';
    confirmArea.style.display = 'none';
  }
  function showPreview(dataUrl) {
    video.style.display = 'none';
    preview.src = dataUrl;
    preview.style.display = 'block';
    actionsArea.style.display = 'none';
    confirmArea.style.display = 'flex';
  }
  cancelBtn.onclick = closeOverlay;
  retakeBtn.onclick = () => {
    photoDataUrl = null;
    showViewfinder();
    if (!stream) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(s => {
        stream = s; video.srcObject = s;
      }).catch(() => { overlay.remove(); alert('无法打开摄像头'); });
    }
  };
  sendBtn.onclick = () => {
    if (!photoDataUrl) return;
    closeOverlay();
    appendBubble('user', '[拍摄]', { type: 'image', src: photoDataUrl });
    setChatTyping(true);
    saveState();
    callAI('用户给你发了一张拍摄的照片，请根据当前聊天氛围自然回复。').then(reply => {
      setChatTyping(false);
      appendBubble('assistant', reply);
    }).catch(() => {
      setChatTyping(false);
      appendBubble('assistant', '这张照片拍得不错～');
    });
  };
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(s => {
    stream = s; video.srcObject = s;
  }).catch(() => {
    overlay.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;font-size:14px"><span style="font-size:48px;margin-bottom:10px">📷</span>无法访问摄像头</div><div style="padding:20px 0 40px;text-align:center"><button onclick="document.getElementById('captureOverlay').remove()" style="border:none;background:#333;color:#fff;padding:10px 20px;border-radius:10px;cursor:pointer">关闭</button></div>`;
    return;
  });
  captureBtn.onclick = () => {
    if (!stream) return;
    const canvas = document.getElementById('captureCanvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    stopStream();
    showPreview(photoDataUrl);
  };
}

/* ===== 通话功能 ===== */
function startCall(type) {
  if (!type) type = 'video';
  const char = activeCharacter();
  if (!char) return;
  const old = document.getElementById('callOverlay');
  if (old) old.remove();
  const pb = document.querySelector('.phone-body');
  if (!pb) return;
  const overlay = document.createElement('div');
  overlay.id = 'callOverlay';
  overlay.className = 'call-overlay';
  const avatar = char.avatar || 'https://img.facfox.com/imgs/2026/07/19/ea51598f7d0459ee.jpg';
  const label = type === 'video' ? '📹 视频呼叫' : '📞 语音呼叫';
  overlay.innerHTML = `<div class="call-avatar" style="background-image:url('${escapeHTML(avatar)}')"></div><div class="call-name">${escapeHTML(char.name)}</div><div class="call-status" id="callStatus">${label}</div><div class="call-timer" id="callTimer"></div><div class="call-actions"><button class="call-btn call-btn-mute" id="callMuteBtn" onclick="toggleMute()">🔇</button><button class="call-btn call-btn-end" id="callEndBtn" onclick="endCall()">✕</button><button class="call-btn" id="callSpeakerBtn" onclick="toggleSpeaker()">🔊</button></div>`;
  pb.appendChild(overlay);
  state.call = state.call || {};
  state.call.type = type;
  state.call.active = false;
  state.call.muted = false;
  state.call.speaker = false;
  setTimeout(() => {
    const s = document.getElementById('callStatus');
    const t = document.getElementById('callTimer');
    if (!s || !t) return;
    s.textContent = '通话中';
    state.call.startTime = Date.now();
    state.call.active = true;
    updateCallTimer();
  }, 2200);
}

function updateCallTimer() {
  if (!state.call || !state.call.active) return;
  const t = document.getElementById('callTimer');
  if (!t) return;
  const elapsed = Math.floor((Date.now() - state.call.startTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  t.textContent = m + ':' + s;
  requestAnimationFrame(updateCallTimer);
}

function endCall() {
  const overlay = document.getElementById('callOverlay');
  if (overlay) overlay.remove();
  const wasActive = state.call && state.call.active;
  if (state.call) state.call.active = false;
  if (wasActive) {
    const char = activeCharacter();
    if (char) {
      const dur = state.call && state.call.startTime ? Math.floor((Date.now() - state.call.startTime) / 1000) : 0;
      const m = Math.floor(dur / 60);
      const s = dur % 60;
      const msg = m > 0 ? '（通话结束 ' + m + '分' + s + '秒）' : '（通话结束 ' + s + '秒）';
      appendBubble('system', msg);
    }
  }
}

function toggleMute() {
  if (!state.call) state.call = {};
  state.call.muted = !state.call.muted;
  const btn = document.getElementById('callMuteBtn');
  if (btn) { btn.classList.toggle('active'); btn.textContent = state.call.muted ? '🔇' : '🎤'; }
  if (btn) btn.style.borderColor = state.call.muted ? 'var(--ink)' : '';
}

function toggleSpeaker() {
  if (!state.call) state.call = {};
  state.call.speaker = !state.call.speaker;
  const btn = document.getElementById('callSpeakerBtn');
  if (btn) { btn.classList.toggle('active'); btn.textContent = state.call.speaker ? '🔊' : '🔈'; }
  if (btn) btn.style.borderColor = state.call.speaker ? 'var(--ink)' : '';
}

var _voiceRec = null;
var _voiceHoldTimer = null;
var _voiceMediaRecorder = null;
var _voiceChunks = [];

function toggleVoice() {
  var R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) { alert('当前浏览器不支持语音识别'); return; }
  if (_voiceRec) { stopVoice(); return; }
  hidePanels();
  var btn = document.getElementById('voiceBtn');
  if (btn) btn.textContent = '🔴';
  var recognition = new R();
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  var input = document.getElementById('chatInput');
  var finalText = input ? input.value : '';
  recognition.onresult = function(e) {
    for (var i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
    }
    if (input) input.value = finalText;
  };
  recognition.onerror = function() { stopVoice(); };
  recognition.onend = function() { _voiceRec = null; var b = document.getElementById('voiceBtn'); if (b) b.textContent = '🎤'; };
  try { recognition.start(); _voiceRec = recognition; } catch (e) { alert('语音启动失败'); }
}

function stopVoice() {
  if (_voiceRec) { try { _voiceRec.stop(); } catch(e) {} _voiceRec = null; }
  var btn = document.getElementById('voiceBtn');
  if (btn) btn.textContent = '🎤';
}

// 长按发语音条
function voiceTouchStart() {
  if (_voiceRec) return;
  window._voiceWasHold = false;
  _voiceHoldTimer = setTimeout(function() {
    _voiceHoldTimer = null;
    window._voiceWasHold = true;
    startVoiceRecord();
  }, 300);
}

function voiceTouchEnd() {
  if (_voiceHoldTimer) { clearTimeout(_voiceHoldTimer); _voiceHoldTimer = null; window._voiceWasHold = false; return; }
  if (_voiceMediaRecorder) { stopVoiceRecord(); }
}

function startVoiceRecord() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert('不支持录音'); return; }
  var btn = document.getElementById('voiceBtn');
  if (btn) { btn.textContent = '⏺'; btn.style.color = '#e53935'; }
  var input = document.getElementById('chatInput');
  if (input) input.placeholder = '🎤 录音中... 松开发送';
  _voiceChunks = [];
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    var recorder = new MediaRecorder(stream);
    recorder.ondataavailable = function(e) { if (e.data.size > 0) _voiceChunks.push(e.data); };
    recorder.onstop = function() {
      stream.getTracks().forEach(function(t) { t.stop(); });
      var blob = new Blob(_voiceChunks, { type: 'audio/webm' });
      if (blob.size > 0) sendVoiceMessage(blob);
    };
    recorder.start();
    _voiceMediaRecorder = recorder;
  }).catch(function() { alert('无法访问麦克风'); });
}

function stopVoiceRecord() {
  if (_voiceMediaRecorder) {
    try { _voiceMediaRecorder.stop(); } catch(e) {}
    _voiceMediaRecorder = null;
  }
  var btn = document.getElementById('voiceBtn');
  if (btn) { btn.textContent = '🎤'; btn.style.color = ''; }
  var input = document.getElementById('chatInput');
  if (input) input.placeholder = '发消息...';
}

function sendVoiceMessage(blob) {
  var reader = new FileReader();
  reader.onload = function(ev) {
    var dataUrl = ev.target.result;
    appendBubble('user', '[语音消息]', { type: 'audio', src: dataUrl });
    saveState();
    setChatTyping(true);
    callAI('用户给你发了一段语音消息，请根据当前聊天氛围自然回复。').then(function(reply) {
      setChatTyping(false);
      appendBubble('assistant', reply);
    }).catch(function() {
      setChatTyping(false);
      appendBubble('assistant', '收到你的语音啦～');
    });
  };
  reader.readAsDataURL(blob);
}