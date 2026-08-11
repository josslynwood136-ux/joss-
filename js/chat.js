// ============================================================
// chat.js - 聊天窗口 + AI 对话
// ============================================================
let chatTyping = false;
let pendingReply = false;
let pendingQuote = null;
let activeAbort = null;
let noteTimer = null;
let _manualAICall = false;
let _idleProactiveTimer = null;

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
function openChat(characterId, skin) {
  if (characterId) {
    state.activeRoleId = characterId;
    const char = getCharacter(characterId);
    char.unread = 0;
    char.read = true;
    // 兼容老存档：没有 status 的旧消息，若其后已有对方回复，则补标已读
    const chat = char.chat || [];
    let seenReply = false;
    for (let i = chat.length - 1; i >= 0; i--) {
      const m = chat[i];
      if (m.role === 'assistant' || m.role === 'system') { seenReply = true; continue; }
      if (m.role === 'user') {
        if (!m.status) m.status = seenReply ? 'read' : 'sent';
        if (m.status === 'sent' && seenReply) m.status = 'read';
      }
    }
  }
  saveState();
  pendingReply = false;
  _manualAICall = false;
  $('sendBtn').style.display = '';
  var ob = $('aiBtn');
  if (ob) ob.remove();
  $('chatWindow').classList.add('open');
  $('chatWindow').classList.toggle('comic-skin', skin === 'comic');
  renderChat();
}

function closeChat() {
  pendingReply = false;
  _manualAICall = false;
  exitMultiSelect();
  $('sendBtn').style.display = '';
  var ob = $('aiBtn');
  if (ob) ob.remove();
  $('chatWindow').classList.remove('open');
  $('chatWindow').classList.remove('comic-skin');
  hidePanels();
}

// ===== 多选删除 =====
let _multiSelect = false;
let _selectedMsgs = {};
let _multiAnchor = -1;
let _selBlock = null;
let _previewMsgs = {};
let _lastScrollTop = -1;
let _scrollDir = 1;
const SEL_LINE_RATIO = 0.45;

function msgCheck(isUser, i) {
  if (!_multiSelect) return '';
  const on = !!_selectedMsgs[i];
  return `<span class="msg-check ${isUser ? 'right' : 'left'}${on ? ' on' : ''}" data-idx="${i}"></span>`;
}
function multiCls(i) {
  if (!_multiSelect) return '';
  return ' multi-mode' + (_selectedMsgs[i] ? ' msg-selected' : '');
}
function onMsgDown(ev, index) {
  if (_multiSelect) return;
  if (ev.type === 'touchstart' && ev.cancelable) ev.preventDefault();
  quotePress(ev, ev.currentTarget, index);
}
function onMsgTap(ev, index) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (_multiSelect) { toggleMsgSelect(index); return; }
  clearQuotePress();
}
function enterMultiSelect(anchorIndex) {
  _multiSelect = true;
  _selectedMsgs = {};
  _multiAnchor = (typeof anchorIndex === 'number' && anchorIndex >= 0) ? anchorIndex : -1;
  _selBlock = null;
  _previewMsgs = {};
  _lastScrollTop = -1;
  _scrollDir = 1;
  var h = document.querySelector('#chatWindow .chat-header');
  var f = document.querySelector('#chatWindow .chat-footer');
  if (h) h.style.display = 'none';
  if (f) f.style.display = 'none';
  var bar = $('multiBar');
  if (bar) bar.style.display = 'flex';
  showSelectHereUI();
  updateMultiCount();
  renderChat();
}
function exitMultiSelect() {
  var wasActive = _multiSelect;
  _multiSelect = false;
  _selectedMsgs = {};
  _multiAnchor = -1;
  _selBlock = null;
  _previewMsgs = {};
  var h = document.querySelector('#chatWindow .chat-header');
  var f = document.querySelector('#chatWindow .chat-footer');
  if (h) h.style.display = '';
  if (f) f.style.display = '';
  var bar = $('multiBar');
  if (bar) bar.style.display = 'none';
  hideSelectHereUI();
  if (wasActive) renderChat();
}
function toggleMsgSelect(index) {
  const char = activeCharacter();
  const msg = char && char.chat[index];
  if (!msg) return;
  _selBlock = null;
  var count = Object.keys(_selectedMsgs).length;
  if (count === 0) {
    _multiAnchor = index;
    _selectedMsgs[index] = true;
  } else if (count === 1 && _multiAnchor === index) {
    delete _selectedMsgs[index];
    _multiAnchor = -1;
  } else {
    selectRange(Math.min(_multiAnchor, index), Math.max(_multiAnchor, index));
  }
  updateMultiCount();
  renderSelectionVisual();
  updatePreview();
  renderPreviewVisual();
}
function selectRange(from, to) {
  const char = activeCharacter();
  _selectedMsgs = {};
  for (var i = from; i <= to; i++) {
    const m = char && char.chat[i];
    if (m) _selectedMsgs[i] = true;
  }
}
function renderSelectionVisual() {
  document.querySelectorAll('#chatBody .msg[data-idx]').forEach(function(el) {
    var idx = parseInt(el.getAttribute('data-idx'), 10);
    var on = !!_selectedMsgs[idx];
    el.classList.toggle('msg-selected', on);
    var chk = el.querySelector('.msg-check');
    if (chk) chk.classList.toggle('on', on);
  });
}
function updateMultiCount() {
  var n = Object.keys(_selectedMsgs).length;
  var c = $('multiCount');
  if (c) {
    c.textContent = n === 1 ? '已选 1 条 · 再点一条可选中到此处' : '已选 ' + n + ' 条';
  }
  var del = $('multiDeleteBtn');
  if (del) del.classList.toggle('can-del', n > 0);
}
function selectAllMsgs() {
  const char = activeCharacter();
  const idxs = (char.chat || []).map(function(m, i) { return { m: m, i: i }; }).filter(function(x) { return x.m; });
  if (!idxs.length) return;
  const allSelected = idxs.every(function(x) { return _selectedMsgs[x.i]; });
  if (allSelected) {
    _selectedMsgs = {};
    _multiAnchor = -1;
  } else {
    idxs.forEach(function(x) { _selectedMsgs[x.i] = true; });
    _multiAnchor = idxs[0].i;
  }
  _selBlock = null;
  _previewMsgs = {};
  renderSelectionVisual();
  updateMultiCount();
  updatePreview();
  renderPreviewVisual();
}
async function deleteSelected() {
  const char = activeCharacter();
  const idxs = Object.keys(_selectedMsgs).map(Number).sort(function(a, b) { return b - a; });
  if (!idxs.length) return;
  if (!await uiConfirm('确定删除选中的 ' + idxs.length + ' 条消息吗？删除后无法恢复。')) return;
  idxs.forEach(function(i) {
    if (char.chat[i]) char.chat.splice(i, 1);
  });
  saveState();
  exitMultiSelect();
}

