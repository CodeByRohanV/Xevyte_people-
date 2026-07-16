// eslint-disable-next-line no-unused-vars
import React from "react";

import { getSSOToken, redirectToLogin, isTokenExpired } from "../auth/SSOHandler";

const PrivateRoute = ({ children }) => {
  // Check for Scaloz IAM SSO token first, fallback to legacy token
  const ssoToken = getSSOToken();
  const legacyToken = sessionStorage.getItem("token");
  const token = ssoToken || legacyToken;

  if (!token) {
    // No session — redirect to Scaloz IAM login
    redirectToLogin();
    return null; // prevent rendering while redirecting
  }

  // Check if SSO token is expired
  if (ssoToken && isTokenExpired(ssoToken)) {
    console.warn('[SSO] Token expired — redirecting to Scaloz IAM for re-authentication');
    sessionStorage.removeItem('scaloz_token');
    redirectToLogin();
    return null;
  }

  return children;
};

export default PrivateRoute;

