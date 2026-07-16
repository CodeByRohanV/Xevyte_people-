import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./Sidebar";
import api from "../api";
import { format } from "date-fns";
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import './Leave.css';
import './ProfileSettings.css';

import { useParams } from 'react-router-dom';

registerLocale('en-GB', enGB);
// SmartDatePicker component matching onboarding/Leaves calendar
const SmartDatePicker = (props) => {
    const {
        selected,
        onChange,
        minDate,
        maxDate,
        dayClassName,
        disabled,
        selectsStart,
        selectsEnd,
        startDate,
        endDate,
        placeholderText,
        required,
        customInput
    } = props;

    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    return (
        <DatePicker
            selected={selected}
            disabled={disabled}
            onChange={(date) => {
                onChange(date);
            }}
            shouldCloseOnSelect={true}
            dateFormat="dd-MM-yyyy"
            calendarClassName="no-gap-calendar"
            wrapperClassName="full-width-picker"
            dayClassName={dayClassName}
            minDate={minDate}
            maxDate={maxDate}
            selectsStart={selectsStart}
            selectsEnd={selectsEnd}
            startDate={startDate}
            endDate={endDate}
            strictParsing
            locale="en-GB"
            popperPlacement={props.popperPlacement || "bottom-start"}
            popperProps={{ strategy: "fixed" }}
            popperModifiers={props.popperModifiers}

            placeholderText={placeholderText || "DD-MM-YYYY"}
            required={required}
            customInput={customInput}
            portalId="root"

            renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth
            }) => {
                const months = [
                    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
                ];

                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

                return (
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

                        {/* Month Dropdown */}
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

                        {/* Year Dropdown */}
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

const ProfileSettingsPage = () => {
    const [esiPfType, setEsiPfType] = useState('PF');
    const [bankDetailsLocked, setBankDetailsLocked] = useState(false);
    const loggedInEmployeeId = sessionStorage.getItem("employeeId");
    const { employeeId: urlEmployeeId } = useParams();
    const employeeId = urlEmployeeId || loggedInEmployeeId;
    const getDisplayEmployeeId = (id) => {
        if (!id) return "";
        if (id.includes('_')) return id.split('_').pop();
        if (id.includes('-')) return id.split('-').pop();
        return id;
    };
    const token = sessionStorage.getItem("token");
    const employeeName = sessionStorage.getItem("employeeName") || "User";
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [pickerMode, setPickerMode] = useState("day");
    const tabsRef = useRef(null);



    const scrollTabs = (direction) => {
        if (tabsRef.current) {
            const scrollAmount = 150;
            tabsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
        }
    };
    const [activeTab, setActiveTab] = useState("Personal Info");
    const [successMessage, setSuccessMessage] = useState("");
    // Check if the logged-in user is viewing their own profile
    const isOwnProfile = !urlEmployeeId || urlEmployeeId === loggedInEmployeeId;

    const [profilePic, setProfilePic] = useState(
        sessionStorage.getItem("employeeProfilePic") || ""
    );
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const [errorMessage, setErrorMessage] = useState(""); // Added for general errors
    const [loading, setLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState({
        firstName: "",
        lastName: "",
        contactNo: "",
        aadharNo: "",
        panNo: "",
        address: "",
        presentAddress: "",
        emergencyContactNumber: "",
        personalMail: "",
        dateOfBirth: "",
        gender: "",

        bloodGroup: "",
        // Employment Fields
        designation: "",
        workEmail: "",
        dateOfJoining: "",
        workLocation: "",
        // --- NEW Bank Details Fields ---
        accountHolderName: "", // New Field
        bankName: "",           // New Field
        bankAccountNumber: "", // New Field
        bankIfscCode: "",        // New Field
        uanNumber: "",         // New Field
        pfMemberId: "",        // New Field
        esiNumber: "",         // New Field
        esiDispensary: "",     // New Field
    });

    // Store original data to check for contact details changes
    const [originalEmployeeData, setOriginalEmployeeData] = useState({});
    const [nominees, setNominees] = useState([]);
    const [existingNominees, setExistingNominees] = useState([]);
    const relationshipOptions = ["Spouse", "Child1", "Child2"];
    // --- Format Aadhaar as XXXX XXXX XXXX ---
    const formatAadhaar = (value) => {
        const digits = value.replace(/\D/g, "").substring(0, 12);
        return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    };


    // --- NEW: Handler for ESI/PF dropdown change ---
    const handleEsiPfChange = (e) => {
        setEsiPfType(e.target.value);
    };

    const handleCancelEdit = () => {
        setEmployeeData(originalEmployeeData); // revert values
        setIsEditingContact(false);
    };


    // --- Nominee Data Fetching Function (integrated and memoized with useCallback) ---
    const fetchNominees = useCallback(async () => {
        if (!employeeId || !token) return;

        setLoading(true);
        try {
            const rawToken = token.startsWith('"') && token.endsWith('"') ? token.slice(1, -1) : token;
            const { data } = await api.get(
                `/employees/${employeeId}/insurance-nominees`,
                { headers: { Authorization: `Bearer ${rawToken}` } }
            );
            // Assuming the token validation and slicing is handled in the main useEffect for employee data or can be handled here.
            setExistingNominees(data || []);
        } catch (err) {
            console.error("Failed to fetch insurance nominees:", err);
            // Optionally set a specific error for nominees
        } finally {
            setLoading(false);
        }
    }, [employeeId, token]);


    // --- Nominee Input & Row Handlers (integrated) ---

    // Handle input change for dynamic nominee rows
    const handleNomineeInputChange = (index, field, value) => {
        const updatedNominees = [...nominees];
        updatedNominees[index][field] = value;
        setNominees(updatedNominees);
        setErrorMessage(""); // Clear error on change
    };

    // Add new empty nominee row
    const addNewNomineeRow = () => {
        if (existingNominees.length + nominees.length >= relationshipOptions.length) {
            setErrorMessage("cannot add dependencies....");
            return;
        }
        setNominees([
            ...nominees,
            { nomineeName: "", relationship: "", dateOfBirth: null, pickerMode: "day" }
        ]);
        setErrorMessage("");
    };

    // Remove new nominee row
    const removeNomineeRow = (index) => {
        if (nominees.length > 0) {
            const updatedNominees = nominees.filter((_, i) => i !== index);
            setNominees(updatedNominees);
        }
        setErrorMessage("");
    };

    // --- Nominee Submission Logic (integrated) ---

    const handleNomineeSubmit = async () => {
        if (!employeeId || !token) {
            setErrorMessage("Missing employeeId or token. Please log in again.");
            return;
        }

        const rawToken = token.startsWith('"') && token.endsWith('"') ? token.slice(1, -1) : token;
        const authHeader = `Bearer ${rawToken}`;

        const nomineesToProcess = nominees.filter(n =>
            n.nomineeName || n.relationship || n.dateOfBirth
        );

        if (nomineesToProcess.length === 0) {
            setErrorMessage("Please fill in at least one complete nominee row to submit.");
            return;
        }

        // Validation
        for (let i = 0; i < nomineesToProcess.length; i++) {
            const nomineeData = nomineesToProcess[i];
            const { nomineeName, relationship, dateOfBirth } = nomineeData;

            if (!nomineeName || !relationship || !dateOfBirth) {
                const originalIndex = nominees.findIndex(n => n === nomineeData) + 1;
                setErrorMessage(`Please fill all fields for nominee row #${originalIndex}`);
                return;
            }
        }

        setLoading(true);
        setErrorMessage("");

        try {
            // Prepare payload
            const payload = nomineesToProcess.map((n) => ({
                nomineeName: n.nomineeName,
                relationship: n.relationship,
                dateOfBirth: format(n.dateOfBirth, "yyyy-MM-dd"),
            }));

            // Send requests sequentially
            for (const nominee of payload) {
                await api.post(
                    `/employees/${employeeId}/insurance-nominees`,
                    nominee,
                    { headers: { Authorization: authHeader } }
                );
            }

            setSuccessMessage(`${payload.length} Nominee(s) added successfully!`);
            setTimeout(() => setSuccessMessage(""), 3000);

            // Reset new nominees form and refresh existing list
            setNominees([]);
            await fetchNominees();

        } catch (err) {
            console.error("Error saving nominees:", err);
            setErrorMessage("Error saving nominees. Please check your data and try again.");
        } finally {
            setLoading(false);
        }
    };

    // Combine existing and new nominee relationships to prevent duplicates
    const usedRelationships = [
        ...existingNominees.map(n => n.relationship),
        ...nominees.map(n => n.relationship)
    ].filter(Boolean);




    // --- NEW: Render function for Insurance Details (formerly InsuranceNomineeDetails component) ---
    const renderInsuranceDetails = () => {
        // Renders a read-only row for existing nominees
        const renderExistingRow = (nominee) => (
            <tr key={nominee.id} style={styles.existingRow}>
                <td style={styles.td}>{nominee.nomineeName}</td>
                <td style={styles.td}>{nominee.relationship}</td>
                <td style={styles.td}>
                    {nominee.dateOfBirth && !isNaN(new Date(nominee.dateOfBirth).getTime())
                        ? format(new Date(nominee.dateOfBirth), "dd-MM-yyyy")
                        : ""}

                </td>
                <td style={styles.tdAction}>
                    <span style={{ color: '#aaa' }}>Saved</span>
                </td>
            </tr>
        );

        // Renders an editable row for new nominees
        const renderNewRow = (nominee, index) => (
            <tr key={`new-${index}`} style={styles.newRow}>
                <td style={styles.td}>
                    <input
                        type="text"
                        value={nominee.nomineeName}
                        onChange={(e) => handleNomineeInputChange(index, "nomineeName", e.target.value)}
                        placeholder="Full Name"
                        style={styles.inputField}
                        disabled={loading}
                    />
                </td>
                <td style={styles.td}>
                    <select
                        value={nominee.relationship}
                        onChange={(e) => handleNomineeInputChange(index, "relationship", e.target.value)}
                        style={styles.selectField}
                        disabled={loading}
                    >
                        <option value="">Select Relationship</option>
                        {relationshipOptions.map((rel) => {
                            // Allow re-selecting the same relationship if it's already chosen in this row
                            const isUsed =
                                usedRelationships.includes(rel) && rel !== nominee.relationship;

                            return (
                                <option key={rel} value={rel} disabled={isUsed}>
                                    {rel} {isUsed ? " (Already selected)" : ""}
                                </option>
                            );
                        })}
                    </select>

                </td>
                <td style={styles.td}>
                    <SmartDatePicker
                        selected={nominee.dateOfBirth && !isNaN(new Date(nominee.dateOfBirth).getTime()) ? new Date(nominee.dateOfBirth) : null}
                        onChange={(date) => {
                            handleNomineeInputChange(index, "dateOfBirth", date);
                        }}
                        placeholderText="DD-MM-YYYY"
                        minDate={null}
                        maxDate={new Date()}
                        popperPlacement="bottom-end"
                    />


                </td>
                <td style={styles.tdAction}>
                    {nominees.length > 0 ? (
                        <button
                            onClick={() => removeNomineeRow(index)}
                            disabled={loading}
                            style={styles.removeButton}
                            title="Remove this row"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = styles.removeButtonHover.backgroundColor;
                                e.currentTarget.style.transform = styles.removeButtonHover.transform;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = styles.removeButton.backgroundColor;
                                e.currentTarget.style.transform = "none";
                            }}
                        >
                            <i className="bi bi-trash" style={{ fontSize: "1.1rem" }} />
                        </button>
                    ) : (
                        <span style={{ color: '#ccc' }}>—</span>
                    )}
                </td>
            </tr>
        );

        return (
            <div style={{ marginTop: '20px', display: 'block', width: '100%' }}>
                {errorMessage && <div style={styles.errorText}>🚨 {errorMessage}</div>}
                {successMessage && <div style={styles.successText}>✅ {successMessage}</div>}

                {loading && existingNominees.length === 0 && nominees.length === 0 ? (
                    <p>Loading nominee data...</p>
                ) : (
                    // Add this wrapper div for horizontal scrolling
                    <div className="table-container">
                        <table className="insurance-table">


                            <thead>
                                <tr style={styles.headerRow}>
                                    <th style={styles.th}>Full Name</th>
                                    <th style={styles.th}>Relationship</th>
                                    <th style={styles.th}>Date of Birth</th>
                                    <th style={styles.thAction}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {existingNominees.map(renderExistingRow)}
                                {nominees.map(renderNewRow)}
                                {existingNominees.length === 0 && nominees.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '10px', color: '#666', borderBottom: '1px solid #eee', fontSize: '15px' }}>
                                            No Dependents recorded. Click "Add Dependent" to begin.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={styles.buttonContainer}>
                    <button
                        onClick={addNewNomineeRow}
                        disabled={!isOwnProfile || loading || (existingNominees.length + nominees.length >= relationshipOptions.length)}
                        style={{
                            ...styles.addButton,
                            opacity: (existingNominees.length + nominees.length >= relationshipOptions.length) ? 0.5 : 1,
                            cursor: (isOwnProfile && !(existingNominees.length + nominees.length >= relationshipOptions.length)) ? 'pointer' : 'not-allowed'
                        }}
                        title={existingNominees.length + nominees.length >= relationshipOptions.length ? "cannot add dependencies...." : ""}
                        onMouseEnter={(e) => {
                            if (existingNominees.length + nominees.length >= relationshipOptions.length) {
                                setErrorMessage("cannot add dependencies....");
                            } else if (isOwnProfile && !loading) {
                                e.currentTarget.style.background = '#00B3A4';
                                e.currentTarget.style.color = '#FFFFFF';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (existingNominees.length + nominees.length >= relationshipOptions.length) {
                                setErrorMessage(prev => prev === "cannot add dependencies...." ? "" : prev);
                            }
                            e.currentTarget.style.background = styles.addButton.background;
                            e.currentTarget.style.color = styles.addButton.color;
                        }}
                    >
                        + Add Dependent
                    </button>
                    <button
                        onClick={handleNomineeSubmit}
                        disabled={!isOwnProfile || loading || nominees.length === 0 || nominees.every(n => !n.nomineeName && !n.relationship && !n.dateOfBirth)}
                        style={{ ...styles.submitButton, cursor: isOwnProfile ? 'pointer' : 'not-allowed' }}
                        onMouseEnter={(e) => {
                            if (isOwnProfile && !loading && nominees.length > 0) {
                                e.currentTarget.style.background = '#00B3A4';
                                e.currentTarget.style.color = '#FFFFFF';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = styles.submitButton.background;
                            e.currentTarget.style.color = styles.submitButton.color;
                        }}
                    >
                        {loading ? "Submitting..." : `Submit Dependents (${nominees.filter(n => n.nomineeName || n.relationship || n.dateOfBirth).length})`}
                    </button>
                </div>
            </div>
        );

    };





    // --- STYLES (Updated with Teal Theme) ---
    const styles = {
        errorText: {
            color: "#721c24",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontWeight: "bold"
        },
        successText: {
            color: "#155724",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontWeight: "bold"
        },
        table: {
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            marginBottom: "1rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: 'hidden',
        },
        headerRow: {
            background: '#629af1',
            color: 'white'
        },
        th: {
            padding: "12px 10px",
            textAlign: "left",
            borderBottom: "1px solid #629af1",
            background: '#629af1',
            color: "white"
        },
        thAction: {
            padding: "12px 20px",
            textAlign: "right",
            width: '100px',
            borderBottom: "1px solid #629af1",
            background: '#629af1',
            color: "white"
        },
        td: {
            padding: "8px 8px",
            borderBottom: "1px solid #eee",
            verticalAlign: 'middle',
        },
        tdAction: {
            padding: "8px 20px",
            borderBottom: "1px solid #eee",
            textAlign: "right",
            width: '100px',
        },
        existingRow: {
            backgroundColor: '#fff',
        },
        newRow: {
            backgroundColor: 'rgba(94, 234, 212, 0.05)',
        },
        inputField: {
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
            margin: 0,
            backgroundColor: '#F5F7F8',
        },
        selectField: {
            width: '100%',
            padding: '8px 32px 8px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
            margin: 0,
            appearance: 'auto',
            WebkitAppearance: 'auto',
            MozAppearance: 'auto',
            backgroundColor: '#F5F7F8',
            backgroundImage: 'none',
        },
        removeButton: {
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            border: 'none',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            cursor: 'pointer',
            padding: '0',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
        },
        removeButtonHover: {
            backgroundColor: '#fecaca',
            transform: 'scale(1.1)',
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '30px',
            marginBottom: '2rem',
        },
        addButton: {
            background: '#FFFFFF',
            color: "#00B3A4",
            border: "1.5px solid #00B3A4",
            padding: "10px 18px",
            cursor: "pointer",
            borderRadius: "8px",
            fontSize: '15px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
        },
        submitButton: {
            background: '#FFFFFF',
            color: "#00B3A4",
            border: "1.5px solid #00B3A4",
            padding: "10px 18px",
            cursor: "pointer",
            borderRadius: "8px",
            fontSize: '15px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
        },
    };


    // --- Fetch employee data (Updated to include new fields) ---
    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!employeeId) return;

            try {
                let rawToken = sessionStorage.getItem("token");
                if (!rawToken) {
                    alert("Authentication token not found. Please log in again.");
                    return;
                }

                if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
                    rawToken = rawToken.slice(1, -1);
                }

                const authHeader = `Bearer ${rawToken}`;

                const { data } = await api.get(`/employees/${employeeId}`, {
                    headers: { Authorization: authHeader },
                });


                const formattedData = {
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    contactNo: data.contactNo || "",
                    aadharNo: formatAadhaar(data.aadharNo || ""),
                    panNo: data.panNo || "",
                    address: data.address || "",
                    presentAddress: data.presentAddress || "",

                    emergencyContactNumber: data.emergencyContactNumber || "",
                    personalMail: data.personalMail || "",
                    dateOfBirth: data.dateOfBirth && !isNaN(new Date(data.dateOfBirth).getTime())
                        ? format(new Date(data.dateOfBirth), "dd-MM-yyyy")
                        : "",

                    gender: data.gender || "",
                    bloodGroup: data.bloodGroup || "",
                    // Employment Fields
                    designation: data.role || "N/A",
                    workEmail: data.email || "N/A",
                    dateOfJoining: data.joiningDate && !isNaN(new Date(data.joiningDate).getTime())
                        ? format(new Date(data.joiningDate), "dd-MM-yyyy")
                        : "N/A",

                    workLocation: data.workLocation || "N/A",
                    // --- NEW Bank Details Fields from API ---
                    accountHolderName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
                    bankName: data.bankName || "",
                    bankAccountNumber: data.bankAccountNumber || "",
                    bankIfscCode: data.bankIfscCode || "",
                    uanNumber: data.uanNumber || "",
                    pfMemberId: data.pfMemberId || "",
                    esiNumber: data.esiNumber || "",
                    esiDispensary: data.esiDispensary || "",
                };

                setEmployeeData(formattedData);
                setOriginalEmployeeData(formattedData);

                const allFieldsFilled =
                    formattedData.bankAccountNumber &&
                    formattedData.bankIfscCode &&
                    formattedData.uanNumber &&
                    formattedData.pfMemberId &&
                    formattedData.esiNumber &&
                    formattedData.esiDispensary;
                setBankDetailsLocked(!!allFieldsFilled);
                // Set initial esiPfType based on data if available, defaulting to 'PF'
                if (data.esiNumber) {
                    setEsiPfType('ESI');
                } else {
                    setEsiPfType('PF');
                }


                if (data.profilePic) setProfilePic(data.profilePic);

                // --- PAIRED CHECK: Call fetchNominees here as well since this appears to be the active useEffect ---
                fetchNominees();

            } catch (err) {
                console.error("Failed to load employee profile:", err);
                alert("Failed to load profile data");
            }
        };

        fetchEmployeeData();
    }, [employeeId, fetchNominees]);

    const handleSaveBankDetails = async () => {
        // --- Mandatory bank fields ---
        if (!employeeData.accountHolderName.trim()) {
            alert("Account Holder Name is required.");
            return;
        }
        if (!employeeData.bankName || !employeeData.bankName.trim()) {
            alert("Bank Name is required.");
            return;
        }
        if (!employeeData.bankAccountNumber.trim()) {
            alert("Bank Account Number is required.");
            return;
        }
        if (!employeeData.bankIfscCode.trim()) {
            alert("Bank IFSC Code is required.");
            return;
        }

        // ✅ PF VALIDATION (if user enters anything in PF)
        if (
            employeeData.uanNumber.trim() ||
            employeeData.pfMemberId.trim()
        ) {
            if (!employeeData.uanNumber.trim()) {
                alert("UAN Number is required.");
                return;
            }
            if (!employeeData.pfMemberId.trim()) {
                alert("PF Member ID is required.");
                return;
            }
        }

        // ✅ ESI VALIDATION (if user enters anything in ESI)
        if (
            employeeData.esiNumber.trim() ||
            employeeData.esiDispensary.trim()
        ) {
            if (!employeeData.esiNumber.trim()) {
                alert("ESI Number is required.");
                return;
            }
            if (!employeeData.esiNumber.match(/^\d{10}$/)) {
                alert("ESI Number must contain exactly 10 digits.");
                return;
            }
            if (!employeeData.esiDispensary.trim()) {
                alert("ESI Dispensary is required.");
                return;
            }
        }


        // --- Bank-specific validations ---
        if (!employeeData.bankAccountNumber.match(/^\d{1,50}$/)) {
            alert("Bank Account Number must contain digits only and be up to 50 digits.");
            return;
        }
        if (!employeeData.bankIfscCode.match(/^[A-Z]{4}0[A-Z0-9]{6}$/i)) {
            alert("Bank IFSC Code format is invalid (e.g., UTIB0003311).");
            return;
        }

        // --- Prepare payload dynamically ---
        const updatePayload = {
            accountHolderName: employeeData.accountHolderName,
            bankName: employeeData.bankName?.trim() || "",
            bankAccountNumber: employeeData.bankAccountNumber,
            bankIfscCode: employeeData.bankIfscCode.toUpperCase(),
        };

        updatePayload.uanNumber = employeeData.uanNumber || "";
        updatePayload.pfMemberId = employeeData.pfMemberId || "";
        updatePayload.esiNumber = employeeData.esiNumber || "";
        updatePayload.esiDispensary = employeeData.esiDispensary || "";


        // --- Send update request ---
        try {
            const rawToken = sessionStorage.getItem("token");
            if (!rawToken) return alert("Authentication token not found. Please log in again.");

            const token = rawToken.replace(/^"|"$/g, "");
            await api.put(`/employees/${employeeId}/bank-details`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setOriginalEmployeeData(prev => ({ ...prev, ...updatePayload }));

            // 🔒 Lock only if ALL fields are now entered
            const allFieldsNowFilled =
                updatePayload.bankAccountNumber &&
                updatePayload.bankIfscCode &&
                updatePayload.uanNumber &&
                updatePayload.pfMemberId &&
                updatePayload.esiNumber &&
                updatePayload.esiDispensary;

            setBankDetailsLocked(!!allFieldsNowFilled);

            setSuccessMessage("Bank and statutory details updated successfully! 💳");
            setTimeout(() => setSuccessMessage(""), 1500);
        } catch (err) {
            console.error("Error saving bank details:", err);
            alert("Error saving bank details.");
        }
    };





    // --- Handle Input Changes with validation (Expanded to include Bank Details validation) ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        switch (name) {
            case "contactNo":
            case "emergencyContactNumber":
                newValue = newValue.replace(/\D/g, "").substring(0, 10);
                break;
            case "personalMail":
                newValue = newValue.toLowerCase();
                break;
            case "bankAccountNumber":
                newValue = newValue.replace(/\D/g, "").substring(0, 50); // Only digits, max 50
                break;
            case "bankIfscCode":
                newValue = newValue.toUpperCase();
                newValue = newValue.replace(/[^A-Z0-9]/g, ""); // Allow only alphanumeric
                break;
            case "uanNumber":
                newValue = newValue.replace(/\D/g, "").substring(0, 12); // UAN is 12 digits
                break;
            case "esiNumber":
                newValue = newValue.replace(/\D/g, "").substring(0, 10); // ESI is 10 digits
                break;
            case "pfMemberId":
            case "accountHolderName":
            case "bankName":
            case "esiDispensary":
            case "address":
            default:
                // No specific validation/formatting needed for others
                break;
        }

        setEmployeeData((prev) => ({ ...prev, [name]: newValue }));
    };

    const handleSaveDetails = async () => {
        const changed =
            employeeData.contactNo !== originalEmployeeData.contactNo ||
            employeeData.personalMail !== originalEmployeeData.personalMail ||
            employeeData.emergencyContactNumber !== originalEmployeeData.emergencyContactNumber ||
            employeeData.address !== originalEmployeeData.address ||
            employeeData.presentAddress !== originalEmployeeData.presentAddress;

        if (!changed) {
            setSuccessMessage("No contact details changes to save.");
            setTimeout(() => setSuccessMessage(""), 1500);
            return;
        }

        // ✅ Validations (only if value is entered)
        if (employeeData.contactNo && employeeData.contactNo.length !== 10) {
            alert("Contact number must be 10 digits.");
            return;
        }

        if (
            employeeData.emergencyContactNumber &&
            employeeData.emergencyContactNumber.length !== 10
        ) {
            alert("Emergency contact number must be 10 digits.");
            return;
        }

        if (
            employeeData.personalMail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeData.personalMail)
        ) {
            alert("Personal Mail ID format is invalid.");
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }

            const authHeader = token.startsWith('"') && token.endsWith('"')
                ? `Bearer ${token.slice(1, -1)}`
                : `Bearer ${token}`;

            // ✅ ONLY contact-related fields (THIS IS THE FIX)
            const updatePayload = {
                contactNo: employeeData.contactNo || null,
                personalMail: employeeData.personalMail || null,
                emergencyContactNumber: employeeData.emergencyContactNumber || null,
                address: employeeData.address || null,
                presentAddress: employeeData.presentAddress || null,
            };

            await api.put(
                `/employees/${employeeId}`,
                updatePayload,
                { headers: { Authorization: authHeader } }
            );

            // ✅ Sync original state
            setOriginalEmployeeData(prev => ({
                ...prev,
                ...updatePayload,
            }));

            setIsEditingContact(false);

            setSuccessMessage("Contact details updated successfully! 📞");
            setTimeout(() => setSuccessMessage(""), 1500);

        } catch (err) {
            console.error("Error saving contact details:", err);
            alert("Error saving contact details. Please try again.");
        }
    };



    // --- Handle Save for Personal Info Tab (Picture only) ---
    const handleSavePicture = async () => {
        if (!selectedFile) {
            setSuccessMessage("No changes to save.");
            setTimeout(() => setSuccessMessage(""), 1500);
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            if (!token) return alert("Authentication token not found. Please log in again.");

            const authHeader = token.startsWith('"') && token.endsWith('"')
                ? `Bearer ${token.slice(1, -1)}`
                : `Bearer ${token}`;

            const formData = new FormData();
            formData.append("firstName", employeeData.firstName);
            formData.append("lastName", employeeData.lastName);
            formData.append("profilePic", selectedFile);

            const uploadRes = await api.put(
                `/profile/update/${employeeId}`,
                formData,
                { headers: { Authorization: authHeader, "Content-Type": "multipart/form-data" } }
            );

            if (uploadRes.data.profilePic) {
                sessionStorage.setItem("employeeProfilePic", uploadRes.data.profilePic);
                setProfilePic(uploadRes.data.profilePic);
                window.dispatchEvent(new Event("profilePicUpdated"));
            }

            setSuccessMessage("Profile picture updated successfully! 👍");
            setSelectedFile(null);
            setTimeout(() => setSuccessMessage(""), 1500);
        } catch (err) {
            console.error("Error saving profile picture:", err);
            alert("Error saving profile picture.");
        }
    };

    const handleDeletePicture = async () => {
        if (!window.confirm("Are you sure you want to remove your profile picture?")) return;

        try {
            const token = sessionStorage.getItem("token");
            if (!token) return alert("Authentication token not found. Please log in again.");

            const authHeader = token.startsWith('"') && token.endsWith('"')
                ? `Bearer ${token.slice(1, -1)}`
                : `Bearer ${token}`;

            await api.put(`/profile/remove-picture/${employeeId}`, {}, {
                headers: { Authorization: authHeader }
            });

            sessionStorage.removeItem("employeeProfilePic");
            setProfilePic("");
            window.dispatchEvent(new Event("profilePicUpdated"));
            setSuccessMessage("Profile picture removed successfully! 🗑️");
            setTimeout(() => setSuccessMessage(""), 1500);
        } catch (err) {
            console.error("Error deleting profile picture:", err);
            alert("Error deleting profile picture.");
        }
    };

    // --- Handle Image Selection (Preview only) ---
    const triggerFileInputClick = () =>
        fileInputRef.current && fileInputRef.current.click();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("File size exceeds 2MB limit.");
            setSelectedFile(null);
            return;
        }
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            alert("Only JPG and PNG formats are supported.");
            setSelectedFile(null);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePic(reader.result);
            setSelectedFile(file);
        };
        reader.readAsDataURL(file);
    };

    const tabContainerStyle = {
        display: "flex",
        gap: "0",
        padding: "0",
        background: "transparent",
        borderRadius: "8px",
        fontFamily: "inherit",
        overflowX: "auto",
        whiteSpace: "nowrap",
        WebkitOverflowScrolling: "touch",
        marginBottom: "1.5rem",
    };
    const tabStyle = (tabName) => ({
        cursor: "pointer",
        padding: "0.75rem 1.5rem",
        fontSize: "0.9375rem",
        border: "none",
        background: activeTab === tabName
            ? "#1F6FEB"
            : "#0B3D91",
        color: "white",
        fontWeight: activeTab === tabName ? "600" : "500",
        borderRadius: "8px",
        transition: "all 0.3s ease",
        flex: "0 0 auto",
    });










    const tabHeaders = {
        "Personal Info": {
            title: "Basic Information & ID Proofs",
            description: "View your core details. Only the profile picture is editable here."
        },
        "Contact Details": {
            title: "Contact Details",
            description: "Update your current contact information and residential address."
        },
        "Employment": {
            title: "Employment Details",
            description: "View your organizational and job information."
        },
        "Bank Details": {
            title: "Bank Details",
            description: "Update your salary disbursement and statutory details."
        },
        "Insurance Details": {
            title: "Insurance Details",
            description: "Update the nominee details for your company-provided health insurance."
        }
    };

    const inputStyle = (readOnly) => ({
        width: "100%",
        paddingTop: "0.875rem",
        paddingRight: "0.5rem",
        paddingBottom: "0.875rem",
        paddingLeft: "0.75rem",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "0.9375rem",
        color: readOnly ? "#64748b" : "#0f172a",
        backgroundColor: "#F5F7F8",
        cursor: readOnly ? "not-allowed" : "text",
        marginBottom: "6px",
        boxShadow: "none",
        transition: "all 0.3s ease",
        fontFamily: "'Inter', sans-serif",
        boxSizing: "border-box",
        margin: 0,
        textIndent: "0px",
        textAlign: "left",
    });








    const labelStyle = {
        display: "block",
        marginBottom: "0px",
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        fontWeight: "normal",
        fontSize: "15px",
        textTransform: 'none',
    };


    // --- Personal Info Tab (Read-Only fields + Profile Picture Edit) ---
    const renderPersonalInformation = () => (
        <div style={{ padding: "1rem 0", display: "block", width: "100%" }}>
            <div className="profile-picture-section">
                <div
                    style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        background: profilePic && (profilePic.includes("data:image") || !profilePic.includes("OIP.jpg")) ? "none" : "linear-gradient(135deg, #0bc5b0 0%, #0891b2 100%)",
                        backgroundColor: "#eaeaea",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        fontWeight: "bold",
                        fontSize: "26px",
                        color: "#ffffff",
                        flexShrink: 0
                    }}
                >
                    {profilePic && (profilePic.includes("data:image") || !profilePic.includes("OIP.jpg")) ? (
                        <img
                            src={profilePic}
                            alt="Profile"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <span style={{ fontSize: '2.5rem', color: '#ffffff', fontWeight: '700' }}>
                            {employeeData.firstName ? employeeData.firstName.trim().charAt(0).toUpperCase() : 'U'}
                        </span>
                    )}
                </div>

                <div>
                    {!selectedFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                onClick={triggerFileInputClick}
                                disabled={!isOwnProfile}
                                style={{
                                    background: "#FFFFFF",
                                    color: "#00B3A4",
                                    border: "1.5px solid #00B3A4",
                                    padding: "0.6rem 1.25rem",
                                    borderRadius: "8px",
                                    cursor: isOwnProfile ? "pointer" : "not-allowed",
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (isOwnProfile) {
                                        e.currentTarget.style.background = '#00B3A4';
                                        e.currentTarget.style.color = '#FFFFFF';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isOwnProfile) {
                                        e.currentTarget.style.background = '#FFFFFF';
                                        e.currentTarget.style.color = '#00B3A4';
                                    }
                                }}
                            >
                                Choose Photo
                            </button>

                            {profilePic && !profilePic.includes("OIP.jpg") && isOwnProfile && (
                                <button
                                    onClick={handleDeletePicture}
                                    title="Remove current profile picture"
                                    style={{
                                        background: "#fee2e2",
                                        color: "#ef4444",
                                        border: "none",
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.3s ease",
                                        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.1)",
                                    }}
                                >
                                    <i className="bi bi-trash" style={{ fontSize: '1.1rem' }}></i>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                                onClick={handleSavePicture}
                                style={{
                                    background: "#FFFFFF",
                                    color: "#00B3A4",
                                    border: "1.5px solid #00B3A4",
                                    padding: "0.6rem 1.25rem",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#00B3A4';
                                    e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#FFFFFF';
                                    e.currentTarget.style.color = '#00B3A4';
                                }}
                            >
                                Update
                            </button>

                            <button
                                title="Cancel selection"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setProfilePic(sessionStorage.getItem("employeeProfilePic") || "");
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                style={{
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                    border: "none",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    )}
                    <p style={{ marginTop: '8px', fontSize: '15px', color: '#1F2937' }}>JPG or PNG, up to 2MB</p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg, image/png"
                style={{ display: "none" }}
                onChange={handleImageChange}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                    <label style={labelStyle}>First Name</label>
                    <input name="firstName" value={employeeData.firstName} style={inputStyle(true)} readOnly />
                </div>
                <div>
                    <label style={labelStyle}>Last Name</label>
                    <input name="lastName" value={employeeData.lastName} style={inputStyle(true)} readOnly />
                </div>
                <div>
                    <label style={labelStyle}>Date of Birth <span style={{ color: 'red' }}>*</span></label>
                    <input name="dateOfBirth" value={employeeData.dateOfBirth || ""} style={inputStyle(true)} readOnly />
                </div>
                <div>
                    <label style={labelStyle}>Aadhaar No</label>
                    <input name="aadharNo" value={employeeData.aadharNo} style={inputStyle(true)} readOnly />
                </div>
                <div>
                    <label style={labelStyle}>Pan No</label>
                    <input name="panNo" value={employeeData.panNo} style={inputStyle(true)} readOnly />
                </div>
                <div>
                    <label style={labelStyle}>Gender</label>
                    <input name="gender" value={employeeData.gender} style={inputStyle(true)} readOnly />
                </div>
                <div>
                    <label style={labelStyle}>Blood Group</label>
                    <input name="bloodGroup" value={employeeData.bloodGroup} style={inputStyle(true)} readOnly />
                </div>
            </div>
        </div>
    );
    const renderContactDetails = () => {
        const isChanged =
            employeeData.contactNo !== originalEmployeeData.contactNo ||
            employeeData.personalMail !== originalEmployeeData.personalMail ||
            employeeData.emergencyContactNumber !== originalEmployeeData.emergencyContactNumber ||
            employeeData.address !== originalEmployeeData.address ||
            employeeData.presentAddress !== originalEmployeeData.presentAddress;

        return (
            <div style={{ padding: "1rem 0", display: "block", width: "100%" }}>
                {/* Title and description moved to global header above tabs */}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                    <div>
                        <label style={labelStyle}>Contact No</label>
                        <input
                            name="contactNo"
                            value={employeeData.contactNo}
                            onChange={handleInputChange}
                            style={inputStyle(!isEditingContact)}
                            placeholder="10 digits"
                            readOnly={!isEditingContact}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Emergency Contact</label>
                        <input
                            name="emergencyContactNumber"
                            value={employeeData.emergencyContactNumber}
                            onChange={handleInputChange}
                            style={inputStyle(!isEditingContact)}
                            placeholder="10 digits"
                            readOnly={!isEditingContact}
                        />
                    </div>



                    <div>
                        <label style={labelStyle}>Permanent Address</label>
                        <textarea
                            name="address"
                            value={employeeData.address}
                            onChange={handleInputChange}
                            style={{
                                ...inputStyle(!isEditingContact),
                                height: "70px",
                                resize: "none",
                            }}
                            readOnly={!isEditingContact}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Present Address</label>
                        <textarea
                            name="presentAddress"
                            value={employeeData.presentAddress}
                            onChange={handleInputChange}
                            style={{
                                ...inputStyle(!isEditingContact),
                                height: "70px",
                                resize: "none",
                            }}
                            readOnly={!isEditingContact}
                        />
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                        <label style={labelStyle}>Personal Mail Id</label>
                        <input
                            name="personalMail"
                            type="email"
                            value={employeeData.personalMail}
                            onChange={handleInputChange}
                            style={inputStyle(!isEditingContact)}
                            placeholder="personal.email@example.com"
                            readOnly={!isEditingContact}
                        />
                    </div>

                </div>

                <div style={{ textAlign: "right", marginTop: "1.5rem", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    {!isEditingContact ? (
                        <button
                            onClick={() => setIsEditingContact(true)}
                            style={{
                                background: "#FFFFFF",
                                color: "#00B3A4",
                                border: "1.5px solid #00B3A4",
                                padding: "0.6rem 1.25rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "15px",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#00B3A4';
                                e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.color = '#00B3A4';
                            }}
                        >
                            Edit
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                style={{
                                    background: "#94a3b8",
                                    color: "white",
                                    border: "none",
                                    padding: "0.6rem 1.25rem",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSaveDetails}
                                disabled={!isChanged}
                                style={{
                                    background: isChanged ? "#FFFFFF" : "#f1f5f9",
                                    color: isChanged ? "#00B3A4" : "#94a3b8",
                                    border: isChanged ? "1.5px solid #00B3A4" : "1.5px solid #e2e8f0",
                                    padding: "0.6rem 1.25rem",
                                    borderRadius: "8px",
                                    cursor: isChanged ? "pointer" : "not-allowed",
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (isChanged) {
                                        e.currentTarget.style.background = '#00B3A4';
                                        e.currentTarget.style.color = '#FFFFFF';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isChanged) {
                                        e.currentTarget.style.background = '#FFFFFF';
                                        e.currentTarget.style.color = '#00B3A4';
                                    }
                                }}
                            >
                                Save Changes
                            </button>
                        </>
                    )}
                </div>

            </div>
        );
    };



    // --- New Employment Tab (Read-Only fields) ---
    const renderEmploymentDetails = () => (
        <div style={{ padding: "1rem 0", display: "block", width: "100%" }}>
            {/* Title and description moved to global header above tabs */}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Row 1: Employee ID and Designation */}
                <div>
                    <label style={labelStyle}>Employee ID</label>
                    <input
                        name="employeeId"
                        value={getDisplayEmployeeId(employeeId) || "N/A"} // Use employeeId from sessionStorage
                        style={inputStyle(true)}
                        readOnly
                    />
                </div>
                <div>
                    <label style={labelStyle}>Designation</label>
                    <input
                        name="designation"
                        value={employeeData.designation}
                        style={inputStyle(true)}
                        readOnly
                    />
                </div>

                {/* Row 2: Work Email and DOJ */}
                <div>
                    <label style={labelStyle}>Work Email</label>
                    <input
                        name="workEmail"
                        value={employeeData.workEmail}
                        style={inputStyle(true)}
                        readOnly
                    />
                </div>
                <div>
                    <label style={labelStyle}>Date of Joining</label>
                    <input
                        name="dateOfJoining"
                        value={employeeData.dateOfJoining}
                        style={inputStyle(true)}
                        readOnly
                    />
                </div>

                {/* Row 3: Work Location */}
                <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Work Location</label>
                    <input
                        name="workLocation"
                        value={employeeData.workLocation}
                        style={inputStyle(true)}
                        readOnly
                    />
                </div>
            </div>
        </div>
    );

    const renderBankDetails = () => {
        const isChanged =
            employeeData.accountHolderName !== originalEmployeeData.accountHolderName ||
            employeeData.bankName !== originalEmployeeData.bankName ||
            employeeData.bankAccountNumber !== originalEmployeeData.bankAccountNumber ||
            employeeData.bankIfscCode !== originalEmployeeData.bankIfscCode ||
            employeeData.uanNumber !== originalEmployeeData.uanNumber ||
            employeeData.pfMemberId !== originalEmployeeData.pfMemberId ||
            employeeData.esiNumber !== originalEmployeeData.esiNumber ||
            employeeData.esiDispensary !== originalEmployeeData.esiDispensary;

        return (
            <div style={{ padding: "1rem 0", display: "block", width: "100%" }}>
                {/* Title and description moved to global header above tabs */}

                {/* Bank Account Details Section */}
                <h3 style={{ marginTop: "0", marginBottom: "1rem", fontSize: "1.1rem", color: "#333" }}>
                    Account Information
                </h3>
                {/* 
                <p style={{ color: "red", fontSize: "0.9rem", marginTop: "0.25rem" }}>
  Enter the Axis Bank Detail only
</p> */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                    {/* Row 1: Account Holder Name and Bank Name */}

                    <div>
                        <label style={labelStyle}>Account Holder</label>
                        <input
                            name="accountHolderName"
                            value={employeeData.accountHolderName || ""}
                            style={inputStyle(true)}
                            placeholder="As per bank records"
                            readOnly
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Bank Name</label>
                        <input
                            name="bankName"
                            value={employeeData.bankName || ""}
                            onChange={handleInputChange}
                            style={inputStyle(!!originalEmployeeData.bankName)}
                            placeholder="Bank Name"
                            disabled={!!originalEmployeeData.bankName}
                        />
                    </div>



                    {/* Row 2: Account Number and IFSC Code */}
                    <div>
                        <label style={labelStyle}>Account Number</label>
                        <input
                            name="bankAccountNumber"
                            value={employeeData.bankAccountNumber || ""}
                            onChange={handleInputChange}
                            style={inputStyle(!!originalEmployeeData.bankAccountNumber)}
                            placeholder="Digits only"
                            disabled={!!originalEmployeeData.bankAccountNumber}
                            maxLength={50} // Allowed up to 50 digits
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Bank IFSC Code</label>
                        <input
                            name="bankIfscCode"
                            value={employeeData.bankIfscCode || ""} // removed default UTIB0 prefill
                            onChange={handleInputChange}
                            style={inputStyle(!!originalEmployeeData.bankIfscCode)}
                            placeholder="11 characters (e.g., UTIB0001234)"
                            maxLength={11}
                            disabled={!!originalEmployeeData.bankIfscCode}
                        />
                    </div>


                </div>

                {/* ESI & PF Details Section */}
                <h3 style={{ marginTop: "0.5rem", marginBottom: "1rem", fontSize: "1.1rem", color: "#333", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
                    PF & ESI Details
                </h3>
                {/* ✅ PF ROW */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>UAN Number</label>
                        <input
                            name="uanNumber"
                            value={employeeData.uanNumber || ""}
                            onChange={handleInputChange}
                            style={inputStyle(!!originalEmployeeData.uanNumber)}
                            placeholder="12 digit UAN"
                            disabled={!!originalEmployeeData.uanNumber}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>PF Member ID</label>
                        <input
                            name="pfMemberId"
                            value={employeeData.pfMemberId || ""}
                            onChange={handleInputChange}
                            style={inputStyle(!!originalEmployeeData.pfMemberId)}
                            placeholder="PF Account Number"
                            disabled={!!originalEmployeeData.pfMemberId}
                        />
                    </div>
                </div>

                {/* ✅ ESI ROW */}
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>ESI Number</label>
                        <input
                            name="esiNumber"
                            value={employeeData.esiNumber || ""}
                            onChange={handleInputChange}
                            style={inputStyle(!!originalEmployeeData.esiNumber)}
                            placeholder="ESI Insurance Number"
                            disabled={!!originalEmployeeData.esiNumber}
                            maxLength={10}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>ESI Dispensary / Clinic</label>
                        <input
                            name="esiDispensary"
                            value={employeeData.esiDispensary || ""}
                            onChange={handleInputChange}
                            style={inputStyle(!!originalEmployeeData.esiDispensary)}
                            placeholder="Clinic / Dispensary Name"
                            disabled={!!originalEmployeeData.esiDispensary}
                        />
                    </div>
                </div>


                {/* Save Button */}
                <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
                    <button
                        onClick={handleSaveBankDetails}
                        disabled={!isChanged || bankDetailsLocked}
                        style={{
                            background: (!isChanged || bankDetailsLocked) ? "#f1f5f9" : "#FFFFFF",
                            color: (!isChanged || bankDetailsLocked) ? "#94a3b8" : "#00B3A4",
                            border: (!isChanged || bankDetailsLocked) ? "1.5px solid #e2e8f0" : "1.5px solid #00B3A4",
                            padding: "0.875rem 1.75rem",
                            borderRadius: "8px",
                            cursor: (!isChanged || bankDetailsLocked) ? "not-allowed" : "pointer",
                            fontSize: "1rem",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            if (!(!isChanged || bankDetailsLocked)) {
                                e.currentTarget.style.background = '#00B3A4';
                                e.currentTarget.style.color = '#FFFFFF';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!(!isChanged || bankDetailsLocked)) {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.color = '#00B3A4';
                            }
                        }}
                    >
                        {bankDetailsLocked
                            ? "Bank & PF/ESI Locked 🔒"
                            : isChanged
                                ? "Save Details"
                                : "No Changes"}
                    </button>
                </div>


            </div>
        );
    };


    // // --- NEW: Handler for Insurance Details Save ---
    // const handleSaveInsuranceDetails = async () => {

    //     // 1. Check for changes against the original data
    //     const changed =
    //         employeeData.insurerName !== originalEmployeeData.insurerName ||
    //         employeeData.insurerDateOfBirth !== originalEmployeeData.insurerDateOfBirth ||
    //         employeeData.insurerRelationship !== originalEmployeeData.insurerRelationship;

    //     if (!changed) {
    //         setSuccessMessage("No insurance details changes to save.");
    //         setTimeout(() => setSuccessMessage(""), 1500);
    //         return;
    //     }

    //     try {
    //         // --- [Authentication token setup] ---
    //         const rawToken = sessionStorage.getItem("token");
    //         if (!rawToken) return alert("Authentication token not found. Please log in again.");

    //         const token = rawToken.startsWith('"') && rawToken.endsWith('"')
    //             ? rawToken.slice(1, -1)
    //             : rawToken;

    //         const authHeader = `Bearer ${token}`;

    //         // 2. Prepare payload with only the fields relevant for this tab
    //         const updatePayload = {
    //             insurerName: employeeData.insurerName,
    //             // Date format must be YYYY-MM-DD for the backend
    //             insurerDateOfBirth: employeeData.insurerDateOfBirth, 
    //             insurerRelationship: employeeData.insurerRelationship,
    //         };

    //         // 3. API Call: Use a dedicated endpoint for insurance details
    //         await api.put(
    //             `/employees/${employeeId}/insurance-details`, // <-- Use your specific update endpoint
    //             updatePayload, 
    //             { headers: { Authorization: authHeader } }
    //         );

    //         // 4. Update original state and show success
    //         setOriginalEmployeeData(prev => ({ ...prev, ...updatePayload }));
    //         setSuccessMessage("Insurance details updated successfully! 🛡️");
    //         setBankDetailsLocked(true);
    //         setTimeout(() => setSuccessMessage(""), 1500);

    //     } catch (err) {
    //         console.error("Error saving insurance details:", err);
    //         alert("Error saving insurance details.");
    //     }
    // };

    // // Helper function to convert the date string from employeeData (e.g., "YYYY-MM-DD")
    // // into a Date object for the date picker, or return null if empty/invalid.
    // const getDateObject = (dateString) => {
    //     if (!dateString) return null;
    //     const date = new Date(dateString);
    //     // Use UTC date to avoid timezone issues shifting the date backward in the component
    //     return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    // };

    // // Helper function to convert the selected Date object back to the "YYYY-MM-DD" string format
    // const formatDateString = (date) => {
    //     if (!date) return "";
    //     return date.toISOString().split('T')[0];
    // };

    // const renderInsuranceDetails = ({ employeeData, originalEmployeeData, handleInputChange, handleSaveInsuranceDetails, inputStyle, labelStyle }) => {
    //     const isChanged =
    //         employeeData.insurerName !== originalEmployeeData.insurerName ||
    //         employeeData.insurerDateOfBirth !== originalEmployeeData.insurerDateOfBirth ||
    //         employeeData.insurerRelationship !== originalEmployeeData.insurerRelationship;

    //     const relationshipOptions = ["Father", "Mother", "Spouse", "Child",];

    //     // Get the current Date object for the DatePicker value
    //     const nomineeDateOfBirth = getDateObject(employeeData.insurerDateOfBirth);

    //     const handleDateChange = (date) => {
    //         const formattedDate = formatDateString(date);

    //         // This simulates a standard input change handler for consistency
    //         handleInputChange({ 
    //             target: { 
    //                 name: 'insurerDateOfBirth', 
    //                 value: formattedDate 
    //             } 
    //         });
    //     };

    //     return (
    //         <div style={{ padding: "1rem 0" }}>
    //             {/* Header section (unchanged) */}
    //             <div
    //                 style={{
    //                     marginBottom: "1rem",
    //                     borderBottom: "1px solid #eee",
    //                     paddingBottom: "10px",
    //                 }}
    //             >
    //                 <h2 style={{ margin: 0 }}>Insurance Details</h2>
    //                 <p style={{ margin: "0.25rem 0 0", color: "#777", fontSize: "0.9rem" }}>
    //                     Update the nominee details for your company-provided health insurance.
    //                 </p>
    //             </div>

    //             <h3 style={{ marginTop: "0", marginBottom: "1rem", fontSize: "1.1rem", color: "#333" }}>
    //                 Nominee Information
    //             </h3>

    //             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

    //                 {/* Insurer Name (unchanged) */}
    //                 <div style={{ gridColumn: "span 2" }}>
    //                     <label style={labelStyle}>Insurer Nominee Name</label>
    //                     <input
    //                         name="insurerName"
    //                         value={employeeData.insurerName || ""}
    //                         onChange={handleInputChange}
    //                         style={inputStyle(false)}
    //                         placeholder="Full Name of the Nominee"
    //                     />
    //                 </div>

    //                 {/* Relationship (unchanged) */}
    //                 <div>
    //                     <label style={labelStyle}>Relationship</label>
    //                     <select
    //                         name="insurerRelationship"
    //                         value={employeeData.insurerRelationship || ""}
    //                         onChange={handleInputChange}
    //                         style={inputStyle(false)}
    //                     >
    //                         <option value="" disabled>Select Relationship</option>
    //                         {relationshipOptions.map((rel) => (
    //                             <option key={rel} value={rel}>{rel}</option>
    //                         ))}
    //                     </select>
    //                 </div>

    //                 {/* 🌟 NEW: Date Picker Field 🌟 */}
    //                 <div>
    //                     <label style={labelStyle}> Date of Birth</label>
    //                  <DatePicker
    //     selected={nomineeDateOfBirth}
    //     onChange={handleDateChange}
    //     dateFormat="dd-MM-yyyy" // ✅ Display format changed here
    //     peekNextMonth
    //     showMonthDropdown
    //     showYearDropdown
    //     dropdownMode="select"
    //     placeholderText="Select Date of Birth"
    //     className="nominee-dob-picker"
    //     wrapperClassName="dob-wrapper-styles"
    //     customInput={
    //         <input
    //             style={{
    //                 ...inputStyle(false),
    //                 boxSizing: 'border-box',
    //             }}
    //         />
    //     }
    // />

    //                 </div>
    //                 {/* 🌟 END NEW 🌟 */}

    //             </div>

    //             {/* Save Button (unchanged) */}
    //             <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
    //                 <button
    //                     onClick={handleSaveInsuranceDetails}
    //                     style={{
    //                         backgroundColor: isChanged ? "#007bff" : "#6c757d",
    //                         color: "white",
    //                         border: "none",
    //                         padding: "8px 16px",
    //                         borderRadius: "8px",
    //                         cursor: isChanged ? "pointer" : "not-allowed",
    //                         fontSize: "0.9rem",
    //                     }}
    //                     disabled={!isChanged}
    //                 >
    //                     {isChanged ? "Save Insurance Details" : "No Changes"}
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // };
    // Assume these variables and functions are defined outside the return statement 
    // in your React component:
    // const [activeTab, setActiveTab] = useState("Personal Info");
    // const successMessage = 'Data saved successfully!'; // or an actual state variable
    // const renderPersonalInformation = () => <div>Personal Info Form...</div>;
    // ... (other render functions)

    // --- Styles Definition ---



    // --- The Main Component's Return Block ---

    return (
        <Sidebar>
            <style>
                {`
                /* Absolute, bulletproof override for all inputs, select fields, and textareas in My Profile */
                .profile-settings-wrapper input,
                .profile-settings-wrapper textarea,
                .profile-settings-wrapper select,
                .profile-settings-wrapper .react-datepicker__input-container input {
                    border-radius: 8px !important;
                }
                `}
            </style>
            {successMessage && (

                <div
                    style={{
                        position: "fixed",
                        top: "20px",
                        right: "20px",
                        backgroundColor: "#4BB543",
                        color: "white",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
                        zIndex: 9999,
                        opacity: 1,
                        transition: "opacity 0.3s ease-in-out",
                    }}
                >
                    {successMessage}
                </div>
            )}
            <div className="profile-settings-wrapper" style={{ padding: "20px 0" }}>
                {/* Dynamic Title and Description moved above tabs */}
                <div className="module-header">
                    <h2 style={{ fontSize: "30px" }}>{tabHeaders[activeTab].title}</h2>
                    <p style={{ fontSize: "15px" }}>{tabHeaders[activeTab].description}</p>
                </div>

                {/* 🛑 Tab Container with Scrolling Styles Applied 🛑 */}
                <div className="tabs-wrapper">
                    <button className="scroll-btn left" onClick={() => scrollTabs('left')}>
                        <i className="bi bi-chevron-left"></i>
                    </button>

                    <div className="tabs-scroll-container" ref={tabsRef} style={tabContainerStyle}>
                        {["Personal Info", "Contact Details", "Employment", "Bank Details", "Insurance Details"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                                // Pass activeTab to the style function
                                style={tabStyle(tab, activeTab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <button className="scroll-btn right" onClick={() => scrollTabs('right')}>
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>

                {/* --- Tab Content Rendering --- */}
                {activeTab === "Personal Info" && renderPersonalInformation()}
                {activeTab === "Contact Details" && renderContactDetails()}
                {activeTab === "Employment" && renderEmploymentDetails()}
                {activeTab === "Bank Details" && renderBankDetails()}
                {activeTab === "Insurance Details" && renderInsuranceDetails()}
                {/* ----------------------------- */}
            </div>
        </Sidebar>
    );
};

export default ProfileSettingsPage;
