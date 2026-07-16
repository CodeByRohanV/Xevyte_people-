import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./Sidebar";
import api from "../api";
import { format } from "date-fns";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './OnBoardingPage.css'

import { useParams, useNavigate } from 'react-router-dom';
const EmployeeDirectoryDetails = () => {
  const [esiPfType, setEsiPfType] = useState('PF');
  const [bankDetailsLocked, setBankDetailsLocked] = useState(false);
  const loggedInEmployeeId = sessionStorage.getItem("employeeId");
  const { employeeId: urlEmployeeId } = useParams();
  const navigate = useNavigate();
  const employeeId = urlEmployeeId || loggedInEmployeeId;
  const token = sessionStorage.getItem("token");
  const employeeName = sessionStorage.getItem("employeeName") || "User";

  const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
  };

  const [pickerMode, setPickerMode] = useState("day");

  // "day" → normal calendar
  // "month" → month grid
  // "year" → year grid

  // 2. Get the logged-in user's ID from session storage
  const [activeTab, setActiveTab] = useState("Personal Info");
  const [successMessage, setSuccessMessage] = useState("");
  // Check if the logged-in user is viewing their own profile
  // Check if the logged-in user is viewing their own profile
  const isOwnProfile = !urlEmployeeId || urlEmployeeId === loggedInEmployeeId;

  // --- Mobile Responsive Logic ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


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
    bankName: "AXIS BANK",           // New Field
    bankAccountNumber: "", // New Field
    bankIfscCode: "UTIB0",        // New Field
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

  // --- Fetch employee data (Original useEffect, modified to call fetchNominees on load) ---
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
          dateOfBirth: data.dateOfBirth
            ? format(new Date(data.dateOfBirth), "dd-MM-yyyy")
            : "",
          gender: data.gender || "",
          bloodGroup: data.bloodGroup || "",
          // Employment Fields
          designation: data.role || "N/A",
          workEmail: data.email || "N/A",
          dateOfJoining: data.joiningDate
            ? format(new Date(data.joiningDate), "dd-MM-yyyy")
            : "N/A",
          workLocation: data.workLocation || "N/A",
          // Bank Details Fields
          accountHolderName: data.accountHolderName || "",
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

        const hasBankDetails =
          formattedData.bankAccountNumber &&
          formattedData.bankAccountNumber.trim() !== "";
        setBankDetailsLocked(!!hasBankDetails);

        if (data.esiNumber) {
          setEsiPfType('ESI');
        } else {
          setEsiPfType('PF');
        }



        // --- NEW: Call nominee fetch after setting up state/auth ---
        fetchNominees();

      } catch (err) {
        console.error("Failed to load employee profile:", err);
        alert("Failed to load profile data");
      }
    };

    fetchEmployeeData();
  }, [employeeId, fetchNominees]); // Added fetchNominees to dependency array


  const renderInsuranceDetails = () => (
    <>
      <h3 style={sectionHeaderStyle} >Insurance Nominee Details</h3>

      {existingNominees.length === 0 ? (
        <div style={{ color: "#777", padding: "10px 0", fontSize: "15px" }}>
          No insurance nominees found.
        </div>
      ) : (
        existingNominees.map((nominee, index) => (
          <div key={index} style={{ marginBottom: "1rem" }}>

            <div style={rowStyle}>
              <div style={labelStyle}>Nominee Name</div>
              <div style={valueStyle}>{nominee.nomineeName}</div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Relationship</div>
              <div style={valueStyle}>{nominee.relationship}</div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Date of Birth</div>
              <div style={valueStyle}>
                {nominee.dateOfBirth
                  ? format(new Date(nominee.dateOfBirth), "dd-MM-yyyy")
                  : "-"}
              </div>
            </div>

          </div>
        ))
      )}
    </>
  );







  // --- STYLES (Copied from InsuranceNomineeDetails for consistency) ---
  const styles = {
    // ... all existing styles for table, rows, buttons, etc.
    // NOTE: For a real application, these should be moved to the shared CSS file or a proper styling solution.
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
      background: "#629AF1",
      color: 'white'
    },
    th: {
      padding: "12px 10px",
      textAlign: "left",
      borderBottom: "2px solid #629AF1",
      backgroundColor: "#629AF1",
      color: "white"
    },
    thAction: {
      padding: "12px 10px",
      textAlign: "center",
      width: '60px',
      borderBottom: "2px solid #629AF1",
      backgroundColor: "#629AF1",
      color: "white"
    },
    td: {
      padding: "8px 10px",
      borderBottom: "1px solid #eee",
      verticalAlign: 'middle',

    },
    tdAction: {
      padding: "8px 0",
      borderBottom: "1px solid #eee",
      textAlign: "center",
      width: '60px',
    },
    existingRow: {
      backgroundColor: '#fff',
    },
    newRow: {
      backgroundColor: '#e3f2fd',
    },
    inputField: {
      width: 'calc(100% - 10px)',
      padding: '8px 5px',
      borderRadius: '8px',
    },
    removeButton: {
      backgroundColor: 'transparent',
      color: 'red',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '0 5px',
      margin: 0,
    },
    buttonContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '2rem',
    },
    addButton: {
      backgroundColor: "#00B3A4",
      color: "white",
      border: "none",
      padding: "10px 18px",
      cursor: "pointer",
      borderRadius: "8px",
      fontSize: '16px',
      fontWeight: 'bold',
    },
    submitButton: {
      backgroundColor: "#00B3A4",
      color: "white",
      border: "none",
      padding: "10px 18px",
      cursor: "pointer",
      borderRadius: "8px",
      fontSize: '16px',
      fontWeight: 'bold',
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
          dateOfBirth: data.dateOfBirth
            ? format(new Date(data.dateOfBirth), "dd-MM-yyyy")
            : "",
          gender: data.gender || "",
          bloodGroup: data.bloodGroup || "",
          // Employment Fields
          designation: data.role || "N/A",
          workEmail: data.email || "N/A",
          dateOfJoining: data.joiningDate
            ? format(new Date(data.joiningDate), "dd-MM-yyyy")
            : "N/A",
          workLocation: data.workLocation || "N/A",
          // --- NEW Bank Details Fields from API ---
          accountHolderName: data.accountHolderName || "",
          bankName: data.bankName || "",
          bankAccountNumber: data.bankAccountNumber || "",
          bankIfscCode: data.bankIfscCode || "",
          uanNumber: data.uanNumber || "",
          pfMemberId: data.pfMemberId || "",
          esiNumber: data.esiNumber || "",
          esiDispensary: data.esiDispensary || "",

          // insurerName: data.insurerName || "",
          // Ensure this date is a 'YYYY-MM-DD' string for the getDateObject helper and DatePicker
          // insurerDateOfBirth: data.insurerDateOfBirth
          //     ? data.insurerDateOfBirth.split('T')[0]
          //     : "",
          // insurerRelationship: data.insurerRelationship || "",
        };

        setEmployeeData(formattedData);
        setOriginalEmployeeData(formattedData);

        const hasBankDetails =
          formattedData.bankAccountNumber &&
          formattedData.bankAccountNumber.trim() !== "";
        setBankDetailsLocked(!!hasBankDetails);
        // Set initial esiPfType based on data if available, defaulting to 'PF'
        if (data.esiNumber) {
          setEsiPfType('ESI');
        } else {
          setEsiPfType('PF');
        }


      } catch (err) {
        console.error("Failed to load employee profile:", err);
        alert("Failed to load profile data");
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  const handleSaveBankDetails = async () => {
    // --- Mandatory bank fields ---
    if (!employeeData.accountHolderName.trim()) {
      alert("Account Holder Name is required.");
      return;
    }
    // Bank Name is defaulted to AXIS BANK, no need to check
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
      if (!employeeData.esiDispensary.trim()) {
        alert("ESI Dispensary is required.");
        return;
      }
    }


    // --- Bank-specific validations ---
    if (!employeeData.bankAccountNumber.match(/^\d{15}$/)) {
      alert("Bank Account Number must contain exactly 15 digits.");
      return;
    }
    if (!employeeData.bankIfscCode.match(/^[A-Z]{4}0[A-Z0-9]{6}$/i)) {
      alert("Bank IFSC Code format is invalid (e.g., UTIB0003311).");
      return;
    }

    // --- Prepare payload dynamically ---
    const updatePayload = {
      accountHolderName: employeeData.accountHolderName,
      bankName: employeeData.bankName, // defaulted to AXIS BANK
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

      // ✅ Update original data to reset 'isChanged'
      setOriginalEmployeeData(prev => ({ ...prev, ...updatePayload }));

      // 🔒 Lock all fields immediately
      setBankDetailsLocked(true);

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
        newValue = newValue.replace(/\D/g, "").substring(0, 15); // Only digits, max 15
        break;
      case "bankIfscCode":
        newValue = newValue.toUpperCase();
        if (!newValue.startsWith("UTIB0")) {
          newValue = "UTIB0" + newValue.slice(5); // Keep prefix
        }
        newValue = newValue.replace(/[^A-Z0-9]/g, ""); // Allow only alphanumeric
        break;
      case "uanNumber":
        newValue = newValue.replace(/\D/g, "").substring(0, 12); // UAN is 12 digits
        break;
      case "pfMemberId":
      case "esiNumber":
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






  const tabContainerStyle = {
    display: "flex",
    gap: "0.75rem",
    padding: "1rem 0",
    borderBottom: "1px solid #ddd",
    fontFamily: "sans-serif",
    overflowX: "auto",         // enables horizontal scrolling
    whiteSpace: "nowrap",      // prevents wrapping to next line
    WebkitOverflowScrolling: "touch", // smooth scrolling on iOS
  };
  const tabStyle = (tabName) => ({
    cursor: "pointer",
    padding: "0.5rem 0.5rem",
    fontSize: "0.9rem",
    border: "none",
    background: "transparent",
    color: activeTab === tabName ? "#629AF1" : "#333",
    fontWeight: activeTab === tabName ? "700" : "normal",
    borderBottom: activeTab === tabName ? "3px solid #629AF1" : "none",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    flex: "0 0 auto",          // prevents shrinking
  });


  const inputStyle = (readOnly) => ({
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "0.9rem",
    color: readOnly ? "#555" : "#333",
    backgroundColor: readOnly ? "#f7f7f7" : "white",
    cursor: readOnly ? "not-allowed" : "text",
    marginBottom: "6px",
    boxShadow: readOnly ? "none" : "inset 0 1px 2px rgba(0,0,0,0.075)",
  });

  const rowStyle = {
    display: isMobile ? "block" : "flex",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
  };

  const labelStyle = {
    width: isMobile ? "100%" : "250px",
    fontWeight: "600",
    color: "#333",
    marginBottom: isMobile ? "4px" : "0",
    display: isMobile ? "block" : "inline-block",
    fontSize: "15px",
  };

  const valueStyle = {
    flex: 1,
    color: "#555",
    fontSize: "15px",
  };

  const pageScrollStyle = {
    height: "calc(100vh - 60px)", // adjust if your Sidebar header height differs
    overflowY: "auto",
    paddingRight: "10px",
  };

  const sectionHeaderStyle = {
    marginTop: "24px",
    marginBottom: "16px",
    background: "#629AF1",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(98, 154, 241, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  };

  const renderPersonalInformation = () => (
    <>
      <h3 style={sectionHeaderStyle} >Personal Information</h3>

      <div style={rowStyle}>
        <div style={labelStyle}>First Name</div>
        <div style={valueStyle}>{employeeData.firstName || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Last Name</div>
        <div style={valueStyle}>{employeeData.lastName || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Date of Birth</div>
        <div style={valueStyle}>{employeeData.dateOfBirth || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Gender</div>
        <div style={valueStyle}>{employeeData.gender || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Aadhaar Number</div>
        <div style={valueStyle}>{employeeData.aadharNo || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>PAN Number</div>
        <div style={valueStyle}>{employeeData.panNo || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Blood Group</div>
        <div style={valueStyle}>{employeeData.bloodGroup || "-"}</div>
      </div>
    </>
  );


  const renderContactDetails = () => (
    <>
      <h3 style={sectionHeaderStyle} >Contact Details</h3>

      <div style={rowStyle}>
        <div style={labelStyle}>Contact Number</div>
        <div style={valueStyle}>{employeeData.contactNo || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Emergency Contact</div>
        <div style={valueStyle}>{employeeData.emergencyContactNumber || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Permanent Address</div>
        <div style={valueStyle}>{employeeData.address || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Present Address</div>
        <div style={valueStyle}>{employeeData.presentAddress || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Personal Email</div>
        <div style={valueStyle}>{employeeData.personalMail || "-"}</div>
      </div>
    </>
  );





  const renderEmploymentDetails = () => (
    <>
      <h3 style={sectionHeaderStyle} >Employment Details</h3>

      <div style={rowStyle}>
        <div style={labelStyle}>Employee ID</div>
        <div style={valueStyle}>{getDisplayEmployeeId(employeeId) || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Designation</div>
        <div style={valueStyle}>{employeeData.designation || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Work Email</div>
        <div style={valueStyle}>{employeeData.workEmail || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Date of Joining</div>
        <div style={valueStyle}>{employeeData.dateOfJoining || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Work Location</div>
        <div style={valueStyle}>{employeeData.workLocation || "-"}</div>
      </div>
    </>
  );


  const renderBankDetails = () => (
    <>
      <h3 style={sectionHeaderStyle} >Bank & Statutory Details</h3>

      <div style={rowStyle}>
        <div style={labelStyle}>Account Holder Name</div>
        <div style={valueStyle}>{employeeData.accountHolderName || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Bank Name</div>
        <div style={valueStyle}>{employeeData.bankName || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Account Number</div>
        <div style={valueStyle}>{employeeData.bankAccountNumber || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>IFSC Code</div>
        <div style={valueStyle}>{employeeData.bankIfscCode || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>UAN Number</div>
        <div style={valueStyle}>{employeeData.uanNumber || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>PF Member ID</div>
        <div style={valueStyle}>{employeeData.pfMemberId || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>ESI Number</div>
        <div style={valueStyle}>{employeeData.esiNumber || "-"}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>ESI Dispensary</div>
        <div style={valueStyle}>{employeeData.esiDispensary || "-"}</div>
      </div>
    </>
  );

  const backButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#00B3A4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 179, 164, 0.2)',
    marginBottom: '20px',
  };

  const handleBackClick = () => {
    navigate('/EmployeeDirectory');
  };





  return (
    <Sidebar>
      <div style={pageScrollStyle}>
        <div style={{ padding: isMobile ? "1rem" : "2rem", maxWidth: "1000px", margin: "0 auto" }}>
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            style={backButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#008F83';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 179, 164, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#00B3A4';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 179, 164, 0.2)';
            }}
          >
            <span style={{ fontSize: '18px' }}>←</span> Back to Directory
          </button>

          {renderPersonalInformation()}
          {renderContactDetails()}
          {renderEmploymentDetails()}
          {renderBankDetails()}
          {renderInsuranceDetails()}
        </div>
      </div>
    </Sidebar>
  );

};

export default EmployeeDirectoryDetails;