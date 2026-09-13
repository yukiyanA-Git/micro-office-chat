/**
 * yukiyanArt Cross-Promotion & Support Component (Cloud Sync Edition)
 * 全アプリ（Web / Desktop / Electron）共通 一元配信・自動共有対応
 * 
 * パターン β: 統合バー型（自社広告 ＋ 問合せボタン横並び / LoginManagerスタイル）
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.YukiyanArtPromo = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const CLOUD_JSON_URL = 'https://yukiyanart-feedback-hub.web.app/data/promo_apps.json';
  const HUB_BASE_URL = 'https://yukiyanart-feedback-hub.web.app/';

  // 【yukiyanArt 公式10作品マスターリスト】初期フォールバックデータ
  const DEFAULT_APPS = [
    { id: 'chronos', name: 'Chronos', subName: 'カレンダー＆付箋メモ', category: '生産性', desc: 'カレンダーとデスク付箋が美しく融合。毎日の予定と思考をスマート管理。', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/chronos.png', color: '#4F46E5', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=chronos' },
    { id: 'desk_chat', name: 'Desk Chat', subName: 'デスクチャット', category: 'コミュニケーション', desc: 'デスク上で快適に使えるクイックコミュニケーションツール', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/desk_chat.png', color: '#059669', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=desk_chat' },
    { id: 'login_manager', name: 'LoginManager', subName: 'ログイン＆パスワード管理', category: 'セキュリティ', desc: '安全なログイン情報管理とパスワード保存を行える暗号化セキュリティツール', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/pass_manager.png', color: '#D97706', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=login_manager' },
    { id: 'aura_gallery', name: 'AURAGALLERY', subName: 'デジタルアート美術室', category: 'アート・展示', desc: 'デジタルアート作品をバーチャル展示・鑑賞できるオンライン美術室Webアプリ', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/aura_gallery.jpg', color: '#EC4899', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=aura_gallery' },
    { id: 'strategy_note', name: 'STRATEGYNOTE', subName: '戦略思考・マインドマップメモ', category: '思考整理', desc: '戦略的な思考整理とマインドマップ風ノート作成Webアプリ', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/strategy_note.jpg', color: '#8B5CF6', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=strategy_note' },
    { id: 'sub_monitor_manager', name: 'SubMonitorManager', subName: 'マルチモニター仮想画面管理', category: 'PCユーティリティ', desc: 'サブモニターの配置・レイアウト・ショートカット切替を効率化するマルチモニター管理ツール', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/sub_monitor_manager.png', color: '#0284C7', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=sub_monitor_manager' },
    { id: 'input_nexus', name: 'InputNexus', subName: 'デバイス・キーバインド統合管理', category: 'ユーティリティ・ゲーム', desc: 'キーボード・マウス・コントローラーのリアルタイム入力可視化＆割り当て管理ツール', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/input_nexus.jpg', color: '#6366F1', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=input_nexus' },
    { id: 'widget_de_news', name: 'widgetでnews', subName: '常駐ニュース＆雨雲・PCモニター', category: 'ニュース・防災', desc: '画面端に常駐し、各種ニュース・雨雲レーダー・アメダス・PCモニターを可視化するウィジェット', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/widget_de_news.png', color: '#10B981', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=widget_de_news' },
    { id: 'numpre_shift', name: '動くナンプレ', subName: 'スライド×数独 脳トレパズル', category: 'ゲーム・パズル', desc: '3x3の数字ブロックを動かして解き明かす、新感覚のオンライン対戦＆脳トレ数独Webゲーム', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/numpre_shift.png', color: '#F59E0B', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=numpre_shift' },
    { id: 'hex_bastion', name: 'HEX BASTION', subName: '六角形グリッド防衛戦略', category: 'ゲーム・戦略', desc: 'ヘックス（六角形）盤面で拠点を防衛・攻略する本格タクティカル戦略ゲーム', iconUrl: 'https://yukiyanart-feedback-hub.web.app/assets/icons/hex_bastion.jpg', color: '#EF4444', hubUrl: 'https://yukiyanart-feedback-hub.web.app/?app_id=hex_bastion' }
  ];

  const CSS_STYLES = `
    .ya-unified-bar {
      --app-accent: #6366f1;
      box-sizing: border-box;
      width: 100%;
      background: linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 3px solid var(--app-accent, #6366f1);
      border-radius: 10px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      position: relative;
      margin: 8px 0;
      transition: all 0.25s ease;
      container-type: inline-size;
      container-name: ya_bar;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: left;
    }
    .ya-unified-bar * { box-sizing: border-box; }
    .ya-unified-bar:hover {
      border-color: rgba(255, 255, 255, 0.22);
      border-left-color: var(--app-accent, #6366f1);
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    }
    .ya-unified-body {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1 1 auto;
      min-width: 0;
    }
    .ya-unified-badge {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      font-size: 0.6rem;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 4px;
      letter-spacing: 0.04em;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .ya-unified-icon {
      width: 32px;
      height: 32px;
      border-radius: 7px;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.18);
      transition: opacity 0.2s ease;
    }
    .ya-unified-info {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }
    .ya-unified-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ya-unified-sub {
      font-size: 0.66rem;
      font-weight: 500;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ya-unified-desc {
      font-size: 0.66rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ya-unified-controls {
      display: flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }
    .ya-btn-nav {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #cbd5e1;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      padding: 0;
    }
    .ya-btn-nav:hover {
      background: var(--app-accent, #6366f1);
      color: white;
    }
    .ya-btn-cta {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(165, 180, 252, 0.35);
      color: #c7d2fe;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 0.68rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .ya-btn-cta:hover {
      background: #4f46e5;
      color: white;
    }
    .ya-divider {
      width: 1px;
      height: 22px;
      background: rgba(255, 255, 255, 0.15);
      flex-shrink: 0;
      margin: 0 1px;
    }
    .ya-btn-feedback {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(52, 211, 153, 0.45);
      color: #6ee7b7;
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .ya-btn-feedback:hover {
      background: rgba(16, 185, 129, 0.35);
      color: #ffffff;
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
      transform: translateY(-1px);
    }

    /* レスポンシブ縮小（コンパクト画面 / コンテナクエリ） */
    @container ya_bar (max-width: 580px) {
      .ya-unified-desc { display: none; }
    }
    @container ya_bar (max-width: 440px) {
      .ya-btn-nav { display: none; }
      .ya-unified-sub { display: none; }
      .ya-btn-cta { display: none; }
      .ya-unified-badge { display: none; }
    }
    @container ya_bar (max-width: 320px) {
      .ya-unified-bar { padding: 5px 6px; gap: 5px; }
      .ya-btn-feedback { padding: 4px 6px; font-size: 0.66rem; }
    }
    @media (max-width: 580px) {
      .ya-unified-desc { display: none; }
    }
    @media (max-width: 440px) {
      .ya-btn-nav { display: none; }
      .ya-unified-sub { display: none; }
      .ya-btn-cta { display: none; }
      .ya-unified-badge { display: none; }
    }
    @media (max-width: 320px) {
      .ya-unified-bar { padding: 5px 6px; gap: 5px; }
      .ya-btn-feedback { padding: 4px 6px; font-size: 0.66rem; }
    }
  `;

  function injectStyles() {
    if (document.getElementById('ya-unified-styles')) return;
    const style = document.createElement('style');
    style.id = 'ya-unified-styles';
    style.textContent = CSS_STYLES;
    document.head.appendChild(style);
  }

  return {
    /**
     * パターン β: 統合バー型（自社広告スライド ＋ 単体問合せボタン）
     */
    init: function (options) {
      injectStyles();

      const config = Object.assign({
        target: '#yukiyanart-promo-bar',
        currentAppId: null,
        intervalMs: 6000
      }, options);

      const targetElem = typeof config.target === 'string' ? document.querySelector(config.target) : config.target;
      if (!targetElem) return;

      let apps = DEFAULT_APPS.filter(a => !config.currentAppId || a.id !== config.currentAppId);
      let currentIndex = 0;
      let intervalTimer = null;

      const directHubFeedbackUrl = `${HUB_BASE_URL}?app_id=${config.currentAppId || 'all'}`;

      // HTML 骨格構築
      targetElem.innerHTML = `
        <div class="ya-unified-bar">
          <div class="ya-unified-body">
            <span class="ya-unified-badge">公式PR</span>
            <img class="ya-unified-icon" src="" alt="Icon">
            <div class="ya-unified-info">
              <div class="ya-unified-title">
                <span class="ya-name"></span>
                <span class="ya-unified-sub ya-sub"></span>
              </div>
              <div class="ya-unified-desc ya-desc"></div>
            </div>
            <div class="ya-unified-controls">
              <button class="ya-btn-nav ya-prev" title="前の自社アプリ">‹</button>
              <button class="ya-btn-nav ya-next" title="次の自社アプリ">›</button>
              <a class="ya-btn-cta ya-cta" href="${HUB_BASE_URL}" target="_blank" rel="noopener noreferrer">見る ↗</a>
            </div>
          </div>
          <div class="ya-divider"></div>
          <a class="ya-btn-feedback" href="${directHubFeedbackUrl}" target="_blank" rel="noopener noreferrer" title="このアプリのサポート・ご意見窓口を開く">
            <span>💬 ご意見・問合せ</span>
          </a>
        </div>
      `;

      const bar = targetElem.querySelector('.ya-unified-bar');
      const icon = targetElem.querySelector('.ya-unified-icon');
      const name = targetElem.querySelector('.ya-name');
      const sub = targetElem.querySelector('.ya-sub');
      const desc = targetElem.querySelector('.ya-desc');
      const cta = targetElem.querySelector('.ya-cta');
      const prevBtn = targetElem.querySelector('.ya-prev');
      const nextBtn = targetElem.querySelector('.ya-next');

      function update(idx) {
        if (apps.length === 0) return;
        currentIndex = (idx + apps.length) % apps.length;
        const app = apps[currentIndex];

        bar.style.setProperty('--app-accent', app.color || '#6366f1');
        icon.style.opacity = '0.3';
        icon.src = app.iconUrl || app.icon;
        icon.alt = app.name;
        icon.onload = () => { icon.style.opacity = '1'; };
        icon.onerror = () => {
          icon.src = `${HUB_BASE_URL}assets/icons/yukiyanart_logo.jpg`;
          icon.style.opacity = '1';
        };

        name.textContent = app.name;
        sub.textContent = `— ${app.subName}`;
        desc.textContent = app.desc;
        cta.href = app.hubUrl || `${HUB_BASE_URL}?app_id=${app.id}`;
        cta.title = `${app.name} の情報（Feedback & Release Hub）を開く`;
      }

      function startTimer() {
        if (intervalTimer) clearInterval(intervalTimer);
        intervalTimer = setInterval(() => { update(currentIndex + 1); }, config.intervalMs);
      }

      bar.addEventListener('mouseenter', () => { if (intervalTimer) clearInterval(intervalTimer); });
      bar.addEventListener('mouseleave', () => { startTimer(); });
      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); startTimer(); update(currentIndex - 1); });
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); startTimer(); update(currentIndex + 1); });

      update(0);
      startTimer();

      // クラウド最新マスターデータの非同期自動取得（一元配信）
      fetch(CLOUD_JSON_URL, { cache: 'no-cache' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            apps = data.filter(a => !config.currentAppId || a.id !== config.currentAppId);
            update(currentIndex);
          }
        })
        .catch(err => {
          console.log('[YukiyanArtPromo] Using offline fallback apps data:', err.message);
        });
    }
  };
}));
