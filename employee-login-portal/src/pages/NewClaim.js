import "./Newclaim.css";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactDOM from 'react-dom';
import Sidebar from './Sidebar.js';
import { getPropperDate, parseISTDateStringToDatePickerValue } from '../utils/DateUtils';
import Select from "react-select";
import SuccessModal from '../components/SuccessModal';
import ToastNotification from '../components/ToastNotification';


import api from "../api";
import {
  FiEdit3,
  FiTag,
  FiDollarSign,
  FiUploadCloud,
  FiPaperclip,
  FiCheckCircle,
  FiX,
  FiAlertCircle,
  FiFileText,
  FiCalendar,
  FiClipboard
} from "react-icons/fi";

function NewClaim({ onActionComplete }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const fileInputRef = useRef(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [originalDraftId, setOriginalDraftId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const employeeId = sessionStorage.getItem("employeeId");
  const employeeName = sessionStorage.getItem("employeeName");
  const [allowedCategories, setAllowedCategories] = useState([]);

  const wrapTextEveryNChars = (text, n = 20) => {
    if (!text) return [];
    return text.match(new RegExp(`.{1,${n}}`, "g")) || [];
  };

  useEffect(() => {
    api.get("/claims/categories", {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
    })
      .then(res => setAllowedCategories(res.data))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024;



  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);




  const getTodayDate = () => getPropperDate();

  const [claims, setClaims] = useState([{
    id: Date.now(),
    employeeId: sessionStorage.getItem("employeeId"),
    name: sessionStorage.getItem("employeeName"),
    expenseDescription: "",
    category: "",
    amount: "",
    expenseDate: getTodayDate(),
    receiptFile: null,
    receiptPreviewUrl: null
  }]);

  const [viewingIndex, setViewingIndex] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);


  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  // Top-right toast for draft save feedback
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
  const showToast = (msg, type = 'success') => setToast({ open: true, message: msg, type });
  const closeToast = () => setToast(t => ({ ...t, open: false }));
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i); // Only last 20 years for expenses

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const id = sessionStorage.getItem("employeeId") || "";
    const name = sessionStorage.getItem("employeeName") || "";
    const token = sessionStorage.getItem("token");
    setClaims(prev => prev.map(c => ({ ...c, employeeId: id, name })));

    // Fetch profile
    if (id) {
      api.get(`/profile/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          const data = res.data;
          if (data.name) {
            sessionStorage.setItem("employeeName", data.name);
          }
        })
        .catch((err) => console.error("Profile fetch failed:", err));
    }

    // Check for groupId first, then draftId (for backward compatibility or single drafts)
    const groupId = location.state?.groupId;
    const draftId = location.state?.draftId;

    if (groupId) {
      // Fetch all drafts for this group
      api.get(`/claims/draft/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          const drafts = res.data;
          if (drafts && drafts.length > 0) {
            const loadedClaims = await Promise.all(drafts.map(async (draft) => {
              let receiptFile = null;
              let receiptPreviewUrl = null;

              if (draft.receiptName) {
                try {
                  const receiptRes = await api.get(`/claims/draft/receipt/${draft.expenseId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                  });
                  const fileBlob = receiptRes.data;
                  receiptFile = new File([fileBlob], draft.receiptName, { type: fileBlob.type });
                  receiptPreviewUrl = URL.createObjectURL(receiptFile);
                } catch (err) {
                  console.error(`Failed to fetch receipt for draft ${draft.expenseId}`, err);
                }
              }

              return {
                id: draft.expenseId, // Use expenseId as internal ID for mapping
                employeeId: draft.employeeId,
                name: draft.name,
                expenseDescription: draft.description || "",
                category: draft.category || "",
                amount: draft.amount || "",
                expenseDate: draft.date || getTodayDate(),
                receiptFile: receiptFile,
                receiptPreviewUrl: receiptPreviewUrl,
                draftId: draft.expenseId, // Keep track of the actual backend ID
                groupId: draft.claimGroupId
              };
            }));

            setClaims(loadedClaims);
            setDraftLoaded(true);
            // We don't set single originalDraftId, but we might need to track that these are existing drafts
            // For now, mapping draftId in the object is enough to know they exist.
          }
        })
        .catch(err => {
          console.error("Failed to load draft group:", err);
          alert("Failed to load drafts.");
        });

    } else if (draftId) {
      setOriginalDraftId(draftId);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "json",
      };

      // Fetch draft data
      api.get(`/claims/draft/${draftId}`, config)
        .then((draftRes) => {
          const draft = draftRes.data;

          if (!draft || Object.keys(draft).length === 0) {
            throw new Error("Draft not found");
          }

          const draftData = {
            id: Date.now(),
            employeeId: draft.employeeId,
            name: draft.name,
            expenseDescription: draft.description || "",
            category: draft.category || "",
            amount: draft.amount || "",
            expenseDate: draft.date || getTodayDate(),
            receiptFile: null,
            receiptPreviewUrl: null,
            draftId: draftId,
            groupId: draft.claimGroupId
          };

          setClaims([draftData]);
          setDraftLoaded(true);
          setOriginalDraftId(draftId);

          // Load receipt if exists
          if (draft.receiptName) {
            api.get(`/claims/draft/receipt/${draftId}`, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: "blob",
            })
              .then((receiptRes) => {
                const fileBlob = receiptRes.data;
                const fileName = draft.receiptName;
                const fileType = fileBlob.type;
                const fetchedFile = new File([fileBlob], fileName, { type: fileType });

                setClaims(prev => {
                  const newClaims = [...prev];
                  newClaims[0].receiptFile = fetchedFile;
                  newClaims[0].receiptPreviewUrl = URL.createObjectURL(fetchedFile);
                  return newClaims;
                });
              })
              .catch((err) => console.error("Failed to fetch receipt:", err));
          }
        })
        .catch((err) => {
          console.error("Failed to fetch draft:", err);
          alert("Failed to load draft data. Resetting to new claim.");
          setOriginalDraftId(null);
          setDraftLoaded(false);
          resetForm();
        });
    } else {
      resetForm();
    }

  }, [location.key]);
  // ✅ still just location.state, but calls resetForm when no draft

  const resetForm = () => {
    setClaims([{
      id: Date.now(),
      employeeId: sessionStorage.getItem("employeeId"),
      name: sessionStorage.getItem("employeeName"),
      expenseDescription: "",
      category: "",
      amount: "",
      expenseDate: getTodayDate(),
      receiptFile: null,
      receiptPreviewUrl: null
    }]);
    setViewingIndex(0);
    setError("");
    setOriginalDraftId(null);
    setDraftLoaded(false);
  };


  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this claim? This action cannot be undone.")) {
      resetForm();
      navigate('/Claims', { replace: true, state: { activeTab: 'New Claim' } });
    }
  };

  const handleAddClaim = () => {
    setClaims([...claims, {
      id: Date.now(),
      employeeId: sessionStorage.getItem("employeeId"),
      name: sessionStorage.getItem("employeeName"),
      expenseDescription: "",
      category: "",
      amount: "",
      expenseDate: getTodayDate(),
      receiptFile: null,
      receiptPreviewUrl: null
    }]);

    // Auto-scroll to the bottom after adding a new row
    setTimeout(() => {
      const tableContainer = document.querySelector('.claims-table-container');
      if (tableContainer) {
        tableContainer.scrollTop = tableContainer.scrollHeight;
      }
    }, 100);
  };

  const handleRemoveClaim = (index) => {
    if (claims.length === 1) {
      setClaims([{
        id: Date.now(),
        employeeId: sessionStorage.getItem("employeeId"),
        name: sessionStorage.getItem("employeeName"),
        expenseDescription: "",
        category: "",
        amount: "",
        expenseDate: getTodayDate(),
        receiptFile: null,
        receiptPreviewUrl: null
      }]);
      setViewingIndex(0);
      return;
    }
    const newClaims = claims.filter((_, i) => i !== index);
    setClaims(newClaims);
    if (viewingIndex >= newClaims.length) {
      setViewingIndex(newClaims.length - 1);
    }
  };
  const handleViewClaim = (index) => {
    setViewingIndex(index);
    setShowSummaryModal(true);
  };

  const handleClaimChange = (index, name, value) => {
    const newClaims = [...claims];
    newClaims[index][name] = value;
    setClaims(newClaims);
    setFieldErrors({});
  };

  const handleClaimFileChange = (index, file) => {
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        alert("Unsupported file type. Only JPG, PNG, and PDF are allowed.");
        return;
      }

      if (file.size > maxSize) {
        alert("Maximum upload file size allowed is 5MB.");
        return;
      }

      const newClaims = [...claims];
      newClaims[index].receiptFile = file;
      newClaims[index].receiptPreviewUrl = URL.createObjectURL(file);
      setClaims(newClaims);
      setError("");
      setFieldErrors({});
    }
  };




  const getMaxDate = () => getPropperDate();
  const getMinDate = () => {
    // 90 days ago in IST
    // We can just subtract 90 days from the Date object returned by parseISTDateStringToDatePickerValue(getPropperDate())
    // checking logic...
    // Simply:
    const d = new Date(); // local, but consistent enough for 90 days diff
    d.setDate(d.getDate() - 90);
    // return YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };



  const validateAllClaims = () => {
    let errors = {};

    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      if (!claim.expenseDescription.trim() || claim.expenseDescription.trim().length < 10) {
        errors[`desc-${i}`] = true;
        setFieldErrors(errors);
        alert(`Description must be at least 10 characters (Row ${i + 1})`);
        return false;
      }
      if (!claim.category || claim.category === "Select category") {
        errors[`cat-${i}`] = true;
        setFieldErrors(errors);
        alert(`Category is required (Row ${i + 1})`);
        return false;
      }
      if (!claim.amount || Number(claim.amount) <= 0) {
        errors[`amt-${i}`] = true;
        setFieldErrors(errors);
        alert(`Valid amount is required (Row ${i + 1})`);
        return false;
      }
      if (!claim.expenseDate) {
        errors[`date-${i}`] = true;
        setFieldErrors(errors);
        alert(`Date is required (Row ${i + 1})`);
        return false;
      }

      const selectedDate = new Date(claim.expenseDate);
      const minDateObj = new Date();
      minDateObj.setDate(minDateObj.getDate() - 90);
      minDateObj.setHours(0, 0, 0, 0);

      if (selectedDate < minDateObj) {
        errors[`date-${i}`] = true;
        setFieldErrors(errors);
        alert(`Date cannot be more than 90 days old (Row ${i + 1})`);
        return false;
      }
      if (!claim.receiptFile) {
        errors[`rcp-${i}`] = true;
        setFieldErrors(errors);
        alert(`Receipt is required (Row ${i + 1})`);
        return false;
      }
    }

    setFieldErrors({});
    setError("");
    return true;
  };
  const handleSubmit = async () => {
    if (validateAllClaims()) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await api.get(`/allocations/employee/${employeeId}/date/${today}`, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
        });

        if (res.data && res.data.length > 0) {
          setShowConfirmModal(true);
        } else {
          alert("You are not assigned to any project , please contact your manager or admin");
        }
      } catch (err) {
        console.error("Failed to verify project assignment", err);
        alert("Error verifying project assignment. Please try again.");
      }
    }
  };

  const proceedWithSubmission = async () => {
    if (isSubmittingRef.current) return;
    setShowConfirmModal(false);

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found.");
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      const data = new FormData();
      const claimsToSubmit = claims.map(c => ({
        employeeId: c.employeeId,
        name: c.name,
        expenseDescription: c.expenseDescription,
        category: c.category,
        amount: c.amount,
        expenseDate: c.expenseDate
      }));

      data.append("claims", JSON.stringify(claimsToSubmit));
      claims.forEach((c) => {
        if (c.receiptFile) {
          data.append("receiptFiles", c.receiptFile);
        }
      });

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await api.post("/claims/submit-bulk", data, config);

      if (response.status === 200 || response.status === 201) {
        // Delete all drafts that were part of this submission
        const draftIdsToDelete = claims.map(c => c.draftId).filter(id => id);

        if (draftIdsToDelete.length > 0) {
          await Promise.all(draftIdsToDelete.map(id =>
            api.delete(`/claims/draft/delete/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(err => console.warn(`Failed to delete draft ${id}`, err))
          ));
        }

        alert("Expense Claim Submitted Successfully");
        resetForm();
        if (onActionComplete) onActionComplete();
        setTimeout(() => {
          setMessage("");
          navigate('/Claims');
        }, 2000);
      } else {
        alert("Submission failed. Try again.");
      }

    } catch (err) {
      alert(err.response?.data?.message || err.message || "Submission failed.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };


  const handleSaveDraft = async () => {
    if (isSubmittingRef.current) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Authentication token not found.");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError("");
      setMessage("");

      let savedCount = 0;

      // Generate a new Group ID if one doesn't exist for these claims (or use existing if editing)
      // If we are editing a group, we should probably keep the group ID.
      // If we are creating new, generate one.
      // Simplification: Always generate a new Group ID for a clean "save" unless we want to track updates strictly.
      // Actually, if we update, we want to keep the group together.
      // Let's use the groupId from the first claim if it exists, otherwise generate new.
      let currentGroupId = claims[0].groupId || `GRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      for (let i = 0; i < claims.length; i++) {
        const claim = claims[i];

        // Save if ANY field has been touched or has content beyond the defaults
        const hasInput = claim.expenseDescription?.trim() ||
          (claim.category && claim.category !== "Select category") ||
          (claim.amount && parseFloat(claim.amount) > 0) ||
          claim.receiptFile ||
          (claims.length === 1); // If only one row, always allow saving to be safe

        if (!hasInput && claims.length > 1) continue;
        if (!claim.employeeId) continue;

        const draftPayload = {
          expenseId: claim.draftId || null, // Use saved draftId if it exists
          employeeId: claim.employeeId,
          name: claim.name,
          description: claim.expenseDescription,
          category: claim.category,
          amount: claim.amount ? parseFloat(claim.amount) : null,
          date: claim.expenseDate,
          status: "draft",
          claimGroupId: currentGroupId
        };

        const data = new FormData();
        data.append("claimDraft", JSON.stringify(draftPayload));
        if (claim.receiptFile) {
          data.append("receiptFile", claim.receiptFile);
        }

        const config = {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          }
        };

        let res;
        if (draftPayload.expenseId) {
          res = await api.put(`/claims/draft/${draftPayload.expenseId}`, data, config);
        } else {
          res = await api.post("/claims/draft", data, config);
        }

        // Update local state with the new draft ID and Group ID to prevent duplicates if saved again immediately
        if (res.data) {
          const savedDraft = res.data;
          claims[i].draftId = savedDraft.expenseId;
          claims[i].groupId = savedDraft.claimGroupId;
        }

        savedCount++;
      }

      if (savedCount > 0) {
        alert("Draft saved successfully!");
        setOriginalDraftId(null);
        resetForm();
        if (onActionComplete) onActionComplete();
        setTimeout(() => setMessage(""), 2000);
      } else {
        alert("Please add some details before saving a draft.");
      }
    } catch (err) {
      console.error("Error saving drafts:", err);
      showToast("Failed to save draft. Please try again.", "error");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const totalAmount = claims.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const currentClaim = claims[viewingIndex] || claims[0];

  // Check if buttons should be static (when 5 or more claims are added)
  const shouldMakeButtonsStatic = claims.length >= 5;

  return (
    <div className="claims-module-main">
      <div className="expense-details-full">
        <div className={`claims-table-container ${shouldMakeButtonsStatic ? 'with-static-buttons' : ''}`}>
          <div className="claims-grid-header">
            <div>Description <span className="mandatory-star">*</span></div>
            <div>Category <span className="mandatory-star">*</span></div>
            <div>Amount <span className="mandatory-star">*</span></div>
            <div>Expense Date <span className="mandatory-star">*</span></div>
            <div style={{ textAlign: 'center' }}>Receipt <span className="mandatory-star">*</span></div>
            <div style={{ textAlign: 'center' }}>Action</div>
          </div>

          {claims.map((claim, index) => (
            <div key={claim.id} className="claims-grid-row">
              <div className="mobile-label-wrapper">
                <span className="mobile-field-label">Description <span className="mandatory-star">*</span></span>
                <input
                  className={fieldErrors[`desc-${index}`] ? 'error-field' : ''}
                  value={claim.expenseDescription}
                  onChange={(e) => handleClaimChange(index, 'expenseDescription', e.target.value)}
                  placeholder="Description"
                  maxLength={255}
                />
              </div>

              <div className="mobile-label-wrapper">
                <span className="mobile-field-label">Category <span className="mandatory-star">*</span></span>
                <select
                  value={claim.category}
                  onChange={(e) => handleClaimChange(index, 'category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {allowedCategories.map(cat => (
                    <option key={cat.id} value={cat.categoryName}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>

              <div className="mobile-label-wrapper">
                <span className="mobile-field-label">Amount <span className="mandatory-star">*</span></span>
                <input
                  className={fieldErrors[`amt-${index}`] ? 'error-field' : ''}
                  type="text"
                  value={claim.amount}
                  onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value)) {
                      handleClaimChange(index, 'amount', e.target.value);
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="mobile-label-wrapper">
                <span className="mobile-field-label">Expense Date <span className="mandatory-star">*</span></span>
                <div className={`datepicker-container ${fieldErrors[`date-${index}`] ? 'error-field' : ''}`}>
                  <DatePicker
                    selected={parseISTDateStringToDatePickerValue(claim.expenseDate)}
                    onChange={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        handleClaimChange(index, 'expenseDate', `${year}-${month}-${day}`);
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    minDate={parseISTDateStringToDatePickerValue(getMinDate())}
                    maxDate={parseISTDateStringToDatePickerValue(getMaxDate())}
                    placeholderText="Date"
                    popperPlacement="bottom-end"
                    portalId="root"
                    renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => (
                      <div className="custom-calendar-header">
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
                          <div className="header-dropdown year-dropdown" style={{ left: 'auto', right: '20px' }}>
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
                    )}
                  />
                </div>
              </div>

              <div className="mobile-label-wrapper">
                <span className="mobile-field-label">Receipt <span className="mandatory-star">*</span></span>
                <div className="receipt-cell">
                  <input
                    type="file"
                    id={`file-${index}`}
                    style={{ display: 'none' }}
                    onChange={(e) => handleClaimFileChange(index, e.target.files[0])}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
                    {/* Fixed-height row so "with file" and "without file" rows are identical */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', width: '100%' }}>
                      {claim.receiptFile && (
                        <span
                          style={{
                            fontSize: '13px',
                            color: '#1e293b',
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: '32px',
                          }}
                          title={claim.receiptFile.name}
                        >
                          {claim.receiptFile.name.length > 15
                            ? `${claim.receiptFile.name.substring(0, 15)}...`
                            : claim.receiptFile.name}
                        </span>
                      )}
                      <label
                        htmlFor={`file-${index}`}
                        className="view-claim-btn"
                        style={{ margin: 0, padding: '4px 10px', fontSize: '13px', lineHeight: '22px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={claim.receiptFile ? 'Change file' : 'Upload file'}
                      >
                        {claim.receiptFile ? <FiEdit3 size={15} /> : 'Upload'}
                      </label>
                    </div>
                    <span className="supported-formats-text">Supported: JPG, PNG, PDF (Max 5MB)</span>
                  </div>
                </div>
              </div>


              <div className="mobile-label-wrapper action-cell">
                <span className="mobile-field-label">Action</span>
                <button
                  className="delete-claim-btn"
                  onClick={() => handleRemoveClaim(index)}
                  type="button"
                  title="Remove Claim"
                >
                  <FiX size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>

        <div className={`actions-footer ${shouldMakeButtonsStatic ? 'static-buttons' : ''}`}>
          <button className="add-claim-btn footer-add-btn" onClick={handleAddClaim}>
            Add
          </button>
          <button className="btn primary submit-btn-teal" onClick={handleSubmit} disabled={isSubmitting || !!message}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button className="btn secondary" onClick={handleSaveDraft} disabled={isSubmitting}>Save as Draft</button>
          <button className="btn secondary" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
        </div>

        {error && ReactDOM.createPortal(
          <div className="error-popup-message">
            <FiAlertCircle size={20} />
            {error}
          </div>,
          document.body
        )}
      </div>

      {showSummaryModal && ReactDOM.createPortal(
        <div className="summary-modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="summary-modal-content" onClick={e => e.stopPropagation()}>
            <div className="summary-card-header">
              <span className="summary-card-title">Expense Details</span>
              <button className="close-modal-btn" onClick={() => setShowSummaryModal(false)}>×</button>
            </div>
            <div className="summary-card-body">
              <div className="summary-detail-row">
                <span className="summary-detail-label">
                  <FiFileText className="detail-icon" /> Description:
                </span>
                <span className="summary-detail-value">{currentClaim.expenseDescription || "N/A"}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-detail-label">
                  <FiTag className="detail-icon" /> Category:
                </span>
                <span className="summary-detail-value">{currentClaim.category || "Not selected"}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-detail-label">
                  <FiCalendar className="detail-icon" /> Expense Date:
                </span>
                <span className="summary-detail-value">
                  {currentClaim.expenseDate ? currentClaim.expenseDate.split('-').reverse().join('-') : "Not selected"}
                </span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-detail-label">
                  <FiDollarSign className="detail-icon" /> Amount:
                </span>
                <span className="summary-detail-value">₹{currentClaim.amount || "0.00"}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-detail-label">
                  <FiPaperclip className="detail-icon" /> Receipts:
                </span>
                <span className="summary-detail-value">{currentClaim.receiptFile ? "1 file attached" : "No file attached"}</span>
              </div>

              <div className="summary-total-amount">
                <div className="total-label-group">
                  <FiCheckCircle className="total-icon" />
                  <span>Total Reimbursements</span>
                </div>
                <span>₹{parseFloat(currentClaim.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn primary confirm-btn" onClick={() => setShowSummaryModal(false)}>Got it</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showConfirmModal && ReactDOM.createPortal(
        <div className="summary-modal-overlay">
          <div className="summary-modal-content confirm-sub-modal">
            <div className="summary-card-body" style={{ padding: '2rem 2.5rem', textAlign: 'center' }}>
              <h3 className="confirm-title">Confirm Submission</h3>
              <p className="confirm-subtitle">
                Are you sure you want to submit these claims? This will send them for review and approval.
              </p>

              <div className="confirm-stats-card">
                <div className="stats-row">
                  <span className="stats-label">Total Selected</span>
                  <span className="stats-value">{claims.length} {claims.length === 1 ? 'Claim' : 'Claims'}</span>
                </div>
                <div className="stats-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eef2f6' }}>
                  <span className="stats-label">Total Amount</span>
                  <span className="stats-value total">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="confirm-btn-group">
                <button
                  className="confirm-btn yes"
                  onClick={proceedWithSubmission}
                >
                  Yes, Submit
                </button>
                <button
                  className="confirm-btn no"
                  onClick={() => setShowConfirmModal(false)}
                >
                  No, Go Back
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}



      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Reimbursements Claim Submitted Successfully"
      />

      {/* Top-right toast for draft save */}
      <ToastNotification
        isOpen={toast.open}
        onClose={closeToast}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

export default NewClaim;

