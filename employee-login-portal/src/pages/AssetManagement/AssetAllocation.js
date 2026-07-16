import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import api from "../../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../OnBoardingPage.css";
import ToastNotification from "../../components/ToastNotification";

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

const SmartDatePicker = ({ value, onChange, placeholder, required, maxDate, minDate }) => {
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={onChange}
            dateFormat="dd-MM-yyyy"
            placeholderText={placeholder || "Select date"}
            className="date-picker-input"
            wrapperClassName="date-picker-wrapper"
            customInput={<input className="form-control" required={required} />}
            maxDate={maxDate}
            minDate={minDate}
            renderCustomHeader={({
                date, changeYear, changeMonth, decreaseMonth, increaseMonth,
            }) => {
                const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 120 }, (_, i) => currentYear + 10 - i);
                return (
                    <div className="custom-calendar-header">
                        <div className="calendar-header-banner">
                            <button type="button" className="header-nav-btn prev" onClick={(e) => { e.preventDefault(); setMonthOpen(false); setYearOpen(false); decreaseMonth(); }}>‹</button>
                            <div className="header-main-content">
                                <div className="header-text-group">
                                    <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setMonthOpen(!monthOpen); setYearOpen(false); }}>{months[date.getMonth()]}</span>
                                    <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setYearOpen(!yearOpen); setMonthOpen(false); }}>{date.getFullYear()}</span>
                                </div>
                            </div>
                            <button type="button" className="header-nav-btn next" onClick={(e) => { e.preventDefault(); setMonthOpen(false); setYearOpen(false); increaseMonth(); }}>›</button>
                        </div>
                        {monthOpen && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{months.map((m, idx) => (<div key={m} className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`} onClick={() => { changeMonth(idx); setMonthOpen(false); }}>{m}</div>))}</div></div>)}
                        {yearOpen && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map((y) => (<div key={y} className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`} onClick={() => { changeYear(y); setYearOpen(false); }}>{y}</div>))}</div></div>)}
                    </div>
                );
            }}
        />
    );
};


const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        border: '2px solid #e5e7eb',
        fontSize: '0.9rem',
        color: '#374151',
        background: '#ffffff',
        minHeight: '46px',
        minWidth: '300px',
        width: '100%',
        boxShadow: state.isFocused
            ? '0 0 0 3px rgba(59,130,246,0.1)'
            : '0 1px 2px rgba(0,0,0,0.05)'
    }),

    valueContainer: (provided) => ({
        ...provided,
        padding: '0 14px',
        flex: '1',
        minWidth: '200px',
        width: 'auto'
    }),

    input: (provided) => ({
        ...provided,
        margin: 0,
        padding: 0,
        color: '#374151',
        fontSize: '0.9rem',
        lineHeight: 'normal',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        width: 'auto',
        flex: '1',
        minWidth: '100px'
    }),

    indicatorsContainer: (provided) => ({
        ...provided,
        height: '46px'
    }),

    menu: (provided) => ({
        ...provided,
        zIndex: 99999,
        minWidth: '300px',
        width: 'auto'
    }),

    menuPortal: (base) => ({
        ...base,
        zIndex: 99999
    }),

    menuList: (provided) => ({
        ...provided,
        minWidth: '300px',
        width: 'auto',
        maxHeight: '140px',
        overflowY: 'auto'
    }),

    option: (provided, state) => ({
        ...provided,
        width: 'auto',
        minWidth: '300px',
        whiteSpace: 'nowrap',
        padding: '8px 12px'
    }),

    singleValue: (provided) => ({
        ...provided,
        color: '#374151',
        fontSize: '0.9rem',
        width: 'auto',
        minWidth: '100px'
    }),

    placeholder: (provided) => ({
        ...provided,
        color: '#9ca3af',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap'
    })
};


