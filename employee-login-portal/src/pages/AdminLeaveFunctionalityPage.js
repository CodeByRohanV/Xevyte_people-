import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../api";
import "./AdminLeaveFunctionalityPage.css";
import ToastNotification from "../components/ToastNotification";



/* ---------------------------
   BACKEND ENDPOINTS
-----------------------------*/
const POLICY_API_BASE = process.env.REACT_APP_API_BASE_URL + "/admin/leave-policy";


const SAVE_TYPE_API = `${POLICY_API_BASE}/type`;
const SAVE_ACCRUAL_API = `${POLICY_API_BASE}/accrual`;
const SAVE_CARRY_API = `${POLICY_API_BASE}/carry`;
const SAVE_ENCASH_API = `${POLICY_API_BASE}/encash`;
const SAVE_ELIGIBILITY_API = `${POLICY_API_BASE}/eligibility`;
const SAVE_UNIFIED_API = `${POLICY_API_BASE}/unified`;
const SAVE_APPROVAL_API = `${POLICY_API_BASE}/approval`;



// const TYPES_API = `${POLICY_API_BASE}/types`;
// ✅ CORRECT
const TYPES_API = `${process.env.REACT_APP_API_BASE_URL}/admin/leave-policy/types`;



const ASSIGN_API = `${process.env.REACT_APP_API_BASE_URL}/admin/leave-types/assign`;



