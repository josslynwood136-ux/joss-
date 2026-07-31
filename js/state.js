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
  api: { key: '', url: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', preset: '', temp: 0.75, topP: 0.9, maxTokens: 500, presencePenalty: 0, frequencyPenalty: 0 },
  apiProfiles: [],
  activeApiProfile: '',
  settings: { ai: true, pinned: false, bubbleStyle: 'default', musicMode: 'loop' },
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
      online: true,
      lang: '中文',
      translate: false
    }
  ],
  moments: [],
  chat: [],
  checkins: [],
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
    rooms: {
      living: {
        name: '客厅',
        bg: 'https://img.facfox.com/imgs/2026/07/19/06d3c79d7f440afd.jpg',
        person: 'https://img.facfox.com/imgs/2026/07/19/ea51598f7d0459ee.jpg',
        personPos: { x: 50, y: 72 },
        furniture: [
          { id: 'fur-painting', name: '🖼️挂画', img: 'https://img.facfox.com/imgs/2026/07/19/fdf9f477504349c7.jpg', x: 54, y: 6, w: 22, h: 20, actions: [] },
          { id: 'fur-tvcabinet', name: '📺电视柜', img: 'https://img.facfox.com/imgs/2026/07/19/a8d596cfd10afc97.jpg', x: 33, y: 80, w: 46, h: 24, actions: [] },
          { id: 'fur-table', name: '🪑桌子', img: 'https://img.facfox.com/imgs/2026/07/19/fe76d6eb69100b4d.jpg', x: 34, y: 35, w: 40, h: 58, actions: [] },
          { id: 'fur-plant', name: '🌱绿植', img: 'https://img.facfox.com/imgs/2026/07/19/c04f5b36f0772578.jpg', x: 4, y: 50, w: 14, h: 10, actions: [{ label: '浇点水', result: '小人给绿植浇了水，叶子抖了抖。' }] },
          { id: 'fur-tv', name: '📺电视', img: 'https://img.facfox.com/imgs/2026/07/19/f85416dc3afd0f7e.jpg', x: 30, y: 72, w: 50, h: 17, actions: [{ label: '看动画', result: '小人盘腿看动画，笑得肩膀直抖。' }, { label: '看新闻', result: '小人看了三秒新闻，默默关掉。' }] },
          { id: 'fur-desk', name: '📖书桌', img: '', x: 62, y: 30, w: 26, h: 26, actions: [{ label: '写日记', result: '小人趴在书桌前写了两行字，又删掉了。' }, { label: '发呆', result: '小人盯着桌面木纹看了十分钟。' }] },
          { id: 'fur-fridge', name: '🧊冰箱', img: '', x: 80, y: 64, w: 16, h: 30, actions: [{ label: '拿饮料', result: '小人拿出一瓶冰饮料，舒服地叹气。' }] },
          { id: 'fur-coffee', name: '☕咖啡机', img: '', x: 40, y: 24, w: 16, h: 18, actions: [{ label: '泡咖啡', result: '小人泡了杯热咖啡，香气飘满客厅。' }, { label: '往里放致死量糖', result: '小人往咖啡里倒了半袋糖……它裂开了。' }] },
          { id: 'fur-sofa', name: '🛋️沙发', img: '', x: 36, y: 38, w: 44, h: 26, actions: [{ label: '瘫一会儿', result: '小人瘫在沙发上，像一颗被吸干的电池。' }, { label: '抱紧抱枕', result: '小人抱紧抱枕，获得了短暂的安全感。' }] }
        ]
      },
      bathroom: {
        name: '厕所',
        bg: '',
        person: 'https://img.facfox.com/imgs/2026/07/19/ea51598f7d0459ee.jpg',
        personPos: { x: 30, y: 68 },
        effects: ['steam', 'bubble'],
        furniture: [
          { id: 'fur-bathtub', name: '🛁 浴缸', img: '', x: 42, y: 18, w: 54, h: 52, actions: [
            { label: '放热水泡澡', result: '小人拧开水龙头，热水哗哗涌出，蒸汽升腾。钻进水里的一瞬间，整个人都化了。🫧', effect: 'steam' },
            { label: '撒泡泡浴盐', result: '小人扔了一块浴盐进去，水里咕嘟嘟冒出粉色泡泡，整个浴室都是香甜的味道。', effect: 'bubble' },
            { label: '泡着唱歌', result: '小人泡在水里，开始哼歌，声音在浴室里回荡……还挺好听。🎵' }
          ]},
          { id: 'fur-shower', name: '🚿 淋浴', img: '', x: 3, y: 6, w: 24, h: 40, actions: [
            { label: '冲个热水澡', result: '花洒喷出热水，蒸汽弥漫。小人站在水下，闭上眼睛，浑身都放松了。', effect: 'steam' },
            { label: '冲个冷水澡', result: '冷水浇下来——小人打了个激灵，瞬间清醒了！💦' },
            { label: '边洗边唱', result: '淋浴间里传来跑调的歌声和哗哗水声……幸好没人听见。🎤' }
          ]},
          { id: 'fur-sink', name: '🚿 洗手台', img: '', x: 72, y: 58, w: 26, h: 28, actions: [
            { label: '洗手', result: '小人挤了点洗手液，慢悠悠搓出泡沫，冲干净，甩了甩手上的水。' },
            { label: '刷牙', result: '小人对着镜子刷牙，左边刷刷右边刷刷，咕噜咕噜吐掉泡沫。🪥' },
            { label: '洗把脸', result: '小人捧了把凉水泼在脸上，拍了拍脸颊，清醒多了。💧' }
          ]},
          { id: 'fur-mirror', name: '🪞 镜子', img: '', x: 72, y: 0, w: 26, h: 30, actions: [
            { label: '照镜子', result: '小人看着镜子里自己的脸，眨了眨眼，做了个鬼脸。😜' },
            { label: '整理头发', result: '小人用手指理了理头发，左看右看，满意地点了点头。💇' },
            { label: '在镜子上画画', result: '小人用手指在起雾的镜子上画了一个笑脸，然后又默默擦掉了。😶' }
          ]},
          { id: 'fur-toilet', name: '🚽 马桶', img: '', x: 2, y: 55, w: 22, h: 30, actions: [
            { label: '坐下', result: '小人坐下来，终于可以安静一会儿了……📖' },
            { label: '冲水', result: '哗——水流声在安静的浴室里格外清晰。' },
            { label: '玩手机', result: '小人坐在马桶上刷手机，十分钟过去了……📱' }
          ]},
          { id: 'fur-towel', name: '🧺 毛巾架', img: '', x: 30, y: 0, w: 16, h: 14, actions: [
            { label: '拿干毛巾', result: '小人取了一条干净柔软的白毛巾，闻了闻，有洗衣液的清香。' },
            { label: '换毛巾', result: '小人把旧毛巾收走，挂上一条新毛巾，整整齐齐。' }
          ]},
          { id: 'fur-stool', name: '🪑 小木凳', img: '', x: 22, y: 70, w: 12, h: 14, actions: [
            { label: '坐着发呆', result: '小人坐在小木凳上，托着腮，看着浴室地板上的水纹发呆。' },
            { label: '踩着够东西', result: '小人踩上小木凳，伸手去够高处柜子里的东西，刚好能够着！' }
          ]},
          { id: 'fur-candle', name: '🕯️ 香薰', img: '', x: 86, y: 48, w: 12, h: 16, actions: [
            { label: '点燃', result: '小人划燃火柴，点亮蜡烛。暖黄色的火光摇曳，淡淡的薰衣草香弥漫开来。🕯️✨', effect: 'candle' },
            { label: '吹灭', result: '小人轻轻吹了一口气，烛火熄灭，一缕细烟袅袅升起。' }
          ]},
          { id: 'fur-plant-bath', name: '🪴 绿植', img: '', x: 85, y: 68, w: 14, h: 18, actions: [
            { label: '浇水', result: '小人给浴室的小绿植浇了点水，水珠挂在叶子上，青翠欲滴。🌿' },
            { label: '跟它说话', result: '小人蹲下来对绿植说：「你要好好长大哦。」叶子轻轻摇了摇，好像在回应。' }
          ]},
          { id: 'fur-scale', name: '⚖️ 体重秤', img: '', x: 38, y: 74, w: 14, h: 14, actions: [
            { label: '称体重', result: '小人站上体重秤，低头看了一眼数字，面无表情地走下来了。⚖️' },
            { label: '把它藏起来', result: '小人把体重秤塞到角落眼不见心不烦，舒服了。😌' }
          ]}
        ]
      }
    },
    activeRoom: 'living',
    logs: []
  },
  tarot: { step: 'start', major: null, minors: [] },
  qq: null,
  customStickers: [],
  call: { active: false, type: 'audio', startTime: 0, muted: false, speaker: false },
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
  profilePosts: [],
  viewedStories: {}
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
    online: role.online !== false,
    lang: role.lang || '中文',
    translate: role.translate === true,
    mode: role.mode === 'online' ? 'online' : 'offline',
    contextLen: parseInt(role.contextLen) > 0 ? parseInt(role.contextLen) : 12,
    autoMem: role.autoMem !== false,
    autoMemLen: parseInt(role.autoMemLen) > 1 ? parseInt(role.autoMemLen) : 8,
    autoMemEvery: parseInt(role.autoMemEvery) > 0 ? parseInt(role.autoMemEvery) : 1,
    memPending: parseInt(role.memPending) || 0
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
  if (!next.home || typeof next.home !== 'object') next.home = {};
  if (!next.home.rooms || typeof next.home.rooms !== 'object') {
    var def = cloneDefaultState().home.rooms;
    var migrated = {};
    migrated.living = {
      name: '客厅',
      bg: next.home.bg || def.living.bg,
      person: next.home.person || def.living.person,
      personPos: next.home.personPos || { x: 50, y: 72 },
      furniture: (next.home.furniture || []).length ? next.home.furniture : JSON.parse(JSON.stringify(def.living.furniture))
    };
    migrated.bathroom = JSON.parse(JSON.stringify(def.bathroom));
    next.home.rooms = migrated;
    next.home.activeRoom = 'living';
  } else {
    var defRooms = cloneDefaultState().home.rooms;
    Object.keys(defRooms).forEach(function(rid) {
      if (!next.home.rooms[rid]) {
        next.home.rooms[rid] = JSON.parse(JSON.stringify(defRooms[rid]));
      } else {
        var defFur = defRooms[rid].furniture;
        next.home.rooms[rid].furniture = (next.home.rooms[rid].furniture || []).map(function(f) {
          var d = defFur.find(function(x) { return x.id === f.id; });
          if (d) { f.x = d.x; f.y = d.y; f.w = d.w; f.h = d.h; f.img = d.img; }
          return f;
        });
        defFur.forEach(function(d) {
          if (!next.home.rooms[rid].furniture.some(function(f) { return f.id === d.id; })) {
            next.home.rooms[rid].furniture.push(JSON.parse(JSON.stringify(d)));
          }
        });
      }
    });
  }
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
  if (!Array.isArray(next.customStickers)) next.customStickers = [];
  if (!next.call || typeof next.call !== 'object') next.call = {};
  next.call.active = next.call.active === true;
  next.call.type = next.call.type || 'audio';
  next.call.startTime = Number(next.call.startTime) || 0;
  next.call.muted = next.call.muted === true;
  next.call.speaker = next.call.speaker === true;
  return next;
}

