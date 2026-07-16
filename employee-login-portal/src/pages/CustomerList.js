import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar.js';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import api from "../api";
import DatePicker, { registerLocale } from "react-datepicker";
import { FiUsers, FiPlus, FiDownload, FiEdit, FiSearch, FiEye, FiX } from 'react-icons/fi';
import "react-datepicker/dist/react-datepicker.css";
import enGB from 'date-fns/locale/en-GB';
import './Leave.css';
import './ContractManagement.css';

registerLocale('en-GB', enGB);

// --- START: Responsive Constants ---
const mobileBreakpoint = 768;
// Function to check if the current width is mobile size
const isMobile = (width) => width < mobileBreakpoint;
// --- END: Responsive Constants ---

// SmartDatePicker component matching onboarding/Leaves calendar
const SmartDatePicker = ({ selected, onChange, minDate, maxDate, dayClassName, disabled, selectsStart, selectsEnd, startDate, endDate, placeholderText, required }) => {
  const [open, setOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = useRef(null);

  // Auto-scroll to current year when year dropdown opens
  useEffect(() => {
    if (showYearDropdown && yearDropdownRef.current) {
      const activeYearElement = yearDropdownRef.current.querySelector('.dropdown-item.active');
      if (activeYearElement) {
        // Scroll the active year into view
        activeYearElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [showYearDropdown]);

  return (
    <DatePicker
      required={required}
      selected={selected}
      disabled={disabled}
      onChange={(date) => {
        onChange(date);
        setTimeout(() => setOpen(false), 20);
      }}
      onSelect={() => setOpen(false)}
      open={open}
      onInputClick={() => setOpen(true)}
      onClickOutside={() => setOpen(false)}
      dateFormat="dd-MM-yyyy"
      calendarClassName="no-gap-calendar"
      dayClassName={dayClassName}
      wrapperClassName="full-width-picker"
      minDate={minDate}
      maxDate={maxDate}
      selectsStart={selectsStart}
      selectsEnd={selectsEnd}
      startDate={startDate}
      endDate={endDate}
      strictParsing
      locale="en-GB"
      popperPlacement="top-start"
      portalId="root"
      placeholderText={placeholderText || "DD-MM-YYYY"}

      renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => {
        const months = [
          "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
          "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
        ];
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 101 }, (_, i) => currentYear - 75 + i);

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
              <div className="header-dropdown year-dropdown" ref={yearDropdownRef}>
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

const ModalForm = ({ onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [customerName, setCustomerName] = useState(initialData?.customerName || "");
  const [msaDoc, setMsaDoc] = useState(null);
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate) : null
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? new Date(initialData.endDate) : null
  );

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // ✅ SAME validation rule as backend
    if (file.type !== "application/pdf") {
      alert("Please choose PDF file only.");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMsaDoc(null);
      return;
    }

    setMsaDoc(file);
  };

  // Normalize date (remove time)
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Format date for UI/alerts → DD-MM-YYYY
  const formatDateDMY = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format for backend → YYYY-MM-DD (keep this)
  const formatDateYMD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [linkedSows, setLinkedSows] = useState([]);

  useEffect(() => {
    if (isEdit && initialData?.customerId) {
      const fetchLinkedSows = async () => {
        try {
          const token = sessionStorage.getItem("token");
          const { data } = await api.get(`/sows/customer/${initialData.customerId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setLinkedSows(data || []);
        } catch (err) {
          console.error("Failed to fetch linked SOWs:", err);
        }
      };
      fetchLinkedSows();
    }
  }, [isEdit, initialData]);



  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!customerName) {
      alert("Please enter Customer name.");
      return;
    }

    if (!isEdit && !msaDoc) {
      alert("Please upload the MSA document.");
      return;
    }

    if (!startDate) {
      alert("Please select Msa start date.");
      return;
    }

    if (!endDate) {
      alert("Please select Msa end date.");
      return;
    }

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    if (newEnd < newStart) {
      alert("End Date cannot be before Start Date.");
      return;
    }

    if (isEdit && linkedSows.length > 0) {
      const custStart = normalizeDate(startDate);
      const custEnd = normalizeDate(endDate);

      for (const sow of linkedSows) {
        const sowStart = normalizeDate(sow.sowStartDate);
        const sowEnd = normalizeDate(sow.sowEndDate);

        // ❌ Cannot move customer start AFTER any SOW start
        if (custStart > sowStart) {
          alert(
            `Cannot change Start Date to ${formatDateDMY(custStart)} because SOW "${sow.sowName}" starts on ${formatDateDMY(sowStart)}.`
          );
          return;
        }

        // ❌ Cannot move customer end BEFORE any SOW end
        if (custEnd < sowEnd) {
          alert(
            `Cannot change End Date to ${formatDateDMY(custEnd)} because SOW "${sow.sowName}" ends on ${formatDateDMY(sowEnd)}.`
          );
          return;
        }
      }
    }




    onSubmit({
      customerName,
      msaDoc,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.25)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}

        style={{
          backgroundColor: "white",
          borderRadius: 8,
          width: 400,
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontWeight: "normal", fontSize: 18 }}>
            {isEdit ? "Edit customer" : "Add new customer"}
          </h2>
          <button
            className="close-x-btn"
            onClick={onClose}
            style={{
              fontSize: 24,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#333",
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer Name */}

          <label style={{ fontWeight: "normal", marginBottom: 6, display: "block", color: '#1F2937' }}>
            Customer name <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value.replace(/\p{Extended_Pictographic}/gu, ''))}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              fontSize: 14,
              borderRadius: "12px",
              border: "2px solid #99f6e4",
              boxSizing: "border-box",
              outline: 'none',
            }}
          />

          {/* MSA Document */}
          <label style={{ fontWeight: "normal", marginBottom: 6, display: "block", color: '#1F2937' }}>
            Msa document {!isEdit && <span style={{ color: "red" }}>*</span>}
            {isEdit && <span style={{ fontSize: 12, color: '#64748b' }}> (optional)</span>}
          </label>

          {/* MSA Upload Box (Matching Reference Image) */}
          <div
            onClick={() => fileInputRef.current.click()}
            style={{
              border: '2px dashed #99f6e4',
              borderRadius: '12px',
              padding: '12px 20px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              marginTop: '5px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <span style={{ color: '#1e293b', fontSize: '16px' }}>
              {msaDoc ? msaDoc.name : (isEdit && initialData?.msaDocName ? initialData.msaDocName : "No file chosen")}
            </span>
          </div>


          {/* Start Date */}

          <label style={{ fontWeight: "normal", marginBottom: 6, display: "block", color: '#1F2937' }}>
            Msa start date <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ marginBottom: "20px" }}>
            <SmartDatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="DD-MM-YYYY"
            />
          </div>

          {/* End Date */}

          <label style={{ fontWeight: "normal", marginBottom: 6, display: "block", color: '#1F2937' }}>
            Msa end date <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ marginBottom: "20px" }}>
            <SmartDatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="DD-MM-YYYY"
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 15 }}>
            <button
              type="submit"
              style={{
                flex: 1,
                background: "#00B3A4",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: "12px",
                fontWeight: "normal",
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 179, 164, 0.4)",
              }}
            >
              {isEdit ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                border: "none",
                padding: "12px",
                borderRadius: "12px",
                fontWeight: "normal",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const handleDownloadFile = async (customerId, filename) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.get(`/customers/${customerId}/download`, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error downloading the file:", error);
    alert("An error occurred while downloading the file.");
  }
};

const PreviewModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
        padding: "20px",
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
            Preview: {fileName}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              borderRadius: "50%",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <FiX size={24} />
          </button>
        </div>
        <div style={{ flex: 1, backgroundColor: "#f1f5f9", overflow: "hidden" }}>
          <iframe
            src={fileUrl}
            title="File Preview"
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", backgroundColor: "#f8fafc" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)",
              color: "white",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(94, 234, 212, 0.3)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function CustomerList() {

  // --- NEW: State for screen width ---
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobileView = isMobile(windowWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const token = sessionStorage.getItem("token");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [previewData, setPreviewData] = useState({ isOpen: false, url: "", name: "" });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    const token = sessionStorage.getItem("token");
    api
      .get("/customers", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  };

  const handleFormSubmit = async ({ customerName, msaDoc, startDate, endDate }) => {
    const formData = new FormData();
    formData.append("customerName", customerName);
    if (msaDoc) {
      formData.append("msaDoc", msaDoc);
    }
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    try {
      const token = sessionStorage.getItem("token");
      if (isEditMode && selectedCustomer) {
        // Update existing customer
        await api.put(`/customers/${selectedCustomer.customerId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Add new customer
        await api.post("/customers", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      }
      setShowModal(false);
      setIsEditMode(false);
      setSelectedCustomer(null);
      fetchCustomers();
      alert(`Customer ${isEditMode ? 'updated' : 'added'} successfully.`);
    } catch (error) {
      console.error("Error saving customer:", error);
      if (error.response && error.response.data) {
        alert(error.response.data); // Show backend error message (e.g., duplicate name)
      } else {
        alert(`Failed to ${isEditMode ? 'update' : 'add'} customer.`);
      }
    }
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setSelectedCustomer(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const filteredCustomers = customers.filter((customer) => {
    const lower = searchTerm.toLowerCase();
    const cid = `CID${customer.tenantCustomerId || customer.customerId}`.toLowerCase();
    return (
      cid.includes(lower) ||
      (customer.customerName || "").toLowerCase().includes(lower) ||
      (customer.msaDocName || "").toLowerCase().includes(lower) ||
      (customer.startDate || "").toString().toLowerCase().includes(lower) ||
      (customer.endDate || "").toString().toLowerCase().includes(lower)
    );
  });

  const handlePreview = async (customerId, filename) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await api.get(`/customers/${customerId}/download`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewData({ isOpen: true, url, name: filename });
    } catch (error) {
      console.error("Error previewing file:", error);
      alert("Failed to load preview.");
    }
  };

  const closePreview = () => {
    if (previewData.url) {
      window.URL.revokeObjectURL(previewData.url);
    }
    setPreviewData({ isOpen: false, url: "", name: "" });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <Sidebar>
      <div className="contract-management-page" style={{
        padding: isMobileView ? "10px" : "24px",
        background: 'linear-gradient(to bottom, #ffffff 0%, #f0fdfd 100%)',
        minHeight: '100vh',
      }}>
        <div style={{
          padding: isMobileView ? "16px 0" : '24px 0',
        }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobileView ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobileView ? "stretch" : "center",
              marginBottom: "24px",
              gap: isMobileView ? "16px" : "0",
            }}
          >
            <div>
              <h2 className="contract-management-title" style={{
                color: '#1F2937',
                fontSize: '30px',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobileView ? 'center' : 'flex-start',
                gap: '12px',
                fontFamily: "'Inter', sans-serif",
                margin: 0,
              }}>
                Customers List
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                color: '#00B3A4',
                fontSize: isMobileView ? '0.75rem' : '0.9rem',
                fontWeight: 'normal',
                textAlign: isMobileView ? 'center' : 'left',
              }}>
                Manage client records and contact information
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              width: isMobileView ? "100%" : "auto",
              flexDirection: isMobileView ? "column" : "row",
              alignItems: 'center'
            }}>
              <div style={{
                position: 'relative',
                width: isMobileView ? "100%" : "230px"
              }}>

                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: isMobileView ? "14px 20px 14px 40px" : "12px 24px 12px 40px",
                    width: "100%",
                    borderRadius: "12px",
                    border: "2px solid #99f6e4",
                    fontSize: isMobileView ? "14px" : "14px",
                    fontWeight: "600",
                    color: "#14b8a6",
                    outline: "none",
                    transition: "all 0.3s ease",
                    background: "#ffffff",
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#2dd4bf"}
                  onBlur={(e) => e.target.style.borderColor = "#99f6e4"}
                />
              </div>

              <button
                onClick={handleAddClick}
                style={{
                  padding: isMobileView ? "14px 20px" : "12px 24px",
                  cursor: "pointer",
                  background: "#00B3A4",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "normal",
                  fontSize: isMobileView ? "14px" : "14px",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 179, 164, 0.4)',
                  transition: 'all 0.3s ease',
                  minHeight: isMobileView ? "50px" : "auto",
                  width: isMobileView ? "100%" : "230px", // Same width as search input
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 179, 164, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 179, 164, 0.4)';
                }}
              >
                Add new customer
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: "calc(100vh - 250px)",
              overflowY: "scroll",
              borderRadius: 4,
              backgroundColor: "white",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <table
              cellPadding="10"
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 8px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', borderRadius: '12px 0 0 12px', textAlign: 'center', fontWeight: 'normal' }}>Customer id</th>
                  <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Customer name</th>
                  <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Msa document</th>
                  <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Start date</th>
                  <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>End date</th>
                  <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', borderRadius: '0 12px 12px 0', textAlign: 'center', fontWeight: 'normal' }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers
                  .slice()
                  .sort((a, b) => b.customerId - a.customerId)
                  .map((customer) => (
                    <tr key={customer.customerId} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <td style={{ backgroundColor: "#f0fdfd", padding: '16px', borderRadius: '12px 0 0 12px', fontWeight: 'bold', color: '#14b8a6', textAlign: 'center' }}>{`CID${customer.tenantCustomerId || customer.customerId}`}</td>
                      <td style={{ backgroundColor: "#f0fdfd", padding: '16px', textAlign: 'center' }}>{customer.customerName}</td>
                      <td style={{ backgroundColor: "#f0fdfd", padding: '16px', textAlign: 'center' }}>
                        {customer.msaDocName ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            <button
                              onClick={() => handlePreview(customer.customerId, customer.msaDocName)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                background: "#f0fdfa",
                                color: "#0d9488",
                                fontSize: "12px",
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
                              onClick={() => handleDownloadFile(customer.customerId, customer.msaDocName)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)",
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: "600",
                                border: "none",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(94, 234, 212, 0.3)",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(94, 234, 212, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(94, 234, 212, 0.3)";
                              }}
                            >
                              Download
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>No document</span>
                            <button
                              onClick={() => handleEditClick(customer)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                background: "#f0fdfa",
                                color: "#0d9488",
                                fontSize: "11px",
                                fontWeight: "normal",
                                border: "1px solid #99f6e4",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#ccfbf1"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#f0fdfa"; }}
                            >
                              Upload
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ backgroundColor: "#f0fdfd", padding: '16px', textAlign: 'center' }}>
                        {formatDate(customer.startDate)}
                      </td>
                      <td style={{ backgroundColor: "#f0fdfd", padding: '16px', textAlign: 'center' }}>
                        {formatDate(customer.endDate)}
                      </td>
                      <td style={{ backgroundColor: "#f0fdfd", padding: '16px', borderRadius: '0 12px 12px 0', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEditClick(customer)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            background: "#00B3A4",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: "normal",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <ModalForm
            onClose={() => {
              setShowModal(false);
              setIsEditMode(false);
              setSelectedCustomer(null);
            }}
            onSubmit={handleFormSubmit}
            initialData={selectedCustomer}
            isEdit={isEditMode}
          />
        )}

        <PreviewModal
          isOpen={previewData.isOpen}
          onClose={closePreview}
          fileUrl={previewData.url}
          fileName={previewData.name}
        />
      </div>
    </Sidebar>
  );

}

export default CustomerList;
