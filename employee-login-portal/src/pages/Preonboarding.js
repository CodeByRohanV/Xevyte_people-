import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ViewPreOnboarding from "./ViewPreOnboarding";
import HRViewPreOnboardingDetails from "./HRViewPreOnboardingDetails";
import PreonboardingFinancePage from "./PreonboardingFinancePage";
import ConfirmationPage from "./ConfirmationPage";
import './Preonboarding.css';
import api from '../api';
import EmailInput, { validateEmail } from '../components/EmailInput';

// --- Backend APIs ---
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_URL = `${API_BASE_URL}/v1/applicants`;
const EMAIL_API = `${API_BASE_URL}/v1/emails/send-onboarding-link`;

// --- Theme Colors ---
const COLORS = {
  primary: '#00B3A4',
  primaryLight: '#33c2b6',
  primaryDark: '#008f83',
  bgGradient: '#00B3A4',
  borderTeal: '#99f6e4',
  bgTealLight: '#f0fdfd',
  shadowTeal: 'rgba(94, 234, 212, 0.3)',
  text: '#1F2937',
};

const getDisplayEmployeeId = (id) => {
  if (!id) return "";
  if (id.includes('_')) return id.split('_').pop();
  if (id.includes('-')) return id.split('-').pop();
  return id;
};

// =========================================================
// 1. NESTED DATA RENDERER COMPONENT (Handles Complex JSON)
// =========================================================

const NestedDataRenderer = ({ data, level = 0 }) => {
  if (data === null || data === undefined) {
    return <span>N/A</span>;
  }

  // Handle arrays (e.g., Education, WorkHistory)
  if (Array.isArray(data)) {
    if (data.length === 0) return <span>(Empty Array)</span>;

    return (
      <ul style={{
        listStyleType: 'decimal',
        paddingLeft: `${20 + (level * 10)}px`,
        margin: '5px 0'
      }}>
        {data.map((item, index) => (
          <li key={index} style={{ marginBottom: '5px', padding: '5px 0', borderBottom: `1px dotted ${COLORS.borderTeal}` }}>
            <strong style={{ display: 'block', color: COLORS.primary }}>Entry {index + 1}:</strong>
            <NestedDataRenderer data={item} level={level + 1} />
          </li>
        ))}
      </ul>
    );
  }

  // Handle objects
  if (typeof data === 'object') {
    const keys = Object.keys(data).filter(key => data[key] !== undefined && data[key] !== null);
    if (keys.length === 0) return <span>(Empty)</span>;

    return (
      <ul style={{
        listStyleType: 'none',
        paddingLeft: `${20 + (level * 10)}px`,
        margin: '5px 0'
      }}>
        {keys.map(key => {
          let value = data[key];
          const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

          if (typeof value === 'string' && (key.includes('File') || key.includes('Photo') || key.includes('slip')) && value.length > 50) {
            value = `[File Data: ${value.substring(0, 30)}...]`;
          }

          return (
            <li key={key} style={{ marginBottom: '3px' }}>
              <strong style={{ color: level === 0 ? COLORS.text : '#333' }}>
                {displayKey}:
              </strong>
              {(typeof value === 'object' && value !== null) || Array.isArray(value)
                ? <NestedDataRenderer data={value} level={level + 1} />
                : <span style={{ color: COLORS.text }}> {value === "" || value === null ? "N/A" : value.toString()}</span>
              }
            </li>
          );
        })}
      </ul>
    );
  }

  return <span> {data.toString() === "" ? "N/A" : data.toString()}</span>;
};

