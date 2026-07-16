import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import Sidebar from "./Sidebar.js";
import api from "../api";
import DatePicker, { registerLocale } from "react-datepicker";
import { FiUsers, FiPlus, FiDownload, FiFileText, FiEdit, FiEye, FiX } from 'react-icons/fi';
import "react-datepicker/dist/react-datepicker.css";
import enGB from 'date-fns/locale/en-GB';
import './Leave.css';
import './ContractManagement.css';

registerLocale('en-GB', enGB);
const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  margin: "5px 0 15px",
  borderRadius: "12px",
  border: "2px solid #99f6e4",
  outline: 'none',
  fontSize: '14px',
};

const mobileBreakpoint = 768;
const isMobile = (width) => width < mobileBreakpoint;

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
      placeholderText={placeholderText || "DD-MM-YYYY"}
      required={required}

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

const PreviewModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  if (!isOpen) return null;

  const COLORS = {
    primary: '#14b8a6',
    bgGradient: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
    shadowTeal: 'rgba(94, 234, 212, 0.3)',
  };

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
              background: COLORS.bgGradient,
              color: "white",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: `0 2px 4px ${COLORS.shadowTeal}`,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div >
  );
};

function SowPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCustomerStartDate, setSelectedCustomerStartDate] = useState("");
  const [selectedCustomerEndDate, setSelectedCustomerEndDate] = useState("");
  const [linkedProjects, setLinkedProjects] = useState([]);
  const [sows, setSows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSow, setSelectedSow] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobileView = isMobile(windowWidth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState({ isOpen: false, url: "", name: "" });

  const [formData, setFormData] = useState({
    sowName: "",
    sowStartDate: null,
    sowEndDate: null,
    totalEffort: "",
    totalCost: "",
    sowDoc: null,
  });
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDateDMY = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Initialize form with selected SOW data when editing
  useEffect(() => {
    if (isEditMode && selectedSow) {
      setFormData({
        sowName: selectedSow.sowName || "",
        sowStartDate: selectedSow.sowStartDate ? new Date(selectedSow.sowStartDate) : null,
        sowEndDate: selectedSow.sowEndDate ? new Date(selectedSow.sowEndDate) : null,
        totalEffort: selectedSow.totalEffort || "",
        totalCost: selectedSow.totalCost || "",
        sowDoc: null,
      });

      // Fetch linked projects for validation
      const fetchLinkedProjects = async () => {
        try {
          const token = sessionStorage.getItem("token");
          const { data } = await api.get(`/projects/sow/${selectedSow.sowId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setLinkedProjects(data || []);
        } catch (err) {
          console.error("Failed to fetch linked projects:", err);
          setLinkedProjects([]);
        }
      };
      fetchLinkedProjects();
    }
  }, [isEditMode, selectedSow]);

  // Watch window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const { data } = await api.get("/customers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomers(data);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch SOWs when customer changes
  useEffect(() => {
    const fetchSows = async () => {
      if (!selectedCustomerId) return;
      try {
        const token = sessionStorage.getItem("token");
        const { data } = await api.get(`/sows/customer/${selectedCustomerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSows(data);
      } catch (err) {
        console.error("Failed to fetch SOWs:", err);
      }
    };
    fetchSows();
  }, [selectedCustomerId]);

  const handleCustomerChange = (e) => {
    const selectedId = e.target.value;
    setSelectedCustomerId(selectedId);
    const customer = customers.find((c) => c.customerId.toString() === selectedId);
    if (customer) {
      setSelectedCustomerName(customer.customerName || "");
      setSelectedCustomerStartDate(customer.startDate || "");
      setSelectedCustomerEndDate(customer.endDate || "");
    } else {
      setSelectedCustomerName("");
      setSelectedCustomerStartDate("");
      setSelectedCustomerEndDate("");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setSelectedSow(null);
    setFormData({
      sowName: "",
      sowStartDate: null,
      sowEndDate: null,
      totalEffort: "",
      totalCost: "",
      sowDoc: null,
    });
  };
  const handleSubmitSow = async (event) => {
    event.preventDefault();

    // 🚫 Prevent double / triple submit
    if (isSubmitting) return;
    setIsSubmitting(true); // 🔒 lock

    try {
      const { sowName, sowStartDate, sowEndDate, totalEffort, totalCost, sowDoc } = formData;

      if (!sowName || !sowName.trim()) {
        alert("Please enter Sow/PO name.");
        setIsSubmitting(false);
        return;
      }

      if (!isEditMode && !sowDoc) {
        alert("Please upload the Sow/PO document.");
        setIsSubmitting(false);
        return;
      }

      if (!sowStartDate) {
        alert("Please select Sow/PO start date.");
        setIsSubmitting(false);
        return;
      }

      if (!sowEndDate) {
        alert("Please select Sow/PO end date.");
        setIsSubmitting(false);
        return;
      }

      if (!totalEffort) {
        alert("Please enter Total effort.");
        setIsSubmitting(false);
        return;
      }

      if (!totalCost) {
        alert("Please enter Total cost.");
        setIsSubmitting(false);
        return;
      }

      if (sowStartDate > sowEndDate) {
        alert("SOW Start Date cannot be after the End Date.");
        return;
      }

      const newSowStart = new Date(sowStartDate);
      const newSowEnd = new Date(sowEndDate);

      // --- Customer validation ---
      if (selectedCustomerStartDate && selectedCustomerEndDate) {
        const custStart = normalizeDate(selectedCustomerStartDate);
        const custEnd = normalizeDate(selectedCustomerEndDate);

        if (normalizeDate(newSowStart) < custStart) {
          alert(`SOW Start Date cannot be before Customer Start Date.`);
          return;
        }

        if (normalizeDate(newSowEnd) > custEnd) {
          alert(`SOW End Date cannot be after Customer End Date.`);
          return;
        }
      }

      // --- Child project validation ---
      if (isEditMode && linkedProjects.length > 0) {
        for (const project of linkedProjects) {
          if (newSowStart > new Date(project.projectStartDate)) {
            alert(`Cannot change SOW Start Date due to linked project.`);
            return;
          }
          if (newSowEnd < new Date(project.projectEndDate)) {
            alert(`Cannot change SOW End Date due to linked project.`);
            return;
          }
        }
      }

      const formatLocalDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      const payload = new FormData();
      payload.append("sowName", formData.sowName.trim());
      payload.append("sowStartDate", formatLocalDate(sowStartDate));
      payload.append("sowEndDate", formatLocalDate(sowEndDate));
      payload.append("totalEffort", formData.totalEffort);
      payload.append("totalCost", formData.totalCost);
      payload.append("customerId", selectedCustomerId);

      if (formData.sowDoc) {
        payload.append("sowDoc", formData.sowDoc);
      }

      const token = sessionStorage.getItem("token");

      if (isEditMode && selectedSow) {
        const { data } = await api.put(`/sows/${selectedSow.sowId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setSows((prev) =>
          prev.map((s) => (s.sowId === selectedSow.sowId ? data : s))
        );
      } else {
        const { data } = await api.post("/sows", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setSows((prev) => [...prev, data]);
      }

      handleCloseModal();
      alert(`SOW ${isEditMode ? 'updated' : 'added'} successfully.`);
    } catch (err) {
      console.error("SOW submit error:", err);
      if (err.response && err.response.data) {
        alert(err.response.data); // Show backend error message (e.g., duplicate sow name)
      } else {
        alert("SOW submission failed.");
      }
    } finally {
      setIsSubmitting(false); // 🔓 unlock
    }
  };


  const handleOpenModal = () => {
    if (!selectedCustomerId) {
      alert("Please select a customer before adding SOWs.");
      return;
    }
    setIsEditMode(false);
    setSelectedSow(null);
    setShowModal(true);
  };

  const handleEditClick = (sow) => {
    setSelectedSow(sow);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDownloadFile = async (sowId, filename) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await api.get(`/sows/${sowId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
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

  const handlePreview = async (sowId, filename) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await api.get(`/sows/${sowId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
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
      <style>{`
@media (max-width: ${mobileBreakpoint - 1}px) {
.sow-modal-content {
width: 95% !important;
padding: 15px !important;
}
.sow-form-row {
flex-direction: column;
gap: 0px !important;
}
}
`}</style>

      <div
        className="contract-management-page"
        style={{
          padding: "24px",
          background: 'linear-gradient(to bottom, #ffffff 0%, #f0fdfd 100%)',
          minHeight: "100vh",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{
          padding: '24px 0',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobileView ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobileView ? 'stretch' : 'flex-end',
            marginBottom: '24px',
            gap: '16px'
          }}>
            <div>
              <h3 className="contract-management-title" style={{
                color: '#1F2937',
                fontSize: '30px',
                fontWeight: 'normal',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                SOW/PO Management
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                color: '#00B3A4',
                fontSize: isMobileView ? '0.75rem' : '0.9rem',
                fontWeight: 'normal',
              }}>
                Track and organize statement of work agreements
              </p>
            </div>
            {selectedCustomerId && (
              <span style={{ fontWeight: "normal", fontSize: "14px", color: '#64748b', marginLeft: 'auto' }}>
                {selectedCustomerName} {` (CID${customers.find(c => c.customerId.toString() === selectedCustomerId.toString())?.tenantCustomerId || selectedCustomerId})`}
              </span>
            )}
          </div>

          {/* Customer Selector */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              margin: isMobileView ? "10px 0" : "-20px 0",
              flexDirection: isMobileView ? "column" : "row",
              alignItems: isMobileView ? "stretch" : "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexDirection: isMobileView ? "column" : "row",
                alignItems: isMobileView ? "stretch" : "center",
                width: isMobileView ? "100%" : "auto",
              }}
            >
              <label style={{ fontWeight: "normal", whiteSpace: "nowrap", color: '#1F2937', fontSize: isMobileView ? '0.875rem' : '1rem' }}>
                Select customer:
              </label>
              <select
                value={selectedCustomerId || ""}
                onChange={handleCustomerChange}
                style={{
                  padding: isMobileView ? "14px 16px" : "4px 14px",
                  fontSize: isMobileView ? 16 : 14,
                  minHeight: isMobileView ? '50px' : 'auto',
                  borderRadius: isMobileView ? '16px' : '12px',
                  border: isMobileView ? '1.5px solid #cbd5e1' : '2px solid #99f6e4',
                  minWidth: isMobileView ? "100%" : "250px",
                  backgroundColor: isMobileView ? '#ffffff' : "#fff",
                  color: '#1e293b',
                  fontWeight: isMobileView ? '500' : '400',
                  lineHeight: '1.5',
                  appearance: "none",
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2314b8a6' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  backgroundSize: "18px",
                  cursor: "pointer",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="" disabled style={{ color: '#64748b' }}>Select a customer</option>
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId} style={{ color: '#1e293b' }}>
                    {c.customerName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenModal}
              style={{
                background: "#00B3A4",
                color: "white",
                padding: isMobileView ? "14px 20px" : "12px 24px",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                width: isMobileView ? "100%" : "auto",
                fontWeight: 'normal',
                fontSize: isMobileView ? '15px' : '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 179, 164, 0.4)',
                transition: 'all 0.3s ease',
                height: isMobileView ? 50 : 'auto',
              }}
            >
              Add New SOW/PO
            </button>
          </div>

          <div style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: isMobileView ? '1rem' : '1.17rem', color: '#115e59', fontWeight: '700' }}>SOWs/POs</h3>
            {sows.length === 0 ? (
              <p style={{ color: "#666", marginTop: 4, fontSize: isMobileView ? '0.875rem' : '1rem' }}>
                No SOWs/POs found for this customer.
              </p>
            ) : (
              <div
                style={{
                  maxHeight: isMobileView
                    ? "calc(100vh - 250px)"
                    : "calc(100vh - 300px)",
                  overflowY: "scroll",
                  borderRadius: '12px',
                  backgroundColor: "white",
                  scrollbarWidth: 'none',
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', borderRadius: '12px 0 0 12px', textAlign: 'center', fontWeight: 'normal' }}>Sow/PO id</th>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Sow/PO name</th>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Sow/PO document</th>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Start date</th>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>End date</th>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Total effort (pd)</th>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', textAlign: 'center', fontWeight: 'normal' }}>Total cost</th>
                      <th style={{ backgroundColor: "#629AF1", color: "white", padding: '16px', borderRadius: '0 12px 12px 0', textAlign: 'center', fontWeight: 'normal' }}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sows
                      .slice()
                      .sort((a, b) => b.sowId - a.sowId)
                      .map((sow) => (
                        <tr key={sow.sowId} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <td style={{ ...tdStyle, borderRadius: '12px 0 0 12px', fontWeight: 'bold', color: '#14b8a6' }}>SOW{sow.tenantSowId || sow.sowId}</td>
                          <td style={{ ...tdStyle }}>{sow.sowName}</td>
                          <td style={{ ...tdStyle }}>
                            {sow.sowDocName ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handlePreview(sow.sowId, sow.sowDocName)}
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
                                  onClick={() => handleDownloadFile(sow.sowId, sow.sowDocName)}
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
                              <span style={{ color: "#94a3b8" }}>No document</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle }}>{formatDate(sow.sowStartDate)}</td>
                          <td style={{ ...tdStyle }}>{formatDate(sow.sowEndDate)}</td>
                          <td style={{ ...tdStyle }}>{sow.totalEffort}</td>
                          <td style={{ ...tdStyle }}>{sow.totalCost}</td>
                          <td style={{ ...tdStyle, borderRadius: '0 12px 12px 0' }}>
                            <button
                              onClick={() => handleEditClick(sow)}
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
            )}
          </div>

          {/* === Modal for Adding New SOW === */}
          {showModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
            >
              <div
                className="sow-modal-content"
                style={{
                  backgroundColor: "#ffffff",
                  padding: "30px",
                  borderRadius: "20px",
                  width: "500px",
                  position: "relative",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #99f6e4',
                }}
              >
                <h3 style={{ marginBottom: "20px", color: '#1F2937', fontWeight: 'normal' }}>{isEditMode ? "Edit sow/po" : "Add new sow/po"}</h3>
                <form onSubmit={handleSubmitSow}>
                  <label style={{ color: '#1F2937', fontWeight: 'normal' }}>
                    Sow/PO name <span style={{ color: 'red' }}>*</span>
                  </label>

                  <input
                    type="text"
                    value={formData.sowName}
                    onChange={(e) =>
                      setFormData({ ...formData, sowName: e.target.value.replace(/\p{Extended_Pictographic}/gu, '') })
                    }

                    style={inputStyle}
                  />

                  <label style={{ color: '#1F2937', fontWeight: 'normal' }}>
                    Sow/PO document {!isEditMode && <span style={{ color: "red" }}>*</span>}
                    {isEditMode && <span style={{ fontSize: 12, color: '#64748b' }}> (optional)</span>}
                  </label>
                  {isEditMode && selectedSow?.sowDocName && !formData.sowDoc && (
                    <div style={{ marginBottom: 8, fontSize: 13, color: '#0f766e', fontWeight: '600' }}>
                      <FiDownload size={14} style={{ marginRight: 6 }} />
                      Existing: {selectedSow.sowDocName}
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];

                      if (!file) return;

                      // ✅ Allow only PDF
                      if (file.type !== "application/pdf") {
                        alert("Only PDF files are supported.");
                        e.target.value = ""; // reset file input
                        setFormData({ ...formData, sowDoc: null });
                        return;
                      }

                      setFormData({ ...formData, sowDoc: file });
                    }}

                    style={{
                      ...inputStyle,
                      padding: '8px',
                      border: '2px dashed #99f6e4',
                    }}
                  />


                  {/* 🗓️ React DatePicker Start Date */}
                  <label style={{ color: '#1F2937', fontWeight: 'normal' }}>
                    Sow/PO start date <span style={{ color: 'red' }}>*</span>
                  </label>

                  <div style={{ marginBottom: "15px" }}>
                    <SmartDatePicker
                      selected={formData.sowStartDate}
                      onChange={(date) => setFormData({ ...formData, sowStartDate: date })}
                      placeholderText="DD-MM-YYYY"
                      minDate={
                        selectedCustomerStartDate
                          ? new Date(selectedCustomerStartDate)
                          : null
                      }
                      maxDate={
                        selectedCustomerEndDate
                          ? new Date(selectedCustomerEndDate)
                          : null
                      }
                      selectsStart
                      startDate={formData.sowStartDate}
                      endDate={formData.sowEndDate}

                    />
                  </div>


                  {/* 🗓️ React DatePicker End Date */}
                  <label style={{ color: '#1F2937', fontWeight: 'normal' }}>
                    Sow/PO end date <span style={{ color: 'red' }}>*</span>
                  </label>

                  <div style={{ marginBottom: "15px" }}>
                    <SmartDatePicker
                      selected={formData.sowEndDate}
                      onChange={(date) => setFormData({ ...formData, sowEndDate: date })}
                      placeholderText="DD-MM-YYYY"
                      minDate={
                        selectedCustomerStartDate
                          ? new Date(selectedCustomerStartDate)
                          : null
                      }
                      maxDate={
                        selectedCustomerEndDate
                          ? new Date(selectedCustomerEndDate)
                          : null
                      }
                      selectsEnd
                      startDate={formData.sowStartDate}
                      endDate={formData.sowEndDate}

                    />
                  </div>


                  <div
                    className="sow-form-row"
                    style={{ display: "flex", gap: "20px" }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ color: '#1F2937', fontWeight: 'normal' }}>
                        Total effort (pd) <span style={{ color: 'red' }}>*</span>
                      </label>

                      <input
                        type="number"
                        value={formData.totalEffort}
                        onChange={(e) =>
                          setFormData({ ...formData, totalEffort: e.target.value })
                        }

                        min="1"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}><label style={{ color: '#1F2937', fontWeight: 'normal' }}>
                      Total cost <span style={{ color: 'red' }}>*</span>
                    </label>

                      <input
                        type="number"
                        value={formData.totalCost}
                        onChange={(e) =>
                          setFormData({ ...formData, totalCost: e.target.value })
                        }

                        min="0.01"
                        step="0.01"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", gap: '12px' }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: isSubmitting
                          ? "#94a3b8"
                          : "#00B3A4",
                        color: "white",
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: "12px",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        fontWeight: "normal",
                        boxShadow: "0 4px 12px rgba(0, 179, 164, 0.4)",
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting
                        ? isEditMode
                          ? "Updating..."
                          : "Submitting..."
                        : isEditMode
                          ? "Update"
                          : "Submit"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      style={{
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: "122px",
                        cursor: "pointer",
                        fontWeight: 'normal',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                <button
                  className="close-x-btn"
                  onClick={handleCloseModal}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "15px",
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    color: "black",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )
          }

          <PreviewModal
            isOpen={previewData.isOpen}
            onClose={closePreview}
            fileUrl={previewData.url}
            fileName={previewData.name}
          />
        </div >
      </div >
      <style>{`
.datePickerWrapper input {
width: 100%;
padding: 10px;
margin: 5px 0 15px;
border-radius: 12px;
border: 2px solid #99f6e4;
outline: none;
box-sizing: border-box;
font-family: 'Inter', sans-serif;
}
.datePickerWrapper input:focus {
border-color: #14b8a6;
}
`}</style>
    </Sidebar >
  );
}

const tdStyle = {
  padding: '16px',
  border: "none",
  backgroundColor: "#f0fdfd",
  textAlign: "center",
  color: '#475569',
  fontSize: '14px',
};

export default SowPage;

