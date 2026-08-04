document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // DOM要素
  const chatContainer = document.getElementById('chatContainer');
  const pinBtn = document.getElementById('pinBtn');
  const configBtn = document.getElementById('configBtn');
  const popoutBtn = document.getElementById('popoutBtn');
  const groupTabs = document.getElementById('groupTabs');
  const membersList = document.getElementById('membersList');
  const myStatusSelect = document.getElementById('myStatus');
  const copyLogBtn = document.getElementById('copyLogBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const chatTimeline = document.getElementById('chatTimeline');
  const emptyNotice = document.getElementById('emptyNotice');
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const fileInput = document.getElementById('fileInput');
  const filePreview = document.getElementById('filePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const stampBtns = document.querySelectorAll('.stamp-btn');

  // モーダル要素
  const configModal = document.getElementById('configModal');
  const userNameInput = document.getElementById('userNameInput');
  const groupIdInput = document.getElementById('groupIdInput');
  const groupNameInput = document.getElementById('groupNameInput');
  const passcodeInput = document.getElementById('passcodeInput');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveConfigBtn = document.getElementById('saveConfigBtn');

  // アプリケーション状態 (LocalStorageで保存)
  let appState = JSON.parse(localStorage.getItem('micro_office_chat_state')) || {
    userName: '山田',
    userStatus: '🟢 在席',
    activeTab: 0,
    groups: [
      { id: 'default-1', name: '営業チーム', passcode: '1234' },
      { id: 'default-2', name: '開発Bチーム', passcode: '1234' },
      { id: 'default-3', name: '全体連絡用', passcode: '1234' }
    ],
    isPinned: false
  };

  let currentMessages = [];
  let attachedFile = null;

  // 通知許可の取得
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // 初期化 UI 反映
  function initUI() {
    userNameInput.value = appState.userName;
    myStatusSelect.value = appState.userStatus;
    updateTabsUI();
    applyPinState(appState.isPinned);
    connectCurrentGroup();
  }

  function saveState() {
    localStorage.setItem('micro_office_chat_state', JSON.stringify(appState));
  }

  // タブ描画の更新
  function updateTabsUI() {
    const tabs = groupTabs.querySelectorAll('.tab-btn');
    tabs.forEach((tab, index) => {
      if (appState.groups[index]) {
        tab.textContent = appState.groups[index].name;
        tab.dataset.groupId = appState.groups[index].id;
        if (index === appState.activeTab) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      }
    });
  }

  // 現在選択中のグループに接続
  function connectCurrentGroup() {
    const activeGroup = appState.groups[appState.activeTab];
    if (!activeGroup) return;

    socket.emit('join-group', {
      groupId: activeGroup.id,
      groupName: activeGroup.name,
      passcode: activeGroup.passcode,
      userName: appState.userName,
      userStatus: appState.userStatus
    });
  }

  // ピン留め状態の適用
  function applyPinState(isPinned) {
    appState.isPinned = isPinned;
    if (isPinned) {
      chatContainer.classList.add('pinned');
      pinBtn.classList.add('active');
      pinBtn.title = "ピン留め中 (常に最前面)";
    } else {
      chatContainer.classList.remove('pinned');
      pinBtn.classList.remove('active');
      pinBtn.title = "最前面にピン留め (ON/OFF)";
    }
    saveState();
  }

  // ピン留めトグル
  pinBtn.addEventListener('click', () => {
    applyPinState(!appState.isPinned);
  });

  // 小窓ポップアップ表示
  popoutBtn.addEventListener('click', () => {
    const width = 340;
    const height = 550;
    const left = window.screen.width - width - 20;
    const top = 40;
    window.open(window.location.href, 'MicroOfficeChatPopout', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no`);
  });

  // タブ切り替えイベント
  groupTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      const index = parseInt(e.target.dataset.groupIndex, 10);
      if (index !== appState.activeTab) {
        appState.activeTab = index;
        updateTabsUI();
        saveState();
        connectCurrentGroup();
      }
    }
  });

  // 設定ボタン
  configBtn.addEventListener('click', () => {
    const activeGroup = appState.groups[appState.activeTab];
    userNameInput.value = appState.userName;
    groupIdInput.value = activeGroup.id;
    groupNameInput.value = activeGroup.name;
    passcodeInput.value = activeGroup.passcode;
    configModal.style.display = 'flex';
  });

  closeModalBtn.addEventListener('click', () => {
    configModal.style.display = 'none';
  });

  saveConfigBtn.addEventListener('click', () => {
    appState.userName = userNameInput.value.trim() || '匿名';
    const activeGroup = appState.groups[appState.activeTab];
    activeGroup.id = groupIdInput.value.trim() || 'default-1';
    activeGroup.name = groupNameInput.value.trim() || 'グループ';
    activeGroup.passcode = passcodeInput.value.trim();

    saveState();
    updateTabsUI();
    configModal.style.display = 'none';
    connectCurrentGroup();
  });

  // ステータス変更
  myStatusSelect.addEventListener('change', (e) => {
    appState.userStatus = e.target.value;
    saveState();
    socket.emit('update-status', appState.userStatus);
  });

  // ファイル選択
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('ファイルサイズは8MB以下にしてください。');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        attachedFile = {
          name: file.name,
          type: file.type,
          data: evt.target.result
        };
        fileNameDisplay.textContent = `📎 ${file.name}`;
        filePreview.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  });

  removeFileBtn.addEventListener('click', () => {
    attachedFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
  });

  // メッセージ送信
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text && !attachedFile) return;

    socket.emit('send-message', {
      text: text,
      file: attachedFile
    });

    messageInput.value = '';
    attachedFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
  });

  // クイックスタンプ送信
  stampBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const stamp = btn.dataset.stamp;
      socket.emit('send-message', {
        stamp: stamp
      });
    });
  });

  // ログ全コピー 📋
  copyLogBtn.addEventListener('click', () => {
    if (currentMessages.length === 0) {
      alert('コピーするログがありません。');
      return;
    }

    const activeGroup = appState.groups[appState.activeTab];
    let textToCopy = `=== ${activeGroup.name} チャット全ログ (${new Date().toLocaleDateString()}) ===\n\n`;
    
    currentMessages.forEach(msg => {
      const content = msg.stamp ? `[ ${msg.stamp} ]` : msg.text;
      textToCopy += `[${msg.timestamp}] ${msg.senderName}: ${content}\n`;
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyLogBtn.textContent;
      copyLogBtn.textContent = '✅ コピー完了!';
      setTimeout(() => { copyLogBtn.textContent = originalText; }, 2000);
    }).catch(err => {
      alert('クリップボードへのコピーに失敗しました。');
    });
  });

  // 一括全消去 🧹
  clearAllBtn.addEventListener('click', () => {
    if (confirm('この部屋のチャットログを一括全消去しますか？\n（全員の画面からも削除されます）')) {
      socket.emit('clear-all-messages');
    }
  });

  // Socket.io イベント受信

  // グループ参加完了
  socket.on('joined-success', ({ group, members, messages }) => {
    renderMembers(members);
    renderMessages(messages);
  });

  // メンバーリスト更新
  socket.on('members-updated', (members) => {
    renderMembers(members);
  });

  // 新着メッセージ
  socket.on('new-message', (msg) => {
    currentMessages.push(msg);
    renderSingleMessage(msg);
    scrollToBottom();

    // 通知 (画面右下 OS通知)
    if (document.hidden || !document.hasFocus()) {
      showDesktopNotification(msg);
    }
  });

  // メッセージ削除
  socket.on('message-deleted', (msgId) => {
    currentMessages = currentMessages.filter(m => m.id !== msgId);
    const elem = document.getElementById(`msg_${msgId}`);
    if (elem) elem.remove();
    checkEmptyTimeline();
  });

  // メッセージ一括消去
  socket.on('messages-cleared', () => {
    currentMessages = [];
    chatTimeline.innerHTML = '';
    checkEmptyTimeline();
  });

  socket.on('error-msg', (errMsg) => {
    alert(errMsg);
  });

  // メンバー描画（先頭1文字アバター）
  function renderMembers(members) {
    membersList.innerHTML = '';
    members.forEach(mem => {
      const badge = document.createElement('div');
      badge.className = `avatar-badge ${mem.online ? 'online' : ''}`;
      badge.textContent = mem.avatarLetter || mem.name.charAt(0);
      badge.title = `${mem.name} (${mem.status})`;
      
      // ランダム系カラーグラデーション
      const colors = [
        'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'linear-gradient(135deg, #3b82f6, #06b6d4)',
        'linear-gradient(135deg, #10b981, #059669)',
        'linear-gradient(135deg, #f59e0b, #d97706)',
        'linear-gradient(135deg, #ec4899, #8b5cf6)'
      ];
      const colorIndex = Math.abs(hashCode(mem.name)) % colors.length;
      badge.style.background = colors[colorIndex];

      membersList.appendChild(badge);
    });
  }

  // タイムライン描画
  function renderMessages(messages) {
    currentMessages = messages || [];
    chatTimeline.innerHTML = '';
    if (currentMessages.length === 0) {
      checkEmptyTimeline();
      return;
    }
    currentMessages.forEach(msg => {
      renderSingleMessage(msg);
    });
    scrollToBottom();
  }

  function renderSingleMessage(msg) {
    if (emptyNotice) emptyNotice.style.display = 'none';

    const item = document.createElement('div');
    item.className = 'msg-item';
    item.id = `msg_${msg.id}`;

    let bodyContent = '';
    if (msg.stamp) {
      bodyContent = `<div class="msg-stamp">${escapeHTML(msg.stamp)}</div>`;
    } else if (msg.text) {
      bodyContent = `<div class="msg-text">${escapeHTML(msg.text)}</div>`;
    }

    if (msg.file) {
      if (msg.file.type.startsWith('image/')) {
        bodyContent += `<div style="margin-top:4px;"><img src="${msg.file.data}" style="max-width:100%; border-radius:4px;" /></div>`;
      } else {
        bodyContent += `<div style="margin-top:4px;"><a href="${msg.file.data}" download="${msg.file.name}" style="color:#818cf8; font-size:11px;">💾 ${escapeHTML(msg.file.name)}</a></div>`;
      }
    }

    item.innerHTML = `
      <div class="msg-avatar">${escapeHTML(msg.avatarLetter)}</div>
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-sender">${escapeHTML(msg.senderName)}</span>
          <span class="msg-time">${msg.timestamp}</span>
        </div>
        ${bodyContent}
        <button class="msg-delete-btn" onclick="deleteMsg('${msg.id}')" title="削除">✕</button>
      </div>
    `;

    chatTimeline.appendChild(item);
  }

  window.deleteMsg = function(msgId) {
    socket.emit('delete-message', msgId);
  };

  function checkEmptyTimeline() {
    if (chatTimeline.children.length === 0) {
      chatTimeline.innerHTML = `
        <div class="timeline-empty-notice" id="emptyNotice">
          💬 まだメッセージはありません。<br>下のクイックボタンで声を掛けましょう！
        </div>
      `;
    }
  }

  function scrollToBottom() {
    chatTimeline.scrollTop = chatTimeline.scrollHeight;
  }

  function showDesktopNotification(msg) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const activeGroup = appState.groups[appState.activeTab];
      const title = `⚡ [${activeGroup.name}] ${msg.senderName}さんからの声掛け`;
      const body = msg.stamp ? msg.stamp : (msg.text || 'ファイルが届きました');
      
      const n = new Notification(title, {
        body: body,
        icon: '/favicon.ico'
      });
      n.onclick = () => {
        window.focus();
      };
    }
  }

  function escapeHTML(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  // ドラッグ可能ヘッダー処理
  let isDragging = false;
  let offsetX, offsetY;
  const dragHeader = document.getElementById('dragHeader');
  
  dragHeader.addEventListener('mousedown', (e) => {
    if (e.target.closest('.header-actions')) return;
    isDragging = true;
    offsetX = e.clientX - chatContainer.getBoundingClientRect().left;
    offsetY = e.clientY - chatContainer.getBoundingClientRect().top;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      chatContainer.style.position = 'fixed';
      chatContainer.style.left = `${e.clientX - offsetX}px`;
      chatContainer.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // 初期化実行
  initUI();
});
