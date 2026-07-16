import React from 'react';

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
};

const EmailInput = ({ 
  label = "Email", 
  name = "email", 
  value, 
  onChange, 
  required, 
  disabled, 
  style, 
  placeholder = "Enter Email" 
}) => {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ 
        color: '#1F2937', 
        fontWeight: 'normal', 
        marginBottom: '6px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        textTransform: 'none', 
        fontSize: '15px' 
      }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <input
        type="email"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontSize: '15px',
          outline: 'none',
          transition: 'all 0.2s',
          marginBottom: '4px',
          color: '#1F2937',
          boxSizing: 'border-box',
          boxShadow: 'none',
          backgroundColor: '#F5F7FA',
          ...style
        }}
      />
    </div>
  );
};

export default EmailInput;
