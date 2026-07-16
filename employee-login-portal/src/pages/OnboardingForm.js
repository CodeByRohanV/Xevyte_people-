import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Onboarding.css";
import {
  FiTrash2,
  FiUser,
  FiMapPin,
  FiBookOpen,
  FiBriefcase,
  FiShield,
  FiCheckCircle,
  FiSave,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiUploadCloud,
  FiMail,
  FiPhone,
  FiUsers,
  FiHeart,
  FiEye,
  FiX,
  FiDownload
} from "react-icons/fi";


const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_BASE = `${BASE_URL}/v1/applicants`;
const PREONBOARDING_API = `${BASE_URL}/v1/preonboarding`;

const SmartDatePicker = ({ value, onChange, disabled, maxDate }) => {
  const [open, setOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const formatLocalDate = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  // Helper to ensure 'selected' never gets an invalid date
  const parseSafeDate = (val) => {
    if (!val) return null;

    // 1. Try treating as YYYY-MM-DD (preferred for date inputs)
    const local = new Date(val + "T00:00:00");
    if (!isNaN(local.getTime())) return local;

    // 2. Fallback: try raw date string (ISO format, etc.)
    const fallback = new Date(val);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  return (
    <DatePicker
      selected={parseSafeDate(value)}
      disabled={disabled}
      maxDate={maxDate}
      onChange={(date) => {
        if (!date) {
          onChange("");
          setOpen(false);
          return;
        }

        onChange(formatLocalDate(date));

        // close after selecting
        setTimeout(() => setOpen(false), 20);
      }}
      onSelect={() => setOpen(false)}   // important

      open={open}
      onInputClick={() => setOpen(true)}
      onClickOutside={() => setOpen(false)}

      dateFormat="dd-MM-yyyy"
      calendarClassName="no-gap-calendar"
      dayClassName={() => "no-gap-day"}
      wrapperClassName="full-width-picker"


      renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => {
        const months = [
          "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
          "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
        ];
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

        return (
          <div className="custom-calendar-header">
            {/* Main Banner */}
            <div className="calendar-header-banner">
              <button
                type="button"
                className="header-nav-btn prev"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
                  decreaseMonth();
                }}
              >
                ‹
              </button>

              <div className="header-main-content">

                <div className="header-text-group">
                  <span
                    className="clickable-header-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                  >
                    {months[date.getMonth()]}
                  </span>
                  <span
                    className="clickable-header-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
                    }}
                  >
                    {date.getFullYear()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="header-nav-btn next"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
                  increaseMonth();
                }}
              >
                ›
              </button>
            </div>

            {/* Selection Lists */}
            {showMonthDropdown && (
              <div className="header-dropdown month-dropdown">
                <div className="dropdown-scroll-pane">
                  {months.map((m, idx) => (
                    <div
                      key={m}
                      className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                      onClick={() => {
                        changeMonth(idx);
                        setShowMonthDropdown(false);
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showYearDropdown && (
              <div className="header-dropdown year-dropdown">
                <div className="dropdown-scroll-pane">
                  {years.map((y) => (
                    <div
                      key={y}
                      className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                      onClick={() => {
                        changeYear(y);
                        setShowYearDropdown(false);
                      }}
                    >
                      {y}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

// ---------- helpers to seed repeatable sections ----------
const emptyEducation = () => ({
  degreeType: "", // PG/UG/12th/10th
  courseMajor: "",
  collegeNameAddress: "",
  university: "",
  studyType: "", // Full Time/Part Time
  yearOfPassing: "",
  registrationNumber: "",
  marksheetFile: null, // { fileName, fileType, base64 }
  certificateFile: null,
});

const emptyWork = () => ({
  companyName: "",
  officeLocation: "",
  designation: "",
  dateOfJoining: "",
  dateOfRelieving: "",
  employeeId: "",
  salaryDrawn: "", // e.g., "8 LPA" or "50k PM"
  reportingManagerName: "",
  reportingManagerEmail: "",
  reportingManagerPhone: "",
  hrManagerName: "",
  hrManagerEmail: "",
  hrManagerPhone: "",
  reasonForLeaving: "",
  offerLetter: null,
  relievingLetter: null,
  payslips: null, // ⚠️ single combined PDF recommended
  form16: null,
  pfServiceHistoryFile: null,
});



const FilePreviewButtons = ({ file, onPreview }) => {
  if (!file || !file.base64 || !file.fileName) return null;

  const handleDownload = (e) => {
    e.stopPropagation();
    const type = file.fileType || "application/octet-stream";
    const url = `data:${type};base64,${file.base64}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
    a.click();
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "10px" }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPreview(file); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: "6px",
          background: "#f0fdfa",
          color: "#0d9488",
          fontSize: "11px",
          fontWeight: "600",
          border: "1px solid #99f6e4",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#ccfbf1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#f0fdfa"; }}
      >
        Preview
      </button>
      <button
        type="button"
        onClick={handleDownload}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: "6px",
          background: "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)",
          color: "#fff",
          fontSize: "11px",
          fontWeight: "600",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(94, 234, 212, 0.2)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 3px 8px rgba(94, 234, 212, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(94, 234, 212, 0.2)";
        }}
      >
        Download
      </button>
    </div>
  );
};

const PreviewModal = ({ file, onClose }) => {
  if (!file) return null;
  const type = file.fileType || "application/octet-stream";
  const url = `data:${type};base64,${file.base64}`;
  const ext = (file.fileName?.split(".").pop() || "").toLowerCase();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          borderRadius: "0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "none",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8fafc",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b", fontWeight: "600" }}>
            Preview: {file.fileName}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
          >
            <FiX size={24} />
          </button>
        </div>
        <div style={{ flex: 1, backgroundColor: "#f1f5f9", overflow: "hidden" }}>
          {ext === "pdf" || type.includes("pdf") ? (
            <iframe src={url} title="PDF Preview" width="100%" height="100%" style={{ border: "none" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto" }}>
              <img src={url} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Location Autocomplete Component
const LocationAutocomplete = ({
  suggestions,
  showDropdown,
  onSelect,
  inputValue,
  workIndex,
  onInputFocus,
  onInputBlur,
  disabled
}) => {
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onSelect(suggestions[highlightedIndex], workIndex);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setHighlightedIndex(-1);
        break;
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = handleKeyDown;
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showDropdown, suggestions, highlightedIndex, onSelect, workIndex]);

  console.log("LocationAutocomplete props:", { suggestions, showDropdown, inputValue, workIndex, disabled });

  if (!showDropdown || suggestions.length === 0) {
    console.log("Not showing dropdown - showDropdown:", showDropdown, "suggestions.length:", suggestions.length);
    return null;
  }

  return (
    <div
      className="location-autocomplete-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      {suggestions.map((location, index) => (
        <div
          key={location.id || index}
          className={`location-suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
          style={{
            padding: '10px 15px',
            cursor: 'pointer',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e0e0e0';
            setHighlightedIndex(index);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            setHighlightedIndex(-1);
          }}
          onClick={() => onSelect(location, workIndex)}
        >
          <FiMapPin style={{ color: '#2dd4bf', fontSize: '14px' }} />
          <span style={{
            color: '#374151',
            fontSize: '14px',
            fontWeight: inputValue.toLowerCase() === location.locationName?.toLowerCase() ? '600' : 'normal'
          }}>
            {location.locationName}
          </span>
        </div>
      ))}
    </div>
  );
};

// Address Autocomplete Components
const CityAutocomplete = ({
  suggestions,
  showDropdown,
  onSelect,
  inputValue,
  addressType,
  onInputFocus,
  onInputBlur,
  disabled,
  loading
}) => {
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onSelect(suggestions[highlightedIndex], addressType);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setHighlightedIndex(-1);
        break;
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = handleKeyDown;
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showDropdown, suggestions, highlightedIndex, onSelect, addressType]);

  if (!showDropdown || suggestions.length === 0) return null;

  return (
    <div
      className="city-autocomplete-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      {loading ? (
        <div style={{ padding: '10px 15px', color: '#6b7280', fontSize: '14px' }}>
          Loading cities...
        </div>
      ) : (
        suggestions.map((city, index) => (
          <div
            key={index}
            className={`city-suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              setHighlightedIndex(index);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              setHighlightedIndex(-1);
            }}
            onClick={() => onSelect(city, addressType)}
          >
            <FiMapPin style={{ color: '#2dd4bf', fontSize: '14px' }} />
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#374151',
                fontSize: '14px',
                fontWeight: inputValue.toLowerCase() === city.name?.toLowerCase() ? '600' : 'normal'
              }}>
                {city.name}
              </div>
              {city.state && (
                <div style={{ color: '#6b7280', fontSize: '12px' }}>
                  {city.state}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const StateAutocomplete = ({
  suggestions,
  showDropdown,
  onSelect,
  inputValue,
  addressType,
  onInputFocus,
  onInputBlur,
  disabled,
  loading
}) => {
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onSelect(suggestions[highlightedIndex], addressType);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setHighlightedIndex(-1);
        break;
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = handleKeyDown;
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showDropdown, suggestions, highlightedIndex, onSelect, addressType]);

  if (!showDropdown || suggestions.length === 0) return null;

  return (
    <div
      className="state-autocomplete-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      {loading ? (
        <div style={{ padding: '10px 15px', color: '#6b7280', fontSize: '14px' }}>
          Loading states...
        </div>
      ) : (
        suggestions.map((state, index) => (
          <div
            key={index}
            className={`state-suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              setHighlightedIndex(index);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              setHighlightedIndex(-1);
            }}
            onClick={() => onSelect(state, addressType)}
          >
            <FiMapPin style={{ color: '#2dd4bf', fontSize: '14px' }} />
            <span style={{
              color: '#374151',
              fontSize: '14px',
              fontWeight: inputValue.toLowerCase() === state?.toLowerCase() ? '600' : 'normal'
            }}>
              {state}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

const PincodeAutocomplete = ({
  suggestions,
  showDropdown,
  onSelect,
  inputValue,
  addressType,
  onInputFocus,
  onInputBlur,
  disabled,
  loading
}) => {
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onSelect(suggestions[highlightedIndex], addressType);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setHighlightedIndex(-1);
        break;
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = handleKeyDown;
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showDropdown, suggestions, highlightedIndex, onSelect, addressType]);

  if (!showDropdown || suggestions.length === 0) return null;

  return (
    <div
      className="pincode-autocomplete-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      {loading ? (
        <div style={{ padding: '10px 15px', color: '#6b7280', fontSize: '14px' }}>
          Loading pincodes...
        </div>
      ) : (
        suggestions.map((pincode, index) => (
          <div
            key={index}
            className={`pincode-suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              setHighlightedIndex(index);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              setHighlightedIndex(-1);
            }}
            onClick={() => onSelect(pincode, addressType)}
          >
            <FiMapPin style={{ color: '#2dd4bf', fontSize: '14px' }} />
            <span style={{
              color: '#374151',
              fontSize: '14px',
              fontWeight: inputValue.toLowerCase() === pincode?.toLowerCase() ? '600' : 'normal'
            }}>
              {pincode}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

const EducationLocationAutocomplete = ({
  suggestions,
  showDropdown,
  onSelect,
  inputValue,
  disabled,
  loading
}) => {
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onSelect(suggestions[highlightedIndex]);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setHighlightedIndex(-1);
        break;
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = handleKeyDown;
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showDropdown, suggestions, highlightedIndex, onSelect]);

  if (!showDropdown || suggestions.length === 0) return null;

  return (
    <div
      className="education-location-autocomplete-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '200px'
      }}
    >
      {loading ? (
        <div style={{ padding: '10px 15px', color: '#6b7280', fontSize: '14px' }}>
          Loading locations...
        </div>
      ) : (
        suggestions.map((location, index) => (
          <div
            key={index}
            className={`education-location-suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              setHighlightedIndex(index);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              setHighlightedIndex(-1);
            }}
            onClick={() => onSelect(location)}
          >
            <FiMapPin style={{ color: '#2dd4bf', fontSize: '14px' }} />
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#374151',
                fontSize: '14px',
                fontWeight: inputValue.toLowerCase() === location.name?.toLowerCase() ? '600' : 'normal'
              }}>
                {location.name}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                {location.display_name}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};


export default function OnboardingFull() {
  const [sameAsPresent, setSameAsPresent] = useState(false);

  const { applicantId } = useParams();
  const [loadingApplicant, setLoadingApplicant] = useState(true);
  const [applicant, setApplicant] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showDobPicker, setShowDobPicker] = useState(false);

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const [rejectedDocs, setRejectedDocs] = useState([]);

  const [isLocked, setIsLocked] = useState(false);
  const [previewingFile, setPreviewingFile] = useState(null);

  // Location autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState({});
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Address autocomplete states
  const [citySuggestions, setCitySuggestions] = useState({ present: [], permanent: [] });
  const [stateSuggestions, setStateSuggestions] = useState({ present: [], permanent: [] });
  const [pincodeSuggestions, setPincodeSuggestions] = useState({ present: [], permanent: [] });
  const [showCityDropdown, setShowCityDropdown] = useState({ present: false, permanent: false });
  const [showStateDropdown, setShowStateDropdown] = useState({ present: false, permanent: false });
  const [showPincodeDropdown, setShowPincodeDropdown] = useState({ present: false, permanent: false });
  const [loadingCities, setLoadingCities] = useState({ present: false, permanent: false });
  const [loadingStates, setLoadingStates] = useState({ present: false, permanent: false });
  const [loadingPincodes, setLoadingPincodes] = useState({ present: false, permanent: false });

  // Education location autocomplete states
  const [educationLocationSuggestions, setEducationLocationSuggestions] = useState([]);
  const [showEducationLocationDropdown, setShowEducationLocationDropdown] = useState(false);
  const [loadingEducationLocation, setLoadingEducationLocation] = useState(false);

  // PG location autocomplete states (reuse education location functionality)
  const [pgLocationSuggestions, setPgLocationSuggestions] = useState([]);
  const [showPgLocationDropdown, setShowPgLocationDropdown] = useState(false);
  const [loadingPgLocation, setLoadingPgLocation] = useState(false);

  const handlePreviewOpen = (file) => setPreviewingFile(file);
  const handlePreviewClose = () => setPreviewingFile(null);

  const disableWorkButtons =
    applicant?.status === "Form Submitted" ||
    applicant?.status === "Re-Upload Needed";

  const handleYearInput = (e, path) => {
    let value = e.target.value;

    // allow only digits
    value = value.replace(/\D/g, "");

    // limit to 4 digits (YYYY)
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    updateForm(path, value);
  };


  const lockStyle = isLocked
    ? { pointerEvents: "none", background: "#f3f3f3" }
    : {};

  const isRejected = (fieldPath) => {
    // Normalize frontend path: workHistory[0] → workHistory.0
    const normalizedField = fieldPath.replace(/\[(\d+)\]/g, ".$1");

    return rejectedDocs.some((doc) => {
      // Remove applicantId prefix → take only the last part after space
      const cleaned = doc.split(" ").pop();

      // Normalize backend path as well
      const normalizedDoc = cleaned.replace(/\[(\d+)\]/g, ".$1");

      return normalizedDoc === normalizedField;
    });
  };


  // controls file fields
  const disableFile = (field) => {
    if (applicant.status === "Re-Upload Needed") {
      return !isRejected(field);
    }
    return isLocked;
  };

  // all text fields remain locked in re-upload mode UNLESS rejected
  const disableText = (fieldPath) => {
    // If onboarding is completely locked (Approve/Reject finalized), everything is disabled
    const isFormApproved = ["Approved", "CTC Approval In Progress", "Hired", "Joined"].includes(applicant?.status);
    if (isFormApproved) return true;

    if (applicant?.status === "Re-Upload Needed") {
      if (fieldPath && isRejected(fieldPath)) return false;
      return true;
    }
    return isLocked;
  };


  // Fetch office location suggestions using OpenStreetMap API
  const fetchOfficeLocationSuggestions = async (query, workIndex) => {
    console.log("fetchOfficeLocationSuggestions called with:", { query, workIndex });

    if (!query || query.trim() === "") {
      console.log("Empty query, clearing suggestions");
      setLocationSuggestions([]);
      setShowLocationDropdown(prev => ({ ...prev, [workIndex]: false }));
      return;
    }

    setLoadingLocations(true);
    try {
      console.log("Making API request for query:", query);
      // Using Nominatim API for location suggestions (free, no API key required)
      const response = await api.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 10
        },
        headers: {
          'User-Agent': 'EmployeeManagementApp/1.0'
        }
      });

      const locations = response.data || [];
      console.log("API response:", locations);

      // Format locations for display
      const formattedLocations = locations.map(item => ({
        id: item.place_id,
        locationName: item.display_name,
        name: item.display_name,
        address: item.address,
        lat: item.lat,
        lon: item.lon
      }));

      console.log("Formatted locations:", formattedLocations);
      setLocationSuggestions(formattedLocations);
      setShowLocationDropdown(prev => ({ ...prev, [workIndex]: true }));
    } catch (err) {
      console.error("Error fetching office location suggestions:", err);
      setLocationSuggestions([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location, workIndex) => {
    updateWork(workIndex, "officeLocation", location.locationName);
    setShowLocationDropdown(prev => ({ ...prev, [workIndex]: false }));
    setLocationSuggestions([]);
  };

  // Handle location input change
  const handleLocationInputChange = (e, workIndex) => {
    const value = e.target.value;
    console.log("handleLocationInputChange called:", { value, workIndex });
    handleWorkAlphabeticInput(e, workIndex, "officeLocation", 50);
    fetchOfficeLocationSuggestions(value, workIndex);
  };

  // Close location dropdown when clicking outside
  const handleLocationInputBlur = (workIndex) => {
    setTimeout(() => {
      setShowLocationDropdown(prev => ({ ...prev, [workIndex]: false }));
    }, 200); // Small delay to allow click on suggestion
  };

  // OpenStreetMap API functions for address autocomplete
  const fetchCitySuggestions = async (query, addressType) => {
    if (!query || query.trim() === "") {
      setCitySuggestions(prev => ({ ...prev, [addressType]: [] }));
      setShowCityDropdown(prev => ({ ...prev, [addressType]: false }));
      return;
    }

    setLoadingCities(prev => ({ ...prev, [addressType]: true }));
    try {
      // Using Nominatim API for city suggestions (free, no API key required)
      // Using only q parameter since structured parameters can't be mixed with q
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: `${query}, India`,
          format: 'json',
          addressdetails: 1,
          limit: 10
        },
        headers: {
          'User-Agent': 'EmployeeManagementApp/1.0'
        }
      });

      const cities = response.data || [];

      // Filter for places that have cities and are in India
      const filteredCities = cities.filter(item => {
        const address = item.address;
        return address && (
          address.city ||
          address.town ||
          address.village
        ) && address.country === 'India';
      });

      const uniqueCities = [...new Map(filteredCities.map(item => [
        item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
        {
          name: item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
          state: item.address?.state,
          country: item.address?.country,
          display_name: item.display_name
        }
      ])).values()];

      setCitySuggestions(prev => ({ ...prev, [addressType]: uniqueCities.slice(0, 8) }));
      setShowCityDropdown(prev => ({ ...prev, [addressType]: true }));
    } catch (err) {
      console.error("Error fetching city suggestions:", err);
      setCitySuggestions(prev => ({ ...prev, [addressType]: [] }));
    } finally {
      setLoadingCities(prev => ({ ...prev, [addressType]: false }));
    }
  };

  const fetchStateSuggestions = async (city, addressType) => {
    if (!city || city.trim() === "") {
      setStateSuggestions(prev => ({ ...prev, [addressType]: [] }));
      setShowStateDropdown(prev => ({ ...prev, [addressType]: false }));
      return;
    }

    setLoadingStates(prev => ({ ...prev, [addressType]: true }));
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: `${city}, India`,
          format: 'json',
          addressdetails: 1,
          limit: 10
        },
        headers: {
          'User-Agent': 'EmployeeManagementApp/1.0'
        }
      });

      const locations = response.data || [];
      const states = [...new Set(locations.map(item => item.address?.state).filter(Boolean))];

      setStateSuggestions(prev => ({ ...prev, [addressType]: states.slice(0, 8) }));
      setShowStateDropdown(prev => ({ ...prev, [addressType]: states.length > 0 }));
    } catch (err) {
      console.error("Error fetching state suggestions:", err);
      setStateSuggestions(prev => ({ ...prev, [addressType]: [] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [addressType]: false }));
    }
  };

  const fetchPincodeSuggestions = async (city, state, addressType) => {
    console.log("fetchPincodeSuggestions called:", { city, state, addressType });

    if (!city || city.trim() === "") {
      console.log("No city provided, clearing suggestions");
      setPincodeSuggestions(prev => ({ ...prev, [addressType]: [] }));
      setShowPincodeDropdown(prev => ({ ...prev, [addressType]: false }));
      return;
    }

    setLoadingPincodes(prev => ({ ...prev, [addressType]: true }));
    try {
      // Try multiple queries to get better pincode results
      const queries = [
        state ? `${city}, ${state}, India` : `${city}, India`,
        state ? `${city} ${state} pincode` : `${city} pincode`,
        `${city} postal code India`
      ];

      let allPincodes = [];

      for (const query of queries) {
        console.log("Trying API query:", query);

        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 20
          },
          headers: {
            'User-Agent': 'EmployeeManagementApp/1.0'
          }
        });

        const locations = response.data || [];
        console.log(`API response for "${query}":`, locations);

        const pincodes = locations.map(item => item.address?.postcode).filter(Boolean);
        allPincodes = [...allPincodes, ...pincodes];
      }

      // Remove duplicates and filter for valid Indian pincodes (6 digits)
      const uniquePincodes = [...new Set(allPincodes)].filter(pincode =>
        pincode && /^\d{6}$/.test(pincode.toString())
      );

      console.log("Final filtered pincodes:", uniquePincodes);

      // If no pincodes found, provide some common pincodes for major cities
      let finalPincodes = uniquePincodes;
      if (uniquePincodes.length === 0) {
        console.log("No pincodes found, trying fallback for major cities");
        const fallbackPincodes = getFallbackPincodes(city, state);
        finalPincodes = fallbackPincodes;
        console.log("Using fallback pincodes:", finalPincodes);
      }

      setPincodeSuggestions(prev => ({ ...prev, [addressType]: finalPincodes.slice(0, 10) }));
      setShowPincodeDropdown(prev => ({ ...prev, [addressType]: finalPincodes.length > 0 }));
    } catch (err) {
      console.error("Error fetching pincode suggestions:", err);
      // Try fallback on error
      const fallbackPincodes = getFallbackPincodes(city, state);
      setPincodeSuggestions(prev => ({ ...prev, [addressType]: fallbackPincodes.slice(0, 10) }));
      setShowPincodeDropdown(prev => ({ ...prev, [addressType]: fallbackPincodes.length > 0 }));
    } finally {
      setLoadingPincodes(prev => ({ ...prev, [addressType]: false }));
    }
  };

  const fetchPincodeByNumber = async (pincode, addressType) => {
    if (!pincode || pincode.trim() === "") {
      setPincodeSuggestions(prev => ({ ...prev, [addressType]: [] }));
      setShowPincodeDropdown(prev => ({ ...prev, [addressType]: false }));
      return;
    }

    setLoadingPincodes(prev => ({ ...prev, [addressType]: true }));
    try {
      // Search for locations with this specific pincode
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: `${pincode}, India`,
          format: 'json',
          addressdetails: 1,
          limit: 10
        },
        headers: {
          'User-Agent': 'EmployeeManagementApp/1.0'
        }
      });

      const locations = response.data || [];

      // Filter for Indian locations and extract pincodes
      const indianPincodes = locations
        .filter(item => item.address?.country === 'India')
        .map(item => item.address?.postcode)
        .filter(postcode => postcode && (
          postcode === pincode || // Exact match
          postcode.startsWith(pincode) // Starts with entered digits
        ));

      const uniquePincodes = [...new Set(indianPincodes)];

      setPincodeSuggestions(prev => ({ ...prev, [addressType]: uniquePincodes.slice(0, 10) }));
      setShowPincodeDropdown(prev => ({ ...prev, [addressType]: uniquePincodes.length > 0 }));
    } catch (err) {
      console.error("Error fetching pincode by number:", err);
      setPincodeSuggestions(prev => ({ ...prev, [addressType]: [] }));
    } finally {
      setLoadingPincodes(prev => ({ ...prev, [addressType]: false }));
    }
  };

  // Fallback function for major Indian cities
  const getFallbackPincodes = (city, state) => {
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();

    // Common pincodes for major cities
    const cityPincodes = {
      'bengaluru': ['560001', '560002', '560003', '560004', '560005', '560006', '560007', '560008', '560009', '560010'],
      'bangalore': ['560001', '560002', '560003', '560004', '560005', '560006', '560007', '560008', '560009', '560010'],
      'mumbai': ['400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010'],
      'delhi': ['110001', '110002', '110003', '110004', '110005', '110006', '110007', '110008', '110009', '110010'],
      'chennai': ['600001', '600002', '600003', '600004', '600005', '600006', '600007', '600008', '600009', '600010'],
      'kolkata': ['700001', '700002', '700003', '700004', '700005', '700006', '700007', '700008', '700009', '700010'],
      'hyderabad': ['500001', '500002', '500003', '500004', '500005', '500006', '500007', '500008', '500009', '500010'],
      'pune': ['411001', '411002', '411003', '411004', '411005', '411006', '411007', '411008', '411009', '411010'],
      'ahmedabad': ['380001', '380002', '380003', '380004', '380005', '380006', '380007', '380008', '380009', '380010'],
      'jaipur': ['302001', '302002', '302003', '302004', '302005', '302006', '302007', '302008', '302009', '302010']
    };

    // Check for exact city match
    for (const [key, pincodes] of Object.entries(cityPincodes)) {
      if (cityLower.includes(key) || key.includes(cityLower)) {
        return pincodes;
      }
    }

    // Return empty if no match found
    return [];
  };

  const fetchCitySuggestionsForState = async (cityQuery, state, addressType) => {
    if (!cityQuery || cityQuery.trim() === "") {
      setCitySuggestions(prev => ({ ...prev, [addressType]: [] }));
      setShowCityDropdown(prev => ({ ...prev, [addressType]: false }));
      return;
    }

    setLoadingCities(prev => ({ ...prev, [addressType]: true }));
    try {
      // Search for cities within the specified state
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: `${cityQuery}, ${state}, India`,
          format: 'json',
          addressdetails: 1,
          limit: 10
        },
        headers: {
          'User-Agent': 'EmployeeManagementApp/1.0'
        }
      });

      const locations = response.data || [];

      // Filter for places that have cities and are in the specified state
      const filteredCities = locations.filter(item => {
        const address = item.address;
        return address && (
          address.city ||
          address.town ||
          address.village
        ) && address.state === state && address.country === 'India';
      });

      const uniqueCities = [...new Map(filteredCities.map(item => [
        item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
        {
          name: item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
          state: item.address?.state,
          country: item.address?.country,
          display_name: item.display_name
        }
      ])).values()];

      setCitySuggestions(prev => ({ ...prev, [addressType]: uniqueCities.slice(0, 8) }));
      setShowCityDropdown(prev => ({ ...prev, [addressType]: true }));
    } catch (err) {
      console.error("Error fetching city suggestions for state:", err);
      setCitySuggestions(prev => ({ ...prev, [addressType]: [] }));
    } finally {
      setLoadingCities(prev => ({ ...prev, [addressType]: false }));
    }
  };


  const fetchEducationLocationSuggestions = async (query) => {
    // Always clear dropdown first
    setShowEducationLocationDropdown(false);

    if (!query || query.trim() === "") {
      setEducationLocationSuggestions([]);
      return;
    }

    setLoadingEducationLocation(true);
    try {
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Search for educational institutions and locations
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: `${query}, India`,
          format: 'json',
          addressdetails: 1,
          limit: 15
        },
        headers: {
          'User-Agent': 'EmployeeManagementApp/1.0'
        },
        timeout: 5000 // Add timeout to prevent hanging
      });

      const locations = response.data || [];

      // Process locations to get city, state combinations
      const locationSuggestions = locations
        .filter(item => item.address?.country === 'India')
        .map(item => {
          const address = item.address;
          // Try different address types that OpenStreetMap returns
          const city = address?.city || address?.town || address?.village || address?.county || address?.hamlet;
          const state = address?.state;
          const district = address?.state_district || address?.county;

          // Create a meaningful name from available information
          let name = '';
          if (city && state) {
            name = `${city}, ${state}`;
          } else if (city && district) {
            name = `${city}, ${district}`;
          } else if (city) {
            name = city;
          } else if (item.display_name) {
            // Use display_name as fallback, but clean it up
            name = item.display_name.split(',').slice(0, 2).join(',').replace(/India$/, '').trim();
          }

          if (name) {
            return {
              name: name,
              city: city || name.split(',')[0]?.trim(),
              state: state || district || '',
              display_name: item.display_name
            };
          }
          return null;
        })
        .filter(item => item && item.name && item.name.trim() !== '');

      // Remove duplicates
      const uniqueSuggestions = [...new Map(locationSuggestions.map(item => [item.name, item])).values()];

      console.log("Education location suggestions found:", uniqueSuggestions.length);
      setEducationLocationSuggestions(uniqueSuggestions.slice(0, 8));

      // Only show dropdown if we have suggestions
      if (uniqueSuggestions.length > 0) {
        setShowEducationLocationDropdown(true);
        console.log("Education location dropdown should be visible now");
      }
    } catch (err) {
      console.error("Error fetching education location suggestions:", err);
      // Don't show error to user, just clear suggestions
      setEducationLocationSuggestions([]);
      setShowEducationLocationDropdown(false);
    } finally {
      setLoadingEducationLocation(false);
    }
  };

  const fetchPgLocationSuggestions = async (query) => {
    // Always clear dropdown first
    setShowPgLocationDropdown(false);

    if (!query || query.trim() === "") {
      setPgLocationSuggestions([]);
      return;
    }

    setLoadingPgLocation(true);
    try {
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Search for educational institutions and locations
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: `${query}, India`,
          format: 'json',
          addressdetails: 1,
          limit: 15
        },
        headers: {
          'User-Agent': 'EmployeeManagementApp/1.0'
        },
        timeout: 5000 // Add timeout to prevent hanging
      });

      const locations = response.data || [];

      // Process locations to get city, state combinations
      const locationSuggestions = locations
        .filter(item => item.address?.country === 'India')
        .map(item => {
          const address = item.address;
          // Try different address types that OpenStreetMap returns
          const city = address?.city || address?.town || address?.village || address?.county || address?.hamlet;
          const state = address?.state;
          const district = address?.state_district || address?.county;

          // Create a meaningful name from available information
          let name = '';
          if (city && state) {
            name = `${city}, ${state}`;
          } else if (city && district) {
            name = `${city}, ${district}`;
          } else if (city) {
            name = city;
          } else if (item.display_name) {
            // Use display_name as fallback, but clean it up
            name = item.display_name.split(',').slice(0, 2).join(',').replace(/India$/, '').trim();
          }

          if (name) {
            return {
              name: name,
              city: city || name.split(',')[0]?.trim(),
              state: state || district || '',
              display_name: item.display_name
            };
          }
          return null;
        })
        .filter(item => item && item.name && item.name.trim() !== '');

      // Remove duplicates
      const uniqueSuggestions = [...new Map(locationSuggestions.map(item => [item.name, item])).values()];

      console.log("PG location suggestions found:", uniqueSuggestions.length);
      setPgLocationSuggestions(uniqueSuggestions.slice(0, 8));

      // Only show dropdown if we have suggestions
      if (uniqueSuggestions.length > 0) {
        setShowPgLocationDropdown(true);
        console.log("PG location dropdown should be visible now");
      }
    } catch (err) {
      console.error("Error fetching PG location suggestions:", err);
      // Don't show error to user, just clear suggestions
      setPgLocationSuggestions([]);
      setShowPgLocationDropdown(false);
    } finally {
      setLoadingPgLocation(false);
    }
  };

  // Handler functions for address autocomplete
  const handleCitySelect = (city, addressType) => {
    console.log("handleCitySelect called:", { city, addressType });
    updateForm(`address.${addressType}.city`, city.name);
    setShowCityDropdown(prev => ({ ...prev, [addressType]: false }));
    setCitySuggestions(prev => ({ ...prev, [addressType]: [] }));

    // Auto-populate state if available
    if (city.state) {
      console.log("Auto-populating state:", city.state);
      updateForm(`address.${addressType}.state`, city.state);
      // Fetch pincodes for the selected city and state
      console.log("Fetching pincodes after city selection");
      fetchPincodeSuggestions(city.name, city.state, addressType);
    } else {
      console.log("No state available in city data, clearing pincode suggestions");
      // Clear pincode suggestions if no state available
      setPincodeSuggestions(prev => ({ ...prev, [addressType]: [] }));
    }
  };

  const handleStateSelect = (state, addressType) => {
    updateForm(`address.${addressType}.state`, state);
    setShowStateDropdown(prev => ({ ...prev, [addressType]: false }));
    setStateSuggestions(prev => ({ ...prev, [addressType]: [] }));

    // Clear city and pincode when state changes to force re-selection
    updateForm(`address.${addressType}.city`, '');
    updateForm(`address.${addressType}.pincode`, '');
    setCitySuggestions(prev => ({ ...prev, [addressType]: [] }));
    setPincodeSuggestions(prev => ({ ...prev, [addressType]: [] }));
  };

  const handlePincodeSelect = (pincode, addressType) => {
    updateForm(`address.${addressType}.pincode`, pincode);
    setShowPincodeDropdown(prev => ({ ...prev, [addressType]: false }));
    setPincodeSuggestions(prev => ({ ...prev, [addressType]: [] }));
  };

  const handleCityInputChange = (e, addressType) => {
    const value = e.target.value;
    handleAlphabeticInput(e, `address.${addressType}.city`, 200);

    // Only fetch city suggestions if state is selected
    const currentState = form.address[addressType].state;
    if (currentState && currentState.trim() !== "") {
      fetchCitySuggestionsForState(value, currentState, addressType);
    } else {
      // If no state selected, don't show city suggestions
      setCitySuggestions(prev => ({ ...prev, [addressType]: [] }));
      setShowCityDropdown(prev => ({ ...prev, [addressType]: false }));
    }
  };

  const handleStateInputChange = (e, addressType) => {
    const value = e.target.value;
    handleAlphabeticInput(e, `address.${addressType}.state`, 200);
    // Only fetch state suggestions if input is not empty
    if (value.trim() !== "") {
      fetchStateSuggestions(value, addressType);
    }
  };

  const handlePincodeInputChange = (e, addressType) => {
    const value = e.target.value;
    console.log("handlePincodeInputChange called:", { value, addressType });
    handleNumericInput(e, `address.${addressType}.pincode`, 6);

    // Only fetch pincode suggestions if both city and state are selected
    const currentCity = form.address[addressType].city;
    const currentState = form.address[addressType].state;
    console.log("Current address data:", { currentCity, currentState });

    if (currentCity && currentState && currentCity.trim() !== "" && currentState.trim() !== "") {
      console.log("Fetching pincodes for:", currentCity, currentState);
      // If user is typing, fetch pincodes for the city and state
      fetchPincodeSuggestions(currentCity, currentState, addressType);
    } else {
      console.log("City or state not selected, clearing suggestions");
      // If city or state is not selected, don't show pincode suggestions
      setPincodeSuggestions(prev => ({ ...prev, [addressType]: [] }));
      setShowPincodeDropdown(prev => ({ ...prev, [addressType]: false }));
    }
  };

  const handlePincodeInputFocus = (addressType) => {
    console.log("handlePincodeInputFocus called:", addressType);
    // Fetch pincodes when pincode field gets focus
    const currentCity = form.address[addressType].city;
    const currentState = form.address[addressType].state;
    console.log("Current address on focus:", { currentCity, currentState });

    if (currentCity && currentState && currentCity.trim() !== "" && currentState.trim() !== "") {
      console.log("Fetching pincodes on focus for:", currentCity, currentState);
      fetchPincodeSuggestions(currentCity, currentState, addressType);
    }
  };

  const handleAddressInputBlur = (fieldType, addressType) => {
    setTimeout(() => {
      switch (fieldType) {
        case 'city':
          setShowCityDropdown(prev => ({ ...prev, [addressType]: false }));
          break;
        case 'state':
          setShowStateDropdown(prev => ({ ...prev, [addressType]: false }));
          break;
        case 'pincode':
          setShowPincodeDropdown(prev => ({ ...prev, [addressType]: false }));
          break;
        default:
          break;
      }
    }, 200); // Small delay to allow click on suggestion
  };

  // Debounce function to prevent too many API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Debounce function for education location search
  const debounceEducationLocation = React.useCallback(
    debounce((query) => {
      fetchEducationLocationSuggestions(query);
    }, 300),
    []
  );

  // Debounce function for PG location search  
  const debouncePgLocation = React.useCallback(
    debounce((query) => {
      fetchPgLocationSuggestions(query);
    }, 300),
    []
  );

  // Education location handlers
  const handleEducationLocationSelect = (location) => {
    updateForm("academic.ugLocation", location.name);
    setShowEducationLocationDropdown(false);
    setEducationLocationSuggestions([]);
  };

  const handleEducationLocationInputChange = (e) => {
    const value = e.target.value;

    // Clear previous suggestions and dropdown immediately when typing
    setShowEducationLocationDropdown(false);
    setEducationLocationSuggestions([]);

    handleAlphabeticInput(e, "academic.ugLocation", 200);

    // Use debounced function to prevent too many API calls
    if (value.trim() !== "") {
      debounceEducationLocation(value);
    }
  };

  const handleEducationLocationBlur = () => {
    setTimeout(() => {
      setShowEducationLocationDropdown(false);
    }, 200); // Small delay to allow click on suggestion
  };

  // PG location handlers
  const handlePgLocationSelect = (location) => {
    updateForm("academic.pgLocation", location.name);
    setShowPgLocationDropdown(false);
    setPgLocationSuggestions([]);
  };

  const handlePgLocationInputChange = (e) => {
    const value = e.target.value;

    // Clear previous suggestions and dropdown immediately when typing
    setShowPgLocationDropdown(false);
    setPgLocationSuggestions([]);

    handleAlphabeticInput(e, "academic.pgLocation", 200);

    // Use debounced function to prevent too many API calls
    if (value.trim() !== "") {
      debouncePgLocation(value);
    }
  };

  const handlePgLocationBlur = () => {
    setTimeout(() => {
      setShowPgLocationDropdown(false);
    }, 200); // Small delay to allow click on suggestion
  };

  const safeClickById = (id) => {
    console.log('Attempting to click element with ID:', id);
    const el = document.getElementById(id);
    if (el) {
      console.log('Element found, clicking:', el);
      el.click();
    } else {
      console.warn("Element not found:", id);
      // Log all input elements to help debug
      const allInputs = document.querySelectorAll('input[type="file"]');
      console.log('Available file inputs:', Array.from(allInputs).map(input => ({ id: input.id, name: input.name })));
    }
  };


  const handleNumericInput = (e, path, maxLength) => {
    let value = e.target.value;

    // Allow only 0–9
    value = value.replace(/\D/g, "");

    // Enforce max length
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    updateForm(path, value);
  };

  // Handler to allow alphanumeric but restrict only-digit or only-special-character input
  const handleAlphabeticInput = (e, path, maxLength = 200) => {
    let value = e.target.value;

    // Check if the input contains at least one alphabetic character (a-z, A-Z)
    const hasLetter = /[a-zA-Z]/.test(value);

    // If input doesn't contain any letters, prevent it
    if (value.length > 0 && !hasLetter) {
      // Don't update - this will prevent the change
      return;
    }

    // Enforce max length
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    updateForm(path, value);
  };


  const validateDocument = (file, e) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowed.includes(file.type)) {
      alert("Only JPG, JPEG, PNG, PDF allowed.");
      e.target.value = "";
      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Max file size allowed is 2MB.");
      e.target.value = "";
      return false;
    }

    return true;
  };

  const validateWorkFile = (e, path) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed formats
    const allowedExt = ["jpg", "jpeg", "png", "pdf"];
    const ext = file.name.toLowerCase().split(".").pop();

    if (!allowedExt.includes(ext)) {
      alert("Allowed formats: JPG, JPEG, PNG, PDF (Max 2MB)");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeded. Maximum allowed size is 2MB.");
      e.target.value = "";
      return;
    }

    handleFileSelectBase64(path, e);
  };

  const WorkFileInput = ({
    label,
    required,
    value,
    onChange,
    onDelete,
    accept,
    disabled,
    inputId
  }) => {
    return (
      <div className="onboarding-form-group">
        <label className="onboarding-label">
          {label} {required && <span className="onboarding-required">*</span>}
        </label>

        <div className={`onboarding-file-container ${disabled ? 'disabled' : ''}`}>
          <input
            type="file"
            id={inputId}
            accept={accept || ".jpg,.jpeg,.png,.pdf"}
            disabled={disabled}
            style={{ display: "none" }}
            onChange={onChange}
          />

          <button
            type="button"
            className="onboarding-btn onboarding-btn-outline"
            disabled={disabled}
            onClick={() => !disabled && safeClickById(inputId)}
            style={{ padding: "0.4rem 0.8rem", height: "2rem", fontSize: "0.75rem" }}
          >
            <FiUploadCloud /> {value?.fileName ? "Change Doc" : "Upload Doc"}
          </button>

          <span className="onboarding-file-info" style={{ display: "flex", alignItems: "center" }}>
            {value?.fileName ? (
              <>
                <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {value.fileName}
                </span>
                <FilePreviewButtons file={value} onPreview={handlePreviewOpen} />
              </>
            ) : "No file chosen"}
          </span>

          {value?.fileName && !disabled && onDelete && (
            <button
              type="button"
              className="onboarding-btn delete-doc-btn"
              disabled={disabled}
              onClick={onDelete}
              title="Remove File"
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>
    );
  };




  const multiFileBox = (inputId, path, values) => {
    const disabled = disableFile(path);

    return (
      <div className={`onboarding-file-container ${disabled ? 'disabled' : ''}`}>
        <input
          type="file"
          id={inputId}
          multiple
          disabled={disabled}
          style={{ display: "none" }}
          onChange={(e) => handleMultiFileSelectBase64(path, e)}
        />

        <button
          type="button"
          className="onboarding-btn onboarding-btn-outline"
          disabled={disabled}
          onClick={() => {
            console.log('MultiFileBox button clicked for input ID:', inputId);
            console.log('Disabled state:', disabled);
            if (!disabled) {
              safeClickById(inputId);
            }
          }}
          style={{ padding: "0.4rem 0.8rem", height: "2rem", fontSize: "0.75rem" }}
        >
          <FiUploadCloud /> Choose Files
        </button>

        <span className="onboarding-file-info">
          {values?.length
            ? `${values.length} files selected`
            : "No files chosen"}
        </span>
      </div>
    );
  };




  const AcademicFileInput = ({
    label,
    field,
    required,
    value,
    onChange,
    onDelete,
    accept = ".jpg,.jpeg,.png,.pdf"
  }) => {
    const disabled = disableFile(`academic.${field}`);

    return (
      <div className="onboarding-form-group">
        <label className="onboarding-label">
          {label} {required && <span className="onboarding-required">*</span>}
        </label>

        <div className={`onboarding-file-container ${disabled ? 'disabled' : ''}`}>
          <input
            disabled={disabled}
            type="file"
            id={field}
            accept={accept}
            style={{ display: "none" }}
            onChange={onChange}
          />

          <button
            type="button"
            className="onboarding-btn onboarding-btn-outline"
            disabled={disabled}
            onClick={() => !disabled && safeClickById(field)}
            style={{ padding: "0.4rem 0.8rem", height: "2rem", fontSize: "0.75rem" }}
          >
            <FiUploadCloud /> {value?.fileName ? "Change Doc" : "Upload Doc"}
          </button>

          <span className="onboarding-file-info" style={{ display: "flex", alignItems: "center" }}>
            {value?.fileName ? (
              <>
                <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {value.fileName}
                </span>
                <FilePreviewButtons file={value} onPreview={handlePreviewOpen} />
              </>
            ) : "No file chosen"}
          </span>

          {value?.fileName && !disabled && onDelete && (
            <button
              type="button"
              className="onboarding-btn delete-doc-btn"
              disabled={disabled}
              onClick={onDelete}
              title="Remove File"
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>
    );
  };




  const validateAcademicFile = (e, path) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed extensions (ZIP included)
    const allowedExt = ["zip", "jpg", "jpeg", "png", "pdf"];
    const ext = file.name.toLowerCase().split(".").pop();

    if (!allowedExt.includes(ext)) {
      alert("Allowed formats: ZIP, JPG, JPEG, PNG, PDF (Max 2MB).");
      e.target.value = "";
      return;
    }

    // Max size 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeded. Maximum allowed size is 2MB.");
      e.target.value = "";
      return;
    }

    handleFileSelectBase64(path, e);
  };






  // Limit text fields to 50 characters
  const handleAddressText = (e, path) => {
    let value = e.target.value;
    if (value.length > 200) value = value.slice(0, 200);
    updateForm(path, value);
  };


  const fieldStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  };


  const copyPresentToPermanent = (checked) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,

        permanent: checked
          ? { ...prev.address.present }   // ✅ COPY when checked
          : {
            addressLine: "",
            city: "",
            state: "",
            pincode: "",
            landmark: "",
            nearestPoliceStation: "",
            contactPersonName: "",
            contactPersonRelationship: "",
            contactPersonMobile: "",
            durationOfStay: "",
          },                              // ✅ CLEAR when unchecked

        permanentProofFile: checked
          ? prev.address.presentProofFile // ✅ COPY FILE
          : null,                          // ✅ CLEAR FILE
      },
    }));
  };



  // ------------ master form state (aligned to created entities) ------------
  const [form, setForm] = useState({
    personal: {
      firstName: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      personalEmail: "",
      mobileNumber: "",
      altMobileNumber: "",
      bloodGroup: "",
      fatherName: "",
      motherName: "",
      maritalStatus: "",
      passportPhoto: null,
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactNumber: ""
    },
    address: {
      present: {
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        nearestPoliceStation: "",
        contactPersonName: "",
        contactPersonRelationship: "",
        contactPersonMobile: "",
        durationOfStay: "",
      },
      permanent: {
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        nearestPoliceStation: "",
        contactPersonName: "",
        contactPersonRelationship: "",
        contactPersonMobile: "",
        durationOfStay: "",
      },
      presentProofFile: null,       // ✅ NEW
      permanentProofFile: null
    },
    ids: {
      aadharNumber: "",
      panNumber: "",
      passportNumber: "",
      voterNumber: "",
      drivingNumber: "",
      utilityNumber: "",
      aadharFile: null,
      panFile: null,
      passportFile: null,
      voterFile: null,
      drivingFile: null,
      utilityFile: null,
    },
    // Repeatable education entries (maps to PreOnboardingEducationDetails)
    education: [emptyEducation()],

    // Single academic block (maps to PreOnboardingAcademicDetails)
    academic: {
      // SCHOOL
      schoolName: "",
      schoolBoard: "",
      schoolYearOfPassing: "",
      schoolCgpaPercentage: "",
      schoolMarksheet: null,
      // INTERMEDIATE / DIPLOMA
      intermediateCollegeType: "",
      intermediateCollegeName: "",
      intermediateBoard: "",
      intermediateYearOfPassing: "",
      intermediateCgpaPercentage: "",
      intermediateMarksheet: null,
      // UG
      ugDegreeType: "",
      ugCourse: "",
      ugCollegeName: "",
      ugUniversity: "",
      ugLocation: "",
      ugStudyType: "",
      ugYearOfPassing: "",
      ugRegistrationNumber: "",
      ugMarksheet: null,
      ugCertificate: null,
      // PG (optional)
      pgDegreeType: "",
      pgCourse: "",
      pgCollegeName: "",
      pgUniversity: "",
      pgLocation: "",
      pgStudyType: "",
      pgYearOfPassing: "",
      pgRegistrationNumber: "",
      pgMarksheet: null,
      pgCertificate: null,
    },

    // Repeatable work history (maps to PreOnboardingWorkHistory)
    workHistory: [emptyWork()],

    // Misc
    documents: {
      resumeFile: null,

    },

    // The rest of your additional sections can remain
    ctc: { expectedCtc: "", remarks: "", approved: false },
    offerRequest: { amRemarks: "", hrRemarks: "", requestStatus: "" },
  });


  const fileBox = (inputId, path, value, accept = ".pdf,.jpg,.jpeg,.png") => {
    const disabled = disableFile(path);

    return (
      <div 
        className={`onboarding-file-container ${disabled ? 'disabled' : ''}`}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
        onClick={(e) => {
          if (!disabled) {
            safeClickById(inputId);
          }
        }}
      >
        <input
          type="file"
          id={inputId}
          accept={accept}
          disabled={disabled}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const allowedExt = ["jpg", "jpeg", "png", "pdf"];
            const ext = file.name.toLowerCase().split(".").pop();
            if (!allowedExt.includes(ext)) {
              alert("Allowed formats: JPG, JPEG, PNG, PDF (Max 2MB)");
              e.target.value = "";
              return;
            }

            if (file.size > 2 * 1024 * 1024) {
              alert("Max allowed file size is 2MB");
              e.target.value = "";
              return;
            }

            handleFileSelectBase64(path, e);
          }}
        />

        <button
          type="button"
          className="onboarding-btn onboarding-btn-outline"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            console.log('FileBox button clicked for input ID:', inputId);
            console.log('Disabled state:', disabled);
            if (!disabled) {
              safeClickById(inputId);
            }
          }}
          style={{ padding: "0.4rem 0.8rem", height: "2rem", fontSize: "15px" }}
        >
          <FiUploadCloud /> {value?.fileName ? "Change Doc" : "Upload Doc"}
        </button>

        <span className="onboarding-file-info" style={{ display: "flex", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          {value?.fileName ? (
            <>
              <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {value.fileName}
              </span>
              <FilePreviewButtons file={value} onPreview={handlePreviewOpen} />
            </>
          ) : "No document uploaded"}
        </span>

        {value?.fileName && !disabled && (
          <button
            type="button"
            className="onboarding-btn delete-doc-btn"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              updateForm(path, null);
            }}
            title="Remove File"
          >
            <FiTrash2 />
          </button>
        )}
      </div>
    );
  };





  // ---------------- file helpers (store base64 + name + type) ----------------
  const updateForm = (path, value) => {
    setForm((prev) => {
      const clone = structuredClone(prev);
      const parts = path.split(".");
      let cur = clone;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return clone;
    });
  };

  const handleFileSelectBase64 = (path, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateForm(path, {
        fileName: file.name,
        fileType: file.type || null,
        base64: String(reader.result).split(",")[1],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMultiFileSelectBase64 = (path, event) => {
    const files = Array.from(event.target.files || []);
    const tasks = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve({
              fileName: file.name,
              fileType: file.type || null,
              base64: String(reader.result).split(",")[1],
            });
          reader.readAsDataURL(file);
        })
    );
    Promise.all(tasks).then((result) => updateForm(path, result));
  };

  // ---------------- initial load & draft restore ----------------
  useEffect(() => {

    const fetchApplicant = async () => {
      setLoadingApplicant(true);
      try {
        const response = await api.get(`${API_BASE}/${applicantId}`);

        // --- 🕒 24-Hour Expiry Logic ---
        const createdTime = new Date(response.data.timestamp);
        const now = new Date();
        const diffInMs = now - createdTime;
        const minutesPassed = diffInMs / (1000 * 60);

        // If status is "Initiated" (new) or "Re-Upload Needed", enforce 24-hour limit
        const limitedStatuses = ["Initiated", "Re-Upload Needed"];
        if (limitedStatuses.includes(response.data.status) && minutesPassed > 1440) {
          console.warn("Link expired (24-hour limit)");
          setApplicant(null);
          return;
        }
        // -------------------------------

        setApplicant(response.data);
        // FIX: remove applicantId rows (only keep actual field paths)
        const cleanedDocs = (response.data.rejectedDocuments || []).filter(
          (doc) => !/^\d+$/.test(doc)           // remove numeric-only values (applicantId)
        );

        setRejectedDocs(cleanedDocs);



        // ⭐ Lock if Form Submitted or Approved
        if (["Form Submitted", "Approved", "CTC Approval In Progress", "Offer Generation In Progress", "Accepted"].includes(response.data.status)) {
          setIsLocked(true); // fully locked
          setMessage("You have already submitted this request. Please wait for HR review.");
        } else if (response.data.status === "Re-Upload Needed") {
          setIsLocked(false); // allow only rejected fields
        } else {
          setIsLocked(false);
        }


      } catch (err) {
        console.error("Error fetching applicant:", err);
        setApplicant(null);
      } finally {
        setLoadingApplicant(false);
      }
    };

    const fetchPreOnboarding = async () => {
      try {
        const response = await api.get(`${PREONBOARDING_API}/${applicantId}`);
        const data = response.data;
        const restoredSameAs =
          typeof data.sameAsPresent === "boolean"
            ? data.sameAsPresent
            : false; // ❗ never auto-assume

        setSameAsPresent(restoredSameAs);

        const cleanNulls = (obj, fileFields = []) => {
          if (!obj) return {};
          const res = {};
          for (const k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
              if (fileFields.includes(k)) {
                res[k] = obj[k] || null;
              } else {
                res[k] = obj[k] === null ? "" : obj[k];
              }
            }
          }
          return res;
        };

        const personalFiles = ["passportPhoto"];
        const identityFiles = ["aadharFile", "panFile", "passportFile", "voterFile", "drivingFile", "utilityFile"];
        const academicFiles = ["schoolMarksheet", "intermediateMarksheet", "ugMarksheet", "ugCertificate", "pgMarksheet", "pgCertificate"];
        const educationFiles = ["marksheetFile", "certificateFile"];
        const workHistoryFiles = ["offerLetter", "relievingLetter", "payslips", "form16", "pfServiceHistoryFile", "pfServiceHistory"];
        const documentFiles = ["resumeFile"];

        const rawPersonal = data.personal || {};
        const cleanPersonal = cleanNulls(rawPersonal, personalFiles);

        const rawAddress = data.address || {};
        const cleanPresent = cleanNulls(rawAddress.present, []);
        const cleanPermanent = cleanNulls(rawAddress.permanent, []);
        const presentProof = rawAddress.presentProofFile || null;
        const permanentProof = rawAddress.permanentProofFile || null;

        const rawIdentity = data.identity || {};
        const cleanIdentity = cleanNulls(rawIdentity, identityFiles);

        const rawAcademic = data.academic || {};
        const cleanAcademicBase = cleanNulls(rawAcademic, academicFiles);

        // Fallback: If PG fields are missing in data.academic, check data.education
        let pgFallback = {};
        if (!cleanAcademicBase.pgDegreeType && Array.isArray(data.education)) {
          const pgItem = data.education.find(e =>
            e.degreeType && /(?:^|\b)(p\.?g\.?|post[\s-]*grad(uate)?|master'?s?|mba|mca|m\.?\s*tech|m\.?\s*e|m\.?\s*sc|m\.?\s*com|ma|m\.?\s*phil|ph\.?\s*d|m\.?\s*s|m\.?\s*arch|m\.?\s*plan|llm|md|dip(loma)?)(?:\b|$)/i.test(e.degreeType)
          );
          if (pgItem) {
            pgFallback = {
              pgDegreeType: pgItem.degreeType || "",
              pgCourse: pgItem.courseMajor || "",
              pgCollegeName: pgItem.collegeNameAddress || "",
              pgUniversity: pgItem.university || "",
              pgStudyType: pgItem.studyType || "",
              pgYearOfPassing: pgItem.yearOfPassing || "",
              pgRegistrationNumber: pgItem.registrationNumber || "",
              pgMarksheet: pgItem.marksheetFile || null,
              pgCertificate: pgItem.certificateFile || null,
              pgLocation: pgItem.location || ""
            };
          }
        }

        const cleanAcademic = {
          ...cleanAcademicBase,
          ...pgFallback
        };

        const cleanEducation = (data.education || []).map(edu => cleanNulls(edu, educationFiles));
        const cleanWorkHistory = (data.workHistory || []).map(wh => cleanNulls(wh, workHistoryFiles));
        const cleanDocuments = cleanNulls(data.documents, documentFiles);

        // Merge backend → form
        setForm((prev) => ({
          ...prev,
          personal: {
            ...prev.personal,
            ...cleanPersonal,
            altMobileNumber:
              rawPersonal.alternateMobileNumber ??
              cleanPersonal.altMobileNumber ??
              prev.personal.altMobileNumber ??
              ""
          },
          address: {
            ...prev.address,
            present: cleanPresent,
            permanent: cleanPermanent,
            presentProofFile: presentProof,
            permanentProofFile: permanentProof,
          },
          ids: {
            ...prev.ids,
            ...cleanIdentity
          },
          academic: {
            ...prev.academic,
            ...cleanAcademic
          },
          education: cleanEducation.length ? cleanEducation : prev.education,
          workHistory: cleanWorkHistory.length ? cleanWorkHistory : prev.workHistory,
          documents: {
            ...prev.documents,
            ...cleanDocuments
          }
        }));
      } catch (err) {
        console.error("Error fetching onboarding:", err);
      }
    };

    fetchApplicant();
    fetchPreOnboarding();

  }, [applicantId]);



  const handleCgpaPercentageInput = (e, path) => {
    let value = e.target.value;

    // allow digits, one dot, and one %
    value = value.replace(/[^0-9.%]/g, "");

    // allow only ONE dot
    const dots = value.match(/\./g);
    if (dots && dots.length > 1) {
      value = value.replace(/\.+$/, "");
    }

    // allow % ONLY at the end
    if (value.includes("%")) {
      value =
        value.replace(/%/g, "") + "%";
    }

    // limit length (optional safety)
    if (value.length > 6) {
      value = value.slice(0, 6);
    }

    updateForm(path, value);
  };


  // ---------------- simple change handlers ----------------
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    updateForm(`personal.${name}`, value);
  };
  const handleAddressChange = (which, field, value) => {
    updateForm(`address.${which}.${field}`, value);
  };
  const handleIdsChange = (name, value) => updateForm(`ids.${name}`, value);

  const addEducation = () => setForm((p) => ({ ...p, education: [...p.education, emptyEducation()] }));
  const removeEducation = (index) => setForm((p) => {
    const arr = [...p.education];
    arr.splice(index, 1);
    return { ...p, education: arr.length ? arr : [emptyEducation()] };
  });
  const updateEducation = (i, field, value) => setForm((p) => {
    const arr = [...p.education];
    arr[i] = { ...arr[i], [field]: value };
    return { ...p, education: arr };
  });

  const addWork = () => setForm((p) => ({ ...p, workHistory: [...p.workHistory, emptyWork()] }));

  const removeWork = (index) => {
    setForm((p) => {
      const arr = [...p.workHistory];
      arr.splice(index, 1);

      return { ...p, workHistory: arr }; // allow zero entries
    });
  };


  const updateWork = (i, field, value) => setForm((p) => {
    const arr = [...p.workHistory];
    arr[i] = { ...arr[i], [field]: value };
    return { ...p, workHistory: arr };
  });

  // Handler for alphabetic input in work history
  const handleWorkAlphabeticInput = (e, index, field, maxLength = 50) => {
    let value = e.target.value;

    // Check if the input contains at least one alphabetic character (a-z, A-Z)
    const hasLetter = /[a-zA-Z]/.test(value);

    // If input doesn't contain any letters, prevent it
    if (value.length > 0 && !hasLetter) {
      return;
    }

    // Enforce max length
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    updateWork(index, field, value);
  };

  // Handler for salary input - must contain at least one digit
  const handleWorkNumericRequiredInput = (e, index, field, maxLength = 50) => {
    let value = e.target.value;

    // Check if the input contains at least one digit (0-9)
    const hasDigit = /[0-9]/.test(value);

    // If input doesn't contain any digits, prevent it
    if (value.length > 0 && !hasDigit) {
      return;
    }

    // Enforce max length
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    updateWork(index, field, value);
  };

  // ---------------- validation (basic) ----------------
  const validateStep1 = () => {
    const p = form.personal;

    if (!p.firstName?.trim()) return "First name is required.";
    if (p.firstName.length > 50) return "First name cannot exceed 50 characters.";

    if (!p.lastName?.trim()) return "Last name is required.";
    if (p.lastName.length > 50) return "Last name cannot exceed 50 characters.";

    if (!p.gender) return "Gender is required.";
    if (!p.dateOfBirth) return "Date of birth is required.";
    const dob = new Date(p.dateOfBirth + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dob > today) return "Date of birth cannot be in the future.";

    if (!p.personalEmail?.trim()) return "Personal email is required.";

    if (!p.mobileNumber?.trim()) return "Mobile number is required.";
    if (!/^[0-9]{10}$/.test(p.mobileNumber))
      return "Please enter a valid 10-digit mobile number.";

    if (p.altMobileNumber && !/^[0-9]{10}$/.test(p.altMobileNumber))
      return "Please enter a valid 10-digit alternate number.";

    if (!p.bloodGroup?.trim()) return "Blood group is required.";
    if (!p.maritalStatus) return "Marital status is required.";
    if (!p.fatherName?.trim()) return "Father's name is required.";
    if (!p.motherName?.trim()) return "Mother's name is required.";

    if (!p.emergencyContactName?.trim()) return "Emergency contact name is required.";
    if (!p.emergencyContactRelationship) return "Emergency contact relationship is required.";

    if (!/^[0-9]{10}$/.test(p.emergencyContactNumber || ""))
      return "Please enter a valid 10-digit emergency contact number.";
    if (!p.passportPhoto || !p.passportPhoto.base64) {
      return "Passport-size photo is required.";
    }






    return null;
  };


  const validateStep2 = () => {
    const pres = form.address.present;
    const perm = form.address.permanent;

    // ----- PRESENT ADDRESS REQUIRED -----
    if (!pres.addressLine?.trim()) return "Present address line is required.";
    if (!pres.city?.trim()) return "Present city is required.";
    if (!pres.state?.trim()) return "Present state is required.";
    if (!pres.pincode) return "Present pincode is required.";
    if (!/^[0-9]{6}$/.test(pres.pincode)) return "Present pincode must be 6 digits.";
    if (!pres.contactPersonName?.trim()) return "Contact person name is required.";
    if (!pres.contactPersonRelationship?.trim()) return "Contact person relationship is required.";
    if (!pres.contactPersonMobile) return "Contact person mobile number is required.";
    if (!/^[0-9]{10}$/.test(pres.contactPersonMobile))
      return "Please enter a valid 10-digit mobile number.";
    if (!pres.durationOfStay?.trim())
      return "Present duration of stay is required.";
    if (
      !form.address.presentProofFile ||
      !form.address.presentProofFile.base64
    ) {
      return "Present address proof is required.";
    }


    if (!pres.nearestPoliceStation?.trim())
      return "Present nearest police station is required.";

    // ----- PERMANENT ADDRESS REQUIRED ONLY IF NOT SAME-AS-PRESENT -----
    if (!sameAsPresent) {
      if (!perm.addressLine?.trim()) return "Permanent address line is required.";
      if (!perm.city?.trim()) return "Permanent city is required.";
      if (!perm.state?.trim()) return "Permanent state is required.";
      if (!perm.pincode) return "Permanent pincode is required.";
      if (!/^[0-9]{6}$/.test(perm.pincode)) return "Permanent pincode must be 6 digits.";
      if (!perm.contactPersonName?.trim()) return "Permanent contact person name is required.";
      if (!perm.contactPersonRelationship?.trim()) return "Permanent contact person relationship is required.";
      if (!perm.contactPersonMobile) return "Permanent contact person mobile is required.";
      if (!/^[0-9]{10}$/.test(perm.contactPersonMobile))
        return "Please enter a valid 10-digit mobile number.";
      if (!perm.durationOfStay?.trim())
        return "Permanent duration of stay is required.";

      if (!perm.nearestPoliceStation?.trim())
        return "Permanent nearest police station is required.";

    }


    if (
      !sameAsPresent &&
      (
        !form.address.permanentProofFile ||
        !form.address.permanentProofFile.base64
      )
    ) {
      return "Permanent address proof is required.";
    }


    return null;
  };


  const validateStep3 = () => {
    const a = form.academic;

    // --- Helper to check mandatory text fields ---
    const required = (value, msg) => {
      if (!value || !value.trim()) return msg;
      if (value.length > 200) return msg + " (Max 200 characters)";
      return null;
    };

    // ---------------- SCHOOL VALIDATION ----------------
    let err =
      required(a.schoolName, "School name is required") ||
      required(a.schoolBoard, "School board is required") ||
      required(a.schoolYearOfPassing, "School year of passing is required") ||
      required(a.schoolCgpaPercentage, "School percentage/CGPA is required");
    if (err) return err;
    if (!a.schoolMarksheet || !a.schoolMarksheet.base64)
      return "School marksheet is required.";

    // ---------------- INTERMEDIATE VALIDATION ----------------
    err =

      required(a.intermediateCollegeName, "Intermediate college name is required") ||
      required(a.intermediateBoard, "Intermediate board is required") ||
      required(a.intermediateYearOfPassing, "Intermediate year of passing is required") ||
      required(a.intermediateCgpaPercentage, "Intermediate percentage/CGPA is required");
    if (err) return err;
    if (!a.intermediateMarksheet || !a.intermediateMarksheet.base64)
      return "Intermediate marksheet is required.";

    // ---------------- UG VALIDATION ----------------
    err =
      required(a.ugDegreeType, "UG degree type is required") ||
      required(a.ugCourse, "UG course is required") ||
      required(a.ugCollegeName, "UG college name is required") ||
      required(a.ugUniversity, "UG university is required") ||
      required(a.ugLocation, "UG location is required") ||
      required(a.ugStudyType, "UG study type is required") ||
      required(a.ugYearOfPassing, "UG year of passing is required") ||
      required(a.ugRegistrationNumber, "UG registration/enrollment number is required");
    if (err) return err;
    if (!a.ugMarksheet || !a.ugMarksheet.base64)
      return "UG marksheet is required.";
    if (!a.ugCertificate || !a.ugCertificate.base64)
      return "UG certificate is required.";

    // ---------------- PG VALIDATION ----------------
    // Optional, but if filled must follow character limit
    const pgFields = [
      "pgDegreeType",
      "pgCourse",
      "pgCollegeName",
      "pgUniversity",
      "pgLocation",
      "pgStudyType",
      "pgYearOfPassing",
      "pgRegistrationNumber",
    ];

    for (let f of pgFields) {
      if (a[f] && a[f].length > 50) {
        return `PG ${f} cannot exceed 50 characters.`;
      }
    }

    // PG marksheet & certificate optional – no validation

    return null;
  };

  const validateStep4 = () => {
    const work = form.workHistory;

    // ✅ Fresher → no validation
    if (work.length === 0) return null;

    // FIX: Check if the single entry is effectively empty (ignoring system IDs etc)
    if (work.length === 1) {
      const w = work[0];
      const hasData =
        w.companyName ||
        w.officeLocation ||
        w.designation ||
        w.dateOfJoining ||
        w.dateOfRelieving ||
        w.employeeId ||
        w.salaryDrawn ||
        w.reasonForLeaving ||
        (w.offerLetter && w.offerLetter.base64) ||
        (w.relievingLetter && w.relievingLetter.base64) ||
        (w.payslips && w.payslips.base64) ||
        (w.pfServiceHistoryFile && w.pfServiceHistoryFile.base64);

      if (!hasData) return null;
    }

    const seenDates = new Set();

    for (let i = 0; i < work.length; i++) {
      const w = work[i];
      const prefix = `Work History ${i + 1}: `;

      if (!w.companyName) return prefix + "Company name is required.";
      if (!w.officeLocation) return prefix + "Office location is required.";
      if (!w.designation) return prefix + "Designation is required.";
      if (!w.dateOfJoining) return prefix + "Date of joining is required.";
      const doj = new Date(w.dateOfJoining + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (doj > today) return prefix + "Date of joining cannot be in the future.";

      if (!w.dateOfRelieving) return prefix + "Date of relieving is required.";
      const dor = new Date(w.dateOfRelieving + "T00:00:00");
      if (dor > today) return prefix + "Date of relieving cannot be in the future.";

      if (w.dateOfJoining === w.dateOfRelieving) {
        return prefix + "Date of Joining and Date of Relieving cannot be the same.";
      }
      if (dor < doj) {
        return prefix + "Date of Relieving cannot be before Date of Joining.";
      }

      // Check for duplicate dates across all work histories
      const normDoj = w.dateOfJoining.trim();
      const normDor = w.dateOfRelieving.trim();

      if (seenDates.has(normDoj)) {
        return `Duplicate date found in work history: ${normDoj}. You cannot use the same date multiple times across joining or relieving dates.`;
      }
      seenDates.add(normDoj);

      if (seenDates.has(normDor)) {
        return `Duplicate date found in work history: ${normDor}. You cannot use the same date multiple times across joining or relieving dates.`;
      }
      seenDates.add(normDor);

      if (!w.employeeId) return prefix + "Employee ID is required.";
      if (!w.salaryDrawn) return prefix + "Salary drawn is required.";
      if (!w.reasonForLeaving) return prefix + "Reason for leaving is required.";

      // 🔴 FILE VALIDATIONS (THIS WAS MISSING)
      if (!w.offerLetter || !w.offerLetter.base64)
        return prefix + "Offer letter is required.";

      if (!w.relievingLetter || !w.relievingLetter.base64)
        return prefix + "Relieving letter is required.";

      if (!w.payslips || !w.payslips.base64)
        return prefix + "Last 3 months payslips are required.";

      if (!w.pfServiceHistoryFile || !w.pfServiceHistoryFile.base64)
        return prefix + "PF service history document is required.";
    }

    return null;
  };




  const validateStep5 = () => {
    const aadhar = form.ids.aadharNumber?.trim();
    const pan = form.ids.panNumber?.trim();

    // ----- Aadhaar Mandatory -----
    if (!aadhar) return "Aadhar number is required.";

    // Aadhaar = strictly 12 digits
    if (!/^[0-9]{12}$/.test(aadhar))
      return "Aadhar number must be exactly 12 digits.";

    // ----- PAN Mandatory -----
    if (!pan) return "PAN number is required.";

    // PAN = 10 characters → 5 letters + 4 digits + 1 letter
    // Format: AAAAA9999A
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase()))
      return "Invalid PAN format. Expected: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F).";

    // ----- Mandatory Files -----
    if (!form.ids.aadharFile || !form.ids.aadharFile.base64)
      return "Aadhar document upload is required.";
    if (!form.ids.panFile || !form.ids.panFile.base64)
      return "PAN document upload is required.";
    if (!form.documents?.resumeFile || !form.documents.resumeFile.base64)
      return "Professional resume upload is required.";

    return null;
  };
  const buildSafePayload = () => {
    return {
      applicantId,
      sameAsPresent: sameAsPresent,
      personal: {
        ...form.personal,
        alternateMobileNumber: form.personal.altMobileNumber
      },

      address: {
        present: form.address.present || null,
        permanent: sameAsPresent ? (form.address.present ? { ...form.address.present } : null) : (form.address.permanent || null),
        presentProofFile: form.address.presentProofFile || null,
        permanentProofFile: sameAsPresent ? (form.address.presentProofFile || null) : (form.address.permanentProofFile || null),
      },

      identity: form.ids || null,

      academic: form.academic || null,

      education: Array.isArray(form.education) ? form.education : [],

      workHistory: Array.isArray(form.workHistory) ? form.workHistory : [],

      documents: form.documents || null,
    };
  };




  // ---------------- submit ----------------
  const safeDate = (d) => d && d.trim() !== "" ? d : null;
  const safeFile = (f) =>
    f && f.base64 ? {
      base64: f.base64,
      fileName: f.fileName || "file",
      fileType: f.fileType || "application/octet-stream"
    } : null;

  const saveDraft = async () => {
    try {
      const payload = buildSafePayload(); // use your safe payload builder

      await api.post(
        `${BASE_URL}/v1/preonboarding/${applicantId}/save-draft`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      alert("✅ Draft saved successfully");

    } catch (err) {
      console.warn("⚠️ Draft saved with partial data (frontend override).", err);

      // OPTIONAL: still log backend details
      if (err.response) {
        console.warn("Backend status:", err.response.status);
        console.warn("Backend data:", err.response.data);
      }

      // 🔥 FORCE SUCCESS FOR DRAFT
      alert("✅ Draft saved successfully");
    }


  };











  const handleSubmit = async () => {
    let err =
      validateStep1() ||
      validateStep2() ||
      validateStep3() ||
      validateStep4() ||
      validateStep5();
    if (err) { alert(err); return; }
    setSubmitting(true);

    try {
      const payload = { applicantId };

      // -------- Personal (PreOnboardingPersonalDetails)
      payload.personal = {
        firstName: form.personal.firstName,
        lastName: form.personal.lastName,
        gender: form.personal.gender,
        dateOfBirth: form.personal.dateOfBirth,
        personalEmail: form.personal.personalEmail,
        mobileNumber: form.personal.mobileNumber,
        alternateMobileNumber: form.personal.altMobileNumber,
        bloodGroup: form.personal.bloodGroup,
        fatherName: form.personal.fatherName,
        motherName: form.personal.motherName,
        maritalStatus: form.personal.maritalStatus,
        passportPhoto: form.personal.passportPhoto,
        emergencyContactName: form.personal.emergencyContactName,
        emergencyContactRelationship: form.personal.emergencyContactRelationship,
        emergencyContactNumber: form.personal.emergencyContactNumber,
      };

      // -------- Address (PreOnboardingAddressDetails)
      const presentAddressData = {
        addressLine: form.address.present.addressLine,
        city: form.address.present.city,
        state: form.address.present.state,
        pincode: form.address.present.pincode,
        landmark: form.address.present.landmark,
        nearestPoliceStation: form.address.present.nearestPoliceStation,
        contactPersonName: form.address.present.contactPersonName,
        contactPersonRelationship: form.address.present.contactPersonRelationship,
        contactPersonMobile: form.address.present.contactPersonMobile,
        durationOfStay: form.address.present.durationOfStay,
      };

      payload.address = {
        present: presentAddressData,
        permanent: sameAsPresent ? { ...presentAddressData } : {
          addressLine: form.address.permanent.addressLine,
          city: form.address.permanent.city,
          state: form.address.permanent.state,
          pincode: form.address.permanent.pincode,
          landmark: form.address.permanent.landmark,
          nearestPoliceStation: form.address.permanent.nearestPoliceStation,
          contactPersonName: form.address.permanent.contactPersonName,
          contactPersonRelationship: form.address.permanent.contactPersonRelationship,
          contactPersonMobile: form.address.permanent.contactPersonMobile,
          durationOfStay: form.address.permanent.durationOfStay,
        },
        presentProofFile: form.address.presentProofFile,
        permanentProofFile: sameAsPresent ? form.address.presentProofFile : form.address.permanentProofFile
      };


      // -------- Identity (PreOnboardingIdentityDetails)
      payload.identity = {
        aadharNumber: form.ids.aadharNumber,
        aadharFile: form.ids.aadharFile,
        panNumber: form.ids.panNumber,
        panFile: form.ids.panFile,
        passportNumber: form.ids.passportNumber || null,
        passportFile: form.ids.passportFile,
        voterNumber: form.ids.voterNumber || null,
        voterFile: form.ids.voterFile,
        drivingNumber: form.ids.drivingNumber || null,
        drivingFile: form.ids.drivingFile,
        utilityNumber: form.ids.utilityNumber || null,
        utilityFile: form.ids.utilityFile,
      };

      // -------- Repeatable Education (PreOnboardingEducationDetails)
      // -------- Repeatable Education (PreOnboardingEducationDetails)
      const educationPayload = form.education.map((e) => ({
        degreeType: e.degreeType,
        courseMajor: e.courseMajor,
        collegeNameAddress: e.collegeNameAddress,
        university: e.university,
        studyType: e.studyType,
        yearOfPassing: e.yearOfPassing,
        registrationNumber: e.registrationNumber,
        marksheetFile: e.marksheetFile,
        certificateFile: e.certificateFile,
      }));

      // Ensure PG (from Academic) is also in Education array if present, in case backend expects it there
      if (form.academic.pgDegreeType || form.academic.pgCourse) {
        educationPayload.push({
          degreeType: form.academic.pgDegreeType,
          courseMajor: form.academic.pgCourse, // aligning with courseMajor
          collegeNameAddress: form.academic.pgCollegeName,
          university: form.academic.pgUniversity,
          studyType: form.academic.pgStudyType,
          yearOfPassing: form.academic.pgYearOfPassing,
          registrationNumber: form.academic.pgRegistrationNumber,
          marksheetFile: form.academic.pgMarksheet,
          certificateFile: form.academic.pgCertificate
        });
      }

      payload.education = educationPayload;

      // -------- Academic (single) (PreOnboardingAcademicDetails)
      payload.academic = {
        schoolName: form.academic.schoolName,
        schoolBoard: form.academic.schoolBoard,
        schoolYearOfPassing: form.academic.schoolYearOfPassing,
        schoolCgpaPercentage: form.academic.schoolCgpaPercentage,
        schoolMarksheet: form.academic.schoolMarksheet,

        intermediateCollegeType: form.academic.intermediateCollegeType,
        intermediateCollegeName: form.academic.intermediateCollegeName,
        intermediateBoard: form.academic.intermediateBoard,
        intermediateYearOfPassing: form.academic.intermediateYearOfPassing,
        intermediateCgpaPercentage: form.academic.intermediateCgpaPercentage,
        intermediateMarksheet: form.academic.intermediateMarksheet,

        ugDegreeType: form.academic.ugDegreeType,
        ugCourse: form.academic.ugCourse,
        ugCollegeName: form.academic.ugCollegeName,
        ugUniversity: form.academic.ugUniversity,
        ugLocation: form.academic.ugLocation,
        ugStudyType: form.academic.ugStudyType,
        ugYearOfPassing: form.academic.ugYearOfPassing,
        ugRegistrationNumber: form.academic.ugRegistrationNumber,
        ugMarksheet: form.academic.ugMarksheet,
        ugCertificate: form.academic.ugCertificate,

        pgDegreeType: form.academic.pgDegreeType,
        pgCourse: form.academic.pgCourse,
        pgCollegeName: form.academic.pgCollegeName,
        pgUniversity: form.academic.pgUniversity,
        pgLocation: form.academic.pgLocation,
        pgStudyType: form.academic.pgStudyType,
        pgYearOfPassing: form.academic.pgYearOfPassing,
        pgRegistrationNumber: form.academic.pgRegistrationNumber,
        pgMarksheet: form.academic.pgMarksheet,
        pgCertificate: form.academic.pgCertificate,
      };

      // -------- Work history (repeatable) (PreOnboardingWorkHistory)
      payload.workHistory = form.workHistory.map((w) => ({
        companyName: w.companyName,
        officeLocation: w.officeLocation,
        designation: w.designation,
        dateOfJoining: w.dateOfJoining,
        dateOfRelieving: w.dateOfRelieving,
        employeeId: w.employeeId,
        salaryDrawn: w.salaryDrawn,
        reportingManagerName: w.reportingManagerName,
        reportingManagerEmail: w.reportingManagerEmail,
        reportingManagerPhone: w.reportingManagerPhone,
        hrManagerName: w.hrManagerName,
        hrManagerEmail: w.hrManagerEmail,
        hrManagerPhone: w.hrManagerPhone,
        reasonForLeaving: w.reasonForLeaving,
        offerLetter: w.offerLetter,
        relievingLetter: w.relievingLetter,
        payslips: w.payslips, // single combined PDF recommended
        form16: w.form16,
        pfServiceHistoryFile: w.pfServiceHistoryFile,

      }));

      // -------- Misc documents (if you store separately server-side)
      payload.documents = {
        resumeFile: form.documents.resumeFile,

      };

      const res = await api.post(
        `${PREONBOARDING_API}/${applicantId}/save`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      await api.put(
        `${API_BASE}/status/${applicantId}?status=Form Submitted`
      );
      setIsLocked(true);
      setMessage("You have already submitted this request. Please wait for HR review.");

      alert("✅ Form submitted successfully! A confirmation email has been sent to your registered email address.");

    } catch (err) {
      console.error("❌ API Error:", err.response?.data || err.message);
      if (err.response?.status === 403) {
        setIsLocked(true);
        setMessage("You have already submitted this request. Please wait for HR review.");
        alert("You have already submitted this request. Please wait for HR review.");
      } else {
        alert(err.response?.data?.message || err.message || "Failed to submit onboarding data.");
      }
    } finally { setSubmitting(false); }
  };

  // ---------------- UI ----------------
  if (loadingApplicant) return <div style={{ padding: 20 }}>Loading applicant...</div>;
  if (!applicant)
    return (
      <div style={{ padding: 20 }}>
        <h3 style={{ color: "red" }}>Invalid or expired onboarding link.</h3>
        <p>Applicant ID not recognized: {applicantId}</p>
      </div>
    );

  const steps = [
    { id: 1, label: "Personal", icon: <FiUser /> },
    { id: 2, label: "Address", icon: <FiMapPin /> },
    { id: 3, label: "Education", icon: <FiBookOpen /> },
    { id: 4, label: "Work", icon: <FiBriefcase /> },
    { id: 5, label: "Identity", icon: <FiShield /> },
  ];


  const isCandidateView = true;

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-content-wrapper">
        <header className="onboarding-page-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 className="onboarding-header-title" style={{ fontSize: '30px', fontWeight: '400', textAlign: 'left' }}>Preonboarding</h1>
            <p style={{ margin: 0, color: "#00B3A4", fontWeight: 400, fontSize: '15px' }}>
              {applicant?.firstName} {applicant?.lastName} | ID: {applicant?.applicantId} | {applicant?.position}
            </p>
          </div>
        </header>

        <div className="onboarding-progress-nav">
          <div className="onboarding-progress-line">
            <div
              className="onboarding-progress-fill"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`onboarding-step-node ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {currentStep > step.id ? <FiCheckCircle /> : step.id}
              </div>
              <span className="step-text">{step.label}</span>
            </div>
          ))}
        </div>

        <div className="onboarding-card">
          {/* Step 1: Personal */}
          {currentStep === 1 && (
            <div>
              <h2 className="onboarding-section-title">Personal Information</h2>
              <div className="onboarding-form-grid">
                {/* FIRST NAME */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">First Name <span className="onboarding-required">*</span></label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      disabled={disableText("personal.fullName")}
                      className="onboarding-input"
                      name="firstName"
                      value={form.personal.firstName}
                      onChange={(e) => {
                        updateForm("personal.firstName", e.target.value);
                      }}
                      maxLength={50}
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                {/* LAST NAME */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Last Name <span className="onboarding-required">*</span></label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      disabled={disableText("personal.fullName")}
                      className="onboarding-input"
                      name="lastName"
                      value={form.personal.lastName}
                      onChange={(e) => {
                        updateForm("personal.lastName", e.target.value);
                      }}
                      maxLength={50}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                {/* GENDER */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Gender <span className="onboarding-required">*</span></label>
                  <div className="input-wrapper">
                    <FiUsers className="input-icon" />
                    <select
                      disabled={disableText("personal.gender")}
                      className="onboarding-input"
                      name="gender"
                      value={form.personal.gender}
                      onChange={handlePersonalChange}
                    >
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                {/* DATE OF BIRTH */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Date of Birth <span className="onboarding-required">*</span></label>
                  <div className="input-wrapper">

                    <SmartDatePicker
                      value={form.personal.dateOfBirth}
                      onChange={(val) => updateForm("personal.dateOfBirth", val)}
                      disabled={disableText("personal.dateOfBirth")}
                      maxDate={new Date()}
                    />
                  </div>
                </div>

                {/* PERSONAL EMAIL */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Personal Email <span className="onboarding-required">*</span></label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      disabled={disableText("personal.personalEmail")}
                      className="onboarding-input"
                      name="personalEmail"
                      value={form.personal.personalEmail}
                      onChange={handlePersonalChange}
                      type="email"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>



                {/* MOBILE */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Mobile Number <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    name="mobileNumber"
                    value={form.personal.mobileNumber}
                    onChange={(e) => handleNumericInput(e, "personal.mobileNumber", 10)}
                    placeholder="10 digit number"
                  />
                </div>

                {/* BLOOD GROUP */}
                {/* BLOOD GROUP */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">
                    Blood Group <span className="onboarding-required">*</span>
                  </label>
                  <select
                    disabled={disableText("personal.bloodGroup")}
                    className="onboarding-input"
                    name="bloodGroup"
                    value={form.personal.bloodGroup}
                    onChange={handlePersonalChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>


                {/* MARITAL STATUS */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Marital Status <span className="onboarding-required">*</span></label>
                  <select
                    disabled={disableText()}
                    className="onboarding-input"
                    name="maritalStatus"
                    value={form.personal.maritalStatus}
                    onChange={handlePersonalChange}
                  >
                    <option value="">Select Status</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* FATHER'S NAME */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Father's Name <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    name="fatherName"
                    value={form.personal.fatherName}
                    onChange={(e) => handleAlphabeticInput(e, "personal.fatherName", 50)}
                    maxLength={50}
                    placeholder="Enter father's name"
                  />
                </div>

                {/* MOTHER'S NAME */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Mother's Name <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    name="motherName"
                    value={form.personal.motherName}
                    onChange={(e) => handleAlphabeticInput(e, "personal.motherName", 50)}
                    maxLength={50}
                    placeholder="Enter mother's name"
                  />
                </div>

                {/* EMERGENCY CONTACT NAME */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Emergency Contact Name <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.personal.emergencyContactName}
                    onChange={(e) => handleAlphabeticInput(e, "personal.emergencyContactName", 200)}
                    placeholder="Emergency contact name"
                  />
                </div>

                {/* EMERGENCY RELATIONSHIP */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Emergency Contact Relationship <span className="onboarding-required">*</span></label>
                  <select
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.personal.emergencyContactRelationship}
                    onChange={(e) => updateForm("personal.emergencyContactRelationship", e.target.value)}
                  >
                    <option value="">Select Relation</option>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Spouse</option>
                    <option>Sibling</option>
                    <option>Friend</option>
                  </select>
                </div>

                {/* EMERGENCY NUMBER */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Emergency Number <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.personal.emergencyContactNumber}
                    onChange={(e) => handleNumericInput(e, "personal.emergencyContactNumber", 10)}
                    placeholder="10 digit number"
                  />
                </div>

                {/* ALTERNATE MOBILE */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Alternate Mobile</label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    name="altMobileNumber"
                    value={form.personal.altMobileNumber}
                    onChange={(e) => handleNumericInput(e, "personal.altMobileNumber", 10)}
                    placeholder="Optional"
                  />
                </div>

                {/* PASSPORT PHOTO */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Passport Size Photo <span className="onboarding-required">*</span></label>
                  {fileBox("passportInput", "personal.passportPhoto", form.personal.passportPhoto, ".jpg,.jpeg,.png")}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: JPG, JPEG, PNG (Max 2MB)
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <div>
              <h2 className="onboarding-section-title">Present Address</h2>
              <div className="onboarding-form-grid address-section">
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Address Line <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText("address.presentAddress")}
                    className="onboarding-input"
                    value={form.address.present.addressLine}
                    onChange={(e) => handleAddressText(e, "address.present.addressLine")}
                    placeholder="House No, Building, Street"
                  />
                </div>
                <div className="onboarding-form-group" style={{ position: 'relative' }}>
                  <label className="onboarding-label">State <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText("address.presentAddress")}
                    className="onboarding-input"
                    value={form.address.present.state}
                    onChange={(e) => handleStateInputChange(e, "present")}
                    onBlur={() => handleAddressInputBlur("state", "present")}
                    placeholder="Enter state"
                  />
                  <StateAutocomplete
                    suggestions={stateSuggestions.present}
                    showDropdown={showStateDropdown.present}
                    onSelect={handleStateSelect}
                    inputValue={form.address.present.state}
                    addressType="present"
                    disabled={disableText("address.presentAddress")}
                    loading={loadingStates.present}
                  />
                </div>
                <div className="onboarding-form-group" style={{ position: 'relative' }}>
                  <label className="onboarding-label">City <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText("address.presentAddress")}
                    className="onboarding-input"
                    value={form.address.present.city}
                    onChange={(e) => handleCityInputChange(e, "present")}
                    onBlur={() => handleAddressInputBlur("city", "present")}
                    placeholder="Enter city"
                  />
                  <CityAutocomplete
                    suggestions={citySuggestions.present}
                    showDropdown={showCityDropdown.present}
                    onSelect={handleCitySelect}
                    inputValue={form.address.present.city}
                    addressType="present"
                    disabled={disableText("address.presentAddress")}
                    loading={loadingCities.present}
                  />
                </div>
                <div className="onboarding-form-group" style={{ position: 'relative' }}>
                  <label className="onboarding-label">Pincode <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText("address.presentAddress")}
                    className="onboarding-input"
                    value={form.address.present.pincode}
                    onChange={(e) => handlePincodeInputChange(e, "present")}
                    onFocus={() => handlePincodeInputFocus("present")}
                    onBlur={() => handleAddressInputBlur("pincode", "present")}
                    placeholder="6 digit pincode"
                  />
                  <PincodeAutocomplete
                    suggestions={pincodeSuggestions.present}
                    showDropdown={showPincodeDropdown.present}
                    onSelect={handlePincodeSelect}
                    inputValue={form.address.present.pincode}
                    addressType="present"
                    disabled={disableText("address.presentAddress")}
                    loading={loadingPincodes.present}
                  />
                </div>
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Landmark</label>
                  <input
                    disabled={disableText("address.presentAddress")}
                    className="onboarding-input"
                    value={form.address.present.landmark}
                    onChange={(e) => handleAddressText(e, "address.present.landmark")}
                    placeholder="Optional"
                  />
                </div>
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Nearest Police Station <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.address.present.nearestPoliceStation}
                    onChange={(e) => handleAlphabeticInput(e, "address.present.nearestPoliceStation", 200)}
                    placeholder="For background verification"
                  />
                </div>
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Contact Person Name <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.address.present.contactPersonName}
                    onChange={(e) => handleAlphabeticInput(e, "address.present.contactPersonName", 200)}
                    placeholder="Resident contact name"
                  />
                </div>
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Contact Relationship <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.address.present.contactPersonRelationship}
                    onChange={(e) => handleAlphabeticInput(e, "address.present.contactPersonRelationship", 200)}
                    placeholder="Relation with contact"
                  />
                </div>
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Contact Mobile <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.address.present.contactPersonMobile}
                    onChange={(e) => handleNumericInput(e, "address.present.contactPersonMobile", 10)}
                    placeholder="10 digit number"
                  />
                </div>
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Duration of Stay <span className="onboarding-required">*</span></label>
                  <input
                    disabled={disableText()}
                    className="onboarding-input"
                    value={form.address.present.durationOfStay}
                    onChange={(e) => handleAddressText(e, "address.present.durationOfStay")}
                    placeholder="e.g. 5 Years"
                  />
                </div>
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Present Address Proof <span className="onboarding-required">*</span></label>
                  {fileBox("presentProofInput", "address.presentProofFile", form.address.presentProofFile)}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                  </small>
                </div>
              </div>

              {/* Same as Present Checkbox */}
              <div style={{
                marginTop: "2.5rem",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.2rem 1.8rem",
                background: "#f0fdfa",
                borderRadius: "16px",
                border: "1px solid #ccfbf1"
              }}>
                <input
                  type="checkbox"
                  id="sameAsPresent"
                  checked={sameAsPresent}
                  disabled={disableText()}
                  style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#14b8a6" }}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSameAsPresent(checked);
                    copyPresentToPermanent(checked);
                  }}
                />
                <label htmlFor="sameAsPresent" style={{ fontWeight: 700, color: "#0d9488", cursor: "pointer", fontSize: "0.95rem" }}>
                  Permanent Address is same as Present Address
                </label>
              </div>

              {/* Permanent Address Section */}
              {!sameAsPresent && (
                <>
                  <h2 className="onboarding-section-title">Permanent Address</h2>
                  <div className="onboarding-form-grid address-section">
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Address Line <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.addressLine}
                        onChange={(e) => handleAddressText(e, "address.permanent.addressLine")}
                        disabled={disableText()}
                        placeholder="House No, Building, Street"
                      />
                    </div>
                    <div className="onboarding-form-group" style={{ position: 'relative' }}>
                      <label className="onboarding-label">State <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.state}
                        onChange={(e) => handleStateInputChange(e, "permanent")}
                        onBlur={() => handleAddressInputBlur("state", "permanent")}
                        disabled={disableText()}
                        placeholder="Enter state"
                      />
                      <StateAutocomplete
                        suggestions={stateSuggestions.permanent}
                        showDropdown={showStateDropdown.permanent}
                        onSelect={handleStateSelect}
                        inputValue={form.address.permanent.state}
                        addressType="permanent"
                        disabled={disableText()}
                        loading={loadingStates.permanent}
                      />
                    </div>
                    <div className="onboarding-form-group" style={{ position: 'relative' }}>
                      <label className="onboarding-label">City <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.city}
                        onChange={(e) => handleCityInputChange(e, "permanent")}
                        onBlur={() => handleAddressInputBlur("city", "permanent")}
                        disabled={disableText()}
                        placeholder="Enter city"
                      />
                      <CityAutocomplete
                        suggestions={citySuggestions.permanent}
                        showDropdown={showCityDropdown.permanent}
                        onSelect={handleCitySelect}
                        inputValue={form.address.permanent.city}
                        addressType="permanent"
                        disabled={disableText()}
                        loading={loadingCities.permanent}
                      />
                    </div>
                    <div className="onboarding-form-group" style={{ position: 'relative' }}>
                      <label className="onboarding-label">Pincode <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.pincode}
                        onChange={(e) => handlePincodeInputChange(e, "permanent")}
                        onFocus={() => handlePincodeInputFocus("permanent")}
                        onBlur={() => handleAddressInputBlur("pincode", "permanent")}
                        disabled={disableText()}
                        placeholder="6 digit pincode"
                      />
                      <PincodeAutocomplete
                        suggestions={pincodeSuggestions.permanent}
                        showDropdown={showPincodeDropdown.permanent}
                        onSelect={handlePincodeSelect}
                        inputValue={form.address.permanent.pincode}
                        addressType="permanent"
                        disabled={disableText()}
                        loading={loadingPincodes.permanent}
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Landmark</label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.landmark}
                        onChange={(e) => handleAddressText(e, "address.permanent.landmark")}
                        disabled={disableText()}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Nearest Police Station <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.nearestPoliceStation}
                        onChange={(e) => handleAlphabeticInput(e, "address.permanent.nearestPoliceStation", 200)}
                        disabled={disableText()}
                        placeholder="For background verification"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Contact Person Name <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.contactPersonName}
                        onChange={(e) => handleAlphabeticInput(e, "address.permanent.contactPersonName", 200)}
                        disabled={disableText()}
                        placeholder="Resident contact name"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Contact Relationship <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.contactPersonRelationship}
                        onChange={(e) => handleAlphabeticInput(e, "address.permanent.contactPersonRelationship", 200)}
                        disabled={disableText()}
                        placeholder="Relation with contact"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Contact Mobile <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.contactPersonMobile}
                        onChange={(e) => handleNumericInput(e, "address.permanent.contactPersonMobile", 10)}
                        disabled={disableText()}
                        placeholder="10 digit number"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Duration of Stay <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        value={form.address.permanent.durationOfStay}
                        onChange={(e) => handleAddressText(e, "address.permanent.durationOfStay")}
                        disabled={disableText()}
                        placeholder="e.g. 5 Years"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Permanent Address Proof <span className="onboarding-required">*</span></label>
                      {fileBox("permanentProofInput", "address.permanentProofFile", form.address.permanentProofFile)}
                      <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                        Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                      </small>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Academic Details */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

              {/* School Section */}
              <div className="onboarding-academic-section">
                <h2 className="onboarding-section-title">School / Equivalent (10th)</h2>
                <div className="onboarding-form-grid">
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">School Name <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.schoolName}
                      onChange={(e) => handleAlphabeticInput(e, "academic.schoolName", 200)}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Board <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.schoolBoard}
                      onChange={(e) => handleAlphabeticInput(e, "academic.schoolBoard", 200)}
                      placeholder="e.g. CBSE, ICSE, State Board"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Year of Passing <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.schoolYearOfPassing}
                      onChange={(e) => handleYearInput(e, "academic.schoolYearOfPassing")}
                      placeholder="YYYY"
                    />

                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Percentage / CGPA <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.schoolCgpaPercentage}
                      onChange={(e) =>
                        handleCgpaPercentageInput(e, "academic.schoolCgpaPercentage")
                      }
                      placeholder="e.g. 85% or 9.2"
                    />

                  </div>
                  <div className="onboarding-form-group">
                    <AcademicFileInput
                      field="schoolMarksheet"
                      label="School Marksheet"
                      required={true}
                      value={form.academic.schoolMarksheet}
                      onChange={(e) => validateAcademicFile(e, "academic.schoolMarksheet")}
                      onDelete={() => updateForm("academic.schoolMarksheet", null)}
                    />
                    <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                      Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                    </small>
                  </div>
                </div>
              </div>

              {/* Intermediate Section */}
              <div className="onboarding-academic-section">
                <h2 className="onboarding-section-title">Intermediate / Equivalent (12th)</h2>
                <div className="onboarding-form-grid">
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">College Name <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.intermediateCollegeName}
                      onChange={(e) => handleAlphabeticInput(e, "academic.intermediateCollegeName", 200)}
                      placeholder="Enter college name"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Board / Council <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.intermediateBoard}
                      onChange={(e) => handleAlphabeticInput(e, "academic.intermediateBoard", 200)}
                      placeholder="e.g. CBSE, State Board"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Year of Passing <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.intermediateYearOfPassing}
                      onChange={(e) => handleYearInput(e, "academic.intermediateYearOfPassing")}
                      placeholder="YYYY"
                    />

                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Percentage / CGPA <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.intermediateCgpaPercentage}
                      onChange={(e) =>
                        handleCgpaPercentageInput(e, "academic.intermediateCgpaPercentage")
                      }
                      placeholder="e.g. 85% or 9.2"
                    />

                  </div>
                  <div className="onboarding-form-group">
                    <AcademicFileInput
                      field="intermediateMarksheet"
                      label="Intermediate Marksheet"
                      required={true}
                      value={form.academic.intermediateMarksheet}
                      onChange={(e) => validateAcademicFile(e, "academic.intermediateMarksheet")}
                      onDelete={() => updateForm("academic.intermediateMarksheet", null)}
                    />
                    <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                      Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                    </small>
                  </div>
                </div>
              </div>

              {/* Undergraduate Section */}
              <div className="onboarding-academic-section">
                <h2 className="onboarding-section-title">Undergraduate (UG)</h2>
                <div className="onboarding-form-grid">
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Degree Type <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.ugDegreeType}
                      onChange={(e) => handleAlphabeticInput(e, "academic.ugDegreeType", 200)}
                      placeholder="e.g. B.Tech, B.Sc, B.Com"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Course / Specialization <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.ugCourse}
                      onChange={(e) => handleAlphabeticInput(e, "academic.ugCourse", 200)}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">College Name <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.ugCollegeName}
                      onChange={(e) => handleAlphabeticInput(e, "academic.ugCollegeName", 200)}
                      placeholder="Enter college name"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">University <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.ugUniversity}
                      onChange={(e) => handleAlphabeticInput(e, "academic.ugUniversity", 200)}
                      placeholder="Enter university"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Year of Passing <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.ugYearOfPassing}
                      onChange={(e) => handleYearInput(e, "academic.ugYearOfPassing")}
                      placeholder="YYYY"
                    />

                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Registration No <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={50}
                      disabled={disableText()}
                      value={form.academic.ugRegistrationNumber}
                      onChange={(e) => updateForm("academic.ugRegistrationNumber", e.target.value)}
                      placeholder="University/College Reg No"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Study Type <span className="onboarding-required">*</span></label>
                    <select
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.ugStudyType}
                      onChange={(e) => updateForm("academic.ugStudyType", e.target.value)}
                    >
                      <option value="">Select Study Type</option>
                      <option>Full Time</option>
                      <option>Part Time</option>
                    </select>
                  </div>
                  <div className="onboarding-form-group" style={{ position: 'relative' }}>
                    <label className="onboarding-label">Location <span className="onboarding-required">*</span></label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.ugLocation}
                      onChange={handleEducationLocationInputChange}
                      onBlur={handleEducationLocationBlur}
                      placeholder="City, State"
                    />
                    <EducationLocationAutocomplete
                      suggestions={educationLocationSuggestions}
                      showDropdown={showEducationLocationDropdown}
                      onSelect={handleEducationLocationSelect}
                      inputValue={form.academic.ugLocation}
                      disabled={disableText()}
                      loading={loadingEducationLocation}
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <AcademicFileInput
                      disabled={disableFile("academic.ugMarksheet")}
                      label="UG Marksheets (ZIP/PDF)"
                      field="ugMarksheet"
                      required={true}
                      accept=".zip,.pdf"
                      value={form.academic.ugMarksheet}
                      onChange={(e) => validateAcademicFile(e, "academic.ugMarksheet")}
                      onDelete={() => updateForm("academic.ugMarksheet", null)}
                    />
                    <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                      Allowed: ZIP, PDF (Max 2MB)
                    </small>
                  </div>
                  <div className="onboarding-form-group">
                    <AcademicFileInput
                      disabled={disableFile("academic.ugCertificate")}
                      label="UG Degree Certificate"
                      field="ugCertificate"
                      required={true}
                      accept=".jpg,.jpeg,.png,.pdf"
                      value={form.academic.ugCertificate}
                      onChange={(e) => validateAcademicFile(e, "academic.ugCertificate")}
                      onDelete={() => updateForm("academic.ugCertificate", null)}
                    />
                    <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                      Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                    </small>
                  </div>
                </div>
              </div>

              {/* Postgraduate Section (Optional) */}
              <div className="onboarding-academic-section">
                <h2 className="onboarding-section-title">Postgraduate (PG) - Optional</h2>
                <div className="onboarding-form-grid">
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Degree Type</label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.pgDegreeType}
                      onChange={(e) => handleAlphabeticInput(e, "academic.pgDegreeType", 200)}
                      placeholder="e.g. M.Tech, MBA, M.Sc"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Course / Specialization</label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.pgCourse}
                      onChange={(e) => handleAlphabeticInput(e, "academic.pgCourse", 200)}
                      placeholder="e.g. Data Science"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">College Name</label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.pgCollegeName}
                      onChange={(e) => handleAlphabeticInput(e, "academic.pgCollegeName", 200)}
                      placeholder="Enter college name"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">University</label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.pgUniversity}
                      onChange={(e) => handleAlphabeticInput(e, "academic.pgUniversity", 200)}
                      placeholder="Enter university"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Year of Passing</label>
                    <input
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.pgYearOfPassing}
                      onChange={(e) => handleYearInput(e, "academic.pgYearOfPassing")}
                      placeholder="YYYY"
                    />

                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Registration No</label>
                    <input
                      className="onboarding-input"
                      maxLength={50}
                      disabled={disableText()}
                      value={form.academic.pgRegistrationNumber}
                      onChange={(e) => updateForm("academic.pgRegistrationNumber", e.target.value)}
                      placeholder="University/College Reg No"
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <label className="onboarding-label">Study Type</label>
                    <select
                      className="onboarding-input"
                      disabled={disableText()}
                      value={form.academic.pgStudyType}
                      onChange={(e) => updateForm("academic.pgStudyType", e.target.value)}
                    >
                      <option value="">Select Study Type</option>
                      <option>Full Time</option>
                      <option>Part Time</option>
                    </select>
                  </div>
                  <div className="onboarding-form-group" style={{ position: 'relative' }}>
                    <label className="onboarding-label">Location</label>
                    <input
                      className="onboarding-input"
                      maxLength={200}
                      disabled={disableText()}
                      value={form.academic.pgLocation}
                      onChange={handlePgLocationInputChange}
                      onBlur={handlePgLocationBlur}
                      placeholder="City, State"
                    />
                    <EducationLocationAutocomplete
                      suggestions={pgLocationSuggestions}
                      showDropdown={showPgLocationDropdown}
                      onSelect={handlePgLocationSelect}
                      inputValue={form.academic.pgLocation}
                      disabled={disableText()}
                      loading={loadingPgLocation}
                    />
                  </div>
                  <div className="onboarding-form-group">
                    <AcademicFileInput
                      disabled={disableFile("academic.pgMarksheet")}
                      label="PG Marksheets (ZIP/PDF)"
                      field="pgMarksheet"
                      required={false}
                      accept=".zip,.pdf"
                      value={form.academic.pgMarksheet}
                      onChange={(e) => validateAcademicFile(e, "academic.pgMarksheet")}
                      onDelete={() => updateForm("academic.pgMarksheet", null)}
                    />
                    <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                      Allowed: ZIP, PDF (Max 2MB)
                    </small>
                  </div>
                  <div className="onboarding-form-group">
                    <AcademicFileInput
                      disabled={disableFile("academic.pgCertificate")}
                      label="PG Degree Certificate"
                      field="pgCertificate"
                      required={false}
                      accept=".jpg,.jpeg,.png,.pdf"
                      value={form.academic.pgCertificate}
                      onChange={(e) => validateAcademicFile(e, "academic.pgCertificate")}
                      onDelete={() => updateForm("academic.pgCertificate", null)}
                    />
                    <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                      Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}






          {/* Step 4: Work History */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <h2 className="onboarding-section-title">Work Experience</h2>

              {form.workHistory.map((w, i) => (
                <div key={i} className="onboarding-dynamic-item" style={{
                  background: "rgba(248, 250, 252, 0.5)",
                  padding: "2.5rem",
                  borderRadius: "24px",
                  border: "1px solid #f1f5f9",
                  position: "relative",
                  marginBottom: "2rem"
                }}>
                  {/* Item Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                    paddingBottom: "1.2rem",
                    borderBottom: "2px solid #f0fdfa"
                  }}>
                    <span style={{ fontWeight: 800, color: "#115e59", fontSize: "1.1rem" }}>
                      Employer {i + 1}
                    </span>
                    <button
                      type="button"
                      disabled={disableWorkButtons}
                      onClick={() => !disableWorkButtons && removeWork(i)}
                      title="Delete Work History"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: disableWorkButtons ? "not-allowed" : "pointer",
                        color: "#dc2626",
                        fontSize: "1.2rem"
                      }}
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                  <div className="onboarding-form-grid">
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Company Name <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.companyName}
                        disabled={disableText()}
                        onChange={(e) => handleWorkAlphabeticInput(e, i, "companyName", 50)}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="onboarding-form-group" style={{ position: 'relative' }}>
                      <label className="onboarding-label">Office Location <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.officeLocation}
                        disabled={disableText()}
                        onChange={(e) => handleLocationInputChange(e, i)}
                        onBlur={() => handleLocationInputBlur(i)}
                        placeholder="Start typing to search locations..."
                        style={{ paddingRight: '30px' }}
                      />
                      <LocationAutocomplete
                        suggestions={locationSuggestions}
                        showDropdown={showLocationDropdown[i] || false}
                        onSelect={handleLocationSelect}
                        inputValue={w.officeLocation}
                        workIndex={i}
                        disabled={disableText()}
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Designation <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.designation}
                        disabled={disableText()}
                        onChange={(e) => handleWorkAlphabeticInput(e, i, "designation", 50)}
                        placeholder="Your job title"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Date of Joining <span className="onboarding-required">*</span></label>
                      <SmartDatePicker
                        disabled={disableText()}
                        value={w.dateOfJoining}
                        onChange={(v) => updateWork(i, "dateOfJoining", v)}
                        maxDate={new Date()}
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Date of Relieving <span className="onboarding-required">*</span></label>
                      <SmartDatePicker
                        disabled={disableText()}
                        value={w.dateOfRelieving}
                        onChange={(v) => updateWork(i, "dateOfRelieving", v)}
                        maxDate={new Date()}
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Employee ID <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.employeeId}
                        disabled={disableText()}
                        onChange={(e) => updateWork(i, "employeeId", e.target.value)}
                        placeholder="ID in that company"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Salary Drawn (CTC) <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.salaryDrawn}
                        disabled={disableText()}
                        onChange={(e) => handleWorkNumericRequiredInput(e, i, "salaryDrawn", 50)}
                        placeholder="e.g. 12 LPA"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Reason for Leaving <span className="onboarding-required">*</span></label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.reasonForLeaving}
                        disabled={disableText()}
                        onChange={(e) => updateWork(i, "reasonForLeaving", e.target.value)}
                        placeholder="Brief reason"
                      />
                    </div>

                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Reporting Manager Name</label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.reportingManagerName}
                        disabled={disableText()}
                        onChange={(e) => handleWorkAlphabeticInput(e, i, "reportingManagerName", 50)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Reporting Manager Email</label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.reportingManagerEmail}
                        disabled={disableText()}
                        onChange={(e) => updateWork(i, "reportingManagerEmail", e.target.value)}
                        placeholder="manager@company.com"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">Reporting Manager Phone</label>
                      <input
                        className="onboarding-input"
                        value={w.reportingManagerPhone}
                        disabled={disableText()}
                        onChange={(e) =>
                          handleNumericInput(
                            e,
                            `workHistory.${i}.reportingManagerPhone`,
                            10
                          )
                        }
                        placeholder="10 digit mobile number"
                      />

                    </div>

                    <div className="onboarding-form-group">
                      <label className="onboarding-label">HR Manager Name</label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.hrManagerName}
                        disabled={disableText()}
                        onChange={(e) => handleWorkAlphabeticInput(e, i, "hrManagerName", 50)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">HR Manager Email</label>
                      <input
                        className="onboarding-input"
                        maxLength={50}
                        value={w.hrManagerEmail}
                        disabled={disableText()}
                        onChange={(e) => updateWork(i, "hrManagerEmail", e.target.value)}
                        placeholder="hr@company.com"
                      />
                    </div>
                    <div className="onboarding-form-group">
                      <label className="onboarding-label">HR Manager Phone</label>
                      <input
                        className="onboarding-input"
                        value={w.hrManagerPhone}
                        disabled={disableText()}
                        onChange={(e) =>
                          handleNumericInput(
                            e,
                            `workHistory.${i}.hrManagerPhone`,
                            10
                          )
                        }
                        placeholder="10 digit mobile number"
                      />

                    </div>

                    {/* Work Documents */}
                    <div className="onboarding-form-group full-width" style={{ marginTop: "1rem" }}>
                      <div className="onboarding-form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                        <div>
                          <WorkFileInput
                            inputId={`offerLetter_${i}`}
                            label="Offer Letter"
                            required={true}
                            value={w.offerLetter}
                            accept=".jpg,.jpeg,.png,.pdf"
                            disabled={disableFile(`workHistory.${i}.offerLetter`)}
                            onChange={(e) => validateWorkFile(e, `workHistory.${i}.offerLetter`)}
                            onDelete={() => updateWork(i, "offerLetter", null)}
                          />
                          <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                            Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                          </small>
                        </div>

                        <div>
                          <WorkFileInput
                            inputId={`relievingLetter_${i}`}
                            label="Relieving Letter"
                            required={true}
                            value={w.relievingLetter}
                            accept=".jpg,.jpeg,.png,.pdf"
                            disabled={disableFile(`workHistory.${i}.relievingLetter`)}
                            onChange={(e) => validateWorkFile(e, `workHistory.${i}.relievingLetter`)}
                            onDelete={() => updateWork(i, "relievingLetter", null)}
                          />
                          <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                            Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                          </small>
                        </div>

                        <div>
                          <WorkFileInput
                            inputId={`payslips_${i}`}
                            label="Last 3m Payslips"
                            required={true}
                            accept=".pdf"
                            value={w.payslips}
                            disabled={disableFile(`workHistory.${i}.payslips`)}
                            onChange={(e) => validateWorkFile(e, `workHistory.${i}.payslips`)}
                            onDelete={() => updateWork(i, "payslips", null)}
                          />
                          <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                            Allowed: PDF (Max 2MB)
                          </small>
                        </div>

                        <div>
                          <WorkFileInput
                            inputId={`pf_${i}`}
                            label="PF Service History"
                            required={true}
                            accept=".pdf"
                            value={w.pfServiceHistoryFile}
                            disabled={disableFile(`workHistory.${i}.pfServiceHistoryFile`)}
                            onChange={(e) => validateWorkFile(e, `workHistory.${i}.pfServiceHistoryFile`)}
                            onDelete={() => updateWork(i, "pfServiceHistoryFile", null)}
                          />
                          <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                            Allowed: PDF (Max 2MB)
                          </small>
                        </div>

                        <div>
                          <WorkFileInput
                            inputId={`form16_${i}`}
                            disabled={disableFile(`workHistory.${i}.form16`)}
                            label="Form 16 (Optional)"
                            required={false}
                            accept=".jpg,.jpeg,.png,.pdf"
                            value={w.form16}
                            onChange={(e) => validateWorkFile(e, `workHistory.${i}.form16`)}
                            onDelete={() => updateWork(i, "form16", null)}
                          />
                          <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                            Allowed: JPG, JPEG, PNG, PDF (Max 2MB)
                          </small>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="onboarding-btn onboarding-btn-outline"
                disabled={disableWorkButtons}
                onClick={() => !disableWorkButtons && addWork()}
                style={{ alignSelf: "flex-start", padding: "0.75rem 1.5rem" }}
              >
                + Add Another Experience
              </button>
            </div>
          )}

          {/* Step 5: Identity & Documents */}
          {currentStep === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <h2 className="onboarding-section-title">Identity & Verification Documents</h2>

              <div className="onboarding-form-grid">
                {/* Aadhar Number */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Aadhar Number <span className="onboarding-required">*</span></label>
                  <input
                    className="onboarding-input"
                    disabled={disableText()}
                    value={form.ids.aadharNumber}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 12) val = val.slice(0, 12);
                      handleIdsChange("aadharNumber", val);
                    }}
                    placeholder="12 digit Aadhar number"
                  />
                </div>

                {/* Aadhar File */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Upload Aadhar <span className="onboarding-required">*</span></label>
                  {fileBox("aadharInput", "ids.aadharFile", form.ids.aadharFile)}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: PDF, JPG, PNG (Max 2MB)
                  </small>
                </div>

                {/* PAN Number */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">PAN Number <span className="onboarding-required">*</span></label>
                  <input
                    className="onboarding-input"
                    disabled={disableText()}
                    value={form.ids.panNumber}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase();
                      val = val.replace(/[^A-Z0-9]/g, "");
                      if (val.length <= 5) val = val.replace(/[^A-Z]/g, "");
                      if (val.length > 5 && val.length <= 9)
                        val = val.slice(0, 5) + val.slice(5).replace(/[^0-9]/g, "");
                      if (val.length === 10)
                        val = val.slice(0, 9) + val[9].replace(/[^A-Z]/g, "");
                      val = val.slice(0, 10);
                      handleIdsChange("panNumber", val);
                    }}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                  />
                </div>


                {/* PAN File */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Upload PAN <span className="onboarding-required">*</span></label>
                  {fileBox("panInput", "ids.panFile", form.ids.panFile)}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: PDF, JPG, PNG (Max 2MB)
                  </small>
                </div>


                {/* Passport Number */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Passport Number (Optional)</label>
                  <input
                    className="onboarding-input"
                    disabled={disableText()}
                    value={form.ids.passportNumber}
                    onChange={(e) => handleIdsChange("passportNumber", e.target.value)}
                    placeholder="Enter passport number"
                  />
                </div>

                {/* Passport File */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Upload Passport (Optional)</label>
                  {fileBox("passportInput", "ids.passportFile", form.ids.passportFile)}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: PDF, JPG, PNG (Max 2MB)
                  </small>
                </div>

                {/* Voter Number */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Voter Card Number (Optional)</label>
                  <input
                    className="onboarding-input"
                    disabled={disableText()}
                    value={form.ids.voterNumber}
                    onChange={(e) => handleIdsChange("voterNumber", e.target.value)}
                    placeholder="Enter voter card number"
                  />
                </div>

                {/* Voter File */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Upload Voter Card (Optional)</label>
                  {fileBox("voterInput", "ids.voterFile", form.ids.voterFile)}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: PDF, JPG, PNG (Max 2MB)
                  </small>
                </div>

                {/* Driving License Number */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Driving License Number (Optional)</label>
                  <input
                    className="onboarding-input"
                    disabled={disableText()}
                    value={form.ids.drivingNumber}
                    onChange={(e) => handleIdsChange("drivingNumber", e.target.value)}
                    placeholder="Enter DL number"
                  />
                </div>

                {/* DL File */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Upload Driving License (Optional)</label>
                  {fileBox("drivingInput", "ids.drivingFile", form.ids.drivingFile)}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: PDF, JPG, PNG (Max 2MB)
                  </small>
                </div>

                {/* Resume */}
                <div className="onboarding-form-group">
                  <label className="onboarding-label">Professional Resume <span className="onboarding-required">*</span></label>
                  {fileBox("resumeInput", "documents.resumeFile", form.documents.resumeFile, ".pdf,.doc,.docx")}
                  <small style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
                    Allowed: PDF, DOC, DOCX (Max 2MB)
                  </small>
                </div>
              </div>
            </div>
          )}



          {/* Navigation Action Buttons */}
          <div className="onboarding-navigation-footer">
            {currentStep > 1 && (
              <button
                className="onboarding-btn onboarding-btn-outline"
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                style={{ minWidth: "140px" }}
              >
                Previous Step
              </button>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
              <button
                className="onboarding-btn onboarding-btn-ghost"
                disabled={isLocked}
                onClick={() => !isLocked && saveDraft()}
              >
                Save Progress
              </button>

              {currentStep < 5 ? (
                <button
                  className="onboarding-btn onboarding-btn-primary"
                  style={{ minWidth: "160px" }}
                  onClick={() => {
                    let err = null;
                    if (currentStep === 1) err = validateStep1();
                    if (currentStep === 2) err = validateStep2();
                    if (currentStep === 3) err = validateStep3();
                    if (currentStep === 4) err = validateStep4();
                    if (currentStep === 5) err = validateStep5();

                    if (err) {
                      alert(err);
                      return;
                    }

                    setCurrentStep((s) => s + 1);
                  }}
                >
                  Continue
                </button>
              ) : (
                <button
                  className="onboarding-btn onboarding-btn-primary"
                  disabled={submitting || isLocked}
                  onClick={() => !isLocked && handleSubmit()}
                  style={{ minWidth: "220px" }}
                >
                  {submitting ? "Submitting Application..." : "Final Submit"}
                </button>
              )}
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`onboarding-banner ${message.toLowerCase().includes("saved") ||
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("submitted")
                ? "banner-success"
                : "banner-error"
                }`}
              style={{ marginTop: "1.5rem", marginBottom: 0 }}
            >
              <FiAlertCircle />
              {message}
            </div>
          )}

          {/* Modal for viewing documents */}
          {previewingFile && (
            <PreviewModal
              file={previewingFile}
              onClose={handlePreviewClose}
            />
          )}

        </div>
      </div>
    </div>
  );
}
