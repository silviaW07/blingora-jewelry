/**
 * Auto-login script
 *
 * Usage:
 * 1. Parent postMessage: iframe.contentWindow.postMessage({ type: 'auto-login', account: 'xxx', password: 'xxx' }, '*')
 * 2. Browser console: window.__autoLogin('account', 'password')
 *
 * Login success reporting:
 * - On success, send message to parent: { type: 'auto-login-success', account, role, loginPath, currentPath, timestamp }
 *
 * Logout reporting:
 * - Auto-detect: poll Session store in localStorage; when token is cleared, report to parent
 * - Manual: window.__notifyLogout({ account, role, ...extras })
 * - Parent listener: window.addEventListener('message', e => { if (e.data.type === 'auto-logout') ... })
 * - Payload: { type: 'auto-logout', account, role, loginPath, loggedOutStores, timestamp }
 *
 * Login page data-auto attributes:
 * - data-auto="account"    → account input
 * - data-auto="password"   → password input
 * - data-auto="captcha"    → captcha input (optional, auto-fills 123456)
 * - data-auto="role"       → role selector (optional, select/radio/button)
 * - data-auto="agreement"  → agreement checkbox (optional, auto-checked if present)
 *                            Supports: input[type=checkbox], shadcn Checkbox, wrapper with nested checkbox
 * - data-auto="submit"     → login button
 *
 * Role selector element types:
 * - <select data-auto="role">                                    // dropdown
 * - <input type="radio" data-auto="role" value="PET_OWNER" />   // radio
 * - <button data-auto="role" data-value="PET_OWNER">            // button group
 */
