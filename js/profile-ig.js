// ============================================================
// profile-ig.js - IG 风格个人主页
// ============================================================

let selectedProfileAvatar = '🌸';
let selectedProfileAvatarImage = '';
let selectedProfileCoverImage = '';
let postCreatorStep = 1;
let pendingPostImage = null;
let viewPostId = null;
let currentProfileTab = 'home';

function showIGToast(msg) {
  const el = $('igToast');
  if (!el) return alert(msg);
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2500);
}

function renderIGProfile() {
  const mc = c();
  if (mc) { mc.style.padding = '0'; mc.style.height = '100%'; mc.style.overflow = 'hidden'; }
  setTitle('Instagram');
  const p = state.myProfile || (state.myProfile = {
    avatar: '🌸', avatarImage: '', coverImage: '',
    name: '我的名字', username: '@my_username',
    bio: '这个人很懒，什么都没写...', location: '🌍 地球',
    posts: 12, followers: 342, following: 156,
    gallery: ['💖','✨','🎨','🌈','🔥','🎵','📸','🦋','🌟']
  });
  currentProfileTab = 'home';

  c().innerHTML = `
    <div class="ig-app">
      <!-- IG Header -->
      <div class="ig-profile-header">
        <div class="logo-area">
          <span class="logo-text">Instagram</span>
        </div>
        <div class="header-actions">
          <button class="header-action-btn" onclick="openPostCreator()" title="发布">➕</button>
          <button class="header-action-btn" onclick="closeApp()" title="首页">✕</button>
        </div>
      </div>

      <!-- Panels Container -->
      <div class="ig-panels">
        <!-- Panel 1: Home / Feed -->
        <div class="profile-panel active" id="igPanelHome">
          <div class="feed-container" id="igFeedContainer"></div>
        </div>
        <!-- Panel 2: 角色库 -->
        <div class="profile-panel" id="igPanelSearch">
          <div class="char-lib-container">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="igSearchInput" placeholder="搜索角色名称..." oninput="renderCharLibrary()" />
            </div>
            <div style="padding:0 16px 10px;font-size:12px;color:#8e8e8e;">共 <span id="charLibCount">${state.roles.length}</span> 个角色</div>
            <div class="char-lib-grid" id="igCharLibrary"></div>
          </div>
        </div>
        <!-- Panel 3: DM -->
        <div class="profile-panel" id="igPanelDm">
          <div class="dm-header-bar">
            <span class="dm-title">私信</span>
            <button class="dm-new-btn" onclick="showIGToast('新建消息')">✏️</button>
          </div>
          <div class="dm-container" id="igDmContainer"></div>
        </div>
        <!-- Panel 4: Profile -->
        <div class="profile-panel" id="igPanelProfile">
          <div class="profile-panel-content" id="igProfileContent"></div>
        </div>
      </div>

      <!-- IG Bottom Navigation -->
      <div class="profile-nav" id="igProfileNav">
        <div class="nav-item active" data-tab="home" onclick="switchProfileTab('home')">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v9a1 1 0 001 1h3m-4-5a1 1 0 011-1h2a1 1 0 011 1v5m0 0a1 1 0 001 1h3a1 1 0 001-1v-9"/></svg></span>
          <span class="nav-label">首页</span>
        </div>
        <div class="nav-item" data-tab="search" onclick="switchProfileTab('search')">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg></span>
          <span class="nav-label">搜索</span>
        </div>
        <div class="nav-item" data-tab="post" onclick="openPostCreator()">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg></span>
          <span class="nav-label">发布</span>
        </div>
        <div class="nav-item" data-tab="dm" onclick="switchProfileTab('dm')">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></span>
          <span class="nav-label">私信</span>
        </div>
        <div class="nav-item" data-tab="profile" onclick="switchProfileTab('profile')">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
          <span class="nav-label">我的</span>
        </div>
      </div>
    </div>`;

  renderFeed();
}

