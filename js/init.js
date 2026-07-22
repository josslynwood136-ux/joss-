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
  const emojisPanel = ['😀','😂','🥰','😎','😭','👍','🎉','💕','🌟','🍰','🌹','🔥'];
  emojisPanel.forEach(e => {
    const span = document.createElement('span');
    span.innerText = e;
    span.onclick = () => { $('chatInput').value += e; $('chatInput').focus(); };
    $('emojiPanel').appendChild(span);
  });
  renderChat();
  initDragDesktop();
  bindHotspots();
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
      openApp(name);
    }, { passive: false });
    hs.addEventListener('click', function(ev) {
      if (touched) { touched = false; return; }
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
Object.assign(window, {
  toggleDebug, openApp, closeApp, toggleHeaderMenu, quickNotice,
  switchTab, openChat, closeChat, openSettings, closeSettings,
  togglePin, clearHistory, toggleMore, toggleEmoji,
  sendChat, sendRed, addLedgerQuick, saveApiConfig, pullModels,
  testConnection, exportAllData, importAllData, resetAllData,
  renderCharacterEditor, saveCharacter, deleteCharacter, addMemory,
  deleteMemory, uploadAvatar, postMoment, saveMyProfile, rememberLastUserMessage,
  newProfile, editProfile,
  doCheckin, deleteCheckin, submitNewCheckin, submitEditCheckin,
  addDiary, setStudyMinutes, setBreak,
  toggleStudy, finishStudy, companionSay, toggleCompanion, refreshCompanion, inviteStudy,
  addLedger, deleteLedger, editLedger, changeLedgerMonth,
  clearCanvas, saveDoodle, undoDoodle, uploadDoodleBg,
  playTone, uploadMusic, playMusic, renameMusic, deleteMusic,
  addKiss, startGame, hitTarget, submitGuess, resetGuess, initSnake, saveSpace,
  renderMQ, mqSwitch, mqOpenChat, mqSend, mqNewRole, mqEditRoleView,
  mqSaveRole, mqDelRole, mqPublish, mqInvite, mqSaveMe, mqShowMem, mqClearMem,
  likeMoment, addComment, deleteMessage,
  fertilizePlant, plantMood, plantStage,
  renderAlbum, addPhoto, uploadPhoto, deletePhoto, viewPhoto, toggleAlbumUpload,
  openAlbum, newAlbum, renameAlbum, delAlbum, renderAlbumPhotos,
  capturePhoto, renamePhoto, copyPhoto, movePhoto,
  renderHome, openFurniture, closeHomePanel, doFurnitureAction,
  toggleHomeLog, waterPlant, touchPlant,
  cakeChoose, cakeAction, cakeRestart,
  hidePanels, toggleHabit, addHabit, delHabit, stopMusic,
  renderIGProfile, switchProfileTab, renderFeed, renderCharLibrary, openCharFromLib,
  createCharFromLib, renderIGCharEditor, igHandleAvatarUpload, igClearAvatar, saveIGCharEditor, deleteIGChar,
  renderDmList, renderMyProfileContent,
  openProfileEditor, closeProfileEditor,
  handleProfileAvatarUpload, handleProfileCoverUpload,
  resetProfileAvatar, saveProfile,
  openPostCreator, closePostCreator,
  handlePostImageSelect, setPostFilter,
  postCreatorNext, publishPost,
  viewPost, closePostDetail, deletePost,
  toggleFeedLike, showIGToast
});

// 离开时保存
window.addEventListener('beforeunload', saveState);

// DOM 就绪后启动
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => { try { init(); } catch (e) { alert('init 执行失败：' + e.message); } });
} else {
  try { init(); } catch (e) { alert('init 执行失败：' + e.message); }
}
