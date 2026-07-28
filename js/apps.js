// ============================================================
// apps.js - 所有小应用
// ============================================================

// ---------- 应用管理 ----------
function openApp(name) {
  try {
    $('appModal').classList.add('active');
    $('slider').style.overflowX = 'hidden';
    $('slider').style.cursor = 'default';
    const dbg = document.querySelector('.debug-btn');
    if (dbg) dbg.style.display = 'none';
    hidePanels();
    setTitle(name === 'QQ' ? '' : name);
    const ah = document.querySelector('.app-header');
    if (ah) ah.style.display = (name === 'QQ') ? 'none' : '';
    const map = {
      '设置': renderApiSettings, '打卡': renderCheckins,
      '家园': renderHome, '日记': renderDiary, '自习': renderStudy, '自习室': renderStudy,
      '养多肉': renderPlant, '多肉': renderPlant, '账本': renderLedger, '涂鸦': renderDoodle,
      '音乐': renderMusic, '啵啵': renderKiss, '相册': renderAlbum,
      '塔罗': renderTarot, '塔罗牌': renderTarot, '游戏': renderGame, '游戏房': renderGame, '空间': renderSpace,
      'QQ': renderIGProfile
    };
    if (map[name]) { map[name](); return; }
    c().innerHTML = '<div class="card subtle">未找到「' + escapeHTML(name) + '」对应的应用。</div>';
  } catch (err) {
    console.error('openApp error:', err);
    c().innerHTML = '<div class="card" style="color:#e53935">打开失败：' + escapeHTML(err.message) + '</div>';
  }
}

function closeApp() {
  const mc = c();
  if (mc) { mc.style.padding = ''; mc.style.height = ''; mc.style.overflow = ''; mc.style.display = ''; mc.style.flexDirection = ''; mc.style.background = ''; }
  const ah = document.querySelector('.app-header');
  if (ah && ah.style.background) ah.style.background = '';
  const hdr = document.querySelector('.app-header');
  if (hdr) hdr.classList.remove('hidden');
  $('appModal').classList.remove('active');
  $('slider').style.overflowX = 'auto';
  $('slider').style.cursor = 'grab';
  const dbg = document.querySelector('.debug-btn');
  if (dbg) dbg.style.display = 'block';
  closeChat();
  closeSettings();
  stopGame();
}

// ---------- 底部标签栏 ----------
function switchTab(t, el) {
  document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  const title = t === 'msg' ? '消息' : t === 'contact' ? '联系人' : t === 'moment' ? '动态' : '我的';
  setTitle(title);
  if (t === 'msg') renderMessageList();
  if (t === 'contact') renderContacts();
  if (t === 'moment') renderMoments();
  if (t === 'me') renderMyProfile();
}

// ---------- 设置 ----------
function renderApiSettings() {
  const cfgDone = state.api.key && state.api.url && state.api.model;
  c().innerHTML = `
    <div class="stack">
      <div class="card" style="display:flex;align-items:center;gap:10px;padding:12px 14px">
        <span style="width:10px;height:10px;border-radius:50%;background:${cfgDone ? '#31c45d' : '#f0a020'};flex:0 0 auto"></span>
        <div style="flex:1;min-width:0">
          <b style="font-size:14px">连接状态</b>
          <div class="subtle">${cfgDone ? '已配置 API，可以聊天' : '尚未完成 API 配置'}</div>
        </div>
      </div>
      <div class="card">
        <h2 class="section-title">🔧 大模型驱动中心</h2>
        <label class="label">API Key</label>
        <input class="field" type="password" id="apiKeyInput" placeholder="sk-..." value="${escapeHTML(state.api.key)}">
        <label class="label">API Base URL</label>
        <input class="field" id="apiUrlInput" placeholder="https://api.openai.com/v1" value="${escapeHTML(state.api.url)}">
        <label class="label">模型名称</label>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
          <input class="field" id="apiModelInput" placeholder="gpt-4.1-mini" value="${escapeHTML(state.api.model)}">
          <button class="ghost-btn" onclick="pullModels()">拉取</button>
        </div>
        <select class="select" id="apiModelSelect" onchange="$('apiModelInput').value=this.value" style="margin-top:8px"><option value="">模型列表</option></select>
        <label class="label">AI 预设</label>
        <textarea class="textarea" id="apiPresetInput">${escapeHTML(state.api.preset)}</textarea>
        <div class="grid2" style="margin-top:4px">
          <button class="ghost-btn" onclick="testConnection()">测试连接</button>
          <button class="primary-btn" id="saveApiBtn" onclick="saveApiConfig()">保存配置</button>
        </div>
        <div id="apiTestResult" class="subtle" style="margin-top:8px;min-height:16px"></div>
      </div>
      <div class="card">
        <h2 class="section-title">💾 数据备份</h2>
        <div class="grid2">
          <button class="ghost-btn" onclick="exportAllData()">导出全部</button>
          <button class="primary-btn" onclick="$('importDataFile').click()">导入备份</button>
        </div>
        <input id="importDataFile" type="file" accept="application/json,.json" style="display:none" onchange="importAllData(event)">
        <button class="danger-btn" style="width:100%;margin-top:10px" onclick="resetAllData()">清空全部数据</button>
      </div>
      <div class="card subtle">提示：如果直接用浏览器打开 HTML，部分接口可能因为跨域策略被拦截。配置仍会保存，能用的中转接口或允许跨域的 API 可以直接聊天。</div>
    </div>`;
  const sel = $('apiModelSelect');
  if (state.api.model) sel.innerHTML = `<option value="${escapeHTML(state.api.model)}">${escapeHTML(state.api.model)}</option>`;
}

function saveApiConfig() {
  state.api.key = $('apiKeyInput').value.trim();
  state.api.url = $('apiUrlInput').value.trim() || defaultState.api.url;
  state.api.model = $('apiModelInput').value.trim() || defaultState.api.model;
  state.api.preset = $('apiPresetInput').value.trim() || defaultState.api.preset;
  saveState();
  const btn = $('saveApiBtn');
  if (btn) { btn.innerText = '已保存 ✓'; setTimeout(() => btn.innerText = '保存配置', 1500); }
  renderApiSettings();
}

async function pullModels() {
  saveApiConfig();
  if (!state.api.key || !state.api.url) return alert('请先填写 Key 和 Base URL');
  try {
    const response = await fetch(joinUrl(state.api.url, 'models'), { headers: { Authorization: 'Bearer ' + state.api.key } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || response.status);
    const select = $('apiModelSelect');
    select.innerHTML = '<option value="">选择模型</option>' + (data.data || []).map(m => `<option value="${escapeHTML(m.id)}">${escapeHTML(m.id)}</option>`).join('');
    alert('模型已拉取');
  } catch (err) {
    alert('拉取失败：' + err.message);
  }
}

async function testConnection() {
  saveApiConfig();
  const box = $('apiTestResult');
  if (!state.api.key || !state.api.url || !state.api.model) {
    if (box) box.innerHTML = '<span style="color:#e53935">请先填好 Key、URL 和模型</span>';
    return;
  }
  if (box) box.innerHTML = '连接测试中…';
  try {
    const text = await callAI('测试连接，请只回复"连接成功"。', true);
    if (box) box.innerHTML = '<span style="color:#31c45d">✓ 连接成功：' + escapeHTML(text) + '</span>';
  } catch (err) {
    if (box) box.innerHTML = '<span style="color:#e53935">✗ 连接失败：' + escapeHTML(err.message) + '</span>';
  }
}

function exportAllData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-phone-backup-' + todayKey() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importAllData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = ensureStateShape(mergeDeep(cloneDefaultState(), imported), imported);
      saveState();
      alert('导入成功');
      renderApiSettings();
    } catch (err) {
      alert('导入失败：' + err.message);
    }
  };
  reader.readAsText(file, 'utf-8');
  event.target.value = '';
}

function resetAllData() {
  if (!confirm('确定清空全部角色、聊天、记忆和设置？')) return;
  state = cloneDefaultState();
  saveState();
  renderApiSettings();
}

// ---------- 消息列表 ----------
function renderMessageList() {
  setTitle('消息');
  const chars = state.roles.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  c().innerHTML = `
    <div class="stack">
      <input class="search-field" id="msgSearch" placeholder="🔍 搜索角色 / 消息" oninput="filterMsgList()">
      <div id="msgListWrap">
      ${(chars.length ? chars : [{ id: '', name: '', avatar: '', relation: '', chat: [], unread: 0, online: false }]).map(char => {
        if (!char.id) return '<div class="card subtle">还没有和任何角色聊过，去「联系人」认识他们吧。</div>';
        const last = (char.chat || [])[char.chat.length - 1];
        const time = last && last.time ? last.time.slice(11, 16) : '';
        const rel = char.relation ? `<span class="tag">${escapeHTML(char.relation)}</span>` : '';
        const dot = char.online ? '<span class="online-dot"></span>' : '<span class="offline-dot"></span>';
        return `
        <div class="list-card" style="${char.pinned ? 'background:rgba(21,81,111,.06);border-left:3px solid var(--qq-blue)' : ''}" onclick="openChat('${char.id}')">
          <div class="avatar" style="position:relative">${renderAvatar(char.avatar, char.name)}${dot}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px"><b>${escapeHTML(char.name)}</b>${rel}</div>
            <div class="subtle" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(lastChatPreview(char))}</div>
          </div>
          <div style="text-align:right;min-width:42px">
            <div class="subtle-time">${time}</div>
            ${char.unread > 0 ? `<div class="badge">${char.unread > 99 ? '99+' : char.unread}</div>` : ''}
          </div>
        </div>`;
      }).join('')}
      </div>
    </div>`;
}

function filterMsgList() {
  const q = ($('msgSearch').value || '').toLowerCase();
  document.querySelectorAll('#msgListWrap .list-card').forEach((el, i) => {
    const char = state.roles[i];
    const hit = char && (char.name.toLowerCase().includes(q) || lastChatPreview(char).toLowerCase().includes(q));
    el.style.display = (!q || hit) ? '' : 'none';
  });
}

// ---------- 联系人 ----------
function renderContacts() {
  setTitle('联系人');
  c().innerHTML = `
    <div class="stack">
      <button class="primary-btn" onclick="renderCharacterEditor('new')">＋ 新建角色卡</button>
      <input class="search-field" id="contactSearch" placeholder="🔍 搜索联系人" oninput="filterContacts()">
      <div id="contactWrap">
        <div class="subtle" style="padding:4px 2px">我认识的角色（${state.roles.length}）</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${state.roles.map(char => `
          <div class="card char-cell" onclick="openChat('${char.id}')">
            <div class="avatar" style="position:relative;margin:0 auto 6px">${renderAvatar(char.avatar, char.name)}${char.online ? '<span class="online-dot"></span>' : '<span class="offline-dot"></span>'}</div>
            <div style="text-align:center;font-weight:700">${escapeHTML(char.name)}</div>
            <div class="subtle" style="text-align:center;font-size:12px;margin-top:2px">${escapeHTML(char.relation || char.aliases || '角色')}</div>
            <div style="display:flex;gap:6px;margin-top:8px">
              <button class="ghost-btn" style="flex:1;padding:4px;font-size:12px" onclick="event.stopPropagation();renderCharacterEditor('${char.id}')">编辑</button>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function filterContacts() {
  const q = ($('contactSearch').value || '').toLowerCase();
  document.querySelectorAll('#contactWrap .list-card').forEach((el, i) => {
    const char = state.roles[i];
    el.style.display = (!q || (char && char.name.toLowerCase().includes(q))) ? '' : 'none';
  });
}

// ---------- 角色编辑器 ----------
function renderCharacterEditor(id) {
  const isNew = id === 'new';
  const char = isNew ? { id: 'char-' + Date.now(), memories: [], chat: [], unread: 0, read: true, name: '', avatar: '', aliases: '', relation: '', personality: '', style: '', background: '', prompt: '', greeting: '' } : getCharacter(id);
  const deleteButton = isNew ? '' : `<button class="danger-btn" style="width:100%;margin-top:10px" onclick="deleteCharacter('${char.id}')">删除角色</button>`;
  setTitle(isNew ? '新建角色' : '编辑角色');
  c().innerHTML = `
    <div class="stack">
      <div class="card">
        <label class="label">头像图片</label>
        <div class="avatar-upload">
          <div class="avatar-preview" id="charAvatarPreview">${renderAvatar(char.avatar, char.name)}</div>
          <div>
            <button class="ghost-btn" type="button" onclick="$('charAvatarFile').click()">选择图片</button>
            <div class="subtle" style="margin-top:6px">会自动压缩保存，避免头像丢失。</div>
          </div>
        </div>
        <input id="charAvatar" type="hidden" value="${escapeHTML(char.avatar)}">
        <input id="charAvatarFile" type="file" accept="image/*" style="display:none" onchange="uploadAvatar(event, 'charAvatar', 'charAvatarPreview')">
        <label class="label">角色名称</label>
        <input class="field" id="charName" value="${escapeHTML(char.name)}" placeholder="角色名字">
        <label class="label">角色别名 / 小名</label>
        <input class="field" id="charAliases" value="${escapeHTML(char.aliases)}" placeholder="多个别名用逗号隔开">
        <label class="label">关系设定</label>
        <input class="field" id="charRelation" value="${escapeHTML(char.relation)}" placeholder="朋友 / 恋人 / 搭档 / 自定义">
        <label class="label">性格标签</label>
        <textarea class="textarea" id="charPersonality" placeholder="冷静、温柔、占有欲、毒舌...">${escapeHTML(char.personality)}</textarea>
        <label class="label">说话风格</label>
        <textarea class="textarea" id="charStyle" placeholder="短句、口语、会撒娇、少用感叹号...">${escapeHTML(char.style)}</textarea>
        <label class="label">背景故事</label>
        <textarea class="textarea" id="charBackground" placeholder="角色经历、身份、世界观...">${escapeHTML(char.background)}</textarea>
        <label class="label">高级 Prompt</label>
        <textarea class="textarea" id="charPrompt" placeholder="额外规则、禁止崩人设、互动边界...">${escapeHTML(char.prompt)}</textarea>
        <label class="label">开场白</label>
        <textarea class="textarea" id="charGreeting" placeholder="第一次聊天时角色说的话">${escapeHTML(char.greeting)}</textarea>
        <div class="grid2" style="margin-top:10px">
          <button class="ghost-btn" onclick="switchTab('contact', document.querySelectorAll('.tab-item')[1])">返回</button>
          <button class="primary-btn" onclick="saveCharacter('${isNew ? 'new' : char.id}')">保存角色</button>
        </div>
        ${deleteButton}
      </div>
      ${isNew ? '' : renderMemoryEditor(char)}
    </div>`;
}

function renderMemoryEditor(char) {
  return `
    <div class="card">
      <h2 class="section-title">记忆库</h2>
      <input class="field" id="memoryTitle" placeholder="记忆标题 / 标签">
      <textarea class="textarea" id="memoryText" placeholder="这个角色需要记住什么？" style="margin-top:8px"></textarea>
      <button class="primary-btn" style="width:100%;margin-top:8px" onclick="addMemory('${char.id}')">加入记忆</button>
    </div>
    ${(char.memories || []).map(mem => `
      <div class="list-card">
        <div style="flex:1;min-width:0">
          <b>${escapeHTML(mem.title || '记忆')}</b>
          <div class="subtle">${escapeHTML(mem.text)}</div>
        </div>
        <button class="danger-btn" onclick="deleteMemory('${char.id}','${mem.id}')">删</button>
      </div>`).join('') || '<div class="card subtle">这个角色还没有记忆。</div>'}`;
}

function saveCharacter(id) {
  const isNew = id === 'new';
  const char = isNew ? { id: 'char-' + Date.now(), memories: [], chat: [], unread: 0, read: true } : getCharacter(id);
  char.avatar = $('charAvatar').value.trim();
  char.name = $('charName').value.trim() || '未命名角色';
  char.aliases = $('charAliases').value.trim();
  char.relation = $('charRelation').value.trim();
  char.personality = $('charPersonality').value.trim();
  char.style = $('charStyle').value.trim();
  char.background = $('charBackground').value.trim();
  char.prompt = $('charPrompt').value.trim();
  char.greeting = $('charGreeting').value.trim() || '你好，我在。';
  if (!char.chat.length) char.chat = [{ role: 'assistant', content: char.greeting }];
  if (isNew) {
    state.roles.push(char);
    state.activeRoleId = char.id;
  }
  saveState();
  renderContacts();
}

async function uploadAvatar(event, inputId, previewId) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return alert('请选择图片文件');
  try {
    const dataUrl = await compressAvatar(file);
    $(inputId).value = dataUrl;
    $(previewId).innerHTML = renderAvatar(dataUrl, '头像');
  } catch (err) {
    alert('头像读取失败：' + err.message);
  } finally {
    event.target.value = '';
  }
}