// ====== Tab Switching ======
function switchProfileTab(tab) {
  if (tab === 'post') { openPostCreator(); return; }
  currentProfileTab = tab;
  document.querySelectorAll('#igProfileNav .nav-item').forEach(item => item.classList.remove('active'));
  const activeNav = document.querySelector(`#igProfileNav .nav-item[data-tab="${tab}"]`);
  if (activeNav) activeNav.classList.add('active');
  document.querySelectorAll('.ig-panels .profile-panel').forEach(p => p.classList.remove('active'));
  if (tab === 'home') {
    $('igPanelHome').classList.add('active');
    renderFeed();
  } else if (tab === 'search') {
    $('igPanelSearch').classList.add('active');
    renderCharLibrary();
  } else if (tab === 'dm') {
    $('igPanelDm').classList.add('active');
    renderDmList();
  } else if (tab === 'profile') {
    $('igPanelProfile').classList.add('active');
    renderMyProfileContent();
  }
}

// ====== Feed / Home ======
function renderFeed() {
  const container = $('igFeedContainer');
  if (!container) return;
  const posts = state.profilePosts || [];
  if (posts.length === 0) {
    container.innerHTML = '<div class="feed-empty">📷 还没有帖子<br><span style="font-size:12px;color:#bbb;">点击底部 + 发布第一条动态</span></div>';
    return;
  }
  const username = state.myProfile ? state.myProfile.username : '@user';
  const avatarHtml = state.myProfile && state.myProfile.avatarImage
    ? `<img src="${state.myProfile.avatarImage}" />`
    : (state.myProfile ? state.myProfile.avatar || '👤' : '👤');

  container.innerHTML = posts.map(post => `
    <div class="feed-post">
      <div class="feed-post-header">
        <div class="feed-avatar">${avatarHtml}</div>
        <span class="feed-username">${escapeHTML(username)}</span>
        <button class="feed-more">⋯</button>
      </div>
      <div class="feed-post-image">
        <img src="${post.image}" style="filter:${post.filter || 'none'};" onclick="viewPost('${post.id}')" />
      </div>
      <div class="feed-post-actions">
        <button class="action-btn" onclick="toggleFeedLike('${post.id}')">♡</button>
        <button class="action-btn" onclick="showIGToast('评论功能')">💬</button>
        <button class="action-btn save-btn" onclick="showIGToast('已保存')">🏷️</button>
      </div>
      <div class="feed-post-likes">❤️ 0 次赞</div>
      <div class="feed-post-caption">
        <span class="cap-user">${escapeHTML(username)}</span>${escapeHTML(post.caption || '')}
      </div>
      <div class="feed-post-time">${formatPostTime(post.time)}</div>
    </div>
  `).join('');
}

function toggleFeedLike(postId) {
  const btn = document.querySelector(`#igFeedContainer .feed-post:first-child .action-btn:first-child`);
  if (btn) {
    btn.classList.toggle('liked');
    btn.textContent = btn.classList.contains('liked') ? '❤️' : '♡';
  }
}

// ====== 角色库 ======
function renderCharLibrary() {
  const grid = $('igCharLibrary');
  const count = $('charLibCount');
  if (!grid) return;
  const query = ($('igSearchInput') && $('igSearchInput').value || '').toLowerCase();
  const roles = state.roles || [];
  const filtered = query ? roles.filter(r => (r.name || '').toLowerCase().includes(query)) : roles;
  if (count) count.textContent = filtered.length;
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="text-align:center;color:#999;padding:60px 20px;font-size:14px;">🔍 没有匹配的角色<br><span style="font-size:12px;color:#bbb;">试试其他关键词</span></div>';
    return;
  }
  grid.innerHTML = filtered.map(char => `
    <div class="char-lib-avatar-wrap" onclick="openCharFromLib('${char.id}')" title="${escapeHTML(char.name)}">
      <div class="char-lib-avatar">${renderAvatar(char.avatar, char.name)}</div>
      <div class="char-lib-name">${escapeHTML(char.name)}</div>
    </div>
  `).join('') + `
    <div class="char-lib-add-card" onclick="createCharFromLib()">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#c7c7c7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
    </div>`;
}

function openCharFromLib(charId) {
  igEditingCharId = charId;
  renderIGCharEditor();
}

function createCharFromLib() {
  igEditingCharId = null;
  renderIGCharEditor();
}

let igEditingCharId = null;
let igCharAvatarData = '';