// ===== 选到这里（划线滑选） =====
function showSelectHereUI() {
  var line = $('selectHereLine');
  var btn = $('selectHereBtn');
  if (line) line.style.display = 'block';
  if (btn) btn.style.display = 'inline-flex';
  var body = $('chatBody');
  if (body && !body.dataset.multiScr) {
    body.dataset.multiScr = '1';
    body.addEventListener('scroll', onMultiScroll, { passive: true });
  }
  updatePreview();
  renderPreviewVisual();
}
function hideSelectHereUI() {
  var line = $('selectHereLine');
  var btn = $('selectHereBtn');
  if (line) line.style.display = 'none';
  if (btn) btn.style.display = 'none';
  var body = $('chatBody');
  if (body && body.dataset.multiScr) {
    body.removeEventListener('scroll', onMultiScroll);
    delete body.dataset.multiScr;
  }
  clearPreview();
}
function clearPreview() {
  _previewMsgs = {};
  document.querySelectorAll('#chatBody .msg.msg-preview').forEach(function(el) { el.classList.remove('msg-preview'); });
}
function onMultiScroll() {
  if (!_multiSelect) return;
  var body = $('chatBody');
  if (!body) return;
  var st = body.scrollTop;
  _scrollDir = st >= _lastScrollTop ? 1 : -1;
  _lastScrollTop = st;
  updatePreview();
  renderPreviewVisual();
}
function getCutIndex() {
  var w = $('chatWindow');
  var body = $('chatBody');
  if (!w || !body) return -1;
  var wr = w.getBoundingClientRect();
  var lineY = wr.top + wr.height * SEL_LINE_RATIO;
  var msgs = body.querySelectorAll('.msg[data-idx]');
  var best = -1, bestD = Infinity;
  for (var i = 0; i < msgs.length; i++) {
    var el = msgs[i];
    var idx = parseInt(el.getAttribute('data-idx'), 10);
    var r = el.getBoundingClientRect();
    var cy = r.top + r.height / 2;
    var d = Math.abs(cy - lineY);
    if (d < bestD) { bestD = d; best = idx; }
  }
  return best;
}
function previewRange() {
  var cut = getCutIndex();
  var anchor = _multiAnchor;
  if (cut < 0 || anchor < 0) return null;
  return { from: Math.min(cut, anchor), to: Math.max(cut, anchor) };
}
function updatePreview() {
  var btn = $('selectHereBtn'), cnt = $('selectHereCount');
  if (!btn) return;
  _previewMsgs = {};
  if (_multiSelect && _multiAnchor >= 0) {
    var range = previewRange();
    if (range) {
      for (var i = range.from; i <= range.to; i++) {
        var m = activeCharacter() && activeCharacter().chat[i];
        if (m) _previewMsgs[i] = true;
      }
      var n = 0;
      for (var i = range.from; i <= range.to; i++) if (!_selectedMsgs[i]) n++;
      btn.classList.add('active');
      if (cnt) {
        cnt.textContent = n > 0 ? '+' + n : '✓';
        cnt.classList.toggle('sph-ok', n === 0);
      }
    } else {
      btn.classList.remove('active');
      if (cnt) { cnt.textContent = ''; cnt.classList.remove('sph-ok'); }
    }
  } else {
    btn.classList.remove('active');
    if (cnt) { cnt.textContent = ''; cnt.classList.remove('sph-ok'); }
  }
}
function renderPreviewVisual() {
  document.querySelectorAll('#chatBody .msg[data-idx]').forEach(function(el) {
    var idx = parseInt(el.getAttribute('data-idx'), 10);
    var on = !!_previewMsgs[idx] && !_selectedMsgs[idx];
    el.classList.toggle('msg-preview', on);
  });
}
function selectHereTo() {
  if (!_multiSelect) return;
  var range = previewRange();
  if (!range) return;
  var char = activeCharacter();
  var sel = {};
  for (var i = range.from; i <= range.to; i++) {
    if (char && char.chat[i]) sel[i] = true;
  }
  _selectedMsgs = sel;
  _selBlock = { from: range.from, to: range.to };
  _previewMsgs = {};
  updateMultiCount();
  renderSelectionVisual();
  updatePreview();
  renderPreviewVisual();
}

