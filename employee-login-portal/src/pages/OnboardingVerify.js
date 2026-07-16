import React, { useState } from "react";
import axios from "axios";
import api from "../api";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiShield, FiLock, FiMail, FiRefreshCw, FiArrowRight } from 'react-icons/fi';

// --- Theme Colors ---
const COLORS = {
  primary: '#14b8a6',
  primaryLight: '#5eead4',
  primaryDark: '#0d9488',
  bgGradient: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
  borderTeal: '#99f6e4',
  bgTealLight: '#f0fdfd',
  shadowTeal: 'rgba(94, 234, 212, 0.3)',
};

export default function OnboardingVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [invalidOtp, setInvalidOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    try {
      setLoading(true);
      setInvalidOtp(false);
      await api.post(`/v1/auth/send-otp?token=${token}`);
      setSent(true);
      setMessage("OTP sent to your registered email.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      setInvalidOtp(false);
      setMessage("");

      const res = await api.post(
        `/v1/auth/verify-otp?token=${token}&otp=${otp}`
      );

      const applicantId = res.data.applicantId;
      const jwtToken = res.data.token;

      // ✅ Save token for subsequent API calls
      sessionStorage.setItem("token", jwtToken);
      sessionStorage.setItem("applicantId", applicantId);

      navigate(`/onboarding/${applicantId}`);

    } catch (err) {
      setInvalidOtp(true);
      setMessage("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconHeaderStyle}>
          <FiShield size={40} color={COLORS.primary} />
        </div>

        <h2 style={titleStyle}>Secure Verification</h2>

        {!sent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={descriptionStyle}>
              To proceed with your onboarding, we need to verify your identity.
              Click the button below to receive a secure OTP on your registered email.
            </p>

            <button
              onClick={sendOtp}
              disabled={loading}
              style={loading ? disabledButtonStyle : primaryButtonStyle}
            >
              {loading ? (
                <><FiRefreshCw className="spin" /> Sending...</>
              ) : (
                <><FiMail /> Send OTP</>
              )}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <p style={descriptionStyle}>
              Please enter the 6-digit verification code sent to your email.
            </p>

            <div style={inputWrapperStyle}>
              <FiLock style={inputIconStyle} />
              <input
                type="text"
                value={otp}
                placeholder="Enter 6-digit OTP"
                onChange={(e) => setOtp(e.target.value)}
                style={inputStyle}
                maxLength={6}
              />
            </div>

            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 4}
              style={(loading || otp.length < 4) ? disabledButtonStyle : primaryButtonStyle}
            >
              {loading ? "Verifying..." : <><FiArrowRight /> Verify OTP</>}
            </button>

            {invalidOtp && (
              <button
                onClick={sendOtp}
                disabled={loading}
                style={resendButtonStyle}
              >
                <FiRefreshCw /> Resend Code
              </button>
            )}
          </div>
        )}

        {message && (
          <div style={{
            ...messageContainerStyle,
            backgroundColor: (invalidOtp || message.includes("Expired") || message.includes("Failed") || message.includes("Invalid")) ? '#fef2f2' : '#f0fdf4',
            color: (invalidOtp || message.includes("Expired") || message.includes("Failed") || message.includes("Invalid")) ? '#dc2626' : '#16a34a',
            border: `1px solid ${(invalidOtp || message.includes("Expired") || message.includes("Failed") || message.includes("Invalid")) ? '#fecaca' : '#bbf7d0'}`
          }}>
            {message}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 2s linear infinite;
          }
        `}
      </style>
    </div>
  );
}

const containerStyle = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: '#F7F5FA',
  fontFamily: "'Outfit', sans-serif",
  padding: '20px',
  boxSizing: 'border-box'
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "#F7F5FA",
  padding: "40px",
  borderRadius: "32px",
  boxShadow: 'none',
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  border: "none",
};

const iconHeaderStyle = {
  width: "80px",
  height: "80px",
  background: COLORS.bgTealLight,
  borderRadius: "24px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "24px",
};

const titleStyle = {
  fontSize: "30px",
  fontWeight: "400",
  color: "#0f172a",
  margin: "0 0 12px 0",
};

const descriptionStyle = {
  fontSize: "15px",
  color: "#64748b",
  lineHeight: "1.6",
  textAlign: "center",
  marginBottom: "30px",
};

const primaryButtonStyle = {
  width: '100%',
  padding: "16px",
  background: '#00B3A4',
  color: "white",
  borderRadius: "8px",
  border: "none",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  transition: "all 0.3s",
  boxShadow: `0 8px 20px ${COLORS.shadowTeal}`,
};

const disabledButtonStyle = {
  ...primaryButtonStyle,
  background: "#e2e8f0",
  color: "#94a3b8",
  cursor: "not-allowed",
  boxShadow: "none",
};

const resendButtonStyle = {
  marginTop: "16px",
  background: "transparent",
  color: '#00B3A4',
  border: "none",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "8px",
};

const inputWrapperStyle = {
  position: 'relative',
  marginBottom: '20px',
  width: '100%',
};

const inputIconStyle = {
  position: 'absolute',
  left: '16px',
  top: '42%',
  transform: 'translateY(-50%)',
  color: COLORS.primary,
};

const inputStyle = {
  width: '100%',
  padding: "16px 16px 16px 48px",
  borderRadius: "16px",
  border: `2px solid ${COLORS.borderTeal}`,
  fontSize: "18px",
  letterSpacing: "4px",
  textAlign: "center",
  fontWeight: "700",
  outline: "none",
  transition: "all 0.3s",
  backgroundColor: COLORS.bgTealLight,
  boxSizing: 'border-box'
};

const messageContainerStyle = {
  marginTop: "24px",
  padding: "12px 20px",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: "600",
  width: '100%',
  textAlign: 'center',
  boxSizing: 'border-box'
};