function renderIGCharEditor() {
  const isNew = !igEditingCharId;
  const char = isNew ? {} : (state.roles.find(r => r.id === igEditingCharId) || {});
  igCharAvatarData = isNew ? '' : (char.avatar || '');

  const avatarPreview = igCharAvatarData
    ? `<img src="${igCharAvatarData}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : '<span style="color:#c7c7c7;font-size:14px;">📷</span>';

  c().innerHTML = `
    <div class="ig-app">
      <div class="ig-profile-header">
        <div class="logo-area">
          <span class="logo-text">${isNew ? '新角色' : '编辑角色'}</span>
        </div>
        <div class="header-actions">
          <button class="header-action-btn" onclick="renderIGProfile()" title="返回">✕</button>
        </div>
      </div>
      <div class="ig-char-editor">
        <div class="ig-ce-section">
          <div class="ig-ce-label">头像</div>
          <div class="ig-ce-avatar-row">
            <div class="ig-ce-avatar" id="igCeAvatarDisplay" style="overflow:hidden;font-size:0;">${avatarPreview}</div>
            <div style="flex:1;">
              <button class="ig-ce-upload-btn" type="button" onclick="document.getElementById('igCeAvatarFile').click()">📷 选择图片</button>
              <div style="font-size:11px;color:#c7c7c7;margin-top:4px;">建议正方形图片，会自动压缩</div>
              <input type="file" id="igCeAvatarFile" accept="image/*" style="display:none;" onchange="igHandleAvatarUpload(event)">
              ${igCharAvatarData ? '<button class="ig-ce-upload-btn" style="margin-top:6px;background:#f5f5f5;color:#8e8e8e;" onclick="igClearAvatar()">移除头像</button>' : ''}
            </div>
          </div>
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">名称</div>
          <input class="ig-ce-input" id="igCeName" placeholder="角色名字" value="${escapeHTML(char.name || '')}">
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">别名 / 小名</div>
          <input class="ig-ce-input" id="igCeAliases" placeholder="多个别名用逗号隔开" value="${escapeHTML(char.aliases || '')}">
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">关系</div>
          <input class="ig-ce-input" id="igCeRelation" placeholder="朋友 / 恋人 / 搭档..." value="${escapeHTML(char.relation || '')}">
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">性格标签</div>
          <textarea class="ig-ce-textarea" id="igCePersonality" placeholder="冷静、温柔、占有欲、毒舌...">${escapeHTML(char.personality || '')}</textarea>
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">说话风格</div>
          <textarea class="ig-ce-textarea" id="igCeStyle" placeholder="短句、口语、会撒娇、少用感叹号...">${escapeHTML(char.style || '')}</textarea>
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">背景故事</div>
          <textarea class="ig-ce-textarea" id="igCeBackground" placeholder="角色经历、身份、世界观..." rows="4">${escapeHTML(char.background || '')}</textarea>
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">高级设定 Prompt</div>
          <textarea class="ig-ce-textarea" id="igCePrompt" placeholder="额外规则、禁止崩人设、互动边界..." rows="3">${escapeHTML(char.prompt || '')}</textarea>
        </div>
        <div class="ig-ce-section">
          <div class="ig-ce-label">开场白</div>
          <textarea class="ig-ce-textarea" id="igCeGreeting" placeholder="第一次聊天时角色说的话" rows="2">${escapeHTML(char.greeting || '')}</textarea>
        </div>
        <div style="padding:16px 16px 30px;display:flex;gap:10px;">
          <button class="ig-ce-btn ig-ce-btn-secondary" onclick="renderIGProfile()" style="flex:1;">取消</button>
          <button class="ig-ce-btn ig-ce-btn-primary" onclick="saveIGCharEditor()" style="flex:1;">${isNew ? '创建角色' : '保存'}</button>
        </div>
        ${isNew ? '' : '<div style="padding:0 16px 30px;"><button class="ig-ce-btn ig-ce-btn-danger" onclick="deleteIGChar()" style="width:100%;">删除角色</button></div>'}
      </div>
    </div>`;
  // Highlight selected avatar
  document.querySelectorAll('.ig-avatar-opt').forEach(el => {
    el.style.borderColor = el.dataset.em === igCharAvatar ? '#262626' : 'transparent';
    el.style.background = el.dataset.em === igCharAvatar ? '#f5f5f5' : 'transparent';
  });
}

function igHandleAvatarUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showIGToast('请选择图片'); return; }
  compressAvatar(file).then(dataUrl => {
    igCharAvatarData = dataUrl;
    const display = $('igCeAvatarDisplay');
    if (display) display.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  }).catch(err => showIGToast('读取失败'));
  event.target.value = '';
}

function igClearAvatar() {
  igCharAvatarData = '';
  const display = $('igCeAvatarDisplay');
  if (display) display.innerHTML = '<span style="color:#c7c7c7;font-size:14px;">📷</span>';
  const fileInput = $('igCeAvatarFile');
  if (fileInput) fileInput.value = '';
}

function saveIGCharEditor() {
  const name = $('igCeName').value.trim();
  if (!name) { showIGToast('请输入角色名称'); return; }
  const isNew = !igEditingCharId;
  const char = isNew ? {
    id: 'char-' + Date.now(),
    memories: [],
    chat: [],
    unread: 0,
    read: true,
    pinned: false,
    online: true
  } : state.roles.find(r => r.id === igEditingCharId);
  if (!char) return;
  char.avatar = igCharAvatarData;
  char.name = name;
  char.aliases = $('igCeAliases').value.trim();
  char.relation = $('igCeRelation').value.trim();
  char.personality = $('igCePersonality').value.trim();
  char.style = $('igCeStyle').value.trim();
  char.background = $('igCeBackground').value.trim();
  char.prompt = $('igCePrompt').value.trim();
  char.greeting = $('igCeGreeting').value.trim() || '你好，我是' + name + '。';
  if (!char.chat.length) char.chat = [{ role: 'assistant', content: char.greeting }];
  if (isNew) {
    state.roles.push(char);
    state.activeRoleId = char.id;
  }
  saveState();
  renderIGProfile();
  setTimeout(() => { switchProfileTab('search'); renderCharLibrary(); }, 50);
  showIGToast(isNew ? '角色 ' + name + ' 已创建 ✨' : '角色已更新 ✅');
}

function deleteIGChar() {
  if (!igEditingCharId) return;
  if (state.roles.length <= 1) { showIGToast('至少保留一个角色'); return; }
  if (!confirm('删除这个角色？')) return;
  state.roles = state.roles.filter(r => r.id !== igEditingCharId);
  if (state.activeRoleId === igEditingCharId) state.activeRoleId = state.roles[0].id;
  saveState();
  renderIGProfile();
  showIGToast('角色已删除');
}

// ====== DM List ======
function renderDmList() {
  const container = $('igDmContainer');
  if (!container) return;
  container.innerHTML = '';
  if (state.roles.length === 0) {
    container.innerHTML = '<div class="dialog-empty">💬 还没有对话<br><span style="font-size:12px;color:#bbb;">去联系人创建角色吧</span></div>';
    return;
  }
  state.roles.forEach(char => {
    const last = (char.chat || [])[char.chat.length - 1];
    const preview = last ? last.content.slice(0, 40) + (last.content.length > 40 ? '...' : '') : '还没有聊天记录';
    const time = last && last.time ? formatPostTime(last.time) : '';
    const div = document.createElement('div');
    div.className = 'dialog-item';
    div.onclick = (e) => {
      e.stopPropagation();
      // 清空 IG 内容再开聊天，避免遮挡
      const mc = c();
      if (mc) { mc.style.padding = ''; mc.style.height = ''; mc.style.overflow = ''; }
      mc.innerHTML = '';
      setTitle('消息');
      const ah = document.querySelector('.app-header');
      if (ah) ah.style.display = '';
      setTimeout(() => openChat(char.id), 30);
    };
    div.innerHTML = `
      <div class="dialog-avatar">${renderAvatar(char.avatar, char.name)}</div>
      <div class="dialog-info">
        <div class="dialog-name">${escapeHTML(char.name)}</div>
        <div class="dialog-preview">${escapeHTML(preview)}</div>
      </div>
      <div class="dialog-time">${time}</div>
    `;
    container.appendChild(div);
  });
}

// ====== My Profile Content (Panel 4) ======
function renderMyProfileContent() {
  const p = state.myProfile || (state.myProfile = {
    avatar: '🌸', avatarImage: '', coverImage: '',
    name: '我的名字', username: '@my_username',
    bio: '这个人很懒，什么都没写...', location: '🌍 地球',
    posts: 12, followers: 342, following: 156,
    gallery: ['💖','✨','🎨','🌈','🔥','🎵','📸','🦋','🌟']
  });
  const container = $('igProfileContent');
  if (!container) return;
  const postEmojis = p.gallery || ['💖','✨','🎨','🌈','🔥','🎵','📸','🦋','🌟'];

  let avatarHtml = p.avatar || '🌸';
  if (p.avatarImage) avatarHtml = `<img src="${p.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;

  container.innerHTML = `
    <div class="profile-cover${p.coverImage ? '' : ' no-custom-bg'}" style="${p.coverImage ? 'background-image:url(' + p.coverImage.replace(/"/g,'"') + ');' : ''}">
      <div class="profile-avatar" onclick="openProfileEditor()" style="overflow:hidden;font-size:${p.avatarImage ? '0' : '40px'};">${p.avatarImage ? '<img src="' + p.avatarImage + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />' : (p.avatar || '🌸')}</div>
      <div class="profile-name">${escapeHTML(p.name)}</div>
      <div class="profile-username">${escapeHTML(p.username)}</div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><div class="num">${postEmojis.length}</div><div class="lbl">帖子</div></div>
      <div class="profile-stat"><div class="num">${p.followers||342}</div><div class="lbl">粉丝</div></div>
      <div class="profile-stat"><div class="num">${p.following||156}</div><div class="lbl">关注</div></div>
    </div>
    <div class="profile-bio">
      <p>${escapeHTML(p.bio)}</p>
      <div class="bio-location">${escapeHTML(p.location)}</div>
    </div>
    <button class="profile-edit-btn" onclick="openProfileEditor()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 编辑资料</button>
    <button class="profile-edit-btn" onclick="openPostCreator()" style="margin-top:8px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> 发动态</button>
    <div class="profile-posts-header"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> 我的帖子</div>
    <div class="profile-posts-grid">
      ${state.profilePosts && state.profilePosts.length > 0
        ? state.profilePosts.slice(0, 9).map(p => `
          <div class="profile-post" onclick="viewPost('${p.id}')" style="background:linear-gradient(135deg, #f093fb, #f5576c, #fda085);">
            <img src="${p.image}" style="width:100%;height:100%;object-fit:cover;filter:${p.filter || 'none'};" />
          </div>
        `).join('')
        : (postEmojis.map(e => `<div class="profile-post">${e}</div>`).join(''))
      }
    </div>
  `;
}

