import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * Reusable top-right toast notification.
 * Props:
 *  - isOpen   : boolean
 *  - onClose  : () => void
 *  - message  : string
 *  - type     : 'success' | 'error' | 'info'  (default: 'success')
 *  - duration : ms before auto-dismiss        (default: 4000)
 */
const ToastNotification = ({ isOpen, onClose, message, type = 'success', duration = 4000 }) => {
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [isOpen, onClose, duration]);

    if (!isOpen || !message) return null;

    const config = {
        success: {
            borderColor: '#1a9e6e',
            iconBg: '#e8f7f0',
            iconStroke: '#1a9e6e',
            progressColor: '#1a9e6e',
            progressBg: '#e0f4ec',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#1a9e6e" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ),
            title: 'Success!',
        },
        error: {
            borderColor: '#ef4444',
            iconBg: '#fef2f2',
            iconStroke: '#ef4444',
            progressColor: '#ef4444',
            progressBg: '#fde8e8',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            ),
            title: 'Error',
        },
        info: {
            borderColor: '#3b82f6',
            iconBg: '#eff6ff',
            iconStroke: '#3b82f6',
            progressColor: '#3b82f6',
            progressBg: '#dbeafe',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#3b82f6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            ),
            title: 'Info',
        },
    };

    const c = config[type] || config.success;
    const animDuration = `${duration}ms`;

    return ReactDOM.createPortal(
        <>
            <style>{`
                @keyframes toastIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes toastShrink {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
                .toast-close-btn:hover {
                    background-color: rgba(0,0,0,0.07) !important;
                    color: #333 !important;
                }
            `}</style>

            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 999999,
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
                minWidth: '300px',
                maxWidth: '380px',
                overflow: 'hidden',
                borderLeft: `4px solid ${c.borderColor}`,
                animation: 'toastIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
            }}>
                {/* Content row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 14px 12px 14px',
                }}>
                    {/* Icon circle */}
                    <div style={{
                        flexShrink: 0,
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: c.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {c.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            margin: '0 0 3px 0',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#1a1a2e',
                            lineHeight: '1.3',
                        }}>
                            {c.title}
                        </p>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#555',
                            lineHeight: '1.5',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {message}
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        className="toast-close-btn"
                        onClick={onClose}
                        style={{
                            flexShrink: 0,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            color: '#aaa',
                            fontSize: '18px',
                            lineHeight: 1,
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                            marginTop: '-2px',
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Progress bar */}
                <div style={{ height: '3px', backgroundColor: c.progressBg }}>
                    <div style={{
                        height: '100%',
                        backgroundColor: c.progressColor,
                        animation: `toastShrink ${animDuration} linear forwards`,
                    }} />
                </div>
            </div>
        </>,
        document.body
    );
};

export default ToastNotification;
