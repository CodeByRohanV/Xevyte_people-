import React, { useState, useEffect, useRef } from 'react';
import { getPropperDate } from '../utils/DateUtils';
import api from "../api";
import Sidebar from "./Sidebar";
import { FiDollarSign, FiDownload, FiPlusCircle, FiFileText, FiCheckCircle } from 'react-icons/fi';
import './Payslips.css';

const PayslipManagement = () => {
  const employeeId = sessionStorage.getItem("employeeId") || "EMP111";
  const [payslip, setPayslip] = useState(null);
  const [y, m] = getPropperDate().split('-').map(Number);
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1];

  const [selectedMonth, setSelectedMonth] = useState(monthName);
  const [selectedYear, setSelectedYear] = useState(y);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('view');

  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const scrollRef = useRef(null);

  const scrollTabs = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 150 : scrollLeft + 150;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const [payslipForm, setPayslipForm] = useState({
    employeeId: employeeId,
    designation: 'EMPLOYEE',
    basicAllowance: 0,
    houseRentAllowance: 0,
    conveyanceAllowance: 0,
    foodAllowance: 0,
    medicalAllowance: 0,
    incomeTax: 0,
    pfDeduction: 0,
    esiDeduction: 0,
    medicalInsurance: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2023, 2024, 2025, 2026];

  useEffect(() => {
    fetchPayslip();
  }, [selectedMonth, selectedYear]);

  const fetchPayslip = async () => {
    try {
      const response = await api.get(
        `/payslips/employee/${employeeId}/month/${selectedMonth}/year/${selectedYear}`
      );
      setPayslip(response.data);
    } catch (error) {
      setPayslip(null);
      console.error('Error fetching payslip:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPayslipForm(prev => ({
      ...prev,
      [name]: name === 'designation' ? value : (parseFloat(value) || 0)
    }));
  };

  const createPayslip = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        ...payslipForm,
        employeeId: employeeId,
        salaryMonth: selectedMonth,
        salaryYear: selectedYear
      };

      await api.post('/payslips', data);
      alert('Payslip generated successfully!');
      fetchPayslip();
    } catch (error) {
      console.error('Error creating payslip:', error);
      alert(`Failed to generate payslip: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const url = `/payslips/excel/employee/${employeeId}/month/${selectedMonth}/year/${selectedYear}`;
      const filename = `Payslip_${employeeId}_${selectedMonth}_${selectedYear}.xlsx`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      alert('Excel statement downloaded successfully!');
    } catch (error) {
      console.error('Excel download error:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar>
      <div className="payslips-main-container">
        <div className="payslips-content-wrapper">
          {/* ✅ HEADER */}
          <div className="payslips-page-header">
            <div className="payslips-header-icon">
              <FiDollarSign />
            </div>
            <h1 className="payslips-header-title">
              {isMobileView ? "Payslips" : "Salary Center"}
            </h1>
          </div>

          {message && (
            <div className={`message-banner message-success`}>
              <FiCheckCircle /> {message}
            </div>
          )}

          {/* ✅ CONTROLS & TABS */}
          <div className="month-year-controls">
            <div className="payslip-form-group" style={{ marginBottom: 0, flex: 1 }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="payslip-input-field"
                style={{ width: '100%' }}
              >
                {months.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="payslip-form-group" style={{ marginBottom: 0, flex: 1 }}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="payslip-input-field"
                style={{ width: '100%' }}
              >
                {years.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1.25rem' }}>
            {isMobileView && (
              <button
                onClick={() => scrollTabs('left')}
                style={{
                  position: 'absolute',
                  left: '0',
                  zIndex: 10,
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #2dd4bf',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#14b8a6',
                  padding: 0
                }}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                </svg>
              </button>
            )}

            <div className="payslips-tabs-container" ref={scrollRef} style={{
              paddingLeft: isMobileView ? '35px' : '0.35rem',
              paddingRight: isMobileView ? '35px' : '0.35rem',
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              alignItems: 'center',
              marginBottom: 0
            }}>
              <button
                className={`payslip-tab-button ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                <FiFileText /> View Payslip
              </button>
              <button
                className={`payslip-tab-button ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <FiPlusCircle /> Generate New
              </button>
            </div>

            {isMobileView && (
              <button
                onClick={() => scrollTabs('right')}
                style={{
                  position: 'absolute',
                  right: '0',
                  zIndex: 10,
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #2dd4bf',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#14b8a6',
                  padding: 0
                }}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>
            )}
          </div>

          {/* ✅ CONTENT SECTIONS */}
          <div className="payslip-card">
            {activeTab === 'view' && (
              <div className="view-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#115e59', fontSize: '1.2rem' }}>Statement for {selectedMonth} {selectedYear}</h3>
                  {payslip && (
                    <button className="payslip-btn payslip-btn-primary" onClick={downloadExcel} disabled={loading}>
                      <FiDownload /> Download Excel
                    </button>
                  )}
                </div>

                {payslip ? (
                  <div className="payslip-table-wrapper">
                    <table className="payslip-main-table">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Category</th>
                          <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>Basic Allowance</td><td>Earnings</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{payslip.basicAllowance?.toLocaleString()}</td></tr>
                        <tr><td>HRA</td><td>Earnings</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{payslip.houseRentAllowance?.toLocaleString()}</td></tr>
                        <tr><td>Conveyance</td><td>Earnings</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{payslip.conveyanceAllowance?.toLocaleString()}</td></tr>
                        <tr><td>Medical Allowance</td><td>Earnings</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{payslip.medicalAllowance?.toLocaleString()}</td></tr>
                        <tr style={{ background: '#f0fdfa' }}>
                          <td style={{ fontWeight: '700', color: '#0d9488' }}>Total Earnings</td>
                          <td></td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: '#0d9488' }}>{payslip.totalEarnings?.toLocaleString()}</td>
                        </tr>
                        <tr><td>Income Tax</td><td>Deductions</td><td style={{ textAlign: 'right', color: '#e11d48' }}>- {payslip.incomeTax?.toLocaleString()}</td></tr>
                        <tr><td>PF Deduction</td><td>Deductions</td><td style={{ textAlign: 'right', color: '#e11d48' }}>- {payslip.pfDeduction?.toLocaleString()}</td></tr>
                        <tr><td>Professional Tax</td><td>Deductions</td><td style={{ textAlign: 'right', color: '#e11d48' }}>- {payslip.esiDeduction?.toLocaleString()}</td></tr>
                        <tr style={{ background: '#fff1f2' }}>
                          <td style={{ fontWeight: '700', color: '#be123c' }}>Total Deductions</td>
                          <td></td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: '#be123c' }}>{payslip.totalDeductions?.toLocaleString()}</td>
                        </tr>
                        <tr style={{ background: '#115e59', color: 'white' }}>
                          <td style={{ fontWeight: '800', fontSize: '1.1rem' }}>Net Take Home</td>
                          <td></td>
                          <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.1rem' }}>₹ {payslip.netPay?.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    
                    <p>No salary record found for {selectedMonth} {selectedYear}.</p>
                    <p style={{ fontSize: '0.875rem' }}>If you believe this is an error, please contact HR.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="create-section">
                <h3 style={{ marginBottom: '2rem', color: '#115e59' }}>Generate Statement for {employeeId}</h3>
                <form onSubmit={createPayslip}>
                  <div className="payslip-form-grid">
                    <div className="payslip-form-group">
                      <label className="payslip-form-label">Employee ID</label>
                      <input type="text" value={employeeId} disabled className="payslip-input-field" />
                    </div>
                    <div className="payslip-form-group">
                      <label className="payslip-form-label">Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={payslipForm.designation}
                        onChange={handleInputChange}
                        className="payslip-input-field"
                      />
                    </div>
                    {Object.keys(payslipForm).map(field => (
                      field !== "employeeId" && field !== "designation" && (
                        <div className="payslip-form-group" key={field}>
                          <label className="payslip-form-label">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (₹)</label>
                          <input
                            type="number"
                            name={field}
                            value={payslipForm[field]}
                            onChange={handleInputChange}
                            className="payslip-input-field"
                            placeholder="0.00"
                          />
                        </div>
                      )
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="submit" className="payslip-btn payslip-btn-primary" disabled={loading}>
                      {loading ? "Processing..." : "Generate Statement"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default PayslipManagement;