(function () {
  var TYPING_DELAY = 80;
  var STEP_DELAY = 800;
  var LOGIN_SESSION_KEY = '__autoLogin_session';
  var PENDING_LOGIN_KEY = '__autoLogin_pending';

  function getThemeColor() {
    var style = getComputedStyle(document.documentElement);
    var primary = style.getPropertyValue('--color-primary').trim();
    if (primary && /^\d+,\s*[\d.]+%?,\s*[\d.]+%?$/.test(primary)) {
      return 'hsl(' + primary + ')';
    }
    return primary || '#0E4A8A';
  }

  function showToast(msg) {
    var el = document.createElement('div');
    el.textContent = msg;
    var bg = getThemeColor();
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;padding:10px 24px;background:' + bg + ';color:#fff;border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(el);
    return el;
  }

  function removeToast(el) {
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(function () { el.remove(); }, 300);
  }

  function setReactValue(el, value) {
    if (!el || !el.dispatchEvent) return;
    var proto = Object.getPrototypeOf(el);
    var desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) {
      try {
        desc.set.call(el, value);
      } catch (e) {
        try { el.value = value; } catch (e2) {}
      }
    } else {
      try { el.value = value; } catch (e) {}
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function typeInto(el, text) {
    return new Promise(function (resolve) {
      el.focus();
      var i = 0;
      var timer = setInterval(function () {
        i++;
        setReactValue(el, text.slice(0, i));
        if (i >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, TYPING_DELAY);
    });
  }

  function delay(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function getUrlParts(targetPath) {
    try {
      var url = new URL(targetPath, window.location.origin);
      return {
        origin: url.origin,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash
      };
    } catch (e) {
      var raw = String(targetPath || '');
      var hashIndex = raw.indexOf('#');
      var hash = hashIndex >= 0 ? raw.slice(hashIndex) : '';
      if (hashIndex >= 0) raw = raw.slice(0, hashIndex);
      var searchIndex = raw.indexOf('?');
      var search = searchIndex >= 0 ? raw.slice(searchIndex) : '';
      if (searchIndex >= 0) raw = raw.slice(0, searchIndex);
      return {
        origin: window.location.origin,
        pathname: raw || '/',
        search: search,
        hash: hash
      };
    }
  }

  function normalizeBasePath(basePath) {
    if (!basePath || basePath === '/') return '';
    var parts = getUrlParts(basePath);
    var pathname = parts.pathname || '';
    pathname = '/' + pathname.replace(/^\/+|\/+$/g, '');
    return pathname === '/' ? '' : pathname;
  }

  function getCurrentAppBase() {
    var dynamicBase = normalizeBasePath(window.__dynamic_base__);
    if (dynamicBase) return dynamicBase;

    var base = document.querySelector('base');
    if (base && base.getAttribute('href')) {
      var basePath = normalizeBasePath(base.getAttribute('href'));
      if (basePath) return basePath;
    }

    var firstSegment = (window.location.pathname || '').split('/').filter(Boolean)[0];
    return isProjectRuntimeSegment(firstSegment) ? '/' + firstSegment : '';
  }

  function getCurrentAppBaseId() {
    return (getCurrentAppBase() || 'root').replace(/^\//, '').replace(/[^\w.-]/g, '_');
  }

  function getScopedStorageKey(baseKey) {
    return baseKey + ':' + getCurrentAppBaseId();
  }

  function isProjectRuntimeSegment(segment) {
    return /^(\d+)?PROJ_/i.test(segment || '');
  }

  function hasForeignProjectRuntimeBase(targetPath) {
    if (!targetPath) return false;
    var parts = getUrlParts(targetPath);
    if (parts.origin && parts.origin !== window.location.origin) return false;

    var segments = (parts.pathname || '').split('/').filter(Boolean);
    if (!segments.length || !isProjectRuntimeSegment(segments[0])) return false;

    var currentBaseId = getCurrentAppBaseId();
    return segments[0] !== currentBaseId;
  }

  function buildPath(pathname, search, hash) {
    var path = pathname || '/';
    if (path.charAt(0) !== '/') path = '/' + path;
    return path + (search || '') + (hash || '');
  }

  function resolveAppPath(targetPath) {
    if (!targetPath) return targetPath;

    var raw = String(targetPath);
    var parts = getUrlParts(raw);
    if (parts.origin && parts.origin !== window.location.origin) return raw;

    var currentBase = getCurrentAppBase();
    var pathname = parts.pathname || '/';
    if (pathname.charAt(0) !== '/') pathname = '/' + pathname;

    if (!currentBase) return buildPath(pathname, parts.search, parts.hash);

    if (pathname === currentBase || pathname.indexOf(currentBase + '/') === 0) {
      return buildPath(pathname, parts.search, parts.hash);
    }

    var segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && isProjectRuntimeSegment(segments[0])) {
      segments.shift();
    }

    var suffix = segments.join('/');
    var resolvedPathname = currentBase + (suffix ? '/' + suffix : '/');
    return buildPath(resolvedPathname, parts.search, parts.hash);
  }

  function isPathInCurrentApp(targetPath) {
    if (!targetPath) return true;
    var parts = getUrlParts(targetPath);
    if (parts.origin && parts.origin !== window.location.origin) return false;

    var currentBase = getCurrentAppBase();
    if (!currentBase) return true;

    return parts.pathname === currentBase || parts.pathname.indexOf(currentBase + '/') === 0;
  }

  function stripCurrentBase(targetPath) {
    var parts = getUrlParts(targetPath);
    var pathname = parts.pathname || '/';
    var currentBase = getCurrentAppBase();
    if (currentBase && pathname === currentBase) return '/';
    if (currentBase && pathname.indexOf(currentBase + '/') === 0) {
      return pathname.slice(currentBase.length) || '/';
    }
    return pathname;
  }

  function isCurrentLoginPath(loginPath) {
    var currentRoute = stripCurrentBase(window.location.pathname).replace(/\/+$/, '') || '/';
    var loginRoute = stripCurrentBase(loginPath).replace(/\/+$/, '') || '/';
    return currentRoute === loginRoute || currentRoute.indexOf(loginRoute + '/') === 0;
  }

  function isStoragePayloadForCurrentApp(payload) {
    if (!payload) return false;
    var currentBase = getCurrentAppBase();
    if (payload.appBase && normalizeBasePath(payload.appBase) !== currentBase) return false;
    if (payload.loginPath && !isPathInCurrentApp(payload.loginPath)) return false;
    return true;
  }

  function writeScopedStorage(baseKey, payload) {
    try {
      var nextPayload = payload || {};
      nextPayload.appBase = getCurrentAppBase();
      sessionStorage.setItem(getScopedStorageKey(baseKey), JSON.stringify(nextPayload));
      sessionStorage.removeItem(baseKey);
    } catch (e) {}
  }

  function readScopedStorage(baseKey) {
    var keys = [getScopedStorageKey(baseKey), baseKey];
    for (var i = 0; i < keys.length; i++) {
      try {
        var raw = sessionStorage.getItem(keys[i]);
        if (!raw) continue;
        var payload = JSON.parse(raw);
        if (baseKey === PENDING_LOGIN_KEY && keys[i] === baseKey && (!payload || !payload.appBase)) {
          sessionStorage.removeItem(keys[i]);
          console.warn('[auto-login] Discarded legacy unscoped pending login payload:', keys[i]);
          continue;
        }
        if (payload && hasForeignProjectRuntimeBase(payload.loginPath)) {
          sessionStorage.removeItem(keys[i]);
          console.warn('[auto-login] Discarded stale login payload from another project runtime:', keys[i], payload && payload.loginPath);
          continue;
        }
        if (payload && payload.loginPath) {
          payload.loginPath = resolveAppPath(payload.loginPath);
        }
        if (payload && payload.returnUrl && hasForeignProjectRuntimeBase(payload.returnUrl)) {
          payload.returnUrl = null;
        }
        if (isStoragePayloadForCurrentApp(payload)) return payload;
        sessionStorage.removeItem(keys[i]);
        console.warn('[auto-login] Discarded stale storage payload for another app base:', keys[i], payload && payload.loginPath);
      } catch (e) {
        try { sessionStorage.removeItem(keys[i]); } catch (e2) {}
      }
    }
    return null;
  }

  function removeScopedStorage(baseKey) {
    try {
      sessionStorage.removeItem(getScopedStorageKey(baseKey));
      sessionStorage.removeItem(baseKey);
    } catch (e) {}
  }

  function normalizeNavigationPath(targetPath) {
    try {
      return new URL(targetPath, window.location.origin).pathname;
    } catch (e) {
      return targetPath;
    }
  }

  function dispatchRouteChange() {
    try {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state || null }));
    } catch (e) {
      try {
        var popstate = document.createEvent('Event');
        popstate.initEvent('popstate', true, true);
        window.dispatchEvent(popstate);
      } catch (e2) {}
    }

    try {
      window.dispatchEvent(new Event('pushState'));
    } catch (e) {}
  }

  function trySpaNavigate(targetPath) {
    if (!targetPath) return false;

    var globalWindow = window;
    var attempts = [
      function () {
        if (typeof globalWindow.__NAVIGATE__ === 'function') {
          globalWindow.__NAVIGATE__(targetPath);
          return true;
        }
        return false;
      },
      function () {
        if (typeof globalWindow.navigate === 'function') {
          globalWindow.navigate(targetPath);
          return true;
        }
        return false;
      },
      function () {
        if (globalWindow.next && globalWindow.next.router && typeof globalWindow.next.router.push === 'function') {
          globalWindow.next.router.push(targetPath);
          return true;
        }
        return false;
      },
      function () {
        if (globalWindow.__REACT_ROUTER__ && typeof globalWindow.__REACT_ROUTER__.navigate === 'function') {
          globalWindow.__REACT_ROUTER__.navigate(targetPath);
          return true;
        }
        return false;
      },
      function () {
        if (!window.history || typeof window.history.pushState !== 'function') return false;
        var normalizedTarget = normalizeNavigationPath(targetPath);
        var currentPath = window.location.pathname;
        if (window.location.search) currentPath += window.location.search;
        if (window.location.hash) currentPath += window.location.hash;
        if (currentPath === normalizedTarget || window.location.pathname === normalizedTarget) {
          return true;
        }
        window.history.pushState(null, '', targetPath);
        dispatchRouteChange();
        return true;
      }
    ];

    for (var i = 0; i < attempts.length; i++) {
      try {
        if (attempts[i]()) return true;
      } catch (e) {
        console.warn('[auto-login] SPA navigation attempt failed:', e);
      }
    }

    return false;
  }

  function navigateWithSpaFallback(targetPath, options) {
    if (!targetPath) return false;

    var resolvedTarget = targetPath;
    try {
      var targetUrl = new URL(targetPath, window.location.origin);
      if (targetUrl.origin !== window.location.origin) {
        window.location.href = targetPath;
        return false;
      }
      resolvedTarget = targetUrl.pathname + targetUrl.search + targetUrl.hash;
    } catch (e) {}

    var spaNavigated = trySpaNavigate(resolvedTarget);
    if (!spaNavigated) {
      window.location.href = resolvedTarget;
      return false;
    }

    if (options && typeof options.verify === 'function') {
      var fallbackDelay = typeof options.fallbackDelay === 'number' ? options.fallbackDelay : 2000;
      setTimeout(function () {
        var verified = false;
        try {
          verified = !!options.verify();
        } catch (e) {}
        if (!verified) {
          window.location.href = resolvedTarget;
        }
      }, fallbackDelay);
    }

    return true;
  }

  // ===== Logout reporting =====

  /**
   * Scan all Session stores in localStorage and collect entries with token
   * zustand persist format: { state: { token: '...', role: '...', ... }, version: 0 }
   */
  function scanSessionTokens() {
    var result = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.toLowerCase().indexOf('session') === -1) continue;
        try {
          var parsed = JSON.parse(localStorage.getItem(key));
          if (parsed && parsed.state && parsed.state.token) {
            result.push({
              storeKey: key,
              token: parsed.state.token,
              role: parsed.state.role || null,
              username: parsed.state.username || parsed.state.user_name || null,
              userId: parsed.state.user_id || parsed.state.userId || null
            });
          }
        } catch (e) {}
      }
    } catch (e) {}
    return result;
  }

  /**
   * Save current login session (call after login success)
   * Also snapshot session tokens in localStorage for later logout detection
   */
  function saveLoginSession(account, role, loginPath) {
    try {
      // Delay before snapshot so zustand persist has written to localStorage
      setTimeout(function () {
        var tokenSnapshot = scanSessionTokens();
        writeScopedStorage(LOGIN_SESSION_KEY, {
          account: account,
          role: role || null,
          loginPath: loginPath,
          loginTime: Date.now(),
          tokenSnapshot: tokenSnapshot // token snapshot at login time
        });
      }, 1000);
    } catch (e) {}
  }

  /**
   * Get saved login session
   */
  function getLoginSession() {
    try {
      return readScopedStorage(LOGIN_SESSION_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear login session
   */
  function clearLoginSession() {
    try {
      removeScopedStorage(LOGIN_SESSION_KEY);
    } catch (e) {}
  }

  /**
   * Remove only the reported stores from session tokenSnapshot; clear full session only when snapshot is empty.
   * So when multiple independent sessions (e.g. AdminSession / AppUserSession) log out separately, each gets one report.
   */
  function removeStoresFromLoginSession(session, storeKeys) {
    if (!session || !session.tokenSnapshot || !storeKeys || !storeKeys.length) return;
    try {
      var keySet = {};
      for (var k = 0; k < storeKeys.length; k++) keySet[storeKeys[k]] = true;
      var newSnapshot = [];
      for (var i = 0; i < session.tokenSnapshot.length; i++) {
        if (!keySet[session.tokenSnapshot[i].storeKey]) {
          newSnapshot.push(session.tokenSnapshot[i]);
        }
      }
      if (newSnapshot.length === 0) {
        clearLoginSession();
      } else {
        writeScopedStorage(LOGIN_SESSION_KEY, {
          account: session.account,
          role: session.role,
          loginPath: session.loginPath,
          loginTime: session.loginTime,
          tokenSnapshot: newSnapshot
        });
      }
    } catch (e) {}
  }

  /**
   * Detect if session token has been cleared (logout detection core)
   * Compare token snapshot at login with current localStorage tokens
   * Returns list of logged-out session entries
   */
  function detectLoggedOutSessions(session) {
    if (!session || !session.tokenSnapshot || !session.tokenSnapshot.length) return [];

    var loggedOut = [];
    for (var i = 0; i < session.tokenSnapshot.length; i++) {
      var snap = session.tokenSnapshot[i];
      try {
        var raw = localStorage.getItem(snap.storeKey);
        if (!raw) {
          // key was removed → logged out
          loggedOut.push(snap);
          continue;
        }
        var parsed = JSON.parse(raw);
        if (!parsed || !parsed.state || !parsed.state.token) {
          // token field cleared → logged out
          loggedOut.push(snap);
        }
      } catch (e) {
        // parse failure treated as logout
        loggedOut.push(snap);
      }
    }
    return loggedOut;
  }

  /**
   * Report logout to parent window
   * @param {object} info - Logout info { account, role, loginPath, ...extras }
   */
  function notifyParentLogout(info) {
    var payload = {
      type: 'auto-logout',
      account: (info && info.account) || null,
      role: (info && info.role) || null,
      loginPath: (info && info.loginPath) || null,
      timestamp: Date.now()
    };

    // Attach extra fields (exclude internal snapshot)
    if (info) {
      for (var key in info) {
        if (info.hasOwnProperty(key) && !(key in payload) && key !== 'tokenSnapshot') {
          payload[key] = info[key];
        }
      }
    }

    console.log('[auto-login] Report logout:', payload);

    // Send to parent window
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
    } catch (e) {
      console.warn('[auto-login] postMessage to parent failed:', e);
    }

    // Also send to window.opener (for window.open)
    try {
      if (window.opener) {
        window.opener.postMessage(payload, '*');
      }
    } catch (e) {}
  }

  /**
   * Report login success to parent window
   * @param {object} info - Login info { account, role, loginPath, ...extras }
   */
  function notifyParentLoginSuccess(info) {
    var payload = {
      type: 'auto-login-success',
      account: (info && info.account) || null,
      role: (info && info.role) || null,
      loginPath: (info && info.loginPath) || null,
      currentPath: window.location.pathname || null,
      timestamp: Date.now()
    };

    // Attach extra fields
    if (info) {
      for (var key in info) {
        if (info.hasOwnProperty(key) && !(key in payload)) {
          payload[key] = info[key];
        }
      }
    }

    console.log('[auto-login] Report login success:', payload);

    // Send to parent window (iframe host)
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
    } catch (e) {
      console.warn('[auto-login] postMessage login success to parent failed:', e);
    }

    // Also send to window.opener (for window.open)
    try {
      if (window.opener) {
        window.opener.postMessage(payload, '*');
      }
    } catch (e) {}
  }

  function getEl(key) {
    var el = document.querySelector('[data-auto="' + key + '"]');
    if (!el) return null;
    // 若 data-auto 标在包装元素上，取内部的 input/textarea/select，避免 Illegal invocation 且能正确填值
    // 不取内部的 button/div（如 tab、可点击块），它们应作为整体点击，所以只查 input/textarea/select
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT' && el.tagName !== 'BUTTON') {
      var input = el.querySelector('input, textarea, select');
      if (input) return input;
    }
    return el;
  }

  /**
   * Select role (supports select, radio, button, Radix Tabs, etc.)
   */
  function selectRole(roleValue) {
    var normalizedRole = String(roleValue || '').trim().toUpperCase();
    function normalize(v) {
      return String(v == null ? '' : v).trim().toUpperCase();
    }
    function matchRole(candidate) {
      return normalize(candidate) === normalizedRole;
    }
    function triggerChoice(el) {
      if (!el) return;
      var target = el;
      // Prefer clicking <label for="..."> for custom radio implementations (e.g. Radix/shadcn)
      if (el.id) {
        var linkedLabel = document.querySelector('label[for="' + el.id + '"]');
        if (linkedLabel) target = linkedLabel;
      }
      try { target.focus(); } catch (e) {}
      try { target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); } catch (e) {}
      try { target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
      try { target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
      try { target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true })); } catch (e) {}
      try { target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
      try { target.click(); } catch (e) {}
    }

    // 0. Try shadcn/Radix Select via React fiber: find onValueChange and call it directly.
    //    This works when data-auto="role" is on the <Select> component (not a native <select>).
    //    SelectContent renders in a portal so DOM click simulation is unreliable.
    var roleEl = document.querySelector('[data-auto="role"]');
    if (roleEl) {
      var fiberKey = Object.keys(roleEl).find(function (k) {
        return k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance');
      });
      if (fiberKey) {
        var fiber = roleEl[fiberKey];
        var onValueChange = null;
        var cur = fiber;
        var depth = 0;
        while (cur && depth < 40) {
          var props = cur.memoizedProps || cur.pendingProps;
          if (props && typeof props.onValueChange === 'function') {
            onValueChange = props.onValueChange;
            break;
          }
          cur = cur.return;
          depth++;
        }
        if (onValueChange) {
          try {
            onValueChange(roleValue);
            console.log('[auto-login] Role selected via React fiber onValueChange:', roleValue);
            return true;
          } catch (e) {
            console.warn('[auto-login] fiber onValueChange failed:', e);
          }
        }
      }
    }

    // 1. Try select dropdown
    var selectEl = getEl('role');
    if (selectEl && selectEl.tagName === 'SELECT') {
      setReactValue(selectEl, roleValue);
      console.log('[auto-login] Role selected via <select>');
      return true;
    }

    // 2. Try radio buttons (data-auto on radio itself)
    var radioEl = document.querySelector('[data-auto="role"][value="' + roleValue + '"]');
    if (radioEl && radioEl.type === 'radio') {
      triggerChoice(radioEl);
      console.log('[auto-login] Role selected via radio button');
      return true;
    }
    // 2b. data-auto="role" on wrapper, role items inside (prefer role="radio"/button; avoid hidden bubble input)
    var roleContainer = document.querySelector('[data-auto="role"]');
    if (roleContainer) {
      var radioInWrapper = roleContainer.querySelector('[role="radio"][value="' + roleValue + '"], button[value="' + roleValue + '"], [data-auto="role"][data-value="' + roleValue + '"], [data-auto="role"][data-role="' + roleValue + '"]');
      if (radioInWrapper) {
        triggerChoice(radioInWrapper);
        return true;
      }
    }

    // 3. Try button group (data-value or data-role) - direct match
    var btnEl = document.querySelector('[data-auto="role"][data-value="' + roleValue + '"]') ||
                document.querySelector('[data-auto="role"][data-role="' + roleValue + '"]');
    if (btnEl) {
      triggerChoice(btnEl);
      console.log('[auto-login] Role selected via direct button match');
      return true;
    }

    // 4. Fallback: find all data-auto="role" and match by text
    var roleEls = document.querySelectorAll('[data-auto="role"]');
    for (var i = 0; i < roleEls.length; i++) {
      var el = roleEls[i];
      if (matchRole(el.textContent) || 
          matchRole(el.getAttribute('value')) ||
          matchRole(el.getAttribute('data-value')) ||
          matchRole(el.getAttribute('data-role'))) {
        triggerChoice(el);
        console.log('[auto-login] Role selected via text/value match');
        return true;
      }
    }

    // 5. Search within data-auto="role" parent for matching children
    console.log('[auto-login] Searching within data-auto="role" containers...');
    var roleContainers = document.querySelectorAll('[data-auto="role"]');
    console.log('[auto-login] Found', roleContainers.length, 'role containers');
    
    for (var j = 0; j < roleContainers.length; j++) {
      var container = roleContainers[j];
      console.log('[auto-login] Checking container', j, ':', container.tagName);
      
      // Find all clickable children (avoid hidden input[type=radio] generated by UI libraries)
      var children = container.querySelectorAll('button, a, [role="tab"], [role="radio"], [data-slot="radio-group-item"]');
      console.log('[auto-login] Found', children.length, 'clickable children in container', j);
      
      for (var k = 0; k < children.length; k++) {
        var child = children[k];
        var childValue = child.getAttribute('value');
        var childDataValue = child.getAttribute('data-value');
        var childDataRole = child.getAttribute('data-role');
        var childText = child.textContent.trim();
        
        console.log('[auto-login] Child', k, ':', {
          tag: child.tagName,
          value: childValue,
          dataValue: childDataValue,
          dataRole: childDataRole,
          text: childText
        });
        
        var matchValue = matchRole(childValue) ||
                        matchRole(childDataValue) ||
                        matchRole(childDataRole);
        var matchText = matchRole(childText);
        
        if (matchValue || matchText) {
          console.log('[auto-login] Match found! Clicking child element');
          // Trigger comprehensive events for React/Radix UI
          triggerChoice(child);
          return true;
        }
      }
    }

    // 6. Fallback for shadcn/Radix Select where data-auto="role" is on a React component
    //    that does NOT forward unknown props to DOM. The attribute won't appear in DOM at all.
    //    Strategy: find the nearest form or card container around account/password inputs,
    //    then walk all DOM elements inside it looking for a React fiber with onValueChange.
    console.log('[auto-login] Trying React fiber fallback for shadcn/Radix Select...');
    var anchorEl = getEl('account') || getEl('password') || getEl('submit');
    if (anchorEl) {
      // Walk up to find a reasonable container (form, card, section, or 5 levels up)
      var formContainer = anchorEl.closest('form') || anchorEl.closest('[class*="card"], [class*="Card"], section');
      if (!formContainer) {
        formContainer = anchorEl;
        for (var _up = 0; _up < 5 && formContainer.parentElement; _up++) {
          formContainer = formContainer.parentElement;
        }
      }
      // Scan all elements in the container for a fiber with onValueChange
      var allEls = formContainer.querySelectorAll('*');
      for (var _fi = 0; _fi < allEls.length; _fi++) {
        var _el = allEls[_fi];
        var _fiberKey = Object.keys(_el).find(function (k) {
          return k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance');
        });
        if (!_fiberKey) continue;
        var _fiber = _el[_fiberKey];
        var _cur = _fiber;
        var _depth = 0;
        while (_cur && _depth < 15) {
          var _props = _cur.memoizedProps || _cur.pendingProps;
          if (_props && typeof _props.onValueChange === 'function' && _props.value !== undefined) {
            // Verify this looks like a role/select component (has string value, not a checkbox etc.)
            if (typeof _props.value === 'string' || _props.value === '') {
              try {
                _props.onValueChange(roleValue);
                console.log('[auto-login] Role selected via fiber scan onValueChange:', roleValue);
                return true;
              } catch (_e) {
                console.warn('[auto-login] fiber scan onValueChange failed:', _e);
              }
            }
          }
          _cur = _cur.return;
          _depth++;
        }
      }
    }

    console.warn('[auto-login] Role selector not found for value:', roleValue);
    return false;
  }

  /**
   * Resolve loginPath to full path (SPA subpath deployment)
   * e.g. SPA at /PROJ_abc123/, loginPath /login → /PROJ_abc123/login
   */
  function resolveLoginPath(loginPath) {
    return resolveAppPath(loginPath);
  }

  /**
   * SPA navigation first: avoid full iframe reload/flicker.
   * Fallback to full reload when cross-origin or unsupported.
   */
  function navigateWithoutReload(targetUrl, replace) {
    function dispatchNavigationEvents(state, methodName) {
      // Some runtimes listen to custom history events rather than popstate.
      try { window.dispatchEvent(new Event(methodName)); } catch (e) {}
      try { window.dispatchEvent(new Event('locationchange')); } catch (e) {}
      try {
        window.dispatchEvent(new PopStateEvent('popstate', { state: state }));
      } catch (e) {
        try {
          var evt = document.createEvent('PopStateEvent');
          evt.initPopStateEvent('popstate', true, true, state);
          window.dispatchEvent(evt);
        } catch (e2) {
          try { window.dispatchEvent(new Event('popstate')); } catch (e3) {}
        }
      }
    }

    try {
      var current = new URL(window.location.href);
      var next = new URL(targetUrl, current.href);

      // Cross-origin must use full navigation
      if (next.origin !== current.origin) {
        window.location.href = targetUrl;
        return false;
      }

      var nextRelative = next.pathname + next.search + next.hash;
      var currentRelative = current.pathname + current.search + current.hash;
      if (nextRelative === currentRelative) return true;

      // Prefer framework router when present (e.g. Next.js pages router)
      try {
        if (window.next && window.next.router && typeof window.next.router.push === 'function') {
          if (replace && typeof window.next.router.replace === 'function') {
            window.next.router.replace(nextRelative);
          } else {
            window.next.router.push(nextRelative);
          }
          return true;
        }
      } catch (e) {
        console.warn('[auto-login] next.router navigation failed, fallback to history:', e);
      }

      if (replace) {
        history.replaceState(history.state, '', nextRelative);
        dispatchNavigationEvents(history.state, 'replacestate');
      } else {
        history.pushState(history.state, '', nextRelative);
        dispatchNavigationEvents(history.state, 'pushstate');
      }

      return true;
    } catch (e) {
      console.warn('[auto-login] SPA navigation failed, fallback to location.href:', e);
      window.location.href = targetUrl;
      return false;
    }
  }

  function findReactHandler(el, handlerName, maxDepth) {
    if (!el) return null;
    var fiberKey = Object.keys(el).find(function (k) {
      return k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance');
    });
    var fiber = fiberKey ? el[fiberKey] : null;
    var cur = fiber;
    var depth = 0;
    while (cur && depth < (maxDepth || 20)) {
      var props = cur.memoizedProps || cur.pendingProps;
      if (props && typeof props[handlerName] === 'function') {
        return props[handlerName];
      }
      cur = cur.return;
      depth++;
    }
    return null;
  }

  /**
   * Check a native input[type=checkbox], including React controlled components.
   */
  function checkNativeCheckboxInput(inputEl) {
    if (!inputEl || inputEl.type !== 'checkbox' || inputEl.checked) return;

    var proto = Object.getPrototypeOf(inputEl);
    var desc = proto && Object.getOwnPropertyDescriptor(proto, 'checked');
    if (desc && desc.set) {
      try { desc.set.call(inputEl, true); } catch (e) { inputEl.checked = true; }
    } else {
      inputEl.checked = true;
    }

    var onChange = findReactHandler(inputEl, 'onChange');
    if (onChange) {
      try {
        onChange({ target: inputEl, currentTarget: inputEl });
        return;
      } catch (e) {
        console.warn('[auto-login] agreement onChange failed:', e);
      }
    }

    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    inputEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  /**
   * Check the agreement checkbox if present and not already checked.
   * Supports native input[type=checkbox], wrapper with nested checkbox,
   * and Radix/shadcn Checkbox (button[role="checkbox"]).
   */
  function checkAgreement() {
    // input[type=checkbox] with data-auto="agreement" directly on the element
    var checkboxInput = document.querySelector('input[type=checkbox][data-auto="agreement"]');
    if (checkboxInput) {
      checkNativeCheckboxInput(checkboxInput);
      return;
    }

    var el = document.querySelector('[data-auto="agreement"]');
    if (!el) return;

    // data-auto on wrapper, native checkbox nested inside
    if (el.type !== 'checkbox') {
      var nestedInput = el.querySelector('input[type=checkbox]');
      if (nestedInput) {
        checkNativeCheckboxInput(nestedInput);
        return;
      }
    }

    var isChecked = el.type === 'checkbox'
      ? el.checked
      : el.getAttribute('aria-checked') === 'true' || el.getAttribute('data-state') === 'checked';
    if (isChecked) return;

    // Native checkbox on the agreement element itself
    if (el.type === 'checkbox') {
      checkNativeCheckboxInput(el);
      return;
    }

    // Radix/shadcn Checkbox renders as <button role="checkbox">
    // Try direct click first — Radix internally handles toggle on click
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'checkbox') {
      try { el.click(); } catch (e) {}
      // Verify state changed after click
      var afterClick = el.getAttribute('aria-checked') === 'true' || el.getAttribute('data-state') === 'checked';
      if (afterClick) return;
      // click didn't work (e.g. wrapped Checkbox that intercepts events), fall through to fiber
    }

    // Radix/shadcn Checkbox (button[role="checkbox"]):
    // DOM events are intercepted internally; invoke onCheckedChange via React fiber instead
    var onCheckedChange = findReactHandler(el, 'onCheckedChange');

    if (onCheckedChange) {
      try { onCheckedChange(true); } catch (e) {
        console.warn('[auto-login] agreement onCheckedChange failed:', e);
      }
    } else {
      // Fallback: click associated label
      var label = el.id ? document.querySelector('label[for="' + el.id + '"]') : el.closest('label');
      if (label) { try { label.click(); } catch (e) {} }
    }
  }

  async function autoLogin(account, password, loginPath, role, returnUrl) {
    if (!loginPath) {
      console.warn('[auto-login] loginPath is required, e.g. "/login" or "/backendlogin"');
      return;
    }

    var resolvedPath = resolveLoginPath(loginPath);
    var resolvedReturnUrl = returnUrl ? resolveAppPath(returnUrl) : null;
    if (!isPathInCurrentApp(resolvedPath)) {
      console.warn('[auto-login] Refuse to navigate outside current app base:', resolvedPath, getCurrentAppBase());
      removeScopedStorage(PENDING_LOGIN_KEY);
      return;
    }
    if (resolvedReturnUrl && !isPathInCurrentApp(resolvedReturnUrl)) {
      console.warn('[auto-login] Ignore stale returnUrl outside current app base:', resolvedReturnUrl, getCurrentAppBase());
      resolvedReturnUrl = null;
    }

    // If login path provided, navigate there first
    if (!isCurrentLoginPath(resolvedPath)) {
      writeScopedStorage(PENDING_LOGIN_KEY, {
        account: account, password: password, role: role,
        loginPath: resolvedPath, returnUrl: resolvedReturnUrl || null
      });
      navigateWithoutReload(resolvedPath);
      return;
    }

    // Wait for DOM (login page may have animation)
    await delay(300);

    var toast = showToast('🔐 Auto-logging in...');

    // Check agreement checkbox if present
    checkAgreement();

    // If role provided, select role first
    if (role) {
      console.log('[auto-login] Role parameter provided:', role);
      var roleSelected = selectRole(role);
      if (!roleSelected) {
        console.warn('[auto-login] Role selector not found or match failed, role:', role);
      } else {
        console.log('[auto-login] Role selection completed successfully');
      }
      await delay(STEP_DELAY);
    } else {
      console.log('[auto-login] No role parameter provided, skipping role selection');
    }

    // Retry finding elements after role selection because tab switch may trigger route/state updates.
    var retries = 10;
    var accountInput, passwordInput, submitBtn, captchaInput;
    while (retries > 0) {
      accountInput = getEl('account');
      passwordInput = getEl('password');
      submitBtn = getEl('submit');
      captchaInput = getEl('captcha');

      var allFound = accountInput && passwordInput && submitBtn;
      var allConnected = allFound &&
        accountInput.isConnected &&
        passwordInput.isConnected &&
        submitBtn.isConnected;

      if (allConnected) break;
      retries--;
      await delay(300);
    }

    if (!accountInput || !passwordInput || !submitBtn || !accountInput.isConnected || !passwordInput.isConnected || !submitBtn.isConnected) {
      console.warn('[auto-login] Login form elements not found or detached, need data-auto="account/password/submit"');
      removeToast(toast);
      var failToast = showToast('❌ Auto-login failed, please log in manually');
      setTimeout(function () { removeToast(failToast); }, 2000);
      return;
    }

    // Type account and password in parallel
    var tasks = [typeInto(accountInput, account), typeInto(passwordInput, password)];
    if (captchaInput) tasks.push(typeInto(captchaInput, '123456'));
    await Promise.all(tasks);
    await delay(STEP_DELAY);

    submitBtn.click();

    // Wait for login result: poll until left login page
    var _lp = resolvedPath;
    var _ru = resolvedReturnUrl;
    var _maxAttempts = 30; // up to 15s (30 × 500ms)
    var _account = account;
    var _role = role;
    var _toast = toast;
    var _checkResult = setInterval(function () {
      _maxAttempts--;
      var leftLoginPage = !isCurrentLoginPath(_lp);

      if (leftLoginPage) {
        // Left login page → login success
        clearInterval(_checkResult);
        removeToast(_toast);

        // Save session for logout reporting
        saveLoginSession(_account, _role, _lp);
        notifyParentLoginSuccess({
          account: _account,
          role: _role,
          loginPath: _lp
        });

        var successMsg = '✅ Auto-logged in as ' + _account;
        if (_role) successMsg += ', role ' + _role;
        var successToast = showToast(successMsg);
        setTimeout(function () { removeToast(successToast); }, 2000);

        // Only when caller passes returnUrl, redirect after SPA route settles
        if (_ru && _ru !== _lp) {
          setTimeout(function () {
            // Normalize path to avoid duplicate navigation
            var curPath = window.location.pathname.replace(/\/$/, '');
            var targetPath = _ru.split('?')[0].split('#')[0].replace(/\/$/, '');
            if (curPath !== targetPath) {
              navigateWithoutReload(_ru);
            }
          }, 800);
        }
      } else if (_maxAttempts <= 0) {
        // Timeout: login may have failed
        clearInterval(_checkResult);
        removeToast(_toast);
        // Check for error message on page
        var errorEl = document.querySelector('[role="alert"]');
        if (errorEl) {
          var failToast = showToast('❌ Auto-login failed: ' + (errorEl.textContent || 'Please log in manually').trim());
          setTimeout(function () { removeToast(failToast); }, 3000);
        } else {
          var timeoutToast = showToast('⏳ Auto-login timeout, please log in manually');
          setTimeout(function () { removeToast(timeoutToast); }, 3000);
        }
      }
    }, 500);
  }

  // postMessage listener
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (data && data.type === 'auto-login' && data.account && data.password) {
      autoLogin(data.account, data.password, data.loginPath, data.role, data.returnUrl);
    }
  });

  // After load, check for pending auto-login (resume after redirect)
  // Use polling instead of load (SPA route change does not fire load)
  function checkPending() {
    var pending = readScopedStorage(PENDING_LOGIN_KEY);
    if (!pending) return;
    removeScopedStorage(PENDING_LOGIN_KEY);
    try {
      autoLogin(
        pending.account, pending.password,
        pending.loginPath || window.location.pathname,
        pending.role, pending.returnUrl
      );
    } catch (e) {}
  }

  // Check once on load
  checkPending();

  // Listen for URL changes (SPA route)
  var _lastUrl = location.href;
  setInterval(function () {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      checkPending();
    }
  }, 500);

  // ===== Logout detection (session token polling) =====
  // Every 800ms check if session token in localStorage was cleared
  // When clearAuth() / session.reset() runs, token is cleared and we detect logout
  // Report once per cleared store and remove only those from snapshot so e.g. Sidebar (AdminSession)
  // and Personal Center (AppUserSession) each trigger one report when they log out
  setInterval(function () {
    var session = getLoginSession();
    if (!session || !session.tokenSnapshot || !session.tokenSnapshot.length) return;

    var loggedOut = detectLoggedOutSessions(session);
    if (loggedOut.length > 0) {
      var storeKeysToRemove = [];
      for (var j = 0; j < loggedOut.length; j++) {
        var snap = loggedOut[j];
        storeKeysToRemove.push(snap.storeKey);
        var enriched = {
          account: session.account,
          role: snap.role != null ? snap.role : session.role,
          loginPath: session.loginPath,
          loginTime: session.loginTime
        };
        enriched.loggedOutStores = [{
          storeKey: snap.storeKey,
          role: snap.role,
          username: snap.username,
          userId: snap.userId
        }];
        notifyParentLogout(enriched);
      }
      removeStoresFromLoginSession(session, storeKeysToRemove);
    }
  }, 800);

  // ===== Expose global API =====

  // Console: window.__autoLogin('account', 'password', '/login', 'Patient')
  window.__autoLogin = autoLogin;

  /**
   * Manually report logout (for React etc. to call on logout)
   * Usage: window.__notifyLogout()                    // uses saved login info
   *        window.__notifyLogout({ account: 'xxx', role: 'admin', reason: 'manual' })
   */
  window.__notifyLogout = function (extraInfo) {
    var session = getLoginSession();
    var info = session || {};

    // Merge external info (external values take precedence)
    if (extraInfo && typeof extraInfo === 'object') {
      for (var key in extraInfo) {
        if (extraInfo.hasOwnProperty(key)) {
          info[key] = extraInfo[key];
        }
      }
    }

    notifyParentLogout(info);
    clearLoginSession();
  };
})();
