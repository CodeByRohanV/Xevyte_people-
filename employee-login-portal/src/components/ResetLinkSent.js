import React from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft } from 'react-icons/fi';

const ResetLinkSent = () => {
  return (
    <div className="auth-page-container">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card" style={{ textAlign: 'center' }}>
        {/* Success icon */}
        <div className="auth-mail-icon">
          <FiMail size={36} />
        </div>

        <h1 className="auth-heading">Check Your Email</h1>
        <p className="auth-subheading" style={{ maxWidth: '320px', margin: '0 auto 32px' }}>
          A password reset link has been sent to your registered email address.
          Please check your inbox and follow the instructions.
        </p>

        <div className="auth-info-box">
          <strong>Didn't receive the email?</strong>
          <ul>
            <li>Check your spam / junk folder</li>
            <li>Make sure the Employee ID was correct</li>
            <li>The link expires in <strong>15 minutes</strong></li>
          </ul>
        </div>

        <Link to="/forgot-password" className="auth-btn" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none', marginBottom: '16px' }}>
          Resend Reset Link
        </Link>

        <Link to="/LoginPage" className="auth-back-link">
          <FiArrowLeft size={15} /> Back to Sign In
        </Link>

        <div className="auth-footer">
          <p className="footer-powered">© {new Date().getFullYear()} Scaloz. Powered by Xevyte Technologies</p>
        </div>
      </div>
    </div>
  );
};

export default ResetLinkSent;