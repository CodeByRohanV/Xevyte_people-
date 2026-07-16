import React, { useState, useEffect, useMemo } from 'react';
import api from "../../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../OnBoardingPage.css";
import ToastNotification from "../../components/ToastNotification";
import SuccessModal from "../../components/SuccessModal";
import Select from "react-select";

const getDisplayEmployeeId = (id) => {
    if (!id) return "";
    if (id.includes('_')) return id.split('_').pop();
    if (id.includes('-')) return id.split('-').pop();
    return id;
};

const SmartDatePicker = ({ value, onChange, disabled, placeholder }) => {
    const [open, setOpen] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const formatLocalDate = (date) => {
        const pad = (n) => n.toString().padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    const parseSafeDate = (val) => {
        if (!val) return null;
        const local = new Date(val + "T00:00:00");
        if (!isNaN(local.getTime())) return local;
        const fallback = new Date(val);
        return isNaN(fallback.getTime()) ? null : fallback;
    };

    return (
        <div className="premium-datepicker-container" style={{ width: '100%', position: 'relative' }}>
            <DatePicker
                popperProps={{ strategy: "fixed" }}
                selected={parseSafeDate(value)}
                disabled={disabled}
                onChange={(date) => {
                    if (!date) {
                        onChange("");
                        setOpen(false);
                        return;
                    }
                    onChange(formatLocalDate(date));
                    setTimeout(() => setOpen(false), 20);
                }}
                onSelect={() => setOpen(false)}
                open={open}
                onInputClick={() => setOpen(true)}
                onClickOutside={() => setOpen(false)}
                dateFormat="dd-MM-yyyy"
                calendarClassName="premium-calendar"
                wrapperClassName="full-width-picker"
                placeholderText={placeholder}
                customInput={
                    <input
                        className="form-control"
                    />
                }
                renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => {
                    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
                    const currentYear = new Date().getFullYear();
                    // Years range: 25 years forward (warranties) and 75 years back (total 100-year range)
                    const years = Array.from({ length: 101 }, (_, i) => currentYear + 25 - i);

                    return (
                        <div className="custom-calendar-header">
                            <div className="calendar-header-banner">
                                <button type="button" className="header-nav-btn prev" onClick={(e) => { e.preventDefault(); decreaseMonth(); }}>‹</button>
                                <div className="header-main-content">
                                    <div className="header-text-group">
                                        <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(!showMonthDropdown); setShowYearDropdown(false); }}>{months[date.getMonth()]}</span>
                                        <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(!showYearDropdown); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                                    </div>
                                </div>
                                <button type="button" className="header-nav-btn next" onClick={(e) => { e.preventDefault(); increaseMonth(); }}>›</button>
                            </div>
                            {showMonthDropdown && (
                                <div className="header-dropdown month-dropdown">
                                    <div className="dropdown-scroll-pane">
                                        {months.map((m, idx) => (
                                            <div key={m} className={`dropdown-item ${idx === date.getMonth() ? 'active' : ''}`} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {showYearDropdown && (
                                <div className="header-dropdown year-dropdown">
                                    <div className="dropdown-scroll-pane">
                                        {[...years].sort((a, b) => b - a).map((y) => (
                                            <div key={y} className={`dropdown-item ${y === date.getFullYear() ? 'active' : ''}`} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }}
            />
        </div>
    );
};

const AssetMaster = ({ onAssetChange }) => {
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalAssetsCount, setTotalAssetsCount] = useState(0);
    const token = sessionStorage.getItem("token");
    const employeeId = sessionStorage.getItem("employeeId");
    const employeeName = sessionStorage.getItem("employeeName");

    const [newAsset, setNewAsset] = useState({
        assetTag: '',
        serialNumber: '',
        category: { id: '' },
        subCategory: { id: '' },
        dynamicValues: {},
        conditionAtStock: '',
        location: '',
        status: '',
        price: '',
        assignedToEmployee: null
    });
    const [employees, setEmployees] = useState([]);

    // Search and Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Helper Functions (Relocated to top for ESLint resolution)
    const filteredSubCategories = categories.filter(c => {
        const hasParent = c.parentCategory !== null && c.parentCategory !== undefined && 
                          (typeof c.parentCategory !== 'object' || Object.keys(c.parentCategory).length > 0);
        if (!hasParent) return false;
        // Robust ID resolution: handle both object {id} and direct ID value
        const parentId = String(c.parentCategory.id !== undefined ? c.parentCategory.id : c.parentCategory);
        const selectedId = String(newAsset.category?.id || '');
        return parentId === selectedId && selectedId !== '' && selectedId !== 'undefined';
    });

    const handleFieldChange = (name, value) => {
        console.log("DEBUG: Field change - Name:", name, "Value:", value);
        setNewAsset(prev => {
            const updatedDynamicValues = {
                ...prev.dynamicValues,
                [name]: value
            };

            // Also update the corresponding top-level state fields for consistency
            const updatedState = { ...prev, dynamicValues: updatedDynamicValues };
            const lowerName = name.toLowerCase().trim();

            if (lowerName === 'asset status' || lowerName === 'status') {
                updatedState.status = value;
                // Ensure both 'Status' and 'Asset Status' keys are updated in dynamic values for consistency
                updatedDynamicValues['Status'] = value;
                updatedDynamicValues['Asset Status'] = value;
            }
            if (lowerName === 'condition at stock' || lowerName === 'condition' || lowerName === 'asset condition') {
                updatedState.conditionAtStock = value;
                // Ensure both 'Condition' and 'Condition At Stock' keys are updated
                updatedDynamicValues['Condition'] = value;
                updatedDynamicValues['Condition At Stock'] = value;
            }
            if (lowerName === 'location') {
                updatedState.location = value;
                updatedDynamicValues['Location'] = value;
            }
            if (lowerName === 'price') {
                updatedState.price = value;
                updatedDynamicValues['Price'] = value;
            }
            if (lowerName === 'asset tag' || lowerName === 'tag') {
                updatedState.assetTag = value;
                // Ensure both 'Asset Tag' and 'AssetTag' keys are updated
                updatedDynamicValues['Asset Tag'] = value;
                updatedDynamicValues['AssetTag'] = value;
            }
            if (lowerName === 'serial number' || lowerName === 'serial') {
                updatedState.serialNumber = value;
                // Ensure both 'Serial Number' and 'SerialNumber' keys are updated
                updatedDynamicValues['Serial Number'] = value;
                updatedDynamicValues['SerialNumber'] = value;
            }

            console.log("DEBUG: Updated state:", updatedState);
            return updatedState;
        });
    };

    const handleCategoryChange = (categoryId) => {
        const selectedId = String(categoryId || '');
        const selectedCatName = categories.find(c => String(c.id) === selectedId)?.name || '';
        setNewAsset(prev => ({
            ...prev,
            category: { id: selectedId },
            subCategory: { id: '' }, // Reset sub-category ID
            dynamicValues: {
                ...prev.dynamicValues,
                'Category': selectedCatName,
                'Sub-category': '' // Reset sub-category name as well
            }
        }));
    };

    const handleSubCategoryChange = (subCategoryId) => {
        const selectedId = String(subCategoryId || '');
        const selectedSubName = categories.find(c => String(c.id) === selectedId)?.name || '';
        setNewAsset(prev => ({
            ...prev,
            subCategory: { id: selectedId },
            dynamicValues: {
                ...prev.dynamicValues,
                'Sub-category': selectedSubName
            }
        }));
    };

    const [validationErrors, setValidationErrors] = useState({});

    const [isEditMode, setIsEditMode] = useState(false);
    const [quickCategory, setQuickCategory] = useState({ name: '', active: true, fieldConfigs: [], subCategories: [] });

    // States for inline additions to existing category
    const [newSubCategories, setNewSubCategories] = useState([]);
    const [newFieldConfigs, setNewFieldConfigs] = useState([]);
    const [isSavingSchema, setIsSavingSchema] = useState(false);

    // State for managing field selection (keep/remove)
    const [selectedFields, setSelectedFields] = useState({});

    // Custom Input states
    const [customConditions, setCustomConditions] = useState([]);
    const [customStatuses, setCustomStatuses] = useState([]);
    const [templateColumns, setTemplateColumns] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('assetInventoryVisibleColumns');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error loading visible columns from localStorage", e);
            return [];
        }
    }); // Array to preserve insertion order for dynamic column sorting


    // Generic dynamic options and custom input states
    const [dynamicOptions, setDynamicOptions] = useState({}); // { TYPE: [options] }
    const [activeCustomInputs, setActiveCustomInputs] = useState({}); // { fieldName: boolean }

    // Bulk Import states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '0.9rem',
            color: '#374151',
            background: '#ffffff',
            minHeight: '46px',
            minWidth: '300px',
            width: '100%',
            boxShadow: state.isFocused
                ? '0 0 0 3px rgba(59,130,246,0.1)'
                : '0 1px 2px rgba(0,0,0,0.05)',
            '&:hover': {
                borderColor: '#1557b7'
            }
        }),

        valueContainer: (provided) => ({
            ...provided,
            padding: '0 14px',
            flex: '1',
            minWidth: '200px',
            width: 'auto'
        }),

        menuPortal: (base) => ({
            ...base,
            zIndex: 99999
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
            width: 'auto',
            position: 'absolute',
            background: 'white',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            borderRadius: '8px'
        }),

        menuList: (provided) => ({
            ...provided,
            padding: 0,
            overflowY: 'auto',
            borderRadius: '8px',
            zIndex: 99999
        }),

        option: (provided, state) => ({
            ...provided,
            width: 'auto',
            minWidth: '300px',
            whiteSpace: 'nowrap',
            padding: '8px 12px',
            backgroundColor: state.isFocused ? '#f0fdfa' : 'white',
            color: '#334155',
            '&:active': {
                backgroundColor: '#ccfbf1'
            }
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

    const getCustomSelectStyles = (maxItems = 10) => {
        const itemHeight = 35;
        const totalHeight = maxItems * itemHeight;
        return {
            ...customSelectStyles,
            menu: (provided) => ({
                ...customSelectStyles.menu(provided),
                maxHeight: `${totalHeight}px`
            }),
            menuList: (provided) => ({
                ...customSelectStyles.menuList(provided),
                maxHeight: `${totalHeight}px`,
            })
        };
    };

    // State for import confirmation dialog
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [pendingImport, setPendingImport] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
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
        fetchAssets();
        fetchCategories();
        fetchOptions();
        fetchEmployees();
    }, []);

    // Memoized filtered assets for better performance
    const filteredAssets = useMemo(() => {
        const safeAssets = Array.isArray(assets) ? assets : [];
        const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (searchTerms.length === 0) return safeAssets.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return b.id - a.id;
        });

        const isMatch = (val, searchStr) => {
            if (val === null || val === undefined || val === '') return false;
            const strVal = String(val).toLowerCase();
            if (strVal.includes(searchStr)) return true;

            // Date-specific matching
            if (typeof val === 'string' && val.length >= 10 && !isNaN(Date.parse(val))) {
                const d = new Date(val);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const formatted = `${day}-${month}-${d.getFullYear()}`;
                if (formatted.includes(searchStr)) return true;
                const formatted2 = `${day}/${month}/${d.getFullYear()}`;
                if (formatted2.includes(searchStr)) return true;
            }
            return false;
        };

        return safeAssets.filter(asset => {
            return searchTerms.every(term => {
                // Get the asset status from multiple possible locations
                const statusText = String(
                    asset.dynamicValues?.['Status'] ||
                    asset.dynamicValues?.['Asset Status'] ||
                    asset.status ||
                    ''
                ).toLowerCase();

                // Priority 1: Check if search matches status exactly or a significant partial match
                if (statusText.includes(term)) return true;

                // Priority 2: Search in specific core asset fields
                const coreFieldsSearch = [
                    asset.assetTag,
                    asset.assetModelName,
                    asset.serialNumber,
                    asset.configuration,
                    asset.location,
                    asset.price,
                    asset.description,
                    asset.conditionAtStock
                ].some(val => isMatch(val, term));

                // Priority 3: Search in category/subcategory
                const categorySearch = [
                    asset.category?.name,
                    asset.subCategory?.name
                ].some(n => isMatch(n, term));

                // Priority 4: Search in employee details
                const employeeSearch = [
                    asset.assignedToEmployee?.firstName,
                    asset.assignedToEmployee?.lastName,
                    asset.assignedToEmployee?.employeeId,
                    (asset.assignedToEmployee?.firstName && asset.assignedToEmployee?.lastName ? `${asset.assignedToEmployee.firstName} ${asset.assignedToEmployee.lastName}` : '')
                ].some(e => isMatch(e, term));

                // Priority 5: Search in dynamic values
                const dynamicSearch = Object.entries(asset.dynamicValues || {}).some(([key, v]) => {
                    const keyLower = key.toLowerCase();
                    if (keyLower === 'status' || keyLower === 'asset status') return false;
                    return isMatch(v, term);
                });

                return coreFieldsSearch || categorySearch || employeeSearch || dynamicSearch;
            });
        }).sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return b.id - a.id;
        });
    }, [assets, searchTerm]);

    // Persist visible columns to localStorage whenever they change
    useEffect(() => {
        if (visibleColumns && visibleColumns.length > 0) {
            localStorage.setItem('assetInventoryVisibleColumns', JSON.stringify(visibleColumns));
        }
    }, [visibleColumns]);

    const fetchEmployees = async () => {
        if (!token) return;
        // Optimization: Use session cache if available
        if (window._employees_cache) {
            setEmployees(window._employees_cache);
            return;
        }
        try {
            const res = await api.get('/employees', { headers: { Authorization: `Bearer ${token}` } });
            const data = res.data || [];
            window._employees_cache = data;
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching employees", error);
        }
    };

    const fetchOptions = async () => {
        if (!token) return;
        try {
            const batchRes = await api.get(`/assets/options/batch?types=STATUS&types=CONDITION&types=TEMPLATE_COLUMN&t=${new Date().getTime()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = batchRes.data || {};

            setCustomStatuses((data.STATUS || []).map(opt => opt.value));
            setCustomConditions((data.CONDITION || []).map(opt => opt.value));
            const templateData = data.TEMPLATE_COLUMN || [];
            // Preserve all columns returned from the API as they carry the user's sort order
            const filteredTemplateData = templateData;
            setTemplateColumns(filteredTemplateData);

            const templateNames = filteredTemplateData.map(c => c.value);
            const coreDefaults = ["Asset Tag", "Asset Model Name", "Category", "Sub-category", "Configuration", "Serial Number", "Asset Status", "Condition", "Location", "Price", "Warranty End Date", "Assigned To"];

            // Define a master sorting function based on template order
            const sortColumns = (colsToSort) => {
                const orderMap = {};
                templateNames.forEach((name, idx) => { orderMap[name] = idx; });

                // Add core defaults that are NOT in template to the end (but before Actions)
                let nextIdx = templateNames.length;
                coreDefaults.forEach(cd => {
                    if (orderMap[cd] === undefined) {
                        // Check case-insensitive
                        const match = templateNames.find(tn => tn.toLowerCase().trim() === cd.toLowerCase().trim());
                        if (!match) {
                            orderMap[cd] = nextIdx++;
                        } else {
                            orderMap[cd] = orderMap[match];
                        }
                    }
                });

                orderMap['Actions'] = 9999;

                return [...colsToSort].sort((a, b) => {
                    const posA = orderMap[a] !== undefined ? orderMap[a] : 9000;
                    const posB = orderMap[b] !== undefined ? orderMap[b] : 9000;
                    return posA - posB;
                });
            };

            setVisibleColumns(prev => {
                const templateNames = filteredTemplateData.map(c => c.value);

                const templateAssignCol = templateNames.find(tn => {
                    const norm = tn.toLowerCase().trim();
                    return norm === 'assign to employee' || norm === 'assigned to employee' || norm === 'assigned to';
                });

                if (prev.length === 0) {
                    const uniqueCols = [];
                    const seen = new Set();

                    // 1. Add ALL template columns in their configured order
                    ['Category', 'Sub-category', ...templateNames].forEach(col => {
                        let targetCol = col;
                        const normalized = col.toLowerCase().trim();
                        const isAssignField = normalized === 'assigned to' || normalized === 'assign to employee' || normalized === 'assigned to employee';

                        if (isAssignField && templateAssignCol) {
                            targetCol = templateAssignCol;
                        }

                        const targetNormalized = targetCol.toLowerCase().trim();
                        if (!seen.has(targetNormalized)) {
                            seen.add(targetNormalized);
                            uniqueCols.push(targetCol);
                        }
                    });

                    if (![...seen].includes('actions')) uniqueCols.push('Actions');
                    return uniqueCols; // Template is already ordered from backend
                }

                // If not empty, cleaned results ensure no duplicates are carried forward
                const cleaned = [];
                const seenClean = new Set();

                prev.forEach(col => {
                    if (col === 'Actions') {
                        if (!seenClean.has('actions')) {
                            seenClean.add('actions');
                            cleaned.push(col);
                        }
                        return;
                    }

                    let targetCol = col;
                    const normalized = col.toLowerCase().trim();
                    const isAssignField = normalized === 'assigned to' || normalized === 'assign to employee' || normalized === 'assigned to employee';

                    if (isAssignField && templateAssignCol) {
                        targetCol = templateAssignCol;
                    }

                    const targetNormalized = targetCol.toLowerCase().trim();
                    if (seenClean.has(targetNormalized)) return;

                    const isCore = coreDefaults.some(cd => cd.toLowerCase() === targetNormalized);
                    const isTemplate = templateNames.some(tn => tn.toLowerCase().trim() === targetNormalized);

                    if (isCore || isTemplate) {
                        seenClean.add(targetNormalized);
                        // Standardize casing
                        const coreMatch = coreDefaults.find(cd => cd.toLowerCase() === targetNormalized);
                        cleaned.push(coreMatch || targetCol);
                    }
                });

                return sortColumns(cleaned);
            });

            console.log('Template columns loaded and synced:', filteredTemplateData);
            console.log('Mandatory template columns:', filteredTemplateData.filter(col => col.mandatory === true));
        } catch (error) {
            console.error("Error fetching options", error);
        }
    };

    const fetchDynamicOptions = async (type) => {
        if (!token || !type || ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'FILE_UPLOAD'].includes(type) || type === 'DROPDOWN') return;
        if (dynamicOptions[type]) return; // Already fetched or fetching

        // Mark as fetching with empty array to avoid duplicate calls
        setDynamicOptions(prev => ({ ...prev, [type]: [] }));

        try {
            const res = await api.get(`/assets/options/${type}`, { headers: { Authorization: `Bearer ${token}` } });
            setDynamicOptions(prev => ({ ...prev, [type]: res.data.map(opt => opt.value) }));
        } catch (error) {
            console.error(`Error fetching options for ${type}`, error);
        }
    };

    const handleViewClick = (asset) => {
        setSelectedAsset(asset);
        setShowViewModal(true);
    };

    const fetchAssets = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get(`/assets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Assets fetched successfully:", response.data);

            // Debug: Log each asset's status to identify discrepancies
            (response.data || []).forEach((asset, index) => {
                console.log(`DEBUG Asset ${index + 1}:`, {
                    id: asset.id,
                    assetTag: asset.assetTag,
                    dynamicStatus: asset.dynamicValues?.['Status'],
                    dynamicAssetStatus: asset.dynamicValues?.['Asset Status'],
                    entityStatus: asset.status,
                    finalDisplayStatus: asset.dynamicValues?.['Status'] || asset.dynamicValues?.['Asset Status'] || asset.status || 'IN_STOCK'
                });
            });

            // Sort assets by creation date (newest first) - fallback sorting
            const sortedAssets = (response.data || []).sort((a, b) => {
                // Sort by creation date (newest first) - fallback sorting
                if (a.createdAt && b.createdAt) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                // Fallback to id sorting (higher id = newer)
                return b.id - a.id;
            });
            setAssets(sortedAssets);
            setTotalAssetsCount(sortedAssets.length);
        } catch (error) {
            console.error("Error fetching assets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldSelection = (fieldName, isSelected) => {
        setSelectedFields(prev => ({
            ...prev,
            [fieldName]: isSelected
        }));
    };

    const fetchCategories = async () => {
        if (!token) return;

        try {
            const response = await api.get(`/assets/categories?t=${new Date().getTime()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || [];
            window._categories_cache = data;
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const handleQuickAddCategory = async () => {
        if (!quickCategory.name.trim()) {
            alert("Category name is required");
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/assets/categories', {
                name: quickCategory.name,
                active: quickCategory.active,
                fieldConfigs: quickCategory.fieldConfigs
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const mainId = response.data.id;

            for (const subName of quickCategory.subCategories) {
                if (!subName.trim()) continue;
                await api.post('/assets/categories', {
                    name: subName,
                    active: true,
                    fieldConfigs: [],
                    parentCategory: { id: mainId }
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            await fetchCategories();
            setNewAsset({ ...newAsset, category: { id: mainId } });
            setQuickCategory({ name: '', active: true, fieldConfigs: [], subCategories: [] });
        } catch (error) {
            alert(error.response?.data?.message || "Error adding category");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchemaUpdates = async () => {
        if (!newAsset.category.id) return;
        setIsSavingSchema(true);
        try {
            for (const subName of newSubCategories) {
                if (!subName.trim()) continue;
                await api.post('/assets/categories', {
                    name: subName,
                    active: true,
                    fieldConfigs: [],
                    parentCategory: { id: newAsset.category.id }
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (newFieldConfigs.length > 0) {
                const currentCat = categories.find(c => String(c.id) === String(newAsset.category.id));
                const updatedFields = [...(currentCat.fieldConfigs || []), ...newFieldConfigs];
                await api.put(`/assets/categories/${newAsset.category.id}`, {
                    ...currentCat,
                    fieldConfigs: updatedFields
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            await fetchCategories();
            setNewSubCategories([]);
            setNewFieldConfigs([]);
            alert("Category updated successfully");
        } catch (error) {
            alert("Error updating category schema");
        } finally {
            setIsSavingSchema(false);
        }
    };

    const handleColumnVisibilityToggle = (columnName) => {
        setVisibleColumns(prev => {
            const templateNames = templateColumns.map(c => c.value);
            const templateAssignCol = templateNames.find(tn => {
                const norm = tn.toLowerCase().trim();
                return norm === 'assign to employee' || norm === 'assigned to employee' || norm === 'assigned to';
            });

            // Map incoming columnName to template name if it's an assignment field
            let targetToggleCol = columnName;
            const normToggleName = columnName.toLowerCase().trim();
            const isToggleAssignField = normToggleName === 'assigned to' || normToggleName === 'assign to employee' || normToggleName === 'assigned to employee';
            if (isToggleAssignField && templateAssignCol) {
                targetToggleCol = templateAssignCol;
            }
            const normTargetToggleName = targetToggleCol.toLowerCase().trim();

            let newList;
            const existing = prev.find(c => {
                let normC = c.toLowerCase().trim();
                if ((normC === 'assigned to' || normC === 'assign to employee' || normC === 'assigned to employee') && templateAssignCol) {
                    normC = templateAssignCol.toLowerCase().trim();
                }
                return normC === normTargetToggleName;
            });

            if (existing) {
                newList = prev.filter(c => {
                    let normC = c.toLowerCase().trim();
                    if ((normC === 'assigned to' || normC === 'assign to employee' || normC === 'assigned to employee') && templateAssignCol) {
                        normC = templateAssignCol.toLowerCase().trim();
                    }
                    return normC !== normTargetToggleName;
                });
            } else {
                // When adding, try to use standardized core casing
                const coreDefaults = ["Asset Tag", "Asset Model Name", "Category", "Sub-category", "Configuration", "Serial Number", "Asset Status", "Condition", "Location", "Price", "Warranty End Date", "Assigned To"];
                const coreMatch = coreDefaults.find(cd => cd.toLowerCase() === normTargetToggleName);
                newList = [...prev, coreMatch || targetToggleCol];
            }

            // Re-sort using THE SAME logic as fetchOptions
            const coreDefaults = ["Asset Tag", "Asset Model Name", "Category", "Sub-category", "Configuration", "Serial Number", "Asset Status", "Condition", "Location", "Price", "Warranty End Date", "Assigned To"];

            const orderMap = {};
            templateNames.forEach((name, idx) => { orderMap[name] = idx; });

            let nextIdx = templateNames.length;
            coreDefaults.forEach(cd => {
                const normCd = cd.toLowerCase().trim();
                // Check if this core default is already covered by a template column (case-insensitive)
                const templateMatch = templateNames.find(tn => {
                    const normTn = tn.toLowerCase().trim();
                    return normTn === normCd ||
                           (normCd === 'assigned to' && (normTn === 'assign to employee' || normTn === 'assigned to employee'));
                });

                if (templateMatch) {
                    orderMap[cd] = orderMap[templateMatch];
                } else {
                    orderMap[cd] = nextIdx++;
                }
            });

            orderMap['Actions'] = 9999;

            // Deduplicate and clean newList
            const cleaned = [];
            const seenClean = new Set();

            newList.forEach(col => {
                if (col === 'Actions') {
                    if (!seenClean.has('actions')) {
                        seenClean.add('actions');
                        cleaned.push(col);
                    }
                    return;
                }

                let tc = col;
                const normalized = col.toLowerCase().trim();
                const isAssignField = normalized === 'assigned to' || normalized === 'assign to employee' || normalized === 'assigned to employee';

                if (isAssignField && templateAssignCol) {
                    tc = templateAssignCol;
                }

                const targetNormalized = tc.toLowerCase().trim();
                if (seenClean.has(targetNormalized)) return;

                const isCore = coreDefaults.some(cd => cd.toLowerCase() === targetNormalized);
                const isTemplate = templateNames.some(tn => tn.toLowerCase().trim() === targetNormalized);

                if (isCore || isTemplate) {
                    seenClean.add(targetNormalized);
                    const coreMatch = coreDefaults.find(cd => cd.toLowerCase() === targetNormalized);
                    cleaned.push(coreMatch || tc);
                }
            });

            return cleaned.sort((a, b) => {
                const normA = a.toLowerCase().trim();
                const normB = b.toLowerCase().trim();

                // Find matching entries in orderMap using normalization
                const entryA = Object.keys(orderMap).find(k => k.toLowerCase().trim() === normA);
                const entryB = Object.keys(orderMap).find(k => k.toLowerCase().trim() === normB);

                const posA = entryA !== undefined ? orderMap[entryA] : 9000;
                const posB = entryB !== undefined ? orderMap[entryB] : 9000;
                return posA - posB;
            });
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'IN_STOCK':
                return 'badge-success';
            case 'ALLOCATED':
                return 'badge-warning';
            case 'MAINTENANCE':
                return 'badge-danger';
            case 'DISPOSED':
                return 'badge-secondary';
            default:
                return 'badge-info';
        }
    };

    const handleSave = async () => {
        // Helper to find the EXACT casing from templateColumns for core fields
        const getTemplateKey = (standardName, variants = []) => {
            const allVariants = [standardName, ...variants];
            const match = templateColumns.find(col =>
                allVariants.some(v => v.toLowerCase().trim() === col.value.toLowerCase().trim())
            );
            return match ? match.value : standardName;
        };

        const categoryKey = getTemplateKey('Category');
        const subCategoryKey = getTemplateKey('Sub-category', ['Sub-Category', 'subcategory']);
        const statusKey = getTemplateKey('Status', ['Asset Status', 'AssetStatus']);
        const conditionKey = getTemplateKey('Condition', ['Condition At Stock', 'Asset Condition']);
        const tagKey = getTemplateKey('Asset Tag', ['AssetTag']);
        const serialKey = getTemplateKey('Serial Number', ['SerialNumber']);
        const locationKey = getTemplateKey('Location');
        const priceKey = getTemplateKey('Price');

        // Prepare all dynamic values - start with current state
        const allDynamicValues = { ...newAsset.dynamicValues };

        // Helper to set values while avoiding duplicate case-insensitive keys
        const setVal = (key, val) => {
            if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
                // If value is empty, remove any existing case-insensitive matches
                Object.keys(allDynamicValues).forEach(k => {
                    if (k.toLowerCase().trim() === key.toLowerCase().trim()) {
                        delete allDynamicValues[k];
                    }
                });
                return;
            }

            // Find any existing case-insensitive match
            const existingKey = Object.keys(allDynamicValues).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());

            // If the existing key is DIFFERENT from the one we want to set (case-wise), remove it to avoid DB constraint issues
            if (existingKey && existingKey !== key) {
                delete allDynamicValues[existingKey];
            }

            allDynamicValues[key] = val;
        };

        // Finalize values for core fields from their primary state
        const finalStatus = newAsset.status || newAsset.dynamicValues?.[statusKey] || newAsset.dynamicValues?.['Status'] || newAsset.dynamicValues?.['Asset Status'] || '';
        const finalCondition = newAsset.conditionAtStock || newAsset.dynamicValues?.[conditionKey] || newAsset.dynamicValues?.['Condition'] || newAsset.dynamicValues?.['Condition At Stock'] || '';
        const finalTag = newAsset.assetTag || newAsset.dynamicValues?.[tagKey] || newAsset.dynamicValues?.['Asset Tag'] || '';
        const finalSerial = newAsset.serialNumber || newAsset.dynamicValues?.[serialKey] || newAsset.dynamicValues?.['Serial Number'] || '';
        const finalLocation = newAsset.location || newAsset.dynamicValues?.[locationKey] || newAsset.dynamicValues?.['Location'] || '';
        const finalPrice = newAsset.price || newAsset.dynamicValues?.[priceKey] || newAsset.dynamicValues?.['Price'] || '';

        // Category & Sub-category (Only overwrite if we have actual new values in state)
        if (newAsset.category?.id) {
            const catName = categories.find(c => String(c.id) === String(newAsset.category.id))?.name;
            if (catName) setVal(categoryKey, catName);
        }
        if (newAsset.subCategory?.id) {
            const subName = categories.find(c => String(c.id) === String(newAsset.subCategory.id))?.name;
            if (subName) setVal(subCategoryKey, subName);
        }

        // Populate core fields into map for backend consistency
        // Use setVal to ensure we don't have multiple case variants of the same logical field
        if (finalStatus) {
            setVal('Status', finalStatus);
            if (statusKey !== 'Status') setVal(statusKey, finalStatus);
        }
        if (finalCondition) {
            setVal('Condition', finalCondition);
            if (conditionKey !== 'Condition') setVal(conditionKey, finalCondition);
        }
        if (finalTag) {
            setVal('Asset Tag', finalTag);
            if (tagKey !== 'Asset Tag') setVal(tagKey, finalTag);
        }
        if (finalSerial) {
            setVal('Serial Number', finalSerial);
            if (serialKey !== 'Serial Number') setVal(serialKey, finalSerial);
        }
        if (finalLocation) {
            setVal('Location', finalLocation);
            if (locationKey !== 'Location') setVal(locationKey, finalLocation);
        }
        if (finalPrice) {
            setVal('Price', finalPrice);
            if (priceKey !== 'Price') setVal(priceKey, finalPrice);
        }

        // Clean up empty values ONLY (but keep 0 or other falsy values that are valid data)
        Object.keys(allDynamicValues).forEach(key => {
            const v = allDynamicValues[key];
            if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
                delete allDynamicValues[key];
            }
        });

        console.log("Final compiled dynamic values for validation:", allDynamicValues);

        // 1. Structural Validation (Strict)
        const errors = {};
        const missingFieldNames = [];

        if (!newAsset.category?.id) {
            errors['Category'] = true;
            missingFieldNames.push('Category');
        }

        // 2. Template Mandatory Validation
        const mandatoryColumns = templateColumns.filter(col => col.mandatory === true);
        mandatoryColumns.forEach(col => {
            // Check lookup case-insensitively just for safety in validation
            const matchKey = Object.keys(allDynamicValues).find(k => k.toLowerCase().trim() === col.value.toLowerCase().trim());
            const val = matchKey ? allDynamicValues[matchKey] : null;

            if (!val || String(val).trim() === '') {
                errors[col.value] = true;
                missingFieldNames.push(col.value);
            }
        });

        // Update UI state with errors
        setValidationErrors(errors);

        if (missingFieldNames.length > 0) {
            const uniqueMissingFields = [...new Set(missingFieldNames)];
            alert(`Please fill in the following required fields: ${uniqueMissingFields.join(', ')}`);
            return;
        }

        try {
            // Send only dynamic values (no fixed fields)
            const assetToSave = {
                id: newAsset.id, // Include ID for edit mode
                category: { id: newAsset.category.id },
                subCategory: newAsset.subCategory.id ? { id: newAsset.subCategory.id } : null,
                dynamicValues: allDynamicValues,
                assignedToEmployee: newAsset.assignedToEmployee,
                notes: newAsset.notes
            };

            console.log("Saving asset. isEditMode:", isEditMode, "Payload:", assetToSave);
            console.log("allDynamicValues:", allDynamicValues);
            console.log("newAsset.dynamicValues:", newAsset.dynamicValues);
            console.log("templateColumns:", templateColumns);

            const currentCreator = sessionStorage.getItem("employeeId") && sessionStorage.getItem("employeeName")
                ? `${sessionStorage.getItem("employeeId")} - ${sessionStorage.getItem("employeeName")}`
                : (sessionStorage.getItem("employeeName") || 'ADMIN');

            console.log("Saving asset with creator:", currentCreator);

            if (isEditMode) {
                console.log("Updating asset payload:", assetToSave);
                await api.put(`/assets/${assetToSave.id}?userId=${currentCreator}`, assetToSave, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Asset updated successfully");
            } else {
                console.log("Creating new asset:", assetToSave);
                await api.post(`/assets?userId=${currentCreator}`, assetToSave, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Asset registered successfully");
            }
            // Parallel execution for better performance
            await Promise.all([fetchAssets(), onAssetChange?.()]);
            console.log("Assets refreshed. Closing modal.");
            setShowModal(false);
            setNewAsset({ assetTag: '', serialNumber: '', category: { id: '' }, subCategory: { id: '' }, dynamicValues: {}, conditionAtStock: '', location: '', status: '', price: '' });
            setIsEditMode(false);
            setSelectedFields({});
            setValidationErrors({});
        } catch (error) {
            console.error("DEBUG: Save error details:", error);
            if (error.response) {
                console.error("DEBUG: Server response data:", error.response.data);
                console.error("DEBUG: Server response status:", error.response.status);
            }
            showToast(error.response?.data || "Error saving asset", 'error');
        }
    };

    const handleEditClick = (asset) => {
        console.log("DEBUG: Editing asset:", asset);
        setIsEditMode(true);

        const dynamicValues = asset.dynamicValues || {};

        // Helper for case-insensitive lookup
        const getVal = (variants) => {
            const matchKey = Object.keys(dynamicValues).find(k =>
                variants.some(v => v.toLowerCase().trim() === k.toLowerCase().trim())
            );
            return matchKey ? dynamicValues[matchKey] : null;
        };

        // Extract values from database (checking dynamic map first, then top-level fields)
        const actualStatus = getVal(['Status', 'Asset Status', 'AssetStatus']) || asset.status || '';
        const actualCondition = getVal(['Condition', 'Condition At Stock', 'Asset Condition']) || asset.conditionAtStock || '';
        const actualTag = getVal(['Asset Tag', 'AssetTag', 'Tag']) || asset.assetTag || '';
        const actualSerial = getVal(['Serial Number', 'SerialNumber', 'Serial']) || asset.serialNumber || '';
        const actualLocation = getVal(['Location', 'Asset Location']) || asset.location || '';
        const actualPrice = getVal(['Price', 'Asset Price']) || asset.price || '';

        const mappedAsset = {
            id: asset.id,
            category: { id: asset.category?.id || '' },
            subCategory: { id: asset.subCategory?.id || '' },
            dynamicValues: { ...dynamicValues },
            assignedToEmployee: asset.assignedToEmployee || null,
            notes: asset.notes || '',
            // Populate structural fields
            assetTag: actualTag,
            serialNumber: actualSerial,
            status: actualStatus,
            conditionAtStock: actualCondition,
            location: actualLocation,
            price: actualPrice
        };

        // CRITICAL: Normalize ALL fields from the template to use the EXACT casing from the currently loaded configuration
        // This handles core fields AND any custom dynamic fields added via Admin
        templateColumns.forEach(col => {
            const templateKey = col.value;
            const lowerTemplateKey = templateKey.toLowerCase().trim();

            // Core field mapping variants
            let variants = [templateKey];
            let actualValueForCoreField = null;

            if (lowerTemplateKey === 'status' || lowerTemplateKey === 'asset status') {
                variants = ['Status', 'Asset Status', 'AssetStatus'];
                actualValueForCoreField = actualStatus;
            } else if (lowerTemplateKey === 'condition' || lowerTemplateKey === 'condition at stock' || lowerTemplateKey === 'asset condition') {
                variants = ['Condition', 'Condition At Stock', 'Asset Condition'];
                actualValueForCoreField = actualCondition;
            } else if (lowerTemplateKey === 'asset tag' || lowerTemplateKey === 'tag') {
                variants = ['Asset Tag', 'AssetTag', 'Tag'];
                actualValueForCoreField = actualTag;
            } else if (lowerTemplateKey === 'serial number' || lowerTemplateKey === 'serial') {
                variants = ['Serial Number', 'SerialNumber', 'Serial'];
                actualValueForCoreField = actualSerial;
            } else if (lowerTemplateKey === 'location') {
                variants = ['Location', 'Asset Location'];
                actualValueForCoreField = actualLocation;
            } else if (lowerTemplateKey === 'price') {
                variants = ['Price', 'Asset Price'];
                actualValueForCoreField = actualPrice;
            }

            // Find the best matching value from current asset data (dynamic map or top-level field)
            // Prioritize the already calculated 'actual' values for core fields to ensure entity data is captured
            const matchedValue = actualValueForCoreField || getVal(variants) || asset[templateKey] || asset[templateKey.charAt(0).toLowerCase() + templateKey.slice(1).replace(/ /g, '')] || '';

            // Set the value using the exact template key
            mappedAsset.dynamicValues[templateKey] = matchedValue;

            // Also ensure the primary state is updated for core fields
            if (lowerTemplateKey === 'status' || lowerTemplateKey === 'asset status') mappedAsset.status = matchedValue;
            if (lowerTemplateKey === 'condition' || lowerTemplateKey === 'condition at stock' || lowerTemplateKey === 'asset condition') mappedAsset.conditionAtStock = matchedValue;
            if (lowerTemplateKey === 'asset tag' || lowerTemplateKey === 'tag') mappedAsset.assetTag = matchedValue;
            if (lowerTemplateKey === 'serial number' || lowerTemplateKey === 'serial') mappedAsset.serialNumber = matchedValue;
            if (lowerTemplateKey === 'location') mappedAsset.location = matchedValue;
            if (lowerTemplateKey === 'price') mappedAsset.price = matchedValue;
        });

        // Ensure canonical fallbacks for common keys used in form logic and backend sync
        if (actualStatus) {
            mappedAsset.dynamicValues['Status'] = actualStatus;
            mappedAsset.dynamicValues['Asset Status'] = actualStatus;
        }
        if (actualCondition) {
            mappedAsset.dynamicValues['Condition'] = actualCondition;
            mappedAsset.dynamicValues['Condition At Stock'] = actualCondition;
        }
        if (actualTag) {
            mappedAsset.dynamicValues['Asset Tag'] = actualTag;
            mappedAsset.dynamicValues['AssetTag'] = actualTag;
        }
        if (actualSerial) {
            mappedAsset.dynamicValues['Serial Number'] = actualSerial;
            mappedAsset.dynamicValues['SerialNumber'] = actualSerial;
        }

        console.log("DEBUG: Final mapped asset for edit:", mappedAsset);
        setNewAsset(mappedAsset);
        setValidationErrors({}); // Clear old errors

        // Populate visibility selections based on ALL fields present in the template or dynamic values
        const selections = {};
        templateColumns.forEach(col => { selections[col.value] = true; });
        Object.keys(mappedAsset.dynamicValues).forEach(key => { selections[key] = true; });
        setSelectedFields(selections);

        setShowModal(true);
    };

    const handleDelete = async (assetId, assetTag) => {
        if (!window.confirm(`Are you sure you want to delete asset ${assetTag}? This action cannot be undone.`)) {
            return;
        }
        try {
            const currentCreator = sessionStorage.getItem("employeeId") && sessionStorage.getItem("employeeName")
                ? `${sessionStorage.getItem("employeeId")} - ${sessionStorage.getItem("employeeName")}`
                : (sessionStorage.getItem("employeeName") || 'ADMIN');

            await api.delete(`/assets/${assetId}?userId=${currentCreator}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Parallel execution for better performance
            await Promise.all([fetchAssets(), onAssetChange?.()]);
            alert("Asset deleted successfully");
        } catch (error) {
            showToast(error.response?.data || "Error deleting asset", 'error');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const templateNames = templateColumns.map(t => t.value);
            const seen = new Set();
            const orderedCols = [];

            // 1. Add template columns first in their order
            templateNames.forEach(col => {
                const normalized = col.toLowerCase().trim();
                if (!seen.has(normalized)) {
                    seen.add(normalized);
                    orderedCols.push(col);
                }
            });

            const allCols = orderedCols.join(',');
            const response = await api.get('/assets/template', {
                params: { columns: allCols, t: new Date().getTime() },
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'asset_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Error downloading template");
        }
    };

    const validateImportFile = (file) => {
        if (!file) return false;

        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/csv' // .csv (alternative MIME type)
        ];

        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        const hasValidMimeType = allowedTypes.includes(file.type);

        if (!hasValidExtension) {
            alert('Invalid file format. Please upload only .xlsx, .xls, or .csv files.');
            return false;
        }

        if (!hasValidMimeType && !fileName.endsWith('.csv')) {
            alert('Invalid file type. Please upload a valid Excel or CSV file.');
            return false;
        }

        return true;
    };

    const handleImport = async () => {
        if (!importFile) {
            alert('Please select a file to import.');
            return;
        }

        if (!validateImportFile(importFile)) {
            return;
        }

        // Validate mandatory template columns before importing
        const mandatoryColumns = templateColumns.filter(col => col.mandatory === true);

        // Validation is driven primarily by template mandatory settings
        const allMandatoryFields = [...mandatoryColumns.map(col => col.value)];
        if (!allMandatoryFields.includes('Category')) allMandatoryFields.push('Category');

        console.log('Bulk Import Validation:');
        console.log('- Template columns:', templateColumns);
        console.log('- Mandatory template columns:', mandatoryColumns);
        console.log('- All mandatory fields:', allMandatoryFields);

        // Skip confirmation and proceed directly with import
        executeImport();
    };

    const executeImport = async () => {
        setImporting(true);
        setImportResults(null);
        setShowImportConfirm(false);
        const formData = new FormData();
        formData.append('file', importFile);

        const currentCreator = sessionStorage.getItem("employeeId") && sessionStorage.getItem("employeeName")
            ? `${sessionStorage.getItem("employeeId")} - ${sessionStorage.getItem("employeeName")}`
            : (sessionStorage.getItem("employeeName") || 'ADMIN');

        try {
            const res = await api.post(`/assets/import?userId=${currentCreator}&t=${new Date().getTime()}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            const data = res.data;
            if (Array.isArray(data)) {
                const successes = [];
                const errors = [];
                data.forEach(msg => {
                    if (String(msg).toLowerCase().includes('error')) {
                        errors.push(msg);
                    } else {
                        successes.push(msg);
                    }
                });

                if (errors.length === 0) {
                    alert(`Import completed successfully! All ${successes.length} row(s) imported.`);
                } else {
                    const errorSummary = errors.join('\n');
                    const successSummary = successes.length > 0 ? `${successes.length} row(s) imported successfully.\n\n` : '';
                    alert(`Import completed with errors:\n\n${successSummary}Errors:\n${errorSummary}`);
                }
                setImportResults(data);
            } else if (data && data.rowErrors && Array.isArray(data.rowErrors)) {
                const msgs = data.rowErrors.map(err => `Row ${err.row}: ${err.field} - ${err.error}`);
                alert(`Import failed with validation errors:\n\n${msgs.join('\n')}`);
                setImportResults(msgs);
            } else if (data && typeof data === 'object') {
                const message = data.message || JSON.stringify(data);
                alert(message);
                setImportResults([message]);
            } else {
                alert(String(data));
                setImportResults([String(data)]);
            }
            await fetchAssets();
            if (onAssetChange) onAssetChange();
        } catch (error) {
            console.error('Import error details:', error);
            if (error.response?.data && typeof error.response.data === 'object') {
                const errorData = error.response.data;

                // Handle different types of errors with user-friendly messages
                if (errorData.rowErrors && Array.isArray(errorData.rowErrors)) {
                    // Row-specific validation errors
                    const errorMessages = errorData.rowErrors.map(err => {
                        if (err.row && err.field) {
                            return `Row ${err.row}: ${err.field} - ${err.error || 'is missing or invalid'}`;
                        }
                        return err.error || 'Unknown error';
                    });

                    const errorMessage = errorMessages.join('\n');
                    const alertTitle = 'Import Validation Failed';

                    window.alert(`${alertTitle}\n\n${errorMessage}`);

                } else if (errorData.missingFields && Array.isArray(errorData.missingFields)) {
                    // Missing columns error
                    const missingFieldsList = errorData.missingFields.join(', ');
                    window.alert(`Missing Required Columns\n\nThe following required columns are missing from your Excel file:\n\n${missingFieldsList}\n\nPlease add them and try again.`);

                } else if (errorData.message) {
                    // General error with custom message
                    window.alert(`Import Notice\n\n${errorData.message}`);

                } else {
                    // Unknown error format
                    window.alert(`Unexpected Import Error\n\nAn unexpected error occurred during import.\n\nError details: ${JSON.stringify(errorData)}`);
                }
            } else {
                const errorMsg = error.response?.data || "External server connection failed or interrupted.";
                const isFormatError = String(errorMsg).includes("Invalid file format") || String(errorMsg).includes("upload only .xlsx");

                if (isFormatError) {
                    alert(errorMsg);
                } else {
                    alert(errorMsg);
                }
            }
        } finally {
            setImporting(false);
        }
    };

    const toTitleCase = (str) => {
        if (!str) return '';
        const lower = str.toLowerCase().trim();
        if (lower === 'category') return 'Category';
        if (lower === 'sub-category' || lower === 'subcategory') return 'Sub-Category';
        if (lower === 'status' || lower === 'asset status') return 'Asset Status';
        
        return str
            .toLowerCase()
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => {
                if (word.includes('-')) {
                    return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
                }
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    return (
        <div className="asset-master" style={{ color: '#0f172a' }}>
            <style>{`
                input.asset-search-input {
                    border-radius: 8px !important;
                }
                
                .section-title {
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #0f172a;
                    font-size: 1.4rem;
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
                    border-radius:4px;
                }
                .modal-body-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .modal-body-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                /* Professional Button Effects */
                .btn-professional {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-weight: 600;
                    letter-spacing: -0.01em;
                }
                .btn-professional:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                /* Enhanced react-select input styling - Force text visibility without bubbles */
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
                    border-radius: 8px !important;
                }

                .react-select__menu-list {
                    width: auto !important;
                    min-width: 300px !important;
                    max-height: 220px !important;
                    overflow-y: auto !important;
                    border-radius: 8px !important;
                }

                /* Force perfect 8px border-radius on all form controls, selects, textareas, and date pickers */
                .form-control,
                .modal-content input,
                .modal-content select,
                .modal-content textarea,
                .premium-form .form-control,
                .premium-form input,
                .premium-form select,
                .premium-form textarea,
                .premium-datepicker-container input,
                .full-width-picker input {
                    border-radius: 8px !important;
                }

                /* Ultimate high-specificity selectors to crush any SPA global CSS overrides and force exactly 8px border-radius */
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group input.form-control,
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group input[type="text"],
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group select,
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group textarea,
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group .react-select__control,
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group .react-select__value-container,
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group .premium-datepicker-container input,
                div.asset-master div.modal-overlay div.modal-content.premium-form .form-group .full-width-picker input {
                    border-radius: 8px !important;
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

                .btn-professional:active {
                    transform: translateY(0);
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
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>


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
                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto', position: 'relative' }}>
                    <button
                        className="btn-secondary"
                        onClick={() => setShowColumnSelector(!showColumnSelector)}
                        style={{
                            background: showColumnSelector ? '#1F6FEB' : '#f8fafc',
                            color: showColumnSelector ? 'white' : '#64748b',
                            border: '1px solid #e2e8f0',
                            fontWeight: '600'
                        }}
                    >
                        <i className={`bi ${showColumnSelector ? 'bi-layout-three-columns' : 'bi-layout-sidebar'}`} style={{ display: 'none' }}></i> Manage Columns
                    </button>
                    <button className="btn-secondary" onClick={() => { setShowImportModal(true); setImportFile(null); setImportResults(null); }} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        Bulk Import
                    </button>
                    <button className="btn-primary" onClick={() => { setNewAsset({ assetTag: '', serialNumber: '', category: { id: '' }, subCategory: { id: '' }, dynamicValues: {}, conditionAtStock: '', location: '', status: '', price: '' }); setIsEditMode(false); setSelectedFields({}); setValidationErrors({}); setShowModal(true); }} style={{ backgroundColor: '#00B3A4', background: '#00B3A4', boxShadow: '0 4px 12px rgba(0, 179, 164, 0.3)' }}>
                        + Add Asset
                    </button>

                    {/* Centered Column Selector Modal */}
                    {showColumnSelector &&
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                            backdropFilter: 'blur(4px)'
                        }} onClick={() => setShowColumnSelector(false)}>
                            <div style={{
                                width: '750px',
                                background: 'white',
                                borderRadius: '24px',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                border: '1px solid #f1f5f9',
                                padding: '32px',
                                maxHeight: '90vh',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                animation: 'scaleUp 0.3s ease-out'
                            }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Select Priority Columns</h4>
                                    <button onClick={() => setShowColumnSelector(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.6' }}>
                                    Choose the fields you want to see in your inventory. The columns will appear in the <strong>exact order</strong> you select them.
                                </p>
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '12px',
                                    paddingRight: '4px'
                                }}>


                                    {(() => {
                                        const templateNames = templateColumns.map(c => c.value);
                                        const uniqueList = [];
                                        const seen = new Set();

                                        ['Category', 'Sub-category', ...templateNames, 'Actions'].forEach(col => {
                                            if (!col) return;
                                            const normalized = col.toLowerCase().trim();
                                            if (!seen.has(normalized)) {
                                                seen.add(normalized);
                                                uniqueList.push(col);
                                            }
                                        });

                                        return uniqueList.map((col, idx) => {
                                            const isSelected = visibleColumns.some(v => v.toLowerCase().trim() === col.toLowerCase().trim());
                                            return (
                                                <div
                                                    key={`card-toggle-${col}-${idx}`}
                                                    onClick={() => handleColumnVisibilityToggle(col)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '10px 14px',
                                                        borderRadius: '10px',
                                                        background: isSelected ? '#f0fdfa' : '#f8fafc',
                                                        border: isSelected ? '1px solid #99f6e4' : '1px solid #f1f5f9',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600',
                                                        color: isSelected ? '#00B3A4' : '#64748b'
                                                    }}>{col}</span>
                                                    <div style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '6px',
                                                        border: '2px solid',
                                                        borderColor: isSelected ? '#00B3A4' : '#cbd5e1',
                                                        background: isSelected ? '#00B3A4' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        {isSelected && <i className="bi bi-check" style={{ color: 'white', fontSize: '1.1rem' }}></i>}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>


            <div className="asset-table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {/* Simplified Status/Count info */}
                <div style={{
                    padding: '16px 24px',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                        {searchTerm ? (
                            `Filtered Results: ${filteredAssets.length} of ${totalAssetsCount} Total Assets`
                        ) : (
                            `Total Assets: ${totalAssetsCount}`
                        )}
                    </span>
                </div>

                <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 350px)', position: 'relative', paddingBottom: '32px' }}>
                    <table className="asset-table" style={{ minWidth: '1200px' }}>
                        <thead>
                            <tr>
                                {[...visibleColumns].map(col => (
                                    <th key={`header-${col}`} style={{ whiteSpace: 'nowrap' }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                if (assets.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan={visibleColumns.length || 1} style={{ textAlign: 'center', padding: '100px 20px', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                    <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
                                                    <div style={{ color: '#64748b', fontWeight: '500' }}>
                                                        {loading ? 'Fetching assets...' : 'Your inventory is currently empty.'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                if (filteredAssets.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan={visibleColumns.length || 1} style={{ textAlign: 'center', padding: '100px 20px', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                    <i className="bi bi-search" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
                                                    <div style={{ color: '#64748b', fontWeight: '600', fontSize: '1.1rem' }}>No matching records found.</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '400px' }}>
                                                        We couldn't find any assets matching your criteria.
                                                        Try adjusting your search or filters.
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return filteredAssets.map(asset => (
                                    <tr key={asset.id}>
                                        {[...visibleColumns].map(col => {
                                            // 1. Actions Column
                                            if (col === 'Actions') {
                                                return (
                                                    <td key="actions">
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button className="icon-btn-view" title="View Details" onClick={() => handleViewClick(asset)} style={{ background: '#f0f9ff', border: 'none', color: '#0369a1', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            <button className="icon-btn-edit" title="Edit" onClick={() => handleEditClick(asset)} style={{ background: '#fff7ed', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                                                <i className="bi bi-pencil" style={{ color: '#F4B183' }}></i>
                                                            </button>
                                                            <button
                                                                className="icon-btn-delete"
                                                                title="Delete"
                                                                onClick={() => handleDelete(asset.id, asset.dynamicValues?.['Asset Tag'] || asset.assetTag)}
                                                                disabled={(asset.dynamicValues?.['Status'] || asset.status) === 'ALLOCATED'}
                                                                style={{
                                                                    background: '#fef2f2',
                                                                    border: 'none',
                                                                    padding: '6px',
                                                                    borderRadius: '6px',
                                                                    cursor: (asset.dynamicValues?.['Status'] || asset.status) === 'ALLOCATED' ? 'not-allowed' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s',
                                                                    opacity: (asset.dynamicValues?.['Status'] || asset.status) === 'ALLOCATED' ? 0.5 : 1
                                                                }}
                                                            >
                                                                <i className="bi bi-trash" style={{ color: (asset.dynamicValues?.['Status'] || asset.status) === 'ALLOCATED' ? '#94a3b8' : '#ef4444' }}></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // 2. Data Columns
                                            let val = '-';
                                            if (col === 'Category') {
                                                val = asset.category?.name || '-';
                                            } else if (col === 'Sub-category') {
                                                val = asset.subCategory?.name || '-';
                                            } else if (col === 'Assigned To' || col.toLowerCase().trim() === 'assign to employee' || col.toLowerCase().trim() === 'assigned to employee') {
                                                const emp = asset.assignedToEmployee;
                                                val = emp ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '700', color: '#0f172a' }}>{emp.firstName} {emp.lastName}</span>
                                                        <small style={{ color: '#64748b' }}>{getDisplayEmployeeId(emp.employeeId)}</small>
                                                    </div>
                                                ) : (
                                                    asset.dynamicValues?.[col] ? (
                                                        <span style={{ fontWeight: '700', color: '#0f172a' }}>{asset.dynamicValues[col]}</span>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</span>
                                                    )
                                                );
                                            } else if (col === 'Condition At Stock' || col === 'Condition' || col === 'Asset Condition') {
                                                val = asset.dynamicValues?.['Condition'] || asset.dynamicValues?.['Condition At Stock'] || asset.dynamicValues?.['Asset Condition'] || asset.conditionAtStock || '-';
                                            } else if (col === 'Asset Status' || col === 'Status') {
                                                const status = asset.dynamicValues?.['Status'] || asset.dynamicValues?.['Asset Status'] || asset.status || 'IN_STOCK';
                                                val = (
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: '700',
                                                        background: status === 'ALLOCATED' ? '#fef3c7' : '#dcfce7',
                                                        color: status === 'ALLOCATED' ? '#92400e' : '#166534',
                                                        display: 'inline-block',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {(status || '').replace(/_/g, ' ')}
                                                    </span>
                                                );
                                            } else {
                                                // Dynamic and fallback with case-insensitive property lookup
                                                let rawValue = asset.dynamicValues?.[col];
                                                if (rawValue === undefined || rawValue === null || rawValue === '') {
                                                    const matchedKey = asset.dynamicValues ? Object.keys(asset.dynamicValues).find(k => k.toLowerCase().trim() === col.toLowerCase().trim()) : null;
                                                    if (matchedKey) {
                                                        rawValue = asset.dynamicValues[matchedKey];
                                                    }
                                                }
                                                if (rawValue === undefined || rawValue === null || rawValue === '') {
                                                    const camelCaseKey = col.charAt(0).toLowerCase() + col.slice(1).replace(/ /g, '');
                                                    rawValue = asset[camelCaseKey];
                                                    if (rawValue === undefined || rawValue === null || rawValue === '') {
                                                        const matchedEntityKey = Object.keys(asset).find(k => k.toLowerCase().trim() === col.toLowerCase().replace(/ /g, '').trim());
                                                        if (matchedEntityKey) {
                                                            rawValue = asset[matchedEntityKey];
                                                        }
                                                    }
                                                }

                                                if (rawValue === undefined || rawValue === null || rawValue === '') {
                                                    val = '-';
                                                } else {
                                                    // Attempt to format dates robustly and timezone-safely
                                                    if (col.toLowerCase().includes('date')) {
                                                        try {
                                                            const dateStr = rawValue.toString().trim();
                                                            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                                                const [year, month, day] = dateStr.split('-');
                                                                val = `${day}-${month}-${year}`;
                                                            } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                                                                val = dateStr;
                                                            } else if (!isNaN(new Date(rawValue))) {
                                                                const d = new Date(rawValue);
                                                                const day = String(d.getDate()).padStart(2, '0');
                                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                                val = `${day}-${month}-${d.getFullYear()}`;
                                                            } else {
                                                                val = rawValue.toString();
                                                            }
                                                        } catch (e) {
                                                            val = rawValue.toString();
                                                        }
                                                    }
                                                    // Format prices as INR (Indian Rupee)
                                                    else if (col.toLowerCase().includes('price') && !isNaN(parseFloat(rawValue))) {
                                                        val = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(rawValue));
                                                    }
                                                    else {
                                                        val = rawValue.toString();
                                                    }
                                                }
                                            }

                                            return <td key={'cell-' + col} style={{ fontSize: '0.75rem', color: '#334155' }}>{val}</td>;
                                        })}
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Asset Modal */}
            {showModal && (
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
                        overflow: 'hidden',
                        background: 'white'
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
                                <h2 style={{ fontSize: '15px', margin: 0, color: 'white', fontWeight: '700' }}>{isEditMode ? 'Edit Asset' : 'Register New Asset'}</h2>
                            </div>
                            <button onClick={() => {
                                setShowModal(false);
                                setIsEditMode(false);
                                setNewAsset({ assetTag: '', serialNumber: '', category: { id: '' }, subCategory: { id: '' }, dynamicValues: {}, conditionAtStock: '', location: '', status: '', price: '' });
                                setSelectedFields({});
                            }} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}>&times;</button>
                        </div>

                        <div className="modal-body-scroll" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ width: '100%' }}>

                                {/* Left Column: Integrated Multi-order Fields */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    {/* <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#1557b7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="bi bi-info-circle-fill"></i>
                                        </div>
                                        Inventory Field Order Sync
                                    </h4> */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%' }}>
                                        {(() => {
                                            const templateNames = templateColumns.map(t => t.value);
                                            const seen = new Set();
                                            const ordered = [];
                                            const coreFields = ['Category', 'Sub-category'];

                                            // 1. Template order first - this is the source of truth
                                            templateNames.forEach(n => {
                                                const norm = n.toLowerCase().trim();
                                                if (!seen.has(norm)) {
                                                    seen.add(norm);
                                                    ordered.push(n);
                                                }
                                            });

                                            // 2. Add structural core fields if they are missing
                                            coreFields.forEach(f => {
                                                const norm = f.toLowerCase().trim();
                                                if (!seen.has(norm)) {
                                                    seen.add(norm);
                                                    ordered.push(f);
                                                }
                                            });

                                            return ordered.filter(col => col !== "Actions" && col !== "Assigned To");
                                        })().map((col) => {
                                            const templateCol = templateColumns.find(t => t.value === col);
                                            const name = col;
                                            const isMandatory = templateCol ? templateCol.mandatory === true : (col === 'Category'); // Category remains structural requirement

                                            // 1. Category Dropdown
                                            if (name.toLowerCase().trim() === 'category') {
                                                return (
                                                    <div className="form-group" key={name} style={{ width: '100%' }}>
                                                        <label style={{ fontSize: '15px', textTransform: 'none' }}>Category {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                        <Select
                                                            options={categories.filter(cat => {
                                                                return !cat.parentCategory || 
                                                                    cat.parentCategory === null || 
                                                                    (typeof cat.parentCategory === 'object' && Object.keys(cat.parentCategory).length === 0);
                                                            }).map(cat => ({
                                                                value: cat.id,
                                                                label: cat.name
                                                            }))}
                                                            value={newAsset.category?.id ? {
                                                                value: newAsset.category.id,
                                                                label: categories.find(c => String(c.id) === String(newAsset.category.id))?.name || ''
                                                            } : null}
                                                            onChange={(selected) => handleCategoryChange(selected?.value || '')}
                                                            placeholder="Select Category"
                                                            styles={getCustomSelectStyles(10)}
                                                            isSearchable
                                                            isClearable
                                                            menuPortalTarget={document.body}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                );
                                            }

                                            // 2. Sub-category Dropdown
                                            const lowerName = name.toLowerCase().trim();
                                            if (lowerName === 'sub-category' || lowerName === 'subcategory') {
                                                return (
                                                    <div className="form-group" key={name} style={{ width: '100%' }}>
                                                        <label style={{ fontSize: '15px', textTransform: 'none' }}>Sub-Category {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                        <Select
                                                            options={filteredSubCategories.map(sub => ({
                                                                value: sub.id,
                                                                label: sub.name
                                                            }))}
                                                            value={newAsset.subCategory?.id ? {
                                                                value: newAsset.subCategory.id,
                                                                label: categories.find(c => String(c.id) === String(newAsset.subCategory.id))?.name || ''
                                                            } : null}
                                                            onChange={(selected) => handleSubCategoryChange(selected?.value || '')}
                                                            placeholder="Select Sub-category"
                                                            styles={getCustomSelectStyles(10)}
                                                            isSearchable
                                                            isClearable
                                                            disabled={!newAsset.category?.id}
                                                            menuPortalTarget={document.body}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                );
                                            }

                                            // 3. Condition Dropdown
                                            if (lowerName === 'condition at stock' || lowerName === 'condition' || lowerName === 'asset condition') {
                                                const rawCondition = newAsset.dynamicValues?.[name] || newAsset.conditionAtStock || '';
                                                const matchedCondition = customConditions.find(c => c.toLowerCase().trim() === rawCondition.toLowerCase().trim()) || rawCondition;
                                                return (
                                                    <div className="form-group" key={name} style={{ width: '100%' }}>
                                                        <label style={{ fontSize: '15px', textTransform: 'none' }}>{toTitleCase(name)} {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                        <Select
                                                            options={customConditions.map(cond => ({
                                                                value: cond,
                                                                label: cond
                                                            }))}
                                                            value={matchedCondition ? { value: matchedCondition, label: matchedCondition } : null}
                                                            onChange={(selected) => handleFieldChange(name, selected?.value || '')}
                                                            placeholder="-- Select Condition --"
                                                            styles={getCustomSelectStyles(10)}
                                                            isSearchable
                                                            isClearable
                                                            menuPortalTarget={document.body}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                );
                                            }

                                            // 4. Status Dropdown
                                            if (lowerName === 'asset status' || lowerName === 'status') {
                                                // Get the current status value with proper fallback logic matching the table display
                                                const rawStatus = newAsset.dynamicValues?.['Status'] ||
                                                    newAsset.dynamicValues?.['Asset Status'] ||
                                                    newAsset.status ||
                                                    '';
                                                // Ensure we match the value exactly as stored in customStatuses (handles case/format mismatches)
                                                const matchedStatus = customStatuses.find(s => s.toLowerCase().trim() === rawStatus.toLowerCase().trim()) || rawStatus;

                                                return (
                                                    <div className="form-group" key={name} style={{ width: '100%' }}>
                                                        <label style={{ fontSize: '15px', textTransform: 'none' }}>{toTitleCase(name)} {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                        <Select
                                                            options={customStatuses.map(stat => ({
                                                                value: stat,
                                                                label: stat.replace(/_/g, ' ')
                                                            }))}
                                                            value={matchedStatus ? { value: matchedStatus, label: matchedStatus.replace(/_/g, ' ') } : null}
                                                            onChange={(selected) => handleFieldChange(name, selected?.value || '')}
                                                            placeholder="-- Select Status --"
                                                            styles={getCustomSelectStyles(10)}
                                                            isSearchable
                                                            isClearable
                                                            menuPortalTarget={document.body}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                );
                                            }

                                            // 5. Assign to Employee Searchable Select (NEW: Dynamic allocation)
                                            if (lowerName === 'assign to employee' || lowerName === 'assigned to') {
                                                // Handle mapping from dynamic value string or entity field
                                                const currentEmp = newAsset.assignedToEmployee || (newAsset.dynamicValues?.[name] ? employees.find(e => {
                                                    const val = String(newAsset.dynamicValues[name]).toLowerCase();
                                                    return e.employeeId.toLowerCase() === val ||
                                                        (e.firstName + ' ' + e.lastName + ' (' + getDisplayEmployeeId(e.employeeId) + ')').toLowerCase() === val;
                                                }) : null);

                                                // Custom styles for Assign to Employee dropdown with proper positioning
                                                const assignEmployeeSelectStyles = {
                                                    ...customSelectStyles,
                                                    menuPortal: (base) => ({
                                                        ...base,
                                                        zIndex: 99999
                                                    }),
                                                    menu: (provided, state) => ({
                                                        ...provided,
                                                        zIndex: 99999,
                                                        minWidth: '300px',
                                                        width: 'auto',
                                                        position: 'absolute',
                                                        background: 'white',
                                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                        borderRadius: '8px',
                                                        // Constrain positioning to stay within viewport
                                                        ...state.placement === 'top' ? { bottom: '100%' } : { top: '100%' }
                                                    }),
                                                    menuList: (provided) => ({
                                                        ...provided,
                                                        padding: 0,
                                                        overflowY: 'auto',
                                                        borderRadius: '8px',
                                                        zIndex: 99999,
                                                        maxHeight: '130px' // Show 4 employees with scrollbar for more
                                                    })
                                                };

                                                return (
                                                    <div className="form-group" key={name} style={{ width: '100%' }}>
                                                        <label style={{ fontSize: '15px', textTransform: 'none' }}>{toTitleCase(name)} {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                        <Select
                                                            options={employees.map(emp => ({
                                                                value: emp.employeeId,
                                                                label: `${emp.firstName} ${emp.lastName} (${getDisplayEmployeeId(emp.employeeId)})`
                                                            }))}
                                                            value={currentEmp ? {
                                                                value: currentEmp.employeeId,
                                                                label: `${currentEmp.firstName} ${currentEmp.lastName} (${getDisplayEmployeeId(currentEmp.employeeId)})`
                                                            } : null}
                                                            onChange={(selected) => {
                                                                const emp = employees.find(e => e.employeeId === selected?.value);
                                                                const displayVal = emp ? `${emp.firstName} ${emp.lastName} (${getDisplayEmployeeId(emp.employeeId)})` : '';
                                                                handleFieldChange(name, displayVal);
                                                                setNewAsset(prev => ({ ...prev, assignedToEmployee: emp || null }));
                                                            }}
                                                            placeholder="- Select Holder -"
                                                            styles={assignEmployeeSelectStyles}
                                                            isClearable
                                                            isSearchable
                                                            filterOption={(option, inputValue) => {
                                                                if (!inputValue) return true;
                                                                const search = inputValue.toLowerCase();
                                                                return option.label.toLowerCase().includes(search);
                                                            }}
                                                            classNamePrefix="react-select"
                                                            menuShouldScrollIntoView={false}
                                                            maxMenuHeight={130}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // 6. Price Special Validation (Numeric)
                                            if (name.toLowerCase().includes('price')) {
                                                return (
                                                    <div className="form-group" key={name} style={{ width: '100%' }}>
                                                        <label style={{ fontSize: '15px', textTransform: 'none' }}>{toTitleCase(name)} {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder={`Enter ${toTitleCase(name)}`}
                                                            value={newAsset.dynamicValues?.[name] || ''}
                                                            onChange={(e) => {
                                                                // Only allow numbers and decimal point
                                                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                                                handleFieldChange(name, value);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                // Prevent arrow keys from changing value
                                                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            required={isMandatory}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // 6. Date Picker for any field with "Date" in its name
                                            if (name.toLowerCase().includes('date')) {
                                                return (
                                                    <div className="form-group" key={name} style={{ width: '100%' }}>
                                                        <label style={{ fontSize: '15px', textTransform: 'none' }}>{toTitleCase(name)} {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                        <SmartDatePicker
                                                            value={newAsset.dynamicValues?.[name] || ''}
                                                            onChange={(date) => handleFieldChange(name, date)}
                                                            placeholder={`Select ${toTitleCase(name)}`}
                                                            disabled={false}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // 7. Standard Text Inputs for everything else
                                            return (
                                                <div className="form-group" key={name} style={{ width: '100%' }}>
                                                    <label style={{ fontSize: '15px', textTransform: 'none' }}>{toTitleCase(name)} {isMandatory && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder={`Enter ${toTitleCase(name)}`}
                                                        value={newAsset.dynamicValues?.[name] || ''}
                                                        onChange={(e) => handleFieldChange(name, e.target.value)}
                                                        required={isMandatory}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>


                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: 'white', borderRadius: '0 0 8px 8px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button className="btn-secondary" style={{ padding: '12px 28px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', color: '#64748b' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn-primary" style={{ padding: '12px 48px', borderRadius: '8px', background: '#1557b7', boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)', fontWeight: '700', border: 'none' }} onClick={handleSave}>
                                    {isEditMode ? 'Update Asset' : 'Register Asset'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showImportModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h4 className="modal-title">Bulk Import Assets</h4>
                            <button className="btn-close" onClick={() => { setShowImportModal(false); setImportResults(null); }}></button>
                        </div>
                        <div className="modal-body">
                            {!importResults ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>


                                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>Step 1: Download Template</div>
                                            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Get the required structure for importing</div>
                                        </div>
                                        <button className="btn-secondary" onClick={handleDownloadTemplate} style={{ fontSize: '0.85rem', color: '#00B3A4', border: '1px solid #00B3A4', background: 'white' }}>
                                            <i className="bi bi-download"></i> Download
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                                            <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>Step 2: Upload File</div>
                                            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Upload filled Excel or CSV file</div>
                                        </div>
                                        <div style={{
                                            border: '2px dashed #00B3A4',
                                            padding: '32px 20px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                            backgroundColor: '#f0fdfa'
                                        }}>
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls, .csv"
                                                style={{ display: 'none' }}
                                                id="bulk-import-file-input"
                                                onChange={(e) => {
                                                    console.log('Asset bulk import file change triggered');
                                                    console.log('Files selected:', e.target.files);
                                                    const file = e.target.files[0];
                                                    if (file && validateImportFile(file)) {
                                                        console.log('File validation passed:', file.name);
                                                        setImportFile(file);
                                                    } else {
                                                        console.log('File validation failed or no file selected');
                                                        // Clear input if validation fails
                                                        e.target.value = '';
                                                        setImportFile(null);
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor="bulk-import-file-input"
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '10px 24px',
                                                    background: 'white',
                                                    color: '#00B3A4',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.95rem',
                                                    border: '1px solid #00B3A4',
                                                    marginBottom: '12px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.target.style.background = '#00B3A4'; e.target.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.color = '#00B3A4'; }}
                                            >
                                                <i className="bi bi-upload" style={{ marginRight: '8px' }}></i>
                                                Choose File
                                            </label>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                {importFile ? importFile.name : "or drag and drop your file here"}
                                            </div>
                                            {importFile && (
                                                <button
                                                    type="button"
                                                    onClick={() => setImportFile(null)}
                                                    style={{
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        marginTop: '12px'
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i> Remove File
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <h5 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="bi bi-file-earmark-bar-graph" style={{ color: '#1557b7' }}></i>
                                        Import Results Summary
                                    </h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {Array.isArray(importResults) ? importResults.map((msg, idx) => {
                                            const isSuccess = String(msg).toLowerCase().includes('success');
                                            return (
                                                <div key={idx} style={{
                                                    fontSize: '0.85rem',
                                                    padding: '12px 16px',
                                                    background: isSuccess ? '#ecfdf5' : '#fff1f2',
                                                    border: `1px solid ${isSuccess ? '#d1fae5' : '#ffe4e6'}`,
                                                    borderRadius: '8px',
                                                    color: isSuccess ? '#065f46' : '#9f1239',
                                                    display: 'flex',
                                                    alignItems: 'baseline',
                                                    gap: '12px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    <i className={`bi ${isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} style={{
                                                        fontSize: '1rem',
                                                        color: isSuccess ? '#10b981' : '#f43f5e',
                                                        marginTop: '2px'
                                                    }}></i>
                                                    <span style={{ fontWeight: '500' }}>{msg}</span>
                                                </div>
                                            );
                                        }) : (
                                            <div style={{ padding: '12px', background: '#fff1f2', borderRadius: '8px', color: '#9f1239', fontSize: '0.85rem' }}>
                                                {String(importResults)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setShowImportModal(false); setImportResults(null); }}>
                                {importResults ? 'Close' : 'Cancel'}
                            </button>
                            {!importResults && (
                                <button className="btn-primary" onClick={handleImport} disabled={!importFile || importing}>
                                    {importing ? 'Importing...' : 'Start Import'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Import Confirmation Modal */}
            {showImportConfirm && (
                <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Confirm Import</h5>
                            <button className="btn-close" onClick={() => setShowImportConfirm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '1rem', color: '#374151', marginBottom: '12px' }}>
                                    Please ensure your Excel file contains the following mandatory columns:
                                </p>
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                                        {/* Default mandatory system fields */}
                                        <li style={{ margin: '4px 0', fontWeight: '500' }}>
                                            Category <span style={{ color: '#dc2626' }}>*</span>
                                        </li>
                                        <li style={{ margin: '4px 0', fontWeight: '500' }}>
                                            Sub-category <span style={{ color: '#dc2626' }}>*</span>
                                        </li>
                                        <li style={{ margin: '4px 0', fontWeight: '500' }}>
                                            Condition At Stock <span style={{ color: '#dc2626' }}>*</span>
                                        </li>
                                        <li style={{ margin: '4px 0', fontWeight: '500' }}>
                                            Asset Status <span style={{ color: '#dc2626' }}>*</span>
                                        </li>
                                        {/* Template mandatory fields */}
                                        {templateColumns.filter(col => col.mandatory === true).map(col => (
                                            <li key={col.id} style={{ margin: '4px 0', fontWeight: '500' }}>
                                                {col.value} <span style={{ color: '#dc2626' }}>*</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '12px', fontStyle: 'italic' }}>
                                    These fields are required for all assets. Make sure your file contains these columns with valid data.
                                </p>
                            </div>
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
                                    <strong>Ready to proceed?</strong> Click "Confirm Import" to continue or "Cancel" to review your file.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowImportConfirm(false)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    color: '#6b7280',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={executeImport}
                                disabled={importing}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: '#dc2626',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: importing ? 'not-allowed' : 'pointer',
                                    opacity: importing ? 0.7 : 1
                                }}
                            >
                                {importing ? 'Importing...' : 'Confirm Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Asset Modal */}
            {showViewModal && selectedAsset && (
                <div className="modal-backdrop" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(8px)'
                }} onClick={() => setShowViewModal(false)}>
                    <div className="modal-content" style={{
                        backgroundColor: '#F5F7FA',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '1000px',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        padding: 0,
                        border: 'none',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'modalFadeIn 0.3s ease-out'
                    }} onClick={(e) => e.stopPropagation()}>
                        <style>{`
                            @keyframes modalFadeIn {
                                from { transform: scale(0.95); opacity: 0; }
                                to { transform: scale(1); opacity: 1; }
                            }
                            .detail-card {
                                background: #f8fafc;
                                border: 1px solid #f1f5f9;
                                border-radius: 8px;
                                padding: 20px;
                                height: 100%;
                            }
                            .detail-row {
                                display: flex;
                                flex-direction: column;
                                align-items: flex-start;
                                gap: 4px;
                                padding: 12px 0;
                                border-bottom: 1px solid #f1f5f9;
                            }
                            .detail-row:last-child {
                                border-bottom: none;
                            }
                            .detail-label {
                                font-size: 0.9rem;
                                text-transform: uppercase;
                                letter-spacing: 0.05em;
                                font-weight: 700;
                                line-height: 1.5;
                                color: #1e293b;
                            }
                            .detail-value {
                                font-size: 0.9rem;
                                font-weight: 700;
                                text-align: left;
                                word-break: break-all;
                                line-height: 1.5;
                                color: #1e293b;
                            }
                        `}</style>

                        <div className="modal-header" style={{
                            padding: '20px 32px',
                            background: '#629AF1',
                            color: 'white',
                            borderRadius: '8px 8px 0 0',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div>
                                        <h5 style={{ margin: 0, fontSize: '30px', fontWeight: 'normal', color: 'white', letterSpacing: '-0.02em', lineHeight: '1.2' }}>Asset Information</h5>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'rgba(255,255,255,0.8)' }}>Technical specifications and lifecycle details</p>
                                    </div>
                                </div>
                            </div>
                            <button className="btn-close" onClick={() => setShowViewModal(false)} style={{ position: 'absolute', top: '50%', right: '24px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>&times;</button>
                        </div>

                        <div className="modal-body" style={{ padding: '32px', background: '#F5F7FA', overflowY: 'auto' }}>
                            {/* Asset Overview Card */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Asset Overview</h6>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Core asset information</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#64748b', letterSpacing: '0.05em' }}>Asset Tag</span>
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{selectedAsset.dynamicValues?.['Asset Tag'] || selectedAsset.assetTag || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Specifications Card */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Technical Specifications</h6>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Hardware and configuration details</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Serial Number</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.serialNumber || '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Model</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.dynamicValues?.['Asset Model Name'] || selectedAsset.assetModelName || '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Category</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.category?.name || '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Sub-category</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.subCategory?.name || '-'}</div>
                                        </div>
                                    </div>
                                    {selectedAsset.dynamicValues?.['Configuration'] && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', gridColumn: 'span 2' }}>
                                            <div>
                                                <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Configuration</div>
                                                <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.dynamicValues?.['Configuration'] || '-'}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status & Location Card */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Status & Location</h6>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Current asset status and location</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Status</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{(selectedAsset.status || '').replace(/_/g, ' ')}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Condition</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.conditionAtStock || '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Location</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.location || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information Card */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Financial Information</h6>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Cost and warranty details</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Price</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>{selectedAsset.price ? `₹${new Intl.NumberFormat('en-IN').format(parseFloat(selectedAsset.price))}` : '-'}</div>
                                        </div>
                                    </div>
                                    {selectedAsset.dynamicValues?.['Warranty End Date'] && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Warranty End</div>
                                                <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>
                                                    {(() => {
                                                        const rawDate = selectedAsset.dynamicValues?.['Warranty End Date'];
                                                        if (!rawDate) return '-';
                                                        const dateStr = String(rawDate).trim();
                                                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                                            const [year, month, day] = dateStr.split('-');
                                                            return `${day}-${month}-${year}`;
                                                        }
                                                        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                                                            return dateStr;
                                                        }
                                                        const d = new Date(dateStr);
                                                        if (isNaN(d.getTime())) {
                                                            return dateStr.replace(/\//g, '-');
                                                        }
                                                        const dd = String(d.getDate()).padStart(2, '0');
                                                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                        return `${dd}-${mm}-${d.getFullYear()}`;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline Information Card */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Timeline Information</h6>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Asset lifecycle and ownership</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Creation Date</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>
                                                {selectedAsset.createdAt ? (() => { const d = new Date(selectedAsset.createdAt); return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`; })() : '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Added By</div>
                                            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{selectedAsset.createdBy || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Fields */}
                            {selectedAsset.dynamicValues && Object.entries(selectedAsset.dynamicValues)
                                .filter(([key]) => !['Asset Tag', 'Asset Model Name', 'Category', 'Sub-category', 'Configuration', 'Serial Number', 'Asset Status', 'Condition', 'Location', 'Price', 'Warranty End Date'].includes(key))
                                .length > 0 && (
                                    <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                            <div>
                                                <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Additional Information</h6>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b' }}>Custom fields and specifications</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                            {selectedAsset.dynamicValues && Object.entries(selectedAsset.dynamicValues)
                                                .filter(([key]) => !['Asset Tag', 'Asset Model Name', 'Category', 'Sub-category', 'Configuration', 'Serial Number', 'Asset Status', 'Condition', 'Location', 'Price', 'Warranty End Date'].includes(key))
                                                .map(([key, value]) => {
                                                     let displayValue = value || '-';
                                                     if (value) {
                                                         const valStr = String(value).trim();
                                                         if (key.toLowerCase().includes('date') || /^\d{4}-\d{2}-\d{2}$/.test(valStr)) {
                                                             if (/^\d{4}-\d{2}-\d{2}$/.test(valStr)) {
                                                                 const [year, month, day] = valStr.split('-');
                                                                 displayValue = `${day}-${month}-${year}`;
                                                             } else if (/^\d{2}-\d{2}-\d{4}$/.test(valStr)) {
                                                                 displayValue = valStr;
                                                             } else {
                                                                 const d = new Date(valStr);
                                                                 if (!isNaN(d.getTime())) {
                                                                     const dd = String(d.getDate()).padStart(2, '0');
                                                                     const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                                     displayValue = `${dd}-${mm}-${d.getFullYear()}`;
                                                                 }
                                                             }
                                                         }
                                                     }
                                                     return (
                                                         <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                                             <div>
                                                                 <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>{key}</div>
                                                                 <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{displayValue}</div>
                                                             </div>
                                                         </div>
                                                     );
                                                 })
                                            }
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="modal-footer" style={{
                            padding: '24px 32px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            background: '#F5F7FA',
                            borderRadius: '0 0 8px 8px'
                        }}>
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
            )}



            <ToastNotification
                isOpen={toast.isOpen}
                onClose={closeToast}
                message={toast.message}
                type={toast.type}
            />
        </div>
    );
};

export default AssetMaster;
