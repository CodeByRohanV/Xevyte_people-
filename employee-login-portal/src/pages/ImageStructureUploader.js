import React, { useState, useCallback } from 'react';
import api from '../api';
import './Calculations.css';

// Image upload component for structure creation
function ImageStructureUploader({ onStructureCreated, onCancel }) {
  const [step, setStep] = useState('upload'); // upload, processing, review, creating
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [extractedStructure, setExtractedStructure] = useState(null);
  const [manualText, setManualText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data for structure
  const [structureTitle, setStructureTitle] = useState('');
  const [components, setComponents] = useState([]);
  const [editingComponents, setEditingComponents] = useState(false);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!structureTitle.trim()) {
      setError('Please enter a template name');
      return;
    }
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/v1/calculations/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setUploadResponse(response.data);
      setStep('processing');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const handleProcessImage = useCallback(async () => {
    if (!uploadResponse) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/v1/calculations/process-image', {
        imageUrl: uploadResponse.imageUrl,
        extractedText: manualText || 'No text provided - using image analysis only',
      });

      setExtractedStructure(response.data);
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  }, [uploadResponse, manualText]);

  const handleCreateStructure = useCallback(async () => {
    if (!extractedStructure) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/v1/calculations/structures/from-image', extractedStructure);
      
      setSuccess('Structure created successfully!');
      setTimeout(() => {
        onStructureCreated(response.data.structure);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create structure');
    } finally {
      setLoading(false);
    }
  }, [extractedStructure, onStructureCreated]);

  const renderUploadStep = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#134e4a', marginBottom: '20px' }}>New Structure</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label className="calc-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
          Template Name *
        </label>
        <input
          type="text"
          className="calc-input"
          value={structureTitle}
          onChange={(e) => setStructureTitle(e.target.value)}
          placeholder="e.g. Salary Grade A - Engineering"
          style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label className="calc-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
          Upload Sample Structure *
        </label>
        <div 
          style={{
            border: '2px dashed #14b8a6',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            background: '#f0fdfa',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          {previewUrl ? (
            <div>
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  borderRadius: '8px',
                  marginBottom: '10px' 
                }} 
              />
              <p style={{ color: '#0d9488', fontWeight: '600' }}>{selectedFile.name}</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>Upload Image</div>
              <p style={{ color: '#64748b', margin: '10px 0' }}>
                Click to browse or drag and drop<br />
                JPG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>
          )}
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {error && (
        <div className="calc-alert calc-alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="calc-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button 
          className="calc-btn-primary" 
          onClick={handleUpload}
          disabled={!structureTitle.trim() || !selectedFile || loading}
        >
          {loading ? 'Uploading...' : 'Upload & Process'}
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3 style={{ color: '#134e4a', marginBottom: '20px' }}>Processing Image</h3>
      
      <div className="calc-spinner" style={{ marginBottom: '20px' }}>
        <div className="calc-spinner-ring" />
      </div>
      
      <p style={{ color: '#64748b', marginBottom: '20px' }}>
        Analyzing image and extracting structure components...
      </p>

      {uploadProgress > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            background: '#e2e8f0', 
            borderRadius: '4px', 
            height: '8px', 
            overflow: 'hidden' 
          }}>
            <div 
              style={{
                background: '#14b8a6',
                height: '100%',
                width: `${uploadProgress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
            {uploadProgress}% uploaded
          </p>
        </div>
      )}

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', textAlign: 'left' }}>
        <h4 style={{ color: '#334155', marginBottom: '10px' }}>Optional: Add Text Manually</h4>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="If the image text extraction is not accurate, you can paste the salary structure text here manually..."
          style={{
            width: '100%',
            height: '120px',
            padding: '10px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.9rem',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button className="calc-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button 
          className="calc-btn-primary" 
          onClick={handleProcessImage}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Continue to Review'}
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#134e4a', marginBottom: '20px' }}>Review Extracted Structure</h3>
      
      {success && (
        <div className="calc-alert calc-alert-success" style={{ marginBottom: '20px' }}>
          {success}
        </div>
      )}

      {error && (
        <div className="calc-alert calc-alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ color: '#334155', marginBottom: '10px' }}>Structure Details</h4>
        <p><strong>Name:</strong> {extractedStructure.name}</p>
        <p><strong>Description:</strong> {extractedStructure.description}</p>
        <p><strong>Confidence:</strong> {Math.round((extractedStructure.confidence || 0) * 100)}%</p>
        <p><strong>Components Found:</strong> {extractedStructure.components?.length || 0}</p>
      </div>

      {extractedStructure.components && extractedStructure.components.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#334155', marginBottom: '10px' }}>Extracted Components</h4>
          <div className="salary-table-wrapper">
            <table className="salary-struct-table">
              <thead>
                <tr>
                  <th>Component Name</th>
                  <th>Section</th>
                  <th>Type</th>
                  <th>Per Month</th>
                  <th>Per Annum</th>
                </tr>
              </thead>
              <tbody>
                {extractedStructure.components.map((comp, index) => (
                  <tr key={index}>
                    <td>{comp.componentName}</td>
                    <td>
                      <span className={`type-chip type-${comp.section === 'EARNINGS' ? 'earnings' : 'deductions'}`}>
                        {comp.section === 'EARNINGS' ? 'Earnings' : 'Deductions'}
                      </span>
                    </td>
                    <td>{comp.componentType}</td>
                    <td>Rs. {comp.perMonthValue?.toLocaleString('en-IN') || 'N/A'}</td>
                    <td>Rs. {comp.perAnnumValue?.toLocaleString('en-IN') || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="calc-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button 
          className="calc-btn-primary" 
          onClick={handleCreateStructure}
          disabled={loading || !extractedStructure?.components?.length}
        >
          {loading ? 'Creating...' : 'Create Structure'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="calc-modal-overlay">
      <div className="calc-modal" style={{ maxWidth: '800px' }}>
        <div className="calc-modal-header">
          <h2>Import Structure from Image</h2>
          <button className="calc-modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="calc-modal-body">
          {step === 'upload' && renderUploadStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'review' && renderReviewStep()}
        </div>
      </div>
    </div>
  );
}

export default ImageStructureUploader;
