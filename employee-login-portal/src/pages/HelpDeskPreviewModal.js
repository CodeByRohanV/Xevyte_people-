import React from 'react';
import ReactDOM from 'react-dom';

const HelpDeskPreviewModal = ({ isOpen, onClose, fileUrl, fileType, fileName }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="preview-modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: window.innerWidth > 768 ? '280px' : '0',
            width: window.innerWidth > 768 ? 'calc(100% - 280px)' : '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999
        }}>
            <div className="preview-modal-content" onClick={e => e.stopPropagation()} style={{
                backgroundColor: 'white',
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                borderRadius: '0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'none',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <div className="preview-modal-header" style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: '600' }}>
                        Document Preview: {fileName}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        title="Close Preview"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="preview-modal-body" style={{
                    flex: 1,
                    overflow: 'hidden',
                    padding: '0',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative'
                }}>
                    {fileType === 'pdf' ? (
                        <iframe
                            src={fileUrl}
                            title="PDF Preview"
                            width="100%"
                            height="100%"
                            style={{ border: 'none', backgroundColor: 'white' }}
                        />
                    ) : (
                        <div style={{ padding: '24px', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                            <img
                                src={fileUrl}
                                alt="Document Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '4px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="preview-modal-footer" style={{
                    padding: '12px 24px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    backgroundColor: 'white'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 20px',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default HelpDeskPreviewModal;
