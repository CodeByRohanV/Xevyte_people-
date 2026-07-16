import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiInfo, FiLayers, FiArrowLeft, FiList } from 'react-icons/fi';
import * as Icons from 'react-icons/fi';
import ToastNotification from '../components/ToastNotification';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './AdminITDeclaration.css';

const AdminITDeclaration = () => {
    const [activeTab, setActiveTab] = useState('declarations'); // 'declarations' or 'settings'
    const [settings, setSettings] = useState({ fromDate: '', toDate: '', financialYear: '' });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [cardYear, setCardYear] = useState('');
    const [settingsYear, setSettingsYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

    const getFinancialYears = () => {
        const years = [];
        const currentYearValue = new Date().getFullYear();
        for (let i = -2; i <= 1; i++) {
            const startYear = currentYearValue + i;
            years.push(`${startYear}-${startYear + 1}`);
        }
        return years;
    };

    // SmartDatePicker component matching onboarding Date of Birth calendar
    const SmartDatePicker = ({ value, onChange, placeholder = "DD-MM-YYYY", disabled = false }) => {
        const [open, setOpen] = useState(false);
        const [showMonthDropdown, setShowMonthDropdown] = useState(false);
        const [showYearDropdown, setShowYearDropdown] = useState(false);

        const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 100 }, (_, i) => currentYear + 50 - i); // Range including future years for settings

        const formatLocalDate = (date) => {
            if (!date) return "";
            const pad = (n) => n.toString().padStart(2, "0");
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        };

        const parseDate = (val) => {
            if (!val) return null;
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        };

        return (
            <div className="admin-datepicker-wrapper">
                <DatePicker
                    selected={parseDate(value)}
                    disabled={disabled}
                    onChange={(date) => {
                        onChange(formatLocalDate(date));
                        setTimeout(() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }, 20);
                    }}
                    onSelect={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
                    open={open && !disabled}
                    onInputClick={() => !disabled && setOpen(true)}
                    onClickOutside={() => { setOpen(false); setShowMonthDropdown(false); setShowYearDropdown(false); }}
                    placeholderText={placeholder}
                    dateFormat="dd-MM-yyyy"
                    className="admin-datepicker-input"
                    renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }) => (
                        <div className="custom-calendar-header">
                            <div className="calendar-header-banner">
                                <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); decreaseMonth(); }}>&#8249;</button>
                                <div className="header-main-content">
                                    <div className="header-text-group">
                                        <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}>{MONTHS[date.getMonth()]}</span>
                                        <span className="clickable-header-text" onClick={(e) => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}>{date.getFullYear()}</span>
                                    </div>
                                </div>
                                <button type="button" className="header-nav-btn" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(false); setShowYearDropdown(false); increaseMonth(); }}>&#8250;</button>
                            </div>
                            {showMonthDropdown && (<div className="header-dropdown month-dropdown"><div className="dropdown-scroll-pane">{MONTHS.map((m, idx) => (<div key={m} className={"dropdown-item" + (idx === date.getMonth() ? " active" : "")} onClick={() => { changeMonth(idx); setShowMonthDropdown(false); }}>{m}</div>))}</div></div>)}
                            {showYearDropdown && (<div className="header-dropdown year-dropdown"><div className="dropdown-scroll-pane">{years.map(y => (<div key={y} className={"dropdown-item" + (y === date.getFullYear() ? " active" : "")} onClick={() => { changeYear(y); setShowYearDropdown(false); }}>{y}</div>))}</div></div>)}
                        </div>
                    )}
                />
            </div>
        );
    };

    const [view, setView] = useState('cards'); // 'cards' or 'fields'
    const [cards, setCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

    // Card Modal State
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [cardFormData, setCardFormData] = useState({
        title: '',
        description: '',
        iconName: 'FiFileText',
        displayOrder: 0,
        active: true,
        multipleAllowed: false,
        maxEntries: 1,
        sectionMaxLimit: ''
    });

    // Field Modal State
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [fieldFormData, setFieldFormData] = useState({
        fieldId: '',
        fieldLabel: '',
        dataType: 'TEXT',
        required: false,
        validationRules: '',
        dropdownOptions: '',
        placeholder: '',
        displayOrder: 0,
        maxLimit: ''
    });

    useEffect(() => {
        const years = getFinancialYears();
        setAvailableYears(years);
        const currentMonth = new Date().getMonth();
        const currentYearValue = new Date().getFullYear();
        const defaultYear = currentMonth >= 3
            ? `${currentYearValue}-${currentYearValue + 1}`
            : `${currentYearValue - 1}-${currentYearValue}`;
        setCardYear(defaultYear);
        setSettingsYear(defaultYear);
    }, []);

    useEffect(() => {
        if (cardYear) {
            fetchCards();
        }
    }, [cardYear]);

    useEffect(() => {
        if (settingsYear) {
            fetchSettings();
        }
    }, [settingsYear]);

    const fetchSettings = async () => {
        try {
            const response = await api.get(`/it-declaration-configs?financialYear=${settingsYear}`);
            if (response.data && response.data.id) {
                setSettings({
                    fromDate: response.data.fromDate || '',
                    toDate: response.data.toDate || '',
                    financialYear: response.data.financialYear || settingsYear
                });
            } else {
                setSettings({ fromDate: '', toDate: '', financialYear: settingsYear });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            await api.post('/it-declaration-configs', { ...settings, financialYear: settingsYear });
            alert("Settings saved successfully!");
        } catch (error) {
            alert("Failed to save settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const fetchCards = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/it-declaration-cards/all?financialYear=${cardYear}`);
            setCards(response.data);

            if (response.data.length === 0) {
                const allRes = await api.get('/it-declaration-cards/absolute-all');
                if (allRes.data && allRes.data.length > 0) {
                    setIsCloneModalOpen(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch cards", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClone = async (type) => {
        setIsCloneModalOpen(false);
        if (type === 'existing') {
            try {
                setLoading(true);
                const allRes = await api.get('/it-declaration-cards/absolute-all');
                const yearsWithData = [...new Set(allRes.data.map(c => c.financialYear).filter(y => y && y !== cardYear))];
                if (yearsWithData.length > 0) {
                    const latestYear = yearsWithData.sort().reverse()[0];
                    await api.post(`/it-declaration-cards/clone?fromYear=${latestYear}&toYear=${cardYear}`);
                    alert(`Configuration cloned from ${latestYear} successfully!`);
                    fetchCards();
                } else {
                    alert("No existing configuration found to clone.");
                }
            } catch (error) {
                alert("Failed to clone configuration");
            } finally {
                setLoading(false);
            }
        } else {
            alert("Starting with fresh categories for " + cardYear);
        }
    };

    const fetchFields = async (cardId) => {
        setLoading(true);
        try {
            const response = await api.get(`/it-declaration-fields/card/${cardId}`);
            setFields(response.data);
        } catch (error) {
            console.error("Failed to fetch fields", error);
        } finally {
            setLoading(false);
        }
    };

    // Card Handlers
    const handleCardSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSave = editingCard
                ? { ...cardFormData, id: editingCard.id, financialYear: cardYear }
                : { ...cardFormData, financialYear: cardYear };
            await api.post('/it-declaration-cards/save', dataToSave);
            setIsCardModalOpen(false);
            alert(`Category "${cardFormData.title}" saved successfully!`);
            fetchCards();
        } catch (error) {
            alert(`Failed to save category: ${error.message}`);
        }
    };

    const handleCardDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete all fields for this card too.")) return;
        try {
            await api.delete(`/it-declaration-cards/${id}`);
            alert("Category deleted successfully!");
            fetchCards();
        } catch (error) {
            alert("Failed to delete category");
        }
    };

    // Field Handlers
    const handleFieldSubmit = async (e) => {
        e.preventDefault();
        try {
            // Automatically generate fieldId from fieldLabel if it's missing or new
            const finalData = { ...fieldFormData };
            if (!finalData.fieldId) {
                finalData.fieldId = fieldFormData.fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
            }

            const dataToSave = editingField ? { ...finalData, id: editingField.id } : finalData;
            await api.post(`/it-declaration-fields/card/${selectedCard.id}/save`, dataToSave);
            setIsFieldModalOpen(false);
            alert(`Field "${fieldFormData.fieldLabel}" saved!`);
            fetchFields(selectedCard.id);
        } catch (error) {
            alert(`Failed to save field: ${error.message}`);
        }
    };

    const handleFieldDelete = async (id) => {
        if (!window.confirm("Delete this field?")) return;
        try {
            await api.delete(`/it-declaration-fields/${id}`);
            alert("Field deleted!");
            fetchFields(selectedCard.id);
        } catch (error) {
            alert("Failed to delete field");
        }
    };

    const openFieldConfig = (card) => {
        setSelectedCard(card);
        fetchFields(card.id);
        setView('fields');
    };

    const availableIcons = ['FiDollarSign', 'FiHome', 'FiFileText', 'FiPlusSquare', 'FiBriefcase', 'FiBarChart', 'FiUserCheck', 'FiFile', 'FiShield', 'FiHeart', 'FiBook', 'FiPieChart', 'FiLayers', 'FiTarget'];

    if (view === 'fields') {
        return (
            <div style={{ padding: '2rem' }}>
                <button onClick={() => setView('cards')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#00b3a4', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 'normal' }}>
                    Back to cards
                </button>

                <ToastNotification
                    isOpen={toast.open}
                    onClose={() => setToast({ ...toast, open: false })}
                    message={toast.message}
                    type={toast.type}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', width: '100%', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'normal', color: '#1F2937' }}>Field configuration: {selectedCard.title}</div>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#00B3A4' }}>Define the specific fields employees need to fill for this category.</p>
                    </div>
                    <button
                        onClick={() => {
                            const nextOrder = fields.length > 0
                                ? Math.max(...fields.map(f => f.displayOrder || 0)) + 1
                                : 1;

                            setEditingField(null);
                            setFieldFormData({
                                fieldId: '',
                                fieldLabel: '',
                                dataType: 'TEXT',
                                required: false,
                                validationRules: '',
                                dropdownOptions: '',
                                displayOrder: nextOrder,
                                maxLimit: ''
                            });
                            setIsFieldModalOpen(true);
                        }}
                        className="admin-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content', whiteSpace: 'nowrap', padding: '0.5rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#00B3A4', color: '#ffffff', fontWeight: 'normal' }}
                    >
                        Add field
                    </button>
                </div>

                <div className="admin-table-container" style={{ background: 'transparent', borderRadius: '0', border: 'none', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', color: '#1F2937', fontWeight: 'normal', borderBottom: '2px solid #e2e8f0' }}>Question?</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: '#1F2937', fontWeight: 'normal', borderBottom: '2px solid #e2e8f0' }}>Data type</th>
                                <th style={{ textAlign: 'center', padding: '1rem', color: '#1F2937', fontWeight: 'normal', borderBottom: '2px solid #e2e8f0' }}>Order</th>
                                <th style={{ textAlign: 'center', padding: '1rem', color: '#1F2937', fontWeight: 'normal', borderBottom: '2px solid #e2e8f0' }}>Max limit amount (₹)</th>
                                <th style={{ textAlign: 'right', padding: '1rem', color: '#1F2937', fontWeight: 'normal', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.map(field => (
                                <tr key={field.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'normal', color: '#1F2937' }}>{field.fieldLabel}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {field.fieldId}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.6rem', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem', color: '#1F2937' }}>{field.dataType.toLowerCase()}</span></td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: '#1F2937' }}>{field.displayOrder}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'normal', color: '#1F2937' }}>
                                        {field.maxLimit != null && Number(field.maxLimit) > 0
                                            ? `₹${Number(field.maxLimit).toLocaleString('en-IN')}`
                                            : '—'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button onClick={() => { setEditingField(field); setFieldFormData(field); setIsFieldModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#64748b', marginRight: '0.5rem', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleFieldDelete(field.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isFieldModalOpen && (
                    <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ fontSize: '1.25rem', color: '#1F2937', marginBottom: '1.5rem', fontWeight: 'normal' }}>{editingField ? 'Edit field' : 'Add new field'}</div>
                            <form onSubmit={handleFieldSubmit}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Question? (Label)</label>
                                        <input type="text" className="admin-input-field" value={fieldFormData.fieldLabel} onChange={(e) => setFieldFormData({ ...fieldFormData, fieldLabel: e.target.value })} required placeholder="e.g. LIC Premium Amount" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Data type</label>
                                            <select className="admin-input-field" value={fieldFormData.dataType} onChange={(e) => setFieldFormData({ ...fieldFormData, dataType: e.target.value })}>
                                                <option value="TEXT">Text</option>
                                                <option value="NUMBER">Number</option>
                                                <option value="DATE">Date</option>
                                                <option value="DROPDOWN">Dropdown</option>
                                                <option value="BOOLEAN">Checkbox</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Order</label>
                                            <input type="number" className="admin-input-field" value={fieldFormData.displayOrder} onChange={(e) => setFieldFormData({ ...fieldFormData, displayOrder: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </div>

                                    {fieldFormData.dataType === 'DROPDOWN' && (
                                        <div>
                                            <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Dropdown options (Comma separated)</label>
                                            <textarea className="admin-input-field" value={fieldFormData.dropdownOptions} onChange={(e) => setFieldFormData({ ...fieldFormData, dropdownOptions: e.target.value })} placeholder="Option 1, Option 2, Option 3" />
                                        </div>
                                    )}

                                    <div>
                                        <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Max limit amount (₹)</label>
                                        <input type="number" className="admin-input-field" value={fieldFormData.maxLimit} onChange={(e) => setFieldFormData({ ...fieldFormData, maxLimit: e.target.value })} placeholder="e.g. 150000" />
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>If set, employees will see this as the maximum allowable declaration.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" onClick={() => setIsFieldModalOpen(false)} className="admin-btn-secondary" style={{ fontWeight: 'normal' }}>Cancel</button>
                                    <button type="submit" className="admin-btn-primary" style={{ backgroundColor: '#00B3A4', color: '#ffffff', fontWeight: 'normal' }}>Save field</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', width: '100%', boxSizing: 'border-box' }}>
            <ToastNotification
                isOpen={toast.open}
                onClose={() => setToast({ ...toast, open: false })}
                message={toast.message}
                type={toast.type}
            />

            <div style={{ marginBottom: '2rem' }}>
                <div style={{ margin: 0, color: '#1F2937', fontSize: '1.75rem', fontWeight: 'normal' }}>It declaration configuration</div>
                <p style={{ margin: '0.25rem 0 1.5rem 0', color: '#00B3A4' }}>Configure submission windows and declaration categories.</p>


                <div className="it-declaration-tabs-container">
                    <button
                        onClick={() => setActiveTab('declarations')}
                        className={`it-declaration-tab-button ${activeTab === 'declarations' ? 'active' : ''}`}
                    >
                        Add declarations
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`it-declaration-tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                    >
                        Settings
                    </button>
                </div>
            </div>

            {activeTab === 'declarations' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', width: '100%', gap: '1rem', background: 'transparent', padding: '0', borderRadius: '0', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontWeight: 'normal', color: '#1F2937', fontSize: '0.9rem' }}>View configuration for:</label>
                            <select
                                value={cardYear}
                                onChange={(e) => setCardYear(e.target.value)}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'normal', color: '#1F2937', outline: 'none', cursor: 'pointer' }}
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => {
                                const nextOrder = cards.length > 0
                                    ? Math.max(...cards.map(c => c.displayOrder || 0)) + 1
                                    : 1;

                                setEditingCard(null);
                                setCardFormData({
                                    title: '',
                                    description: '',
                                    iconName: 'FiFileText',
                                    displayOrder: nextOrder,
                                    active: true,
                                    multipleAllowed: false,
                                    maxEntries: 1,
                                    sectionMaxLimit: ''
                                });
                                setIsCardModalOpen(true);
                            }}
                            className="admin-btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                width: 'fit-content',
                                whiteSpace: 'nowrap',
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.85rem',
                                backgroundColor: '#00B3A4',
                                color: '#ffffff',
                                fontWeight: 'normal'
                            }}
                        >
                            Add new category
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading categories...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {cards.map(card => (
                                <div key={card.id} style={{ background: 'transparent', padding: '0', borderRadius: '0', boxShadow: 'none', border: 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => openFieldConfig(card)} title="Set fields" style={{ background: '#e6f7f6', border: 'none', color: '#00b3a4', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'normal' }}>Configure fields</button>
                                            <button onClick={() => { setEditingCard(card); setCardFormData(card); setIsCardModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px' }}>Edit</button>
                                            <button onClick={() => handleCardDelete(card.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>Delete</button>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => openFieldConfig(card)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to configure fields"
                                    >
                                        <div style={{ margin: '1rem 0 0.5rem 0', color: '#1F2937', fontSize: '1.25rem', fontWeight: 'normal' }}>{card.title}</div>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{card.description}</p>
                                        {card.sectionMaxLimit > 0 && (
                                            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#e6f7f6', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#00b3a4', fontWeight: 'normal' }}>Section limit:</span>
                                                <span style={{ fontSize: '0.85rem', color: '#00b3a4', fontWeight: 'normal' }}>₹{Number(card.sectionMaxLimit).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8' }}>Order: {card.displayOrder}</span>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 'normal', background: card.active ? '#f0fdf4' : '#fef2f2', color: card.active ? '#16a34a' : '#dc2626' }}>
                                            {card.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="admin-settings-card animated-fade-in" style={{ background: 'transparent', padding: '0', borderRadius: '0', border: 'none', boxShadow: 'none', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', color: '#1F2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                            Submission window settings
                        </div>
                        <p style={{ color: '#00B3A4', fontSize: '0.9rem', marginTop: '0.5rem' }}>Define when employees can submit their declarations for the selected financial year.</p>
                    </div>



                        <form onSubmit={handleSettingsSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'normal', color: '#1F2937', fontSize: '0.85rem' }}>Financial year</label>
                                    <select
                                        className="admin-input-field"
                                        value={settingsYear}
                                        onChange={(e) => setSettingsYear(e.target.value)}
                                        style={{ background: '#f8fafc', fontWeight: 'normal' }}
                                    >
                                        {availableYears.map(fy => (
                                            <option key={fy} value={fy}>Financial year {fy}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'normal', color: '#1F2937', fontSize: '0.85rem' }}>Submission start date (From)</label>
                                    <SmartDatePicker
                                        value={settings.fromDate}
                                        onChange={(val) => setSettings({ ...settings, fromDate: val })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'normal', color: '#1F2937', fontSize: '0.85rem' }}>Submission end date (To)</label>
                                    <SmartDatePicker
                                        value={settings.toDate}
                                        onChange={(val) => setSettings({ ...settings, toDate: val })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    className="admin-btn-primary"
                                    disabled={isSavingSettings}
                                    style={{ padding: '0.75rem 2.5rem', minWidth: '150px', backgroundColor: '#00B3A4', color: '#ffffff', fontWeight: 'normal' }}
                                >
                                    {isSavingSettings ? 'Saving...' : 'Activate window'}
                                </button>
                            </div>
                        </form>
                    </div>
            )}

            {isCardModalOpen && (
                <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '500px' }}>
                        <div style={{ fontSize: '1.25rem', color: '#1F2937', marginBottom: '1.5rem', fontWeight: 'normal' }}>{editingCard ? 'Edit section' : 'Add section'}</div>
                        <form onSubmit={handleCardSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Title</label>
                                    <input type="text" className="admin-input-field" value={cardFormData.title} onChange={(e) => setCardFormData({ ...cardFormData, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Description</label>
                                    <textarea className="admin-input-field" value={cardFormData.description} onChange={(e) => setCardFormData({ ...cardFormData, description: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Icon</label>
                                        <select className="admin-input-field" value={cardFormData.iconName} onChange={(e) => setCardFormData({ ...cardFormData, iconName: e.target.value })}>
                                            {availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Order</label>
                                        <input type="number" className="admin-input-field" value={cardFormData.displayOrder} onChange={(e) => setCardFormData({ ...cardFormData, displayOrder: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={cardFormData.active} onChange={(e) => setCardFormData({ ...cardFormData, active: e.target.checked })} id="card-active" />
                                        <label htmlFor="card-active" style={{ color: '#1F2937', fontWeight: 'normal' }}>Active</label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={cardFormData.multipleAllowed} onChange={(e) => setCardFormData({ ...cardFormData, multipleAllowed: e.target.checked })} id="card-multiple" />
                                        <label htmlFor="card-multiple" style={{ color: '#1F2937', fontWeight: 'normal' }}>Allow multiple entries</label>
                                    </div>
                                </div>
                                {cardFormData.multipleAllowed && (
                                    <div>
                                        <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Maximum entries</label>
                                        <input type="number" className="admin-input-field" value={cardFormData.maxEntries} onChange={(e) => setCardFormData({ ...cardFormData, maxEntries: parseInt(e.target.value) || 1 })} min="1" />
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>Limit how many times an employee can repeat this section (e.g., 3).</p>
                                    </div>
                                )}
                                <div>
                                    <label className="admin-label" style={{ display: "block", marginBottom: "0.5rem", color: "#1F2937", fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", fontWeight: "normal" }}>Section max limit (₹)</label>
                                    <input type="number" className="admin-input-field" value={cardFormData.sectionMaxLimit} onChange={(e) => setCardFormData({ ...cardFormData, sectionMaxLimit: e.target.value })} placeholder="e.g. 150000" />
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>Total maximum amount allowed for this entire section (e.g., Section 80C limit is ₹1,50,000).</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setIsCardModalOpen(false)} className="admin-btn-secondary" style={{ fontWeight: 'normal' }}>Cancel</button>
                                <button type="submit" className="admin-btn-primary" style={{ backgroundColor: '#00B3A4', color: '#ffffff', fontWeight: 'normal' }}>Save category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCloneModalOpen && (
                <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '550px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'normal', color: '#1F2937' }}>Initialize financial year {cardYear}</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            We noticed there's no IT declaration configuration set up for this year. How would you like to build it?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={() => handleClone('existing')}
                                className="admin-btn-primary"
                                style={{ width: '100%', padding: '1rem', height: 'auto', textAlign: 'center', fontSize: '0.95rem', backgroundColor: '#00B3A4', color: '#ffffff', fontWeight: 'normal' }}
                            >
                                Continue with existing declaration questionnaire
                            </button>
                            <button
                                onClick={() => handleClone('new')}
                                className="admin-btn-secondary"
                                style={{ width: '100%', padding: '1rem', height: 'auto', textAlign: 'center', fontSize: '0.95rem', border: '1px solid #e2e8f0', fontWeight: 'normal' }}
                            >
                                Add new for existing questions?
                            </button>
                            <button
                                onClick={() => setIsCloneModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}
                            >
                                Not now, I'll configure manually
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminITDeclaration;