function renderChat() {
  const char = activeCharacter();
  $('chatName').innerText = char.name;
  const relEl = $('chatRel');
  if (relEl) relEl.innerText = char.relation ? '· ' + char.relation : (char.online ? '· 在线' : '· 离线');
  const typing = chatTyping ? `<div class="msg left"><div class="avatar">${renderAvatar(char.avatar, char.name)}</div><div class="bubble typing"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>` : '';
  let lastDate = '';
  $('chatBody').innerHTML = (char.chat || []).map((msg, i) => {
    const isUser = msg.role === 'user';
    const msgDate = msg.time ? msg.time.slice(0, 10) : '';
    const divider = (msgDate && msgDate !== lastDate) ? `<div class="time-divider">${msgDate}</div>` : '';
    lastDate = msgDate || lastDate;
    var msgTime = '';
    try {
      const _d = new Date(msg.time);
      if (!isNaN(_d.getTime())) msgTime = String(_d.getHours()).padStart(2, '0') + ':' + String(_d.getMinutes()).padStart(2, '0');
    } catch (e) {}
    const timeStamp = (msg.role !== 'system' && msgTime) ? `<div class="msg-time">${msgTime}</div>` : '';
    if (msg.role === 'system') {
      return `${divider}<div class="msg system${multiCls(i)}" data-idx="${i}" ontouchstart="onMsgDown(event,${i})" onmousedown="onMsgDown(event,${i})" onclick="onMsgTap(event,${i})">${msgCheck(false, i)}<div class="bubble system">${escapeHTML(msg.content)}</div></div>`;
    }
    const prof = activeProfile();
    const av = isUser ? prof.avatar : char.avatar;
    const nm = isUser ? prof.name : char.name;
    if (msg.type === 'retract') {
      const retractTxt = msg.content || '撤回了一条消息';
      return `${divider}<div class="msg system${multiCls(i)}" data-idx="${i}" ontouchstart="onMsgDown(event,${i})" onmousedown="onMsgDown(event,${i})" onclick="onMsgTap(event,${i})">${msgCheck(false, i)}<div class="bubble system retract-bubble">${escapeHTML(nm)} ${escapeHTML(retractTxt)}</div>${timeStamp}</div>`;
    }
    if (msg.type === 'redpacket') {
      const opened = msg.opened;
      const amount = msg.amount || 0;
      const note = msg.note || '';
      const amtText = amount.toFixed(amount % 1 ? 2 : 0);
      const tick = isUser ? `<div class="read-tick">${msg.status === 'read' ? '已读' : '已发送'}</div>` : '';
      return `${divider}<div class="msg ${isUser ? 'right' : 'left'}${multiCls(i)}" data-idx="${i}" oncontextmenu="askDeleteMessage('${char.id}',${i})" onclick="onMsgTap(event,${i})" ontouchstart="onMsgDown(event,${i})" onmousedown="onMsgDown(event,${i})">${msgCheck(isUser, i)}<div class="avatar">${renderAvatar(av, nm)}</div><div class="rp-card ${opened ? 'rp-opened' : ''} rp-msg-${i}" ${!isUser && !opened ? `onclick="_multiSelect?onMsgTap(event,${i}):openRedPacket('${char.id}',${i})"` : ''}>
        <span class="rp-card-icon">🧧</span>
        <span class="rp-card-label">${isUser ? '你' : escapeHTML(nm)}</span>
        ${opened ? `<div class="rp-card-amount">¥ ${amtText}</div>` : `<div class="rp-card-btn">開</div>`}
        <div class="rp-card-note">${escapeHTML(note || '恭喜发财')}</div>
      </div>${tick}${timeStamp}</div>`;
    }
    if (msg.type === 'sticker') {
      const stickerSrc = msg.media && msg.media.src ? msg.media.src : '';
      const tick = isUser ? `<div class="read-tick">${msg.status === 'read' ? '已读' : '已发送'}</div>` : '';
      return `${divider}<div class="msg ${isUser ? 'right' : 'left'}${multiCls(i)}" data-idx="${i}" onclick="onMsgTap(event,${i})" ontouchstart="onMsgDown(event,${i})" onmousedown="onMsgDown(event,${i})" oncontextmenu="return false;">${msgCheck(isUser, i)}<div class="avatar">${renderAvatar(av, nm)}</div>${stickerSrc ? `<img src="${escapeHTML(stickerSrc)}" class="chat-sticker-img" alt="表情包">` : ''}${tick}${timeStamp}</div>`;
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
    const quoteHtml = quoteBlock(msg.quote);
    const tick = isUser ? `<div class="read-tick">${msg.status === 'read' ? '已读' : '已发送'}</div>` : '';
    const avHtml = !isUser ? `<div class="avatar voice-avatar" onclick="event.stopPropagation();showInnerVoice('${char.id}')">${renderAvatar(av, nm)}</div>` : `<div class="avatar">${renderAvatar(av, nm)}</div>`;
    return `${divider}<div class="msg ${isUser ? 'right' : 'left'}${multiCls(i)}" data-idx="${i}" oncontextmenu="return false;" ontouchstart="onMsgDown(event,${i})" onmousedown="onMsgDown(event,${i})" onclick="onMsgTap(event,${i})">${msgCheck(isUser, i)}${avHtml}<div class="bubble ${isUser ? 'right' : 'left'}">${quoteHtml}${textHtml}${mediaHtml}${transHtml}</div>${tick}${timeStamp}</div>`;
  }).join('') + typing;
  if (!_multiSelect) $('chatBody').scrollTop = $('chatBody').scrollHeight;
  applyBubbleStyle();
  if (_multiSelect) {
    updatePreview();
    renderPreviewVisual();
  }
}

async function deleteMessage(charId, index, noConfirm) {
  const char = getCharacter(charId);
  if (!char.chat[index]) return;
  if (!noConfirm && !await uiConfirm('确定删除这条消息吗？删除后无法恢复。')) return;
  char.chat.splice(index, 1);
  saveState();
  renderChat();
}

function askDeleteMessage(charId, index) {
  if (_multiSelect) return;
  uiConfirm('删除这条消息？').then(function (ok) {
    if (ok) deleteMessage(charId, index, true);
  });
}

function quoteMessage(index) {
  const char = activeCharacter();
  const msg = char.chat[index];
  if (!msg || msg.role === 'system') return;
  pendingQuote = { index, role: msg.role, content: msg.content || '' };
  renderReplyBar();
}

function clearQuote() {
  pendingQuote = null;
  renderReplyBar();
}

function renderReplyBar() {
  const bar = $('replyBar');
  if (!bar) return;
  if (!pendingQuote) { bar.style.display = 'none'; return; }
  const char = activeCharacter();
  const prof = activeProfile();
  const isUser = pendingQuote.role === 'user';
  $('replyBarName').innerText = isUser ? prof.name : char.name;
  const src = pendingQuote.content || (pendingQuote.media ? '[图片]' : '');
  $('replyBarText').innerText = src.length > 40 ? src.slice(0, 40) + '…' : src;
  bar.style.display = 'flex';
  $('chatInput').focus();
}

function quoteBlock(quote) {
  if (!quote) return '';
  const name = quote.name || '';
  const text = quote.content || '';
  return `<div class="quote-block"><div class="quote-body"><div class="quote-name">${escapeHTML(name)}</div><div class="quote-text">${escapeHTML(text)}</div></div></div>`;
}

let _quotePressTimer = null;
let _quotePressIndex = -1;
function quotePress(ev, el, index) {
  if (ev.type === 'touchstart' && ev.cancelable) ev.preventDefault();
  _quotePressIndex = index;
  clearTimeout(_quotePressTimer);
  _quotePressTimer = setTimeout(function() { showQuoteMenu(index); }, 420);
}
function clearQuotePress() {
  clearTimeout(_quotePressTimer);
}
function showQuoteMenu(index) {
  clearQuotePress();
  const char = activeCharacter();
  const msg = char.chat[index];
  if (!msg || msg.role === 'system') return;
  const prof = activeProfile();
  const el = $('quoteMenu');
  if (!el) return;
  const isUser = msg.role === 'user';
  const name = isUser ? prof.name : char.name;
  const text = (msg.content || (msg.media ? '[图片]' : '')).slice(0, 60);
  el.querySelector('.q-cut-txt').textContent = name + '：' + text;
  el.querySelector('.q-reply').onclick = function() { hideQuoteMenu(); quoteMessage(index); };
  var qMulti = el.querySelector('.q-multi');
  if (qMulti) qMulti.onclick = function() { hideQuoteMenu(); enterMultiSelect(index); };
  el.querySelector('.q-del').onclick = function() { hideQuoteMenu(); deleteMessage(char.id, index); };
  el.style.display = 'block';
  setTimeout(function() { el.classList.add('show'); }, 10);
}
function hideQuoteMenu() {
  const el = $('quoteMenu');
  if (el) { el.classList.remove('show'); el.style.display = 'none'; }
  clearQuotePress();
}
document.addEventListener('click', function(e) {
  const el = $('quoteMenu');
  if (el && !el.contains(e.target)) hideQuoteMenu();
});

function setChatTyping(value) {
  chatTyping = value;
  if (value) {
    const char = activeCharacter();
    (char.chat || []).forEach(function(m) { if (m.role === 'user' && m.status === 'sent') m.status = 'read'; });
  }
  renderChat();
}

function appendBubble(role, content, media, translatedText, msgType, quote) {
  const msg = { role, content: content || '', time: new Date().toLocaleString(), ts: Date.now() };
  if (media) msg.media = media;
  if (translatedText) msg.translatedText = translatedText;
  if (msgType) msg.type = msgType;
  if (quote) msg.quote = quote;
  activeCharacter().chat.push(msg);
  if (role === 'assistant') {
    const char = activeCharacter();
    // 对方回复 → 把所有"已发送"的消息标记为已读
    (char.chat || []).forEach(function(m) { if (m.role === 'user' && m.status === 'sent') m.status = 'read'; });
    char.unread = (char.unread || 0) + 1;
    char.read = true;
    var cw = $('chatWindow');
    if (cw && !cw.classList.contains('open')) {
      showMsgNote(char.id, char.name, char.avatar, content || '发来一条消息');
    }
    char.memPending = (char.memPending || 0) + 1;
    var every = (char.autoMemEvery > 0) ? char.autoMemEvery : 1;
    if (char.memPending >= every) {
      char.memPending = 0;
      autoSaveMemory(char);
    }
  } else if (role === 'user') {
    msg.status = 'sent';
    msg._sentTick = true;
  }
  saveState();
  renderChat();
}

// ===== AI 对话 =====
function sendChat() {
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
    const char = activeCharacter();
    const prof = activeProfile();
    let quoteData = null;
    if (pendingQuote) {
      const qmsg = char.chat[pendingQuote.index];
      if (qmsg) {
        quoteData = {
          name: (pendingQuote.role === 'user' ? prof.name : char.name),
          role: qmsg.role,
          content: qmsg.content || ''
        };
      }
      pendingQuote = null;
      renderReplyBar();
    }
    appendBubble('user', text, null, null, null, quoteData);
    input.value = '';
    touchActiveChar();
    var _char = activeCharacter();
    if (typeof willowBlocksReplyFor === 'function' && willowBlocksReplyFor(_char.id, _char.name)) {
      appendBubble('system', '（许愿柳生效中：' + _char.name + ' 今天不回复你的消息。）');
      return;
    }
    _manualAICall = true;
    setChatTyping(true);
    callAI(text, false).then(async function(reply) {
      await deliverReply(reply);
    }).catch(function(err) {
      if (err.name === 'AbortError') { setChatTyping(false); return; }
      setChatTyping(false);
      appendBubble('system', '暂时没回应（' + err.message + '）');
    });
  } else {
    const char = activeCharacter();
    if (typeof willowBlocksReplyFor === 'function' && willowBlocksReplyFor(char.id, char.name)) {
      appendBubble('system', '（许愿柳生效中：' + char.name + ' 今天不回复你的消息。）');
      return;
    }
    _manualAICall = true;
    setChatTyping(true);
    callAI('', false, true).then(async function(reply) {
      await deliverReply(reply || '我在。');
    }).catch(function(err) {
      if (err.name === 'AbortError') { setChatTyping(false); return; }
      setChatTyping(false);
      appendBubble('system', '暂时没回应（' + err.message + '）');
    });
  }
}

// ===== ② 回复节奏真实化 =====
// 不秒回：先"输入中"一小会儿再发；偶尔撤回重发
let _retractChance = 0.18; // 撤回概率

function randomDelay() {
  var r = Math.random();
  if (r < 0.25) return 1200 + Math.random() * 1800;    // 快回
  if (r < 0.6) return 2000 + Math.random() * 3500;     // 正常
  if (r < 0.85) return 4000 + Math.random() * 5000;    // 慢
  return 8000 + Math.random() * 9000;                  // 隔很久，像去忙别的了
}

async function deliverReply(reply) {
  var delay = randomDelay();
  await sleep(delay);
  if (_multiSelect) { setChatTyping(false); return; }
  // 偶发撤回重发
  if (Math.random() < _retractChance) {
    var _c = activeCharacter();
    if (_c) {
      appendBubble('system', _c.name + ' 撤回了一条消息');
      setChatTyping(false);
      await sleep(800 + Math.random() * 1200);
      setChatTyping(true);
    }
  }
  const txt = reply || '……';
  const _c2 = activeCharacter();
  var trans = null;
  if (_c2.translate && _c2.lang && _c2.lang !== '中文') {
    var cleanText = txt.replace(/[（(][^）)]*[）)]/g, '').trim();
    if (cleanText) trans = await translateText(cleanText, _c2.lang).catch(function() { return null; });
  }
  setChatTyping(false);
  appendBubble('assistant', txt, null, trans);
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ===== 心声功能：点头像看 TA 此刻的心情和生活 =====
var MOOD_EMOJI = { happy: '😊', miss: '🥺', jealous: '😒', tsundere: '😏', tired: '😮💨', calm: '🙂', excited: '🤩' };
var MOOD_NAME = { happy: '心情不错', miss: '有点想你', jealous: '小醋坛子', tsundere: '口是心非', tired: '累着了', calm: '平静如水', excited: '雀跃' };
// 心情值（影响属性条/星级）
var MOOD_VAL = { happy: 95, miss: 85, jealous: 60, tsundere: 72, tired: 45, calm: 78, excited: 98 };
// 稀有度
var RARITY = [
  { name: 'N', color: '#b8b8b8' },
  { name: 'R', color: '#7ab8e8' },
  { name: 'SR', color: '#c39be8' },
  { name: 'SSR', color: '#e8b54e' },
  { name: 'UR', color: '#f0626e' }
];

