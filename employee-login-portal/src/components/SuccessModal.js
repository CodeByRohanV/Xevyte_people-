// SuccessModal is now a thin wrapper around the shared ToastNotification component.
// This keeps backward compatibility with all existing usages.
import React from 'react';
import ToastNotification from './ToastNotification';

const SuccessModal = ({ isOpen, onClose, message }) => (
    <ToastNotification
        isOpen={isOpen}
        onClose={onClose}
        message={message}
        type="success"
        duration={4000}
    />
);

export default SuccessModal;