// ====== Profile Editor ======
function openProfileEditor() {
  const p = state.myProfile || {};
  $('profileEditName').value = p.name || '';
  $('profileEditUsername').value = p.username || '';
  $('profileEditBio').value = p.bio || '';
  $('profileEditLocation').value = p.location || '';
  selectedProfileAvatar = p.avatar || '🌸';
  selectedProfileAvatarImage = p.avatarImage || '';
  selectedProfileCoverImage = p.coverImage || '';

  const ap = $('profileAvatarPreview');
  if (ap) {
    if (p.avatarImage) {
      ap.innerHTML = '<img src="' + p.avatarImage + '" style="width:100%;height:100%;object-fit:cover;" />';
    } else {
      ap.innerHTML = p.avatar || '🌸';
    }
  }
  const coverPreview = $('profileCoverPreview');
  if (coverPreview) {
    if (p.coverImage) {
      coverPreview.style.backgroundImage = 'url(' + p.coverImage + ')';
    } else {
      coverPreview.style.backgroundImage = 'linear-gradient(145deg,#f093fb,#f5576c,#fda085)';
    }
  }
  $('profileModal').classList.add('active');
}

function closeProfileEditor() {
  $('profileModal').classList.remove('active');
}

function handleProfileAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showIGToast('图片不能超过 2MB'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    selectedProfileAvatarImage = e.target.result;
    selectedProfileAvatar = '';
    $('profileAvatarPreview').innerHTML = `<img src="${e.target.result}" />`;
  };
  reader.readAsDataURL(file);
}

function handleProfileCoverUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showIGToast('图片不能超过 2MB'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    selectedProfileCoverImage = e.target.result;
    $('profileCoverPreview').style.backgroundImage = `url(${e.target.result})`;
  };
  reader.readAsDataURL(file);
}

function resetProfileAvatar() {
  selectedProfileAvatarImage = '';
  selectedProfileAvatar = '🌸';
  $('profileAvatarPreview').innerHTML = '🌸';
}

function saveProfile() {
  if (!state.myProfile) state.myProfile = {};
  if (selectedProfileAvatarImage) {
    state.myProfile.avatarImage = selectedProfileAvatarImage;
    state.myProfile.avatar = '🌸';
  } else {
    state.myProfile.avatar = selectedProfileAvatar || '🌸';
    state.myProfile.avatarImage = '';
  }
  state.myProfile.coverImage = selectedProfileCoverImage || '';
  state.myProfile.name = $('profileEditName').value.trim() || '我的名字';
  state.myProfile.username = $('profileEditUsername').value.trim() || '@my_username';
  state.myProfile.bio = $('profileEditBio').value.trim() || '';
  state.myProfile.location = $('profileEditLocation').value.trim() || '';
  closeProfileEditor();
  renderMyProfileContent();
  saveState();
  showIGToast('资料已更新 ✅');
}

