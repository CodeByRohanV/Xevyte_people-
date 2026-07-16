import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar'; // Ensure this path is correct
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import api from "../api";
import "./OnBoardingPage.css";

// --- START: Responsive Constants ---
const mobileBreakpoint = 768;
// Function to check if the current width is mobile size
const isMobile = (width) => width < mobileBreakpoint;
// --- END: Responsive Constants ---

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

const SmartDatePicker = ({ value, onChange, placeholder, required, maxDate, minDate, inputStyle }) => {
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={onChange}
            dateFormat="dd-MM-yyyy"
            placeholderText={placeholder}
            className="date-picker-input"
            wrapperClassName="date-picker-wrapper"
            customInput={<input style={inputStyle} required={required} />}
            maxDate={maxDate}
            minDate={minDate}

            renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
            }) => {
                const months = [
                    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
                ];

                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 120 }, (_, i) => currentYear + 10 - i);

                return (
                    <div className="custom-calendar-header">
                        <div className="calendar-header-banner">
                            <button
                                type="button"
                                className="header-nav-btn prev"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    decreaseMonth();
                                }}
                            >
                                ‹
                            </button>

                            <div className="header-main-content">
                                <div className="header-text-group">
                                    <div style={{ position: 'relative' }}>
                                        <span
                                            className="clickable-header-text"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMonthOpen(!monthOpen);
                                                setYearOpen(false);
                                            }}
                                        >
                                            {months[date.getMonth()]}
                                        </span>
                                        {monthOpen && (
                                            <div className="header-dropdown month-dropdown">
                                                <div className="dropdown-scroll-pane">
                                                    {months.map((m, idx) => (
                                                        <div
                                                            key={m}
                                                            className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`}
                                                            onClick={() => {
                                                                changeMonth(idx);
                                                                setMonthOpen(false);
                                                            }}
                                                        >
                                                            {m}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <span
                                            className="clickable-header-text"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setYearOpen(!yearOpen);
                                                setMonthOpen(false);
                                            }}
                                        >
                                            {date.getFullYear()}
                                        </span>
                                        {yearOpen && (
                                            <div className="header-dropdown year-dropdown">
                                                <div className="dropdown-scroll-pane">
                                                    {years.map((y) => (
                                                        <div
                                                            key={y}
                                                            className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`}
                                                            onClick={() => {
                                                                changeYear(y);
                                                                setYearOpen(false);
                                                            }}
                                                        >
                                                            {y}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="header-nav-btn next"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMonthOpen(false);
                                    setYearOpen(false);
                                    increaseMonth();
                                }}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                );
            }}
        />
    );
};

// Location Autocomplete Component
const LocationAutocomplete = ({ suggestions, showDropdown, onSelect, inputValue, selectedLocationIndex, setSelectedLocationIndex }) => {
    console.log("LocationAutocomplete props:", { suggestions, showDropdown, inputValue, selectedLocationIndex });

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
                border: '1px solid #cbd5e1',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '-1px'
            }}
        >
            {suggestions.map((location, index) => (
                <div
                    key={location.id || index}
                    className="location-suggestion-item"
                    style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s',
                        fontSize: '15px',
                        backgroundColor: index === selectedLocationIndex ? '#e0e0e0' : 'white'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e0e0e0';
                        setSelectedLocationIndex(index);
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        setSelectedLocationIndex(-1);
                    }}
                    onClick={() => onSelect(location)}
                >
                    <span style={{ color: '#14b8a6', fontSize: '15px' }}>📍</span>
                    <span style={{
                        color: '#1e293b',
                        fontWeight: 'normal'
                    }}>
                        {location.locationName}
                    </span>
                </div>
            ))}
        </div>
    );
};

// --- Single Entry Component (Refactored for Side-by-Side Layout) ---

