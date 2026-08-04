const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7 // 10MBまでのファイル添付を許可
});

app.use(express.static(path.join(__dirname, 'public')));

// メモリ内データストア（ローカルスタンドアロン用）
// グループ情報: { [groupId]: { passcode: '1234', name: '営業チーム', members: { [socketId]: { name, avatarLetter, status, online: true } }, messages: [] } }
const groups = {
  'default-1': {
    id: 'default-1',
    name: '営業チーム',
    passcode: '1234',
    members: {},
    messages: []
  },
  'default-2': {
    id: 'default-2',
    name: '開発Bチーム',
    passcode: '1234',
    members: {},
    messages: []
  },
  'default-3': {
    id: 'default-3',
    name: '全体連絡用',
    passcode: '1234',
    members: {},
    messages: []
  }
};

io.on('connection', (socket) => {
  let currentGroup = null;
  let currentUser = null;

  // グループ参加
  socket.on('join-group', ({ groupId, groupName, passcode, userName, userStatus }) => {
    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        name: groupName || groupId,
        passcode: passcode || '',
        members: {},
        messages: []
      };
    }

    const group = groups[groupId];

    // パスコードチェック
    if (group.passcode && group.passcode !== passcode) {
      socket.emit('error-msg', 'パスコードが一致しません。');
      return;
    }

    // 前のグループを退室
    if (currentGroup && groups[currentGroup]) {
      socket.leave(currentGroup);
      delete groups[currentGroup].members[socket.id];
      io.to(currentGroup).emit('members-updated', Object.values(groups[currentGroup].members));
    }

    currentGroup = groupId;
    socket.join(groupId);

    // 苗字の頭文字（イニシャル）取得
    const avatarLetter = (userName || '名').trim().charAt(0).toUpperCase();

    currentUser = {
      id: socket.id,
      name: userName || '匿名',
      avatarLetter: avatarLetter,
      status: userStatus || '🟢 在席',
      online: true
    };

    group.members[socket.id] = currentUser;

    // 参加完了をクライアントへ通知
    socket.emit('joined-success', {
      group: { id: group.id, name: group.name },
      members: Object.values(group.members),
      messages: group.messages
    });

    // 他のメンバーに最新のメンバーリストを同期
    io.to(groupId).emit('members-updated', Object.values(group.members));
  });

  // ステータス更新（例: 🟢在席 / 🏃離席 / 📞会議中 / 🍱休憩）
  socket.on('update-status', (newStatus) => {
    if (currentGroup && groups[currentGroup] && currentUser) {
      currentUser.status = newStatus;
      groups[currentGroup].members[socket.id] = currentUser;
      io.to(currentGroup).emit('members-updated', Object.values(groups[currentGroup].members));
    }
  });

  // メッセージ送信
  socket.on('send-message', (data) => {
    if (!currentGroup || !groups[currentGroup] || !currentUser) return;

    const msgObj = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      senderId: socket.id,
      senderName: currentUser.name,
      avatarLetter: currentUser.avatarLetter,
      text: data.text || '',
      stamp: data.stamp || null,
      file: data.file || null, // { name, type, data }
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };

    const group = groups[currentGroup];
    group.messages.push(msgObj);

    // 最新50件のみ保持
    if (group.messages.length > 50) {
      group.messages.shift();
    }

    io.to(currentGroup).emit('new-message', msgObj);
  });

  // メッセージ個別削除
  socket.on('delete-message', (msgId) => {
    if (!currentGroup || !groups[currentGroup]) return;
    const group = groups[currentGroup];
    group.messages = group.messages.filter(m => m.id !== msgId);
    io.to(currentGroup).emit('message-deleted', msgId);
  });

  // 一括全消去
  socket.on('clear-all-messages', () => {
    if (!currentGroup || !groups[currentGroup]) return;
    groups[currentGroup].messages = [];
    io.to(currentGroup).emit('messages-cleared');
  });

  // 切断（退室）
  socket.on('disconnect', () => {
    if (currentGroup && groups[currentGroup]) {
      delete groups[currentGroup].members[socket.id];
      io.to(currentGroup).emit('members-updated', Object.values(groups[currentGroup].members));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ミニマルオフィスチャット サーバー起動完了！`);
  console.log(`💻 ローカルアクセス: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
