// ============================================================
// state.js - 数据层 + 工具函数
// ============================================================
const STORAGE_KEY = 'aiPhoneSoftwareState.v1';
const wallpaper = 'https://img.facfox.com/imgs/2026/07/21/ca7e52f015267b44.jpg';
const emojis = ['❤️','💋','😍','😘','🌹','✨','🔥','😂','🤣','😊','😎','🤔','🙄','😴','😭','😱','😡','🌈','🍎','🍓','🍦','🍹','🎁','🎈','🎀','👍','👎','👌','✌️','👊','👏','🙏'];

const defaultState = {
  profile: { name: '我', avatar: '', wallet: 99999, persona: '', likes: '', boundaries: '', speaking: '' },
  profiles: [{ id: 'prof-default', name: '我', avatar: '', persona: '', likes: '', boundaries: '', speaking: '' }],
  activeProfileId: 'prof-default',
  api: { key: '', url: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', preset: '你是一个角色扮演聊天引擎。严格遵守用户创建的角色卡、用户人设和记忆库，以自然聊天方式回复。' },
  settings: { ai: true, pinned: false },
  activeRoleId: 'role-default',
  roles: [
    {
      id: 'role-default',
      name: '未命名角色',
      avatar: '',
      relation: '',
      persona: '',
      greeting: '我在。先把我的角色卡改成你想要的样子吧。',
      mood: '😊',
      memories: [],
      chat: [{ role: 'assistant', content: '我在。先把我的角色卡改成你想要的样子吧。' }],
      unread: 0,
      read: true,
      pinned: false,
      online: true
    }
  ],
  moments: [],
  chat: [],
  checkins: [
    { id: 'ck-kaoyan', name: '考研学习', start: '2025/12/21', end: '2026/12/22', totalDays: 367, doneDays: 5, status: 'doing' },
    { id: 'ck-kaogong', name: '考公学习', start: '2025/12/15', end: '2026/3/15', totalDays: 91, doneDays: 5, status: 'doing' }
  ],
  habits: [
    { id: 'h-water', name: '喝水', icon: '💧', done: {} },
    { id: 'h-read', name: '阅读', icon: '📚', done: {} },
    { id: 'h-sport', name: '运动', icon: '🏃', done: {} }
  ],
  diary: [],
  study: { running: false, seconds: 25 * 60, target: 25 * 60, subject: '英语', records: [], mode: 'focus', round: 0, breakMin: 5, companion: true, companionMsg: '' },
  plant: { water: 55, love: 30, level: 1, lastWater: '', lastCare: '', streak: 0, fertilizedDate: '', logs: [] },
  ledger: [],
  doodles: [],
  music: [],
  album: [],
  albums: [],
  space: { startDate: '2026-01-01', memo: '把每天的小事都装进这里。', kisses: 0 },
  mq: {
    me: { name: '我', avatar: '' },
    roles: [],
    chats: {},
    moments: []
  },
  home: {
    bg: 'https://img.facfox.com/imgs/2026/07/19/06d3c79d7f440afd.jpg',
    person: 'https://img.facfox.com/imgs/2026/07/19/ea51598f7d0459ee.jpg',
    personPos: { x: 50, y: 72 },
    furniture: [
      { id: 'fur-sofa', name: '沙发',img: 'https://img.facfox.com/imgs/2026/07/19/4c76fde007fe6788.jpg',x: 31, y: 35, w: 50, h: 32, actions: [{ label: '瘫一会儿', result: '小人瘫在沙发上，像一颗被吸干的电池。' }, { label: '抱紧抱枕', result: '小人抱紧抱枕，获得了短暂的安全感。' }] },
      { id: 'fur-desk', name: '书桌', img: '', x: 62, y: 30, w: 26, h: 26, actions: [{ label: '写日记', result: '小人趴在书桌前写了两行字，又删掉了。' }, { label: '发呆', result: '小人盯着桌面木纹看了十分钟。' }] },
      { id: 'fur-fridge', name: '冰箱', img: '', x: 80, y: 64, w: 16, h: 30, actions: [{ label: '拿饮料', result: '小人拿出一瓶冰饮料，舒服地叹气。' }] },
      { id: 'fur-coffee', name: '咖啡机', img: '', x: 40, y: 24, w: 16, h: 18, actions: [{ label: '泡咖啡', result: '小人泡了杯热咖啡，香气飘满客厅。' }, { label: '往里放致死量糖', result: '小人往咖啡里倒了半袋糖……它裂开了。' }] },
      { id: 'fur-plant', name: '绿植', img: 'https://img.facfox.com/imgs/2026/07/19/c04f5b36f0772578.jpg', x: 4, y: 50, w: 14, h: 10, actions: [{ label: '浇点水', result: '小人给绿植浇了水，叶子抖了抖。' }] },
      { id: 'fur-tv', name: '电视', img: 'https://img.facfox.com/imgs/2026/07/19/f85416dc3afd0f7e.jpg', x: 30, y: 72, w: 50, h: 17, actions: [{ label: '看动画', result: '小人盘腿看动画，笑得肩膀直抖。' }, { label: '看新闻', result: '小人看了三秒新闻，默默关掉。' }] },
      { id: 'fur-tvcabinet', name: '电视柜', img: 'https://img.facfox.com/imgs/2026/07/19/a8d596cfd10afc97.jpg', x: 33, y: 80, w: 46, h: 24,actions: [] },
      { id: 'fur-table', name: '桌子', img: 'https://img.facfox.com/imgs/2026/07/19/fe76d6eb69100b4d.jpg', x: 34, y: 35, w: 40, h: 58, actions: [] },
      { id: 'fur-painting', name: '挂画', img: 'https://img.facfox.com/imgs/2026/07/19/fdf9f477504349c7.jpg', x: 54, y: 6, w: 22, h: 20, actions: [] }
    ],
    logs: []
  },
  tarot: null,
  qq: null,
  game: { score: 0, best: 0 },
  myProfile: {
    avatar: '🌸',
    avatarImage: '',
    coverImage: '',
    name: '我的名字',
    username: '@my_username',
    bio: '这个人很懒，什么都没写...',
    location: '🌍 地球',
    posts: 12,
    followers: 342,
    following: 156,
    gallery: ['💖','✨','🎨','🌈','🔥','🎵','📸','🦋','🌟']
  },
  profilePosts: []
};

// ===== 深层合并 =====
function mergeDeep(base, patch) {
  Object.keys(patch || {}).forEach(key => {
    if (patch[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key]) && base[key]) {
      mergeDeep(base[key], patch[key]);
    } else {
      base[key] = patch[key];
    }
  });
  return base;
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function ensureStateShape(next, saved) {
  if (!Array.isArray(next.roles) || !next.roles.length) {
    next.roles = cloneDefaultState().roles;
  }
  if (Array.isArray(saved.chat) && saved.chat.length && !saved.roles) {
    next.roles[0].chat = saved.chat;
  }
  next.roles = next.roles.map((role, index) => ({
    id: role.id || 'role-' + Date.now() + '-' + index,
    name: role.name || '未命名角色',
    avatar: role.avatar || '',
    relation: role.relation || '',
    persona: role.persona || '',
    greeting: role.greeting || '你好，我在。',
    mood: role.mood || '😊',
    memories: Array.isArray(role.memories) ? role.memories : [],
    chat: Array.isArray(role.chat) && role.chat.length ? role.chat : [{ role: 'assistant', content: role.greeting || '你好，我在。' }],
    unread: role.unread || 0,
    read: role.read !== false,
    pinned: role.pinned === true,
    online: role.online !== false
  }));
  if (!next.activeRoleId || !next.roles.some(role => role.id === next.activeRoleId)) {
    next.activeRoleId = next.roles[0].id;
  }
  if (!Array.isArray(next.moments)) next.moments = [];
  if (!Array.isArray(next.profiles) || !next.profiles.length) {
    const p = next.profile || {};
    next.profiles = [{
      id: 'prof-default',
      name: p.name || '我',
      avatar: p.avatar || '',
      persona: p.persona || '',
      likes: p.likes || '',
      boundaries: p.boundaries || '',
      speaking: p.speaking || ''
    }];
    next.activeProfileId = 'prof-default';
  }
  if (!next.activeProfileId || !next.profiles.some(p => p.id === next.activeProfileId)) {
    next.activeProfileId = next.profiles[0].id;
  }
  next.plant = next.plant || {};
  next.plant.water = Number(next.plant.water) || 0;
  next.plant.love = Number(next.plant.love) || 0;
  next.plant.level = Number(next.plant.level) || 1;
  next.plant.lastWater = next.plant.lastWater || '';
  next.plant.lastCare = next.plant.lastCare || '';
  next.plant.streak = Number(next.plant.streak) || 0;
  next.plant.fertilizedDate = next.plant.fertilizedDate || '';
  next.plant.logs = Array.isArray(next.plant.logs) ? next.plant.logs : [];
  const HOME_BG_NEW = 'https://img.facfox.com/imgs/2026/07/19/06d3c79d7f440afd.jpg';
  const HOME_BG_OLD = 'https://img.facfox.com/imgs/2026/07/19/6b8c616e9b4c927c.jpg';
  if (!next.home || typeof next.home !== 'object') next.home = {};
  if (!next.home.bg || next.home.bg === HOME_BG_OLD) {
    next.home.bg = HOME_BG_NEW;
  }
  try {
    const defFur = (cloneDefaultState().home.furniture || []);
    if (defFur.length) {
      next.home.furniture = (next.home.furniture || []).map(f => {
        const d = defFur.find(x => x.id === f.id);
        if (d) { f.x = d.x; f.y = d.y; f.w = d.w; f.h = d.h; }
        return f;
      });
      defFur.forEach(d => {
        if (!next.home.furniture.some(f => f.id === d.id)) next.home.furniture.push(d);
      });
    }
  } catch (e) { /* ignore */ }
  if (!Array.isArray(next.albums)) next.albums = [];
  if (Array.isArray(next.album) && next.album.length && !next.albums.length) {
    next.albums = [{ id: 'default', name: '默认相册', photos: next.album.map((p, i) => ({ id: 'p' + i, url: p.url, caption: p.caption || '', date: p.date || '' })) }];
  }
  if (!next.album) next.album = [];
  if (!Array.isArray(next.music)) next.music = [];
  if (!Array.isArray(next.habits)) next.habits = [];
  next.habits = next.habits.map(h => ({ id: h.id || 'h' + Date.now(), name: h.name || '习惯', icon: h.icon || '✅', done: h.done && typeof h.done === 'object' ? h.done : {} }));
  next.study = next.study && typeof next.study === 'object' ? next.study : {};
  next.study.running = next.study.running === true;
  next.study.seconds = Number(next.study.seconds) || 25 * 60;
  next.study.target = Number(next.study.target) || 25 * 60;
  next.study.subject = next.study.subject || '英语';
  next.study.records = Array.isArray(next.study.records) ? next.study.records : [];
  next.study.mode = next.study.mode === 'break' ? 'break' : 'focus';
  next.study.round = Number(next.study.round) || 0;
  next.study.breakMin = Number(next.study.breakMin) || 5;
  next.study.companion = next.study.companion !== false;
  next.study.companionMsg = typeof next.study.companionMsg === 'string' ? next.study.companionMsg : '';
  if (!next.game || typeof next.game !== 'object') next.game = { score: 0, best: 0 };
  if (typeof next.game.score !== 'number') next.game.score = 0;
  if (typeof next.game.best !== 'number') next.game.best = 0;
  if (!next.myProfile || typeof next.myProfile !== 'object') {
    next.myProfile = cloneDefaultState().myProfile;
  }
  if (!Array.isArray(next.profilePosts)) next.profilePosts = [];
  return next;
}

// ===== 本地存储 =====
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return ensureStateShape(mergeDeep(cloneDefaultState(), saved || {}), saved || {});
  } catch {
    return ensureStateShape(cloneDefaultState(), {});
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    alert('保存失败：头像或数据太大，请换一张更小的图片后重试。');
    return false;
  }
}

