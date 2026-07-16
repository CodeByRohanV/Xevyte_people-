import React, { useState, useEffect } from 'react';
import api from "../api";
import Sidebar from "./Sidebar";
import ToastNotification from "../components/ToastNotification";
import { FiFileText, FiSave, FiCheckCircle, FiAlertCircle, FiInfo, FiChevronLeft, FiSearch } from 'react-icons/fi';
import * as Icons from 'react-icons/fi';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './ITDeclaration.css';

const ITDeclaration = () => {
  const employeeId = sessionStorage.getItem("employeeId");
  // Helper to generate FY list from current back to 99 years
  const generateFinancialYears = () => {
    const years = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed, so 3 is April

    // Determine the current FY start year
    let startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    for (let i = 0; i < 100; i++) {
      const year = startYear - i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  // SmartDatePicker component with proper month/year scrolling
  const SmartDatePicker = ({ value, onChange, placeholder = "DD-MM-YYYY", disabled = false }) => {
    const [open, setOpen] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

    return (
      <DatePicker
        selected={value ? new Date(value) : null}
        disabled={disabled}
        onChange={(date) => {
          onChange(date);
          setTimeout(() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }, 20);
        }}
        onSelect={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
        open={open && !disabled}
        onInputClick={() => !disabled && setOpen(true)}
        onClickOutside={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
        placeholderText={placeholder}
        dateFormat="dd-MM-yyyy"
        calendarClassName="no-gap-calendar"
        dayClassName={() => "no-gap-day"}
        wrapperClassName="full-width-picker"
        renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => (
          <div className="custom-calendar-header">
            <div className="calendar-header-banner">
              <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>&#8249;</button>
              <div className="header-main-content">
                <div className="header-text-group">
                  <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                  <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                </div>
              </div>
              <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>&#8250;</button>
            </div>
            {showMonthDropdown && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{MONTHS.map((m, idx) => (<div key={m} className={"dropdown-item" + (idx === date.getMonth() ? " active" : "")} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>))}</div></div>)}
            {showYearDropdown && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map(y => (<div key={y} className={"dropdown-item" + (y === date.getFullYear() ? " active" : "")} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>))}</div></div>)}
          </div>
        )}
      />
    );
  };

  const currentFY = generateFinancialYears()[0];
  const [financialYear, setFinancialYear] = useState(currentFY);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [cards, setCards] = useState([]);
  const [view, setView] = useState('grid');
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeFields, setActiveFields] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('me');
  const [isFinance, setIsFinance] = useState(false);
  const [financeData, setFinanceData] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [fieldToCardMap, setFieldToCardMap] = useState({});
  const [allFields, setAllFields] = useState([]);
  const [targetEmployee, setTargetEmployee] = useState({ id: employeeId, name: 'My' });
  const [declarationExists, setDeclarationExists] = useState(false);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [showNewRegimeConfirm, setShowNewRegimeConfirm] = useState(false);
  const [showOldRegimeConfirm, setShowOldRegimeConfirm] = useState(false);
  const [submissionSettings, setSubmissionSettings] = useState({ fromDate: '', toDate: '' });
  const [isAccessRestricted, setIsAccessRestricted] = useState(false);
  const [showRegimeTooltip, setShowRegimeTooltip] = useState(false);

  const [formData, setFormData] = useState({
    financialYear: currentFY,
    status: "Draft",
    dynamicValues: [],
    remarks: "",
    taxRegime: ""
  });

  const [entryCounts, setEntryCounts] = useState({}); // { cardId: entryCount }

  useEffect(() => {
    fetchDeclaration();
    fetchCards();
    checkFinanceStatus();
    fetchAllFields();
    fetchSettings();
  }, [financialYear]);

  useEffect(() => {
    if (selectedCard && activeFields.length > 0) {
      const cardFieldIds = new Set(activeFields.map(f => f.fieldId));
      const relevantValues = (formData.dynamicValues || []).filter(v => cardFieldIds.has(v.fieldId));
      const maxIdx = relevantValues.reduce((max, v) => Math.max(max, v.entryIndex || 0), 0);
      setEntryCounts(prev => ({ ...prev, [selectedCard.id]: Math.max(prev[selectedCard.id] || 1, maxIdx + 1) }));
    }
  }, [selectedCard, activeFields, formData.dynamicValues]);

  const addEntry = (cardId) => {
    const card = cards.find(c => c.id === cardId);
    const currentCount = entryCounts[cardId] || 1;
    if (card && card.maxEntries && currentCount >= card.maxEntries) {
      setMessage(`Maximum of ${card.maxEntries} entries allowed for this section.`);
      setMessageType('error');
      setIsToastOpen(true);
      return;
    }
    setEntryCounts(prev => ({ ...prev, [cardId]: currentCount + 1 }));
  };

  const removeEntry = (cardId, entryIndex) => {
    if (entryIndex === 0) return; // Cannot remove first entry
    if (!window.confirm("Are you sure you want to remove this entry?")) return;

    setFormData(prev => {
      const cardFieldIds = new Set(activeFields.map(f => f.fieldId));
      // Remove all values for this entryIndex in this card
      const newValues = (prev.dynamicValues || []).filter(v =>
        !(cardFieldIds.has(v.fieldId) && (v.entryIndex === entryIndex))
      );

      // Shift subsequent indices down
      const shiftedValues = newValues.map(v => {
        if (cardFieldIds.has(v.fieldId) && v.entryIndex > entryIndex) {
          return { ...v, entryIndex: v.entryIndex - 1 };
        }
        return v;
      });

      return { ...prev, dynamicValues: shiftedValues };
    });

    setEntryCounts(prev => ({ ...prev, [cardId]: Math.max(1, (prev[cardId] || 1) - 1) }));
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get(`/it-declaration-configs?financialYear=${financialYear}`);
      if (response.data) {
        setSubmissionSettings(response.data);
        checkAccess(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  const checkAccess = (settings) => {
    if (!settings.fromDate || !settings.toDate) return;

    const now = new Date();
    // Reset time to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from = new Date(settings.fromDate);
    const to = new Date(settings.toDate);

    const restricted = today < from || today > to;
    setIsAccessRestricted(restricted);

    if (restricted) {
      console.log("[RESTRICTION] Access denied. Current date outside window.");
    }
  };

  const fetchAllFields = async () => {
    try {
      const response = await api.get(`/it-declaration-fields/all?financialYear=${financialYear}`);
      setAllFields(response.data);
      const map = {};
      response.data.forEach(field => {
        map[field.fieldId] = field.card?.title || "IT Declaration";
      });
      setFieldToCardMap(map);
    } catch (error) {
      console.error("Failed to fetch all fields", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'finance') {
      fetchFinanceDeclarations();
    }
  }, [activeTab]);

  const checkFinanceStatus = async () => {
    try {
      const response = await api.get(`/it-declarations/is-finance/${employeeId}`);
      setIsFinance(response.data);
    } catch (error) {
      console.error("Failed to check finance status", error);
    }
  };

  const fetchFinanceDeclarations = async () => {
    setFinanceLoading(true);
    try {
      const response = await api.get(`/it-declarations/finance/${employeeId}`);
      setFinanceData(response.data);
    } catch (error) {
      console.error("Failed to fetch finance declarations", error);
    } finally {
      setFinanceLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      const response = await api.get(`/it-declaration-cards/active?financialYear=${financialYear}`);
      setCards(response.data);
    } catch (error) {
      console.error("Failed to fetch cards", error);
    }
  };

  const fetchDeclaration = async (specificId = null, specificFY = null) => {
    const id = specificId || targetEmployee.id;
    const fy = specificFY || financialYear;
    if (!id) return;
    setLoading(true);
    try {
      // If fields aren't loaded yet, fetch them now
      if (!allFields || allFields.length === 0) {
        await fetchAllFields();
      }

      console.log(`[DEBUG] Fetching declaration for ID: ${id}, FY: ${fy}, Tab: ${activeTab}`);
      const endpoint = (activeTab === 'assigned')
        ? `/it-declarations/finance/view/${id}/${fy}`
        : `/it-declarations/${id}/${fy}?requesterId=${employeeId}`;
      const response = await api.get(endpoint);
      console.log(`[DEBUG] Received response for ID ${id}:`, response.data);
      if (response.data) {
        setFormData(response.data);
        setDeclarationExists(true);
      } else {
        console.log(`[DEBUG] No declaration returned or access denied for ID ${id}. Resetting Form.`);
        setDeclarationExists(false);
        resetFormData(fy);
      }
    } catch (error) {
      console.log("No declaration found or API error.");
      setDeclarationExists(false);
      resetFormData(fy);
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = (fy) => {
    setFormData({
      financialYear: fy,
      status: "Draft",
      dynamicValues: [],
      remarks: "",
      taxRegime: ""
    });
  };

  const fetchFieldsForCard = async (card) => {
    setLoading(true);
    try {
      const response = await api.get(`/it-declaration-fields/card/${card.id}`);
      setActiveFields(response.data);
      setSelectedCard(card);
      setView('form');
    } catch (error) {
      console.error("Failed to fetch fields", error);
    } finally {
      setLoading(false);
    }
  };

  const viewEmployeeDeclaration = async (empId, empName) => {
    setTargetEmployee({ id: empId, name: empName });
    setView('details');
    setLoading(true);
    try {
      if (!allFields || allFields.length === 0) await fetchAllFields();
      const response = await api.get(`/it-declarations/${empId}`);
      setEmployeeHistory(response.data || []);
      setDeclarationExists(response.data && response.data.length > 0);
    } catch (error) {
      console.error("Failed to fetch employee history", error);
      setEmployeeHistory([]);
      setDeclarationExists(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicInputChange = (fieldId, value, entryIndex = 0) => {
    setFormData(prev => {
      const newValues = [...(prev.dynamicValues || [])];
      const idx = newValues.findIndex(v => v.fieldId === fieldId && (v.entryIndex || 0) === entryIndex);
      if (idx > -1) {
        newValues[idx] = { ...newValues[idx], fieldValue: value, entryIndex };
      } else {
        newValues.push({ fieldId, fieldValue: value, entryIndex });
      }
      return { ...prev, dynamicValues: newValues };
    });
  };

  const getFieldValue = (fieldId, entryIndex = 0) => {
    const valObj = (formData.dynamicValues || []).find(v => v.fieldId === fieldId && (v.entryIndex || 0) === entryIndex);
    return valObj ? valObj.fieldValue : "";
  };

  const saveDeclaration = async (status = "Draft", silent = false) => {
    if (isAccessRestricted) {
      setMessage("Cannot save or submit declaration. Submission window is closed.");
      setMessageType('error');
      setIsToastOpen(true);
      return;
    }
    setLoading(true);
    setMessage('');
    try {

      // 2. Regime Check
      if (status === "Submitted" && !formData.taxRegime) {
        setMessage("Please select a tax regime before submitting the declaration");
        setMessageType('error');
        setIsToastOpen(true);
        setLoading(false);
        return;
      }

      // Send all dynamic values to prevent data loss (Backend clears values upon each save)
      const sanitizedDynamicValues = (formData.dynamicValues || [])
        .filter(val =>
          val &&
          val.fieldId &&
          typeof val.fieldValue === 'string' &&
          val.fieldValue.length < 10000
        )
        .map(val => ({
          fieldId: val.fieldId,
          fieldValue: val.fieldValue?.toString().trim() || "",
          entryIndex: val.entryIndex || 0
        }));

      const dataToSave = {
        ...formData,
        dynamicValues: sanitizedDynamicValues,
        status: status,
        financialYear: formData.financialYear || financialYear
      };
      console.log("Saving Declaration as:", status, {
        ...dataToSave,
        dynamicValuesCount: sanitizedDynamicValues.length,
        payloadSize: JSON.stringify(dataToSave).length
      });
      await api.post(`/it-declarations/${employeeId}`, dataToSave);
      if (!silent || status === "Submitted") {
        if (status === "Submitted") {
          alert('Declaration submitted successfully!');
        } else {
          setMessage('Draft saved successfully!');
          setMessageType('success');
          setIsToastOpen(true);
        }
      }
      fetchDeclaration();
    } catch (error) {
      const errorMsg = error.response?.data || error.message;
      setMessage(`Operation failed: ${errorMsg}`);
      setMessageType('error');
      setIsToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const DynamicIcon = ({ name }) => {
    const IconComponent = Icons[name] || Icons.FiFileText;
    return <IconComponent />;
  };

  const renderField = (field, entryIndex = 0) => {
    const value = getFieldValue(field.fieldId, entryIndex);
    const isDisabled = isAccessRestricted || (financialYear !== generateFinancialYears()[0]);

    switch (field.dataType) {
      case 'NUMBER':
        return (
          <input
            type="number"
            value={value}
            disabled={isDisabled}
            onChange={(e) => handleDynamicInputChange(field.fieldId, e.target.value, entryIndex)}
            placeholder={field.placeholder || "0.00"}
          />
        );
      case 'DATE':
        return (
          <SmartDatePicker
            value={value}
            disabled={isDisabled}
            onChange={(date) => handleDynamicInputChange(field.fieldId, date ? date.toISOString().split('T')[0] : '', entryIndex)}
            placeholder={field.placeholder || "Select date"}
          />
        );
      case 'DROPDOWN':
        const options = (field.dropdownOptions || "").split(',').map(o => o.trim());
        return (
          <select value={value} disabled={isDisabled} onChange={(e) => handleDynamicInputChange(field.fieldId, e.target.value, entryIndex)}>
            <option value="">{field.placeholder || "Select Option"}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'BOOLEAN':
        return (
          <div className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={value === "true" || value === true}
              disabled={isDisabled}
              onChange={(e) => handleDynamicInputChange(field.fieldId, e.target.checked, entryIndex)}
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontSize: '0.875rem' }}>{field.placeholder || "Confirmed"}</span>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            disabled={isDisabled}
            onChange={(e) => handleDynamicInputChange(field.fieldId, e.target.value, entryIndex)}
            placeholder={field.placeholder || "Enter details..."}
          />
        );
    }
  };

  return (
    <Sidebar>
      <div className="it-decl-container">
        <div className="it-decl-wrapper">
          <div className="it-decl-header">
            <div className="header-left">
              <div className="header-icon"><FiFileText /></div>
              <div>
                <h1>IT Declaration</h1>
                <p>Declare your tax-saving investments for {financialYear}</p>
              </div>
            </div>
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '400px' }}>
                <input
                  type="text"
                  placeholder="Search Sections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem 0.65rem 2.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    width: '100%',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: 'white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                />
              </div>
              <select value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} className="fy-select">
                {generateFinancialYears().map(fy => (
                  <option key={fy} value={fy}>FY {fy}</option>
                ))}
              </select>
            </div>
          </div>

          {isFinance && (
            <div className="it-tabs">
              <button
                className={`it-tab-btn ${activeTab === 'me' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('me');
                  setView('grid');
                  setTargetEmployee({ id: employeeId, name: 'My' });
                  fetchDeclaration(employeeId);
                }}
              >
                My Declaration
              </button>
              <button
                className={`it-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('finance');
                  setView('grid');
                }}
              >
                My Tasks
              </button>
            </div>
          )}

          <ToastNotification
            isOpen={isToastOpen}
            onClose={() => setIsToastOpen(false)}
            message={message}
            type={messageType}
          />

          {isAccessRestricted && (
            <div className="restriction-banner animated-fade-in" style={{
              marginBottom: '2rem',
              padding: '1rem 1.5rem',
              background: '#fff1f2',
              borderRadius: '12px',
              border: '1px solid #fecdd3',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: '#be123c'
            }}>
              <FiAlertCircle style={{ fontSize: '1.5rem' }} />
              <div>
                <strong style={{ display: 'block' }}>Submission Window Restricted</strong>
                <span style={{ fontSize: '0.9rem' }}>
                  The declaration submission window was from <strong>{new Date(submissionSettings.fromDate).toLocaleDateString()}</strong> to <strong>{new Date(submissionSettings.toDate).toLocaleDateString()}</strong>.
                  {new Date() > new Date(submissionSettings.toDate) ? (
                    <span> The deadline has passed. Any unsubmitted declarations have been <strong>auto-submitted under the New Tax Regime</strong>.</span>
                  ) : (
                    " You cannot edit or submit declarations at this time."
                  )}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'me' && view !== 'details' && (
            <div className="regime-selection-card animated-fade-in" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', width: 'fit-content', minWidth: '400px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                  <FiInfo style={{ color: '#14b8a6' }} />
                  Select Tax Regime
                </div>
                <div 
                  style={{ position: 'relative', width: '100%', maxWidth: '450px' }}
                  onMouseEnter={() => setShowRegimeTooltip(true)}
                  onMouseLeave={() => setShowRegimeTooltip(false)}
                >
                  <select
                    className="modern-select"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '0.95rem',
                      color: '#1e293b',
                      fontWeight: '500',
                      cursor: (declarationExists && formData.taxRegime) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    value={formData.taxRegime}
                    disabled={isAccessRestricted || (declarationExists && formData.taxRegime) || showOldRegimeConfirm || showNewRegimeConfirm}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || val === formData.taxRegime) return;

                      if (val === 'NEW_REGIME') {
                        setShowNewRegimeConfirm(true);
                        setShowOldRegimeConfirm(false);
                        setFormData({ ...formData, taxRegime: val });
                      } else if (val === 'OLD_REGIME') {
                        setShowOldRegimeConfirm(true);
                        setShowNewRegimeConfirm(false);
                        setFormData({ ...formData, taxRegime: val });
                      }
                    }}
                  >
                    <option value="">-- Choose tax regime for this FY --</option>
                    <option value="OLD_REGIME">Old Regime</option>
                    <option value="NEW_REGIME">New Regime</option>
                  </select>
                  {showRegimeTooltip && (declarationExists && formData.taxRegime) && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      background: '#14b8a6',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      marginTop: '8px',
                      zIndex: 100,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      pointerEvents: 'none'
                    }}>
                      <div style={{ position: 'absolute', top: '-4px', left: '20px', width: '8px', height: '8px', background: '#14b8a6', transform: 'rotate(45deg)' }}></div>
                      Tax regime is allowed to select only once in a financial year
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'me' && view === 'grid' && formData.taxRegime === 'NEW_REGIME' && showNewRegimeConfirm && (
            <div className="modal-backdrop-alert" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, paddingTop: '20px', backdropFilter: 'blur(3px)' }}>
              <div className="new-regime-confirm-card animated-fade-in-down" style={{ padding: '1.5rem 2rem', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.3)', textAlign: 'center', maxWidth: '450px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                  Are you confirm to proceed with <strong>New Tax Regime</strong>? <br />
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>This choice cannot be changed once confirmed.</span>
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <button
                    className="btn-primary success"
                    style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' }}
                    disabled={loading}
                    onClick={async () => {
                      if (loading) return;
                      setFormData(prev => ({ ...prev, dynamicValues: [] }));
                      const updatedFormData = { ...formData, taxRegime: 'NEW_REGIME', dynamicValues: [] };
                      setLoading(true);
                      try {
                        await api.post(`/it-declarations/${employeeId}`, { ...updatedFormData, status: "Submitted" });
                        alert('New Regime selected and submitted successfully!');
                        setShowNewRegimeConfirm(false);
                        setDeclarationExists(true);
                        fetchDeclaration();
                      } catch (error) {
                        const errorMsg = error.response?.data || error.message;
                        setMessage(`Submission failed: ${errorMsg}`);
                        setMessageType('error');
                        setIsToastOpen(true);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' }}
                    onClick={() => {
                      setFormData({ ...formData, taxRegime: '' });
                      setShowNewRegimeConfirm(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'me' && view === 'grid' && formData.taxRegime === 'OLD_REGIME' && showOldRegimeConfirm && (
            <div className="modal-backdrop-alert" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, paddingTop: '20px', backdropFilter: 'blur(3px)' }}>
              <div className="old-regime-confirm-card animated-fade-in-down" style={{ padding: '1.5rem 2rem', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.3)', textAlign: 'center', maxWidth: '450px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                {/* <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.1rem', fontWeight: '700' }}>Confirm Tax Regime</h3> */}
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                  Are you confirm to proceed with <strong>Old Tax Regime</strong>? <br />
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>This choice cannot be changed once confirmed.</span>
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <button
                    className="btn-primary success"
                    style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' }}
                    disabled={loading}
                    onClick={async () => {
                      if (loading) return;
                      const updatedFormData = { ...formData, taxRegime: 'OLD_REGIME' };
                      setLoading(true);
                      try {
                        await api.post(`/it-declarations/${employeeId}`, { ...updatedFormData, status: "Draft" });
                        alert('Old Regime selected. You can now start filling your declarations.');
                        setShowOldRegimeConfirm(false);
                        setDeclarationExists(true);
                        fetchDeclaration();
                      } catch (error) {
                        const errorMsg = error.response?.data || error.message;
                        setMessage(`Failed to lock regime: ${errorMsg}`);
                        setMessageType('error');
                        setIsToastOpen(true);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' }}
                    onClick={() => {
                      setFormData({ ...formData, taxRegime: '' });
                      setShowOldRegimeConfirm(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'me' && view === 'grid' && formData.taxRegime === 'NEW_REGIME' && !showNewRegimeConfirm && (
            <div className="new-regime-info-card animated-fade-in" style={{ padding: '2.5rem', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #bbf7d0', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
              <div style={{ fontSize: '3rem', color: '#16a34a', marginBottom: '1.5rem' }}>
                <FiCheckCircle />
              </div>
              <h2 style={{ color: '#166534', marginBottom: '1rem' }}>New Tax Regime Selected</h2>
              <p style={{ color: '#15803d', fontSize: '1.1rem', lineHeight: '1.6' }}>
                You have opted for the <strong>New Tax Regime</strong>.<br />
                Under this regime, no further investment declarations are required.
              </p>
            </div>
          )}

          {view === 'details' ? (
            <div className="details-view-container animated-fade-in">
              <div className="details-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn-secondary" onClick={() => setView('grid')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiChevronLeft /> Back to Dashboard
                </button>
              </div>

              <div className="step-content-card">


                {loading ? (
                  <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p>Loading declaration details...</p>
                  </div>
                ) : (employeeHistory && employeeHistory.some(d => d.financialYear === financialYear)) && allFields && allFields.length > 0 ? (
                  <div className="history-wrapper">
                    {Object.entries(
                      employeeHistory.reduce((acc, decl) => {
                        const fy = decl.financialYear;
                        if (!acc[fy]) acc[fy] = { status: decl.status, values: [], regime: decl.taxRegime };
                        if (!acc[fy].regime) acc[fy].regime = decl.taxRegime;

                        (decl.dynamicValues || []).forEach(v => {
                          const existingVal = acc[fy].values.find(ev =>
                            String(ev.fieldId) === String(v.fieldId) &&
                            (ev.entryIndex || 0) === (v.entryIndex || 0)
                          );
                          if (!existingVal) {
                            acc[fy].values.push(v);
                          }
                        });
                        return acc;
                      }, {})
                    )
                      .sort(([fyA], [fyB]) => fyB.localeCompare(fyA)) // Show latest FY first
                      .filter(([fy]) => fy === financialYear) // Only show the currently selected FY
                      .map(([fy, data]) => (
                        <div key={fy} className="fy-section" style={{ marginBottom: '4rem', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
                          <div className="fy-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                              <h3 style={{ fontSize: '1.5rem', color: '#0d9488', margin: 0 }}>Financial Year {fy}</h3>
                              {data.regime && (
                                <span style={{ padding: '0.4rem 0.8rem', background: '#f0fdfa', color: '#0d9488', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #14b8a6' }}>
                                  {data.regime.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <span className={`status-badge ${data.status.toLowerCase()}`}>{data.status}</span>
                          </div>

                          {data.regime === 'NEW_REGIME' ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f0fdfa', borderRadius: '16px', border: '1px solid #14b8a6', marginTop: '1rem' }}>
                              <p style={{ fontSize: '1.2rem', color: '#0d9488', fontWeight: 500, lineHeight: '1.6' }}>
                                This declaration was submitted under the <strong>New Tax Regime</strong>.<br />
                              </p>
                            </div>
                          ) : (
                            Object.entries(
                              allFields.reduce((acc, field) => {
                                const cardTitle = field.card?.title || "IT Declaration";
                                if (!acc[cardTitle]) acc[cardTitle] = [];
                                acc[cardTitle].push(field);
                                return acc;
                              }, {})
                            ).map(([category, fields]) => {
                              const cardFieldIds = new Set(fields.map(f => String(f.fieldId)));
                              const categoryValues = data.values.filter(v => cardFieldIds.has(String(v.fieldId)));
                              const maxIdx = categoryValues.reduce((max, v) => Math.max(max, v.entryIndex || 0), 0);

                              // Check if any value exists in this category across all entries
                              if (categoryValues.length === 0) return null;

                              return (
                                <div key={category} className="details-category-section" style={{ marginBottom: '2.5rem' }}>
                                  <h4 style={{ fontSize: '1.1rem', color: '#14b8a6', marginBottom: '1.25rem', paddingLeft: '0.75rem', borderLeft: '4px solid #14b8a6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{category}</span>
                                    {fields[0]?.card?.sectionMaxLimit > 0 && (
                                      <span style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: '#f0fdfa', borderRadius: '6px', color: '#0d9488', fontWeight: 600 }}>
                                        Section Limit: ₹{Number(fields[0].card.sectionMaxLimit).toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </h4>

                                  {Array.from({ length: maxIdx + 1 }).map((_, entryIdx) => {
                                    // Only render this entry if it has at least one non-empty value
                                    const hasData = fields.some(field => {
                                      const v = data.values.find(val =>
                                        (String(val.fieldId) === String(field.fieldId)) &&
                                        (val.entryIndex || 0) === entryIdx
                                      );
                                      return v && v.fieldValue && v.fieldValue.trim() !== "";
                                    });

                                    if (!hasData && entryIdx > 0) return null;

                                    return (
                                      <div key={entryIdx} className="entry-detail-block" style={{
                                        marginBottom: maxIdx > 0 ? '1.5rem' : '0',
                                        padding: maxIdx > 0 ? '1rem' : '0',
                                        background: maxIdx > 0 ? '#f8fafc' : 'transparent',
                                        borderRadius: '12px',
                                        border: maxIdx > 0 ? '1px solid #e2e8f0' : 'none'
                                      }}>
                                        {maxIdx > 0 && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d9488', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Entry #{entryIdx + 1}</div>}
                                        <div className="decl-details-grid">
                                          {fields.map(field => {
                                            const valObj = data.values.find(v =>
                                              (String(v.fieldId) === String(field.fieldId) || String(v.fieldId) === String(field.id)) &&
                                              (v.entryIndex || 0) === entryIdx
                                            );

                                            return (
                                              <div key={`${field.fieldId || field.id}-${entryIdx}`} className="decl-detail-item">
                                                <div className="decl-detail-label">{field.fieldLabel}</div>
                                                <div className="decl-detail-value">{valObj ? valObj.fieldValue : '—'}</div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '20px' }}>
                    <FiAlertCircle style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1.5rem' }} />
                    <p style={{ color: '#64748b' }}>
                      {targetEmployee.name === 'My'
                        ? `You haven't added any tax-saving details for FY ${financialYear}.`
                        : `${targetEmployee.name} hasn't submitted their IT declaration for FY ${financialYear} yet.`}
                    </p>
                    {targetEmployee.name === 'My' && (
                      <button className="btn-primary" onClick={() => setView('grid')} style={{ margin: '1.5rem auto 0' }}>
                        Start Declaration
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : view === 'form' ? (
            <div className="step-content-card animated-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <button className="btn-secondary" onClick={() => setView('grid')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiChevronLeft /> Back to sections
                </button>
              </div>

              <div className="step-content">
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2>{selectedCard.title}</h2>
                    {(() => {
                      // Calculate total for this section
                      const sectionFieldIds = new Set(activeFields.map(f => f.fieldId));
                      const sectionTotal = (formData.dynamicValues || [])
                        .filter(v => sectionFieldIds.has(v.fieldId))
                        .reduce((sum, v) => sum + (parseFloat(v.fieldValue) || 0), 0);
                      
                      return (
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {/* Total Declared */}
                          <div style={{ 
                            padding: '0.5rem 1rem', 
                            background: '#f0f9ff', 
                            borderRadius: '8px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                          }}>
                            <span style={{ color: '#0369a1', fontWeight: 600 }}>Total Declared:</span>
                            <span style={{ color: '#0369a1', fontWeight: 700 }}>₹{sectionTotal.toLocaleString('en-IN')}</span>
                          </div>
                          
                          {/* Section Limit */}
                          {selectedCard.sectionMaxLimit > 0 && (
                            <div style={{ 
                              padding: '0.5rem 1rem', 
                              background: '#f0fdfa', 
                              borderRadius: '8px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              fontSize: '0.9rem'
                            }}>
                              <FiInfo style={{ color: '#0d9488' }} />
                              <span style={{ color: '#0d9488', fontWeight: 600 }}>Section Limit:</span>
                              <span style={{ color: '#0d9488', fontWeight: 700 }}>₹{Number(selectedCard.sectionMaxLimit).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {selectedCard.multipleAllowed && (entryCounts[selectedCard.id] || 1) < (selectedCard.maxEntries || 1) && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #14b8a6', color: '#14b8a6' }}
                      onClick={() => addEntry(selectedCard.id)}
                    >
                      <Icons.FiPlus /> Add {entryCounts[selectedCard.id] > 0 ? 'Another' : 'Entry'}
                    </button>
                  )}
                </div>

                {activeFields.length > 0 ? (
                  <div className="entries-wrapper">
                    {Array.from({ length: entryCounts[selectedCard.id] || 1 }).map((_, idx) => (
                      <div key={idx} className="entry-section" style={{
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        position: 'relative'
                      }}>
                        {selectedCard.multipleAllowed && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                            <h4 style={{ margin: 0, color: '#0d9488' }}>Entry #{idx + 1}</h4>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => removeEntry(selectedCard.id, idx)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                <Icons.FiTrash2 /> Remove
                              </button>
                            )}
                          </div>
                        )}
                        <div className="form-grid">
                          {activeFields.map(field => (
                            <div key={`${field.id}-${idx}`} className="form-group">
                              <label>
                                {field.fieldLabel} {idx === 0 && field.required && <span style={{ color: '#ef4444' }}>*</span>}
                              </label>
                              {renderField(field, idx)}
                              {field.maxLimit != null && Number(field.maxLimit) > 0 && (
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <span>Max limit in ₹ :</span>
                                  <span style={{ color: '#1e293b', fontWeight: 700 }}>
                                    {Number(field.maxLimit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                    <FiInfo style={{ fontSize: '2rem', color: '#14b8a6', marginBottom: '1rem' }} />
                    <p>No fields configured for this category yet.</p>
                  </div>
                )}
              </div>

              <div className="step-actions" style={{ marginTop: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                <div className="right-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-outline" onClick={() => saveDeclaration("Draft")} disabled={loading || isAccessRestricted}>
                    Save as Draft <FiSave />
                  </button>

                  {/* Previous Section Button */}
                  {selectedCard && cards.findIndex(c => c.id === selectedCard.id) > 0 && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={async () => {
                        await saveDeclaration("Draft", true);
                        const currentIndex = cards.findIndex(c => c.id === selectedCard.id);
                        fetchFieldsForCard(cards[currentIndex - 1]);
                      }}
                      disabled={loading || isAccessRestricted}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #0d9488', color: '#0d9488' }}
                    >
                      <Icons.FiChevronLeft /> Previous Section
                    </button>
                  )}

                  {/* Next Section Button */}
                  {selectedCard && cards.findIndex(c => c.id === selectedCard.id) < cards.length - 1 && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={async () => {
                        await saveDeclaration("Draft", true);
                        const currentIndex = cards.findIndex(c => c.id === selectedCard.id);
                        if (currentIndex < cards.length - 1) {
                          fetchFieldsForCard(cards[currentIndex + 1]);
                        }
                      }}
                      disabled={loading || isAccessRestricted}
                    >
                      Save & Next Section
                      <Icons.FiChevronRight />
                    </button>
                  )}

                  {selectedCard && cards.findIndex(c => c.id === selectedCard.id) === cards.length - 1 && (
                    <button type="button" className="btn-primary success" onClick={() => saveDeclaration("Submitted")} disabled={loading || isAccessRestricted}>
                      Submit All <FiCheckCircle />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'finance' ? (
            <div className="finance-table-card animated-fade-in">
              <div className="section-title">
                <h2>Assigned Employees' Declarations</h2>
              </div>
              <div className="table-responsive">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Financial Yr</th>
                      <th>   Status</th>
                      <th>Submitted On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeData.length > 0 ? (
                      Object.values(
                        financeData
                          .filter(decl => decl.financialYear === financialYear)
                          .reduce((acc, decl) => {
                            const key = `${decl.employee?.employeeId}-${decl.financialYear}`;
                            const displayStatus = (decl.status === 'Draft' || decl.status === 'Not Started') ? 'Pending' : decl.status;

                            if (!acc[key]) {
                              acc[key] = {
                                id: decl.id,
                                empId: decl.employee?.employeeId,
                                empName: `${decl.employee?.firstName} ${decl.employee?.lastName}`,
                                submitted: decl.submissionDate,
                                fy: decl.financialYear,
                                status: displayStatus
                              };
                            } else {
                              if (decl.submissionDate && (!acc[key].submitted || new Date(decl.submissionDate) > new Date(acc[key].submitted))) {
                                acc[key].submitted = decl.submissionDate;
                              }
                              // If any record in a group is Submitted or higher, use that status
                              if (displayStatus !== 'Pending' || acc[key].status === 'Pending') {
                                acc[key].status = displayStatus;
                              }
                            }
                            return acc;
                          }, {})
                      ).map(row => (
                        <tr key={`${row.empId}-${row.fy}`}>
                          <td>{row.empId}</td>
                          <td>{row.empName}</td>
                          <td>{row.fy || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${row.status?.toLowerCase().replace(' ', '-') || 'unknown'}`}>{row.status}</span>
                          </td>
                          <td>{row.submitted ? new Date(row.submitted).toLocaleDateString() : '—'}</td>
                          <td>
                            <button className="btn-secondary" onClick={() => viewEmployeeDeclaration(row.empId, row.empName)}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No assignments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (activeTab === 'me' && view === 'grid' && formData.taxRegime === 'OLD_REGIME') ? (
            <div className="declaration-grid animated-fade-in" style={{ marginTop: '1rem' }}>
              {cards.filter(c => (c.title || "").toLowerCase().includes((searchTerm || "").toLowerCase())).map(card => {
                const isGeneric = card.title === "IT Declaration (Generic)";
                const displayTitle = isGeneric ? "View Declaration" : card.title;

                return (
                  <div key={card.id} className="declaration-card">
                    <div className="card-icon-wrapper"><DynamicIcon name={card.iconName} /></div>
                    <div className="card-title-row">
                      <h3>{displayTitle}</h3>
                      <FiInfo className="info-trigger" title={card.description} />
                    </div>
                    {card.sectionMaxLimit > 0 && (
                      <div style={{ 
                        margin: '0.75rem 0', 
                        padding: '0.5rem 0.75rem', 
                        background: '#f0fdfa', 
                        borderRadius: '8px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ color: '#0d9488', fontWeight: 600 }}>Section Limit:</span>
                        <span style={{ color: '#0d9488', fontWeight: 700 }}>₹{Number(card.sectionMaxLimit).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <button
                      className="add-decl-btn"
                      onClick={() => {
                        if (isGeneric) {
                          setTargetEmployee({ id: employeeId, name: 'My' });
                          setView('details');
                          viewEmployeeDeclaration(employeeId, 'My');
                        } else {
                          fetchFieldsForCard(card);
                        }
                      }}
                      style={{
                        background: isAccessRestricted ? '#64748b' : undefined,
                        borderColor: isAccessRestricted ? '#64748b' : undefined
                      }}
                    >
                      {isGeneric
                        ? "View Now"
                        : (isAccessRestricted ? "View Declaration" : "Configure & Declare")}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </Sidebar>
  );
};

export default ITDeclaration;