const AssetAllocation = ({ onAssetChange }) => {
    const [allocations, setAllocations] = useState([]);
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingAllocation, setViewingAllocation] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewItem, setPreviewItem] = useState({ title: '', image: '' });
    const [loading, setLoading] = useState(false);

    const getImageSrc = (imageData) => {
        if (!imageData) return null;
        if (typeof imageData !== 'string') return null; // In case it's not a string
        if (imageData.startsWith('data:image')) return imageData;
        return `data:image/png;base64,${imageData}`;
    };
    const token = sessionStorage.getItem("token");
    const employeeId = sessionStorage.getItem("employeeId");
    const employeeName = sessionStorage.getItem("employeeName");

    const [newAllocation, setNewAllocation] = useState({
        asset: { id: '' },
        employee: { employeeId: '' },
        conditionAtIssue: '',
        accessoriesIssued: '',
        issuedImage: '',
        issuedImageName: '',
        expectedReturnDate: '',
        dynamicValues: {} // Store dynamic field values for allocation
    });

    const [selectedAssetDetails, setSelectedAssetDetails] = useState(null);

    const [customConditions, setCustomConditions] = useState([]);

    const formatDateToDDMMYYYY = (val) => {
        if (val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = val.split('-');
            return `${day}-${month}-${year}`;
        }
        return val;
    };

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedAllocation, setSelectedAllocation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [returnData, setReturnData] = useState({
        conditionAtReturn: '',
        returnImage: '',
        returnImageName: '',
        damageNotes: '',
        verifiedBy: 'ADMIN' // Default for now
    });

    const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        const msgStr = message?.message || (typeof message === 'object' ? JSON.stringify(message) : String(message));
        if (type === 'error') {
            window.alert(msgStr);
        } else {
            setToast({ isOpen: true, message: msgStr, type });
        }
    };

    const closeToast = () => {
        setToast(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);


    const fetchOptions = async () => {
        if (!token) return;
        try {
            const res = await api.get('/assets/options/CONDITION');
            setCustomConditions(res.data.map(opt => opt.value));
        } catch (error) {
            console.error("Error fetching options", error);
        }
    };

    const fetchEmployees = async () => {
        if (!token) return;
        try {
            const res = await api.get('/employees');
            const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching employees", error);
        }
    };
    const customFilter = (option, inputValue) => {
        if (!inputValue) return true;

        const search = inputValue.toLowerCase();

        return (
            option.label.toLowerCase().includes(search) ||
            option.value.toString().toLowerCase().includes(search)
        );
    };

    const handleAssetSelection = async (assetId) => {
        if (!assetId) {
            setSelectedAssetDetails(null);
            setNewAllocation(prev => ({ ...prev, asset: { id: assetId }, dynamicValues: {} }));
            return;
        }

        try {
            const res = await api.get(`/assets/${assetId}`);
            const assetDetails = res.data;
            setSelectedAssetDetails(assetDetails);

            // Initialize dynamic values with existing asset values or empty
            const initialDynamicValues = {};
            if (assetDetails.dynamicValues) {
                Object.keys(assetDetails.dynamicValues).forEach(key => {
                    initialDynamicValues[key] = assetDetails.dynamicValues[key];
                });
            }

            setNewAllocation(prev => ({
                ...prev,
                asset: { id: assetId },
                dynamicValues: initialDynamicValues
            }));
        } catch (error) {
            console.error("Error fetching asset details:", error);
            setSelectedAssetDetails(null);
            setNewAllocation(prev => ({ ...prev, asset: { id: assetId }, dynamicValues: {} }));
        }
    };

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Parallel API calls for better performance
            const [response, assetRes] = await Promise.all([
                api.get(`/assets/allocations?size=500`),
                api.get(`/assets`)
            ]);

            const allocRes = response;
            // Robust data extraction: handle both array responses and Spring Data Page objects
            const actualAllocations = Array.isArray(allocRes.data) ? allocRes.data : (allocRes.data?.content || []);
            setAllocations(actualAllocations);
            // Robust status detection: ONLY show assets that are available
            const assetData = Array.isArray(assetRes.data) ? assetRes.data : (assetRes.data?.content || []);
            const getStatus = (asset) => {
                const s = (asset.dynamicValues?.['Status'] ||
                    asset.dynamicValues?.['Asset Status'] ||
                    asset.status ||
                    'IN_STOCK').toUpperCase().replace(/[^A-Z]/g, '');
                return s;
            };

            const availableAssets = assetData.filter(a => {
                const s = getStatus(a);
                // Allow INSTOCK, AVAILABLE, or anything not explicitly allocated/disposed/maintenance
                return s === 'INSTOCK' || s === 'AVAILABLE' || (!a.assignedToEmployee && s !== 'ALLOCATED' && s !== 'DISPOSED' && s !== 'MAINTENANCE');
            });
            setAssets(availableAssets);
            fetchEmployees(); // Initial fetch
        } catch (error) {
            console.error("Error fetching data", error);
            showToast("Failed to fetch allocation records. Please try again later.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newAllocation.asset.id) {
            alert("Please select an asset to issue");
            return;
        }
        if (!newAllocation.employee.employeeId) {
            alert("Please select an employee to assign");
            return;
        }
        if (!newAllocation.conditionAtIssue || newAllocation.conditionAtIssue.trim() === '') {
            alert("Please select Condition at Issue");
            return;
        }
        try {
            const targetEmployee = employees.find(e => e.employeeId === newAllocation.employee.employeeId);
            const payload = {
                ...newAllocation,
                employee: targetEmployee
            };
            await api.post('/assets/allocations?userId=ADMIN', payload);
            setShowModal(false);
            setNewAllocation({
                asset: { id: '' },
                employee: { employeeId: '' },
                conditionAtIssue: '',
                accessoriesIssued: '',
                issuedImage: '',
                expectedReturnDate: '',
                dynamicValues: {}
            });
            setSelectedAssetDetails(null);
            // Parallel execution for better performance
            await Promise.all([fetchData(), onAssetChange?.()]);
            alert("Asset allocated successfully");
        } catch (error) {
            showToast(error.response?.data || "Error allocating asset", 'error');
        }
    };

    const handleDelete = async (allocationId, allocationTag) => {
        if (!window.confirm(`Are you sure you want to delete allocation ${allocationTag}? This will return the asset to stock.`)) {
            return;
        }
        try {
            await api.delete(`/assets/allocations/${allocationId}?userId=ADMIN`);
            // Parallel execution for better performance
            await Promise.all([fetchData(), onAssetChange?.()]);
            alert("Allocation record deleted");
        } catch (error) {
            showToast(error.response?.data || "Error deleting allocation", 'error');
        }
    };

    const handleReturn = async () => {
        if (!returnData.conditionAtReturn) {
            showToast("Please specify condition at return", 'error');
            return;
        }
        try {
            const payload = {
                conditionAtReturn: returnData.conditionAtReturn,
                returnImage: returnData.returnImage,
                damageNotes: returnData.damageNotes,
                verifiedBy: `${employeeName || 'Admin'} (${employeeId || 'System'})`,
                userId: employeeId || 'ADMIN'
            };
            await api.post(`/assets/allocations/${selectedAllocation.id}/return`, payload);
            setShowReturnModal(false);
            setReturnData({ conditionAtReturn: '', returnImage: '', damageNotes: '', verifiedBy: 'ADMIN' });

            // Parallel execution for better performance
            await Promise.all([fetchData(), onAssetChange?.()]);
            alert("Asset returned to stock successfully");
        } catch (error) {
            showToast(error.response?.data || "Error processing return", 'error');
        }
    };

    return (
        <div className="asset-allocation">
            <style>{`
                input.asset-search-input {
                    border-radius: 8px !important;
                }
                .modal-content::-webkit-scrollbar {
                    width: 10px !important;
                }
                .modal-content::-webkit-scrollbar-track {
                    background: #f8fafc !important;
                    border-radius: 10px;
                }
                .modal-content::-webkit-scrollbar-thumb {
                    background: #cbd5e1 !important;
                    border-radius: 10px;
                    border: 3px solid #f8fafc;
                }
                .modal-content::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8 !important;
                }
                
                /* Custom scrollbar for the modal body */
                .modal-body-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .modal-body-scroll::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .modal-body-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .modal-body-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                /* Enhanced Form Styling */
                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 0px !important;
                    padding-bottom: 0px !important;
                    line-height: 1.1 !important;
                    text-transform: none;
                    letter-spacing: 0.025em;
                }

                .form-control {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: #374151;
                    background: #ffffff;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    margin-top: 0px !important;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
                    transform: translateY(-1px);
                }

                .form-control:hover {
                    border-color: #d1d5db;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
                }

                .form-control::placeholder {
                    color: #9ca3af;
                    font-style: italic;
                }

                /* Button Enhancements */
                .btn-primary {
                    background: linear-gradient(135deg, #1557b7 0%, #1557b7 100%);
                    border: none;
                    border-radius: 10px;
                    padding: 12px 24px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-primary:hover {
                    background: linear-gradient(135deg, #1557b7 0%, #1557b7 100%);
                    box-shadow: 0 6px 8px rgba(59, 130, 246, 0.35);
                    transform: translateY(-2px);
                }

                .btn-primary:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.25);
                }

                .btn-secondary {
                    background: #ffffff;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 12px 24px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-secondary:hover {
                    background: #f9fafb;
                    border-color: #d1d5db;
                    color: #374151;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                    transform: translateY(-1px);
                }

                .btn-secondary:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                /* Section Card Styling */
                .section-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                }

                .section-card:hover {
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border-color: #d1d5db;
                }

                /* Asset Details Card Enhancement */
                .asset-details-card {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                    position: relative;
                    overflow: hidden;
                }

                .asset-details-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
                }

                /* Field Value Display */
                .field-value {
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-size: 0.875rem;
                    color: #374151;
                    font-weight: 500;
                    min-height: 42px;
                    display: flex;
                    align-items: center;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
                }

                .field-value:empty::before {
                    content: 'N/A';
                    color: #9ca3af;
                    font-style: italic;
                }

                /* Icon Styling */
                .section-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                /* Header Enhancement */
                .section-header-enhanced {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #f1f5f9;
                }

                .section-title-enhanced {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0;
                    letter-spacing: -0.025em;
                }

                .section-subtitle {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 4px 0 0 0;
                    font-weight: 400;
                }

                /* Enhanced react-select input styling - Force text visibility */
                .react-select__input-container {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: transparent !important;
                    flex: 1 !important;
                    width: auto !important;
                    min-width: 150px !important;
                    position: relative !important;
                }

                .react-select__input-container input {
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    color: #374151 !important;
                    font-size: 0.9rem !important;
                    line-height: normal !important;
                    width: 100% !important;
                    min-width: 100px !important;
                    position: relative !important;
                    z-index: 1 !important;
                }

                .react-select__control {
                    box-shadow: none !important;
                    min-width: 300px !important;
                    width: 100% !important;
                    border-radius: 8px !important;
                    margin-top: 0px !important;
                }

                .react-select__control--is-focused {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
                }

                .react-select__value-container {
                    padding: 0 14px !important;
                    flex: 1 !important;
                    width: auto !important;
                    min-width: 200px !important;
                    position: relative !important;
                }

                .react-select__single-value {
                    color: #374151 !important;
                    font-size: 0.9rem !important;
                    width: auto !important;
                    min-width: 100px !important;
                    white-space: nowrap !important;
                    position: relative !important;
                    z-index: 1 !important;
                }

                .react-select__menu {
                    width: auto !important;
                    min-width: 300px !important;
                    z-index: 9999 !important;
                }

                .react-select__menu-list {
                    width: auto !important;
                    min-width: 300px !important;
                }

                .react-select__option {
                    width: auto !important;
                    min-width: 300px !important;
                    white-space: nowrap !important;
                    padding: 8px 12px !important;
                }

                .react-select__placeholder {
                    color: #9ca3af !important;
                    font-size: 0.9rem !important;
                    white-space: nowrap !important;
                    width: auto !important;
                    min-width: 100px !important;
                }
                /* Table Refinements */
                .asset-table {
                    border-collapse: separate;
                    border-spacing: 0;
                    width: 100%;
                }
                .asset-table th {
                    background: #1F6FEB !important;
                    color: white !important;
                    font-weight: 700 !important;
                    text-transform: none !important;
                    letter-spacing: 0.05em !important;
                    font-size: 15px !important;
                    padding: 12px 16px !important;
                    border-bottom: 2px solid #1557b7 !important;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .asset-table td {
                    padding: 12px 16px !important;
                    font-size: 0.8rem !important;
                    color: #1e293b !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
            `}</style>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>

                <div style={{ position: 'relative', flex: '0 1 400px', display: 'flex', alignItems: 'center' }}>
                    <input
                        className="asset-search-input"
                        type="text"
                        placeholder="Search by tag, employee name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ borderRadius: 8 }}
                        ref={(el) => {
                            if (el) {
                                el.style.setProperty('border-radius', '8px', 'important');
                            }
                        }}
                    />
                    {searchTerm && (
                        <i
                            className="bi bi-x-circle-fill"
                            onClick={() => setSearchTerm('')}
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1', cursor: 'pointer' }}
                        ></i>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginRight: '10px' }}>
                        {['ALL', 'ACTIVE', 'RETURNED'].map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    background: statusFilter === f ? 'white' : 'transparent',
                                    color: statusFilter === f ? '#00B3A4' : '#64748b',
                                    boxShadow: statusFilter === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button className="btn-primary" onClick={() => {
                        setNewAllocation({
                            asset: { id: '' },
                            employee: { employeeId: '' },
                            conditionAtIssue: '',
                            accessoriesIssued: '',
                            issuedImage: '',
                            issuedImageName: '',
                            expectedReturnDate: '',
                            dynamicValues: {}
                        });
                        setSelectedAssetDetails(null);
                        setShowModal(true);
                        fetchEmployees();
                    }} style={{ backgroundColor: '#00B3A4', background: '#00B3A4', boxShadow: '0 4px 12px rgba(0, 179, 164, 0.3)' }}>
                        + New Allocation
                    </button>
                </div>
            </div>

            <div style={{ marginLeft: 'auto', borderLeft: '1px solid #cbd5e1', paddingLeft: '20px', height: '24px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                    {searchTerm ? (
                        `Filtered: ${(Array.isArray(allocations) ? allocations : []).filter(alc => {
                            const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
                            if (searchTerms.length === 0) return true;

                            return searchTerms.every(term => {
                                const isMatch = (val, searchStr) => {
                                    if (val === null || val === undefined || val === '') return false;
                                    return String(val).toLowerCase().includes(searchStr);
                                };

                                // 1. Search in specific allocation fields
                                const alcSearch = [
                                    alc.allocationId,
                                    alc.conditionAtIssue,
                                    alc.accessoriesIssued,
                                    alc.notes
                                ].some(v => isMatch(v, term));

                                // 2. Search in specific asset fields
                                const assetSearch = alc.asset ? [
                                    alc.asset.assetTag,
                                    alc.asset.serialNumber,
                                    alc.asset.location,
                                    alc.asset.price
                                ].some(v => isMatch(v, term)) : false;

                                // 3. Search in allocation-specific dynamic values
                                const dynamicSearch = Object.values(alc.dynamicValues || {}).some(v => isMatch(v, term));

                                // 4. Employee Search
                                const emp = alc.employee;
                                const employeeSearch = [
                                    emp?.firstName,
                                    emp?.lastName,
                                    emp?.employeeId,
                                    (emp?.firstName && emp?.lastName ? `${emp.firstName} ${emp.lastName}` : '')
                                ].some(e => isMatch(e, term));

                                // 5. Category Search
                                const categorySearch = [
                                    alc.asset?.category?.name,
                                    alc.asset?.subCategory?.name
                                ].some(n => isMatch(n, term));

                                // 6. Status Search
                                const statusText = alc.returnDate ? 'returned' : 'allocated';
                                const statusSearch = statusText.includes(term);

                                // 7. Date Search
                                const dateSearch = [
                                    alc.allocationDate,
                                    alc.expectedReturnDate
                                ].some(d => {
                                    if (!d) return false;
                                    const dateObj = new Date(d);
                                    if (isNaN(dateObj)) return false;
                                    const formatted = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
                                    return formatted.includes(term);
                                });

                                return alcSearch || assetSearch || dynamicSearch || employeeSearch || categorySearch || statusSearch || dateSearch;
                            });
                        }).length} of ${allocations.length} records`
                    ) : (
                        `Total Allocation Records: ${allocations.length}`
                    )}
                </span>
            </div>


            <div className="asset-table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 350px)', position: 'relative' }}>
                    <table className="asset-table" style={{ minWidth: '1200px' }}>
                        <thead>
                            <tr>
                                <th>Allocation ID</th>
                                <th>Asset Tag</th>
                                <th>Employee ID</th>
                                <th>Employee Name</th>
                                <th>Allocated Date</th>
                                <th>Expected Return</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const safeAllocations = Array.isArray(allocations) ? allocations : [];
                                const filteredAllocations = safeAllocations.filter(alc => {
                                    // Status Filter
                                    if (statusFilter === 'ACTIVE' && alc.returnDate) return false;
                                    if (statusFilter === 'RETURNED' && !alc.returnDate) return false;

                                    const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
                                    if (searchTerms.length === 0) return true;

                                    return searchTerms.every(term => {
                                        const isMatch = (val, searchStr) => {
                                            if (val === null || val === undefined || val === '') return false;
                                            return String(val).toLowerCase().includes(searchStr);
                                        };

                                        // 1. Search in specific allocation fields
                                        const alcSearch = [
                                            alc.allocationId,
                                            alc.conditionAtIssue,
                                            alc.conditionAtReturn,
                                            alc.accessoriesIssued,
                                            alc.damageNotes
                                        ].some(v => isMatch(v, term));

                                        // 2. Search in specific asset fields
                                        const assetSearch = alc.asset ? [
                                            alc.asset.assetTag,
                                            alc.asset.serialNumber,
                                            alc.asset.location,
                                            alc.asset.price
                                        ].some(v => isMatch(v, term)) : false;

                                        // 3. Search in allocation-specific dynamic values
                                        const dynamicSearch = Object.values(alc.dynamicValues || {}).some(v => isMatch(v, term));

                                        // 4. Employee Search
                                        const emp = alc.employee;
                                        const employeeSearch = [
                                            emp?.firstName,
                                            emp?.lastName,
                                            emp?.employeeId,
                                            (emp?.firstName && emp?.lastName ? `${emp.firstName} ${emp.lastName}` : '')
                                        ].some(e => isMatch(e, term));

                                        // 5. Category Search
                                        const categorySearch = [
                                            alc.asset?.category?.name,
                                            alc.asset?.subCategory?.name
                                        ].some(n => isMatch(n, term));

                                        // 6. Status Search
                                        const statusText = alc.returnDate ? 'returned' : 'allocated';
                                        const statusSearch = statusText.includes(term);

                                        // 7. Date Search
                                        const dateSearch = [
                                            alc.allocationDate,
                                            alc.expectedReturnDate
                                        ].some(d => {
                                            if (!d) return false;
                                            const dateObj = new Date(d);
                                            if (isNaN(dateObj)) return false;
                                            const formatted = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
                                            return formatted.includes(term);
                                        });

                                        return alcSearch || assetSearch || dynamicSearch || employeeSearch || categorySearch || statusSearch || dateSearch;
                                    });
                                }).sort((a, b) => b.id - a.id);

                                if (allocations.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '100px 20px', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                    <i className="bi bi-clipboard" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
                                                    <div style={{ color: '#64748b', fontWeight: '500' }}>
                                                        {loading ? 'Fetching records...' : 'No allocation records found.'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                if (filteredAllocations.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '100px 20px', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                    <i className="bi bi-search" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
                                                    <div style={{ color: '#64748b', fontWeight: '600', fontSize: '1.1rem' }}>No matching allocations found.</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '400px' }}>
                                                        We couldn't find any allocation records matching your criteria.
                                                    </div>
                                                    <button
                                                        onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                                                        style={{ marginTop: '12px', background: 'white', border: '1px solid #1F6FEB', color: '#1F6FEB', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                                    >
                                                        Reset All Filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return filteredAllocations.map(alc => (
                                    <tr key={alc.id}>
                                        <td style={{ fontWeight: '700', color: '#0f172a' }}>{alc.allocationId}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '600' }}>{alc.asset?.assetTag}</span>
                                                <small style={{ color: '#64748b' }}>
                                                    {alc.asset?.category?.name}
                                                    {alc.asset?.subCategory?.name ? ` - ${alc.asset.subCategory.name}` : ''}
                                                </small>
                                            </div>
                                        </td>
                                        <td>{getDisplayEmployeeId(alc.employee?.employeeId)}</td>
                                        <td>{alc.employee?.firstName} {alc.employee?.lastName}</td>
                                        <td>{alc.allocationDate ? (() => { const d = new Date(alc.allocationDate); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })() : 'N/A'}</td>
                                        <td>{alc.expectedReturnDate ? (() => { const d = new Date(alc.expectedReturnDate); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })() : '-'}</td>
                                        <td>
                                            <span className={`badge ${alc.returnDate ? 'badge-success' : 'badge-info'}`} style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                background: alc.returnDate ? '#dcfce7' : '#e0f2fe',
                                                color: alc.returnDate ? '#166534' : '#0369a1'
                                            }}>
                                                {alc.returnDate ? 'Returned' : 'Allocated'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button
                                                    className="icon-btn-view"
                                                    title="View Details"
                                                    onClick={() => {
                                                        setViewingAllocation(alc);
                                                        setShowViewModal(true);
                                                    }}
                                                    style={{
                                                        padding: '6px',
                                                        background: '#f0f9ff',
                                                        color: '#0369a1',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                {!alc.returnDate && (
                                                    <>
                                                        <button
                                                            title="Process Return"
                                                            onClick={() => {
                                                                setSelectedAllocation(alc);
                                                                setReturnData({
                                                                    conditionAtReturn: '',
                                                                    returnImage: '',
                                                                    returnImageName: '',
                                                                    damageNotes: '',
                                                                    verifiedBy: `${employeeName || 'Admin'} (${employeeId || 'System'})`
                                                                });
                                                                setShowReturnModal(true);
                                                            }}
                                                            style={{
                                                                padding: '6px',
                                                                background: '#ecfeff',
                                                                color: '#0e7490',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <i className="bi bi-arrow-return-left"></i>
                                                        </button>
                                                        <button
                                                            className="icon-btn-delete"
                                                            title="Delete Allocation"
                                                            onClick={() => handleDelete(alc.id, alc.allocationId)}
                                                            style={{
                                                                padding: '6px',
                                                                background: '#fef2f2',
                                                                color: '#ef4444',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                showModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <div className="modal-content premium-form" style={{
                            maxWidth: '1200px',
                            width: '100%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0',
                            borderRadius: '8px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            border: 'none',
                            overflow: 'hidden'
                        }}>

                            {/* Fixed Header */}
                            <div className="modal-header" style={{
                                padding: '16px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#5B8FF9',
                                color: 'white',
                                zIndex: 10,
                                borderTopLeftRadius: '8px',
                                borderTopRightRadius: '8px'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '15px', margin: 0, color: 'white', fontWeight: '700' }}>Create Asset Allocation</h2>
                                </div>
                                <button onClick={() => {
                                    setShowModal(false);
                                    setNewAllocation({
                                        asset: { id: '' },
                                        employee: { employeeId: '' },
                                        conditionAtIssue: '',
                                        accessoriesIssued: '',
                                        issuedImage: '',
                                        expectedReturnDate: '',
                                        dynamicValues: {}
                                    });
                                    setSelectedAssetDetails(null);
                                    setSelectedAssetDetails(null);
                                }} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}>&times;</button>
                            </div>

                            <div className="modal-body-scroll" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>

                                    {/* Column 1: Asset & Employee Assignment */}
                                    <div className="section-card">
                                        <div className="section-header-enhanced">

                                            <div>
                                                <h4 className="section-title-enhanced">Assignment Details</h4>
                                                <p className="section-subtitle">Select asset and assign to employee</p>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label style={{ marginBottom: '-10px !important', paddingBottom: '0px !important', lineHeight: '1.1 !important' }}>Asset to Issue <span style={{ color: '#ef4444' }}>*</span></label>
                                            <Select
                                                options={assets.map(a => ({
                                                    value: a.id,
                                                    label: `${a.assetTag} (${a.category?.name})`
                                                }))}
                                                value={newAllocation.asset.id
                                                    ? {
                                                        value: newAllocation.asset.id,
                                                        label: assets.find(a => a.id === newAllocation.asset.id)
                                                            ? `${assets.find(a => a.id === newAllocation.asset.id).assetTag} (${assets.find(a => a.id === newAllocation.asset.id).category?.name})`
                                                            : ''
                                                    }
                                                    : null}
                                                onChange={(selected) => handleAssetSelection(selected ? selected.value : '')}
                                                placeholder="- Select Available Asset -"
                                                styles={customSelectStyles}
                                                isClearable
                                                isSearchable
                                                filterOption={customFilter}
                                                classNamePrefix="react-select"
                                                menuPortalTarget={document.body}
                                                maxMenuHeight={140}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Assign to Employee <span style={{ color: '#ef4444' }}>*</span></label>
                                            <Select
                                                options={employees.map(e => ({ value: e.employeeId, label: `${e.firstName} ${e.lastName} (${getDisplayEmployeeId(e.employeeId)})` }))}
                                                value={newAllocation.employee.employeeId ? { value: newAllocation.employee.employeeId, label: employees.find(e => e.employeeId === newAllocation.employee.employeeId) ? (() => { const e = employees.find(emp => emp.employeeId === newAllocation.employee.employeeId); return `${e.firstName} ${e.lastName} (${getDisplayEmployeeId(e.employeeId)})`; })() : '' } : null}
                                                onChange={(selected) => setNewAllocation({ ...newAllocation, employee: { employeeId: selected ? selected.value : '' } })}
                                                placeholder="- Select Holder -"
                                                styles={{
                                                    ...customSelectStyles,
                                                    menuList: (provided) => ({
                                                        ...provided,
                                                        maxHeight: '140px',
                                                        overflowY: 'auto'
                                                    })
                                                }}
                                                isClearable
                                                isSearchable
                                                filterOption={(option, inputValue) => {
                                                    if (!inputValue) return true;
                                                    const search = inputValue.toLowerCase();
                                                    return option.label.toLowerCase().includes(search);
                                                }}
                                                classNamePrefix="react-select"
                                                menuPortalTarget={document.body}
                                                maxMenuHeight={140}
                                            />
                                        </div>

                                        {/* Enhanced Asset Details Section */}
                                        {selectedAssetDetails && (
                                            <div className="asset-details-card">
                                                <h5 style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '700',
                                                    color: '#1f2937',
                                                    margin: '0 0 20px 0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #1557b7 0%, #1557b7 100%)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        <i className="bi bi-info-lg"></i>
                                                    </div>
                                                    Asset Details (from Master Record)
                                                </h5>

                                                {/* Basic Asset Information */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563' }}>Asset Tag</label>
                                                            <div className="field-value">
                                                                {selectedAssetDetails.assetTag || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563' }}>Category</label>
                                                            <div className="field-value">
                                                                {selectedAssetDetails.category?.name || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563' }}>Sub-category</label>
                                                            <div className="field-value">
                                                                {selectedAssetDetails.subCategory?.name || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563' }}>Location</label>
                                                            <div className="field-value">
                                                                {selectedAssetDetails.location || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dynamic Values */}
                                                {selectedAssetDetails.dynamicValues && Object.keys(selectedAssetDetails.dynamicValues).length > 0 && (
                                                    <div>
                                                        <h6 style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: '700',
                                                            color: '#6b7280',
                                                            margin: '0 0 16px 0',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <div style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '6px',
                                                                background: '#f3f4f6',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.7rem',
                                                                color: '#9ca3af'
                                                            }}>
                                                                <i className="bi bi-grid-3x3-gap"></i>
                                                            </div>
                                                            Additional Fields
                                                        </h6>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            {Object.entries(selectedAssetDetails.dynamicValues).map(([key, value]) => (
                                                                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                    <label style={{
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: '600',
                                                                        color: '#4b5563',
                                                                        textTransform: 'capitalize'
                                                                    }}>
                                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </label>
                                                                    <div className="field-value">
                                                                        {value && typeof value === 'string' && value.startsWith('data:') ? (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                {value.startsWith('data:image') ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => { setPreviewItem({ title: key, image: value }); setShowPreviewModal(true); }}
                                                                                        style={{ padding: '4px 12px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                                    >
                                                                                        <i className="bi bi-image"></i> View Image
                                                                                    </button>
                                                                                ) : (
                                                                                    <a href={value} download={`file_${key}.dat`} style={{ padding: '4px 12px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                                                                                        <i className="bi bi-file-earmark-text"></i> Download File
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        ) : (formatDateToDDMMYYYY(value) || 'N/A')}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Column 2: Allocation Details */}
                                    <div className="section-card">
                                        <div className="section-header-enhanced">

                                            <div>
                                                <h4 className="section-title-enhanced">Allocation Details</h4>
                                                <p className="section-subtitle">Configure allocation parameters</p>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Condition at Issue <span style={{ color: '#ef4444' }}>*</span></label>
                                            <select
                                                className="form-control"
                                                value={newAllocation.conditionAtIssue}
                                                onChange={(e) => setNewAllocation({ ...newAllocation, conditionAtIssue: e.target.value })}
                                            >
                                                <option value="">Select Condition</option>
                                                {[...new Set([...customConditions])].map(cond => (
                                                    <option key={cond} value={cond}>{cond}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Accessories Issued</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Charger, Mouse, Bag"
                                                value={newAllocation.accessoriesIssued}
                                                onChange={(e) => setNewAllocation({ ...newAllocation, accessoriesIssued: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                Issued Condition (Visual Evidence)
                                            </label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {!newAllocation.issuedImage ? (
                                                    <div
                                                        onClick={() => document.getElementById('issued-image-upload').click()}
                                                        style={{
                                                            border: '2px dashed #cbd5e1',
                                                            borderRadius: '16px',
                                                            padding: '24px',
                                                            textAlign: 'center',
                                                            cursor: 'pointer',
                                                            background: '#f8fafc',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.borderColor = '#1557b7';
                                                            e.currentTarget.style.background = '#f0fdfa';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                                            e.currentTarget.style.background = '#f8fafc';
                                                        }}
                                                    >
                                                        <i className="bi bi-cloud-upload" style={{ fontSize: '1.8rem', color: '#64748b' }}></i>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>Click to Upload Condition Image</span>
                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Supports PNG, JPG (Max 5MB)</span>
                                                        </div>
                                                        <input
                                                            id="issued-image-upload"
                                                            type="file"
                                                            hidden
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        setNewAllocation({
                                                                            ...newAllocation,
                                                                            issuedImage: reader.result,
                                                                            issuedImageName: file.name
                                                                        });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '12px 20px',
                                                        background: '#ffffff',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                                                <img src={newAllocation.issuedImage} alt="Issued" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#10b981' }}>Condition Image Attached</span>
                                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newAllocation.issuedImageName}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewAllocation({ ...newAllocation, issuedImage: '', issuedImageName: '' })}
                                                            style={{
                                                                background: '#fef2f2',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                padding: '8px',
                                                                borderRadius: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
                                                        >
                                                            <i className="bi bi-trash3-fill" style={{ fontSize: '0.9rem' }}></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                            <div className="form-group">
                                                <label>Expected Return Date</label>
                                                <SmartDatePicker
                                                    value={newAllocation.expectedReturnDate ? new Date(newAllocation.expectedReturnDate) : null}
                                                    onChange={(date) => setNewAllocation({ ...newAllocation, expectedReturnDate: date ? date.toISOString().split('T')[0] : '' })}
                                                    placeholder="Select return date"
                                                    minDate={new Date()}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Action Buttons */}
                                <div style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginTop: '40px',
                                    paddingTop: '32px',
                                    borderTop: '2px solid #f1f5f9',
                                    alignItems: 'center'
                                }}>
                                    <button className="btn-primary" style={{ flex: 1.5 }} onClick={handleSave}>

                                        Confirm Allocation
                                    </button>
                                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>

                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showReturnModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div className="modal-content" style={{
                            maxWidth: '440px',
                            width: '100%',
                            maxHeight: '90vh',
                            background: '#F5F7FP',
                            borderRadius: '8px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
                            border: '1px solid #cbd5e1',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'modalFadeIn 0.3s ease-out'
                        }}>
                            {/* Compact Header */}
                            <div style={{
                                padding: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexShrink: 0,
                                background: '#629AF1'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '30px', margin: 0, color: '#ffffff', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Return Asset
                                    </h2>
                                    <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)', margin: '4px 0 0 0' }}>Update inventory status</p>
                                </div>
                                <button onClick={() => setShowReturnModal(false)} style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'normal'
                                }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                                >&times;</button>
                            </div>

                            {/* Professional Scrollable Body */}
                            <div style={{
                                padding: '24px',
                                overflowY: 'auto',
                                flex: 1,
                                scrollbarWidth: 'thin'
                            }}>
                                <style>{`
                                .modal-content div::-webkit-scrollbar { width: 4px; }
                                .modal-content div::-webkit-scrollbar-track { background: transparent; }
                                .modal-content div::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                            `}</style>

                                {/* Minimal Asset Identifiers */}
                                <div style={{
                                    padding: '16px',
                                    background: '#ffffff',
                                    borderRadius: '8px',
                                    marginBottom: '24px',
                                    border: '1px solid #cbd5e1'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#475569' }}>Asset Tag</span>
                                        <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#475569' }}>Custodian</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#0f172a' }}>{selectedAllocation?.asset?.assetTag}</span>
                                        <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{selectedAllocation?.employee?.firstName} {selectedAllocation?.employee?.lastName}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '15px', fontWeight: 'normal', color: '#334155', marginBottom: '4px', display: 'block' }}>
                                            Return Condition <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            value={returnData.conditionAtReturn}
                                            onChange={(e) => setReturnData({ ...returnData, conditionAtReturn: e.target.value })}
                                            style={{ cursor: 'pointer', height: '42px', fontSize: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="">Select Condition</option>
                                            {[...new Set([...customConditions])].map(cond => (
                                                <option key={cond} value={cond}>{cond}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ fontSize: '15px', fontWeight: 'normal', color: '#334155', marginBottom: '4px', display: 'block' }}>Return Image</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {!returnData.returnImage ? (
                                                <div className="custom-file-upload">
                                                    <input
                                                        id="return-image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setReturnData({
                                                                        ...returnData,
                                                                        returnImage: reader.result,
                                                                        returnImageName: file.name
                                                                    });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="return-image-upload" style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '10px',
                                                        padding: '12px',
                                                        background: '#ffffff',
                                                        border: '2px dashed #cbd5e1',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        color: '#64748b',
                                                        fontSize: '15px',
                                                        fontWeight: 'normal'
                                                    }}
                                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00B3A4'; e.currentTarget.style.color = '#00B3A4'; e.currentTarget.style.background = '#f0fdfa'; }}
                                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#ffffff'; }}>
                                                        <i className="bi bi-camera-fill" style={{ fontSize: '1.1rem' }}></i>
                                                        Click to Upload Return Condition
                                                    </label>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 20px',
                                                    background: '#ffffff',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '8px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                                            {returnData.returnImage ? (
                                                                <img src={returnData.returnImage} alt="Return" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <i className="bi bi-image" style={{ color: '#64748b', fontSize: '1.2rem' }}></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#00B3A4' }}>Image Attached</span>
                                                            <span style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{returnData.returnImageName}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setReturnData({ ...returnData, returnImage: '', returnImageName: '' })}
                                                        style={{
                                                            background: '#fef2f2',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
                                                    >
                                                        <i className="bi bi-trash3-fill" style={{ fontSize: '0.9rem' }}></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ fontSize: '15px', fontWeight: 'normal', color: '#334155', marginBottom: '4px', display: 'block' }}>Return Remarks</label>
                                        <textarea
                                            className="form-control"
                                            placeholder="Note defects or damages..."
                                            value={returnData.damageNotes}
                                            onChange={(e) => setReturnData({ ...returnData, damageNotes: e.target.value })}
                                            style={{ minHeight: '80px', padding: '10px', resize: 'none', fontSize: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                </div>

                                {/* Compact Action Footer */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                    <button className="btn-primary" style={{
                                        flex: 1,
                                        height: '42px',
                                        background: '#00B3A4',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'normal',
                                        fontSize: '15px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#009d90'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#00B3A4'}
                                        onClick={handleReturn}
                                    >
                                        Complete Return
                                    </button>
                                    <button className="btn-secondary" style={{
                                        padding: '0 20px',
                                        height: '42px',
                                        borderRadius: '8px',
                                        border: '1px solid #00B3A4',
                                        fontWeight: 'normal',
                                        fontSize: '15px',
                                        background: 'white',
                                        color: '#00B3A4',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#f0fdfa'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
                                        onClick={() => setShowReturnModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showViewModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
                    }} onClick={() => setShowViewModal(false)}>
                        <div className="modal-content" style={{
                            backgroundColor: '#F5F7FA', width: '90%', maxWidth: '1000px', borderRadius: '8px',
                            overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', maxHeight: '95vh', display: 'flex', flexDirection: 'column',
                            border: 'none', padding: 0
                        }} onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div style={{
                                padding: '20px 32px', background: '#629AF1',
                                borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                position: 'relative', overflow: 'hidden', borderRadius: '8px 8px 0 0'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '30px', fontWeight: 'normal', color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Allocation Details</h2>

                                </div>
                                <button onClick={() => setShowViewModal(false)} style={{ position: 'absolute', top: '50%', right: '24px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>&times;</button>
                            </div>

                            <div style={{ padding: '32px', overflowY: 'auto', background: '#F5F7FA' }} className="modal-body-scroll">
                                {/* Information Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>

                                    {/* 1. Master Record Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                <div>
                                                    <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Asset Details (Master Record)</h6>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Core asset specifications</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Category</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{viewingAllocation?.asset?.dynamicValues?.['Category'] || viewingAllocation?.asset?.category?.name || '-'}</div>
                                                </div>

                                                {/* Additional Information (Dynamic Fields) */}
                                                {viewingAllocation?.asset?.dynamicValues && Object.entries(viewingAllocation.asset.dynamicValues)
                                                    .filter(([key]) => !['Asset Tag', 'Serial Number', 'Category', 'Sub-category', 'Condition', 'Status', 'Asset Status', 'Price', 'Location'].includes(key))
                                                    .map(([key, value]) => {
                                                        const displayKey = key
                                                            .replace(/([A-Z])/g, ' $1')
                                                            .replace(/_/g, ' ')
                                                            .trim()
                                                            .split(' ')
                                                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                                            .join(' ');

                                                        return (
                                                            <div key={key} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>{displayKey}</div>
                                                                <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>
                                                                    {value && typeof value === 'string' && value.startsWith('data:') ? (
                                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                                            {value.startsWith('data:image') ? (
                                                                                <button
                                                                                    onClick={() => { setPreviewItem({ title: displayKey, image: value }); setShowPreviewModal(true); }}
                                                                                    style={{ border: 'none', background: 'none', padding: 0, color: '#3b82f6', textDecoration: 'underline', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}
                                                                                >
                                                                                    Preview
                                                                                </button>
                                                                            ) : (
                                                                                <a href={value} download={`file_${key}.dat`} style={{ color: '#10b981', fontSize: '15px', fontWeight: '600', textDecoration: 'none' }}>
                                                                                    Download
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    ) : formatDateToDDMMYYYY(value)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>

                                        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                <div>
                                                    <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Accessories & Specifics</h6>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Custom fields and specifications</p>
                                                </div>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '60px', display: 'flex', alignItems: 'center' }}>
                                                <p style={{ margin: 0, color: '#1e293b', fontSize: '15px', fontWeight: '600', lineHeight: '1.5' }}>
                                                    {viewingAllocation?.accessoriesIssued || 'No accessories were issued with this asset.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Custodian & Timeline Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                <div>
                                                    <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Custodian Details</h6>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Current asset status and location</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Employee ID</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{getDisplayEmployeeId(viewingAllocation?.employee?.employeeId) || '-'}</div>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Full Name</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{viewingAllocation?.employee?.firstName} {viewingAllocation?.employee?.lastName || '-'}</div>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>E-mail</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{viewingAllocation?.employee?.email || '-'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                <div>
                                                    <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Allocation Timeline</h6>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Asset lifecycle and ownership</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Allocated Date</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{(() => { const d = new Date(viewingAllocation?.allocationDate); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })()}</div>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Expected Return</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{viewingAllocation?.expectedReturnDate ? (() => { const d = new Date(viewingAllocation.expectedReturnDate); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })() : '-'}</div>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Actual Return Date</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>
                                                        {viewingAllocation?.returnDate ? (() => { const d = new Date(viewingAllocation.returnDate); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })() : 'Currently Assigned'}
                                                    </div>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Issuance Condition</div>
                                                    <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{viewingAllocation?.conditionAtIssue || '-'}</div>
                                                </div>
                                                {viewingAllocation?.conditionAtReturn && (
                                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Return Condition</div>
                                                        <div style={{ fontSize: '15px', color: '#10b981', fontWeight: '600' }}>{viewingAllocation.conditionAtReturn}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Summary (if returned) */}
                                {viewingAllocation?.verifiedBy && (
                                    <div style={{ marginTop: '24px', padding: '16px 24px', background: '#e6f4ea', borderRadius: '8px', border: '1px solid #c2e7cd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ color: '#137333', fontSize: '15px', fontWeight: '700' }}>Verified Return By</span>
                                            <div style={{ fontWeight: '700', color: '#137333', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                {viewingAllocation.verifiedBy}
                                            </div>
                                        </div>
                                        {viewingAllocation?.damageNotes && (
                                            <div style={{ textAlign: 'right', maxWidth: '50%' }}>
                                                <span style={{ color: '#137333', fontSize: '15px', fontWeight: '700' }}>Remarks</span>
                                                <div style={{ fontSize: '15px', color: '#137333', marginTop: '4px' }}>{viewingAllocation.damageNotes}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Visual Evidence Card */}
                                <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginTop: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                        <div>
                                            <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Visual Evidence</h6>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Condition verification media</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                        {/* Issued Image Compact Card */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Issued Condition</span>
                                                {!viewingAllocation?.issuedImage && (
                                                    <span style={{ fontSize: '15px', color: '#94a3b8', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>Not Uploaded</span>
                                                )}
                                            </div>

                                            {viewingAllocation?.issuedImage ? (
                                                <>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '140px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: '1px solid #e2e8f0',
                                                        background: '#ffffff',
                                                        position: 'relative',
                                                        marginBottom: '4px'
                                                    }}>
                                                        <img
                                                            src={getImageSrc(viewingAllocation.issuedImage)}
                                                            alt="Issued Condition"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            onClick={() => { setPreviewItem({ title: 'Issued Condition Image', image: getImageSrc(viewingAllocation.issuedImage) }); setShowPreviewModal(true); }}
                                                            style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                                                        >
                                                            Preview
                                                        </button>
                                                        <a
                                                            href={getImageSrc(viewingAllocation.issuedImage)}
                                                            download={`issued_${viewingAllocation.asset?.assetTag || 'asset'}.png`}
                                                            style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', transition: 'all 0.2s' }}
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ padding: '24px', border: '1px dashed #e2e8f0', borderRadius: '8px', textAlign: 'center', fontSize: '15px', color: '#94a3b8', background: '#ffffff' }}>
                                                    No visual record captured
                                                </div>
                                            )}
                                        </div>

                                        {/* Returned Image Compact Card */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Returned Condition</span>
                                                {!viewingAllocation?.returnImage && (
                                                    <span style={{ fontSize: '15px', color: '#94a3b8', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>Pending</span>
                                                )}
                                            </div>

                                            {viewingAllocation?.returnImage ? (
                                                <>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '140px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: '1px solid #e2e8f0',
                                                        background: '#ffffff',
                                                        position: 'relative',
                                                        marginBottom: '4px'
                                                    }}>
                                                        <img
                                                            src={getImageSrc(viewingAllocation.returnImage)}
                                                            alt="Returned Condition"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            onClick={() => { setPreviewItem({ title: 'Return Condition Image', image: getImageSrc(viewingAllocation.returnImage) }); setShowPreviewModal(true); }}
                                                            style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                                                        >
                                                            Preview
                                                        </button>
                                                        <a
                                                            href={getImageSrc(viewingAllocation.returnImage)}
                                                            download={`return_${viewingAllocation.asset?.assetTag || 'asset'}.png`}
                                                            style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', transition: 'all 0.2s' }}
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ padding: '24px', border: '1px dashed #e2e8f0', borderRadius: '8px', textAlign: 'center', fontSize: '15px', color: '#94a3b8', background: '#ffffff' }}>
                                                    {viewingAllocation?.returnDate ? 'No image captured' : 'Awaiting return'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', background: '#F5F7FA', display: 'flex', justifyContent: 'flex-end', borderRadius: '0 0 8px 8px' }}>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    style={{
                                        padding: '12px 32px',
                                        borderRadius: '12px',
                                        background: '#00B3A4',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(0, 179, 164, 0.2)'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#008F83'}
                                    onMouseOut={(e) => e.target.style.background = '#00B3A4'}
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Sub-modal for Image Preview */}
            {
                showPreviewModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
                    }} onClick={() => setShowPreviewModal(false)}>
                        <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                            <div style={{ position: 'absolute', top: '-40px', left: 0, color: 'white', fontWeight: 'bold' }}>{previewItem.title}</div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                style={{ position: 'absolute', top: '-45px', right: 0, background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
                            >
                                &times;
                            </button>
                            <img
                                src={previewItem.image}
                                alt="Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '85vh',
                                    border: '4px solid white',
                                    borderRadius: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}
                            />
                        </div>
                    </div>
                )
            }
            {/* Toast Notifications */}
            <ToastNotification
                isOpen={toast.isOpen}
                onClose={closeToast}
                message={toast.message}
                type={toast.type}
            />
        </div>
    );
};

export default AssetAllocation;