export default function AdminLeaveFunctionalityPage() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("adminLeaveActiveTab") || "leaveType"); // Set default to leaveType as requested

  useEffect(() => {
    localStorage.setItem("adminLeaveActiveTab", activeTab);
  }, [activeTab]);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");

  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    alert(message);
  };

  /* ---------------------------
     STATES
  -----------------------------*/
  const [approvalLeaveTypeId, setApprovalLeaveTypeId] = useState("");
  const [encashPreview, setEncashPreview] = useState(null);

  const [approvalForm, setApprovalForm] = useState({
    autoApprove: false,
    approverIds: [""]
  });
  const [policySummary, setPolicySummary] = useState(null);
  const [viewingHistoryId, setViewingHistoryId] = useState(null); // ID of history item being viewed
  const [historyDetail, setHistoryDetail] = useState(null); // Detail data for modal
  const [selectedPolicy, setSelectedPolicy] = useState(null); // For new policy detail modal


  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [unifiedPolicies, setUnifiedPolicies] = useState([]);

  const accrualRef = React.useRef(null);
  const carryRef = React.useRef(null);
  const encashRef = React.useRef(null);
  const eligibilityRef = React.useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };


  const [loadingHistory, setLoadingHistory] = useState(false);
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  // removed grant change handler


  const submitEligibility = async (e) => {
    e.preventDefault();

    try {
      await api.post(SAVE_ELIGIBILITY_API, eligibilityForm, tokenHeader());
      showToast("Eligibility rules saved successfully", "success");
      // Refresh data without page reload to preserve tab state
      await fetchTypes();
      if (unifiedForm.leaveTypeId) {
        await fetchPolicySummary(unifiedForm.leaveTypeId);
      }
      if (activeTab === "policyHistory") {
        await fetchAllPolicies();
      }
    } catch (err) {
      console.error(err.response?.data || err);
      showToast("Failed to save eligibility rules", "error");
    }
  };

  // consolidated lapseForm into carryForm

  const [eligibilityForm, setEligibilityForm] = useState({
    leaveTypeId: "",
    grades: "",
    employeeType: "",
    location: "",
    minTenureMonths: "",
    gender: "",
    probationStatus: ""
  });

  // Unified form state combining all policy fields
  const [unifiedForm, setUnifiedForm] = useState({
    id: null,
    leaveTypeId: "",
    policyName: "",
    accrualMode: "MONTHLY",
    proRata: false,
    accrualDateType: "FIRST_DAY",
    customAccrualDay: "",
    customAccrualDate: "",
    negativeAllowed: false,
    maxNegativeBalance: "",
    roundingRule: "NO_ROUND",
    carryForwardAllowed: false,
    maxCarryForwardLimit: 0,
    carryForwardTo: "SAME",
    targetLeaveTypeId: "",
    lapseApplicable: true,
    lapseMode: "YEAR_END",
    lapseDate: null,
    carryForwardDate: null,
    falloutLeaveType: "", // ✅ Added
    encashmentAllowed: false,
    encashEligibleCandidates: "ALL",
    minBalanceToRetain: 0,
    encashmentFormula: "BASIC",
    location: "",
    gender: "",
    yearlyQuota: 0
  });


  const [policyTab, setPolicyTab] = useState("eligibility"); // Set default to eligibility to match image
  // consolidated submitLapse into submitCarry



  const LeaveTypeSelect = ({ value, onChange }) => (
    <select
      value={value}
      onChange={onChange}
      required
    >
      <option value="">-- Choose a Leave Type --</option>
      {types.map(t => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await axios.get(TYPES_API, tokenHeader());
      setTypes(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingTypes(false);
  };

  // State for eligibility options
  const [eligibilityOptions, setEligibilityOptions] = useState({
    locations: [],
    genders: []
  });

  const fetchEligibilityOptions = async () => {
    try {
      const res = await api.get(`${POLICY_API_BASE}/eligibility-options`, tokenHeader());
      setEligibilityOptions(res.data || { locations: [], genders: [] });
    } catch (err) {
      console.error("Failed to fetch eligibility options:", err);
    }
  };


  useEffect(() => {
    fetchTypes();
    fetchEligibilityOptions();
  }, []);


  // Move fetchAllPolicies out of useEffect so it can be called after toggling status
  const fetchAllPolicies = async () => {
    if (types.length > 0) {
      setLoadingHistory(true);
      try {
        const allPoliciesPromises = types.map(async (type) => {
          try {
            const res = await api.get(`${POLICY_API_BASE}/unified/${type.id}`, tokenHeader());
            return res.data || [];
          } catch (err) {
            console.error(`Failed to fetch policies for type ${type.id}:`, err);
            return [];
          }
        });

        const policiesArrays = await Promise.all(allPoliciesPromises);
        const allPolicies = policiesArrays.flat();
        setUnifiedPolicies(allPolicies);
      } catch (err) {
        console.error("Failed to fetch all policies:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "policyHistory") {
      fetchAllPolicies();
    }
  }, [activeTab, types]);

  // Handle toggling Leave Type status
  const toggleTypeStatus = async (e, type) => {
    e.stopPropagation(); // Avoid expanding/collapsing the card
    const currentStatus = type.active === "YES" || type.active === true;
    const newStatus = !currentStatus;

    try {
      await api.post(SAVE_TYPE_API, {
        ...type,
        active: newStatus
      }, tokenHeader());
      showToast(`Leave type "${type.name}" is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`, "success");
      // Refresh both types and policies without page reload
      await fetchTypes();
      await fetchAllPolicies();
    } catch (err) {
      console.error("Failed to toggle type status", err);
      showToast("Error updating leave type status: " + (err.response?.data?.message || err.message), "error");
    }
  };

  // Handle toggling Individual Policy status
  const togglePolicyStatus = async (policy) => {
    const currentStatus = policy.active !== false; // Handle undefined as true
    const newStatus = !currentStatus;

    try {
      await api.post(SAVE_UNIFIED_API, {
        ...policy,
        active: newStatus
      }, tokenHeader());

      // Update local state for immediate feedback
      setUnifiedPolicies(prev => prev.map(p =>
        p.id === policy.id ? { ...p, active: newStatus } : p
      ));

      if (selectedPolicy && selectedPolicy.id === policy.id) {
        setSelectedPolicy(prev => ({ ...prev, active: newStatus }));
      }

      showToast(`Policy "${policy.policyName}" is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`, "success");

      // Refresh the policy list to ensure consistency without page reload
      await fetchAllPolicies();
    } catch (err) {
      console.error("Failed to toggle policy status", err);
      showToast("Error updating policy status: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const submitApprovalWorkflow = async () => {
    if (!approvalLeaveTypeId) {
      showToast("Please select a Leave Type first", "error");
      return;
    }

    if (!approvalForm.autoApprove) {
      const activeApprovers = approvalForm.approverIds.filter(id => id.trim() !== "");
      if (activeApprovers.length === 0) {
        showToast("Please enter at least one configured Approver Employee ID", "error");
        return;
      }
    }

    const payload = {
      leaveTypeId: approvalLeaveTypeId,
      autoApprove: approvalForm.autoApprove,
      totalLevels: approvalForm.autoApprove ? 0 : 1,
      levels: approvalForm.autoApprove
        ? []
        : [
          {
            level: 1,
            approverIds: approvalForm.approverIds.filter(id => id.trim() !== "")
          }
        ]
    };

    try {
      await api.post(SAVE_APPROVAL_API, payload, tokenHeader());
      showToast("Approval workflow saved successfully", "success");
      // Refresh data without page reload to preserve tab state
      await fetchTypes();
      if (unifiedForm.leaveTypeId) {
        await fetchPolicySummary(unifiedForm.leaveTypeId);
      }
      // Reset form but keep tab state
      setApprovalForm({
        autoApprove: false,
        approverIds: [""]
      });
      setApprovalLeaveTypeId("");
    } catch (err) {
      console.error(err);
      showToast("Failed to save approval workflow: " + (err.response?.data?.message || err.message), "error");
    }
  };



  const addApproverSlot = () => {
    setApprovalForm(prev => ({
      ...prev,
      approverIds: [...prev.approverIds, ""]
    }));
  };

  const removeApproverSlot = (index) => {
    setApprovalForm(prev => {
      const newList = prev.approverIds.filter((_, i) => i !== index);
      return { ...prev, approverIds: newList.length ? newList : [""] };
    });
  };

  const updateApproverId = (index, val) => {
    setApprovalForm(prev => {
      const newList = [...prev.approverIds];
      newList[index] = val;
      return { ...prev, approverIds: newList };
    });
  };




  /**
   * UPDATED PolicyTabButton to match Image 2's secondary tabs (black background, white text)
   */
  const PolicyTabButton = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setPolicyTab(id)}
      className={`tab-btn ${policyTab === id ? "active" : ""}`}
    >
      {label}
    </button>
  );

  const [encashForm, setEncashForm] = useState({
    leaveTypeId: "",
    encashmentAllowed: false,
    eligibleGrades: "",
    encashmentFormula: ""
  });


  const submitEncash = async (e) => {
    e.preventDefault();

    try {
      await api.post(SAVE_ENCASH_API, encashForm, tokenHeader());
      showToast("Encashment rules saved successfully", "success");
      // Refresh data without page reload to preserve tab state
      await fetchTypes();
      if (unifiedForm.leaveTypeId) {
        await fetchPolicySummary(unifiedForm.leaveTypeId);
      }
      if (activeTab === "policyHistory") {
        await fetchAllPolicies();
      }
    } catch (err) {
      console.error(err.response?.data || err);
      showToast("Failed to save encashment rules", "error");
    }
  };




  const [accrualForm, setAccrualForm] = useState({
    leaveTypeId: "",
    accrualMode: "MONTHLY",
    customAccrualDay: "",
    negativeAllowed: false,
    maxNegativeBalance: "",
    roundingRule: "NO_ROUND",
  });
  // removeApprovalLevel was redundant, replaced by removeApproverSlot

  const [typeForm, setTypeForm] = useState({
    id: null,
    name: "",
    unit: "FULL_DAY",
    yearlyQuota: 0,
    sandwichRule: false,
    documentRequired: false,
    documentThreshold: 0,
    halfDayAllowed: false,
    active: true,
  });

  // Temporary state for adding optional holidays
  // removed grantForm


  // const submitGrant = async (e) => {
  //   e.preventDefault();   // ✅ VERY IMPORTANT

  //   try {
  //     await axios.post(SAVE_GRANT_API, grantForm, tokenHeader());
  //     alert("Grant rules saved successfully");
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to save grant rules");
  //   }
  // };
  const [carryForm, setCarryForm] = useState({
    leaveTypeId: "",
    carryForwardAllowed: false,
    maxCarryForwardLimit: 0,
    carryForwardTo: "SAME",
    lapseApplicable: true,
    lapseMode: "YEAR_END", // YEAR_END or CUSTOM_DATE
    lapseDate: null
  });


  const submitCarry = async (e) => {
    e.preventDefault();

    const payload = {
      ...carryForm,
      lapseDate: carryForm.lapseDate || null // ✅ IMPORTANT
    };

    try {
      await api.post(SAVE_CARRY_API, payload, tokenHeader());
      showToast("Carry forward rules saved successfully", "success");
      // Refresh data without page reload to preserve tab state
      await fetchTypes();
      if (unifiedForm.leaveTypeId) {
        await fetchPolicySummary(unifiedForm.leaveTypeId);
      }
      if (activeTab === "policyHistory") {
        await fetchAllPolicies();
      }
    } catch (err) {
      console.error(err.response?.data || err);
      showToast("Failed to save carry forward rules", "error");
    }
  };



  const [typeError, setTypeError] = useState("");

  const [assignForm, setAssignForm] = useState({
    employeeIds: "",
    leaveTypeId: "",
    yearlyQuotaOverride: "",
  });

  const [assignError, setAssignError] = useState("");

  const tokenHeader = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
  });

  // Unified form change handler
  const handleUnifiedChange = (e) => {
    const { name, value } = e.target;
    setUnifiedForm(prev => ({
      ...prev,
      [name]:
        value === "true"
          ? true
          : value === "false"
            ? false
            : value
    }));
  };

  // handleLeaveTypeChange
  const handleLeaveTypeChange = (e) => {
    const val = e.target.value;
    setUnifiedForm(prev => ({
      ...prev,
      leaveTypeId: val,
      id: null,
      policyName: `Policy ${unifiedPolicies.length + 1}`
    }));
    if (val) {
      fetchPolicySummary(val);
      const selectedType = types.find(t => String(t.id) === String(val));
      if (selectedType) {
        editType(selectedType, false);
      }
    } else {
      setUnifiedPolicies([]);
    }
  };

  // Unified form submit handler
  const submitUnifiedPolicy = async (e) => {
    e.preventDefault();

    if (!unifiedForm.leaveTypeId) {
      showToast("Please select a leave type", "error");
      return;
    }

    try {
      // ✅ CHECK FOR DUPLICATE POLICY
      // Find if there's already a policy with the same eligibility criteria
      const duplicatePolicy = unifiedPolicies.find(p =>
        String(p.leaveTypeId) === String(unifiedForm.leaveTypeId) &&
        p.location === unifiedForm.location &&
        p.gender === unifiedForm.gender &&
        String(p.id) !== String(unifiedForm.id) // Exclude current policy if editing
      );

      if (duplicatePolicy && !unifiedForm.id) {
        // Show confirmation dialog
        const userChoice = window.confirm(
          `⚠️ A policy already exists for this eligibility criteria!\n\n` +
          `Leave Type: ${types.find(t => String(t.id) === String(unifiedForm.leaveTypeId))?.name || 'Unknown'}\n` +
          `Location: ${duplicatePolicy.location || 'ALL'}\n` +
          `Gender: ${duplicatePolicy.gender || 'ALL'}\n` +
          `Existing Policy: "${duplicatePolicy.policyName}"\n\n` +
          `Click OK to OVERRIDE the existing policy, or Cancel to go back.`
        );

        if (!userChoice) {
          // User chose to cancel
          return;
        }

        // User chose to override - set the ID to update the existing policy
        unifiedForm.id = duplicatePolicy.id;
      }

      const unifiedPayload = {
        ...unifiedForm,
        targetLeaveTypeId: unifiedForm.carryForwardTo === "ANOTHER" ? unifiedForm.targetLeaveTypeId : null,
      };

      await api.post(SAVE_UNIFIED_API, unifiedPayload, tokenHeader());

      showToast(unifiedForm.id ? "Policy updated successfully!" : "Policy saved successfully!", "success");

      // Refresh data without page reload to preserve tab state
      await fetchTypes();
      if (unifiedForm.leaveTypeId) {
        await fetchPolicySummary(unifiedForm.leaveTypeId);
      }
      if (activeTab === "policyHistory") {
        await fetchAllPolicies();
      }
      // Reset form but keep tab state
      setUnifiedForm({
        id: null,
        leaveTypeId: "",
        policyName: "",
        accrualMode: "MONTHLY",
        proRata: false,
        accrualDateType: "FIRST_DAY",
        customAccrualDay: "",
        customAccrualDate: "",
        negativeAllowed: false,
        maxNegativeBalance: "",
        roundingRule: "NO_ROUND",
        carryForwardAllowed: false,
        maxCarryForwardLimit: 0,
        carryForwardTo: "SAME",
        targetLeaveTypeId: "",
        lapseApplicable: true,
        lapseMode: "YEAR_END",
        lapseDate: null,
        carryForwardDate: null,
        falloutLeaveType: "",
        encashmentAllowed: false,
        encashEligibleCandidates: "ALL",
        minBalanceToRetain: 0,
        encashmentFormula: "BASIC",
        location: "",
        gender: "",
        yearlyQuota: 0
      });

    } catch (err) {
      console.error(err.response?.data || err);
      showToast("Failed to save policy configuration", "error");
    }
  };

  const deletePolicy = async (policyId) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    try {
      await axios.delete(`${SAVE_UNIFIED_API}/${policyId}`, tokenHeader());
      showToast("Policy deleted successfully", "success");
      fetchPolicySummary(unifiedForm.leaveTypeId);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete policy", "error");
    }
  };

  // Delete a policy and update employee balances
  const deletePolicyAndUpdateEmployees = async (policyId, leaveTypeId) => {
    try {
      // Delete the unified policy
      await axios.delete(`${SAVE_UNIFIED_API}/${policyId}`, tokenHeader());

      showToast("Policy deleted successfully! Employee leave balances will be recalculated automatically.", "success");

      // Refresh the data
      await fetchTypes();
      if (leaveTypeId) {
        await fetchPolicySummary(leaveTypeId);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete policy: " + (err.response?.data?.message || err.message), "error");
    }
  };

  // Delete leave type and all associated policies
  const deleteLeaveTypeWithPolicies = async (leaveTypeId, policiesForType) => {
    try {
      // First, delete all policies associated with this leave type
      for (const policy of policiesForType) {
        await api.delete(`${SAVE_UNIFIED_API}/${policy.id}`, tokenHeader());
      }

      // Then delete the leave type itself
      await api.delete(`${TYPES_API}/${leaveTypeId}`, tokenHeader());

      showToast(
        `Leave type deleted successfully! ${policiesForType.length} ${policiesForType.length === 1 ? 'policy was' : 'policies were'} removed. Employee leave balances have been updated.`,
        "success"
      );

      // Refresh all data
      await fetchTypes();
      setUnifiedPolicies([]);

      // Clear form if it was for the deleted leave type
      if (String(unifiedForm.leaveTypeId) === String(leaveTypeId)) {
        setUnifiedForm(prev => ({
          ...prev,
          id: null,
          leaveTypeId: "",
          policyName: "",
          location: "",
          gender: "",
          yearlyQuota: 0
        }));
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete leave type: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const editPolicy = (p) => {
    setUnifiedForm({
      ...p,
      leaveTypeId: String(p.leaveTypeId)
    });
    if (eligibilityRef.current) {
      eligibilityRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /* ---------------------------
     FETCH LEAVE TYPES
  -----------------------------*/
  /* ---------------------------
     PROCESS CARRY FORWARD
  -----------------------------*/


  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const res = await axios.get(TYPES_API, tokenHeader());
        setTypes(res.data || []);
      } catch (err) {
        console.error(err);
      }
      setLoadingTypes(false);
    };
    fetchTypes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual Trigger logic (keep for potential future use or remove if not needed)
  // Currently commented out to satisfy lint if it remains unused in JSX
  /*
  const runCarryForwardNow = async () => { ... }
  */

  /* ---------------------------
     FORM HANDLERS
  -----------------------------*/
  const handleTypeChange = (e) => {
    const { name, value } = e.target;

    setTypeForm((prev) => ({
      ...prev,
      [name]:
        value === "true"
          ? true
          : value === "false"
            ? false
            : value,
    }));
  };

  const submitType = async (e) => {
    e.preventDefault();
    setTypeError("");

    if (!typeForm.name.trim()) {
      setTypeError("Name is required");
      return;
    }

    const payload = {
      ...typeForm
    };

    try {
      await api.post(SAVE_TYPE_API, payload, tokenHeader());

      showToast("Leave Type saved successfully", "success");

      // Refresh data without page reload to preserve tab state
      await fetchTypes();
      if (unifiedForm.leaveTypeId) {
        await fetchPolicySummary(unifiedForm.leaveTypeId);
      }
      if (activeTab === "policyHistory") {
        await fetchAllPolicies();
      }
      // Reset form but keep tab state
      setTypeForm({
        id: null,
        name: "",
        unit: "FULL_DAY",
        yearlyQuota: 0,
        sandwichRule: false,
        documentRequired: false,
        documentThreshold: 0,
        halfDayAllowed: false,
        active: true,
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setTypeError(
        err.response?.data?.message || "Failed to save leave type"
      );
      showToast(err.response?.data?.message || "Failed to save leave type", "error");
    }
  };

  const fetchPolicySummary = async (leaveTypeId) => {
    if (!leaveTypeId) return;

    try {
      const res = await api.get(`${POLICY_API_BASE}/summary/${leaveTypeId}`, tokenHeader());
      setPolicySummary(res.data);
      // NOTE: We don't overwrite unifiedPolicies here anymore to avoid resetting the history list
    } catch (err) {
      console.error("Failed to fetch policy summary", err);
    }
  };



  const editType = async (t, switchTab = true) => {
    // 1. Populate basic Type Form
    setTypeForm({
      id: t.id,
      name: t.name,
      unit: t.unit,
      yearlyQuota: t.yearlyQuota,
      sandwichRule: t.sandwichRule,
      documentRequired: t.documentRequired,
      documentThreshold: t.documentThreshold,
      halfDayAllowed: t.halfDayAllowed,
      active: t.active === "YES" || t.active === true,
    });

    // 2. Fetch full policy summary to populate other forms
    try {
      const res = await api.get(
        `${POLICY_API_BASE}/summary/${t.id}`,
        tokenHeader()
      );
      const summary = res.data;

      if (summary.accrual) setAccrualForm({ ...summary.accrual });
      if (summary.carry) setCarryForm({ ...summary.carry });
      if (summary.encashment) setEncashForm({ ...summary.encashment });
      if (summary.eligibility) setEligibilityForm({ ...summary.eligibility });

      // Populate unified form with all data
      setUnifiedForm({
        leaveTypeId: String(t.id),
        // Accrual fields
        // Unified Policy Fields

        location: summary.unifiedPolicy?.location || summary.eligibility?.location || "",
        gender: summary.unifiedPolicy?.gender || summary.eligibility?.gender || "",
        yearlyQuota: summary.unifiedPolicy?.yearlyQuota || t.yearlyQuota || 0,


        accrualMode: summary.unifiedPolicy?.accrualMode || summary.accrual?.accrualMode || "MONTHLY",
        proRata: summary.unifiedPolicy?.proRata ?? summary.accrual?.proRata ?? false,
        accrualDateType: summary.unifiedPolicy?.accrualDateType || summary.accrual?.accrualDateType || "FIRST_DAY",
        customAccrualDay: summary.unifiedPolicy?.customAccrualDay || summary.accrual?.customAccrualDay || "",
        customAccrualDate: summary.unifiedPolicy?.customAccrualDate || null,
        negativeAllowed: summary.unifiedPolicy?.negativeAllowed ?? summary.accrual?.negativeAllowed ?? false,
        maxNegativeBalance: summary.unifiedPolicy?.maxNegativeBalance || summary.accrual?.maxNegativeBalance || "",
        maxNegativeBalance: summary.unifiedPolicy?.maxNegativeBalance || summary.accrual?.maxNegativeBalance || "",
        roundingRule: summary.unifiedPolicy?.roundingRule || summary.accrual?.roundingRule || "NO_ROUND",
        falloutLeaveType: summary.unifiedPolicy?.falloutLeaveType || "", // ✅ Added

        carryForwardAllowed: summary.unifiedPolicy?.carryForwardAllowed ?? summary.carry?.carryForwardAllowed ?? false,
        maxCarryForwardLimit: summary.unifiedPolicy?.maxCarryForwardLimit || summary.carry?.maxCarryForwardLimit || 0,
        carryForwardTo: summary.unifiedPolicy?.carryForwardTo || summary.carry?.carryForwardTo || "SAME",
        targetLeaveTypeId: summary.unifiedPolicy?.targetLeaveTypeId || summary.carry?.targetLeaveTypeId || "",
        lapseApplicable: summary.unifiedPolicy?.lapseApplicable ?? summary.carry?.lapseApplicable ?? true,
        lapseMode: summary.unifiedPolicy?.lapseMode || summary.carry?.lapseMode || "YEAR_END",
        lapseDate: summary.unifiedPolicy?.lapseDate || summary.carry?.lapseDate || null,
        carryForwardDate: summary.unifiedPolicy?.carryForwardDate || summary.carry?.carryForwardDate || null,

        encashmentAllowed: summary.unifiedPolicy?.encashmentAllowed ?? summary.encashment?.encashmentAllowed ?? false,
        encashEligibleCandidates: summary.unifiedPolicy?.encashEligibleCandidates || summary.encashment?.eligibleGrades || "ALL",
        minBalanceToRetain: summary.unifiedPolicy?.minBalanceToRetain || summary.encashment?.minBalanceToRetain || 0,
        encashmentFormula: summary.unifiedPolicy?.encashmentFormula || summary.encashment?.encashmentFormula || "BASIC"
      });

      if (summary.approvalWorkflow) {
        setApprovalLeaveTypeId(String(t.id));
        // Flatten all approver IDs from all levels into the single list
        const flattenedIds = summary.approvalWorkflow.levels.flatMap(l => l.approverIds);
        setApprovalForm({
          autoApprove: summary.approvalWorkflow.autoApprove,
          approverIds: flattenedIds.length ? flattenedIds : [""]
        });
      }
    } catch (err) {
      console.error("Failed to fetch policy summary for editing", err);
    }

    if (switchTab) setActiveTab("leaveType");
  };

  /* ---------------------------
     ASSIGN LEAVE
  -----------------------------*/
  const submitAssignment = async (e) => {
    e.preventDefault();
    setAssignError("");

    if (!assignForm.employeeIds || !assignForm.leaveTypeId) {
      setAssignError("Employee IDs and Leave Type are required");
      return;
    }

    try {
      await api.post(ASSIGN_API, assignForm, tokenHeader());
      showToast("Leave assigned successfully", "success");
      setAssignForm({
        employeeIds: "",
        leaveTypeId: "",
        yearlyQuotaOverride: "",
      });
    } catch {
      setAssignError("Failed to assign leave");
      showToast("Failed to assign leave", "error");
    }
  };

  /* ---------------------------
     UI
  -----------------------------*/
  /**
   * UPDATED TabButton to match Image 2's primary tabs (black text, no underline)
   */
  const TabButton = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`tab-btn flex items-center gap-2 ${activeTab === id ? "active" : ""}`}
    >
      {label}
    </button>
  );



  return (
    <div className="admin-leave-container text-slate-800">
      <div className="tab-bar">
        <TabButton
          id="leaveType"
          label="Add leave type"
        />
        <TabButton
          id="leavePolicy"
          label="Leave policy configuration"
        />
        <TabButton
          id="approval"
          label="Approval flow rules"
        />
        <TabButton
          id="policyHistory"
          label="Policy history"
        />
      </div>

      <div className="content-area">
        {/* ---------------------------
            LEAVE TYPES TAB
        -----------------------------*/}
        {activeTab === "leaveType" && (
          <div className="card-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="policy-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  color: "#1F2937",
                  fontSize: "30px",
                  fontWeight: "normal",
                  textAlign: "left"
                }}>
                  {typeForm.id ? "Update leave type" : "Manage leave types"}
                </div>
                <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                  Configure operational leave categories, default quotas, and eligibility parameters.
                </div>
              </div>
            </div>

            <form
              onSubmit={submitType}
              className="flex flex-col overflow-hidden relative"
            >
              <div className="leave-type-scroll overflow-y-auto pr-2">
                <div className="policy-section grid-2-col">
                  {/* Row 1: Name & Quota */}
                  <div className="col-span-2 inline-input-group">
                    <label>Leave type name</label>
                    <input
                      name="name"
                      value={typeForm.name}
                      onChange={handleTypeChange}
                      placeholder="e.g. Annual Leave"
                      required
                    />
                  </div>

                  {/* Row 2: Unit & Document Required */}
                  <div className="input-group">
                    <label>Leave unit</label>
                    <select
                      name="unit"
                      value={typeForm.unit}
                      onChange={handleTypeChange}
                    >
                      <option value="FULL_DAY">Full Day</option>
                      {/* <option value="HALF_DAY">Half Day</option> */}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Document required</label>
                    <select
                      name="documentRequired"
                      value={typeForm.documentRequired ? "true" : "false"}
                      onChange={(e) =>
                        setTypeForm((prev) => ({
                          ...prev,
                          documentRequired: e.target.value === "true",
                          documentThreshold: e.target.value === "true" ? prev.documentThreshold : 0,
                        }))
                      }
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {/* Row 3: Sandwich Rule & Half-Day */}
                  <div className="input-group">
                    <label>Apply sandwich rule</label>
                    <select
                      name="sandwichRule"
                      value={typeForm.sandwichRule ? "true" : "false"}
                      onChange={handleTypeChange}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Half-day allowed</label>
                    <select
                      name="halfDayAllowed"
                      value={typeForm.halfDayAllowed ? "true" : "false"}
                      onChange={handleTypeChange}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {/* Conditional Field */}
                  {typeForm.documentRequired && (
                    <div className="input-group">
                      <label>Document required from day (x)</label>
                      <input
                        type="number"
                        name="documentThreshold"
                        value={typeForm.documentThreshold}
                        onChange={handleTypeChange}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: Buttons - Ultra Tight Spacing */}
              <div className="flex justify-end gap-4 pt-4 mt-0 border-t border-slate-100 w-full bg-transparent relative" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#00B3A4",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "normal",
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >
                  Submit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTypeForm({
                      id: null,
                      name: "",
                      unit: "FULL_DAY",
                      yearlyQuota: 0,
                      sandwichRule: false,
                      documentRequired: false,
                      documentThreshold: 0,
                      halfDayAllowed: false,
                      active: true,
                    });
                  }}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "normal",
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >
                  Clear form
                </button>
              </div>
            </form>
          </div>
        )}



        {/* ---------------------------
            LEAVE POLICY TAB
        -----------------------------*/}
        {activeTab === "leavePolicy" && (
          <div className="card-white animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="policy-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  color: "#1F2937",
                  fontSize: "30px",
                  fontWeight: "normal",
                  textAlign: "left"
                }}>
                  {unifiedForm.id ? "Update policy rule" : "Create new policy rule"}
                </div>
                <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                  Define custom eligibility parameters, accrual models, and spillover rules.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnifiedForm(prev => ({
                  ...prev,
                  id: null,
                  policyName: `Policy ${unifiedPolicies.length + 1}`,
                  priority: unifiedPolicies.length + 1
                }))}
                style={{
                  backgroundColor: "transparent",
                  color: "#00B3A4",
                  border: "1px solid #00B3A4",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "normal",
                  cursor: "pointer",
                  fontSize: "0.95rem"
                }}
              >
                Add new policy rule
              </button>
            </div>

            <form onSubmit={submitUnifiedPolicy} className="flex flex-col overflow-hidden relative">

              {/* Fixed Leave Type Selector */}
              <div className="policy-section grid-2-col flex-shrink-0">
                <div>
                  <label>Leave Type</label>
                  <LeaveTypeSelect
                    value={unifiedForm.leaveTypeId}
                    onChange={handleLeaveTypeChange}
                  />
                </div>
                <div>
                  <label>Policy Name</label>
                  <input
                    type="text"
                    value={unifiedForm.policyName || ""}
                    onChange={(e) => setUnifiedForm({ ...unifiedForm, policyName: e.target.value })}
                    placeholder="e.g. Sales Department Policy"
                    required
                  />
                </div>

              </div>

              <div className="policy-scroll-container">
                <div className="grid grid-cols-2 gap-4">

                  {/* 1. ELIGIBILITY RULES */}
                  <div className="col-span-2 policy-section">

                    <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginBottom: "12px", textAlign: "left" }}>
                      Eligibility rules
                    </div>
                    <div className="grid-2-col">

                      <div className="input-group">
                        <label>Location</label>
                        <select
                          name="location"
                          /* Directly use the value from unifiedForm */
                          value={unifiedForm.location || ""}
                          onChange={handleUnifiedChange}
                        >
                          <option value="">-- Select --</option>
                          <option value="ALL">All Locations</option>
                          {eligibilityOptions.locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label>Gender</label>
                        <select
                          name="gender"
                          value={unifiedForm.gender}
                          onChange={handleUnifiedChange}
                        >
                          <option value="">-- Select --</option>
                          <option value="ALL">All</option>
                          {eligibilityOptions.genders.map(gender => (
                            <option key={gender} value={gender}>{gender}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label>Yearly Quota / Utilization Limit</label>
                        <input
                          type="number"
                          name="yearlyQuota"
                          min="0"
                          step="0.5"
                          value={unifiedForm.yearlyQuota || ''}
                          onChange={handleUnifiedChange}
                          placeholder="e.g., 12"
                          required
                          style={{
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none',
                            appearance: 'textfield'
                          }}
                          onWheel={(e) => e.target.blur()}
                        />
                        <p className="helper-text">
                          Total leave days per year for this policy
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. ACCRUAL RULES */}
                  <div ref={accrualRef} className="col-span-2 policy-section">

                    <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginBottom: "12px", textAlign: "left" }}>
                      Accrual rules
                    </div>
                    <div className="grid-2-col">
                      <div className="input-group">
                        <label>Accrual Mode</label>
                        <select
                          name="accrualMode"
                          value={unifiedForm.accrualMode}
                          onChange={handleUnifiedChange}
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Pro-rata Accrual</label>
                        <select
                          name="proRata"
                          value={String(unifiedForm.proRata)}
                          onChange={handleUnifiedChange}
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>

                      </div>

                      {/* Menstrual Leave Hint */}
                      {(() => {
                        const currentType = types.find(t => String(t.id) === String(unifiedForm.leaveTypeId));
                        const isMenstrual = currentType?.name?.toUpperCase()?.includes("MENSTRUAL");


                      })()}
                      <div className="input-group">
                        <label>Accrual Date</label>
                        <select
                          name="accrualDateType"
                          value={unifiedForm.accrualDateType}
                          onChange={handleUnifiedChange}
                        >
                          {unifiedForm.accrualMode === 'MONTHLY' && (
                            <>
                              <option value="FIRST_DAY">1st of every month</option>
                              {/* <option value="LAST_DAY">End of every month</option> */}
                              <option value="CUSTOM_DAY">custom day of every month</option>
                            </>
                          )}
                          {unifiedForm.accrualMode === 'QUARTERLY' && (
                            <>
                              <option value="FIRST_DAY">1st of Quarter</option>
                              {/* <option value="LAST_DAY">End of Quarter (Mar/Jun/Sep/Dec)</option> */}
                              <option value="CUSTOM_DAY">custom day of every quarter</option>
                            </>
                          )}
                          {unifiedForm.accrualMode === 'YEARLY' && (
                            <>
                              <option value="FIRST_DAY">Jan 1 Every Year</option>
                              {/* <option value="LAST_DAY">Dec 31 Every Year</option> */}
                              <option value="CUSTOM_DAY">Specific Date Once Per Year</option>
                            </>
                          )}
                        </select>

                        {/* Show appropriate input based on mode and type */}
                        {unifiedForm.accrualDateType === 'CUSTOM_DAY' && (
                          <>
                            {(unifiedForm.accrualMode === 'MONTHLY' || unifiedForm.accrualMode === 'QUARTERLY') && (
                              <input
                                type="number"
                                name="customAccrualDay"
                                min="1"
                                max="31"
                                placeholder="Day of month (1-31)"
                                className="mt-2"
                                value={unifiedForm.customAccrualDay || ""}
                                onChange={handleUnifiedChange}
                              />
                            )}
                            {unifiedForm.accrualMode === 'YEARLY' && (
                              <input
                                type="date"
                                name="customAccrualDate"
                                className="mt-2"
                                value={unifiedForm.customAccrualDate || ""}
                                onChange={handleUnifiedChange}
                              />
                            )}
                          </>
                        )}
                      </div>
                      <div className="input-group">
                        <label>Negative Balance Allowed</label>
                        <select
                          name="negativeAllowed"
                          value={String(unifiedForm.negativeAllowed)}
                          onChange={handleUnifiedChange}
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Conditional Field - Only show when Negative Balance is Allowed */}
                      {unifiedForm.negativeAllowed && (
                        <div className="input-group">
                          <label>Max Negative Balance</label>
                          <input
                            type="number"
                            name="maxNegativeBalance"
                            value={unifiedForm.maxNegativeBalance || 0}
                            onChange={handleUnifiedChange}
                          />
                        </div>
                      )}

                      <div className="input-group">
                        <label>Rounding Rule</label>
                        <select
                          name="roundingRule"
                          value={unifiedForm.roundingRule || "NO_ROUND"}
                          onChange={handleUnifiedChange}
                        >
                          <option value="NO_ROUND">No Rounding</option>
                          <option value="UP">Round Up</option>
                          <option value="DOWN">Round Down</option>
                        </select>
                      </div>

                      {/* Spillover / Fallout Logic - Only for Optional Leave */}
                      {(() => {
                        const currentType = types.find(t => String(t.id) === String(unifiedForm.leaveTypeId));
                        const isOptional = currentType?.name?.toUpperCase()?.includes("OPTIONAL");

                        return isOptional && (
                          <div className="input-group col-span-2">
                            <label>Fallout / Spillover Target</label>
                            <select
                              name="falloutLeaveType"
                              value={unifiedForm.falloutLeaveType}
                              onChange={handleUnifiedChange}
                            >
                              <option value="">-- None (Reject if Quota Exceeded) --</option>
                              {types
                                .filter(t => String(t.id) !== String(unifiedForm.leaveTypeId)) // Avoid self-selection
                                .map(t => (
                                  <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                            <p className="helper-text">
                              If quota is exhausted, automatically deduct from this leave type (e.g., deduct from Earned Leaves).
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 3. CARRY FORWARD & LAPSE RULES */}
                  <div ref={carryRef} className="col-span-2 policy-section">
                    <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginBottom: "12px", textAlign: "left" }}>
                      Carry forward & lapse rules
                    </div>
                    <div className="grid-2-col">
                      <div className="input-group">
                        <label>Carry Forward Allowed</label>
                        <select
                          name="carryForwardAllowed"
                          value={String(unifiedForm.carryForwardAllowed)}
                          onChange={handleUnifiedChange}
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Conditional Fields - Only show when Carry Forward is Allowed */}
                      {unifiedForm.carryForwardAllowed && (
                        <>
                          <div className="input-group">
                            <label>Maximum Limit</label>
                            <input
                              type="number"
                              name="maxCarryForwardLimit"
                              min="0"
                              value={unifiedForm.maxCarryForwardLimit || 0}
                              onChange={handleUnifiedChange}
                            />
                          </div>
                          <div className="input-group">
                            <label>Carry Forward To</label>
                            <select
                              name="carryForwardTo"
                              value={unifiedForm.carryForwardTo}
                              onChange={handleUnifiedChange}
                            >
                              <option value="SAME">Same Leave Type</option>
                              <option value="ANOTHER">Other leave type</option>
                            </select>
                          </div>
                          <div className="input-group">
                            <label>Carry Forward Date</label>
                            <input
                              type="date"
                              name="carryForwardDate"
                              value={unifiedForm.carryForwardDate || ""}
                              onChange={handleUnifiedChange}
                            />
                          </div>
                        </>
                      )}

                    </div>
                  </div>

                  {/* 4. ENCASHMENT RULES */}
                  <div ref={encashRef} className="col-span-2 policy-section">
                    <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginBottom: "12px", textAlign: "left" }}>
                      Encashment rules
                    </div>
                    <div className="grid-2-col">
                      <div className="input-group">
                        <label>Encashment Allowed</label>
                        <select
                          name="encashmentAllowed"
                          value={String(unifiedForm.encashmentAllowed)}
                          onChange={handleUnifiedChange}
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Conditional Field - Only show when Encashment is Allowed */}
                      {unifiedForm.encashmentAllowed && (
                        <div className="input-group">
                          <label>Eligible candidates</label>
                          <select
                            name="encashEligibleCandidates"
                            value={unifiedForm.encashEligibleCandidates || "ALL"}
                            onChange={handleUnifiedChange}
                          >
                            <option value="ALL">All Employees</option>
                            <option value="Senior Management">Senior Management</option>
                            <option value="Management">Management</option>
                            <option value="Staff">Staff</option>
                          </select>
                        </div>
                      )}

                    </div>
                  </div>

                </div>

                {/* Save Button now inside scroll container */}
                <div className="flex justify-end gap-4 pt-4 mt-2 border-t border-slate-100 mb-12 bg-transparent w-full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={!unifiedForm.leaveTypeId}
                    style={{
                      backgroundColor: "#00B3A4",
                      color: "white",
                      padding: "10px 24px",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: "normal",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      opacity: !unifiedForm.leaveTypeId ? 0.6 : 1
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>


          </div>
        )}

        {/* ---------------------------
            APPROVAL FLOW TAB
        -----------------------------*/}
        {activeTab === "approval" && (
          <div className="card-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div style={{ textAlign: "left" }}>
                <div style={{
                  color: "#1F2937",
                  fontSize: "30px",
                  fontWeight: "normal",
                  textAlign: "left"
                }}>
                  Approval flow rules
                </div>
                <div style={{ color: "#00B3A4", fontSize: "15px", fontWeight: "normal", marginTop: "4px", textAlign: "left" }}>
                  Establish standard multi-level approval workflows for employee leave requests.
                </div>
              </div>
              <button
                type="button"
                onClick={addApproverSlot}
                style={{
                  backgroundColor: "transparent",
                  color: "#00B3A4",
                  border: "1px solid #00B3A4",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "normal",
                  cursor: "pointer",
                  fontSize: "0.95rem"
                }}
              >
                Add approver
              </button>
            </div>

            <form
              className="flex flex-col overflow-hidden relative"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="approval-scroll-container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-slate-100 pb-8">
                  <div>
                    <label>Leave type</label>
                    <LeaveTypeSelect value={approvalLeaveTypeId} onChange={(e) => setApprovalLeaveTypeId(e.target.value)} />
                  </div>
                  <div>
                    <label>Auto approval</label>
                    <select
                      value={String(approvalForm.autoApprove)}
                      onChange={(e) => setApprovalForm(prev => ({ ...prev, autoApprove: e.target.value === "true" }))}
                    >
                      <option value="false">No (Manual)</option>
                      <option value="true">Yes (Automatic)</option>
                    </select>
                  </div>
                </div>

                {!approvalForm.autoApprove ? (
                  <div className="space-y-4 mb-8">
                    <label>Configured approvers</label>
                    {approvalForm.approverIds.map((id, index) => (
                      <div key={index} className="approver-row">
                        <div>
                          <input
                            type="text"
                            placeholder="Enter Approver Employee ID"
                            value={id}
                            onChange={(e) => updateApproverId(index, e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeApproverSlot(index)}
                          className="btn-remove-row"
                          title="Remove Approver"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-teal-50/50 border border-teal-100 rounded-2xl text-center mb-8">
                    <p className="text-teal-700 font-bold mb-1 uppercase tracking-wider text-xs">System Auto-Approval Enabled</p>
                    <p className="text-slate-600 text-sm">All changes will be approved instantly by the system.</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4 bg-transparent w-full relative" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                   type="button"
                   onClick={submitApprovalWorkflow}
                   style={{
                    backgroundColor: "#00B3A4",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "normal",
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "policyHistory" && (
          <div className="card-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="policy-history-controls" style={{ marginBottom: "20px" }}>
              <div>
                <div style={{
                  color: "#1F2937",
                  fontSize: "30px",
                  fontWeight: "normal",
                  textAlign: "left"
                }}>
                  Policy history
                </div>
                <div style={{
                  color: "#00B3A4",
                  fontSize: "15px",
                  fontWeight: "normal",
                  textAlign: "left",
                  marginTop: "4px"
                }}>
                  Manage and audit your organization's leave configurations
                </div>
              </div>
            </div>

            {/* Leave Types List */}
            {loadingHistory ? (
              <div className="p-24 text-center bg-slate-50/50 rounded-[2rem] border-2 border-slate-100">
                <div className="animate-spin w-16 h-16 mx-auto mb-6 border-4 border-teal-400 border-t-transparent rounded-full shadow-lg shadow-teal-100"></div>
                <p className="text-2xl font-black text-slate-800 mb-2">Synchronizing Policies</p>
                <p className="text-slate-400 font-medium">Communicating with the policy engine...</p>
              </div>
            ) : types.length === 0 ? (
              <div className="p-24 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📭</div>
                <p className="text-2xl font-black text-slate-400 mb-2">Workspace Empty</p>
                <p className="text-slate-400 font-medium">Start by defining your first leave type in the configuration tab.</p>
              </div>
            ) : (
              <LeaveTypesList
                types={types}
                unifiedPolicies={unifiedPolicies}
                fetchPolicySummary={fetchPolicySummary}
                setSelectedPolicy={setSelectedPolicy}
                toggleTypeStatus={toggleTypeStatus}
                togglePolicyStatus={togglePolicyStatus}
                editType={editType}
              />
            )}

            {/* POLICY DETAIL MODAL - Standard CSS Classes */}
            {selectedPolicy && (
              <div className="modal-overlay-premium">
                <div className="modal-container-premium">
                  {/* Premium Header */}
                  <div className="modal-header-premium">
                    <div className="relative-z10">
                      <h2 className="modal-title-text" style={{ fontSize: '1.875rem', fontWeight: 900, margin: 0 }}>
                        {selectedPolicy.policyName}
                      </h2>
                      <p className="detail-label" style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }}>
                        Policy Details • #{selectedPolicy.id}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPolicy(null)}
                      className="modal-close-btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="modal-body-premium custom-scrollbar">
                    {/* LEAVE TYPE */}
                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <div className="detail-content">
                        <p className="detail-label">ASSOCIATED LEAVE TYPE</p>
                        <p className="detail-value">
                          {types.find(t => String(t.id) === String(selectedPolicy.leaveTypeId))?.name || 'Undefined'}
                        </p>
                      </div>
                    </div>

                    {/* ELIGIBILITY */}
                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="detail-content">
                        <p className="detail-label">ELIGIBILITY CRITERIA</p>
                        <div className="badge-premium-list">
                          <span className="badge-premium badge-blue">
                            📍 {selectedPolicy.location || 'All Locations'}
                          </span>
                          <span className="badge-premium badge-purple">
                            👤 {selectedPolicy.gender || 'All Genders'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* YEARLY QUOTA */}
                    <div className="detail-item">
                      <div className="detail-icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <div className="detail-content">
                        <p className="detail-label">ANNUAL LEAVE QUOTA</p>
                        <p className="detail-value" style={{ fontSize: '2rem' }}>{selectedPolicy.yearlyQuota || 0} <span className="detail-sub-value">Days / Year</span></p>
                      </div>
                    </div>

                    {/* Grid for Accrual and Carry Forward */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
                      {/* ACCRUAL */}
                      <div>
                        <p className="detail-label">ACCRUAL ENGINE</p>
                        <div style={{ background: '#F5F7FA', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9' }}>
                          <p className="detail-value" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{selectedPolicy.accrualMode || 'N/A'}</p>
                          <div style={{ fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ color: '#64748b' }}>Pro-Rata Credit</span>
                              <span className={`badge-premium ${selectedPolicy.proRata ? 'badge-emerald' : 'badge-slate'}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                                {selectedPolicy.proRata ? 'ENABLED' : 'DISABLED'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>Rounding</span>
                              <span style={{ fontWeight: 800 }}>{selectedPolicy.roundingRule?.replace('_', ' ') || 'NONE'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CARRY FORWARD */}
                      <div>
                        <p className="detail-label">CARRY FORWARD</p>
                        <div style={{ background: '#F5F7FA', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9' }}>
                          <p className="detail-value" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                            {selectedPolicy.carryForwardAllowed ? 'CONFIGURED' : 'NOT ALLOWED'}
                          </p>
                          {selectedPolicy.carryForwardAllowed && (
                            <div style={{ fontSize: '0.875rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b' }}>Max Rollover</span>
                                <span style={{ fontWeight: 800 }}>{selectedPolicy.maxCarryForwardLimit || 0} Days</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Target</span>
                                <span style={{ fontWeight: 800 }}>{selectedPolicy.carryForwardTo || 'SAME'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Parent Leave Type Status */}
                    <div style={{ marginTop: '2rem' }}>
                      <p className="detail-label">PARENT LEAVE TYPE STATUS</p>
                      {(() => {
                        const parentType = types.find(t => String(t.id) === String(selectedPolicy.leaveTypeId));
                        const isTypeActive = parentType?.active === "YES" || parentType?.active === true;
                        return (
                          <div style={{ padding: '1rem', background: isTypeActive ? '#f0fdf4' : '#F5F7FA', borderRadius: '1rem', border: '1px solid', borderColor: isTypeActive ? '#bbf7d0' : '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isTypeActive ? '#22c55e' : '#94a3b8' }}></div>
                              <span style={{ fontWeight: 800, color: isTypeActive ? '#166534' : '#475569' }}>{isTypeActive ? 'OPERATIONAL' : 'INACTIVE'}</span>
                            </div>
                            <button
                              onClick={(e) => toggleTypeStatus(e, parentType)}
                              className="btn-premium"
                              style={{ padding: '6px 16px', fontSize: '11px', background: isTypeActive ? '#ef4444' : '#22c55e' }}
                            >
                              {isTypeActive ? 'Deactivate Type' : 'Activate Type'}
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Individual Policy Status */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <p className="detail-label">INDIVIDUAL POLICY STATUS</p>
                      <div className="status-box-premium" style={{ height: 'auto', padding: '1.5rem' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="status-indicator">
                            <div className={`status-dot-premium ${selectedPolicy.active !== false ? 'active' : ''}`} style={{ backgroundColor: selectedPolicy.active !== false ? '#34d399' : '#64748b' }}></div>
                            <span className="status-text-modal">{selectedPolicy.active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                          </div>
                          <button
                            onClick={() => togglePolicyStatus(selectedPolicy)}
                            className="btn-premium"
                            style={{ height: '44px', background: selectedPolicy.active !== false ? '#ef4444' : '#34d399' }}
                          >
                            {selectedPolicy.active !== false ? 'Deactivate Policy' : 'Activate Policy'}
                          </button>
                        </div>
                      </div>
                      <p style={{ marginTop: '0.75rem', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        * Inactive policies will not be visible or applicable to employees even if the leave type is operational.
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '2rem', borderTop: '2px solid #f1f5f9', background: 'white', display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => {
                        editPolicy(selectedPolicy);
                        setActiveTab('leavePolicy');
                        setSelectedPolicy(null);
                      }}
                      className="btn-premium"
                      style={{ flex: 2, height: '56px', fontSize: '1.1rem', borderRadius: '1.25rem' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit Policy
                    </button>
                    <button
                      onClick={() => setSelectedPolicy(null)}
                      className="btn-premium"
                      style={{ flex: 1, height: '56px', background: '#0f172a', borderRadius: '1.25rem' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ToastNotification
        isOpen={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

// Leave Types List Component - Premium Edition
const LeaveTypesList = ({ types, unifiedPolicies, fetchPolicySummary, setSelectedPolicy, toggleTypeStatus, togglePolicyStatus, editType }) => {
  const [expandedTypes, setExpandedTypes] = React.useState({});

  const toggleExpanded = (typeId) => {
    setExpandedTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      {types.map((leaveType) => {
        const policiesForType = unifiedPolicies.filter(p => String(p.leaveTypeId) === String(leaveType.id));
        const isExpanded = expandedTypes[leaveType.id] || false;
        const isActive = leaveType.active === "YES" || leaveType.active === true;

        return (
          <div key={leaveType.id} className={`leave-type-card-modern ${isExpanded ? 'expanded' : ''}`}>
            {/* Improved Header */}
            <div className="type-header" onClick={() => toggleExpanded(leaveType.id)}>
              <div className="type-title-area">
                <div className="type-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="type-main-info">
                  <h4 className="type-name-text">{leaveType.name}</h4>
                  <p className="type-meta-text">
                    {policiesForType.length} {policiesForType.length === 1 ? 'Configured Policy' : 'Configured Policies'}
                  </p>
                </div>
              </div>

              <div className="type-actions">
                <span className={isActive ? 'tag-active' : 'tag-inactive'}>
                  {isActive ? '● OPERATIONAL' : '○ INACTIVE'}
                </span>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editType(leaveType);
                    }}
                    className="btn-icon-premium"
                    title="Edit Type Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>

                  <button
                    onClick={(e) => toggleTypeStatus(e, leaveType)}
                    className="btn-icon-premium"
                    style={{ color: isActive ? '#ef4444' : '#10b981', borderColor: isActive ? '#fecaca' : '#bbf7d0' }}
                    title={isActive ? 'Deactivate Leave Type' : 'Activate Leave Type'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  </button>

                  <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-teal-50 text-teal-500 rotate-180' : 'text-slate-300'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Modernized Expansion */}
            {isExpanded && (
              <div className="policy-grid-modern">
                {policiesForType.length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="font-bold text-slate-400">No policies created for {leaveType.name}</p>
                    <p className="text-sm text-slate-400 mt-1">Configure rules to see them appearing here.</p>
                  </div>
                ) : (
                  <>
                    {policiesForType.map((policy) => {
                      const isPolicyActive = policy.active !== false;
                      return (
                        <div
                          key={policy.id}
                          className="policy-item-card"
                          onClick={() => {
                            setSelectedPolicy(policy);
                            fetchPolicySummary(leaveType.id);
                          }}
                        >
                          <div className="policy-item-header">
                            <h5 className="policy-item-name">{policy.policyName}</h5>
                            <span className={isPolicyActive ? 'tag-active' : 'tag-inactive'}>
                              {isPolicyActive ? 'Active' : 'Draft'}
                            </span>
                          </div>

                          <div className="policy-item-stats">
                            <span className="stat-pill quota">
                              Capacity: {policy.yearlyQuota || 0} Days
                            </span>
                            <span className="stat-pill accrual">
                              Mode: {policy.accrualMode || 'N/A'}
                            </span>
                            <span className="stat-pill location">
                              Region: {policy.location || 'Global'}
                            </span>
                          </div>

                          <div className="mt-4 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click for details</span>
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