// 心情 → 主题色（统一蓝色系，心情用图形区分）
var MOOD_COLOR = { happy: '#5aa8d8', miss: '#5aa8d8', jealous: '#5aa8d8', tsundere: '#5aa8d8', tired: '#5aa8d8', calm: '#5aa8d8', excited: '#5aa8d8' };
var MOOD_SOFT  = { happy: '#d9effb', miss: '#d9effb', jealous: '#d9effb', tsundere: '#d9effb', tired: '#d9effb', calm: '#d9effb', excited: '#d9effb' };
var MOOD_DEEP  = { happy: '#1f5f8f', miss: '#1f5f8f', jealous: '#1f5f8f', tsundere: '#1f5f8f', tired: '#1f5f8f', calm: '#1f5f8f', excited: '#1f5f8f' };
// 心情 → 顶部自绘线条图形（统一蓝色调，色块 + 线条，不用 emoji 堆砌）
var MOOD_ART = {
  happy: '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="15" fill="#ffd84d" stroke="#1c1c1c" stroke-width="3"/><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13 13l6 6M45 45l6 6M51 13l-6 6M19 45l-6 6" stroke="#1c1c1c" stroke-width="3.5" stroke-linecap="round"/><path d="M27 35h10M27 31l5-4 5 4" stroke="#1c1c1c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  miss: '<svg viewBox="0 0 64 64" fill="none"><path d="M17 40a11 11 0 0 1 3-21.6A15 15 0 0 1 49 24a10 10 0 0 1-2 19.9H18z" fill="#d9effb" stroke="#1c1c1c" stroke-width="3"/><path d="M12 49l-4 8M32 49l-4 8M52 49l-4 8" stroke="#1c1c1c" stroke-width="3.5" stroke-linecap="round"/></svg>',
  jealous: '<svg viewBox="0 0 64 64" fill="none"><ellipse cx="31" cy="36" rx="20" ry="15" fill="#ffd84d" stroke="#1c1c1c" stroke-width="3"/><path d="M20 28c3 6 8 9 13 9" stroke="#1c1c1c" stroke-width="3" stroke-linecap="round"/><path d="M18 24l-6-7M25 22l-3-8M31 23l1-8" stroke="#1c1c1c" stroke-width="3.5" stroke-linecap="round"/></svg>',
  tsundere: '<svg viewBox="0 0 64 64" fill="none"><path d="M16 42V24l7 7 9-9 9 9 7-7v18a15 15 0 0 1-15 15h-2a15 15 0 0 1-15-15z" fill="#f7d7c8" stroke="#1c1c1c" stroke-width="3" stroke-linejoin="round"/><path d="M28 36v5M38 36v5M35 47h-6" stroke="#1c1c1c" stroke-width="3.5" stroke-linecap="round"/><circle cx="45" cy="16" r="4" fill="#1c1c1c"/><circle cx="17" cy="16" r="4" fill="#1c1c1c"/></svg>',
  tired: '<svg viewBox="0 0 64 64" fill="none"><path d="M38 8a24 24 0 1 0 16 38A26 26 0 0 1 38 8z" fill="#eaf3fb" stroke="#1c1c1c" stroke-width="3" stroke-linejoin="round"/><path d="M30 30l2 2 4-3M36 40l2 2 4-3" stroke="#1c1c1c" stroke-width="3" stroke-linecap="round"/><path d="M50 14c1 2 3 2 4 4-1 2-3 2-4 4M56 24c1 2 2 2 3 3-1 2-2 2-3 3" stroke="#1c1c1c" stroke-width="3" stroke-linecap="round"/></svg>',
  calm: '<svg viewBox="0 0 64 64" fill="none"><path d="M8 46h48" stroke="#1c1c1c" stroke-width="3"/><path d="M13 46c0-14 8-23 19-23s19 9 19 23" fill="#d9effb" stroke="#1c1c1c" stroke-width="3" stroke-linejoin="round"/><circle cx="45" cy="20" r="7" fill="#ffd84d" stroke="#1c1c1c" stroke-width="3"/><path d="M18 40c3-4 6-4 9 0M32 42c2-3 5-3 7 0" stroke="#1c1c1c" stroke-width="3" stroke-linecap="round"/></svg>',
  excited: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 6l6 14 15 1-12 9 4 15-13-8-13 8 4-15-12-9 15-1z" fill="#ffd84d" stroke="#1c1c1c" stroke-width="3" stroke-linejoin="round"/><path d="M6 22l3 7 7 1-5 4 1 7-6-4-6 4 1-7-5-4 7-1z" fill="#d9effb" stroke="#1c1c1c" stroke-width="2.5" stroke-linejoin="round"/><path d="M52 40l2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z" fill="#d9effb" stroke="#1c1c1c" stroke-width="2.5" stroke-linejoin="round"/></svg>'
};

function showInnerVoice(charId) {
  var char = getCharacter(charId);
  if (!char) return;
  ensureCharLive(char);
  var old = document.getElementById('innerVoiceOverlay');
  if (old) old.remove();

  var overlay = document.createElement('div');
  overlay.id = 'innerVoiceOverlay';
  overlay.className = 'inner-voice-overlay';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeInnerVoice(); });

  var moodKey = char._moodKey || 'calm';
  var moodEmoji = MOOD_EMOJI[moodKey] || '🙂';
  var moodName = MOOD_NAME[moodKey] || '平静';
  var moodText = char._moodText || '比较平静';
  var lifeText = char._lifeText || '没什么特别的，在等你消息';

  var ago = timeAgoMinutes(char);
  var waitTxt = '';
  if (ago > 0 && ago < 1) waitTxt = '刚刚才收到你的消息';
  else if (ago >= 1) {
    var h = Math.floor(ago / 60);
    var m = Math.floor(ago % 60);
    waitTxt = '等你回消息' + (h > 0 ? (h + ' 小时' + (m > 0 ? ' ' + m + ' 分钟' : '')) : (m + ' 分钟')) + '了';
  } else waitTxt = '还在等你开口';

  var card = document.createElement('div');
  card.className = 'inner-voice-card mood-' + moodKey;
  card.style.setProperty('--iv', MOOD_COLOR[moodKey] || MOOD_COLOR.calm);
  card.style.setProperty('--iv-soft', MOOD_SOFT[moodKey] || MOOD_SOFT.calm);
  card.style.setProperty('--iv-deep', MOOD_DEEP[moodKey] || MOOD_DEEP.calm);
  card.innerHTML =
    '<div class="iv-dots"></div>' +
    '<div class="iv-arc"></div>' +
    '<button class="inner-voice-close" onclick="closeInnerVoice()">✕</button>' +
    '<div class="iv-starburst">!</div>' +
    '<div class="iv-art">' + (MOOD_ART[moodKey] || MOOD_ART.calm) + '</div>' +
    '<div class="iv-top">' +
      '<div class="iv-av">' + renderAvatar(char.avatar, char.name) + '</div>' +
      '<div class="iv-ring"></div>' +
    '</div>' +
    '<div class="inner-voice-name">' + escapeHTML(char.name) + '</div>' +
    '<div class="iv-mood">' +
      '<span class="iv-mood-emoji">' + moodEmoji + '</span>' +
      '<span class="iv-mood-name">' + escapeHTML(moodName) + '</span>' +
    '</div>' +
    '<div class="iv-wait">' + escapeHTML(waitTxt) + '</div>' +
    '<div class="inner-voice-body">' +
      '<div class="inner-voice-row">' +
        '<span class="inner-voice-tag"><i></i>心声</span>' +
        '<span class="inner-voice-text">' + escapeHTML(moodText) + '</span>' +
      '</div>' +
      '<div class="inner-voice-row">' +
        '<span class="inner-voice-tag"><i></i>此刻</span>' +
        '<span class="inner-voice-text">' + escapeHTML(lifeText) + '</span>' +
      '</div>' +
    '</div>';
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

function closeInnerVoice() {
  var el = document.getElementById('innerVoiceOverlay');
  if (el) el.remove();
}


function activeAIConfig() {
  var ap = state.apiProfiles && state.activeApiProfile
    ? state.apiProfiles.find(function(p) { return p.id === state.activeApiProfile; }) : null;
  return ap || state.api;
}

