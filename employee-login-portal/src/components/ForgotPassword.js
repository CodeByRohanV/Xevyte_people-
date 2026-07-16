import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../api";
import { getTenantSubdomain } from "../utils/tenant";
import "./LoginPage.css";
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';
import scalozLogo from "../assets/Scaloz.png";

function ForgotPassword() {
  // ── State ──────────────────────────────────────────────────────────
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
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

  // ── Form submit — UNCHANGED logic ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { employeeId: employeeId.trim() });
      if (res.status === 200) {
        navigate('/reset-link-sent');
      } else {
        setError('Something went wrong. Try again.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Invalid Login ID. Please try again.");
      } else {
        setError("Server error. Try again later.");
      }
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

      {/* ── RIGHT PANEL — Forgot Password form ── */}
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

            <div className="form-card-header">
              <h1>Forgot Password?</h1>
              <p>Enter your Login ID and we'll send a reset link to your registered email.</p>
            </div>

            <form onSubmit={handleSubmit} className="enterprise-form">

              <div className="enterprise-field">
                <label htmlFor="empId">Login ID</label>
                <input
                  id="empId"
                  type="text"
                  placeholder="Enter your employee ID"
                  value={employeeId}
                  onChange={(e) => { setEmployeeId(e.target.value); if (error) setError(''); }}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>

              {error && (
                <div className="enterprise-error" role="alert">{error}</div>
              )}

              <button type="submit" className="enterprise-signin-btn" disabled={loading}>
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                  : <>Send Reset Link <FiChevronRight size={18} /></>
                }
              </button>

            </form>

            <Link to="/LoginPage" className="auth-back-link" style={{ marginTop: '20px' }}>
              <FiArrowLeft size={15} /> Back to Log In
            </Link>

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

export default ForgotPassword;
