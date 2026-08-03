// ============================================================
// init.js - 初始化 + 全局事件绑定 + window 导出
// ============================================================

// 错误捕获
window.onerror = function(msg, src, line, col, err) {
  alert('脚本报错：' + msg + '\n位置：行' + line + ' 列' + col + (err && err.stack ? '\n' + err.stack : ''));
  return false;
};
window.addEventListener('error', function(e) {
  if (e.message) alert('加载/运行错误：' + e.message);
});

// 初始化入口
function init() {
  function setPhoneH() {
    document.documentElement.style.setProperty('--phone-h', window.innerHeight + 'px');
  }
  setPhoneH();
  window.addEventListener('resize', setPhoneH);
  renderEmojiPanel();
  if (!state.checkins.find(function(c) { return c.id === 'ck-water'; })) {
    var today = new Date();
    var weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);
    var fmt = function(d) { return d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate(); };
    state.checkins.push({ id: 'ck-water', name: '喝水打卡', start: fmt(today), end: fmt(weekLater), totalDays: 7, doneDays: 0, status: 'doing' });
    saveState();
  }
  var _prof = activeProfile();
  var _mp = state.myProfile || {};
  if (_prof && !_prof.avatar && _mp.avatarImage) {
    _prof.avatar = _mp.avatarImage;
    saveState();
  }
  renderChat();
  initDragDesktop();
  bindHotspots();
  if (typeof loadNcmState === 'function') loadNcmState();
  if (typeof loadQqState === 'function') loadQqState();
  if (typeof maybeProbeNcm === 'function') maybeProbeNcm();
}

// 桌面热点绑定（兼容触摸 + 鼠标）
function bindHotspots() {
  document.querySelectorAll('.hotspot').forEach(hs => {
    const name = hs.getAttribute('data-name');
    if (!name) return;
    let touched = false;
    hs.addEventListener('touchstart', function(ev) {
      touched = true;
      ev.preventDefault();
      if (name === '塔罗牌' || name === '塔罗') { showTarotPortal(); return; }
      openApp(name);
    }, { passive: false });
    hs.addEventListener('click', function(ev) {
      if (touched) { touched = false; return; }
      if (name === '塔罗牌' || name === '塔罗') { showTarotPortal(); return; }
      openApp(name);
    });
  });
}

function toggleDebug() { document.getElementById('contentArea').classList.toggle('debug-mode'); }

// 桌面滑动
function initDragDesktop() {
  const slider = $('slider');
  let isDown = false, startX = 0, scrollLeft = 0, startY = 0, moved = false;

  slider.addEventListener('mousedown', e => {
    if ($('appModal').classList.contains('active')) return;
    isDown = true; moved = false;
    startX = e.pageX - slider.offsetLeft;
    startY = e.pageY;
    scrollLeft = slider.scrollLeft;
  });
  slider.addEventListener('mouseup', () => isDown = false);
  slider.addEventListener('mouseleave', () => isDown = false);
  slider.addEventListener('mousemove', e => {
    if (!isDown) return;
    if ($('appModal').classList.contains('active')) { isDown = false; return; }
    const dx = e.pageX - slider.offsetLeft - startX;
    if (Math.abs(dx) > 6 || Math.abs(e.pageY - startY) > 6) moved = true;
    if (moved) { e.preventDefault(); slider.scrollLeft = scrollLeft - dx * 1.5; }
  });

  slider.addEventListener('touchstart', e => {
    if ($('appModal').classList.contains('active')) return;
    isDown = true; moved = false;
    startX = e.touches[0].pageX - slider.offsetLeft;
    startY = e.touches[0].pageY;
    scrollLeft = slider.scrollLeft;
  }, { passive: true });
  slider.addEventListener('touchmove', e => {
    if (!isDown) return;
    if ($('appModal').classList.contains('active')) { isDown = false; return; }
    const dx = e.touches[0].pageX - slider.offsetLeft - startX;
    const dy = e.touches[0].pageY - startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
    if (moved) slider.scrollLeft = scrollLeft - dx * 1.5;
  }, { passive: true });
  slider.addEventListener('touchend', () => { isDown = false; moved = false; }, { passive: true });
}

