import React, { useEffect, useState } from "react";
import { getISTAsDateObject, getPropperDate } from '../utils/DateUtils';
import api from "../api";
import "./DocumentHub.css";
import { FiEye, FiDownload, FiInfo, FiAlertCircle, FiBriefcase } from 'react-icons/fi';

const DocumentTable = ({ documents, viewPdf, downloadPdf, isPayslip }) => {
  const getDisplayMonthYear = (doc) => {
    if (isPayslip) return { month: doc.salaryMonth, year: doc.salaryYear };
    const year = doc.year || doc.documentYear || (doc.uploadTimestamp && getISTAsDateObject(doc.uploadTimestamp).getFullYear());
    const month = doc.month || (doc.uploadTimestamp ? getISTAsDateObject(doc.uploadTimestamp).toLocaleString("default", { month: "long" }) : "N/A");
    return { month, year };
  };

  return (
    <div className="document-hub-table-wrapper scrollbar-hidden">
      <table className="document-hub-main-table">
        <thead>
          <tr>
            {!isPayslip && <th>Document Name</th>}
            {isPayslip && <th>Month</th>}
            <th>Year</th>
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const { month, year } = getDisplayMonthYear(doc);
            return (
              <tr key={doc.id}>
                {!isPayslip && <td style={{ fontWeight: '500' }}>{doc.documentName || "N/A"}</td>}
                {isPayslip && <td style={{ fontWeight: '600' }}>{month}</td>}
                <td>{year}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => viewPdf(doc.id)} className="document-hub-btn document-hub-btn-view" title="View">
                      <FiEye size={18} />
                    </button>
                    <button onClick={() => downloadPdf(doc.id)} className="document-hub-btn document-hub-btn-download" title="Download">
                      <FiDownload size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function EmploymentDocs({ viewType }) {
  const activeTab = viewType;
  const [payslips, setPayslips] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const employeeId = sessionStorage.getItem("employeeId");

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = parseInt(getPropperDate().slice(0, 4));
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const [selectedMonth, setSelectedMonth] = useState(months);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedDocYear, setSelectedDocYear] = useState(currentYear.toString());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  const toggleMonth = (month) => {
    setSelectedMonth(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const selectAllMonths = () => {
    if (selectedMonth.length === months.length) setSelectedMonth([]);
    else setSelectedMonth(months);
  };

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      let token = sessionStorage.getItem("token");
      if (token?.startsWith('"')) {
        token = token.replace(/^"|"$/g, "");
      }

      console.log('Fetching documents from: /v1/workflow/documents');

      const res = await api.get(`/v1/workflow/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Documents fetched:', res.data);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };


  const fetchPayslips = async () => {
    if (!selectedYear) {
      setPayslips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let token = sessionStorage.getItem("token");
      if (token?.startsWith('"')) {
        token = token.replace(/^"|"$/g, "");
      }

      const res = await api.get(
        `/payroll/payslips/employee/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = res.data || [];

      let filtered = data.filter(
        (p) => Number(p.salaryYear) === Number(selectedYear)
      );

      if (selectedMonth.length > 0) {
        filtered = filtered.filter((p) =>
          selectedMonth.includes(p.salaryMonth)
        );
      }

      filtered.sort(
        (a, b) =>
          months.indexOf(a.salaryMonth) - months.indexOf(b.salaryMonth)
      );

      setPayslips(filtered);
    } catch (err) {
      console.error(err);
      setError("Failed to load payslips.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (activeTab === "Payslips") fetchPayslips();
    else if (activeTab === "Documents") fetchAllDocuments();
  }, [activeTab, selectedYear, selectedMonth]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMonthDropdownOpen && !event.target.closest('.custom-multiselect-container')) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMonthDropdownOpen]);
  const viewPdf = async (id) => {
    try {
      // Validate ID before making request
      if (!id || id <= 0) {
        alert("Invalid document ID. Please refresh the page and try again.");
        return;
      }

      let token = sessionStorage.getItem("token");
      if (token?.startsWith('"')) {
        token = token.replace(/^"|"$/g, "");
      }

      console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL);
      console.log('Axios baseURL:', api.defaults.baseURL);

      const url =
        activeTab === "Payslips"
          ? `/payroll/payslip/${id}/pdf`
          : `/v1/workflow/document/${id}/download`;

      console.log('Attempting to view document:', { id, url, activeTab });

      const res = await api.get(url, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Document retrieved successfully:', res.status);

      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = window.URL.createObjectURL(blob);
      window.open(link, "_blank");
    } catch (err) {
      console.error('Error viewing document:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 404) {
          alert("Document not found. The document may have been deleted or does not exist. Please refresh the page and try again.");
        } else if (err.response.status === 401) {
          alert("Your session has expired. Please login again.");
        } else if (err.response.status === 403) {
          alert("You don't have permission to access this document.");
        } else {
          alert(`Unable to preview PDF (Error ${err.response.status}). Please try again later.`);
        }
      } else {
        alert("Unable to preview PDF. Please check your internet connection and try again.");
      }
    }
  };


  const downloadPdf = async (id) => {
    try {
      // Validate ID before making request
      if (!id || id <= 0) {
        alert("Invalid document ID. Please refresh the page and try again.");
        return;
      }

      let token = sessionStorage.getItem("token");
      if (token?.startsWith('"')) {
        token = token.replace(/^"|"$/g, "");
      }

      const url =
        activeTab === "Payslips"
          ? `/payroll/payslip/${id}/pdf`
          : `/v1/workflow/document/${id}/download`;

      console.log('Attempting to download document:', { id, url, activeTab });

      const res = await api.get(url, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileURL;
      a.download = `${activeTab}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Error downloading document:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 404) {
          alert("Document not found. The document may have been deleted or does not exist. Please refresh the page and try again.");
        } else if (err.response.status === 401) {
          alert("Your session has expired. Please login again.");
        } else if (err.response.status === 403) {
          alert("You don't have permission to access this document.");
        } else {
          alert(`Unable to download PDF (Error ${err.response.status}). Please try again later.`);
        }
      } else {
        alert("Unable to download PDF. Please check your internet connection and try again.");
      }
    }
  };


  const renderPayslips = () => (
    <>
      <div className="document-hub-filter-container">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="custom-multiselect-container">
            <div
              className={`document-hub-input multiselect-trigger ${!selectedYear ? 'disabled' : ''}`}
              onClick={() => selectedYear && setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            >
              {selectedMonth.length === months.length ? "All Months" : selectedMonth.length === 0 ? "No Months" : `${selectedMonth.length} Selected`}
            </div>
            {isMonthDropdownOpen && (
              <div className="multiselect-dropdown">
                <label className="multiselect-option select-all">
                  <input
                    type="checkbox"
                    checked={selectedMonth.length === months.length}
                    onChange={selectAllMonths}
                  />
                  <span>Select All</span>
                </label>
                <div className="multiselect-options-list">
                  {months.map((m) => (
                    <label key={m} className="multiselect-option">
                      <input
                        type="checkbox"
                        checked={selectedMonth.includes(m)}
                        onChange={() => toggleMonth(m)}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="document-hub-input">
            <option value="">Select Year</option>
            {yearOptions.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
      </div>

      {loading && selectedYear && (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#0d9488', fontWeight: 'bold' }}>Fetching payslips...</p>
        </div>
      )}

      {error && (
        <div className="message-banner" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid currentColor' }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {!loading && !error && !selectedYear && (
        <div className="message-banner" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bcf0da' }}>
          <FiInfo /> Please select a year to view your payslips.
        </div>
      )}

      {!loading && !error && selectedYear && (
        <>
          <DocumentTable documents={payslips} viewPdf={viewPdf} downloadPdf={downloadPdf} isPayslip={true} />
          {payslips.length === 0 && (
            <div className="message-banner" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
              No payslips found for the selected period.
            </div>
          )}
        </>
      )}
    </>
  );

  const renderDocuments = () => {
    let filteredDocs = selectedDocYear
      ? documents.filter((d) => {
        const year = d.year || d.documentYear || (d.uploadTimestamp && getISTAsDateObject(d.uploadTimestamp).getFullYear());
        return year && Number(year) === Number(selectedDocYear);
      })
      : documents;

    if (searchTerm.trim() !== "") {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredDocs = filteredDocs.filter(d => (d.documentName || "").toLowerCase().includes(lowerCaseSearch));
    }

    return (
      <>
        <div className="document-hub-filter-container">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="document-hub-input"
            />
            <select
              value={selectedDocYear}
              onChange={(e) => setSelectedDocYear(e.target.value)}
              className="document-hub-input"
            >
              <option value="">All Years</option>
              {yearOptions.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </div>
        </div>

        {loading && (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem', color: '#0d9488', fontWeight: 'bold' }}>Loading your documents...</p>
          </div>
        )}

        {error && (
          <div className="message-banner" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid currentColor' }}>
            <FiAlertCircle /> {error}
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="message-banner" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <FiInfo /> No documents are currently available in your hub.
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <>
            <DocumentTable documents={filteredDocs} viewPdf={viewPdf} downloadPdf={downloadPdf} isPayslip={false} />
            {filteredDocs.length === 0 && (
              <div className="message-banner" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                No documents found matching the current filters.
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="employment-docs-container">
      {activeTab === "Payslips" && renderPayslips()}
      {activeTab === "Documents" && renderDocuments()}
    </div>
  );
}