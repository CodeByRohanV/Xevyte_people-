import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from "../api";
import Select from 'react-select';
import ToastNotification from '../components/ToastNotification';


const HelpDeskChangeRequestPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const resubmitTicket = location.state?.resubmitTicket;
    const editDraft = location.state?.editDraft;

    const [formData, setFormData] = useState({
        category: '',
        subcategory: '',
        issueSummary: '',
        detailedDescription: '',
    });

    const [isResubmitting, setIsResubmitting] = useState(false);
    const [isEditingDraft, setIsEditingDraft] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [issueSummaryCount, setIssueSummaryCount] = useState(0);
    const [descriptionCount, setDescriptionCount] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isCancelHovered, setIsCancelHovered] = useState(false);
    const [isDraftHovered, setIsDraftHovered] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState({
        isOpen: false,
        message: '',
        type: 'success'
    });
    const [isFileActive, setIsFileActive] = useState(false);

    const getCategoryName = (id) => {
        const c = categories.find(cat => cat.id === parseInt(id));
        return c ? c.categoryName : "";
    };

    const getSubCategoryName = (id) => {
        const s = subCategories.find(sub => sub.id === parseInt(id));
        return s ? s.subCategoryName : "";
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await api.get(
                `/v1/helpdesk-categories/ticket-type?ticketType=CHANGE_REQUEST`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCategories(res.data);

            // If resubmitting, find the ID for the category name
            if (resubmitTicket) {
                const foundCat = res.data.find(c => c.categoryName === resubmitTicket.category);
                if (foundCat) {
                    setFormData(prev => ({
                        ...prev,
                        category: foundCat.id.toString(),
                        issueSummary: resubmitTicket.issueSummary,
                        detailedDescription: resubmitTicket.detailedDescription
                    }));
                    setIsResubmitting(true);
                    setIssueSummaryCount(resubmitTicket.issueSummary?.length || 0);
                    setDescriptionCount(resubmitTicket.detailedDescription?.length || 0);
                }
            }

            // If editing draft, find the ID for the category name
            if (editDraft) {
                const foundCat = res.data.find(c => c.categoryName === editDraft.category);
                if (foundCat) {
                    setFormData(prev => ({
                        ...prev,
                        category: foundCat.id.toString(),
                        issueSummary: editDraft.issueSummary,
                        detailedDescription: editDraft.detailedDescription
                    }));
                    setIsEditingDraft(true);
                    setIssueSummaryCount(editDraft.issueSummary?.length || 0);
                    setDescriptionCount(editDraft.detailedDescription?.length || 0);
                }
            }
        } catch (err) {
            console.error("Category Load Error:", err);
        }
    };

    useEffect(() => {
        if (formData.category) {
            loadSubCategories(formData.category);
        } else {
            setSubCategories([]);
        }
    }, [formData.category]);

    const loadSubCategories = async (categoryId) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await api.get(
                `/v1/helpdesk-categories/${categoryId}/subcategories`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSubCategories(res.data);

            // If resubmitting, find the ID for the subcategory name
            if (resubmitTicket && formData.category === categoryId) {
                const foundSub = res.data.find(s => s.subCategoryName === resubmitTicket.subcategory);
                if (foundSub) {
                    setFormData(prev => ({
                        ...prev,
                        subcategory: foundSub.id.toString()
                    }));
                }
            }

            // If editing draft, find the ID for the subcategory name
            if (editDraft && formData.category === categoryId) {
                const foundSub = res.data.find(s => s.subCategoryName === editDraft.subcategory);
                if (foundSub) {
                    setFormData(prev => ({
                        ...prev,
                        subcategory: foundSub.id.toString()
                    }));
                }
            }
        } catch (err) {
            console.error("Subcategory Load Error:", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
            ...(name === 'category' && { subcategory: '' }),
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedExtensions = ['jpg', 'png', 'pdf', 'jpeg'];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            alert("Invalid file format. Supported: JPG, PNG, PDF, JPEG");
            e.target.value = ""; // Reset input
            setSelectedFile(null);
            return;
        }

        if (file.size > 2 * 1024 * 1024) {   // 2MB limit
            alert("File size exceeds 2MB limit. Please upload a smaller file.");
            e.target.value = ""; // Reset input
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
    };

    const getPropperDate = () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category) {
            alert('Please select a category.');
            return;
        }
        if (!formData.subcategory) {
            alert('Please select a subcategory.');
            return;
        }
        if (!formData.issueSummary) {
            alert('Please enter an issue summary.');
            return;
        }
        if (formData.detailedDescription.length < 20) {
            alert('Detailed Description must be at least 20 characters.');
            return;
        }

        // Project Assignment Validation
        try {
            let empId = sessionStorage.getItem("employeeId");
            if (empId && empId.startsWith('"') && empId.endsWith('"')) empId = empId.slice(1, -1);
            const todayStr = getPropperDate();
            const res = await api.get(`/allocations/employee/${empId}/date/${todayStr}`, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
            });

            if (!res.data || res.data.length === 0) {
                alert("You are not assigned to any project , please contact your manager or admin");
                return;
            }
        } catch (err) {
            console.error("Failed to verify project assignment", err);
        }

        const fd = new FormData();
        fd.append("issueSummary", formData.issueSummary);
        fd.append("detailedDescription", formData.detailedDescription);

        if (selectedFile) {
            fd.append("attachment", selectedFile);
        }

        try {
            const token = sessionStorage.getItem("token");
            let res;

            if (isResubmitting) {
                // If resubmitting, we only need to call the resubmit endpoint
                res = await api.put(`/tickets/resubmit/${resubmitTicket.id}`, fd, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                });
            } else {
                // Normal submission
                let empId = sessionStorage.getItem("employeeId");
                if (empId && empId.startsWith('"') && empId.endsWith('"')) empId = empId.slice(1, -1);

                fd.append("employeeId", empId);
                fd.append("ticketType", "CHANGE_REQUEST");
                fd.append("category", getCategoryName(formData.category));
                fd.append("subcategory", getSubCategoryName(formData.subcategory));

                res = await api.post("/tickets/change-request/submit", fd, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            if (res.status === 200 || res.status === 201) {
                alert(isResubmitting ? "Change Request resubmitted successfully!" : "Change Request submitted successfully! Ticket ID: " + res.data.id);

                // Delete the draft if we were editing one
                if (isEditingDraft && editDraft) {
                    try {
                        const token = sessionStorage.getItem("token");
                        await api.delete(`/tickets/change-request/draft/${editDraft.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (deleteErr) {
                        console.warn("Failed to delete draft after submission:", deleteErr);
                        // Don't show error to user since ticket was submitted successfully
                    }
                }

                // Clear location state if we were resubmitting or editing draft
                if (isResubmitting || isEditingDraft) {
                    navigate(location.pathname, { replace: true, state: {} });
                }

                setFormData({
                    category: '',
                    subcategory: '',
                    issueSummary: '',
                    detailedDescription: '',
                });
                setSelectedFile(null);
                setIsResubmitting(false);
                setIsEditingDraft(false);

                const fileInput = document.getElementById("file-upload");
                if (fileInput) fileInput.value = "";
            }
        } catch (err) {
            console.error("Submit Error:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Error submitting change request. Try again.";
            const cleanMessage = typeof errorMessage === 'string' && errorMessage.length > 200
                ? errorMessage.substring(0, 200) + "..."
                : errorMessage;
            alert(cleanMessage);
        }
    };

    const handleSaveAsDraft = async () => {
        // Save draft without mandatory field validations
        const fd = new FormData();
        fd.append("issueSummary", formData.issueSummary || '');
        fd.append("detailedDescription", formData.detailedDescription || '');
        fd.append("category", formData.category ? getCategoryName(formData.category) : '');
        fd.append("subcategory", formData.subcategory ? getSubCategoryName(formData.subcategory) : '');

        if (selectedFile) {
            fd.append("attachment", selectedFile);
        }

        try {
            const token = sessionStorage.getItem("token");
            let empId = sessionStorage.getItem("employeeId");
            if (empId && empId.startsWith('"') && empId.endsWith('"')) empId = empId.slice(1, -1);

            fd.append("employeeId", empId);
            fd.append("ticketType", "CHANGE_REQUEST");

            const res = await api.post("/tickets/change-request/draft", fd, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200 || res.status === 201) {
                alert("Draft saved successfully!");
                handleCancel();
            }
        } catch (err) {
            console.error("Save Draft Error:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Error saving draft. Try again.";
            const cleanMessage = typeof errorMessage === 'string' && errorMessage.length > 200
                ? errorMessage.substring(0, 200) + "..."
                : errorMessage;
            alert(cleanMessage);
        }
    };

    const handleCancel = (e) => {
        if (e) e.preventDefault();
        setFormData({
            category: '',
            subcategory: '',
            issueSummary: '',
            detailedDescription: '',
        });
        setSelectedFile(null);
        setIssueSummaryCount(0);
        setDescriptionCount(0);
        setIsResubmitting(false);
        setIsEditingDraft(false);
        const fileInput = document.getElementById("file-upload");
        if (fileInput) fileInput.value = "";
        if (isResubmitting || isEditingDraft) {
            navigate(location.pathname, { replace: true, state: {} });
        }
    };

    // Check for mobile view
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Modern Inline Styles with Grievance Hub Theme ---
    const styles = {
        container: {
            padding: isMobileView ? '10px' : '1.2rem 2rem',
            margin: '0',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            border: '1px solid #e2e8f0',
        },
        form: {
            padding: '0',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', sans-serif",
        },
        formGroup: {
            marginBottom: '14px',
        },
        formRow: {
            display: 'flex',
            flexDirection: isMobileView ? 'column' : 'row',
            gap: isMobileView ? '0' : '20px',
        },
        inputLabel: {
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#0b3d91',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            textTransform: 'none',
            letterSpacing: '0.03em',
        },
        inputField: {
            width: '100%',
            padding: '0 14px',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            boxSizing: 'border-box',
            fontSize: '0.875rem',
            color: '#0f172a',
            transition: 'all 0.3s ease',
            backgroundColor: '#ffffff',
            height: '48px',
        },
        selectField: {
            width: '100%',
            padding: '0 14px',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            boxSizing: 'border-box',
            fontSize: '0.875rem',
            color: '#0f172a',
            transition: 'all 0.3s ease',
            backgroundColor: '#ffffff',
            height: '48px',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2523475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            backgroundSize: '16px',
            cursor: 'pointer',
        },
        textAreaField: {
            width: '100%',
            padding: '12px 14px',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            boxSizing: 'border-box',
            fontSize: '0.875rem',
            color: '#0f172a',
            minHeight: '120px',
            resize: 'none',
            transition: 'all 0.3s ease',
            backgroundColor: '#ffffff',
            fontFamily: "'Inter', sans-serif",
        },
        fileSection: {
            display: 'flex',
            flexDirection: isMobileView ? 'column' : 'row',
            alignItems: isMobileView ? 'stretch' : 'center',
            marginTop: '8px',
            gap: isMobileView ? '10px' : '0',
        },
        fileUploadLabel: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #0b3d91 100%)',
            color: 'white',
            padding: isMobileView ? '10px 16px' : '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobileView ? 'center' : 'flex-start',
            fontSize: isMobileView ? '13px' : '14px',
            fontWeight: '600',
            marginRight: isMobileView ? '0' : '15px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            minHeight: isMobileView ? '40px' : 'auto',
        },
        fileNameDisplay: {
            color: '#64748b',
            fontSize: isMobileView ? '12px' : '14px',
        },
        submitButtonBase: {
            width: '100%',
            background: '#00B3A4',
            color: 'white',
            padding: isMobileView ? '12px 20px' : '14px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '48px',
            boxSizing: 'border-box',
        },
        submitButtonHover: {
            background: '#00968A',
            transform: 'translateY(-2px)',
        },
        buttonGroup: {
            display: 'flex',
            flexDirection: isMobileView ? 'column' : 'row',
            gap: '12px',
            marginTop: '20px',
        },
        cancelButtonBase: {
            flex: isMobileView ? 'none' : '1',
            background: '#ffffff',
            color: '#00b3a4',
            padding: isMobileView ? '12px 20px' : '14px 24px',
            border: '1.5px solid #00b3a4',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '48px',
            boxSizing: 'border-box',
        },
        cancelButtonHover: {
            borderColor: '#00b3a4',
            background: '#00b3a4',
            color: '#ffffff',
            transform: 'translateY(-2px)',
        },
        draftButtonBase: {
            flex: isMobileView ? 'none' : '1',
            background: '#ffffff',
            color: '#00B3A4',
            padding: isMobileView ? '12px 20px' : '14px 24px',
            border: '1.5px solid #00B3A4',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '48px',
            boxSizing: 'border-box',
        },
        draftButtonHover: {
            background: '#00B3A4',
            color: '#ffffff',
            transform: 'translateY(-2px)',
        },
    };

    const finalSubmitButtonStyle = {
        ...styles.submitButtonBase,
        ...(isHovered ? styles.submitButtonHover : {}),
        flex: isMobileView ? 'none' : '1', // Updated to equal space
    };

    const finalCancelButtonStyle = {
        ...styles.cancelButtonBase,
        ...(isCancelHovered ? styles.cancelButtonHover : {}),
    };

    const finalDraftButtonStyle = {
        ...styles.draftButtonBase,
        ...(isDraftHovered ? styles.draftButtonHover : {}),
    };

    // Bootstrap SVG Icons
    const icons = {
        category: (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
            </svg>
        ),
        summary: (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
            </svg>
        ),
        description: (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
                <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z" />
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
            </svg>
        ),
        attachment: (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px' }}>
                <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z" />
            </svg>
        ),
    };

    return (
        <>
            <div style={styles.container}>
                {isResubmitting && resubmitTicket?.resendReason && (
                    <div style={{
                        backgroundColor: "#fff3cd",
                        padding: "12px 16px",
                        borderRadius: "4px",
                        marginBottom: "20px",
                        borderLeft: "5px solid #f39c12",
                        fontSize: "14px",
                        color: "#856404",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                        <strong>Resend Reason:</strong> {resubmitTicket.resendReason}
                    </div>
                )}
                <form onSubmit={handleSubmit} style={styles.form}>

                    {/* Info Message */}
                    <div style={{
                        color: '#000000',
                        padding: '8px 0',
                        fontSize: isMobileView ? '12px' : '14px',
                        marginTop: '5px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'flex-start',
                    }}>
                        <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} fill="#00B3A4" viewBox="0 0 16 16" style={{ marginRight: '10px', flexShrink: 0, marginTop: '2px' }}>
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                        </svg>
                        <span>
                            Please note that all change requests may take up to <strong>10 working days</strong> to resolve. We request your patience and cooperation.
                        </span>
                    </div>
                    {/* Category and Subcategory */}
                    <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label htmlFor="category" style={styles.inputLabel}>
                                Category <span style={{ color: 'red' }}>*</span>
                            </label>
                            {isMobileView ? (
                                <Select
                                    id="category"
                                    name="category"
                                    value={formData.category ? { value: formData.category, label: getCategoryName(formData.category) } : null}
                                    onChange={(option) => handleChange({ target: { name: 'category', value: option ? option.value : '' } })}
                                    options={categories.map(cat => ({ value: cat.id.toString(), label: cat.categoryName }))}
                                    placeholder="Select Category"
                                    isDisabled={isResubmitting}
                                    isSearchable={false}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            ...styles.inputField,
                                            display: 'flex',
                                            height: '40px',
                                            minHeight: '40px',
                                            padding: '0 8px',
                                            borderColor: state.isFocused ? '#083D91' : '#cbd5e1',
                                            boxShadow: state.isFocused ? '0 0 0 3px rgba(8, 61, 145, 0.15)' : 'none',
                                            '&:hover': { borderColor: '#083D91' }
                                        }),
                                        valueContainer: (base) => ({ ...base, padding: '0' }),
                                        singleValue: (base) => ({ ...base, color: '#0f172a' }),
                                        placeholder: (base) => ({ ...base, color: '#94a3b8' }),
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, borderRadius: '8px', overflow: 'hidden' }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected ? '#083D91' : (state.isFocused ? '#f3f4f6' : '#fff'),
                                            '&:active': { backgroundColor: '#083D91' }
                                        })
                                    }}
                                />
                            ) : (
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    disabled={isResubmitting}
                                    style={styles.selectField}
                                    onFocus={(e) => { e.target.style.borderColor = '#083D91'; e.target.style.boxShadow = '0 0 0 3px rgba(8, 61, 145, 0.15)'; e.target.style.outline = 'none'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.categoryName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label htmlFor="subcategory" style={styles.inputLabel}>
                                Subcategory <span style={{ color: 'red' }}>*</span>
                            </label>
                            {isMobileView ? (
                                <Select
                                    id="subcategory"
                                    name="subcategory"
                                    value={formData.subcategory ? { value: formData.subcategory, label: getSubCategoryName(formData.subcategory) } : null}
                                    onChange={(option) => handleChange({ target: { name: 'subcategory', value: option ? option.value : '' } })}
                                    options={subCategories.map(sub => ({ value: sub.id.toString(), label: sub.subCategoryName }))}
                                    placeholder="Select Subcategory"
                                    isDisabled={!formData.category || isResubmitting}
                                    isSearchable={false}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            ...styles.inputField,
                                            display: 'flex',
                                            height: '40px',
                                            minHeight: '40px',
                                            padding: '0 8px',
                                            borderColor: state.isFocused ? '#083D91' : '#cbd5e1',
                                            boxShadow: state.isFocused ? '0 0 0 3px rgba(8, 61, 145, 0.15)' : 'none',
                                            '&:hover': { borderColor: '#083D91' }
                                        }),
                                        valueContainer: (base) => ({ ...base, padding: '0' }),
                                        singleValue: (base) => ({ ...base, color: '#0f172a' }),
                                        placeholder: (base) => ({ ...base, color: '#94a3b8' }),
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, borderRadius: '8px', overflow: 'hidden' }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected ? '#083D91' : (state.isFocused ? '#f3f4f6' : '#fff'),
                                            '&:active': { backgroundColor: '#083D91' }
                                        })
                                    }}
                                />
                            ) : (
                                <select
                                    id="subcategory"
                                    name="subcategory"
                                    value={formData.subcategory}
                                    onChange={handleChange}
                                    disabled={!formData.category || isResubmitting}
                                    style={styles.selectField}
                                    onFocus={(e) => { e.target.style.borderColor = '#083D91'; e.target.style.boxShadow = '0 0 0 3px rgba(8, 61, 145, 0.15)'; e.target.style.outline = 'none'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                >
                                    <option value="">Select Subcategory</option>
                                    {subCategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.subCategoryName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                    </div>

                    {/* Issue Summary and Detailed Description in Row 2 */}
                    <div style={styles.formRow}>
                        {/* Issue Summary */}
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label htmlFor="issueSummary" style={styles.inputLabel}>
                                Issue Summary <span style={{ color: 'red' }}>*</span>
                            </label>
                            <textarea
                                id="issueSummary"
                                name="issueSummary"
                                rows="2"
                                placeholder="Enter a descriptive title of the change request"
                                value={formData.issueSummary}
                                onChange={(e) => {
                                    setIssueSummaryCount(e.target.value.length);
                                    handleChange(e);
                                }}
                                maxLength={200}
                                style={styles.textAreaField}
                                onFocus={(e) => { e.target.style.borderColor = '#083D91'; e.target.style.boxShadow = '0 0 0 3px rgba(8, 61, 145, 0.15)'; e.target.style.outline = 'none'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                            />
                            <div style={{ fontSize: "12px", color: "#64748b", textAlign: "right", marginTop: '4px' }}>
                                {issueSummaryCount}/200 characters
                            </div>
                        </div>

                        {/* Detailed Description */}
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label htmlFor="detailedDescription" style={styles.inputLabel}>
                                Detailed Description (Min 20 characters) <span style={{ color: 'red' }}>*</span>
                            </label>
                            <textarea
                                id="detailedDescription"
                                name="detailedDescription"
                                rows="2"
                                placeholder="Describe the change required in detail..."
                                value={formData.detailedDescription}
                                onChange={(e) => {
                                    setDescriptionCount(e.target.value.length);
                                    handleChange(e);
                                }}
                                maxLength={200}
                                style={styles.textAreaField}
                                onFocus={(e) => { e.target.style.borderColor = '#083D91'; e.target.style.boxShadow = '0 0 0 3px rgba(8, 61, 145, 0.15)'; e.target.style.outline = 'none'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                            />
                            <div style={{ fontSize: "12px", color: "#64748b", textAlign: "right", marginTop: '4px' }}>
                                {descriptionCount}/200 characters
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div style={{ ...styles.formGroup }}>
                        <label style={styles.inputLabel}>
                            Attachment (Optional)
                        </label>
                        <div
                            onMouseEnter={() => setIsFileActive(true)}
                            onMouseLeave={() => setIsFileActive(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                border: (selectedFile || isFileActive) ? '1.5px solid #00B3A4' : '1.5px solid #cbd5e1',
                                borderRadius: '8px',
                                height: '42px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                                boxSizing: 'border-box',
                                transition: 'all 0.25s ease',
                                boxShadow: isFileActive ? '0 0 0 3px rgba(0, 179, 164, 0.15)' : 'none'
                            }}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <label
                                htmlFor="file-upload"
                                onFocus={() => setIsFileActive(true)}
                                onBlur={() => setIsFileActive(false)}
                                tabIndex={0}
                                style={{
                                    backgroundColor: '#eef2f6',
                                    padding: '0 1.5rem',
                                    cursor: 'pointer',
                                    borderRight: (selectedFile || isFileActive) ? '1.5px solid #00B3A4' : '1.5px solid #cbd5e1',
                                    fontWeight: 800,
                                    color: (selectedFile || isFileActive) ? '#00B3A4' : '#475569',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.8125rem',
                                    letterSpacing: '0.05em',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    transition: 'all 0.25s ease',
                                    textTransform: 'none',
                                    outline: 'none'
                                }}
                            >
                                Choose File
                            </label>
                            <span style={{
                                padding: '0 1rem',
                                color: selectedFile ? '#1e293b' : '#94a3b8',
                                fontSize: '0.875rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                            }}>
                                {selectedFile ? selectedFile.name : 'No file chosen'}
                            </span>
                        </div>
                        <span className="grievance-helper-text" style={{ textAlign: 'left', display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>Allowed: PDF, JPG, PNG (Max: 2 MB)</span>
                    </div>

                    {/* Button Group */}
                    <div style={styles.buttonGroup}>
                        <button
                            type="submit"
                            style={finalSubmitButtonStyle}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            Submit Change Request
                        </button>

                        <button
                            type="button"
                            style={finalDraftButtonStyle}
                            onMouseEnter={() => setIsDraftHovered(true)}
                            onMouseLeave={() => setIsDraftHovered(false)}
                            onClick={handleSaveAsDraft}
                        >
                            Save as Draft
                        </button>

                        <button
                            type="button"
                            className="helpdesk-cancel-button"
                            style={finalCancelButtonStyle}
                            onMouseEnter={() => setIsCancelHovered(true)}
                            onMouseLeave={() => setIsCancelHovered(false)}
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* Toast Notification */}
            <ToastNotification
                isOpen={toast.isOpen}
                onClose={() => setToast({ ...toast, isOpen: false })}
                message={toast.message}
                type={toast.type}
            />
        </>
    );
};

export default HelpDeskChangeRequestPage;