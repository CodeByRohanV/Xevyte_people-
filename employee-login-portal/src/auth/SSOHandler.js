/**
 * SSOHandler.js — Scaloz IAM SSO Client
 *
 * Responsibilities:
 * 1. On app load: check if ?scaloz_token=... is in URL → store and clean URL
 * 2. Provide getSSOToken() for reading the stored token
 * 3. Provide redirectToLogin() to bounce to Scaloz IAM with redirect_to param
 * 4. Provide clearSSOToken() for logout
 */

import { getTenantSubdomain } from "../utils/tenant";

const TOKEN_KEY = 'scaloz_token';
const IAM_LOGIN_URL = process.env.REACT_APP_IAM_URL || 'http://localhost:3001';
// eslint-disable-next-line no-unused-vars
const HRMS_URL = process.env.REACT_APP_HRMS_URL || 'http://localhost:3000';

export function getDynamicIAMLoginUrl() {
  const sub = getTenantSubdomain();
  if (!sub) {
    return IAM_LOGIN_URL;
  }
  try {
    const url = new URL(IAM_LOGIN_URL);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = `${sub}.localhost`;
    } else {
      const parts = url.hostname.split('.');
      if (!parts.includes(sub)) {
        url.hostname = `${sub}.${url.hostname}`;
      }
    }
    return url.origin;
  } catch (e) {
    console.error('[SSO] Failed to parse base IAM URL:', e);
    return IAM_LOGIN_URL;
  }
}


/**
 * Call this ONCE at app startup (before rendering protected routes).
 * - Checks URL for ?scaloz_token=... (redirect back from IAM after login)
 * - If found, stores in sessionStorage and removes from URL (clean history)
 * Returns the token if found in URL, null otherwise.
 */
export function handleSSOCallback() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromURL = params.get('scaloz_token');

  if (tokenFromURL) {
    console.log('[SSO] Token received from Scaloz IAM — storing in session');
    sessionStorage.removeItem('policies_acknowledged');

    // Save to both SSO key and legacy key for full application compatibility
    sessionStorage.setItem(TOKEN_KEY, tokenFromURL);
    sessionStorage.setItem('token', tokenFromURL);

    // Decode JWT claims and store them in sessionStorage so all HRMS features work seamlessly
    const claims = decodeToken(tokenFromURL);
    if (claims) {
      console.log('[SSO] Decoded JWT claims:', claims);
      if (claims.employeeId) sessionStorage.setItem('employeeId', claims.employeeId);
      if (claims.name) sessionStorage.setItem('employeeName', claims.name);
      if (claims.role) sessionStorage.setItem('role', claims.role);
      if (claims.tenantId) sessionStorage.setItem('tenantId', claims.tenantId);
      if (claims.isSubAdmin !== undefined) {
        sessionStorage.setItem('isSubAdmin', claims.isSubAdmin.toString());
      }
      sessionStorage.setItem('moduleAccess', 'ALL'); // default/fallback
    }

    // Clean the token from the URL so it doesn't linger in browser history
    params.delete('scaloz_token');
    const newSearch = params.toString();
    const cleanURL = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState({}, document.title, cleanURL);

    return tokenFromURL;
  }

  return null;
}

/**
 * Get the current SSO token from sessionStorage.
 * Returns null if not authenticated.
 */
export function getSSOToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Redirect to Scaloz IAM login page.
 * Passes redirect_to so IAM knows where to bounce back after auth.
 * @param {string} [returnTo] - URL to redirect back to after IAM login (defaults to current page)
 */
export function redirectToLogin() {
  const dynamicIAM = getDynamicIAMLoginUrl();
  const iamURL = `${dynamicIAM}/Home`;
  console.log('[SSO] Redirecting to Scaloz Tenant Dashboard:', iamURL);
  window.location.href = iamURL;
}

/**
 * Log out: clear token and redirect to IAM login.
 */
export function clearSSOToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  // Also clear legacy token key if present
  sessionStorage.removeItem('token');
  console.log('[SSO] Token cleared — user logged out');
}

/**
 * Decode JWT payload (no verification — just for reading claims client-side).
 * Use this to get tenant, role, employeeId, name etc.
 */
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (e) {
    console.error('[SSO] Failed to decode token:', e);
    return null;
  }
}

/**
 * Check if the current token is expired.
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() / 1000 > decoded.exp;
}