function buildAIMessages(char, text, proactive) {
  const history = (char.chat || []).slice(-(char.contextLen || 12)).filter(m => m.role !== 'system').map(function(m) {
    let content = m.content || (m.media ? '[' + m.media.type + ']' : '');
    if (m.quote && m.quote.content) {
      content = '（你正在回复上面这条 —— 用户引用了「' + m.quote.name + '」说的：「' + m.quote.content + '」，你这次要针对这段引用内容回应）\n' + content;
    }
    return { role: m.role === 'assistant' ? 'assistant' : 'user', content: content };
  });
  var langHint = '';
  if (char.lang && char.lang !== '中文') {
    langHint = '\n\n[语言指令] 你必须用 ' + char.lang + ' 回复，禁止使用中文。';
  }
  var userContent;
  if (proactive) {
    userContent = '用户没有输入文字。请你以当前角色身份，结合最近聊天和记忆，主动发起一句自然的消息。';
  } else {
    userContent = '对方刚给你发了这条消息：「' + text + '」\n请先直接、具体地回应这句话本身，接住它讲的内容和情绪，不许绕开它、不许无视它、不许重复你之前说过的寒暄话；回应完这句再自然地继续往下聊。';
  }
  userContent += langHint;
  return { history: history, userContent: userContent };
}