// ===== 导出到 window（确保内联 onclick 正常工作）=====
var _w = window;
_w.toggleDebug = toggleDebug; _w.openApp = openApp; _w.closeApp = closeApp; _w.toggleHeaderMenu = toggleHeaderMenu; _w.quickNotice = quickNotice;
_w.switchTab = switchTab; _w.openChat = openChat; _w.closeChat = closeChat; _w.openSettings = openSettings; _w.closeSettings = closeSettings;
_w.togglePin = togglePin; _w.clearHistory = clearHistory; _w.toggleMore = toggleMore; _w.toggleEmoji = toggleEmoji; _w.toggleAutoMem = toggleAutoMem; _w.setAutoMemLen = setAutoMemLen; _w.setAutoMemEvery = setAutoMemEvery; _w.manualSummarizeMemory = manualSummarizeMemory;
_w.sendChat = sendChat; _w.sendRed = sendRed; _w.selectRpAmount = selectRpAmount; _w.onRpAmountInput = onRpAmountInput; _w.confirmRedPacket = confirmRedPacket; _w.openRedPacket = openRedPacket; _w.toggleVoice = toggleVoice; _w.stopVoice = stopVoice; _w.voiceTouchStart = voiceTouchStart; _w.voiceTouchEnd = voiceTouchEnd; _w.saveApiConfig = saveApiConfig; _w.fetchModels = fetchModels;
_w.testConnection = testConnection; _w.exportAllData = exportAllData; _w.importAllData = importAllData; _w.resetAllData = resetAllData;
_w.renderCharacterEditor = renderCharacterEditor; _w.saveCharacter = saveCharacter; _w.deleteCharacter = deleteCharacter; _w.addMemory = addMemory;
_w.deleteMemory = deleteMemory; _w.uploadAvatar = uploadAvatar; _w.postMoment = postMoment; _w.saveMyProfile = saveMyProfile; _w.settingsAddMemory = settingsAddMemory; _w.settingsDeleteMemory = settingsDeleteMemory;
_w.newProfile = newProfile; _w.editProfile = editProfile;
_w.doCheckin = doCheckin; _w.deleteCheckin = deleteCheckin; _w.submitNewCheckin = submitNewCheckin; _w.submitEditCheckin = submitEditCheckin;
_w.addDiary = addDiary; _w.setStudyMinutes = setStudyMinutes; _w.setBreak = setBreak;
_w.toggleStudy = toggleStudy; _w.finishStudy = finishStudy; _w.companionSay = companionSay; _w.toggleCompanion = toggleCompanion; _w.refreshCompanion = refreshCompanion; _w.inviteStudy = inviteStudy;
_w.addLedger = addLedger; _w.deleteLedger = deleteLedger; _w.editLedger = editLedger; _w.changeLedgerMonth = changeLedgerMonth;
_w.clearCanvas = clearCanvas; _w.saveDoodle = saveDoodle; _w.undoDoodle = undoDoodle; _w.uploadDoodleBg = uploadDoodleBg;
_w.uploadMusic = uploadMusic; _w.playSong = playSong; _w.playMusic = playSong; _w.renameMusic = renameMusic; _w.deleteMusic = deleteMusic; _w.togglePlay = togglePlay; _w.nextSong = nextSong; _w.prevSong = prevSong; _w.cycleMode = cycleMode; _w.toggleFav = toggleFav; _w.setFavView = setFavView; _w.searchMusic = searchMusic; _w.clearSearch = clearSearch; _w.playSearch = playSearch; _w.openNcmLogin = openNcmLogin; _w.closeNcmLogin = closeNcmLogin; _w.setSearchSrc = setSearchSrc; _w.openQqLogin = openQqLogin; _w.closeQqLogin = closeQqLogin;
_w.addKiss = addKiss; _w.startGame = startGame; _w.hitTarget = hitTarget; _w.submitGuess = submitGuess; _w.resetGuess = resetGuess; _w.initSnake = initSnake; _w.saveSpace = saveSpace;
_w.renderMQ = renderMQ; _w.mqSwitch = mqSwitch; _w.mqOpenChat = mqOpenChat; _w.mqSend = mqSend; _w.mqNewRole = mqNewRole; _w.mqEditRoleView = mqEditRoleView;
_w.mqSaveRole = mqSaveRole; _w.mqDelRole = mqDelRole; _w.mqPublish = mqPublish; _w.mqInvite = mqInvite; _w.mqSaveMe = mqSaveMe; _w.mqShowMem = mqShowMem; _w.mqClearMem = mqClearMem;
_w.likeMoment = likeMoment; _w.addComment = addComment; _w.deleteMessage = deleteMessage; _w.openAlbumPicker = openAlbumPicker; _w.startCapture = startCapture;
_w.fertilizePlant = fertilizePlant; _w.plantMood = plantMood;
_w.addLedgerQuick = addLedgerQuick;
_w.renderAlbum = renderAlbum; _w.addPhoto = addPhoto; _w.uploadPhoto = uploadPhoto; _w.deletePhoto = deletePhoto; _w.viewPhoto = viewPhoto; _w.toggleAlbumUpload = toggleAlbumUpload;
_w.openAlbum = openAlbum; _w.newAlbum = newAlbum; _w.renameAlbum = renameAlbum; _w.delAlbum = delAlbum; _w.renderAlbumPhotos = renderAlbumPhotos;
_w.capturePhoto = capturePhoto; _w.renamePhoto = renamePhoto; _w.copyPhoto = copyPhoto; _w.movePhoto = movePhoto;
_w.renderHome = renderHome; _w.switchRoom = switchRoom; _w.openFurniture = openFurniture; _w.closeHomePanel = closeHomePanel; _w.doFurnitureAction = doFurnitureAction; _w.spawnRoomEffect = spawnRoomEffect;
_w.toggleHomeLog = toggleHomeLog; _w.waterPlant = waterPlant; _w.touchPlant = touchPlant;
_w.cakeNewOrder = cakeNewOrder; _w.cakePick = cakePick; _w.cakeNextStep = cakeNextStep; _w.cakeRestart = cakeRestart;
_w.hidePanels = hidePanels; _w.toggleHabit = toggleHabit; _w.addHabit = addHabit; _w.delHabit = delHabit; _w.stopMusic = stopMusic;
_w.renderIGProfile = renderIGProfile; _w.switchProfileTab = switchProfileTab; _w.renderFeed = renderFeed; _w.renderCharLibrary = renderCharLibrary; _w.openCharFromLib = openCharFromLib;
_w.createCharFromLib = createCharFromLib; _w.renderIGCharEditor = renderIGCharEditor; _w.igHandleAvatarUpload = igHandleAvatarUpload; _w.igClearAvatar = igClearAvatar; _w.saveIGCharEditor = saveIGCharEditor; _w.deleteIGChar = deleteIGChar;
_w.igAddMemory = igAddMemory; _w.igDeleteMemory = igDeleteMemory;
_w.renderDmList = renderDmList; _w.renderMyProfileContent = renderMyProfileContent;
_w.openProfileEditor = openProfileEditor; _w.closeProfileEditor = closeProfileEditor;
_w.handleProfileAvatarUpload = handleProfileAvatarUpload; _w.handleProfileCoverUpload = handleProfileCoverUpload;
_w.resetProfileAvatar = resetProfileAvatar; _w.saveProfile = saveProfile;
_w.openPostCreator = openPostCreator; _w.closePostCreator = closePostCreator;
_w.handlePostImageSelect = handlePostImageSelect; _w.setPostFilter = setPostFilter;
_w.postCreatorNext = postCreatorNext; _w.publishPost = publishPost;
_w.viewPost = viewPost; _w.closePostDetail = closePostDetail; _w.deletePost = deletePost;
_w.openIGStory = openIGStory; _w.igLikeAutoPost = igLikeAutoPost; _w.toggleAutoPost = toggleAutoPost; _w.showIGToast = showIGToast;
_w.renderEmojiPanel = renderEmojiPanel; _w.switchEmojiTab = switchEmojiTab; _w.sendSticker = sendSticker;
_w.renderStickerManager = renderStickerManager; _w.openStickerForm = openStickerForm;
_w.closeStickerForm = closeStickerForm; _w.stickerPickImage = stickerPickImage; _w.saveStickerForm = saveStickerForm;
_w.deleteSticker = deleteSticker;

// 离开时保存
window.addEventListener('beforeunload', saveState);

// DOM 就绪后启动
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => { try { init(); } catch (e) { alert('init 执行失败：' + e.message); } });
} else {
  try { init(); } catch (e) { alert('init 执行失败：' + e.message); }
}