function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('无法读取图片'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片格式无法识别'));
      img.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(type, 0.86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function deleteCharacter(id) {
  if (state.roles.length <= 1) return alert('至少保留一个角色');
  if (!confirm('删除这个角色卡和它的聊天记录？')) return;
  state.roles = state.roles.filter(char => char.id !== id);
  if (state.activeRoleId === id) state.activeRoleId = state.roles[0].id;
  saveState();
  renderContacts();
}

function addMemory(charId) {
  const char = getCharacter(charId);
  const text = $('memoryText').value.trim();
  if (!text) return alert('先写记忆内容');
  char.memories.unshift({ id: 'mem-' + Date.now(), title: $('memoryTitle').value.trim(), text, date: new Date().toLocaleString() });
  saveState();
  renderCharacterEditor(charId);
}

function deleteMemory(charId, memoryId) {
  const char = getCharacter(charId);
  char.memories = char.memories.filter(mem => mem.id !== memoryId);
  saveState();
  renderCharacterEditor(charId);
}

// ---------- 动态 ----------
const CHAR_MOMENT_IDEAS = [
  '今天天气不错，想和你一起出去走走。',
  '刚发呆了一会儿，脑子里全是你。',
  '有点累了，但想到你就又有了力气。',
  '偷偷学了首歌，下次唱给你听。',
  '今天也觉得能遇见你真好。',
  '如果我在你身边，现在应该正靠着你吧。'
];

function renderMoments() {
  setTitle('动态');
  const char = activeCharacter();
  c().innerHTML = `
    <div class="stack">
      <div class="card" style="background:var(--qq-grad);color:#fff">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div class="avatar">${renderAvatar(char.avatar, char.name)}</div>
          <div><b style="color:#fff">${escapeHTML(char.name)}</b><div class="subtle" style="color:#e3f0f6">以 TA 的身份发一条动态</div></div>
        </div>
        <textarea class="textarea" id="momentText" placeholder="写点 ${escapeHTML(char.name)} 想说的话...（留空则随机生成）" style="color:#18212f"></textarea>
        <div class="grid2" style="margin-top:8px">
          <button class="ghost-btn" style="background:rgba(255,255,255,.2);color:#fff" onclick="postMoment('user')">我发</button>
          <button class="primary-btn" style="background:#fff;color:var(--qq-blue)" onclick="postMoment('character')">${escapeHTML(char.name)}发</button>
        </div>
      </div>
      ${state.moments.map(moment => renderMomentCard(moment)).join('') || '<div class="card subtle">还没有动态，发一条试试？</div>'}
    </div>`;
}

function renderMomentCard(moment) {
  const char = moment.characterId ? getCharacter(moment.characterId) : null;
  const prof = activeProfile();
  const avatar = moment.author === 'character' && char ? char.avatar : prof.avatar;
  const name = moment.author === 'character' && char ? char.name : prof.name;
  const likes = moment.likes || 0;
  const liked = moment.likedByMe;
  const comments = (moment.comments || []).map(cm => `<div class="comment-box">${escapeHTML(cm.name)}：${escapeHTML(cm.text)}</div>`).join('');
  return `<div class="card">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
      <div class="avatar">${renderAvatar(avatar, name)}</div>
      <div><b>${escapeHTML(name)}</b><div class="subtle">${escapeHTML(moment.date)}</div></div>
    </div>
    <div>${escapeHTML(moment.text)}</div>
    <div class="moment-actions">
      <span onclick="likeMoment('${moment.id}')">${liked ? '❤️' : '🤍'} ${likes}</span>
      <span onclick="addComment('${moment.id}')">💬 评论 ${moment.comments ? moment.comments.length : 0}</span>
    </div>
    ${comments}
  </div>`;
}

function postMoment(author) {
  let text = $('momentText').value.trim();
  if (author === 'character' && !text) {
    text = CHAR_MOMENT_IDEAS[Math.floor(Math.random() * CHAR_MOMENT_IDEAS.length)];
  }
  if (!text) return alert('先写动态内容');
  state.moments.unshift({
    id: 'moment-' + Date.now(),
    author,
    characterId: author === 'character' ? activeCharacter().id : '',
    text,
    date: new Date().toLocaleString(),
    likes: 0,
    likedByMe: false,
    comments: []
  });
  saveState();
  renderMoments();
}

function likeMoment(id) {
  const m = state.moments.find(x => x.id === id);
  if (!m) return;
  if (m.likedByMe) { m.likedByMe = false; m.likes = Math.max(0, (m.likes || 0) - 1); }
  else { m.likedByMe = true; m.likes = (m.likes || 0) + 1; }
  saveState();
  renderMoments();
}

function addComment(id) {
  const m = state.moments.find(x => x.id === id);
  if (!m) return;
  const text = prompt('写评论：');
  if (!text || !text.trim()) return;
  m.comments = m.comments || [];
  m.comments.push({ name: activeProfile().name || '我', text: text.trim() });
  saveState();
  renderMoments();
}

// ---------- 我的 ----------
function renderMyProfile() {
  setTitle('我的');
  const cur = activeProfile();
  const charCount = state.roles.length;
  const chatCount = state.roles.reduce((s, c) => s + (c.chat ? c.chat.length : 0), 0);
  const tomatoCount = state.study.round || 0;
  c().innerHTML = `
    <div class="stack">
      <div class="profile-hero" style="background:var(--qq-grad)">
        <div class="avatar">${renderAvatar(cur.avatar, cur.name)}</div>
        <h2 style="margin:6px 0 2px">${escapeHTML(cur.name || '我')}</h2>
        <div class="subtle" style="color:rgba(255,255,255,.85)">${escapeHTML((cur.persona || '').slice(0, 24) || '这套人设还没写简介')}</div>
        <div class="wallet-pill">💰 钱包 ${state.profile.wallet} 元</div>
      </div>
      <div class="grid3" style="margin:2px 0">
        <div class="metric"><span class="subtle">角色</span><b>${charCount}</b></div>
        <div class="metric"><span class="subtle">聊天</span><b>${chatCount}</b></div>
        <div class="metric"><span class="subtle">番茄</span><b>${tomatoCount}</b></div>
      </div>
      <div class="card">
        <h2 class="section-title">我的人设</h2>
        <label class="label">我的头像图片</label>
        <div class="avatar-upload">
          <div class="avatar-preview" id="profileAvatarPreview">${renderAvatar(cur.avatar, cur.name)}</div>
          <div>
            <button class="ghost-btn" type="button" onclick="$('profileAvatarFile').click()">选择图片</button>
            <div class="subtle" style="margin-top:6px">会自动压缩保存，避免头像丢失。</div>
          </div>
        </div>
        <input id="profileAvatar" type="hidden" value="${escapeHTML(cur.avatar)}">
        <input id="profileAvatarFile" type="file" accept="image/*" style="display:none" onchange="uploadAvatar(event, 'profileAvatar', 'profileAvatarPreview')">
        <label class="label">昵称</label>
        <input class="field" id="profileName" value="${escapeHTML(cur.name)}">
        <label class="label">我是谁</label>
        <textarea class="textarea" id="profilePersona" placeholder="你的身份、性格、希望角色知道的背景">${escapeHTML(cur.persona)}</textarea>
        <label class="label">喜好</label>
        <textarea class="textarea" id="profileLikes" placeholder="喜欢什么、习惯、偏好的互动">${escapeHTML(cur.likes)}</textarea>
        <label class="label">边界 / 雷点</label>
        <textarea class="textarea" id="profileBoundaries" placeholder="不喜欢什么、不要怎么说话">${escapeHTML(cur.boundaries)}</textarea>
        <label class="label">我的说话方式</label>
        <textarea class="textarea" id="profileSpeaking" placeholder="例如：短句、撒娇、认真、口语化">${escapeHTML(cur.speaking)}</textarea>
        <div class="grid2" style="margin-top:10px">
          <button class="ghost-btn" onclick="renderMyProfile()">取消</button>
          <button class="primary-btn" onclick="saveMyProfile()">保存我的人设</button>
        </div>
      </div>
      <div class="card">
        <h2 class="section-title">全部人设</h2>
        <button class="primary-btn" style="width:100%;margin-bottom:10px" onclick="newProfile()">＋ 新建人设</button>
        ${state.profiles.map(p => `
          <div class="list-card" onclick="editProfile('${p.id}')">
            <div class="avatar">${renderAvatar(p.avatar, p.name)}</div>
            <div style="flex:1;min-width:0">
              <b>${escapeHTML(p.name || '我')}</b>
              <div class="subtle">${p.id === state.activeProfileId ? '使用中 · ' : ''}${escapeHTML((p.persona || '').slice(0, 20) || '未填写人设')}</div>
            </div>
            ${p.id === state.activeProfileId ? '<span class="subtle">当前</span>' : '<span class="subtle">点开</span>'}
          </div>`).join('')}
      </div>
    </div>`;
}

function newProfile() {
  const prof = { id: 'prof-' + Date.now(), name: '', avatar: '', persona: '', likes: '', boundaries: '', speaking: '' };
  state.profiles.push(prof);
  state.activeProfileId = prof.id;
  saveState();
  renderMyProfile();
}
function editProfile(id) {
  if (id !== state.activeProfileId) { state.activeProfileId = id; saveState(); }
  renderMyProfile();
}
function saveMyProfile() {
  const cur = activeProfile();
  cur.avatar = $('profileAvatar').value.trim();
  cur.name = $('profileName').value.trim() || '我';
  cur.persona = $('profilePersona').value.trim();
  cur.likes = $('profileLikes').value.trim();
  cur.boundaries = $('profileBoundaries').value.trim();
  cur.speaking = $('profileSpeaking').value.trim();
  saveState();
  renderMyProfile();
}

// ---------- 打卡 ----------
let checkinTab = 'doing';
let checkinForm = null;

function renderCheckins() {
  const totalDone = state.checkins.reduce((s, x) => s + (x.doneDays || 0), 0);
  const filtered = state.checkins.filter(x => (checkinTab === 'doing' && x.status !== 'done') || (checkinTab === 'done' && x.status === 'done') || (checkinTab === 'undone' && x.status === 'undone'));
  const list = filtered.length ? filtered.map(x => {
    const rate = x.totalDays ? Math.min(100, Math.round((x.doneDays || 0) / x.totalDays * 100)) : 0;
    const editing = checkinForm && checkinForm.mode === 'edit' && checkinForm.id === x.id;
    if (editing) {
      return `<div class="card">
        <div class="label">项目名称</div>
        <input class="field" id="ck-name" value="${escapeHTML(x.name)}">
        <div class="grid2">
          <div><div class="label">开始</div><input class="field" id="ck-start" value="${escapeHTML(x.start)}"></div>
          <div><div class="label">结束</div><input class="field" id="ck-end" value="${escapeHTML(x.end)}"></div>
        </div>
        <div class="label">总天数</div>
        <input class="field" id="ck-total" type="number" value="${x.totalDays}">
        <div class="grid2" style="margin-top:10px">
          <button class="primary-btn" onclick="submitEditCheckin('${x.id}')">保存</button>
          <button class="ghost-btn" onclick="checkinForm=null;renderCheckins()">取消</button>
        </div>
      </div>`;
    }
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b style="font-size:16px">${escapeHTML(x.name)}</b>
        <span class="tag">${x.status === 'done' ? '已完成' : (x.status === 'undone' ? '未完成' : '进行中')}</span>
      </div>
      <div class="subtle" style="margin:6px 0">${escapeHTML(x.start)} - ${escapeHTML(x.end)}　共 ${x.totalDays} 天</div>
      <div style="height:8px;background:#eef2f6;border-radius:99px;overflow:hidden;margin:8px 0 4px">
        <div style="height:100%;width:${rate}%;background:var(--qq-grad);transition:width .3s"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>已坚持 ${x.doneDays || 0} 天</span><span>完成率 ${rate}%</span>
      </div>
      ${x.status !== 'done' ? `<button class="primary-btn" style="width:100%;margin-top:10px" onclick="doCheckin('${x.id}')">立即打卡</button>` : `<div class="subtle" style="text-align:center;margin-top:10px">🎉 已达成</div>`}
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="ghost-btn" style="flex:1" onclick="checkinForm={mode:'edit',id:'${x.id}'};renderCheckins()">编辑</button>
        <button class="danger-btn" style="flex:1" onclick="deleteCheckin('${x.id}')">删除</button>
      </div>
    </div>`;
  }).join('') : '<div class="card subtle">暂无打卡项目。</div>';

  let formHtml = '';
  if (checkinForm && checkinForm.mode === 'new') {
    formHtml = `<div class="card">
      <div class="label">项目名称</div>
      <input class="field" id="ck-name" placeholder="如 考研学习">
      <div class="grid2">
        <div><div class="label">开始</div><input class="field" id="ck-start" value="2026/1/1"></div>
        <div><div class="label">结束</div><input class="field" id="ck-end" value="2026/6/1"></div>
      </div>
      <div class="label">总天数</div>
      <input class="field" id="ck-total" type="number" value="150">
      <div class="grid2" style="margin-top:10px">
        <button class="primary-btn" onclick="submitNewCheckin()">创建</button>
        <button class="ghost-btn" onclick="checkinForm=null;renderCheckins()">取消</button>
      </div>
    </div>`;
  }

  c().innerHTML = `
    <div class="stack">
      <div class="profile-hero" style="background:var(--qq-grad);color:#fff;border-radius:var(--radius-lg);padding:18px 14px;box-shadow:var(--shadow)">
        <div style="font-size:20px;font-weight:900">打卡</div>
        <div style="font-size:12px;opacity:.9;margin-top:4px">已坚持 ${totalDone} 次打卡</div>
      </div>
      <div class="pill-row" style="justify-content:center;margin:2px 0">
        <span class="choice ${checkinTab==='doing'?'active':''}" onclick="checkinTab='doing';renderCheckins()">进行中</span>
        <span class="choice ${checkinTab==='done'?'active':''}" onclick="checkinTab='done';renderCheckins()">已完成</span>
        <span class="choice ${checkinTab==='undone'?'active':''}" onclick="checkinTab='undone';renderCheckins()">未完成</span>
      </div>
      ${list}${formHtml}
      ${checkinForm && checkinForm.mode === 'new' ? '' : `<button class="ghost-btn" style="width:100%" onclick="checkinForm={mode:'new'};renderCheckins()">＋ 新建打卡</button>`}
    </div>`;
}

function doCheckin(id) {
  const x = state.checkins.find(c => c.id === id);
  if (!x || x.status === 'done') return;
  x.doneDays = (x.doneDays || 0) + 1;
  if (x.doneDays >= x.totalDays) x.status = 'done';
  saveState();
  renderCheckins();
}
function deleteCheckin(id) {
  if (!confirm('删除该打卡项目？')) return;
  state.checkins = state.checkins.filter(c => c.id !== id);
  saveState();
  renderCheckins();
}
function submitNewCheckin() {
  const name = document.getElementById('ck-name').value.trim();
  const start = document.getElementById('ck-start').value.trim();
  const end = document.getElementById('ck-end').value.trim();
  const total = parseInt(document.getElementById('ck-total').value, 10) || 1;
  if (!name) { alert('请填写名称'); return; }
  state.checkins.push({ id: 'ck-' + Date.now(), name, start, end, totalDays: total, doneDays: 0, status: 'doing' });
  checkinForm = null;
  saveState();
  renderCheckins();
}
function submitEditCheckin(id) {
  const x = state.checkins.find(c => c.id === id);
  if (!x) return;
  const name = document.getElementById('ck-name').value.trim();
  const start = document.getElementById('ck-start').value.trim();
  const end = document.getElementById('ck-end').value.trim();
  const total = parseInt(document.getElementById('ck-total').value, 10) || 1;
  if (!name) { alert('请填写名称'); return; }
  x.name = name; x.start = start; x.end = end; x.totalDays = total;
  if (x.doneDays >= total) x.status = 'done'; else if (x.status === 'done') x.status = 'doing';
  checkinForm = null;
  saveState();
  renderCheckins();
}

function toggleHabit(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  const t = todayKey();
  if (h.done[t]) delete h.done[t];
  else h.done[t] = true;
  saveState();
  renderCheckins();
}
function addHabit() {
  const name = prompt('新习惯名称：', '新习惯');
  if (!name) return;
  state.habits.push({ id: 'h' + Date.now(), name: name.trim(), icon: '🎯', done: {} });
  saveState();
  renderCheckins();
}
function delHabit(id) {
  if (!confirm('删除这个习惯？历史记录会一起清掉。')) return;
  state.habits = state.habits.filter(x => x.id !== id);
  saveState();
  renderCheckins();
}

// ---------- 家园 ----------
function renderHome() {
  const mc = c();
  if (mc) { mc.style.padding = '0'; mc.style.height = '100%'; mc.style.overflow = 'hidden'; }
  const hdr = document.querySelector('.app-header');
  if (hdr) hdr.classList.add('hidden');
  const h = state.home || (state.home = { bg: '', person: '', personPos: { x: 50, y: 72 }, furniture: [], logs: [] });
  const furHtml = (h.furniture || []).map(f => `
    <div class="home-fur" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%;background-image:url('${escapeHTML(f.img || '')}')" onclick="openFurniture('${f.id}')">
      <span class="home-fur-name">${escapeHTML(f.name)}</span>
    </div>`).join('');
  const DEFAULT_PERSON = 'https://img.facfox.com/imgs/2026/07/19/ea51598f7d0459ee.jpg';
  c().innerHTML = `
    <div class="stack" style="height:100%;margin:0;padding:0">
      <div class="home-room">
        <div class="home-bg" style="background-image:url('${escapeHTML(h.bg || '')}')"></div>
        <div class="home-exit" onclick="closeApp()" title="退出">✕</div>
        <div class="home-log-btn" onclick="toggleHomeLog()" title="查看记录">📜</div>
        ${furHtml}
        <div id="homePerson" class="home-person" style="left:${h.personPos.x}%;top:${h.personPos.y}%;background-image:url('${escapeHTML(h.person || DEFAULT_PERSON)}')"></div>
        <div id="homePanel" class="home-panel" style="display:none">
          <div class="home-panel-head"><b id="homePanelTitle"></b><span onclick="closeHomePanel()" style="cursor:pointer;color:#9aa3af">✕</span></div>
          <div id="homePanelActions" class="home-panel-actions"></div>
          <div id="homePanelResult" class="home-panel-result"></div>
        </div>
        <div id="homeLogView" class="home-log-view">
          <div class="home-log-close" onclick="toggleHomeLog()">✕</div>
          <h2 class="section-title">📜 互动记录</h2>
          ${h.logs && h.logs.length ? h.logs.map(l => `<div class="card subtle" style="margin-bottom:8px;padding:10px 12px">· ${escapeHTML(l)}</div>`).join('') : '<div class="card subtle">还没有互动记录，点家具试试吧。</div>'}
        </div>
      </div>
    </div>`;
  const room = document.querySelector('.home-room');
  if (room) {
    room.onclick = function(ev) {
      if (ev.target === room || ev.target.classList.contains('home-bg')) {
        const box = room.querySelector('.tv-watch-box');
        if (box) box.remove();
      }
    };
  }
}

function toggleHomeLog() {
  const v = document.getElementById('homeLogView');
  if (v) v.classList.toggle('show');
}

function openFurniture(id) {
  const h = state.home; if (!h) return;
  const f = (h.furniture || []).find(x => x.id === id); if (!f) return;
  const panel = $('homePanel'); if (!panel) return;
  if (id === 'fur-tvcabinet' || id === 'fur-table' || id === 'fur-painting') return;
  if (h.personPos) {
    h.personPos.x = Math.min(92, Math.max(4, f.x + (f.w / 2) - 6));
    h.personPos.y = Math.min(82, Math.max(4, f.y + f.h - 12));
    const p = $('homePerson');
    if (p) { p.style.left = h.personPos.x + '%'; p.style.top = h.personPos.y + '%'; }
  }
  if (id === 'fur-tv') {
    closeHomePanel();
    const room = document.querySelector('.home-room');
    if (room) {
      const old = room.querySelector('.tv-watch-box');
      if (old) old.remove();
      const box = document.createElement('div');
      box.className = 'tv-watch-box';
      box.innerText = '📺 看电视';
      box.onclick = function(ev) { ev.stopPropagation(); box.remove(); };
      box.style.left = Math.max(1, f.x - 11) + '%';
      box.style.top = (f.y + f.h / 2 - 2) + '%';
      room.appendChild(box);
    }
    return;
  }
  if (id === 'fur-plant') {
    closeHomePanel();
    const room = document.querySelector('.home-room');
    if (room) {
      const old = room.querySelector('.tv-watch-box');
      if (old) old.remove();
      const box = document.createElement('div');
      box.className = 'tv-watch-box';
      box.innerText = '🪴 浇水';
      box.onclick = function(ev) { ev.stopPropagation(); plantWater(); };
      box.style.left = Math.max(1, f.x - 11) + '%';
      box.style.top = (f.y + f.h / 2 - 2) + '%';
      room.appendChild(box);
    }
    return;
  }
  $('homePanelTitle').innerText = f.name;
  $('homePanelResult').innerText = '';
  $('homePanelActions').innerHTML = (f.actions || []).map((a, i) =>
    `<button class="primary-btn" style="width:100%;margin-top:8px" onclick="doFurnitureAction('${f.id}', ${i})">${escapeHTML(a.label)}</button>`
  ).join('') || '<div class="subtle">这个家具还没有互动选项。</div>';
  panel.style.display = 'block';
}

function closeHomePanel() { const p = $('homePanel'); if (p) p.style.display = 'none'; }

function plantWater() {
  const room = document.querySelector('.home-room');
  if (room) { const b = room.querySelector('.tv-watch-box'); if (b) b.remove(); }
  doFurnitureAction('fur-plant', 0);
}

function doFurnitureAction(furnitureId, idx) {
  const h = state.home; if (!h) return;
  const f = (h.furniture || []).find(x => x.id === furnitureId); if (!f) return;
  const act = (f.actions || [])[idx]; if (!act) return;
  $('homePanelResult').innerText = act.result;
  const time = new Date().toLocaleString();
  h.logs = h.logs || [];
  h.logs.unshift(time + ' · ' + f.name + '：' + act.label);
  if (h.logs.length > 50) h.logs.length = 50;
  saveState();
}

// ---------- 日记 ----------
function renderDiary() {
  c().innerHTML = `
    <div class="stack">
      <div class="card">
        <h2 class="section-title">恋爱日记</h2>
        <input class="field" id="diaryTitle" placeholder="标题">
        <textarea class="textarea" id="diaryText" placeholder="今天发生了什么？" style="margin-top:8px"></textarea>
        <button class="primary-btn" style="width:100%;margin-top:8px" onclick="addDiary()">保存日记</button>
      </div>
      ${state.diary.map(d => `<div class="card"><b>${escapeHTML(d.title || '未命名')}</b><p>${escapeHTML(d.text)}</p><div class="subtle">${d.date}</div></div>`).join('') || '<div class="card subtle">还没有日记。</div>'}
    </div>`;
}
function addDiary() {
  const title = $('diaryTitle').value.trim();
  const text = $('diaryText').value.trim();
  if (!text) return alert('先写一点内容吧');
  state.diary.unshift({ id: Date.now(), title, text, date: new Date().toLocaleString() });
  saveState();
  renderDiary();
}

// ---------- 自习室 ----------
const COMPANION_LINES = {
  focusStart: ['我陪你一起专注，開始吧～', '加油，我就在这儿。', '这段時間交給我守著，你只管學。', '深呼吸，我們開始吧。'],
  focusDone: ['完成一個番茄啦，很棒！', '你看，堅持下來了吧～', '一個小目標達成，休息一下。', '我為你驕傲，真的。'],
  breakStart: ['休息一下，別盯著屏幕啦。', '去倒杯水，我幫你記著時間。', '伸個懶腰，我也陪你發呆。', '休息也是努力的一部分。'],
  idle: ['想學點什麼？我陪你。', '今天也要好好對待自己哦。', '隨時可以開始，我不催你。', '我在呢，放心。']
};

let studyTimer = null;

function renderStudy() {
  const m = Math.floor(state.study.seconds / 60).toString().padStart(2, '0');
  const s = (state.study.seconds % 60).toString().padStart(2, '0');
  const isFocus = state.study.mode === 'focus';
  const char = getRole(state.activeRoleId);
  const el = c();
  el.style.paddingBottom = '0';
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.background = '#fdf5e6';
  document.querySelector('.app-header').style.background = '#fdf5e6';
  el.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;background:#fdf5e6;padding:4px 0">
      <div style="text-align:center;flex-shrink:0">
        <div style="font-size:12px;color:#b8a99a;letter-spacing:1px">${isFocus ? '🍅 专注中' : '☕ 休息中'} · 第 ${state.study.round} 个番茄</div>
        <div style="font-size:48px;font-weight:300;margin:6px 0 4px;color:#5c4f42;letter-spacing:2px">${m}:${s}</div>
        ${isFocus ? `<input class="field" id="studySubject" value="${escapeHTML(state.study.subject)}" placeholder="学习科目" style="border-color:#e8ddd0;background:#faf6f0;color:#5c4f42;text-align:center">` : '<div style="font-size:13px;color:#b8a99a;padding:2px 0">喝口水，伸个懒腰～</div>'}
        <div class="grid3" style="margin-top:8px;gap:6px">
          ${isFocus
            ? `<button style="background:#f0e8de;color:#7a6b5c;border:none;border-radius:20px;padding:8px 0;font-size:13px;cursor:pointer" onclick="setStudyMinutes(25)">25分</button><button style="background:#f0e8de;color:#7a6b5c;border:none;border-radius:20px;padding:8px 0;font-size:13px;cursor:pointer" onclick="setStudyMinutes(45)">45分</button><button style="background:#f0e8de;color:#7a6b5c;border:none;border-radius:20px;padding:8px 0;font-size:13px;cursor:pointer" onclick="setStudyMinutes(15)">15分</button>`
            : `<button style="background:#f0e8de;color:#7a6b5c;border:none;border-radius:20px;padding:8px 0;font-size:13px;cursor:pointer" onclick="setBreak(5)">5分</button><button style="background:#f0e8de;color:#7a6b5c;border:none;border-radius:20px;padding:8px 0;font-size:13px;cursor:pointer" onclick="setBreak(10)">10分</button><button style="background:#f0e8de;color:#7a6b5c;border:none;border-radius:20px;padding:8px 0;font-size:13px;cursor:pointer" onclick="setBreak(15)">15分</button>`}
        </div>
        <div class="grid2" style="margin-top:10px;gap:8px">
          <button style="background:#d4c5b3;color:#fff;border:none;border-radius:20px;padding:10px 0;font-size:14px;cursor:pointer;font-weight:600" onclick="toggleStudy()">${state.study.running ? '暂停' : '开始'}</button>
          <button style="background:transparent;color:#b8a99a;border:1px solid #e0d5c8;border-radius:20px;padding:10px 0;font-size:13px;cursor:pointer" onclick="finishStudy(true)">结束</button>
        </div>
      </div>
      <div style="margin:14px 0 0;border-top:1px solid #e8ddd0"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 4px 6px;flex-shrink:0">
        <span style="font-size:13px;color:#b8a99a">🤗 角色陪伴</span>
        <div class="switch${state.study.companion ? ' on' : ''}" onclick="toggleCompanion()" style="flex-shrink:0"></div>
      </div>
      ${state.study.companion ? `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;padding:4px 0 12px">
        <div style="position:relative;width:120px;height:120px">
          <div style="position:absolute;top:-14px;right:0;background:#d4c5b3;color:#fff;border-radius:16px;padding:6px 12px;font-size:12px;line-height:1.4;max-width:160px;white-space:nowrap;z-index:1;box-shadow:0 2px 8px rgba(0,0,0,.06)">
            ${escapeHTML(state.study.companionMsg || '我在呢～')}
          </div>
          <div style="position:absolute;bottom:0;left:0;width:80px;height:80px;border-radius:50%;border:2px solid #e0d5c8;display:flex;align-items:center;justify-content:center;font-size:64px;line-height:1;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.04);background:#fff">${renderAvatar(char.avatar, char.name)}</div>
        </div>
      </div>` : '<div style="flex:1;display:flex;align-items:center;justify-content:center"><span style="color:#d0c5b8;font-size:12px">开启陪伴，让 TA 陪你学习</span></div>'}
    </div>`;
}

function setStudyMinutes(min) {
  state.study.running = false;
  clearInterval(studyTimer);
  state.study.mode = 'focus';
  state.study.target = min * 60;
  state.study.seconds = min * 60;
  saveState();
  renderStudy();
}
function setBreak(min) {
  state.study.running = false;
  clearInterval(studyTimer);
  state.study.mode = 'break';
  state.study.breakMin = min;
  state.study.target = min * 60;
  state.study.seconds = min * 60;
  saveState();
  renderStudy();
}
function toggleStudy() {
  if (state.study.mode === 'focus') state.study.subject = $('studySubject').value.trim() || '自习';
  state.study.running = !state.study.running;
  if (state.study.running) companionSay(state.study.mode === 'focus' ? 'focusStart' : 'breakStart');
  saveState();
  if (state.study.running) {
    clearInterval(studyTimer);
    studyTimer = setInterval(() => {
      state.study.seconds -= 1;
      if (state.study.seconds <= 0) {
        if (state.study.mode === 'focus') {
          state.study.records.unshift({ subject: state.study.subject, minutes: Math.round(state.study.target / 60), date: new Date().toLocaleString() });
          state.study.round += 1;
          state.study.mode = 'break';
          state.study.target = state.study.breakMin * 60;
          state.study.seconds = state.study.breakMin * 60;
          companionSay('focusDone');
          saveState();
          renderStudy();
        } else {
          clearInterval(studyTimer);
          state.study.running = false;
          state.study.mode = 'focus';
          state.study.target = 25 * 60;
          state.study.seconds = 25 * 60;
          companionSay('breakStart');
          saveState();
          renderStudy();
        }
      } else {
        renderStudy();
      }
    }, 1000);
  } else {
    clearInterval(studyTimer);
  }
  renderStudy();
}
function finishStudy(manual) {
  clearInterval(studyTimer);
  if (state.study.mode === 'focus') {
    const used = Math.max(1, Math.round((state.study.target - state.study.seconds) / 60));
    state.study.records.unshift({ subject: state.study.subject, minutes: manual ? used : Math.round(state.study.target / 60), date: new Date().toLocaleString() });
  }
  state.study.running = false;
  state.study.mode = 'focus';
  state.study.seconds = state.study.target = 25 * 60;
  saveState();
  renderStudy();
}
function companionSay(type) {
  if (!state.study.companion) return;
  const pool = COMPANION_LINES[type] || COMPANION_LINES.idle;
  const char = activeCharacter();
  const prefix = char && char.name && char.name !== '未命名角色' ? char.name + '：' : '';
  state.study.companionMsg = prefix + pool[Math.floor(Math.random() * pool.length)];
  saveState();
}
function toggleCompanion() {
  state.study.companion = !state.study.companion;
  if (state.study.companion && !state.study.companionMsg) companionSay('idle');
  saveState();
  renderStudy();
}
function refreshCompanion() {
  companionSay(state.study.running ? (state.study.mode === 'focus' ? 'focusStart' : 'breakStart') : 'idle');
  renderStudy();
}

// ---------- 养多肉 ----------
function plantMood(p) {
  const score = p.water + p.love;
  if (score < 40) return { icon: '🥀', text: '有点蔫了，多陪陪它吧' };
  if (score < 80) return { icon: '🌿', text: '状态还行，正在慢慢长' };
  if (score < 140) return { icon: '😊', text: '很开心，叶片胖乎乎的' };
  return { icon: '🌟', text: '爆棚状态！它是你的小太阳' };
}
function plantStage(p) {
  if (p.level >= 6) return '🌳';
  if (p.level >= 4) return '🌵';
  if (p.level >= 2) return '🪴';
  return '🌱';
}
function renderPlant() {
  const p = state.plant;
  const mood = plantMood(p);
  const stage = plantStage(p);
  const careToday = p.lastCare === todayKey();
  c().innerHTML = `
    <div class="stack">
      <div class="profile-hero" style="padding:18px 14px">
        <div style="font-size:72px;line-height:1">${stage}</div>
        <h2 style="margin:8px 0 2px">多肉 Lv.${p.level}</h2>
        <div class="subtle" style="color:rgba(255,255,255,.9)">${mood.icon} ${mood.text}</div>
        ${p.streak > 0 ? `<div class="wallet-pill">🔥 连续照顾 ${p.streak} 天</div>` : ''}
      </div>
      <div class="card">
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>💧 水分</span><b>${Math.round(p.water)}%</b></div>
          <div style="height:8px;background:#eef2f6;border-radius:6px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${Math.min(100, p.water)}%;background:linear-gradient(90deg,#4fc3f7,#1d6fb8)"></div></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>💗 喜爱</span><b>${Math.round(p.love)}</b></div>
          <div style="height:8px;background:#eef2f6;border-radius:6px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${Math.min(100, p.love)}%;background:linear-gradient(90deg,#ff8a9b,#ff4d6d)"></div></div>
        </div>
      </div>
      <div class="grid3">
        <button class="primary-btn" onclick="waterPlant()">💧 浇水</button>
        <button class="ghost-btn" onclick="touchPlant()">🤚 摸摸</button>
        <button class="ghost-btn" onclick="fertilizePlant()">🌟 施肥</button>
      </div>
      <div class="card subtle">每天第一次浇水加成更高。打卡、摸摸、施肥都会增加喜爱值。${careToday ? '今天已照顾过啦 🎉' : '今天还没照顾它哦～'}</div>
      ${p.logs.length ? `<div class="card"><h2 class="section-title">📜 植物手账</h2><div style="max-height:240px;overflow-y:auto">${p.logs.map(l => `<div class="list-card" style="padding:9px 12px"><div style="flex:1;min-width:0"><b>${l.act}</b><div class="subtle">${l.date}</div></div></div>`).join('')}</div></div>` : '<div class="card subtle">还没有互动记录，开始照顾它吧～</div>'}
    </div>`;
}
function bumpStreak() {
  const today = todayKey();
  const p = state.plant;
  if (p.lastCare === today) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yKey = y.toISOString().slice(0, 10);
  p.streak = (p.lastCare === yKey) ? (p.streak + 1) : 1;
  p.lastCare = today;
}
function pushLog(act) {
  state.plant.logs.unshift({ act, date: new Date().toLocaleString() });
  if (state.plant.logs.length > 50) state.plant.logs.length = 50;
}
function waterPlant() {
  const today = todayKey();
  const p = state.plant;
  p.water = Math.min(100, p.water + (p.lastWater === today ? 10 : 28));
  p.lastWater = today;
  p.love += 2;
  bumpStreak();
  pushLog('💧 浇了水');
  growPlant();
  saveState();
  renderPlant();
}
function touchPlant() {
  state.plant.love += 3;
  bumpStreak();
  pushLog('🤚 摸了摸');
  growPlant();
  saveState();
  renderPlant();
}
function fertilizePlant() {
  const today = todayKey();
  const p = state.plant;
  if (p.fertilizedDate === today) return alert('今天已经施过肥啦，明天再来～');
  p.fertilizedDate = today;
  p.love += 8;
  bumpStreak();
  pushLog('🌟 施了肥');
  growPlant();
  saveState();
  renderPlant();
}
function growPlant() {
  state.plant.level = Math.max(state.plant.level, Math.floor((state.plant.water + state.plant.love) / 45));
}

// ---------- 账本 ----------
let ledgerMonth = todayKey().slice(0, 7);
let ledgerFilter = '';
const LEDGER_CATS = ['餐饮','交通','购物','居住','娱乐','工资','其他'];
const LEDGER_ICONS = { '餐饮':'🍜','交通':'🚌','购物':'🛍','居住':'🏠','娱乐':'🎮','工资':'💰','其他':'📌' };

function renderLedger() {
  const monthItems = state.ledger.filter(x => (x.date || '').slice(0, 7) === ledgerMonth);
  const filtered = ledgerFilter
    ? monthItems.filter(x => (x.note || '').includes(ledgerFilter) || (x.category || '其他').includes(ledgerFilter))
    : monthItems;
  const income = monthItems.filter(x => x.amount >= 0).reduce((s, x) => s + Number(x.amount), 0);
  const expense = monthItems.filter(x => x.amount < 0).reduce((s, x) => s + Number(x.amount), 0);
  const total = state.ledger.reduce((sum, x) => sum + Number(x.amount), 0);
  c().innerHTML = `
    <div class="stack">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <h2 class="section-title" style="margin:0">账本</h2>
          <div>
            <button class="icon-btn" onclick="changeLedgerMonth(-1)">◀</button>
            <span class="subtle">${ledgerMonth}</span>
            <button class="icon-btn" onclick="changeLedgerMonth(1)">▶</button>
          </div>
        </div>
        <div class="grid2" style="margin-top:10px">
          <div><div class="subtle">收入</div><b style="color:#18a058">￥${yuan(income)}</b></div>
          <div><div class="subtle">支出</div><b style="color:#e53935">￥${yuan(expense)}</b></div>
        </div>
        <div class="metric" style="margin-top:8px"><span class="subtle">本月结余</span><b>￥${yuan(income + expense)}</b></div>
        <div class="metric"><span class="subtle">累计总额</span><b>￥${yuan(total)}</b></div>
      </div>
      <div class="card">
        <div class="grid2">
          <input class="field" id="ledgerAmount" type="number" placeholder="金额">
          <input class="field" id="ledgerNote" placeholder="备注">
        </div>
        <select id="ledgerCat" class="field" style="margin-top:8px">
          ${LEDGER_CATS.map(c => `<option value="${c}">${LEDGER_ICONS[c]} ${c}</option>`).join('')}
        </select>
        <div class="grid2" style="margin-top:8px">
          <button class="ghost-btn" onclick="addLedger(false)">支出</button>
          <button class="primary-btn" onclick="addLedger(true)">收入</button>
        </div>
      </div>
      <input class="field" style="margin-top:8px" placeholder="搜索备注或分类" value="${escapeHTML(ledgerFilter)}" oninput="ledgerFilter=this.value;renderLedger()">
      ${filtered.map(x => `<div class="list-card">
        <b style="color:${x.amount >= 0 ? '#18a058' : '#e53935'}">${x.amount >= 0 ? '+' : ''}${yuan(x.amount)}</b>
        <div style="flex:1;min-width:0" onclick="editLedger('${x.id}')">
          <b>${escapeHTML(x.note || '未备注')}</b>
          <div class="subtle">${LEDGER_ICONS[x.category] || '📌'} ${escapeHTML(x.category || '其他')} · ${x.date}</div>
        </div>
        <button class="icon-btn" style="font-size:12px" onclick="deleteLedger('${x.id}')">✕</button>
      </div>`).join('') || '<div class="card subtle">本月暂无账目。</div>'}
    </div>`;
}
function changeLedgerMonth(diff) {
  let [y, m] = ledgerMonth.split('-').map(Number);
  m += diff;
  if (m < 1) { m = 12; y--; }
  if (m > 12) { m = 1; y++; }
  ledgerMonth = `${y}-${String(m).padStart(2, '0')}`;
  renderLedger();
}
function addLedger(isIncome, note, cat, date) {
  let amount = Math.abs(Number($('ledgerAmount').value || 0));
  if (!isIncome && note === undefined && cat === undefined) {
  if (!amount) return alert('请输入金额');
  }
  const useAmount = (note !== undefined) ? (isIncome ? amount : -amount) : (isIncome ? amount : -amount);
  const useNote = note !== undefined ? note : ($('ledgerNote').value.trim() || '未备注');
  const useCat = cat !== undefined ? cat : ($('ledgerCat').value || '其他');
  state.ledger.unshift({ id: 'l' + Date.now(), amount: useAmount, note: useNote, category: useCat, date: date || todayKey() });
  state.profile.wallet += useAmount;
  saveState();
  renderLedger();
  return { amount: useAmount };
}
function addLedgerQuick(amount, note, notice) {
  if (notice !== false) notice = true;
  const cat = amount >= 0 ? '工资' : '其他';
  state.ledger.unshift({ id: 'lq' + Date.now(), amount, note: note || '', category: cat, date: todayKey() });
  state.profile.wallet += amount;
  saveState();
  if (notice) quickNotice('已记到账本：' + note);
}
function deleteLedger(id) {
  if (!confirm('删除这笔账目？')) return;
  const item = state.ledger.find(x => x.id === id);
  if (item) state.profile.wallet -= Number(item.amount);
  state.ledger = state.ledger.filter(x => x.id !== id);
  saveState();
  renderLedger();
}
function editLedger(id) {
  const item = state.ledger.find(x => x.id === id);
  if (!item) return;
  const note = prompt('备注：', item.note);
  if (note === null) return;
  const cat = prompt('分类（餐饮/交通/购物/居住/娱乐/工资/其他）：', item.category || '其他');
  if (cat !== null) { item.note = note.trim(); item.category = cat.trim() || '其他'; saveState(); renderLedger(); }
}

// ---------- 涂鸦 ----------
let doodleBg = null;
let doodleHistory = [];
let doodleHistoryIndex = -1;
const DOODLE_MAX_HISTORY = 30;

function renderDoodle() {
  doodleBg = null;
  doodleHistory = [];
  doodleHistoryIndex = -1;
  c().innerHTML = `
  <div class="draw-tools">
    <input type="color" id="drawColor" value="#00a8ff">
    <input type="range" id="drawSize" min="2" max="20" value="6">
    <input type="file" id="doodleBgFile" accept="image/*" style="display:none" onchange="uploadDoodleBg(event)">
    <button class="ghost-btn" onclick="$('doodleBgFile').click()">🖼 上传底图</button>
    <button class="ghost-btn" onclick="undoDoodle()">↩ 撤销</button>
    <button class="ghost-btn" onclick="clearCanvas()">🗑 清空</button>
    <button class="primary-btn" onclick="saveDoodle()">💾 保存</button>
  </div>
  <canvas id="drawCanvas" width="686" height="720"></canvas>
  <div class="subtle" style="margin-top:10px">已保存 ${state.doodles.length} 张涂鸦。保存时会自动存入相册「涂鸦板」。</div>`;
  initCanvas();
}
function uploadDoodleBg(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  compressPhoto(file).then(d => { doodleBg = d; initCanvas(); }).catch(err => alert('读取失败：' + err.message));
  event.target.value = '';
}
function initCanvas() {
  const canvas = $('drawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (doodleBg) {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); saveDoodleHistory(); };
    img.src = doodleBg;
  } else {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveDoodleHistory();
  }
  let drawing = false;
  let lastX = 0, lastY = 0;
  const pos = e => {
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * canvas.width / r.width, y: (p.clientY - r.top) * canvas.height / r.height };
  };
  const start = e => {
    drawing = true;
    const p = pos(e);
    lastX = p.x; lastY = p.y;
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = $('drawColor').value;
    ctx.lineWidth = $('drawSize').value;
    e.preventDefault();
  };
  const move = e => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = $('drawColor').value;
    ctx.lineWidth = $('drawSize').value;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();
    lastX = p.x; lastY = p.y;
    e.preventDefault();
  };
  const end = () => {
    if (drawing) { drawing = false; saveDoodleHistory(); }
  };
  canvas.onmousedown = start; canvas.onmousemove = move; canvas.onmouseup = end; canvas.onmouseleave = end;
  canvas.ontouchstart = start; canvas.ontouchmove = move; canvas.ontouchend = end;
}
function saveDoodleHistory() {
  const canvas = $('drawCanvas');
  if (!canvas) return;
  const data = canvas.toDataURL('image/png');
  doodleHistoryIndex++;
  doodleHistory = doodleHistory.slice(0, doodleHistoryIndex);
  doodleHistory.push(data);
  if (doodleHistory.length > DOODLE_MAX_HISTORY) { doodleHistory.shift(); doodleHistoryIndex--; }
}
function undoDoodle() {
  if (doodleHistoryIndex > 0) {
    doodleHistoryIndex--;
    const canvas = $('drawCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src = doodleHistory[doodleHistoryIndex];
  } else if (doodleHistoryIndex === 0) {
    doodleHistoryIndex = -1;
    const canvas = $('drawCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
function clearCanvas() {
  doodleBg = null;
  const canvas = $('drawCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveDoodleHistory();
}
function saveDoodle() {
  try {
    const data = $('drawCanvas').toDataURL('image/png');
    state.doodles.unshift(data);
    let folder = state.albums.find(a => a.name === '涂鸦板');
    if (!folder) { folder = { id: 'a_doodle', name: '涂鸦板', photos: [] }; state.albums.push(folder); }
    folder.photos.unshift({ id: 'p' + Date.now(), url: data, caption: '涂鸦 ' + new Date().toLocaleDateString(), date: new Date().toLocaleDateString() });
    saveState();
    alert('涂鸦已保存，并存入相册「涂鸦板」。');
  } catch (err) {
    alert('保存失败：画布可能包含跨域图片，请重试或清空后保存。');
  }
}

// ---------- 音乐 ----------
let audioEl = null;
let currentMusicId = null;

function renderMusic() {
  const demoSongs = ['晴天碎片','晚风便利店','心跳练习曲','月亮来信'];
  const cur = state.music.find(x => x.id === currentMusicId);
  const wave = (active) => `<div style="display:flex;gap:2px;align-items:flex-end;height:22px;margin-right:4px;opacity:${active ? 1 : .5}">
    ${[6,12,8,16,10,14].map(h => `<span style="width:3px;height:${h}px;background:${active ? 'var(--qq-blue)' : '#aab2bd'};border-radius:2px;display:block"></span>`).join('')}</div>`;
  c().innerHTML = `
    <div class="stack">
      <div class="card" style="background:var(--qq-grad);color:#fff;text-align:center;padding:22px 16px">
        <div style="font-size:40px">🎧</div>
        <h2 style="margin:6px 0 2px;color:#fff">我的音乐库</h2>
        <p style="margin:0;opacity:.85;font-size:12px">${state.music.length} 首上传 · 4 首内置演示</p>
        <input type="file" id="musicFile" accept="audio/*" style="display:none" onchange="uploadMusic(event)">
        <button class="ghost-btn" style="margin-top:12px;background:rgba(255,255,255,.2);color:#fff" onclick="$('musicFile').click()">＋ 上传本地音乐</button>
      </div>
      ${state.music.length ? `<div class="subtle" style="margin:14px 4px 2px;font-weight:800">我的音乐</div>` : '<div class="card subtle" style="text-align:center">还没有上传音乐，点上面按钮添加。</div>'}
      ${state.music.map(m => `
        <div class="list-card" style="${m.id === currentMusicId ? 'border-left:3px solid var(--qq-blue)' : ''}">
          ${wave(m.id === currentMusicId)}
          <button class="icon-btn" style="${m.id === currentMusicId ? 'background:var(--qq-blue);color:#fff' : ''}" onclick="playMusic('${m.id}')">${m.id === currentMusicId ? '❚❚' : '▶'}</button>
          <div style="flex:1;min-width:0" onclick="playMusic('${m.id}')">
            <b>${escapeHTML(m.name)}</b>
            <div class="subtle">${m.date || '本地音频'}</div>
          </div>
          <button class="icon-btn" style="font-size:13px" onclick="renameMusic('${m.id}')">✎</button>
          <button class="icon-btn" style="font-size:13px" onclick="deleteMusic('${m.id}')">✕</button>
        </div>`).join('')}
      <div class="subtle" style="margin:18px 4px 2px;font-weight:800">🎹 内置合成演示曲</div>
      ${demoSongs.map((name, i) => `
        <div class="list-card" onclick="playTone(${i})">
          ${wave(false)}
          <button class="icon-btn">▶</button>
          <div style="flex:1;min-width:0">
            <b>${name}</b>
            <div class="subtle">${90 + i * 12} BPM · 合成音</div>
          </div>
        </div>`).join('')}
    </div>
    <div id="miniPlayer" style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);box-shadow:0 -4px 16px rgba(17,24,39,.08);padding:10px 14px;display:${cur ? 'flex' : 'none'};align-items:center;gap:10px;z-index:900">
      <div style="font-size:22px">🎵</div>
      <div style="flex:1;min-width:0">
        <b style="font-size:13px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cur ? escapeHTML(cur.name) : ''}</b>
        <div class="subtle" style="font-size:11px">正在播放</div>
      </div>
      <button class="icon-btn" onclick="stopMusic()">⏹</button>
    </div>
    <audio id="musicPlayer" style="display:none"></audio>`;
}
function stopMusic() {
  currentMusicId = null;
  if (audioEl) { audioEl.pause(); audioEl.src = ''; }
  renderMusic();
}
function uploadMusic(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('audio/')) return alert('请选择音频文件');
  const reader = new FileReader();
  reader.onload = () => {
    const name = prompt('歌曲命名：', file.name.replace(/\.[^.]+$/, ''));
    if (name === null) return;
    const id = 'm' + Date.now();
    putMusicBlob(id, reader.result).then(() => {
      state.music.unshift({ id, name: name.trim() || file.name, date: new Date().toLocaleDateString() });
      saveState(); renderMusic();
    }).catch(() => alert('音频存储失败（IndexedDB 不可用）'));
  };
  reader.onerror = () => alert('读取失败');
  reader.readAsDataURL(file);
  event.target.value = '';
}
async function playMusic(id) {
  const m = state.music.find(x => x.id === id); if (!m) return;
  const url = await getMusicBlob(id);
  if (!url) return alert('音频数据丢失');
  if (!audioEl) audioEl = $('musicPlayer');
  if (currentMusicId === id && audioEl.src === url) { audioEl.pause(); currentMusicId = null; renderMusic(); return; }
  audioEl.src = url;
  audioEl.style.display = 'none';
  currentMusicId = id;
  renderMusic();
  audioEl.play().catch(() => alert('播放失败，浏览器可能限制了自动播放'));
}
function renameMusic(id) {
  const m = state.music.find(x => x.id === id); if (!m) return;
  const name = prompt('歌曲命名：', m.name);
  if (name) { m.name = name.trim(); saveState(); renderMusic(); }
}
async function deleteMusic(id) {
  if (!confirm('删除这首音乐？')) return;
  state.music = state.music.filter(x => x.id !== id);
  await deleteMusicBlob(id);
  saveState(); renderMusic();
}
function playTone(i) {
  let audioCtx = window._audioCtx;
  if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); window._audioCtx = audioCtx; }
  const now = audioCtx.currentTime;
  [0, 3, 7, 12].forEach((step, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 220 * Math.pow(2, (i * 2 + step) / 12);
    gain.gain.setValueAtTime(0.0001, now + idx * .18);
    gain.gain.exponentialRampToValueAtTime(0.12, now + idx * .18 + .02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * .18 + .16);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + idx * .18);
    osc.stop(now + idx * .18 + .18);
  });
}

// ---------- 啵啵 ----------
function renderKiss() {
  c().innerHTML = `
    <div class="card" style="text-align:center">
      <div style="font-size:76px">💋</div>
      <h2>啵啵间</h2>
      <p>累计 ${state.space.kisses} 个啵啵</p>
      <button class="primary-btn" style="width:100%" onclick="addKiss()">啵一下</button>
    </div>`;
}
function addKiss() { state.space.kisses++; saveState(); renderKiss(); }

// ---------- 相册 ----------
let currentAlbumId = null;

function renderAlbum() {
  if (currentAlbumId) return renderAlbumPhotos(currentAlbumId);
  const albums = state.albums;
  c().innerHTML = `
    <div class="stack">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <h2 class="section-title" style="margin:0">🖼 相册（${albums.length}）</h2>
        <button class="icon-btn" style="width:34px;height:34px;font-size:20px;background:var(--qq-grad);color:#fff;border-radius:50%" onclick="newAlbum()">＋</button>
      </div>
      <div class="album-grid">
        ${albums.map(a => `
          <div class="photo-tile" onclick="openAlbum('${a.id}')">
            ${a.photos.length ? `<img src="${escapeHTML(a.photos[0].url)}" alt="">` : `<div style="height:100%;display:grid;place-items:center;font-size:40px;background:rgba(0,0,0,.05)">📁</div>`}
            <button class="icon-btn" style="position:absolute;top:6px;right:6px;width:26px;height:26px;font-size:12px;background:rgba(255,255,255,.85)" onclick="event.stopPropagation();renameAlbum('${a.id}')">✎</button>
            <button class="icon-btn" style="position:absolute;top:6px;right:38px;width:26px;height:26px;font-size:12px;background:rgba(255,255,255,.85)" onclick="event.stopPropagation();delAlbum('${a.id}')">✕</button>
            <p>${escapeHTML(a.name)}<br><span class="subtle">${a.photos.length} 张</span></p>
          </div>`).join('')}
      </div>
      ${albums.length === 0 ? `<div class="card subtle" style="text-align:center">还没有相册夹，点右上角 ＋ 新建</div>` : ''}
    </div>`;
}
function openAlbum(id) { currentAlbumId = id; renderAlbum(); }
function newAlbum() {
  const name = prompt('相册夹名称：');
  if (!name) return;
  state.albums.push({ id: 'a' + Date.now(), name: name.trim(), photos: [] });
  saveState(); renderAlbum();
}
function renameAlbum(id) {
  const a = state.albums.find(x => x.id === id); if (!a) return;
  const name = prompt('重命名相册夹：', a.name);
  if (name) { a.name = name.trim(); saveState(); renderAlbum(); }
}
function delAlbum(id) {
  if (!confirm('删除该相册夹及其所有照片？')) return;
  state.albums = state.albums.filter(x => x.id !== id);
  if (currentAlbumId === id) currentAlbumId = null;
  saveState(); renderAlbum();
}
function renderAlbumPhotos(id) {
  const a = state.albums.find(x => x.id === id); if (!a) return;
  c().innerHTML = `
    <div class="stack">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <button class="ghost-btn" onclick="currentAlbumId=null;renderAlbum()">← 返回</button>
        <h2 class="section-title" style="margin:0">${escapeHTML(a.name)}（${a.photos.length}）</h2>
        <button class="icon-btn" style="width:34px;height:34px;font-size:20px;background:var(--qq-grad);color:#fff;border-radius:50%" onclick="toggleAlbumUpload()">＋</button>
      </div>
      <div id="albumUpload" style="display:none" class="card">
        <input class="field" id="photoUrl" placeholder="图片 URL（可选）">
        <input class="field" id="photoCaption" placeholder="照片命名（可选）" style="margin-top:8px">
        <input type="file" id="photoFile" accept="image/*" style="display:none" onchange="uploadPhoto(event)">
        <div class="grid2" style="margin-top:8px">
          <button class="ghost-btn" onclick="$('photoFile').click()">📁 本地选图</button>
          <button class="ghost-btn" onclick="capturePhoto()">📷 拍照</button>
          <button class="primary-btn" onclick="addPhoto()">添加</button>
        </div>
      </div>
      <div class="album-grid">
        ${a.photos.map((p, i) => `
          <div class="photo-tile">
            <img src="${escapeHTML(p.url)}" alt="" onclick="viewPhoto('${encodeURIComponent(p.url)}')">
            <button class="icon-btn" style="position:absolute;top:6px;right:6px;width:26px;height:26px;font-size:12px;background:rgba(255,255,255,.85)" onclick="event.stopPropagation();renamePhoto('${a.id}',${i})">✎</button>
            <button class="icon-btn" style="position:absolute;top:6px;right:38px;width:26px;height:26px;font-size:12px;background:rgba(255,255,255,.85)" onclick="event.stopPropagation();copyPhoto('${a.id}',${i})">⧉</button>
            <button class="icon-btn" style="position:absolute;top:6px;right:70px;width:26px;height:26px;font-size:12px;background:rgba(255,255,255,.85)" onclick="event.stopPropagation();movePhoto('${a.id}',${i})">➡</button>
            <button class="icon-btn" style="position:absolute;top:6px;right:102px;width:26px;height:26px;font-size:12px;background:rgba(255,255,255,.85)" onclick="event.stopPropagation();deletePhoto('${a.id}',${i})">✕</button>
            <p>${escapeHTML(p.caption || '照片')}${p.date ? `<br><span class="subtle">${p.date}</span>` : ''}</p>
          </div>`).join('')}
      </div>
      ${a.photos.length === 0 ? `<div class="card subtle" style="text-align:center">还没有照片，点右上角 ＋ 添加或拍照</div>` : ''}
    </div>
    <div id="photoOverlay" onclick="this.style.display='none'" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.82);z-index:2000;place-items:center;padding:20px">
      <img id="photoOverlayImg" src="" style="max-width:100%;max-height:80%;border-radius:14px">
    </div>`;
}
function toggleAlbumUpload() {
  const box = $('albumUpload');
  if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
function addPhoto() {
  const url = $('photoUrl').value.trim();
  if (!url) return alert('请先粘贴图片 URL，或点「本地选图 / 拍照」');
  const a = state.albums.find(x => x.id === currentAlbumId);
  a.photos.unshift({ id: 'p' + Date.now(), url, caption: $('photoCaption').value.trim(), date: new Date().toLocaleDateString() });
  saveState(); renderAlbum();
}
function uploadPhoto(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return alert('请选择图片文件');
  compressPhoto(file).then(dataUrl => {
    const a = state.albums.find(x => x.id === currentAlbumId);
    a.photos.unshift({ id: 'p' + Date.now(), url: dataUrl, caption: $('photoCaption').value.trim(), date: new Date().toLocaleDateString() });
    saveState(); renderAlbum();
  }).catch(err => alert('读取失败：' + err.message));
  event.target.value = '';
}
function capturePhoto() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    compressPhoto(f).then(d => {
      const a = state.albums.find(x => x.id === currentAlbumId);
      a.photos.unshift({ id: 'p' + Date.now(), url: d, caption: $('photoCaption').value.trim(), date: new Date().toLocaleDateString() });
      saveState(); renderAlbum();
    }).catch(err => alert('读取失败：' + err.message));
  };
  inp.click();
}
function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('无法读取'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片格式不支持'));
      img.onload = () => {
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function deletePhoto(albumId, idx) {
  const a = state.albums.find(x => x.id === albumId); if (!a || !a.photos[idx]) return;
  if (!confirm('删除这张照片？')) return;
  a.photos.splice(idx, 1);
  saveState(); renderAlbum();
}
function renamePhoto(albumId, idx) {
  const a = state.albums.find(x => x.id === albumId); if (!a || !a.photos[idx]) return;
  const name = prompt('照片命名：', a.photos[idx].caption);
  if (name !== null) { a.photos[idx].caption = name.trim(); saveState(); renderAlbum(); }
}
function copyPhoto(albumId, idx) {
  const a = state.albums.find(x => x.id === albumId); if (!a || !a.photos[idx]) return;
  const target = prompt('复制到哪个相册夹？（输入名称，不存在将新建）', a.name);
  if (!target) return;
  let t = state.albums.find(x => x.name === target.trim());
  if (!t) { t = { id: 'a' + Date.now(), name: target.trim(), photos: [] }; state.albums.push(t); }
  t.photos.unshift(Object.assign({}, a.photos[idx], { id: 'p' + Date.now() }));
  saveState(); renderAlbum();
}
function movePhoto(albumId, idx) {
  const a = state.albums.find(x => x.id === albumId); if (!a || !a.photos[idx]) return;
  const target = prompt('移动到哪个相册夹？（输入名称）', a.name);
  if (!target) return;
  let t = state.albums.find(x => x.name === target.trim());
  if (!t) { t = { id: 'a' + Date.now(), name: target.trim(), photos: [] }; state.albums.push(t); }
  t.photos.unshift(a.photos.splice(idx, 1)[0]);
  saveState(); renderAlbum();
}
function viewPhoto(enc) {
  const overlay = $('photoOverlay');
  if (!overlay) return;
  $('photoOverlayImg').src = decodeURIComponent(enc);
  overlay.style.display = 'grid';
}

// ---------- 塔罗牌 ----------
const TAROT_DECK = [
  ['愚人', '新的开始，带着天真与勇气去冒险。', '盲目冲动，缺乏计划，可能错失方向。'],
  ['魔术师', '你拥有实现想法的一切资源与能力。', '潜力未发挥，或被欺骗、操纵。'],
  ['女祭司', '直觉正在给你答案，静下来听。', '忽视内心声音，秘密尚未明朗。'],
  ['皇后', '丰盛、滋养与创造力围绕你。', '依赖过度，或忽略自我照顾。'],
  ['皇帝', '秩序与掌控，用理性推进目标。', '固执专断，或被规则束缚。'],
  ['教皇', '传统与指引，向可信的人求教。', '墨守成规，或盲从权威。'],
  ['恋人', '重要关系需要一次真诚表达。', '关系失衡，错误选择或疏离。'],
  ['战车', '凭意志突破阻碍，向前冲。', '失控冲突，方向分散难前进。'],
  ['力量', '温柔也是很强的力量。', '自我怀疑，情绪压过理性。'],
  ['隐者', '独处反思，寻找内在光亮。', '孤立逃避，过度封闭自我。'],
  ['命运之轮', '转机到来，顺应变化即可。', '突变失控，陷入周期低谷。'],
  ['正义', '因果清晰，公平会回到你身边。', '偏差不公，需承担过往后果。'],
  ['倒吊人', '换视角看问题，暂停才有收获。', '无谓牺牲，或固执不肯放手。'],
  ['死神', '结束即新生，放下才能重来。', '抗拒改变，陷在旧局里。'],
  ['节制', '平衡与调和，耐心最可贵。', '失衡极端，或缺乏节奏感。'],
  ['恶魔', '看清束缚你的执念与诱惑。', '被欲望困住，难以挣脱。'],
  ['塔', '突发的崩塌，打破虚假安稳。', '危机后重建，余震未平。'],
  ['星星', '慢慢来，你正在靠近想要的答案。', '希望模糊，信心不足。'],
  ['月亮', '迷雾中的直觉，辨清幻象与真实。', '迷惑不安，隐藏的恐惧浮现。'],
  ['太阳', '今天适合把心事说亮一点。', '暂时黯淡，但光仍在身后。'],
  ['审判', '唤醒与召唤，是复盘的时刻了。', '逃避评判，错失觉醒机会。'],
  ['世界', '一个小阶段正在圆满收尾。', '未竟全功，循环尚未闭合。']
];
const MINOR_DECK = [
  ['权杖A', '新行动起点，充满动力。', '拖延受阻，行动力被卡。'],
  ['权杖2', '面临选择，权衡下一步。', '犹豫不决，错失时机。'],
  ['权杖3', '合作扩展，向外探索。', '进展停滞，计划难落地。'],
  ['权杖4', '稳定安顿，短暂庆祝。', '僵化停滞，缺乏变化。'],
  ['权杖5', '竞争冲突，试图突围。', '内耗混乱，无谓争执。'],
  ['权杖6', '公开胜利，获得认可。', '虚荣浮夸，认可不持久。'],
  ['权杖7', '防守阵地，抵御压力。', '力不从心，防线将破。'],
  ['权杖8', '快速推进，消息传来。', '节奏失控，忙中出错。'],
  ['权杖9', '警惕戒备，接近尾声。', '过度防备，身心疲惫。'],
  ['权杖10', '负重前行，责任压身。', '不堪重负，该卸下了。'],
  ['权杖侍从', '热情学习，跃跃欲试。', '浮躁不定，缺乏耐心。'],
  ['权杖骑士', '迅猛行动，直冲目标。', '冲动鲁莽，方向跑偏。'],
  ['权杖王后', '自信耀眼，主动掌控。', '独断强势，忽略他人。'],
  ['权杖国王', '领袖气场，推动大局。', '专横失控，滥用权威。'],
  ['圣杯A', '爱与新感情涌现。', '情感干涸，封闭内心。'],
  ['圣杯2', '平等联结，双向奔赴。', '失衡疏离，关系不对等。'],
  ['圣杯3', '欢聚庆祝，友情滋润。', '过度享乐，虚假热闹。'],
  ['圣杯4', '冷淡观望，不满足。', '错失机会，故步自封。'],
  ['圣杯5', '失落遗憾，盯着失去。', '沉溺悲伤，忽略尚存。'],
  ['圣杯6', '怀旧安稳，旧情回归。', '依赖过去，不愿成长。'],
  ['圣杯7', '幻想纷杂，选择太多。', '空想不落，误导自己。'],
  ['圣杯8', '失望离开，寻更真意。', '逃避现实，半途而废。'],
  ['圣杯9', '愿望满足，独享喜悦。', '自满孤立，拒绝分享。'],
  ['圣杯10', '和睦圆满，家庭温暖。', '表面和谐，内在疏离。'],
  ['圣杯侍从', '温柔好奇，感受细腻。', '情绪化，不够成熟。'],
  ['圣杯骑士', '浪漫主动，以情动人。', '优柔寡断，仅为表面。'],
  ['圣杯王后', '包容共情，温柔滋养。', '过度迁就，失去自我。'],
  ['圣杯国王', '情商在线，从容疏导。', '情绪操控，不够真诚。'],
  ['宝剑A', '清晰洞见，一剑破局。', '锋利伤己，言语刺人。'],
  ['宝剑2', '两难平衡，暂不做决。', '逃避选择，内心纠结。'],
  ['宝剑3', '心伤刺痛，直面裂痕。', '反复咀嚼，难以释怀。'],
  ['宝剑4', '休整暂停，恢复状态。', '消极退缩，不愿面对。'],
  ['宝剑5', '小胜代价，关系受损。', '争赢失和，得不偿失。'],
  ['宝剑6', '平稳过渡，慢慢疗愈。', '勉强前行，旧伤未愈。'],
  ['宝剑7', '暗中小算，低调应对。', '自欺欺人，终被看穿。'],
  ['宝剑8', '自我设限，看不清路。', '困于执念，画地为牢。'],
  ['宝剑9', '焦虑夜醒，过度担忧。', '内耗恐惧，吓自己。'],
  ['宝剑10', '彻底终结，最痛一刻。', '谷底已至，触底反弹。'],
  ['宝剑侍从', '机敏求知，留意信息。', '浮躁多疑，不够沉稳。'],
  ['宝剑骑士', '快速决断，直来直去。', '急躁冲动，言语伤人。'],
  ['宝剑王后', '客观冷静，明察秋毫。', '冷酷疏离，过度挑剔。'],
  ['宝剑国王', '理性权威，公正裁断。', '严苛冷硬，缺乏温度。'],
  ['星币A', '新资源入账，踏实起步。', '错失机会，基础不稳。'],
  ['星币2', '平衡收支，灵活周转。', '顾此失彼，混乱失重。'],
  ['星币3', '协作积累，技艺成长。', '配合失调，进度拖沓。'],
  ['星币4', '守住成果，谨慎持有。', '吝啬僵化，不敢流动。'],
  ['星币5', '资源紧缺，困境求生。', '孤立无援，忽视帮助。'],
  ['星币6', '施受平衡，适度给予。', '居高施舍，关系不对等。'],
  ['星币7', '等待收成，评估投入。', '急于求成，半途动摇。'],
  ['星币8', '专注打磨，细水长流。', '钻牛角尖，忽略全局。'],
  ['星币9', '独立丰足，自在享受。', '孤独守成，拒绝联结。'],
  ['星币10', '长久安稳，家业厚实。', '物质有余，情感空洞。'],
  ['星币侍从', '务实学习，踏实积累。', '稚嫩保守，不敢尝试。'],
  ['星币骑士', '稳健执行，说到做到。', '迟缓固执，不够灵活。'],
  ['星币王后', '务实滋养，经营有方。', '过度操心，忽视自己。'],
  ['星币国王', '可靠掌控，资源稳增。', '固执守财，不愿变通。']
];

function drawOneCard(deck) {
  const base = deck[Math.floor(Math.random() * deck.length)];
  const reverse = Math.random() < 0.5;
  return { name: base[0], reverse, text: reverse ? base[2] : base[1] };
}

function renderTarot() {
  let draws = null;
  if (state.tarot && typeof state.tarot === 'object' && Array.isArray(state.tarot.draws)) {
    draws = state.tarot.draws;
  }
  const slots = [
    { key: 'major', label: '大阿尔卡纳', deck: 'major' },
    { key: 'minor1', label: '小阿尔卡纳', deck: 'minor' },
    { key: 'minor2', label: '小阿尔卡纳', deck: 'minor' },
    { key: 'minor3', label: '小阿尔卡纳', deck: 'minor' }
  ];
  if (!draws) draws = [];
  const cardHTML = (slot, idx) => {
    const d = draws ? draws.find(x => x.key === slot.key) : null;
    return `<div class="tarot-card" style="min-height:150px;padding:14px;flex:1;cursor:${d ? 'default' : 'pointer'}" onclick="tarotPick(${idx})">
      <div>
        <div style="font-size:34px">${d ? '✦' : '✧'}</div>
        <h2 style="font-size:18px">${d ? escapeHTML(d.name) + (d.reverse ? '（逆位）' : '（正位）') : '点击抽取'}</h2>
        <p style="font-size:13px">${d ? escapeHTML(d.text) : slot.label}</p>
        <div class="subtle" style="margin-top:6px;color:#cdd6e0">${slot.label}</div>
      </div>
    </div>`;
  };
  c().innerHTML = `
    <div class="stack">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${slots.map((s, i) => cardHTML(s, i)).join('')}
      </div>
      <button class="primary-btn" onclick="tarotReset()">重新占卜</button>
    </div>`;
}
function tarotReset() {
  state.tarot = { draws: [] };
  saveState();
  renderTarot();
}
function tarotPick(idx) {
  const slots = ['major', 'minor', 'minor', 'minor'];
  if (!state.tarot) state.tarot = { draws: [] };
  if (!Array.isArray(state.tarot.draws)) state.tarot.draws = [];
  if (state.tarot.draws.find(x => x.key === slots[idx] + (idx === 0 ? '' : idx))) return;
  const deck = idx === 0 ? TAROT_DECK : MINOR_DECK;
  let c, guard = 0;
  const taken = state.tarot.draws.map(x => x.name + x.reverse);
  do { c = drawOneCard(deck); guard++; } while (taken.includes(c.name + c.reverse) && guard < 200);
  state.tarot.draws.push(Object.assign({ key: slots[idx] + (idx === 0 ? '' : idx) }, c));
  saveState();
  renderTarot();
}

// ---------- 游戏 ----------
let gameMode = 'list';
let gameTimer = null;

function renderGame() {
  stopGame();
  if (gameMode === 'list') {
    c().innerHTML = `
      <div class="stack">
        <div class="card">
          <h2 class="section-title" style="text-align:center">🎮 游戏房</h2>
          <p class="subtle" style="text-align:center">选一个游戏开始玩</p>
          <div style="margin-top:10px">
            <div onclick="gameMode='target';renderGame()" style="display:flex;justify-content:space-between;align-items:center;padding:11px 2px;border-bottom:1px solid rgba(0,0,0,.06);cursor:pointer">
              <b>⭐ 打靶</b><span class="subtle">30秒点击得分挑战</span></div>
            <div onclick="gameMode='guess';renderGame()" style="display:flex;justify-content:space-between;align-items:center;padding:11px 2px;border-bottom:1px solid rgba(0,0,0,.06);cursor:pointer">
              <b>🧠 猜数字</b><span class="subtle">1-100 猜中它</span></div>
            <div onclick="gameMode='snake';renderGame()" style="display:flex;justify-content:space-between;align-items:center;padding:11px 2px;border-bottom:1px solid rgba(0,0,0,.06);cursor:pointer">
              <b>🐍 贪吃蛇</b><span class="subtle">方向键或滑动控制</span></div>
            <div onclick="gameMode='cake';renderGame()" style="display:flex;justify-content:space-between;align-items:center;padding:11px 2px;cursor:pointer">
              <b>🍰 阿Sue做蛋糕</b><span class="subtle">按订单装饰蛋糕</span></div>
          </div>
        </div>
      </div>`;
    return;
  }
  c().innerHTML = `
    <div class="stack">
      <button class="ghost-btn" style="width:100%" onclick="gameMode='list';renderGame()">← 返回游戏列表</button>
      ${gameMode==='target' ? renderGameTarget() : ''}
      ${gameMode==='guess' ? renderGameGuess() : ''}
      ${gameMode==='snake' ? renderGameSnake() : ''}
      ${gameMode==='cake' ? renderGameCake() : ''}
    </div>`;
  if (gameMode==='snake') setTimeout(initSnake, 50);
}
function stopGame() { clearInterval(gameTimer); clearInterval(snakeTimer); }

// -- 打靶 --
function renderGameTarget() {
  return `
    <div class="grid2">
      <div class="metric"><span class="subtle">得分</span><b id="gameScore">${state.game.score}</b></div>
      <div class="metric"><span class="subtle">最高</span><b>${state.game.best}</b></div>
    </div>
    <div class="game-pad" id="gamePad" style="position:relative;height:300px;background:rgba(0,0,0,.04);border-radius:14px;overflow:hidden;margin-top:10px"></div>
    <button class="primary-btn" style="margin-top:10px" onclick="startGame()">开始（30秒）</button>`;
}
function startGame() {
  state.game.score = 0;
  let time = 30;
  spawnTarget();
  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    time--;
    if (time <= 0) { clearInterval(gameTimer); alert('时间到！得分 ' + state.game.score); }
    else spawnTarget();
  }, 950);
}
function spawnTarget() {
  const pad = $('gamePad');
  if (!pad) return;
  const x = Math.random() * (pad.clientWidth - 50);
  const y = Math.random() * (pad.clientHeight - 50);
  pad.innerHTML = `<div class="target" style="position:absolute;left:${x}px;top:${y}px;width:44px;height:44px;line-height:44px;text-align:center;font-size:26px;cursor:pointer" onclick="hitTarget()">⭐</div>`;
}
function hitTarget() {
  state.game.score++;
  state.game.best = Math.max(state.game.best, state.game.score);
  saveState();
  const el = $('gameScore'); if (el) el.innerText = state.game.score;
  spawnTarget();
}

// -- 猜数字 --
function renderGameGuess() {
  if (!state.game.guessNum) state.game.guessNum = Math.floor(Math.random()*100)+1;
  return `<div class="card">
    <h3 style="margin:0 0 6px">猜数字（1-100）</h3>
    <div class="subtle">已猜 ${state.game.guessCount||0} 次</div>
    <div class="grid2" style="margin-top:8px">
      <input class="field" id="guessInput" type="number" placeholder="你的猜测">
      <button class="primary-btn" onclick="submitGuess()">猜</button>
    </div>
    <div id="guessMsg" class="subtle" style="margin-top:8px">${state.game.guessMsg||'我想了一个数，来猜吧'}</div>
    <button class="ghost-btn" style="margin-top:8px" onclick="resetGuess()">重开一局</button>
  </div>`;
}
function submitGuess() {
  const v = Number($('guessInput').value);
  if (!v) return;
  state.game.guessCount = (state.game.guessCount||0) + 1;
  if (v === state.game.guessNum) { state.game.guessMsg = `🎉 猜对了！用了 ${state.game.guessCount} 次`; }
  else if (v < state.game.guessNum) state.game.guessMsg = '太小了，往大猜';
  else state.game.guessMsg = '太大了，往小猜';
  saveState(); renderGame();
}
function resetGuess() {
  state.game.guessNum = Math.floor(Math.random()*100)+1;
  state.game.guessCount = 0; state.game.guessMsg = '';
  saveState(); renderGame();
}

// -- 贪吃蛇 --
let snake = null, snakeTimer = null;
function renderGameSnake() {
  return `<div class="metric"><span class="subtle">长度</span><b id="snakeLen">${state.game.snakeBest||0}</b></div>
    <canvas id="snakeCanvas" width="300" height="300" style="background:rgba(0,0,0,.04);border-radius:14px;margin-top:10px;touch-action:none"></canvas>
    <div class="subtle" style="margin-top:8px">方向键或上下左右滑动控制</div>
    <button class="ghost-btn" style="margin-top:8px" onclick="initSnake()">重新开始</button>`;
}
function initSnake() {
  clearInterval(snakeTimer);
  const c = $('snakeCanvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const grid = 15, w = c.width/grid;
  snake = { body: [{x:7,y:7}], dir: {x:1,y:0}, food: {x:3,y:3}, score: 0 };
  const step = () => {
    const head = { x: snake.body[0].x + snake.dir.x, y: snake.body[0].y + snake.dir.y };
    if (head.x<0||head.y<0||head.x>=w||head.y>=w) return gameOverSnake();
    if (snake.body.some(p=>p.x===head.x&&p.y===head.y)) return gameOverSnake();
    snake.body.unshift(head);
    if (head.x===snake.food.x && head.y===snake.food.y) {
      snake.food = { x: Math.floor(Math.random()*w), y: Math.floor(Math.random()*w) };
    } else snake.body.pop();
    ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle = '#18a058';
    snake.body.forEach(p => ctx.fillRect(p.x*grid, p.y*grid, grid-1, grid-1));
    ctx.fillStyle = '#e53935';
    ctx.fillRect(snake.food.x*grid, snake.food.y*grid, grid-1, grid-1);
    const el = $('snakeLen'); if (el) el.innerText = snake.body.length;
    state.game.snakeBest = Math.max(state.game.snakeBest||0, snake.body.length);
  };
  snakeTimer = setInterval(step, 160);
  const key = e => {
    const k = e.key;
    if (k==='ArrowUp') snake.dir={x:0,y:-1};
    if (k==='ArrowDown') snake.dir={x:0,y:1};
    if (k==='ArrowLeft') snake.dir={x:-1,y:0};
    if (k==='ArrowRight') snake.dir={x:1,y:0};
  };
  window.onkeydown = key;
  c.ontouchstart = e => {
    const t = e.touches[0]; const sx = t.clientX, sy = t.clientY;
    c.ontouchend = ev => {
      const dx = ev.changedTouches[0].clientX - sx, dy = ev.changedTouches[0].clientY - sy;
      if (Math.abs(dx)>Math.abs(dy)) snake.dir = dx>0?{x:1,y:0}:{x:-1,y:0};
      else snake.dir = dy>0?{x:0,y:1}:{x:0,y:-1};
    };
    e.preventDefault();
  };
}
function gameOverSnake() {
  clearInterval(snakeTimer);
  saveState();
  alert('游戏结束，蛇长 ' + snake.body.length);
}

// -- 阿Sue做蛋糕（精进版） --
const CAKE_BASES = [
  { name: '原味', color: '#f3e2c0', emoji: '🥚', desc: '香软经典' },
  { name: '巧克力', color: '#6b3a2a', emoji: '🍫', desc: '浓郁丝滑' },
  { name: '抹茶', color: '#8fbc8f', emoji: '🍵', desc: '清新回甘' },
  { name: '红丝绒', color: '#c23b22', emoji: '🔴', desc: '浪漫绵密' }
];
const CAKE_FILLINGS = [
  { name: '新鲜水果', emoji: '🍓', desc: '酸甜多汁' },
  { name: '果酱', emoji: '🍊', desc: '甜蜜夹心' },
  { name: '坚果碎', emoji: '🥜', desc: '酥脆口感' },
  { name: '无夹心', emoji: '—', desc: '纯粹糕体' }
];
const CAKE_CREAMS = [
  { name: '淡奶油', color: '#fff7fb', emoji: '🥛', desc: '轻盈不腻' },
  { name: '巧克力甘纳许', color: '#5b3a29', emoji: '🍫', desc: '浓郁丝滑' },
  { name: '奶油奶酪', color: '#fef5e7', emoji: '🧀', desc: '微酸醇厚' },
  { name: '草莓奶油', color: '#fddde6', emoji: '🍓', desc: '果香清甜' }
];
const CAKE_TOPPINGS = [
  { name: '新鲜水果', emoji: '🍓', desc: '色彩缤纷' },
  { name: '糖珠', emoji: '✨', desc: '闪闪可爱' },
  { name: '巧克力刨花', emoji: '🍫', desc: '精致卷花' },
  { name: '坚果碎', emoji: '🥜', desc: '香脆点缀' }
];
const CAKE_DECOS = [
  { name: '蜡烛', emoji: '🕯️', desc: '许个愿吧' },
  { name: '糖花', emoji: '🌹', desc: '浪漫加分' },
  { name: '马卡龙', emoji: '🥠', desc: '法式精致' },
  { name: '淋面酱', emoji: '🍯', desc: '丝滑流下' }
];

const CAKE_ORDERS = [
  { base: '巧克力', cream: '巧克力甘纳许', filling: '坚果碎', topping: '巧克力刨花', deco: ['蜡烛', '淋面酱'], desc: '重度巧克力控，要浓郁到底！' },
  { base: '原味', cream: '淡奶油', filling: '新鲜水果', topping: '新鲜水果', deco: ['糖花', '马卡龙'], desc: '清爽水果风，适合下午茶~' },
  { base: '抹茶', cream: '奶油奶酪', filling: '无夹心', topping: '坚果碎', deco: ['糖花', '蜡烛'], desc: '日式简约，微苦回甘' },
  { base: '红丝绒', cream: '奶油奶酪', filling: '果酱', topping: '糖珠', deco: ['马卡龙', '淋面酱'], desc: '经典红丝绒，颜值即正义' },
  { base: '巧克力', cream: '草莓奶油', filling: '新鲜水果', topping: '巧克力刨花', deco: ['糖花', '淋面酱'], desc: '巧克力+草莓，恋人必选' },
  { base: '原味', cream: '巧克力甘纳许', filling: '坚果碎', topping: '糖珠', deco: ['蜡烛', '马卡龙'], desc: '送给孩子的生日惊喜' }
];

let cakeOrder = null, cakeStepIdx = 0, cakeChoices = {}, cakeDone = false;
const cakeSteps = ['base', 'cream', 'filling', 'topping', 'deco'];

function renderGameCake() {
  return `<div class="card" id="cakeWrap" style="position:relative;background:linear-gradient(145deg,#fef6fb,#fce4ec);border:2px solid #f8bbd0;border-radius:20px;overflow:hidden">
    <div style="text-align:center;padding:16px 0 8px;background:linear-gradient(135deg,#f06292,#ec407a);color:#fff;margin:-2px -2px 0;border-radius:20px 20px 0 0">
      <div style="font-size:20px;font-weight:800;letter-spacing:1px">🧁 阿Sue的蛋糕店</div>
      <div style="font-size:12px;opacity:.85;margin-top:2px">今天也要做出完美的蛋糕哦</div>
    </div>
    <div id="cakeSelect" style="display:block;padding:20px 16px;text-align:center">
      <div style="font-size:48px;margin-bottom:6px">🧑‍🍳</div>
      <div style="font-size:15px;color:#555;margin-bottom:14px">有新的顾客订单，快来接单吧！</div>
      <button class="primary-btn" style="width:100%;background:linear-gradient(135deg,#f06292,#ec407a);border:none;font-size:16px;padding:14px" onclick="cakeNewOrder()">📋 接新订单</button>
    </div>
    <div id="cakePlay" style="display:none;padding:12px 14px">
      <div id="cakeOrderBanner" style="font-size:13px;color:#6a1b2a;font-weight:600;background:#fff0f6;padding:10px 14px;border-radius:12px;margin-bottom:10px;border-left:4px solid #ec407a"></div>
      <div id="cakeStage" style="position:relative;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;margin:6px 0 10px;padding:10px;background:#fefefe;border-radius:16px;box-shadow:inset 0 2px 8px rgba(0,0,0,.04)"></div>
      <div id="cakeChooser" style="margin-top:4px"></div>
      <div id="cakeTip" style="text-align:center;min-height:22px;font-size:13px;color:#888;margin-top:8px;padding:4px 0"></div>
      <div style="text-align:center;margin-top:6px"><button class="ghost-btn" style="color:#999;font-size:12px" onclick="cakeRestart()">↺ 重新接单</button></div>
    </div>
  </div>`;
}

function cakeNewOrder() {
  cakeOrder = CAKE_ORDERS[Math.floor(Math.random() * CAKE_ORDERS.length)];
  cakeStepIdx = 0; cakeChoices = {}; cakeDone = false;
  document.getElementById('cakeSelect').style.display = 'none';
  document.getElementById('cakePlay').style.display = 'block';
  const banner = document.getElementById('cakeOrderBanner');
  banner.innerHTML = `📋 新订单：${cakeOrder.desc}`;
  cakeRenderStep();
  cakeRenderStage();
}

function cakeRenderStep() {
  if (cakeDone) return;
  const chooser = document.getElementById('cakeChooser');
  const tip = document.getElementById('cakeTip');
  if (!chooser) return;
  const step = cakeSteps[cakeStepIdx];
  const stepInfo = { base: ['选择蛋糕胚', '🥚'], cream: ['涂抹奶油', '🥛'], filling: ['添加夹心', '🍓'], topping: ['撒顶饰', '✨'], deco: ['选2种装饰', '🎀'] };
  const [label, icon] = stepInfo[step] || ['', ''];
  let items;
  if (step === 'base') items = CAKE_BASES;
  else if (step === 'cream') items = CAKE_CREAMS;
  else if (step === 'filling') items = CAKE_FILLINGS;
  else if (step === 'topping') items = CAKE_TOPPINGS;
  else if (step === 'deco') items = CAKE_DECOS;
  if (!items) return;

  const stepNum = cakeStepIdx + 1;
  chooser.innerHTML = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
    <span style="background:#ec407a;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${stepNum}</span>
    <span style="font-weight:700;font-size:14px;color:#444">${icon} ${label}</span>
    <span style="margin-left:auto;font-size:11px;color:#aaa">${stepNum}/5</span>
  </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${items.map(item => {
        const isDeco = step === 'deco';
        const selected = isDeco ? (cakeChoices.deco || []).includes(item.name) : cakeChoices[step] === item.name;
        const maxed = isDeco && (cakeChoices.deco || []).length >= 2 && !selected;
        return `<button style="padding:12px 10px;text-align:left;display:flex;align-items:center;gap:10px;background:${selected ? '#fce4ec' : '#fff'};border:${selected ? '2px solid #ec407a' : '1.5px solid #f0e0e6'};border-radius:14px;cursor:pointer;font-family:inherit;transition:all .15s;${maxed ? 'opacity:.35' : ''}"
          onclick="cakePick('${step}','${item.name}')" ${maxed ? 'disabled' : ''}
          onmouseenter="this.style.borderColor='#ec407a'" onmouseleave="this.style.borderColor='${selected ? '#ec407a' : '#f0e0e6'}'">
          <span style="font-size:22px">${item.emoji}</span>
          <div><div style="font-weight:600;font-size:13px;color:#333">${item.name}</div><div style="font-size:11px;color:#999">${item.desc}</div></div>
          ${selected ? '<span style="margin-left:auto;color:#ec407a;font-size:14px">✓</span>' : ''}
        </button>`;
      }).join('')}
    </div>`;
  if (step === 'deco' && (cakeChoices.deco || []).length > 0) {
    chooser.innerHTML += `<div style="text-align:center;margin-top:10px"><button class="primary-btn" style="background:#ec407a;border:none;padding:12px 24px;font-size:14px" onclick="cakeNextStep()">✓ 选好了，下一步</button></div>`;
  }
  if (tip) {
    const hints = { base:'选一个蛋糕胚作为基底', cream:'选择奶油涂抹在蛋糕上', filling:'在中间加一层夹心', topping:'在表面撒上装饰', deco:'选2种装饰点缀蛋糕' };
    tip.innerText = hints[step] || '';
  }
}

function cakePick(step, name) {
  if (cakeDone) return;
  if (step === 'deco') {
    if (!cakeChoices.deco) cakeChoices.deco = [];
    if (cakeChoices.deco.includes(name)) {
      cakeChoices.deco = cakeChoices.deco.filter(d => d !== name);
    } else if (cakeChoices.deco.length < 2) {
      cakeChoices.deco.push(name);
    }
    cakeRenderStep();
    cakeRenderStage();
    return;
  }
  cakeChoices[step] = name;
  cakeRenderStage();
  const tip = document.getElementById('cakeTip');
  if (tip) tip.innerText = `✅ ${name} 已选`;
  setTimeout(() => { if (!cakeDone) cakeNextStep(); }, 400);
}

function cakeNextStep() {
  if (cakeStepIdx < cakeSteps.length - 1) { cakeStepIdx++; cakeRenderStep(); }
  else cakeFinishCake();
}

function cakeRenderStage() {
  const pad = document.getElementById('cakeStage'); if (!pad) return;
  const base = cakeChoices.base ? CAKE_BASES.find(b => b.name === cakeChoices.base) : null;
  const cream = cakeChoices.cream ? CAKE_CREAMS.find(c => c.name === cakeChoices.cream) : null;
  const filling = cakeChoices.filling ? CAKE_FILLINGS.find(f => f.name === cakeChoices.filling) : null;
  const topping = cakeChoices.topping ? CAKE_TOPPINGS.find(t => t.name === cakeChoices.topping) : null;
  const decos = (cakeChoices.deco || []).map(d => CAKE_DECOS.find(dc => dc.name === d)).filter(Boolean);
  const hasAny = base || cream || filling || topping || decos.length;
  pad.innerHTML = '';
  if (!hasAny) return;
  const rows = [];
  if (base) rows.push(`· 蛋糕胚：${base.name}`);
  if (filling && filling.name !== '无夹心') rows.push(`· 夹心：${filling.name}`);
  if (cream) rows.push(`· 奶油：${cream.name}`);
  if (topping) rows.push(`· 顶饰：${topping.name}`);
  if (decos.length) rows.push(`· 装饰：${decos.map(d => d.name).join('、')}`);
  pad.innerHTML = '<div style="font-size:13px;line-height:1.8;color:#555;padding:10px 0">✅ 已选：<br>' + rows.join('<br>') + '</div>';
  pad.style.background = '#fafafe';
  pad.style.padding = '8px 12px';
  pad.style.borderRadius = '10px';
}

function cakeFinishCake() {
  cakeDone = true;
  const tip = document.getElementById('cakeTip');
  const score = cakeOrder ? (cakeChoices.base === cakeOrder.base ? 1 : 0) + (cakeChoices.cream === cakeOrder.cream ? 1 : 0) +
    (cakeChoices.filling === cakeOrder.filling ? 1 : 0) + (cakeChoices.topping === cakeOrder.topping ? 1 : 0) +
    Math.min(2, (cakeChoices.deco || []).filter(d => (cakeOrder.deco || []).includes(d)).length) : 0;
  const maxScore = 6;
  const pct = Math.round(score / maxScore * 100);
  const starCount = pct >= 90 ? 5 : pct >= 70 ? 4 : pct >= 50 ? 3 : pct >= 30 ? 2 : 1;
  const stars = '⭐'.repeat(starCount) + '☆'.repeat(5 - starCount);
  const comment = pct >= 90 ? '完美！顾客超满意！' : pct >= 70 ? '很好吃，顾客很开心~' : pct >= 50 ? '还可以，但不太对订单哦' : '顾客有点失望…再接再厉';

  const st2 = document.getElementById('cakeStage');
  if (st2) st2.insertAdjacentHTML('beforeend', `<div style="margin-top:12px;text-align:center;background:linear-gradient(135deg,#fce4ec,#fff0f6);padding:12px;border-radius:14px;width:100%">
    <div style="font-size:20px;letter-spacing:2px">${stars}</div>
    <div style="font-weight:700;color:#c62828;font-size:15px;margin-top:4px">${comment}</div>
    <div style="font-size:12px;color:#999;margin-top:3px">订单匹配度 ${score}/${maxScore}</div>
  </div>`);

  if (tip) tip.innerText = '🎉 蛋糕完成！';
  const chooser = document.getElementById('cakeChooser');
  if (chooser) chooser.innerHTML = '';
  const wrap = document.getElementById('cakeWrap');
  if (wrap) { const f = document.createElement('div'); f.innerText = '🎉🧁✨'; f.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;pointer-events:none;animation:cakePop .8s ease;z-index:10'; wrap.appendChild(f); setTimeout(() => f.remove(), 1500); }
}

function cakeRestart() {
  cakeOrder = null; cakeStepIdx = 0; cakeChoices = {}; cakeDone = false;
  document.getElementById('cakeSelect').style.display = 'block';
  document.getElementById('cakePlay').style.display = 'none';
  const wrap = document.getElementById('cakeWrap');
  if (wrap) { const f = wrap.querySelector('div:last-child'); if (f && f.style.animation) f.remove(); }
}

// ---------- 情侣空间 ----------
function renderSpace() {
  const days = Math.max(1, Math.ceil((new Date() - new Date(state.space.startDate)) / 86400000));
  c().innerHTML = `
    <div class="stack">
      <div class="card" style="text-align:center;background:linear-gradient(135deg,#fff2f5,#e9f8ff)">
        <h2>情侣空间</h2>
        <div style="font-size:46px;font-weight:900">${days}</div>
        <p class="subtle">在一起的第 ${days} 天</p>
      </div>
      <div class="grid3">
        <div class="metric"><span class="subtle">啵啵</span><b>${state.space.kisses}</b></div>
        <div class="metric"><span class="subtle">日记</span><b>${state.diary.length}</b></div>
        <div class="metric"><span class="subtle">照片</span><b>${state.album.length}</b></div>
      </div>
      <div class="card">
        <label class="label">纪念日</label>
        <input class="field" type="date" id="spaceStart" value="${escapeHTML(state.space.startDate)}">
        <label class="label">留言板</label>
        <textarea class="textarea" id="spaceMemo">${escapeHTML(state.space.memo)}</textarea>
        <button class="primary-btn" style="width:100%;margin-top:8px" onclick="saveSpace()">保存空间</button>
      </div>
    </div>`;
}
function saveSpace() {
  state.space.startDate = $('spaceStart').value || state.space.startDate;
  state.space.memo = $('spaceMemo').value.trim();
  saveState();
  renderSpace();
}