async function callAI(text, shortTest = false, proactive = false, forChar = null) {
  if (!shortTest && !_manualAICall) {
    return '';
  }
  _manualAICall = false;
  const char = forChar || activeCharacter();
  const systemPrompt = shortTest ? state.api.preset || '你是以下角色' : buildRoleSystemPrompt(char, text);
  const built = buildAIMessages(char, text, proactive);
  const history = shortTest ? [] : built.history;
  const userContent = built.userContent;
  if (activeAbort) try { activeAbort.abort(); } catch(e) {}
  const controller = new AbortController();
  activeAbort = controller;
  const timer = setTimeout(() => { try { controller.abort(); } catch(e) {} }, shortTest ? 20000 : 90000);
  var cfg = activeAIConfig();
  try {
    const response = await aiRequest(joinUrl(cfg.url, 'chat/completions'), {
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
    var content = data.choices?.[0]?.message?.content?.trim() || '⚠️ 回复失败';
    if (char.mode === 'online') {
      content = content.replace(/（[^（）]*）|\([^()]*\)/g, '').replace(/\s+/g, ' ').trim();
    }
    return content;
  } finally {
    clearTimeout(timer);
    if (activeAbort === controller) activeAbort = null;
  }
}

// ===== 完整提示词调试器 =====
function debugPrompt() {
  var char = activeCharacter();
  if (!char) return;
  var input = $('chatInput');
  var text = input ? input.value : '';
  var built = buildAIMessages(char, text, false);
  var systemPrompt = buildRoleSystemPrompt(char, text);
  var cfg = activeAIConfig();
  var lines = [
    '===== 模型配置 =====',
    'model: ' + (cfg.model || '(未设置)'),
    'temperature: ' + (cfg.temp ?? 0.75),
    'top_p: ' + (cfg.topP ?? 0.9),
    'max_tokens: ' + (cfg.maxTokens || 500),
    'presence_penalty: ' + (cfg.presencePenalty ?? 0),
    'frequency_penalty: ' + (cfg.frequencyPenalty ?? 0),
    '',
    '===== SYSTEM PROMPT =====',
    systemPrompt,
    '',
    '===== 最近 ' + built.history.length + ' 条历史 =====',
    built.history.length ? built.history.map(function(m) {
      return '[' + (m.role === 'assistant' ? char.name : '用户') + '] ' + m.content;
    }).join('\n\n') : '（空）',
    '',
    '===== USER CONTENT =====',
    built.userContent
  ];
  var overlay = document.createElement('div');
  overlay.id = 'promptDebugOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  var box = document.createElement('div');
  box.style.cssText = 'background:#14181f;color:#d6dbe3;border-radius:16px;width:min(92vw,620px);max-height:84vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);';
  var head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #2a3038;flex-shrink:0;';
  var title = document.createElement('b');
  title.textContent = '完整提示词 · ' + char.name;
  title.style.cssText = 'font-size:14px;color:#fff;';
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:8px;';
  var copyBtn = document.createElement('button');
  copyBtn.textContent = '复制';
  copyBtn.style.cssText = 'border:none;background:#2a3038;color:#fff;border-radius:8px;padding:4px 12px;cursor:pointer;font-size:12px;';
  copyBtn.addEventListener('click', function() {
    var t = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function() {
        copyBtn.textContent = '已复制';
        setTimeout(function() { copyBtn.textContent = '复制'; }, 1200);
      }).catch(function() {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      copyBtn.textContent = '已复制';
      setTimeout(function() { copyBtn.textContent = '复制'; }, 1200);
    }
  });
  var closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.cssText = 'border:none;background:#3a414a;color:#fff;border-radius:8px;padding:4px 12px;cursor:pointer;font-size:12px;';
  closeBtn.addEventListener('click', function() { overlay.remove(); });
  btns.appendChild(copyBtn);
  btns.appendChild(closeBtn);
  head.appendChild(title);
  head.appendChild(btns);
  var pre = document.createElement('pre');
  pre.style.cssText = 'flex:1;overflow:auto;padding:14px 16px;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;user-select:text;margin:0;';
  pre.textContent = lines.join('\n');
  box.appendChild(head);
  box.appendChild(pre);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

var LANG_CODE = { '中文': 'zh-CN', 'English': 'en', '日本語': 'ja', '한국어': 'ko', 'Français': 'fr', 'Deutsch': 'de', 'Español': 'es', 'Русский': 'ru' };

async function translateText(text, srcLang) {
  if (!text) return null;
  // 只用 Google 翻译（走转发代理时可稳定连通）
  return await googleTranslate(text);
}

async function googleTranslate(text) {
  var ctrl = new AbortController();
  var tmr = setTimeout(function() { try { ctrl.abort(); } catch(e) {} }, 10000);
  try {
    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=' + encodeURIComponent(text.slice(0, 1000));
    var res = await aiRequest(url, { method: 'GET', signal: ctrl.signal });
    if (!res.ok) return null;
    var data = await res.json().catch(function() { return null; });
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    var out = '';
    for (var i = 0; i < data[0].length; i++) {
      if (data[0][i] && data[0][i][0]) out += data[0][i][0];
    }
    return out.trim() || null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(tmr);
  }
}

function zonedTimeText(zone) {
  try {
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: zone || undefined,
      year: 'numeric', month: '2-digit', day: '2-digit',
      weekday: 'long', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date());
    const get = function (t) { const p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
    return get('year') + '-' + get('month') + '-' + get('day') +
      ' ' + get('weekday') + ' ' + get('hour') + ':' + get('minute');
  } catch (e) { return ''; }
}

function tzOffsetMinutes(zone) {
  if (!zone) return NaN;
  try {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour: 'numeric', minute: 'numeric', hour12: false, timeZoneName: 'longOffset'
    }).formatToParts(new Date());
    var offPart = parts.find(function (p) { return p.type === 'timeZoneName'; });
    if (!offPart) return NaN;
    var m = /GMT([+-]\d{1,2})(?::?(\d{2}))?/.exec(offPart.value);
    if (!m) return NaN;
    var h = parseInt(m[1], 10);
    var mm = m[2] ? parseInt(m[2], 10) : 0;
    return h * 60 + (h < 0 ? -mm : mm);
  } catch (e) { return NaN; }
}

function timeDiffText(myZone, charZone) {
  var mine = tzOffsetMinutes(myZone);
  var theirs = tzOffsetMinutes(charZone);
  if (isNaN(mine) || isNaN(theirs)) return '';
  var diffMin = theirs - mine;
  if (diffMin === 0) return '';
  var abs = Math.abs(diffMin);
  var h = Math.floor(abs / 60), m = abs % 60;
  var label = m ? h + ' 小时 ' + m + ' 分' : h + ' 小时';
  return diffMin > 0 ? '对方比你慢 ' + label : '对方比你快 ' + label;
}

function timeAgoText(char) {
  const chat = char.chat || [];
  var lastUser = null;
  for (var i = chat.length - 1; i >= 0; i--) {
    if (chat[i].role === 'user') { lastUser = chat[i]; break; }
  }
  if (!lastUser) return '';
  var ms = (lastUser.ts || Date.parse(lastUser.time || ''));
  if (!ms || isNaN(ms)) return '';
  var diff = Date.now() - ms;
  if (diff < 0) diff = 0;
  var min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return min + ' 分钟前';
  var hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' 小时前';
  var day = Math.floor(hr / 24);
  var rem = hr % 24;
  return (day + ' 天 ' + rem + ' 小时前');
}

// ===== ③ 个性情绪 + ④ 生活细节 =====
// 角色有自己的"此刻状态"：当前心情 + 正在做的事，随时间和等待时长变化
var MOOD_POOL = {
  happy: ['心情不错，嘴角一直压不下来', '今天运气挺好，看什么都顺眼', '刚收到个好消息，还乐着呢'],
  miss: ['想你想到有点出神', '今天好几次点开你的对话框又关掉', '突然特别想你'],
  jealous: ['刚有点吃醋，不太高兴', '心里酸酸的，说不上来', '有点小委屈，等你哄'],
  tsundere: ['嘴上不想理你，其实一直在等', '别扭着呢，才不想承认想你', '傲娇模式，明明在意偏要说没有'],
  tired: ['今天累得够呛，眼皮打架', '忙了一天，人都蔫了', '有点累，但还是想跟你说说话'],
  calm: ['今天比较平静，慢悠悠的', '没什么特别的事，安静待着', '心情平稳，不吵不闹'],
  excited: ['有点兴奋，正憋着话想跟你说', '刚干成一件大事，得意着呢', '心情雀跃，想找人分享']
};
var LIFE_POOL = {
  morning: ['刚醒，在被窝里赖床', '在洗漱，叼着牙刷回你消息', '刚煮好早餐，冒着热气', '在赶早班地铁，人挤人'],
  noon: ['刚吃完饭，在楼下散步消食', '在排队买奶茶，人有点多', '午休时间，趴在桌上刷手机', '在便利店挑关东煮'],
  afternoon: ['在办公室摸鱼，其实没在干活', '在晒太阳发呆', '刚开完会，头还晕着', '在整理房间，翻出好多旧东西'],
  evening: ['刚下班，走在回家的路上', '在做饭，油烟有点呛', '在看剧，正好到高潮', '在楼下遛弯，晚风挺舒服'],
  night: ['洗完澡，头发还湿着', '躺在床上刷手机，灯关着', '在打游戏，菜得很', '在阳台吹风，外面很安静'],
  late: ['失眠了，还醒着', '刚追完一部剧，缓不过劲', '在加班，桌上堆了一叠', '夜很深了，有点想你']
};
function lifePeriod(h) {
  if (h >= 5 && h < 9) return 'morning';
  if (h >= 9 && h < 12) return 'noon';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  if (h >= 22 && h < 2) return 'night';
  return 'late';
}
function rollMood(char) {
  var moods = Object.keys(MOOD_POOL);
  var w = { happy: 1.2, miss: 1.4, jealous: 0.9, tsundere: 1, tired: 1, calm: 1, excited: 0.8 };
  // 等待越久，越想/越委屈
  var ago = timeAgoMinutes(char);
  if (ago >= 60) { w.miss = 3; w.jealous = 1.6; w.tsundere = 1.5; w.happy = 0.4; }
  else if (ago >= 15) { w.miss = 2; w.jealous = 1.2; w.happy = 0.8; }
  // 加权随机
  var total = 0; moods.forEach(function(m) { total += (w[m] || 1); });
  var r = Math.random() * total, acc = 0;
  for (var i = 0; i < moods.length; i++) { acc += (w[moods[i]] || 1); if (r < acc) return { key: moods[i], text: MOOD_POOL[moods[i]][Math.floor(Math.random() * MOOD_POOL[moods[i]].length)] }; }
  return { key: 'calm', text: MOOD_POOL.calm[0] };
}
function rollLife(char) {
  var period = lifePeriod(new Date().getHours());
  var pool = LIFE_POOL[period];
  return pool[Math.floor(Math.random() * pool.length)];
}
function timeAgoMinutes(char) {
  var chat = char.chat || [];
  for (var i = chat.length - 1; i >= 0; i--) {
    if (chat[i].role === 'user') {
      var ts = chat[i].ts || Date.parse(chat[i].time || '');
      if (ts && !isNaN(ts)) return (Date.now() - ts) / 60000;
    }
  }
  return 0;
}
// 确保角色有新鲜的"此刻状态"（超过20分钟重新生成一次）
function ensureCharLive(char) {
  var now = Date.now();
  if (char._liveTs && (now - char._liveTs) < 20 * 60000) return;
  char._liveTs = now;
  var mood = rollMood(char);
  char._moodKey = mood.key;
  char._moodText = mood.text;
  char._lifeText = rollLife(char);
}

function buildRoleSystemPrompt(char, userText) {
  ensureCharLive(char);
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
    '【此刻状态】',
    '你现在的心情：' + (char._moodText || '比较平静'),
    '你正在做的事：' + (char._lifeText || '没什么特别的，在等你消息'),
    '注意：这些状态是你此刻的真实处境，聊天时自然地流露出来（比如正在做事就在话里带一句、心情好就活泼点、想你就说想），但不要每次回复都强行提、更不要机械复述这两行。',
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
    '用 ' + char.name + ' 的身份自然回应，不要提 AI 相关话题，不要自我总结。',
    '【对话质量红线】',
    '1. 先接住对方刚说的话：直接回应对方话里的具体点，再自然延伸；不许答非所问，不许用反问或套话回避。',
    '2. 有问必答：对方直接提问（现在几点、在哪、在干嘛、吃了没、是不是生气了等），必须先给出明确的直接回答，再自然闲聊；禁止用反问、撒娇、俏皮话或"你猜"把问题绕回去不回答。',
    '3. 像真人聊天：短句、口语、有停顿和情绪起伏，像在发手机消息；禁止书面腔、说教腔、汇报腔、翻译腔，禁止像写作文或写评语。',
    '4. 严禁车轱辘话：不重复自己或对方刚说的意思，不反复表达同一个情绪，禁止「你说得对/我理解你/我也这么觉得」这类机械复述开场。特别禁止把自己上一条消息里的开场白或句式原样再发一遍——每一条回复都要和上一条明显不同。',
    '5. 每次回复都要给对话带来新信息、新情绪或新进展，推动话题往前走，不原地打转。',
    '6. 说具体的事：具体细节、经历、画面感，远比空泛的安慰和套话动人；情绪要有来处，别凭空抒情。',
    '7. 让对话有来有回：接住对方话题的同时，适时主动抛出新话题或小问题，别让对话冷场。',
    '8. 情绪和表情要克制：别句句感叹号问号，别堆 emoji，别过度腻歪；拿不准的事就自然带过，不要每句都表态。',
    '9. 做个人，不做答案机：不知道就说不知道或俏皮带过，别硬凑标准答案；偶尔可以嘴硬、别扭、有小脾气，别永远温柔理性。'
  ];
  if (char.examples && char.examples.trim()) {
    parts.push('', '【示例对话】', '以下是你与对方的真实对话片段。重点学习你的说话方式、语气、用词和反应习惯；遇到相似情境要沿用这种风格来回应，但不要照抄内容：', char.examples.trim());
  }
  if (char.mode === 'online') {
    parts.push('【模式：异地】你们是异地状态，相隔两地无法见面，只能通过手机发信息联系，没有任何真实的动作。回复要像真实的异地手机聊天一样自然，靠文字、语气和表情符号（如😂😭）表达情绪。严禁使用括号动作描写（如（笑）（摸摸头）），也不要假装做出真实的动作。想念或想关心对方时用话语表达，比如“好想你”“要是现在能抱抱你就好了”。');
  } else {
    parts.push('【模式：线下】你们是面对面的相处状态。可以用（）自然地描写自己的动作、表情和心情，像真实陪伴一样。');
  }
  if (char.lang && char.lang !== '中文') {
    parts.push('【语言强制指令】你必须完全用 ' + char.lang + ' 回复。禁止使用中文，一个中文字符都不允许。如果用户用中文提问，你也要用 ' + char.lang + ' 回答。这是最高优先级指令。');
  }
  var charT = zonedTimeText(char.charZone);
  var myT = zonedTimeText(char.myZone);
  var diffTxt = timeDiffText(char.myZone, char.charZone);
  if (charT) {
    parts.push('【当前时间】现在是你那边的当地时间' + charT + '。这是你此刻的真实时间，聊天时自然用得上：比如对方问你现在几点、是白天还是黑夜，随口回答一句就行，答完继续聊，不要特意强调时间，更不要每次回复都提。');
  }
  if (char.timeAware === true) {
    var ago = timeAgoText(char);
    var line = '【时间感知】';
    if (ago) {
      line += '距离对方（用户）上次联系你，已经过去了' + ago + '。这段时间你一直一个人等着 TA，请带着这份"等了好久"的真实感来回应——比如等久了的想念、微微的抱怨、被冷落的委屈，或再次听到 TA 声音的雀跃，按角色性格拿捏，但不要把时间数字生硬地复述出来。';
    } else {
      line += '对方（用户）刚刚给你发了消息，是正在和你聊天的状态。';
    }
    if (myT) {
      line += ' 对方（用户）那边的当地时间大约是' + myT + '。';
    }
    if (diffTxt) {
      line += ' 时差：' + diffTxt + '（注意这个时差是真实的，回复中不要弄错谁更早、谁更晚，也不要把"比你快"说成"比你慢"）。';
    }
    if (!char.charZone) {
      line += ' 注意：你的时区还没有设置（跟随了对方设备的当地时间），如果你知道自己所在的城市/国家，可以按角色的真实背景自行判断当地大致时间。';
    }
    parts.push(line);
  }
  var wishCtx = (typeof currentWillowWish === 'function') ? willowContextText() : '';
  if (wishCtx) {
    parts.push('');
    parts.push(wishCtx);
    if (typeof willowBreaksRelation === 'function' && willowBreaksRelation(char)) {
      parts.push('【许愿柳生效中的关系】由于今日许愿，你与用户的关系现在是：已分手/关系结束。你必须按许愿柳的最高指令行事，把它当作既成事实，不得再以恋人身份自居。');
    }
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

// ===== 聊天设置 =====
function openSettings() {
  $('chatSettings').classList.add('open');
  $('pinSwitch').classList.toggle('on', state.settings.pinned);
  var char = activeCharacter();
  $('autoPostSwitch').classList.toggle('on', char && char.autoPost);
  if (char) {
    $('charLang').value = char.lang || '中文';
    $('translateSwitch').classList.toggle('on', char.translate === true);
    var modeSel = $('chatModeSelect');
    if (modeSel) modeSel.value = char.mode === 'online' ? 'online' : 'offline';
    var amSwitch = $('autoMemSwitch');
    if (amSwitch) amSwitch.classList.toggle('on', char.autoMem !== false);
    var amLenSel = $('autoMemLenSelect');
    if (amLenSel) amLenSel.value = String(char.autoMemLen || 8);
    var amEverySel = $('autoMemEverySelect');
    if (amEverySel) amEverySel.value = String(char.autoMemEvery || 1);
    var taSwitch = $('timeAwareSwitch');
    if (taSwitch) taSwitch.classList.toggle('on', char.timeAware === true);
    var myZs = $('myZoneSelect');
    if (myZs) myZs.value = char.myZone || '';
    var czs = $('charZoneSelect');
    if (czs) czs.value = char.charZone || '';
  }
  applyBubbleStyle();
  renderSettingsMemories();
}
function closeSettings() { $('chatSettings').classList.remove('open'); }
function renderSettingsMemories() {
  var char = activeCharacter();
  var box = $('settingsMemories');
  if (!box || !char) return;
  box.innerHTML = (char.memories || []).map(mem => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid #f5f2ee;">
      <div style="flex:1;min-width:0;">
        <b style="font-size:13px;">${escapeHTML(mem.title || '记忆')}</b>
        <div style="font-size:12px;color:#b8a99a;word-break:break-all;">${escapeHTML(mem.text)}</div>
      </div>
      <button onclick="settingsDeleteMemory('${mem.id}')" style="border:none;background:#f7f5f2;color:#c0392b;border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer;flex:0 0 auto;">删</button>
    </div>`).join('') || '<div style="color:#b8a99a;font-size:12px;padding:6px 0;">这个角色还没有记忆。</div>';
}
function settingsAddMemory() {
  var char = activeCharacter();
  if (!char) return;
  var title = $('settingsMemTitle').value.trim();
  var text = $('settingsMemText').value.trim();
  if (!text) return alert('请输入记忆内容');
  if (!Array.isArray(char.memories)) char.memories = [];
  char.memories.unshift({ id: 'mem-' + Date.now(), title: title, text: text, date: new Date().toLocaleString() });
  saveState();
  $('settingsMemTitle').value = '';
  $('settingsMemText').value = '';
  renderSettingsMemories();
}
function settingsDeleteMemory(memId) {
  var char = activeCharacter();
  if (!char) return;
  char.memories = (char.memories || []).filter(mem => mem.id !== memId);
  saveState();
  renderSettingsMemories();
}
function toggleAutoMem() {
  var char = activeCharacter();
  if (!char) return;
  char.autoMem = char.autoMem !== false ? false : true;
  saveState();
  $('autoMemSwitch').classList.toggle('on', char.autoMem !== false);
}
function setAutoMemLen(val) {
  var char = activeCharacter();
  if (!char) return;
  var n = parseInt(val, 10);
  n = (n > 1) ? n : 8;
  char.autoMemLen = n;
  saveState();
  var el = $('autoMemLenSelect');
  if (el) el.value = String(n);
}
function setAutoMemEvery(val) {
  var char = activeCharacter();
  if (!char) return;
  var n = parseInt(val, 10);
  n = (n > 0) ? n : 1;
  char.autoMemEvery = n;
  if (char.memPending >= n) char.memPending = 0;
  saveState();
  var el = $('autoMemEverySelect');
  if (el) el.value = String(n);
}
async function manualSummarizeMemory() {
  var char = activeCharacter();
  if (!char) return alert('请先打开一个角色');
  var cfg = (state.apiProfiles && state.activeApiProfile)
    ? state.apiProfiles.find(function(p) { return p.id === state.activeApiProfile; }) : null;
  cfg = cfg || state.api;
  if (!cfg || !cfg.key || !cfg.url || !cfg.model) return alert('还没连上，先去设置里连接一下。');
  var msgs = (char.chat || []).filter(function(m) { return m.role !== 'system'; }).map(function(m) {
    return (m.role === 'user' ? '用户：' : (char.name + '：')) + (m.content || (m.media ? '[' + m.media.type + ']' : ''));
  }).join('\n');
  if (!msgs) return alert('这个角色还没有聊天记录。');
  var btn = $('manualSumBtn');
  if (btn) { btn.textContent = '总结中…'; btn.style.opacity = '0.6'; btn.disabled = true; }
  var ctrl = new AbortController();
  var tmr = setTimeout(function() { ctrl.abort(); }, 30000);
  try {
    var res = await aiRequest(joinUrl(cfg.url, 'chat/completions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: '你负责从对话中提取值得长期记住的关键信息，比如用户的喜好、名字、重要约定、关系进展、重要事件。' },
          { role: 'user', content: '以下是该角色的全部聊天记录，请逐段浏览后整理出值得记住的信息。\n\n' + msgs + '\n\n请输出值得记住的信息，每条一句话，最多5条，用竖线 | 分隔。没有值得记的就只输出"无"。不要加其它说明。' }
        ],
        max_tokens: 300,
        temperature: 0.3
      })
    });
    var data = await res.json().catch(function() { return {}; });
    if (!res.ok) return alert('总结失败：' + (data.error && data.error.message || res.status));
    var text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
    if (!text) return alert('没有总结出内容。');
    var lines = text.split(/[|\n]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s && s !== '无'; });
    if (!lines.length) return alert('AI 认为没有值得记录的信息。');
    var added = 0;
    lines.forEach(function(line) {
      if (!Array.isArray(char.memories)) char.memories = [];
      var norm = line.replace(/[。，、！？!?.,\s]/g, '');
      var dup = char.memories.some(function(m) { return m.text.replace(/[。，、！？!?.,\s]/g, '') === norm; });
      if (dup) return;
      char.memories.unshift({ id: 'mem-' + Date.now() + '-' + Math.floor(Math.random() * 1000), title: '手动总结', text: line, date: new Date().toLocaleString() });
      added++;
    });
    if (char.memories.length > 50) char.memories.length = 50;
    saveState();
    renderSettingsMemories();
    alert(added ? '已加入 ' + added + ' 条记忆。' : '没有新增记忆（内容已存在）。');
  } catch (e) {
    if (e.name === 'AbortError') alert('总结超时，请重试。');
    else alert('总结失败：' + (e.message || e));
  } finally {
    clearTimeout(tmr);
    if (btn) { btn.textContent = '✍️ 手动总结'; btn.style.opacity = ''; btn.disabled = false; }
  }
}

async function autoSaveMemory(char) {
  try {
    if (!char || char.autoMem === false) return;
    var cfg = (state.apiProfiles && state.activeApiProfile)
      ? state.apiProfiles.find(function(p) { return p.id === state.activeApiProfile; }) : null;
    cfg = cfg || state.api;
    if (!cfg || !cfg.key || !cfg.url || !cfg.model) return;
    var recent = (char.chat || []).slice(-(char.autoMemLen || 8)).filter(function(m) { return m.role !== 'system'; }).map(function(m) {
      return (m.role === 'user' ? '用户：' : (char.name + '：')) + (m.content || (m.media ? '[' + m.media.type + ']' : ''));
    }).join('\n');
    if (!recent) return;
    var ctrl = new AbortController();
    var tmr = setTimeout(function() { ctrl.abort(); }, 12000);
    try {
      var res = await aiRequest(joinUrl(cfg.url, 'chat/completions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: '你负责从对话中提取值得长期记住的关键信息，比如用户的喜好、名字、重要约定、关系进展、重要事件。' },
            { role: 'user', content: '对话如下：\n' + recent + '\n\n请输出值得记住的信息，每条一句话，最多3条，用竖线 | 分隔。没有值得记的就只输出"无"。不要加其它说明。' }
          ],
          max_tokens: 150,
          temperature: 0.3
        })
      });
      var data = await res.json().catch(function() { return {}; });
      if (!res.ok) return;
      var text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
      if (!text) return;
      var lines = text.split(/[|\n]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s && s !== '无'; });
      if (!lines.length) return;
      var changed = false;
      lines.forEach(function(line) {
        if (!Array.isArray(char.memories)) char.memories = [];
        var norm = line.replace(/[。，、！？!?.,\s]/g, '');
        var dup = char.memories.some(function(m) { return m.text.replace(/[。，、！？!?.,\s]/g, '') === norm; });
        if (dup) return;
        char.memories.unshift({ id: 'mem-' + Date.now() + '-' + Math.floor(Math.random() * 1000), title: '自动记忆', text: line, date: new Date().toLocaleString() });
        changed = true;
      });
      if (char.memories.length > 50) char.memories.length = 50;
      if (changed) saveState();
    } finally {
      clearTimeout(tmr);
    }
  } catch (e) {}
}
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
function setChatMode(val) {
  var char = activeCharacter();
  if (!char) return;
  char.mode = val === 'online' ? 'online' : 'offline';
  saveState();
}
function toggleTimeAware() {
  var char = activeCharacter();
  if (!char) return;
  char.timeAware = !char.timeAware;
  saveState();
  $('timeAwareSwitch').classList.toggle('on', char.timeAware);
  if (char.timeAware && !$('myZoneSelect').value) $('myZoneSelect').value = 'Asia/Shanghai';
}
function setMyZone(val) {
  var char = activeCharacter();
  if (!char) return;
  char.myZone = val || '';
  saveState();
}
function setCharZone(val) {
  var char = activeCharacter();
  if (!char) return;
  char.charZone = val || '';
  saveState();
}
function toggleTranslate() {
  var char = activeCharacter();
  if (!char) return;
  char.translate = !char.translate;
  saveState();
  $('translateSwitch').classList.toggle('on', char.translate);
}
function setBubbleStyle(val) {
  state.settings.bubbleStyle = val || 'default';
  saveState();
  applyBubbleStyle();
}
function applyBubbleStyle() {
  var cw = $('chatWindow');
  if (!cw) return;
  var s = state.settings.bubbleStyle || 'default';
  cw.classList.remove('bubble-style-default', 'bubble-style-cute', 'bubble-style-warm', 'bubble-style-dark', 'bubble-style-ig', 'bubble-style-glow', 'bubble-style-comic');
  cw.classList.add('bubble-style-' + s);
  var sel = $('bubbleStyleSelect');
  if (sel) sel.value = s;
}
async function clearHistory() {
  if (!await uiConfirm('清空聊天记录？')) return;
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
    status: 'sent',
    time: new Date().toLocaleString()
  };
  activeCharacter().chat.push(msg);
  saveState();
  if (window.addLedgerQuick) addLedgerQuick(-amount, '聊天红包：' + note, false);
  renderChat();
  document.getElementById('rpOverlay').remove();
  hidePanels();
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
  if (char) state.study.companionRoleId = char.id;
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
      saveState();
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
    saveState();
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
  };
  reader.readAsDataURL(blob);
}

// ===== ① 空闲主动找话 =====
// 用户超过 idleMin 分钟没发消息 → 角色主动发一条
let _idleMin = 6;          // 默认多久没人说话算"冷场"（分钟），越短越黏人
let _idleCooldown = 12;    // 主动发完之后至少冷却多少分钟
let _lastProactiveTs = 0;
let _lastProactiveCharId = '';
let _idleMsgTimes = {};    // 每个角色上次主动消息时间

function startIdleProactive() {
  if (_idleProactiveTimer) return;
  _idleProactiveTimer = setInterval(idleProactiveTick, 30000);
}

function idleProactiveTick() {
  if (typeof state === 'undefined' || !state) return;
  if (!state.api.key || !state.api.url || !state.api.model) return;
  if (typeof willowBlocksProactive === 'function' && willowBlocksProactive()) return;
  var chars = state.roles || [];
  var now = Date.now();
  for (var i = 0; i < chars.length; i++) {
    var char = chars[i];
    if (!char) continue;
    if (char.idleProactive === false) continue;
    if (char.chat && char.chat.length === 0) continue;
    // 找最后一条用户消息时间
    var lastUserTs = 0;
    for (var j = char.chat.length - 1; j >= 0; j--) {
      var m = char.chat[j];
      if (m.role === 'user') { lastUserTs = m.ts || Date.parse(m.time || ''); break; }
    }
    if (!lastUserTs || isNaN(lastUserTs)) continue;
    var idle = (now - lastUserTs) / 60000;
    if (idle < _idleMin) continue;
    var lastPro = _idleMsgTimes[char.id] || 0;
    if ((now - lastPro) / 60000 < _idleCooldown) continue;
    // 用户正在聊天窗口里（不管和谁）时不插话
    var cw = document.getElementById('chatWindow');
    if (cw && cw.classList.contains('open')) continue;
    if (chatTyping) continue;
    // 触发主动消息
    _idleMsgTimes[char.id] = now;
    fireProactive(char);
    return; // 每次 tick 只发一个角色，避免刷屏
  }
}

function fireProactive(char) {
  _manualAICall = true;
  setChatTyping(true);
  callAI('', false, true, char).then(function(reply) {
    setChatTyping(false);
    var txt = reply || '……';
    var trans = null;
    if (char.translate && char.lang && char.lang !== '中文') {
      var cleanText = txt.replace(/[（(][^）)]*[）)]/g, '').trim();
      if (cleanText) trans = translateText(cleanText, char.lang).catch(function() { return null; });
    }
    var msg = { role: 'assistant', content: txt, time: new Date().toLocaleString(), ts: Date.now() };
    if (trans) msg.translatedText = trans;
    if (!char.chat) char.chat = [];
    char.chat.push(msg);
    char.unread = (char.unread || 0) + 1;
    char.read = true;
    var cw = document.getElementById('chatWindow');
    if (cw && (!cw.classList.contains('open') || state.activeRoleId !== char.id)) {
      showMsgNote(char.id, char.name, char.avatar, txt || '发来一条消息');
    }
    saveState();
    if (state.activeRoleId === char.id) renderChat();
  }).catch(function(err) {
    setChatTyping(false);
    if (err.name === 'AbortError') return;
    if (!char.chat) char.chat = [];
    char.chat.push({ role: 'system', content: '（' + char.name + ' 想找你，但信号不太好。）', time: new Date().toLocaleString(), ts: Date.now() });
    saveState();
    if (state.activeRoleId === char.id) renderChat();
  });
}

// 用户主动发消息时，重置空闲计时，避免刚聊完就"冷场"
function touchActiveChar() {
  var char = activeCharacter();
  if (!char) return;
  var cw = document.getElementById('chatWindow');
  var chatOpen = cw && cw.classList.contains('open');
  if (!chatOpen || !chatTyping) return;
  // 用户刚发了消息 → 该角色回到活跃状态，先不主动打扰
  var now = Date.now();
  if (_idleMsgTimes[char.id]) _idleMsgTimes[char.id] = now;
}

function setIdleParams(min, cooldown) {
  if (min && !isNaN(min) && min > 0) _idleMin = min;
  if (cooldown && !isNaN(cooldown) && cooldown > 0) _idleCooldown = cooldown;
}
