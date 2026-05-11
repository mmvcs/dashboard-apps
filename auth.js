// ============================================================
// MMV Travel Group — Zoho OAuth Auth Library
// Include this script on every protected app page
// ============================================================

const ZohoAuth = (() => {

  const CONFIG = {
    clientId:     '1000.IH4FU0AI7EMGT4KW6DZ2QLEIQR0TXQ',
    redirectUri:  'https://project-4nnzv.vercel.app/callback.html',
    authEndpoint: 'https://accounts.zoho.com/oauth/v2/auth',
    scope:        'ZohoConnect.portals.READ ZohoConnect.feeds.READ',
    tokenKey:     'mmv_zoho_token',
    userKey:      'mmv_zoho_user',
  };

  // ── Helpers ─────────────────────────────────────────────

  function generateState() {
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('mmv_oauth_state', state);
    return state;
  }

  function getStoredToken() {
    try {
      const raw = sessionStorage.getItem(CONFIG.tokenKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() > data.expiresAt) {
        sessionStorage.removeItem(CONFIG.tokenKey);
        return null;
      }
      return data;
    } catch { return null; }
  }

  function getStoredUser() {
    try {
      const raw = sessionStorage.getItem(CONFIG.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  // ── Public API ───────────────────────────────────────────

  function isAuthenticated() {
    return !!getStoredToken();
  }

  function getUser() {
    return getStoredUser();
  }

  function getToken() {
    const data = getStoredToken();
    return data ? data.token : null;
  }

  function login(returnPath) {
    // Save where to return after login
    sessionStorage.setItem('mmv_return_path', returnPath || window.location.pathname);

    const params = new URLSearchParams({
      response_type: 'token',
      client_id:     CONFIG.clientId,
      redirect_uri:  CONFIG.redirectUri,
      scope:         CONFIG.scope,
      state:         generateState(),
      access_type:   'online',
      prompt:        'consent',
    });

    // Break out of Zoho Connect iframe — Zoho blocks its own login inside iframes
    window.top.location.href = `${CONFIG.authEndpoint}?${params.toString()}`;
  }

  function logout() {
    sessionStorage.removeItem(CONFIG.tokenKey);
    sessionStorage.removeItem(CONFIG.userKey);
    sessionStorage.removeItem('mmv_return_path');
    window.location.reload();
  }

  // Call this on every protected page — redirects to Zoho if not logged in
  function requireAuth(onSuccess) {
    if (isAuthenticated()) {
      if (typeof onSuccess === 'function') onSuccess(getUser());
      return;
    }
    // Not authenticated — show login screen
    showLoginScreen();
  }

  // Store token and user info after callback
  function storeSession(token, expiresIn, userInfo) {
    const session = {
      token,
      expiresAt: Date.now() + (parseInt(expiresIn) * 1000),
    };
    sessionStorage.setItem(CONFIG.tokenKey, JSON.stringify(session));
    if (userInfo) {
      sessionStorage.setItem(CONFIG.userKey, JSON.stringify(userInfo));
    }
  }

  // ── Login Screen UI ──────────────────────────────────────

  function showLoginScreen() {
    document.body.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: #fdf9f0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .login-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(15,15,26,0.10);
          padding: 48px 40px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #0f0f1a, #2d2d7a);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
          box-shadow: 0 3px 12px rgba(15,15,26,0.18);
        }
        .login-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .login-sub {
          font-size: 0.88rem;
          color: #6b6b8a;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .btn-login {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #0f0f1a, #2d2d7a);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 14px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.18s, transform 0.18s;
          box-shadow: 0 3px 12px rgba(15,15,26,0.18);
          text-decoration: none;
        }
        .btn-login:hover { opacity: 0.9; transform: translateY(-1px); }
        .login-note {
          margin-top: 20px;
          font-size: 0.75rem;
          color: #9999b3;
        }
      </style>
      <div class="login-card">
        <div class="login-icon">✈️</div>
        <div class="login-title">MMV Travel Group</div>
        <p class="login-sub">Sign in with your Zoho Connect account to access this tool.</p>
        <button class="btn-login" onclick="ZohoAuth.login()">
          Sign in with Zoho
        </button>
        <p class="login-note">Use your existing Zoho Connect credentials.<br>Contact the home office if you need access.</p>
      </div>
    `;
  }

  return {
    isAuthenticated,
    getUser,
    getToken,
    login,
    logout,
    requireAuth,
    storeSession,
    CONFIG,
  };

})();
