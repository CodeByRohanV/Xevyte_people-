import React, { useState } from 'react';
import api from '../api';
import './Grievance.css';
import { FiSearch, FiActivity, FiAlertCircle } from 'react-icons/fi';

export default function GrievanceTrackPage() {
  const [grievanceIdInput, setGrievanceIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const id = grievanceIdInput.trim();
    if (!id) {
      setError('Please enter your grievance ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/grievances/${encodeURIComponent(id)}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Grievance not found.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Submitted': return 'status-submitted';
      case 'In Review': return 'status-in-review';
      case 'Action Taken': return 'status-action-taken';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  };

  return (
    <div className="grievance-card">
      <div className="grievance-message-banner" style={{ backgroundColor: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1' }}>
        <FiActivity /> Enter your unique grievance ID to track the progress of your investigation.
      </div>

      {error && (
        <div className="grievance-message-banner" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grievance-search-container">
          <div className="grievance-search-bar">
            <input
              type="text"
              placeholder="Enter Grievance ID (e.g. GRV-12345)"
              value={grievanceIdInput}
              onChange={(e) => setGrievanceIdInput(e.target.value)}
              className="grievance-input"
            />
            <button type="submit" disabled={loading} className="grievance-btn grievance-btn-primary search-btn">
              {loading ? 'Searching...' : <><FiSearch /> Track Progress</>}
            </button>
          </div>
        </div>
      </form>

      {result && (
        <div className="grievance-content-wrapper" style={{ marginTop: '1.5rem' }}>
          <div className="grievance-modal-header" style={{ marginBottom: '1rem' }}>
            <h2 className="grievance-modal-title" style={{ fontSize: '1.2rem' }}>Current Status: <span className={`grievance-status ${getStatusClass(result.status)}`}>{result.status}</span></h2>
          </div>

          <div className="grievance-detail-grid">
            <div className="grievance-detail-item">
              <span className="grievance-detail-label">Grievance ID</span>
              <span className="grievance-detail-value">{result.grievanceId}</span>
            </div>
            <div className="grievance-detail-item">
              <span className="grievance-detail-label">Category</span>
              <span className="grievance-detail-value">{result.category}</span>
            </div>
            <div className="grievance-detail-item full-width">
              <span className="grievance-detail-label">Subject</span>
              <span className="grievance-detail-value">{result.subject}</span>
            </div>
            <div className="grievance-detail-item full-width">
              <span className="grievance-detail-label">Description</span>
              <div className="grievance-description-box">{result.description}</div>
            </div>
            <div className="grievance-detail-item full-width">
              <span className="grievance-detail-label">Official Response</span>
              <div className="grievance-description-box" style={{ background: '#f0fdfa', borderColor: '#ccfbf1', color: '#0f766e', fontWeight: 500 }}>
                {result.adminResponse || 'The investigation is currently underway. Please check back later for updates.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