const SingleEntry = () => {
    // --- NEW: State for screen width ---
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobileView = isMobile(windowWidth);

    const [formData, setFormData] = useState({
        empId: '',
        firstName: '',
        lastName: '',
        workLocation: '',
        personalMail: '',
        emergencyContactNumber: '',
        gender: '',
        bloodGroup: '',
        dateOfBirth: null,
        designation: '',
        contactNum: '',
        empMail: '',
        joiningDate: null,
        aadhaar: '',
        panNo: '',
        address: '',
        presentAddress: '',
        noticePeriod: '',
    });
    const navigate = useNavigate();
    const [acceptedApplicants, setAcceptedApplicants] = useState([]);
    const [selectedApplicantId, setSelectedApplicantId] = useState("");

    // Location autocomplete states
    const [companyLocations, setCompanyLocations] = useState([]);
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);

    // --- NEW: Effect to track window width for responsiveness ---
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const formatDateForBackend = (date) => {
        if (!date) return null;

        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`; // yyyy-MM-dd
    };

    // Fetch company locations for autocomplete
    const fetchCompanyLocations = useCallback(async () => {
        if (companyLocations.length > 0) return; // Already loaded

        try {
            console.log("Fetching company locations from API...");

            // Get authentication token like other API calls
            const rawToken = sessionStorage.getItem("token");
            const token = rawToken?.replace(/"/g, "");

            // Try to get active locations first with authentication
            let response;
            try {
                response = await api.get('/admin/company-locations/active', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Successfully fetched from /admin/company-locations/active");
            } catch (authErr) {
                console.log("Active endpoint failed, trying search endpoint:", authErr);
                // If authenticated endpoint fails, try public search
                response = await api.get('/admin/company-locations/search?searchTerm=');
                console.log("Successfully fetched from /admin/company-locations/search");
            }

            const activeLocations = response.data || [];
            console.log("Fetched company locations from API:", activeLocations);

            if (activeLocations.length === 0) {
                console.warn("No company locations found in the database");
            }

            setCompanyLocations(activeLocations);
        } catch (err) {
            console.error("Error fetching company locations from API:", err);
            console.error("API Error Details:", {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data
            });

            // Don't set mock data - just show empty state
            setCompanyLocations([]);
        }
    }, [companyLocations.length]);

    // Filter locations based on input
    const filterLocations = (input) => {
        console.log("Filtering locations for input:", input);
        console.log("Available company locations:", companyLocations);

        if (!input || input.trim() === "") {
            setLocationSuggestions([]);
            setShowLocationDropdown(false);
            setSelectedLocationIndex(-1);
            return;
        }

        // If no company locations loaded, don't show suggestions
        if (companyLocations.length === 0) {
            console.log("No company locations available for filtering");
            setLocationSuggestions([]);
            setShowLocationDropdown(false);
            setSelectedLocationIndex(-1);
            return;
        }

        const filtered = companyLocations.filter(location =>
            location.locationName?.toLowerCase().includes(input.toLowerCase())
        );

        console.log("Filtered suggestions:", filtered);
        setLocationSuggestions(filtered);
        setShowLocationDropdown(true);
        setSelectedLocationIndex(-1);
    };

    // Handle location selection
    const handleLocationSelect = (location) => {
        setFormData(prev => ({ ...prev, workLocation: location.locationName }));
        setShowLocationDropdown(false);
        setLocationSuggestions([]);
        setSelectedLocationIndex(-1);
    };

    // Handle keyboard navigation for location suggestions
    const handleLocationKeyDown = (e) => {
        if (!showLocationDropdown || locationSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedLocationIndex(prev => {
                    const newIndex = prev < locationSuggestions.length - 1 ? prev + 1 : 0;
                    // Scroll the selected item into view
                    setTimeout(() => {
                        const suggestionItems = document.querySelectorAll('.location-suggestion-item');
                        if (suggestionItems[newIndex]) {
                            suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, 0);
                    return newIndex;
                });
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedLocationIndex(prev => {
                    const newIndex = prev > 0 ? prev - 1 : locationSuggestions.length - 1;
                    // Scroll the selected item into view
                    setTimeout(() => {
                        const suggestionItems = document.querySelectorAll('.location-suggestion-item');
                        if (suggestionItems[newIndex]) {
                            suggestionItems[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, 0);
                    return newIndex;
                });
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedLocationIndex >= 0 && selectedLocationIndex < locationSuggestions.length) {
                    handleLocationSelect(locationSuggestions[selectedLocationIndex]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                setShowLocationDropdown(false);
                setLocationSuggestions([]);
                setSelectedLocationIndex(-1);
                break;

            default:
                break;
        }
    };

    // Handle location input change
    const handleLocationInputChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, workLocation: value }));
        filterLocations(value);
    };

    // Handle input blur to close dropdown
    const handleLocationInputBlur = () => {
        setTimeout(() => {
            setShowLocationDropdown(false);
        }, 200);
    };

    useEffect(() => {
        const fetchAccepted = async () => {
            try {
                const rawToken = sessionStorage.getItem("token");
                const token = rawToken?.replace(/"/g, "");

                const res = await api.get("/v1/applicants/accepted", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setAcceptedApplicants(res.data);
            } catch (error) {
                console.error("Error fetching accepted applicants:", error);
            }
        };

        fetchAccepted();
    }, []);



    useEffect(() => {
        const loadApplicantData = async () => {
            if (!selectedApplicantId) return;

            try {
                const rawToken = sessionStorage.getItem("token");
                const token = rawToken?.replace(/"/g, "");

                const res = await api.get(`/v1/preonboarding/${selectedApplicantId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = res.data;
                const personal = data.personal || {};
                const present = data.address?.present || {};
                const permanent = data.address?.permanent || {};

                const identity = data.identity || {};


                setFormData(prev => ({
                    ...prev,

                    // Basic
                    firstName: personal.firstName || "",
                    lastName: personal.lastName || "",
                    gender: personal.gender || "",
                    dateOfBirth: personal.dateOfBirth || null,


                    personalMail: personal.personalEmail || "",
                    empMail: personal.workEmail || "",

                    contactNum: personal.mobileNumber || "",
                    emergencyContactNumber: personal.emergencyContactNumber || "",
                    bloodGroup: personal.bloodGroup?.trim().replace(" ", "") || "",


                    // Address
                    // ✅ Permanent Address
                    address: permanent
                        ? `${permanent.addressLine || ""}, ${permanent.city || ""}, ${permanent.state || ""} - ${permanent.pincode || ""}`
                            .replace(/,\s*,/g, ",")
                        : "",


                    // ✅ Present Address
                    presentAddress: present
                        ? `${present.addressLine || ""}, ${present.city || ""}, ${present.state || ""} - ${present.pincode || ""}`
                        : "",


                    aadhaar: identity.aadharNumber || "",
                    panNo: identity.panNumber || "",

                    // Applicant table data
                    workLocation: data.applicant?.approvedLocation || "",
                    designation: data.applicant?.position || "",
                    joiningDate: data.applicant?.approvedDoj || null,
                    noticePeriod: data.applicant?.noticePeriod || "",
                }));

            } catch (err) {
                console.error("Error fetching onboarding data:", err);
            }
        };

        loadApplicantData();
    }, [selectedApplicantId]);

    // Fetch company locations on component mount
    useEffect(() => {
        fetchCompanyLocations();
    }, [fetchCompanyLocations]);

    // Utility function to format Aadhaar as XXXX XXXX XXXX
    const formatAadhaar = (value) => {
        const cleaned = ('' + value).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{1,4})(\d{0,4})(\d{0,4})$/);
        if (match) {
            return [match[1], match[2], match[3]].filter(Boolean).join(' ');
        }
        return value;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        let newValue = value;

        // Save cursor position BEFORE modifying input
        const cursorPos = e.target.selectionStart;

        if (name === "aadhaar") {
            newValue = formatAadhaar(value);
        }

        else if (name === "panNo") {
            let v = value.toUpperCase();
            v = v.replace(/\s/g, "");
            v = v.substring(0, 10);

            // PAN rules
            let letters = v.substring(0, 5).replace(/[^A-Z]/g, "");
            let numbers = v.substring(5, 9).replace(/\D/g, "");
            let last = v.substring(9, 10).replace(/[^A-Z]/g, "");

            newValue = letters + numbers + last;
        }

        else if (name === "contactNum" || name === "emergencyContactNumber") {
            newValue = value.replace(/\D/g, "").substring(0, 10);
        }

        // UPDATE STATE WITHOUT LOSING CURSOR
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // RESTORE CURSOR (Delay required so DOM updates first)
        setTimeout(() => {
            const input = document.querySelector(`input[name="${name}"]`);

            // Only apply setSelectionRange to supported input types
            const allowedTypes = ["text", "search", "tel", "url", "password"];

            if (input && allowedTypes.includes(input.type)) {
                let newCursorPos = cursorPos;

                // Aadhaar formatting adds spaces → adjust cursor
                if (name === "aadhaar" && newValue[cursorPos - 1] === " ") {
                    newCursorPos = cursorPos + 1;
                }

                input.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };


    // DatePicker change handler for Joining Date
    const handleDateChange = (date) => {
        setFormData({ ...formData, joiningDate: date });
    };

    const inputStyle = {
        width: '100%',
        padding: isMobileView ? '14px 16px' : '8px 12px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '15px',
        backgroundColor: '#ffffff',
        color: '#1F2937',
        lineHeight: isMobileView ? '1.5' : 'inherit',
        outline: 'none',
        transition: 'border-color 0.3s ease',
        height: isMobileView ? '50px' : '42px',
        boxSizing: 'border-box',
    };

    const selectStyle = {
        ...inputStyle,
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '18px',
        paddingRight: '36px',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '3px',
        fontWeight: 'normal',
        fontSize: '15px',
        color: '#1F2937',
        textTransform: 'none',
        letterSpacing: '0.5px'
    };

    // Strict PAN validation before submission
    const validatePanFormat = (pan) => {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    };

    const handleSubmit = async () => {
        try {
            // Combine First Name and Last Name


            // Clean input values
            const cleanedAadhaar = formData.aadhaar ? formData.aadhaar.replace(/\s/g, '') : null;
            const cleanedPan = formData.panNo ? formData.panNo.replace(/\s/g, '').toUpperCase() : null;
            const cleanedContactNum = formData.contactNum ? formData.contactNum.replace(/\D/g, '') : null;
            const cleanedEmergencyContactNum = formData.emergencyContactNumber ? formData.emergencyContactNumber.replace(/\D/g, '') : null;


            // 1️⃣ Validate mandatory fields
            const requiredFields = [
                { key: 'empId', name: 'Employee ID' },
                { key: 'firstName', name: 'First Name' },
                { key: 'lastName', name: 'Last Name' },
                { key: 'designation', name: 'Designation' },
                { key: 'joiningDate', name: 'Joining Date' },
                { key: 'workLocation', name: 'Work Location' },
                { key: 'empMail', name: 'Work Mail ID' },
                { key: 'gender', name: 'Gender' },
                { key: 'dateOfBirth', name: 'Date of Birth' },
                { key: 'aadhaar', name: 'Aadhaar No' },
                { key: 'panNo', name: 'Pan No' },
            ];


            const missingFields = requiredFields
                .filter(f => !formData[f.key])
                .map(f => f.name);

            if (missingFields.length > 0) {
                console.error("Missing mandatory fields:", missingFields.join(', '));
                alert(`❌ Missing fields!

Please fill in the following mandatory fields:

- ${missingFields.join('\n- ')}`);
                return;
            }

            // NOTE: fullName check is now technically redundant if firstName is mandatory,
            // but it's harmless to keep.


            // 2️⃣ PAN validation (PAN is mandatory and requires strict format)
            if (cleanedPan.length !== 10 || !validatePanFormat(cleanedPan)) {
                alert("❌ Invalid PAN Number. Must be 10 characters: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F).");
                return;
            }

            // 3️⃣ Aadhaar validation (Aadhaar is mandatory and requires 12 digits)
            if (cleanedAadhaar.length !== 12) {
                alert("❌ Invalid Aadhaar Number. It must be 12 digits long.");
                return;
            }

            // 4️⃣ Contact number validation (Still optional, only check length if provided)
            if (cleanedContactNum && cleanedContactNum.length !== 10) {
                alert("❌ Invalid Contact Number. It must be exactly 10 digits long.");
                return;
            }

            // ⭐ NEW FIELD: Emergency Contact number validation (Still optional, only check length if provided)
            if (cleanedEmergencyContactNum && cleanedEmergencyContactNum.length !== 10) {
                alert("❌ Invalid Emergency Contact Number. It must be exactly 10 digits long.");
                return;
            }

            // ... (rest of the submission logic - token, payload, API call) ...

            // 5️⃣ Get JWT token
            const rawToken = sessionStorage.getItem('token');
            if (!rawToken) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            const token = rawToken.startsWith('"') && rawToken.endsWith('"') ? rawToken.slice(1, -1) : rawToken;

            // Prepare payload
            const payload = {
                employeeId: (formData.empId || "").trim().toUpperCase(),
                applicantId: selectedApplicantId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.empMail,
                joiningDate: formatDateForBackend(formData.joiningDate),
                aadharNo: cleanedAadhaar,
                panNo: cleanedPan,
                address: formData.address || null,
                presentAddress: formData.presentAddress || null,
                contactNo: cleanedContactNum,
                role: formData.designation || "EMPLOYEE",
                workLocation: formData.workLocation || null,
                personalMail: formData.personalMail || null,
                emergencyContactNumber: cleanedEmergencyContactNum,
                gender: formData.gender || null,
                dateOfBirth: formatDateForBackend(formData.dateOfBirth),
                bloodGroup: formData.bloodGroup || null,
                noticePeriod: formData.noticePeriod || null,
            };

            console.log("Submitting Payload:", payload);

            // Axios POST request
            const response = await api.post("/employees", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert(
                ` Employee ${response.data.firstName} ${response.data.lastName} created successfully!\n` +
                ` Employee ID: ${getDisplayEmployeeId(response.data.employeeId)}\n` +
                ` Role: ${response.data.role}`
            );


            setFormData({});

            // ⭐ Update Applicant Status to "Onboarded"
            try {
                if (selectedApplicantId) {
                    await api.put(
                        `/v1/applicants/status/${selectedApplicantId}?status=Onboarded`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }

                // alert(`📌 Applicant ${selectedApplicantId} marked as Onboarded.`);
            } catch (updateErr) {
                console.error("Error updating applicant status:", updateErr);
                alert("Candidate Successfully Onboarded");
            }
            // Reset form

        } catch (error) {
            if (error.response) {
                if (error.response.status === 409) {
                    const msg = error.response.data || '';
                    if (msg.toLowerCase().includes('personal email')) {
                        alert(`❌ Personal Email already exists. Please use a different email address.`);
                    } else if (msg.toLowerCase().includes('work email') || msg.toLowerCase().includes('email')) {
                        alert(`❌ Work Email already exists. Please use a different email address.`);
                    } else if (msg.toLowerCase().includes('employee id')) {
                        alert(`❌ Employee ID already exists. Please use a different Employee ID.`);
                    } else {
                        alert(`❌ ${msg}`);
                    }
                    console.error("Backend Conflict Error:", error.response.data);
                } else {
                    alert(`❌ Failed to save employee: ${error.response.data}`);
                    console.error("Backend Error:", error.response.data);
                }
            } else {
                console.error("Network Error:", error);
                alert("❌ Network Error: Could not connect to the server.");
            }
        }
    };


    return (
        <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ flex: 3 }}>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 10px' }}>

                    {/* --- Row 1: Applicant ID, First Name, Last Name --- */}

                    <div>
                        <label style={labelStyle}>Select Applicant ID</label>
                        <select
                            name="applicantId"
                            value={selectedApplicantId}
                            onChange={(e) => setSelectedApplicantId(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">Select Applicant</option>
                            {acceptedApplicants.map((a) => (
                                <option key={a.applicantId} value={a.applicantId}>
                                    {getDisplayEmployeeId(a.applicantId)} - {a.fullName}
                                </option>
                            ))}

                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>First Name <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} style={inputStyle} required maxLength={120} />
                    </div>

                    <div>
                        <label style={labelStyle}>Last Name <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} style={inputStyle} maxLength={120} />
                    </div>

                    <div>
                        <label style={labelStyle}>Designation <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="designation" value={formData.designation || ''} onChange={handleChange} style={inputStyle} required maxLength={240} />
                    </div>

                    <div>
                        <label style={labelStyle}>Joining Date <span style={{ color: 'red' }}>*</span></label>
                        <SmartDatePicker
                            value={formData.joiningDate}
                            onChange={handleDateChange}
                            placeholder="Select joining date"
                            inputStyle={inputStyle}
                            required={true}
                        />
                    </div>
                    {/* --- Row 2: First Name & Last Name --- */}


                    {/* ⭐ NEW FIELD: Work Location (Input Field) */}
                    <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Work Location <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            name="workLocation"
                            value={formData.workLocation || ''}
                            onChange={handleLocationInputChange}
                            onKeyDown={handleLocationKeyDown}
                            onFocus={() => fetchCompanyLocations()}
                            onBlur={handleLocationInputBlur}
                            style={inputStyle}
                            maxLength={240}
                            placeholder="e.g., Bengaluru, Remote"
                        />
                        <LocationAutocomplete
                            suggestions={locationSuggestions}
                            showDropdown={showLocationDropdown}
                            onSelect={handleLocationSelect}
                            inputValue={formData.workLocation || ''}
                            selectedLocationIndex={selectedLocationIndex}
                            setSelectedLocationIndex={setSelectedLocationIndex}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Employee ID <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            name="empId"
                            value={formData.empId || ''}
                            onChange={handleChange}
                            style={inputStyle}
                            required
                            maxLength={50}
                            placeholder="e.g. H10663"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Work Mail ID <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="email"
                            name="empMail"
                            value={formData.empMail || ''}
                            onChange={handleChange}
                            style={inputStyle}
                            required
                            maxLength={240}
                            placeholder="e.g. name@company.com"
                        />
                    </div>
                    {/* ⭐ NEW FIELD: Personal Mail ID (Input Field) */}
                    <div>
                        <label style={labelStyle}>Personal Mail ID</label>
                        <input type="email" name="personalMail" value={formData.personalMail || ''} onChange={handleChange} style={inputStyle} maxLength={240} placeholder="personal@example.com" />
                    </div>

                    {/* --- Row 3: Contact Number & Work Mail ID --- */}
                    <div>
                        <label style={labelStyle}>Contact Number</label>
                        <input type="tel" name="contactNum" value={formData.contactNum || ''} onChange={handleChange} style={inputStyle} maxLength="10" placeholder="10 digits only" inputMode="numeric" />
                    </div>


                    {/* ⭐ NEW FIELD: Emergency Contact Number (Input Field with validation) */}
                    <div>
                        <label style={labelStyle}>Emergency Contact</label>
                        <input type="tel" name="emergencyContactNumber" value={formData.emergencyContactNumber || ''} onChange={handleChange} style={inputStyle} maxLength="10" placeholder="10 digits only" inputMode="numeric" />
                    </div>

                    {/* ⭐ NEW FIELD: Gender (Dropdown) */}
                    <div>
                        <label style={labelStyle}>Gender <span style={{ color: 'red' }}>*</span></label>
                        <select name="gender" value={formData.gender || ''} onChange={handleChange} style={selectStyle}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Blood Group <span style={{ color: 'red' }}>*</span></label>
                        <select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} style={selectStyle}>
                            <option value="">Select Group</option>
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


                    <div>
                        <label style={labelStyle}>Date of Birth <span style={{ color: 'red' }}>*</span></label>
                        <SmartDatePicker
                            value={formData.dateOfBirth}
                            onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                            placeholder="Select D.O.B"
                            inputStyle={inputStyle}
                            maxDate={new Date()}
                            required={true}
                        />
                    </div>



                    {/* Aadhaar and PAN */}
                    <div>
                        <label style={labelStyle}>Aadhaar No <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="aadhaar" value={formData.aadhaar || ''} onChange={handleChange} style={inputStyle} maxLength="14" placeholder="XXXX XXXX XXXX" inputMode="numeric" />
                    </div>
                    <div>
                        <label style={labelStyle}>Pan No <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="panNo" value={formData.panNo || ''} onChange={handleChange} style={inputStyle} maxLength="10" placeholder="" />
                    </div>

                    {/* Address (Full-width) */}
                    <div>
                        <label style={labelStyle}>Permanent Address</label>
                        <input name="address" value={formData.address || ''} onChange={handleChange} style={{ ...inputStyle }} maxLength="300" />
                    </div>

                    <div>
                        <label style={labelStyle}>Present Address</label>
                        <input
                            name="presentAddress"
                            value={formData.presentAddress || ''}
                            onChange={handleChange}
                            style={{ ...inputStyle }}
                            maxLength="300"
                        />
                    </div>

                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                        marginTop: "0px",
                        marginBottom: "20px"
                    }}
                >
                    <button
                        onClick={handleSubmit}
                        style={{
                            width: "auto",
                            padding: "14px 28px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#00B3A4",
                            color: "white",
                            fontWeight: "normal",
                            fontSize: "15px",
                            cursor: "pointer",
                            boxShadow: "none",
                            transition: "all 0.3s ease",
                            marginTop: "10px"
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.opacity = "1";
                        }}
                    >
                        Submit
                    </button>
                </div>

            </div>
        </div>
    );
};
// ... rest of the components (BulkEntry, OnBoarding) remain the same
// --- Bulk Entry Component (Modified for upload logic, styling, and status display) ---