// =========================================================
// 2. APPLICANT CREATION MAIN COMPONENT
// =========================================================
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

  const [loading, setLoading] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showPreForm, setShowPreForm] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [isAM, setIsAM] = useState(false);
  const [isFinance, setIsFinance] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const tabsRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 150;
      tabsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  useEffect(() => {
    checkRoles();
    fetchCustomerList();
  }, []);

  const checkRoles = async () => {
    const empId = sessionStorage.getItem("employeeId");
    const token = sessionStorage.getItem("token");

    const safeFetchJson = async (url, options) => {
      try {
        const res = await fetch(url, options);
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }

        if (!res.ok) {
          console.warn(`Role check failed for ${url}:`, data);
          return false; // Default to false on error 
        }
        return data;
      } catch (err) {
        console.error("Fetch error:", err);
        return false;
      }
    };

    try {
      const amData = await safeFetchJson(`${API_BASE_URL}/v1/roles/check?roleName=AM&employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const financeData = await safeFetchJson(`${API_BASE_URL}/v1/roles/check?roleName=FINANCE&employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const hrData = await safeFetchJson(`${API_BASE_URL}/v1/roles/check?roleName=HR&employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ✅ Set role flags independently
      setIsAM(!!amData);
      setIsFinance(!!financeData);
      setIsHR(!!hrData);

      // ✅ Set default tab ONCE
      if (amData) setActiveTab("profile");
      else if (financeData) setActiveTab("verification");
      else if (hrData) setActiveTab("confirmation");
      else setActiveTab("access-denied");

    } catch (err) {
      console.error("Error checking roles:", err);
      setActiveTab("access-denied");
    }
  };

  const fetchCustomerList = async () => {
    try {
      const res = await api.get("/customers");
      setCustomerList(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const tabItems = [
    ...(isAM ? [{ id: 'profile', label: 'Profile Creation' }] : []),
    ...(isAM ? [{ id: 'validation', label: 'Validation' }] : []),
    ...(isFinance ? [{ id: 'verification', label: 'Verification' }] : []),
    ...(isHR ? [{ id: 'confirmation', label: 'Confirmation' }] : []),
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    setSearchTerm('');
  };

  const filteredApplicants = applicants.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
    const id = (a.applicantId || '').toString().toLowerCase();
    const position = (a.position || '').toLowerCase();
    const client = (a.client || '').toLowerCase();
    const status = (a.status || '').toLowerCase();
    return name.includes(term) || id.includes(term) || position.includes(term) || client.includes(term) || status.includes(term);
  });

  const fetchApplicants = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const filtered = data
        .filter(a => a.status !== "Onboarded")
        .sort((a, b) => {
          // Sort by timestamp if available (Newest first)
          if (a.timestamp && b.timestamp) {
            return new Date(b.timestamp) - new Date(a.timestamp);
          }
          // Fallback: Sort by Applicant ID (Handles numeric strings like "10", "2", "300" correctly)
          return String(b.applicantId).localeCompare(String(a.applicantId), undefined, { numeric: true });
        });
      setApplicants(filtered);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'validation') {
      fetchApplicants();
    }
  }, [activeTab]);

  const handleResend = async (applicant) => {
    const confirmResend = window.confirm(`Are you sure you want to resend the link to the applicant : ${getDisplayEmployeeId(applicant.applicantId)} ?`);
    if (!confirmResend) return;

    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(EMAIL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(applicant)
      });
      if (res.ok) {
        alert("✅ Invitation link resent successfully!");
        fetchApplicants();
      } else {
        alert("❌ Failed to resend invitation.");
      }
    } catch (err) {
      console.error("Resend error:", err);
      alert("❌ Error resending email.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").substring(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    console.log('File change triggered in profile creation');
    console.log('Files selected:', e.target.files);
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert("❌ Please upload only PDF or DOCX files.");
      e.target.value = "";
      return;
    }
    if (file.size > maxSize) {
      alert("⚠️ File size must not exceed 2 MB.");
      e.target.value = "";
      return;
    }

    console.log('File validation passed, updating form data');
    setFormData(prev => ({ ...prev, resume: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim()) return alert('First Name is required.');
    if (!formData.lastName.trim()) return alert('Last Name is required.');
    if (!formData.email.trim()) {
      return alert('Email Address is required.');
    }
    if (!validateEmail(formData.email.trim())) {
      return alert('Please enter a valid email address (e.g., user@example.com).');
    }
    if (!formData.phone.trim()) return alert('Phone Number is required.');
    if (formData.phone.length !== 10) return alert('Phone number must be exactly 10 digits.');
    if (!formData.position.trim()) return alert('Position is required.');
    if (!formData.client.trim()) return alert('Client is required.');
    if (!formData.resume) return alert('Please upload a resume.');

    setLoading(true);
    try {
      const token = sessionStorage.getItem("token"); // Retrieve token
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
      });

      const base64Resume = await toBase64(formData.resume);
      const payload = {
        ...formData,
        resumeName: formData.resume.name,
        base64Resume,
        amId: sessionStorage.getItem("employeeId"),
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Added token
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(responseData.message || "Error creating applicant");
      }

      const emailResponse = await fetch(EMAIL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Added token
        },
        body: JSON.stringify(responseData)
      });

      const emailText = await emailResponse.text();
      let emailData;
      try {
        emailData = JSON.parse(emailText);
      } catch (e) {
        emailData = { message: emailText };
      }

      if (!emailResponse.ok) {
        throw new Error(emailData.message || "Failed to send onboarding email");
      }

      alert(`Applicant info saved! ID: ${getDisplayEmployeeId(responseData.applicantId)}. Form sent to ${responseData.email}.`);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', position: '', client: '', resume: null });
      setActiveTab('validation');
    } catch (err) {
      alert(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const renderProfileForm = () => (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0' }}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px 24px', marginBottom: '24px' }}>
          <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
          <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
          <EmailInput
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
          <FormInput label="Position" name="position" value={formData.position} onChange={handleChange} required />

          <div style={{ marginBottom: '10px' }}>
            <label style={{ color: COLORS.text, fontWeight: 'normal', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'none', fontSize: '15px' }}>
              Client <span style={{ color: 'red' }}>*</span>
            </label>
            <select name="client" value={formData.client} onChange={handleChange} required style={inputStyle}>
              <option value="">Select Client</option>
              {customerList.map(c => <option key={c.customerId} value={c.customerName}>{c.customerName}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '10px', gridColumn: 'span 3' }}>
            <label style={{ color: COLORS.text, fontWeight: 'normal', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'none', fontSize: '15px' }}>
              Resume (PDF/DOCX - Max 2MB) <span style={{ color: 'red' }}>*</span>
            </label>
            <div style={{
              border: formData.resume ? '2px dashed #00B3A4' : '2px dashed #cbd5e1',
              padding: '0 16px 0 0',
              borderRadius: '8px',
              textAlign: 'left',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              height: '50px',
              boxSizing: 'border-box',
              backgroundColor: '#F5F7FA',
              overflow: 'hidden'
            }}>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                required
                style={{ display: 'none' }}
                id="resume-upload-input"
              />
              <label
                htmlFor="resume-upload-input"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '0 24px',
                  background: '#00B3A4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px 0 0 6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  transition: 'all 0.2s ease-in-out',
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#009485';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#00B3A4';
                }}
              >
                Choose Files
              </label>
              <div style={{
                color: formData.resume ? '#00B3A4' : '#1F2937',
                flex: 1,
                fontSize: '15px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: formData.resume ? '600' : 'normal'
              }}>
                {formData.resume ? formData.resume.name : "Click to upload"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Below the Card (Right-Aligned) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              setFormData({ firstName: '', lastName: '', email: '', phone: '', position: '', client: '', resume: null });
            }}
            style={{
              background: '#e2e8f0',
              color: '#475569',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#cbd5e1'}
            onMouseLeave={(e) => e.target.style.background = '#e2e8f0'}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButtonStyle,
              margin: 0,
              padding: '10px 24px',
              height: 'auto',
              minHeight: 'unset'
            }}
          >
            {loading ? 'Processing...' : 'Submit Profile'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderValidationTab = () => (
    <div style={{
      background: 'transparent',
      padding: '0px',
      margin: '0'
    }}>
      <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
        <table className="preonboarding-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Position</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.length > 0 ? filteredApplicants.map(a => {
              const isExpired = a.status === 'Initiated' && (() => {
                if (!a.timestamp) return false;
                const createdTime = new Date(a.timestamp);
                const now = new Date();
                const diffInMs = now - createdTime;
                const minutesPassed = diffInMs / (1000 * 60);
                return minutesPassed > 1440; // 24-hour limit
              })();

              return (
                <tr key={a.applicantId} style={{ transition: 'all 0.2s' }}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>{getDisplayEmployeeId(a.applicantId)}</td>
                  <td style={tdStyle}>{a.firstName} {a.lastName}</td>
                  <td style={tdStyle}>{a.position}</td>
                  <td style={tdStyle}>{a.client}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: COLORS.text,
                    }}>
                      {isExpired ? 'Expired' : a.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                    {isExpired ? (
                      <button
                        onClick={() => handleResend(a)}
                        style={rowButtonStyle(a.status)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#00B3A4';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.color = '#00B3A4';
                        }}
                      >
                        Resend
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (a.status === 'Initiated') {
                            alert("The candidate has not yet submitted the data, so please try some other time.");
                          } else {
                            setShowPreForm(a.applicantId);
                          }
                        }}
                        style={rowButtonStyle(a.status)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#00B3A4';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.color = '#00B3A4';
                        }}
                      >
                        {a.status.includes('Pending') || a.status.includes('Declined') ? 'Review' : 'View'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            }) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No applicants found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccessDenied = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 48px)',
      padding: '24px',
      backgroundColor: 'linear-gradient(to bottom, #ffffff 0%, #f0faf9 100%)',
      flexGrow: 1
    }}>
      <div style={{
        maxWidth: '95%',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center',
        padding: '30px',
        background: '#ffffff',
        borderRadius: '0px',
        boxShadow: 'none',
        border: `2px solid ${COLORS.borderTeal}`
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid #fecaca`
        }}>
          <span style={{ color: '#dc2626', fontSize: '20px', fontWeight: 'bold' }}>✕</span>
        </div>
        <h2 style={{
          color: COLORS.primary,
          marginBottom: '15px',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Access Restricted
        </h2>

        <p style={{
          color: '#64748b',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '25px'
        }}>
          You have access to the <strong>Pre-Onboarding</strong> module, however your current role does not have the required permissions to view or manage applicant records.
        </p>

        <p style={{
          color: '#64748b',
          fontSize: '14px',
          marginTop: '20px',
          fontStyle: 'italic'
        }}>
          If you require this access, please contact your administrator to request the appropriate permissions.
        </p>
      </div>
    </div>
  );

  return (
    <Sidebar>
      <div style={{ padding: '24px', background: '#F5F7FA', minHeight: '100vh' }}>

        {/* ✅ PAGE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 style={{ margin: 0, padding: 0, fontWeight: 'normal', fontSize: '30px', color: '#1F2937', fontFamily: "'Inter', sans-serif" }}>
              Pre-Onboarding
            </h1>
            <p style={{ color: '#00B3A4', fontSize: '15px', margin: '5px 0 0 0', padding: 0, fontFamily: "'Inter', sans-serif" }}>
              Manage applicant profiles, credentials verification, and validation flow
            </p>
          </div>

          {activeTab !== 'profile' && activeTab !== 'access-denied' && (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search applicant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: '18px',
                  width: '250px',
                  marginBottom: 0,
                  borderRadius: '8px'
                }}
              />
            </div>
          )}
        </div>

        {activeTab !== 'access-denied' && (
          <div className="preonboarding-tabs-wrapper">
            <button className="scroll-btn left" onClick={() => scrollTabs('left')}>
              ‹
            </button>
            <div className="preonboarding-tabs-container" ref={tabsRef}>
              {tabItems.map((tab, idx) => {
                const borderRadiusStyle = {};
                if (tabItems.length === 1) {
                  borderRadiusStyle.borderRadius = '8px';
                } else if (idx === 0) {
                  borderRadiusStyle.borderTopLeftRadius = '8px';
                  borderRadiusStyle.borderBottomLeftRadius = '8px';
                } else if (idx === tabItems.length - 1) {
                  borderRadiusStyle.borderTopRightRadius = '8px';
                  borderRadiusStyle.borderBottomRightRadius = '8px';
                } else {
                  borderRadiusStyle.borderRadius = '0px';
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    style={{ ...tabStyleSheet(activeTab === tab.id), ...borderRadiusStyle }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button className="scroll-btn right" onClick={() => scrollTabs('right')}>
              ›
            </button>
          </div>
        )}

        <div>
          {activeTab === 'profile' && isAM && renderProfileForm()}
          {activeTab === 'validation' && isAM && renderValidationTab()}
          {activeTab === 'verification' && isFinance && <PreonboardingFinancePage searchTerm={searchTerm} />}
          {activeTab === 'confirmation' && isHR && <ConfirmationPage searchTerm={searchTerm} />}
          {activeTab === 'access-denied' && renderAccessDenied()}
        </div>

        {showPreForm && (
          <div className="review-modal-overlay">
            <div className="review-modal-box">
              <div className="review-applicant-header">
                <h3 className="review-applicant-title" style={{ color: COLORS.text, margin: 0, fontWeight: 'normal' }}>Review Data</h3>
                <button onClick={() => setShowPreForm(null)} className="review-close-btn"><span style={{ fontSize: '24px' }}>✕</span></button>
              </div>
              <div className="review-modal-content">
                <div className="review-applicant-content">
                  <ViewPreOnboarding externalApplicantId={showPreForm} onClose={() => setShowPreForm(null)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

// --- Internal Helper Components ---
const FormInput = ({ label, name, value, onChange, type = "text", required }) => (
  <div style={{ marginBottom: '10px' }}>
    <label style={{ color: COLORS.text, fontWeight: 'normal', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'none', fontSize: '15px' }}>
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </label>
    <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={`Enter ${label}`} style={inputStyle} />
  </div>
);

// --- Styled Objects ---
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color 0.2s',
  marginBottom: '4px',
  color: COLORS.text,
  boxSizing: 'border-box',
  boxShadow: 'none',
  backgroundColor: '#F5F7FA',
};

const tabStyleSheet = (active) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  gap: '0.625rem',
  padding: '0.75rem 1.5rem',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: 'none',
  background: active ? '#1F6FEB' : '#0B3D91',
  color: '#fff',
  boxShadow: 'none',
  transform: 'none',
  wordBreak: 'keep-all',
  whiteSpace: 'nowrap',
});

const submitButtonStyle = {
  width: 'auto',
  padding: '16px',
  background: COLORS.bgGradient,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '800',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  marginTop: '30px',
  boxShadow: 'none',
  transition: 'all 0.3s',
};

const thStyle = {
  backgroundColor: '#629AF1',
  color: '#fff',
  padding: '16px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '15px',
  textTransform: 'capitalize',
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '16px',
  backgroundColor: '#ffffff',
  color: COLORS.text,
  fontSize: '15px',
  fontWeight: '500',
};

const rowButtonStyle = (status) => ({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '95px',
  padding: '5px 0',
  borderRadius: '8px',
  border: '1px solid #00B3A4',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  backgroundColor: '#ffffff',
  color: '#00B3A4',
  transition: 'all 0.2s ease-in-out',
  boxShadow: 'none',
});

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: '280px',
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10001,
  backdropFilter: 'blur(4px)',
  padding: '20px',
};

const modalBoxStyle = {
  width: '100%',
  maxWidth: '1000px',
  maxHeight: '90vh',
  background: '#fff',
  borderRadius: '8px',
  padding: '0px', // Removed padding to fix sticky header overlap
  overflowY: 'auto',
  boxShadow: 'none',
  position: 'relative',
};

export default ApplicantCreation;