import React, { useState, useRef } from 'react';
import api from '../api';
import Sidebar from './Sidebar';
import './Onboarding.css';
import {
  FiUserPlus,
  FiFileText,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiUploadCloud,
  FiArrowRight,
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

function ApplicantCreation() {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    client: '',
    resume: null,
  });

  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(false);
  const tabsRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 150;
      tabsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
      setFormData((prev) => ({ ...prev, resume: file }));
      setError('');
    } else {
      setError('Please upload a PDF or DOCX file.');
      setFormData((prev) => ({ ...prev, resume: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, phone, position, client, resume } = formData;

    if (!firstName || !lastName || !email || !phone || !position || !client || !resume) {
      setError('Please fill all fields and upload a resume.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const toBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
        });

      const base64Resume = await toBase64(resume);

      const payload = {
        firstName,
        lastName,
        email,
        phone,
        position,
        client,
        resumeName: resume.name,
        base64Resume,
      };

      // Step 1 — Save applicant
      const response = await api.post('/v1/applicants', payload);
      const savedApplicant = response.data;
      setApplicant(savedApplicant);

      // Step 2 — Send onboarding email
      await api.post('/v1/emails/send-onboarding-link', savedApplicant);

      setSuccess(`Applicant saved successfully & onboarding email sent to ${savedApplicant.email}`);
      setActiveTab('documents');
    } catch (err) {
      console.error('Error saving applicant:', err);
      setError(err.response?.data?.message || 'Failed to save applicant. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setApplicant(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      client: '',
      resume: null,
    });
    setError('');
    setSuccess('');
    setActiveTab('profile');
  };

  const tabItems = [
    { id: 'profile', label: '1. Profile Creation', icon: <FiUserPlus /> },
    { id: 'documents', label: '2. Document Upload', icon: <FiFileText /> },
    { id: 'status', label: '3. Onboarding Status', icon: <FiActivity /> },
  ];

  const renderProfileForm = () => (
    <div className="onboarding-card">
      <h2 className="onboarding-section-title"><FiUser /> Primary Information</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="onboarding-form-grid">
          <div className="onboarding-form-group">
            <label className="onboarding-label">First Name <span className="onboarding-required">*</span></label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              className="onboarding-input"
              required
            />
          </div>
          <div className="onboarding-form-group">
            <label className="onboarding-label">Last Name <span className="onboarding-required">*</span></label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              className="onboarding-input"
              required
            />
          </div>
          <div className="onboarding-form-group">
            <label className="onboarding-label">Email Address <span className="onboarding-required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@company.com"
                className="onboarding-input"
                required
              />
            </div>
          </div>
          <div className="onboarding-form-group">
            <label className="onboarding-label">Phone Number <span className="onboarding-required">*</span></label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 890"
              className="onboarding-input"
              required
            />
          </div>
          <div className="onboarding-form-group">
            <label className="onboarding-label">Position Applied For <span className="onboarding-required">*</span></label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
              className="onboarding-input"
              required
            />
          </div>
          <div className="onboarding-form-group">
            <label className="onboarding-label">Client Name <span className="onboarding-required">*</span></label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              className="onboarding-input"
              required
            />
          </div>

          <div className="onboarding-form-group full-width" style={{ marginTop: '1rem' }}>
            <label className="onboarding-label">Upload Resume (PDF/DOCX) <span className="onboarding-required">*</span></label>
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              required
            />
            <label htmlFor="resume-upload" className="onboarding-btn onboarding-btn-outline" style={{ width: 'fit-content', borderStyle: 'dashed', borderWidth: '2px' }}>
              <FiUploadCloud /> {formData.resume ? formData.resume.name : 'Drag or click to upload resume'}
            </label>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={loading}
            className="onboarding-btn onboarding-btn-primary"
            style={{ minWidth: '200px' }}
          >
            {loading ? 'Processing...' : 'Create Application'} <FiArrowRight />
          </button>
        </div>
      </form>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="onboarding-card">
      <h2 className="onboarding-section-title"><FiCheckCircle /> Verification Pending</h2>

      {applicant ? (
        <div className="onboarding-content-wrapper">
          <div className="onboarding-banner banner-info">
            <FiCheckCircle /> Application successfully created with ID: <strong>{applicant.applicantId}</strong>
          </div>

          <div className="onboarding-detail-grid">
            <div className="onboarding-detail-item">
              <span className="onboarding-detail-label">Full Name</span>
              <span className="onboarding-detail-value">{`${applicant.firstName} ${applicant.lastName}`}</span>
            </div>
            <div className="onboarding-detail-item">
              <span className="onboarding-detail-label">Client</span>
              <span className="onboarding-detail-value">{applicant.client}</span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
              The candidate has been notified via email. Once they submit their PAN, Aadhaar, and other documents via the onboarding link, they will appear in the verification queue.
            </p>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('status')}
              className="onboarding-btn onboarding-btn-primary"
            >
              Check Onboarding Status <FiArrowRight />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FiAlertCircle style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Please complete Step 1 to unlock document upload tracking.</p>
        </div>
      )}
    </div>
  );

  const renderStatusTab = () => (
    <div className="onboarding-card">
      <h2 className="onboarding-section-title"><FiActivity /> Enrollment Status</h2>

      {applicant ? (
        <div className="onboarding-content-wrapper">
          <div className="onboarding-detail-grid">
            <div className="onboarding-detail-item">
              <span className="onboarding-detail-label">Application ID</span>
              <span className="onboarding-detail-value">{applicant.applicantId}</span>
            </div>
            <div className="onboarding-detail-item">
              <span className="onboarding-detail-label">Current Progress</span>
              <span className="onboarding-detail-value" style={{ color: '#14b8a6' }}>{applicant.status}</span>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={handleReset}
              className="onboarding-btn onboarding-btn-outline"
            >
              Register New Candidate
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FiAlertCircle style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>No active applicant found. Please complete Step 1 first.</p>
        </div>
      )}
    </div>
  );

  return (
    <Sidebar>
      <div className="onboarding-wrapper">
        <div className="onboarding-content-wrapper">
          <header className="onboarding-page-header">
            <div className="onboarding-header-icon">
              <FiUserPlus />
            </div>
            <div>
              <h1 className="onboarding-header-title">Pre-Onboarding Suite</h1>
              <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>Create applications and trigger candidate onboarding workflows.</p>
            </div>
          </header>

          <div className="tabs-wrapper">
            <button className="scroll-btn left" onClick={() => scrollTabs('left')}>
              <FiChevronLeft />
            </button>
            <div className="onboarding-tabs-container" ref={tabsRef}>
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`onboarding-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <button className="scroll-btn right" onClick={() => scrollTabs('right')}>
              <FiChevronRight />
            </button>
          </div>

          {error && (
            <div className="onboarding-banner banner-error">
              <FiAlertCircle /> {error}
            </div>
          )}

          {success && (
            <div className="onboarding-banner banner-success">
              <FiCheckCircle /> {success}
            </div>
          )}

          <div className="onboarding-tab-content">
            {activeTab === 'profile' && renderProfileForm()}
            {activeTab === 'documents' && renderDocumentsTab()}
            {activeTab === 'status' && renderStatusTab()}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default ApplicantCreation;