// --- Bulk Entry Component (Modified to include 5 new fields) ---

const BulkEntry = () => {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        // Optional: Update the visible 'No file chosen' text
        const fileInputContainer = document.getElementById('file-input-container');
        if (fileInputContainer) {
            const fileNameDisplay = fileInputContainer.querySelector('.file-name-display');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = selectedFile ? selectedFile.name : 'No file chosen';
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        const rawToken = sessionStorage.getItem('token');
        if (!rawToken) {
            alert("Authentication token not found. Please log in again.");
            return;
        }
        const token = rawToken.startsWith('"') && rawToken.endsWith('"') ? rawToken.slice(1, -1) : rawToken;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Assuming 'api' is an Axios instance or similar HTTP client
            const response = await api.post(
                "/employees/bulk-onboard",
                formData,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const result = response.data;
            const successCount = result.successCount || 0;
            const failureCount = result.failureDetails ? result.failureDetails.length : 0;

            if (failureCount > 0) {
                let alertMessage = `Bulk Onboarding Complete!\n\nSuccessful Entries: ${successCount}\nFailed Entries: ${failureCount}`;
                alertMessage += '\n\n--- Failed Entries Details ---\n';
                result.failureDetails.slice(0, 5).forEach(failure => {
                    // Note: employeeId might be null in the failure response if the row couldn't be parsed at all
                    alertMessage += `${failure.reason}\n`;
                });
                if (failureCount > 5) {
                    alertMessage += `...and ${failureCount - 5} more failures.\n`;
                }
                alert(alertMessage);
            } else {
                alert(`Bulk Onboarding Complete! Successful Entries: ${successCount}`);
            }

            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the file input

        } catch (error) {
            if (error.response) {
                console.error("Backend Error:", error.response.data);
                alert(`Bulk upload failed: ${error.response.data.message || error.response.statusText}`);
            } else {
                console.error("Bulk upload network error:", error);
                alert("Network Error: Could not connect to the server for bulk upload.");
            }
        }
    };


    const handleDownloadTemplate = () => {
        const headers = [
            'Employee ID*',
            'First Name*',
            'Last Name*',
            'Designation*',
            'Joining Date (DD-MM-YYYY)*',
            'Work Location*',
            'Work Mail ID*',
            'Personal Mail ID',
            'Contact Number',
            'Emergency Contact',
            'Gender (Male/Female/Other)*',
            'Blood Group (A+/B+/O+ etc.)',
            'Date of Birth (DD-MM-YYYY)*',
            'Aadhaar No*',
            'Pan No*',
            'Permanent Address',
            'Present Address',
        ];

        const csvContent = headers.join(',');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'onboarding_bulk_template_v2.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.log('Your browser does not support automatic file download. Template headers:', csvContent);
        }
    };

    // --- STYLES (Kept for completeness) ---
    const hiddenFileInputStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer',
        zIndex: 2,
    };

    const customChooseButtonStyle = {
        padding: '0 20px',
        borderRight: '1px solid #cbd5e1',
        backgroundColor: '#F5F7FA',
        color: '#00B3A4',
        cursor: 'pointer',
        fontWeight: 'normal',
        fontSize: '15px',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        transition: 'background-color 0.3s ease',
    };

    const fileNameDisplayStyle = {
        padding: '0 16px',
        backgroundColor: 'white',
        flexGrow: 1,
        fontSize: '15px',
        color: '#64748b',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    };

    const submitButtonStyle = {
        padding: '0 30px',
        border: 'none',
        borderRadius: '8px',
        background: file ? "#00B3A4" : "#e2e8f0",
        color: 'white',
        cursor: file ? 'pointer' : 'not-allowed',
        fontWeight: 'normal',
        marginLeft: '12px',
        fontSize: '15px',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: 'none',
    };

    const downloadButtonStyle = {
        padding: '8px 20px',
        border: '1px solid #00B3A4',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#00B3A4',
        cursor: 'pointer',
        fontWeight: 'normal',
        fontSize: '15px'
    };

    return (
        <div>
            <p style={{ fontSize: '15px' }}>Use this option to onboard multiple employees by uploading a spreadsheet. **Mandatory fields are marked with \***</p>

            {/* File Chooser and Submit Button Group */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0 0 0' }}>
                <div
                    id="file-input-container"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0px',
                        width: '450px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'border-color 0.3s ease',
                        background: '#fff',
                    }}>
                    <div style={customChooseButtonStyle}
                        onClick={() => fileInputRef.current?.click()}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}>
                        Choose File
                    </div>
                    <span className="file-name-display" style={fileNameDisplayStyle}>
                        {file ? file.name : 'No file chosen'}
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .csv"
                        onChange={handleFileChange}
                        style={hiddenFileInputStyle}
                    />
                </div>

                <button
                    onClick={handleUpload}
                    style={submitButtonStyle}
                    disabled={!file}>
                    Submit
                </button>
            </div>

            <p style={{ fontSize: '15px', color: '#666', marginTop: '10px' }}>Supported file formats: **XLSX, CSV** (Max 5MB)</p>

            <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <p style={{ fontWeight: 'normal', marginBottom: '10px', fontSize: '15px' }}>Need the correct format?</p>
                <button onClick={handleDownloadTemplate} style={downloadButtonStyle}>
                    Download Onboarding Template
                </button>
                <p style={{ fontSize: '15px', color: '#999', marginTop: '5px' }}>The template includes all required fields with expected column names.</p>
            </div>
        </div>
    );
};
// --- OnBoarding Component (Main) (Modified for clean props) ---

