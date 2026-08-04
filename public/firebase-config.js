// Firebase Realtime Database を利用する場合の設定ファイル例
// 今あるFirebaseプロジェクトの「プロジェクト設定」から取得したキーを貼り付けることで、
// サーバーを介さない完全クラウド同期型チャットとしても動作可能です。

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 使用方法:
// index.html で firebase-app.js, firebase-database.js を読み込み、
// この設定を用いて initializeApp(firebaseConfig) することでFirebase化できます。
