import React, { useEffect, useState } from 'react';
import api from '../api';
import './Grievance.css';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiUploadCloud } from 'react-icons/fi';

export default function AnonymousGrievanceForm() {
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [anonymousAck, setAnonymousAck] = useState(false);
  const [isFileActive, setIsFileActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [grievanceId, setGrievanceId] = useState('');

  const [dbCategories, setDbCategories] = useState([]);
  const [dbTypes, setDbTypes] = useState([]);

  const maxSubjectLength = 150;
  const maxDescriptionLength = 500;

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (!selected) {
      setFile(null);
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selected.type)) {
      setError('Attachment must be PDF, JPG, or PNG.');
      setFile(null);
      return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (selected.size > maxSize) {
      setError('Attachment must be at most 2 MB.');
      setFile(null);
      return;
    }
    setError('');
    setFile(selected);
  };

  const validateForm = () => {
    if (!category) return 'Category is required.';
    if (category === 'Other') {
      if (!customCategory.trim()) return 'Please specify a category.';
      if (customCategory.trim().length < 3) return 'Category must be at least 3 characters long.';
    }
    if (!subject.trim()) return 'Subject is required.';
    if (subject.length > maxSubjectLength) return 'Subject must be at most 150 characters.';
    const trimmed = description.trim();
    if (!trimmed) return 'Description is required.';
    if (trimmed.length < 10 || trimmed.length > maxDescriptionLength) return 'Description must be between 10 and 500 characters.';
    if (!anonymousAck) return 'You must acknowledge that this is anonymous.';
    return '';
  };
    const getPropperDate = () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setGrievanceId('');
        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        // Project Assignment Validation
        try {
            let empId = sessionStorage.getItem("employeeId");
            if (empId && empId.startsWith('"') && empId.endsWith('"')) empId = empId.slice(1, -1);
            const todayStr = getPropperDate();
            const res = await api.get(`/allocations/employee/${empId}/date/${todayStr}`, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
            });

            if (!res.data || res.data.length === 0) {
                alert("You are not assigned to any project , please contact your manager or admin");
                return;
            }
        } catch (err) {
            console.error("Failed to verify project assignment", err);
        }

        const selectedCategory = category === 'Other' ? `Other: ${customCategory.trim()}` : category;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('category', selectedCategory);
            if (type) formData.append('type', type);
            formData.append('subject', subject.trim());
            formData.append('description', description.trim());
            if (file) formData.append('file', file);

            const token = sessionStorage.getItem("token");
            let empId = sessionStorage.getItem("employeeId");
            if (empId && empId.startsWith('"') && empId.endsWith('"')) empId = empId.slice(1, -1);

            const response = await api.post(
                "/grievances/anonymous",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                        employeeId: empId
                    }
                }
            );

      const message = response.data.message || 'Thank you. Your feedback has been submitted anonymously.';
      const grievanceId = response.data.grievanceId || '';
      alert(message + (grievanceId ? `\nGrievance ID: ${grievanceId}` : ''));
      setSuccessMessage(''); // Clear the UI message since we show alert
      setGrievanceId(''); // Clear the UI grievance ID since we show alert
      setCategory('');
      setCustomCategory('');
      setType('');
      setSubject('');
      setDescription('');
      setFile(null);
      setAnonymousAck(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await api.get("/v1/all-categories/all");
        const data = res.data;
        setDbCategories([...new Set(data.filter(x => x.grievanceCategory).map(x => x.grievanceCategory))]);
        setDbTypes([...new Set(data.filter(x => x.grievanceType).map(x => x.grievanceType))]);
      } catch (err) {
        console.error("Error loading grievance master", err);
      }
    };
    loadOptions();
  }, []);


  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage('');
      setGrievanceId('');
    }, 10000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  return (

    <div className="grievance-card">
      <div className="grievance-message-banner" style={{ backgroundColor: 'transparent', color: '#00B3A4', border: 'none' }}>
        <FiInfo /> This form is completely anonymous. Your identity will not be recorded. Please provide detailed information to assist the review team.
      </div>

      {error && (
        <div className="grievance-message-banner" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {successMessage && (
        <div className="grievance-message-banner" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}>
          <FiCheckCircle />
          <div>
            {successMessage}
            {grievanceId && <div>Grievance ID: <strong>{grievanceId}</strong></div>}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grievance-form-grid">
          <div className="grievance-form-group">
            <label className="grievance-label">Category <span className="grievance-required">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="grievance-input full-width"
              required
            >
              <option value="">Select category</option>
              {dbCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {category === 'Other' && (
              <div style={{ marginTop: '0.5rem' }}>
                <label className="grievance-label">Please specify <span className="grievance-required">*</span></label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="grievance-input full-width"
                  placeholder="Enter category"
                  style={{
                    borderRadius: '4px',
                    border: '1.5px solid #e2e8f0',
                    height: '48px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9375rem',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    width: '100%',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    MozAppearance: 'none'
                  }}
                  required
                />
              </div>
            )}

          </div>

          <div className="grievance-form-group">
            <label className="grievance-label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="grievance-input full-width">
              <option value="">Select type (optional)</option>
              {dbTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grievance-form-group">
            <label className="grievance-label">Subject <span className="grievance-required">*</span></label>
            <input
              id="grievance-subject-input"
              type="text"
              maxLength={maxSubjectLength}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="grievance-input full-width"
              placeholder="Enter subject"
              style={{
                borderRadius: '4px',
                border: '1.5px solid #e2e8f0',
                height: '48px',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                width: '100%',
                outline: 'none',
                WebkitAppearance: 'none',
                appearance: 'none',
                MozAppearance: 'none'
              }}
              required
            />
            <span className="grievance-helper-text">{subject.length}/{maxSubjectLength} characters</span>
          </div>

          <div className="grievance-form-group">
            <label className="grievance-label">Description <span className="grievance-required">*</span></label>
            <textarea
              maxLength={maxDescriptionLength}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="grievance-input full-width textarea"
              placeholder="Enter details"
              required
              style={{
                height: '48px',
                minHeight: '48px',
                maxHeight: '48px',
                resize: 'none',
                borderRadius: '4px',
                border: '1.5px solid #e2e8f0',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                width: '100%',
                outline: 'none',
                WebkitAppearance: 'none',
                appearance: 'none',
                MozAppearance: 'none'
              }}
            />
            <span className="grievance-helper-text">{description.length}/{maxDescriptionLength} characters</span>
          </div>

          <div className="grievance-form-group full-width">
            <label className="grievance-label">Attachment (Optional)</label>
            <div 
              onMouseEnter={() => setIsFileActive(true)}
              onMouseLeave={() => setIsFileActive(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                border: (file || isFileActive) ? '1.5px solid #00B3A4' : '1.5px solid #cbd5e1',
                borderRadius: '4px',
                height: '42px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.25s ease',
                boxShadow: isFileActive ? '0 0 0 3px rgba(0, 179, 164, 0.15)' : 'none'
              }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="grievance-file"
              />
              <label
                htmlFor="grievance-file"
                onFocus={() => setIsFileActive(true)}
                onBlur={() => setIsFileActive(false)}
                tabIndex={0}
                style={{
                  backgroundColor: '#eef2f6',
                  padding: '0 1.5rem',
                  cursor: 'pointer',
                  borderRight: (file || isFileActive) ? '1.5px solid #00B3A4' : '1.5px solid #cbd5e1',
                  fontWeight: 800,
                  color: (file || isFileActive) ? '#00B3A4' : '#475569',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.25s ease',
                  textTransform: 'uppercase',
                  outline: 'none'
                }}
              >
                CHOOSE FILE
              </label>
              <span style={{
                padding: '0 1rem',
                color: file ? '#1e293b' : '#94a3b8',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {file ? file.name : 'No file chosen'}
              </span>
            </div>
            <span className="grievance-helper-text" style={{ textAlign: 'left' }}>Allowed: PDF, JPG, PNG (Max: 2 MB)</span>
          </div>

          <div className="grievance-form-group full-width">
            <label className="grievance-checkbox-label">
              <input
                type="checkbox"
                checked={anonymousAck}
                onChange={(e) => setAnonymousAck(e.target.checked)}
                className="grievance-checkbox-hidden"
              />
              <span className="grievance-custom-checkbox"></span>
              <span className="grievance-checkbox-text">I understand this submission is anonymous and cannot be retrieved once submitted.</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={submitting} className="grievance-btn grievance-btn-primary" style={{ minWidth: '180px' }}>
            {submitting ? 'Submitting...' : 'Submit Grievance'}
          </button>
        </div>
      </form >
    </div >
  );
}