function OnBoarding() {
    const [activeTab, setActiveTab] = useState('single');


    const tabContainerStyle = {
        display: 'flex',
        gap: '0px',
        padding: '0',
        backgroundColor: 'transparent',
        fontFamily: 'sans-serif',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        width: '100%',
        marginBottom: '20px',
    };

    const tabStyle = (tabName) => ({
        cursor: 'pointer',
        padding: '12px 45px',
        fontSize: '15px',
        backgroundColor: activeTab === tabName ? '#1F6FEB' : '#0B3D91',
        border: 'none',
        color: '#fff',
        fontWeight: 'normal',
        transition: 'all 0.3s ease',
        borderTopLeftRadius: tabName === 'single' ? '8px' : '0px',
        borderBottomLeftRadius: tabName === 'single' ? '8px' : '0px',
        borderTopRightRadius: tabName === 'bulk' ? '8px' : '0px',
        borderBottomRightRadius: tabName === 'bulk' ? '8px' : '0px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    });


    return (
        <Sidebar>
            <div style={{
                padding: '24px',
                background: '#fff',
                minHeight: '100vh',
            }}>
                <h2 style={{
                    color: '#1F2937',
                    fontSize: '30px',
                    fontWeight: 'normal',
                    marginBottom: '8px',
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    Employee Onboarding
                </h2>
                <div style={{
                    color: '#00B3A4',
                    fontSize: '15px',
                    fontWeight: 'normal',
                    marginBottom: '24px',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    Manage employee onboarding details and information seamlessly.
                </div>
                <div style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '0px',
                    boxShadow: 'none',
                    overflow: 'hidden'
                }}>
                    <div style={tabContainerStyle}>
                        <button
                            style={tabStyle('single')}
                            onClick={() => setActiveTab('single')}
                        >
                            Single Entry
                        </button>
                        <button
                            style={tabStyle('bulk')}
                            onClick={() => setActiveTab('bulk')}
                        >
                            Bulk Entry
                        </button>

                    </div>

                    <div style={{ padding: '0.75rem 0', fontFamily: 'sans-serif' }}>
                        {activeTab === 'single' && (
                            <SingleEntry />
                        )}
                        {activeTab === 'bulk' && (
                            <BulkEntry />
                        )}
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}

export default OnBoarding;