// ====== Post Creator ======
function openPostCreator() {
  postCreatorStep = 1;
  pendingPostImage = null;
  $('postCreator').classList.add('active');
  $('postCreatorPlaceholder').style.display = 'block';
  $('postCreatorImage').style.display = 'none';
  $('postCreatorFilters').style.display = 'none';
  $('postCreatorCaptionArea').classList.remove('active');
  $('postCreatorNext').textContent = '下一步';
  $('postCreatorNext').classList.remove('ready');
  $('postCreatorFileInput').click();
}

function closePostCreator() {
  $('postCreator').classList.remove('active');
  postCreatorStep = 1;
  pendingPostImage = null;
}

function handlePostImageSelect(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    pendingPostImage = e.target.result;
    var img = $('postCreatorImage');
    img.src = pendingPostImage;
    img.style.display = 'block';
    img.style.filter = 'none';
    $('postCreatorPlaceholder').style.display = 'none';
    $('postCreatorFilters').style.display = 'flex';
    $('postCreatorNext').classList.add('ready');
    document.querySelectorAll('#postCreatorFilters .filter-option').forEach(function(f) { f.classList.remove('active'); });
    var first = document.querySelector('#postCreatorFilters .filter-option[data-filter="none"]');
    if (first) first.classList.add('active');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function setPostFilter(filter) {
  var img = $('postCreatorImage');
  if (img) img.style.filter = filter;
  document.querySelectorAll('#postCreatorFilters .filter-option').forEach(function(f) { f.classList.remove('active'); });
  var opt = document.querySelector('#postCreatorFilters .filter-option[data-filter="' + filter + '"]');
  if (opt) opt.classList.add('active');
}

function postCreatorNext() {
  if (!pendingPostImage) return;
  if (postCreatorStep === 1) {
    postCreatorStep = 2;
    $('postCreatorFilters').style.display = 'none';
    $('postCreatorCaptionArea').classList.add('active');
    $('postCreatorNext').textContent = '分享';
    $('postCreatorCaption').focus();
  } else {
    publishPost();
  }
}

function publishPost() {
  var caption = $('postCreatorCaption').value.trim();
  var filter = $('postCreatorImage').style.filter || 'none';
  state.profilePosts.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    image: pendingPostImage,
    filter: filter,
    caption: caption,
    time: Date.now()
  });
  $('postCreatorCaption').value = '';
  closePostCreator();
  saveState();
  renderMyProfileContent();
  renderFeed();
  showIGToast('已发布 ✨');
}

// ====== Post Detail ======
function viewPost(postId) {
  var post = state.profilePosts.find(function(p) { return p.id === postId; });
  if (!post) return;
  viewPostId = postId;
  $('postDetailImg').innerHTML = '<img src="' + post.image + '" style="filter:' + (post.filter || 'none') + ';" />';
  $('postDetailCaption').textContent = post.caption || '无标题';
  $('postDetailTime').textContent = formatPostTime(post.time);
  $('postDetailDelete').style.display = 'block';
  $('postDetail').classList.add('active');
}

function closePostDetail() {
  $('postDetail').classList.remove('active');
  viewPostId = null;
}

function deletePost() {
  if (!viewPostId) return;
  if (!confirm('确定删除这条帖子？')) return;
  state.profilePosts = state.profilePosts.filter(function(p) { return p.id !== viewPostId; });
  closePostDetail();
  saveState();
  renderMyProfileContent();
  renderFeed();
  showIGToast('已删除');
}

// ====== Utils ======
function formatPostTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var now = new Date();
  var diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return month + '/' + day;
}