// ===== 本地存储 =====
function estimateStateSize() {
  try { return Math.round(JSON.stringify(state).length * 2 / 1024); } catch(e) { return 0; }
}

function cleanupChatImages(minLen) {
  minLen = minLen || 50000;
  var removed = 0;
  var freed = 0;
  (state.roles || []).forEach(function(role) {
    (role.chat || []).forEach(function(msg) {
      if (msg.media && msg.media.src && msg.media.src.length > minLen) {
        freed += msg.media.src.length;
        msg.media = null;
        if (!msg.content) msg.content = '[图片已清理]';
        removed++;
      }
    });
  });
  return { removed: removed, freedKB: Math.round(freed * 2 / 1024) };
}

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
    var totalRemoved = 0;
    var totalFreed = 0;
    var thresholds = [50000, 30000, 15000];
    for (var i = 0; i < thresholds.length; i++) {
      var r = cleanupChatImages(thresholds[i]);
      totalRemoved += r.removed;
      totalFreed += r.freedKB;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        alert('空间不足，已自动清理 ' + totalRemoved + ' 个大图/头像（释放约 ' + totalFreed + ' KB），保存成功。');
        return true;
      } catch (e) { }
    }
    alert('仍无法保存（当前约 ' + estimateStateSize() + ' KB）。请删除一些表情包或清空聊天记录后重试。');
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
