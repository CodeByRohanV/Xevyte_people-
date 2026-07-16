import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from "../api";
import { getTenantSubdomain } from "../utils/tenant";
import "./LoginPage.css";
import { FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import scalozLogo from "../assets/Scaloz.png";

function ResetPassword() {
  // ── URL params ──────────────────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // ── State ──────────────────────────────────────────────────────────
  const [newPassword, setnewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({
    tenantName: "Xevyte Technologies",
    logo: null,
    footerText: `© ${new Date().getFullYear()} Scaloz. Powered by Xevyte Technologies`,
    fontColor: "",
    fontFamily: ""
  });
  const [slides, setSlides] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // ── Effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBranding();
    fetchSlides();
  }, []);

  // Slide auto-rotation — same 3 s interval as LoginPage
  useEffect(() => {
    if (slides && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [slides]);

  // ── Data fetching ───────────────────────────────────────────────────
  const fetchBranding = async () => {
    const subdomain = getTenantSubdomain();
    if (subdomain && subdomain !== "www") {
      try {
        const res = await api.get(`/auth/tenant-branding/${subdomain}`);
        if (res.data) {
          setBranding({
            tenantName: res.data.tenantName || "Xevyte Technologies",
            logo: res.data.logo ? `data:image/png;base64,${res.data.logo}` : null,
            footerText: res.data.footerText || `© ${new Date().getFullYear()} Scaloz. Powered by Xevyte Technologies`,
            fontColor: res.data.fontColor || "",
            fontFamily: res.data.fontFamily || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch tenant branding:", err);
      }
    }
  };

  const fetchSlides = async () => {
    try {
      const response = await api.get('/auth/global-settings/GENERAL_SETTINGS');
      if (response.data && response.data.length > 0) {
        setSlides(response.data);
      } else {
        setSlides([]);
      }
    } catch {
      setSlides([]);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────
  const getImageSrc = (mediaData) => {
    if (!mediaData || typeof mediaData !== 'string') return null;
    if (mediaData.startsWith('data:')) return mediaData;
    try {
      if (mediaData.startsWith('aVZ')) {
        const decoded = atob(mediaData);
        return `data:image/png;base64,${decoded}`;
      }
    } catch (e) { }
    return `data:image/png;base64,${mediaData}`;
  };

  // Password strength — UNCHANGED logic
  const getStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = getStrength(newPassword);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][strength];

  // ── Form submit — UNCHANGED logic ───────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError("The passwords you entered do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
      if (response.status === 200) {
        setMessage("Password changed successfully! Redirecting...");
        setTimeout(() => navigate('/LoginPage'), 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Server error. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="enterprise-login-container" style={{ fontFamily: branding.fontFamily || 'inherit' }}>
      {/* Top Left Global Logo */}
      <div className="top-left-logo">
        <img src={scalozLogo} alt="Scaloz Logo" />
      </div>


      {/* ── LEFT PANEL — identical to LoginPage ── */}
      <div className="left-panel">
        <div className="left-panel-inner">

          {/* Slideshow / Hero */}
          <div className="left-showcase">
            {slides && slides.length > 0 ? (
              <div className="slides-wrapper">
                {slides.map((slide, index) => (
                  <div key={slide.id} className={`showcase-slide ${index === currentSlide ? 'active' : ''}`}>
                    {slide.mediaData && (
                      <div className={`showcase-image-wrap ${!slide.content ? 'image-only' : ''}`}>
                        <img
                          src={getImageSrc(slide.mediaData)}
                          alt={`Slide ${index + 1}`}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {slide.content && (
                      <div className="showcase-text">
                        {slide.content.split('\n').map((line, i) =>
                          i === 0 ? <h2 key={i}>{line}</h2> : <p key={i}>{line}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {slides.length > 1 && (
                  <div className="slide-indicators">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        className={`indicator ${i === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="default-showcase">
                <h2>Smart HRMS for Modern Workplaces</h2>
                <p>
                  Streamline employee management, payroll, attendance, leave tracking,
                  and performance operations through one secure and intelligent HR platform.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL — Reset Password form ── */}
      <div className="right-panel">
        <div className="right-panel-inner">
          <div className="login-form-card">

            {/* Tenant branding inside card */}
            {(branding.logo || branding.tenantName) && (
              <div className="card-tenant-brand">
                {branding.logo && <img src={branding.logo} alt="Logo" className="card-tenant-logo" />}
                {branding.tenantName && <span className="card-tenant-name">{branding.tenantName}</span>}
              </div>
            )}

            {message ? (
              /* ── Success state ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72,
                  background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                  margin: '0 auto 24px',
                  boxShadow: '0 12px 28px rgba(34,197,94,0.25)',
                  animation: 'floatY 3s ease-in-out infinite'
                }}>
                  <FiCheckCircle size={32} />
                </div>
                <h1 className="form-card-header" style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>
                  Password Updated!
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
                  {message}
                </p>
                <Link to="/LoginPage" className="enterprise-signin-btn" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                  Go to Log In <FiChevronRight size={18} />
                </Link>
              </div>
            ) : (
              <>
                <div className="form-card-header">
                  <h1>Set New Password</h1>
                  <p>Choose a strong, unique password for your account.</p>
                </div>

                <form onSubmit={handleReset} className="enterprise-form">

                  {/* New Password */}
                  <div className="enterprise-field">
                    <label htmlFor="newPw">New Password</label>
                    <div className="password-field-wrap">
                      <input
                        id="newPw"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={newPassword}
                        onChange={(e) => { setnewPassword(e.target.value); if (error) setError(''); }}
                        required
                      />
                      <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle visibility">
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>

                    {/* Password strength bars */}
                    {newPassword && (
                      <div className="pw-strength">
                        <div className="pw-strength-bars">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="pw-bar" style={{ background: i <= strength ? strengthColor : '#E5E7EB' }} />
                          ))}
                        </div>
                        <span style={{ color: strengthColor, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {strengthLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="enterprise-field">
                    <label htmlFor="confirmPw">Confirm Password</label>
                    <div className="password-field-wrap">
                      <input
                        id="confirmPw"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                        required
                      />
                      <button type="button" className="pw-toggle" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle visibility">
                        {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>Passwords do not match</span>
                    )}
                    {confirmPassword && newPassword === confirmPassword && (
                      <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>✓ Passwords match</span>
                    )}
                  </div>

                  {error && (
                    <div className="enterprise-error" role="alert">{error}</div>
                  )}

                  <button type="submit" className="enterprise-signin-btn" disabled={loading}>
                    {loading
                      ? <><span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Updating…</>
                      : <>Reset Password <FiChevronRight size={18} /></>
                    }
                  </button>

                </form>

                <Link to="/LoginPage" className="auth-back-link" style={{ marginTop: '20px' }}>
                  <FiArrowLeft size={15} /> Back to Log In
                </Link>
              </>
            )}

          </div>
        </div>

        <div className="global-footer-text">
          <span>{branding.footerText}</span>
          <div className="footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Terms & Conditions</a>
            <span className="separator">|</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <span className="separator">|</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Cookies Policy</a>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ResetPassword;
