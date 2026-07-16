import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { redirectToLogin, getSSOToken } from "../auth/SSOHandler";

function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // If the user already has a valid token, go directly to Home
    const token = getSSOToken() || sessionStorage.getItem("token");
    if (token) {
      console.log("[SSO] Token found, redirecting directly to Home");
      navigate("/Home");
    } else {
      // Otherwise, redirect to Scaloz IAM Login
      console.log("[SSO] No token found, redirecting to Scaloz IAM Login");
      redirectToLogin();
    }
  }, [navigate]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: "#f8fafc"
    }}>
      {/* Premium subtle spinner */}
      <div className="sso-spinner" style={{
        width: "50px",
        height: "50px",
        border: "3px solid rgba(255,255,255,0.1)",
        borderTop: "3px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "24px"
      }} />
      <h2 style={{
        fontSize: "20px",
        fontWeight: "500",
        letterSpacing: "-0.025em",
        margin: "0 0 8px 0"
      }}>
        Connecting via Scaloz IAM
      </h2>
      <p style={{
        fontSize: "14px",
        color: "#94a3b8",
        margin: 0
      }}>
        Secure single sign-on is in progress...
      </p>

      {/* Embedded keyframe for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