// ===== IndexedDB 音乐存储 =====
function openMusicDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('aiPhoneMusic', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('music', { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function putMusicBlob(id, dataUrl) {
  const db = await openMusicDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('music', 'readwrite');
    tx.objectStore('music').put({ id, dataUrl });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function getMusicBlob(id) {
  const db = await openMusicDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('music', 'readonly');
    const r = tx.objectStore('music').get(id);
    r.onsuccess = () => resolve(r.result ? r.result.dataUrl : null);
    r.onerror = () => reject(r.error);
  });
}
async function deleteMusicBlob(id) {
  const db = await openMusicDB();
  return new Promise((resolve) => {
    const tx = db.transaction('music', 'readwrite');
    tx.objectStore('music').delete(id);
    tx.oncomplete = () => resolve();
  });
}

// ===== 通用工具函数 =====
function $(id) { return document.getElementById(id); }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function escapeHTML(v) {
  return String(v == null ? '' : v)
    .split('&').join('&')
    .split('<').join('<')
    .split('>').join('>')
    .split('"').join('"')
    .split("'").join('&#39;');
}
function renderAvatar(value, fallback = '头像') {
  if (value && String(value).startsWith('data:image/')) {
    return `<img src="${escapeHTML(value)}" alt="${escapeHTML(fallback)}头像">`;
  }
  return escapeHTML(value || fallback.slice(0, 1) || '人');
}
function yuan(n) { return Number(n || 0).toFixed(2); }
function setTitle(name) { $('m-tit').innerText = name; }
function c() { return $('m-content'); }
function quickNotice(text) { appendBubble('system', text); hidePanels(); alert(text); }

function joinUrl(base, path) {
  return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}

function togglePanel(id) {
  const panel = $(id);
  const show = panel.style.display !== 'grid';
  hidePanels();
  panel.style.display = show ? 'grid' : 'none';
}
function hidePanels() {
  const e = $('emojiPanel'); if (e) e.style.display = 'none';
  const m = $('morePanel'); if (m) m.style.display = 'none';
  const h = $('headerMenu'); if (h) h.style.display = 'none';
}

function habitStreak(h) {
  const dates = Object.keys(h.done).filter(d => h.done[d]);
  const set = new Set(dates);
  let count = 0;
  const d = new Date();
  while (set.has(localDateKey(d))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ===== Getter 函数 =====
function activeRole() {
  return state.roles.find(role => role.id === state.activeRoleId) || state.roles[0];
}
function getRole(id) {
  return state.roles.find(role => role.id === id) || activeRole();
}
function activeCharacter() { return activeRole(); }
function getCharacter(id) { return getRole(id); }

function activeProfile() {
  return state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0];
}

function lastChatPreview(char) {
  const last = (char.chat || [])[char.chat.length - 1];
  return last ? last.content : char.greeting || '还没有聊天';
}

let state = loadState();
