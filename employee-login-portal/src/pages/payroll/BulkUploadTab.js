import React, { useState, useEffect } from 'react';
import api from '../../api';
import * as XLSX from "xlsx";
import './BulkUploadTab.css';
import { FiUploadCloud, FiDownload, FiInfo, FiFileText, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const BulkUploadTab = ({ onEmployeesUpdate, onTemplateData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [messageCode, setMessageCode] = useState("");

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (messageType === 'success' && message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ];

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isExcelOrCsv = allowedTypes.includes(file.type) || ['xlsx', 'xls', 'csv'].includes(fileExtension);

    if (!isExcelOrCsv) {
      alert("Please upload a valid Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setSelectedFile(file);
    
    await handleTemplateRead(file);
    onTemplateData && onTemplateData(null);
  };

  const handleTemplateRead = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length === 0) {
        alert("This file is EMPTY. Please upload a valid salary configuration file.");
        setSelectedFile(null);
        return;
      }

      const REQUIRED_COLUMNS = ["employee_id", "Employee ID", "Salary Month", "Salary Year", "Month", "Year"];
      const headers = Object.keys(json[0]);
      const hasRequiredColumns = REQUIRED_COLUMNS.some(col => headers.includes(col));

      if (!hasRequiredColumns) {
        alert("Invalid Template Format. Please use the official template.");
        setSelectedFile(null);
        return;
      }

      const raw = json[0];
      const mapped = {
        employeeId: raw["employee_id"] || raw["Employee ID"] || "",
        employeeName: raw["Employee Name"] || "",
        basicDA: raw["Basic & Dearness Allowance Monthly"] || "",
        hra: raw["House Rent Allowance Monthly"] || "",
        specialAllowance: raw["Spl. Allowance Monthly"] || "",
      };

      onTemplateData && onTemplateData(mapped);
    } catch (err) {
      console.error("Excel read failed:", err);
      alert("❌ Failed to process file.");
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Validate Excel file before uploading
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length === 0) {
        alert("Cannot upload empty file. Please add data to the Excel file.");
        setUploading(false);
        return;
      }

      // Validate mandatory fields for each row
      const errors = [];
      const missingFieldsSet = new Set();
      const mandatoryFields = [
        { key: ["employee_id", "Employee ID"], label: "Employee ID" },
        { key: ["Salary Month", "Month"], label: "Salary Month" },
        { key: ["Salary Year", "Year"], label: "Salary Year" }
      ];

      json.forEach((row, index) => {

        const missingFields = [];

        mandatoryFields.forEach(field => {
          const value = field.key.map(k => row[k]).find(v => v !== undefined && v !== null && v !== "");
          if (!value || String(value).trim() === "") {
            missingFields.push(field.label);
            missingFieldsSet.add(field.label);
          }
        });

        if (missingFields.length > 0) {
          errors.push(true);
        }
      });

      if (errors.length > 0) {
        const missingFieldsList = Array.from(missingFieldsSet).join(", ");
        alert(`Validation failed! ${errors.length} row(s) have missing mandatory fields: ${missingFieldsList}`);
        setUploading(false);
        return;
      }

      // If validation passes, proceed with upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post("/payroll/salary-config/bulk-excel", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const count = response.data.count !== undefined ? response.data.count : 'batch';
      alert(`Successfully uploaded ${count} configurations!`);
      setSelectedFile(null);

      // Reset file input to allow re-uploading the same file
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';

      if (onEmployeesUpdate) {
        onEmployeesUpdate();
      }
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/payroll/salary-config/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "salary_configuration_template.xlsx";
      link.click();
    } catch (error) {
      alert("Failed to download template");
    }
  };

  return (
    <div className="bulk-upload-container">
      <h3 style={{ color: '#115e59', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FiUploadCloud /> Bulk Salary Import
      </h3>

      <div style={{ backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem' }}>
        <h4 style={{ color: '#0d9488', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiInfo /> Requirements
        </h4>
        <ul style={{ margin: '0', paddingLeft: '1.25rem', color: '#115e59', fontSize: '0.875rem', lineHeight: '1.6' }}>
          <li>File must be in Excel (.xlsx, .xls) or CSV format.</li>
          <li>Duplicate entries will update existing records automatically.</li>
          <li><strong>Mandatory fields: Employee ID, Salary Month, and Salary Year must be filled for all rows.</strong></li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
        <button
          onClick={downloadTemplate}
          className="payroll-btn"
          style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}
        >
          <FiDownload /> Download Template
        </button>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <label className="payroll-form-label" style={{ fontWeight: '700', color: '#115e59', fontSize: '0.875rem' }}>Document Attachment</label>
        <div
          style={{
            border: '2px dashed #ccfbf1',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
            background: '#fbfcfd',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <FiFileText style={{ fontSize: '2.5rem', color: '#2dd4bf', marginBottom: '1rem' }} />
          <p style={{ margin: 0, color: '#64748b' }}>
            {selectedFile ? selectedFile.name : 'Click to select or drag & drop configuration file'}
          </p>
          {selectedFile && <small style={{ color: '#94a3b8' }}>{(selectedFile.size / 1024).toFixed(2)} KB</small>}
        </div>
      </div>

      {selectedFile && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
          <button
            onClick={handleUpload}
            className="payroll-btn payroll-btn-primary"
            style={{ flex: 1 }}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : <><FiUploadCloud /> Confirm & Process</>}
          </button>
          <button
            className="payroll-btn"
            style={{ border: '1px solid #fee2e2', color: '#dc2626', background: '#fef2f2' }}
            onClick={() => {
              setSelectedFile(null);
              setMessage('');
              const fileInput = document.getElementById('fileInput');
              if (fileInput) fileInput.value = '';
            }}
          >
            <FiX /> Cancel
          </button>
        </div>
      )}

      {message && (
        <div className="message-banner" style={{
          backgroundColor: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
          color: messageType === 'success' ? '#16a34a' : '#dc2626',
          border: '1px solid currentColor',
          opacity: 0.9
        }}>
          {messageType === 'success' ? <FiCheckCircle /> : <FiAlertCircle />} {message}
        </div>
      )}
    </div>
  );
};

export default BulkUploadTab;
