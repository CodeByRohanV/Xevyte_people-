import React, { useState, useEffect } from 'react';
import api from '../../api';
import { FiActivity, FiTag, FiHash, FiTrash2, FiPlus, FiMoreVertical, FiEdit2, FiCheck, FiX, FiSave, FiMove } from 'react-icons/fi';
import ToastNotification from "../../components/ToastNotification";

const CATEGORIES = [
    {
        key: 'STATUS',
        label: 'Asset Statuses',
        icon: <FiActivity />,
        description: 'Status values shown in the Asset Status dropdown when registering assets.',
        color: '#14b8a6',
        bg: '#f0fdfa',
        border: '#ccfbf1'
    },
    {
        key: 'FIELD_TYPE',
        label: 'Field Data Types',
        icon: <FiHash />,
        description: 'Data types available when defining dynamic fields for a category.',
        color: '#14b8a6',
        bg: '#f0fdfa',
        border: '#ccfbf1'
    },
    {
        key: 'CONDITION',
        label: 'Asset Conditions',
        icon: <FiTag />,
        description: 'Condition values shown when registering a new asset.',
        color: '#14b8a6',
        bg: '#f0fdfa',
        border: '#ccfbf1'
    },
    {
        key: 'TEMPLATE_COLUMN',
        label: 'Asset Template Columns',
        icon: <FiPlus />,
        description: 'Additional dynamic columns to be included in the Bulk Import Excel template.',
        color: '#14b8a6',
        bg: '#f0fdfa',
        border: '#ccfbf1',
        span: 'span 2'
    }
];

const PREDEFINED_COLUMNS = [
    'Asset Tag',
    'Asset Model Name',
    'Category',
    'Sub-Category',
    'Configuration',
    'Serial Number',
    'Asset Status',
    'Condition',
    'Location',
    'Price',
    'Warranty End Date',
    'Assign to Employee'
];

const AssetDropdownManagement = () => {
    const token = sessionStorage.getItem('token');
    const [options, setOptions] = useState({ STATUS: [], FIELD_TYPE: [], CONDITION: [], TEMPLATE_COLUMN: [] });
    const [newValue, setNewValue] = useState({ STATUS: '', FIELD_TYPE: '', CONDITION: '', TEMPLATE_COLUMN: '' });
    const [newMandatory, setNewMandatory] = useState({ TEMPLATE_COLUMN: 'optional' }); // 'mandatory' or 'optional'
    const [selectedPredefined, setSelectedPredefined] = useState([]);

    const togglePredefinedSelection = (colName) => {
        setSelectedPredefined(prev => {
            if (prev.includes(colName)) {
                return prev.filter(c => c !== colName);
            } else {
                return [...prev, colName];
            }
        });
    };

    const handleAddSelectedPredefined = async () => {
        if (selectedPredefined.length === 0) return;
        setSavingKey('TEMPLATE_COLUMN');
        let successCount = 0;
        let failCount = 0;
        let newOptionsList = [...options.TEMPLATE_COLUMN];

        for (const colName of selectedPredefined) {
            const isDuplicate = options.TEMPLATE_COLUMN.some(opt =>
                opt.value.toLowerCase() === colName.trim().toLowerCase()
            );

            if (isDuplicate) {
                continue;
            }

            try {
                const payload = {
                    value: colName.trim(),
                    mandatory: false
                };

                const res = await api.post(
                    `/assets/options/TEMPLATE_COLUMN`,
                    JSON.stringify(payload),
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );

                newOptionsList.push(res.data);
                successCount++;
            } catch (err) {
                console.error(`Error adding predefined column ${colName}`, err);
                failCount++;
            }
        }

        setOptions(prev => ({ ...prev, TEMPLATE_COLUMN: newOptionsList }));
        setSelectedPredefined([]);
        setSavingKey(null);

        if (successCount > 0 && failCount === 0) {
            alert(`Successfully added ${successCount} predefined columns!`);
        } else if (successCount > 0 && failCount > 0) {
            alert(`Added ${successCount} columns successfully. Failed to add ${failCount} columns.`);
        } else if (failCount > 0) {
            alert(`Failed to add predefined columns.`);
        }
    };
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [savingKey, setSavingKey] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [updatingOrder, setUpdatingOrder] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [editingMandatory, setEditingMandatory] = useState(null); // { id: 'mandatory' | 'optional' }
    const [updatingValue, setUpdatingValue] = useState(false);
    const [editingOrder, setEditingOrder] = useState({});
    const [updatingOrderMap, setUpdatingOrderMap] = useState({});
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [bulkOrders, setBulkOrders] = useState({});
    const [savingBulkOrders, setSavingBulkOrders] = useState(false);

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
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statusRes, fieldRes, conditionRes, templateRes] = await Promise.all([
                api.get('/assets/options/STATUS?t=' + Date.now(), { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/assets/options/FIELD_TYPE?t=' + Date.now(), { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/assets/options/CONDITION?t=' + Date.now(), { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/assets/options/TEMPLATE_COLUMN?t=' + Date.now(), { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setOptions({
                STATUS: statusRes.data,
                FIELD_TYPE: fieldRes.data,
                CONDITION: conditionRes.data,
                TEMPLATE_COLUMN: templateRes.data
            });
        } catch (err) {
            console.error('Error fetching dropdown options', err);
            alert('Error fetching dropdown options');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (type) => {
        const val = newValue[type]?.trim();
        if (!val) return;
        const cleanValue = type === 'STATUS' ? val.toUpperCase().replace(/\s+/g, '_') : val;

        // Frontend duplicate check
        const isDuplicate = options[type].some(opt => 
            opt.value.toLowerCase() === (type === 'STATUS' ? cleanValue.toLowerCase() : val.toLowerCase())
        );

        if (isDuplicate) {
            alert("This option already exists.");
            return;
        }

        setSavingKey(type);
        try {
            let payload;
            if (type === 'TEMPLATE_COLUMN') {
                // For template columns, include mandatory field
                payload = {
                    value: cleanValue,
                    mandatory: newMandatory[type] === 'mandatory' ? true : false
                };
            } else {
                // For other types, send just the value (backward compatibility)
                payload = cleanValue;
            }
            
            const res = await api.post(
                `/assets/options/${type}`,
                JSON.stringify(payload),
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setOptions(prev => ({ ...prev, [type]: [...prev[type], res.data] }));
            setNewValue(prev => ({ ...prev, [type]: '' }));
            if (type === 'TEMPLATE_COLUMN') {
                setNewMandatory(prev => ({ ...prev, [type]: 'optional' }));
            }
            alert(`${type} option added successfully!`);
        } catch (err) {
            alert(err.response?.data?.message || `Error adding ${type} option`);
        } finally {
            setSavingKey(null);
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('Delete this option?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/assets/options/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setOptions(prev => ({ ...prev, [type]: prev[type].filter(o => o.id !== id) }));
            alert('Option deleted successfully!');
        } catch (err) {
            alert('Error deleting option');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, dropItem) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === dropItem.id) return;

        setUpdatingOrder(true);
        try {
            // Calculate new sort orders
            const templateColumns = [...options.TEMPLATE_COLUMN];
            const draggedIndex = templateColumns.findIndex(item => item.id === draggedItem.id);
            const dropIndex = templateColumns.findIndex(item => item.id === dropItem.id);

            // Reorder array
            const [removed] = templateColumns.splice(draggedIndex, 1);
            templateColumns.splice(dropIndex, 0, removed);

            // Update sort orders and send to backend
            const updatedColumns = templateColumns.map((item, index) => ({
                ...item,
                sortOrder: index + 1
            }));

            // Update backend with new sort orders
            await Promise.all(
                updatedColumns.map(column =>
                    api.put(`/assets/options/${column.id}`, {
                        type: column.type,
                        value: column.value,
                        sortOrder: column.sortOrder,
                        mandatory: column.mandatory
                    }, { headers: { Authorization: `Bearer ${token}` } })
                )
            );

            // Update local state
            setOptions(prev => ({ ...prev, TEMPLATE_COLUMN: updatedColumns }));
            alert('Sort order updated successfully!');
        } catch (err) {
            console.error('Error updating sort order:', err);
            alert('Error updating sort order');
            // Refresh to restore original order
            fetchAll();
        } finally {
            setUpdatingOrder(false);
            setDraggedItem(null);
        }
    };

    const handleEdit = (opt) => {
        setEditingId(opt.id);
        setEditingValue(opt.value);
        // Set the current mandatory status
        const mandatoryStatus = opt.mandatory === true ? 'mandatory' : 'optional';
        setEditingMandatory({ [opt.id]: mandatoryStatus });
    };

    const handleSaveEdit = async (opt) => {
        const val = editingValue.trim();
        if (!val) {
            alert('Value cannot be empty');
            return;
        }

        // Frontend duplicate check
        const isDuplicate = options[opt.type].some(item => 
            item.id !== opt.id && item.value.toLowerCase() === val.toLowerCase()
        );

        if (isDuplicate) {
            alert("This option already exists.");
            return;
        }

        setUpdatingValue(true);
        try {
            // Determine mandatory value based on editing state
            const mandatoryValue = editingMandatory?.[opt.id] === 'mandatory' ? true : false;
            
            const payload = {
                type: opt.type,
                value: editingValue.trim(),
                sortOrder: opt.sortOrder,
                mandatory: mandatoryValue
            };

            const updatedOption = await api.put(`/assets/options/${opt.id}`, payload, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            // Update local state
            setOptions(prev => ({
                ...prev,
                [opt.type]: prev[opt.type].map(item =>
                    item.id === opt.id ? { ...item, value: editingValue.trim(), mandatory: mandatoryValue } : item
                )
            }));

            setEditingId(null);
            setEditingValue('');
            setEditingMandatory(null);
            alert('Option updated successfully!');
        } catch (err) {
            console.error('Error updating option:', err);
            alert('Error updating option');
        } finally {
            setUpdatingValue(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingValue('');
        setEditingMandatory(null);
    };

    const handleOrderChange = (id, newOrder) => {
        setEditingOrder(prev => ({
            ...prev,
            [id]: newOrder
        }));
    };

    const handleUpdateOrder = async (opt) => {
        const newOrder = parseInt(editingOrder[opt.id]);
        if (isNaN(newOrder) || newOrder < 1) {
            alert('Please enter a valid order number (1 or greater)');
            return;
        }

        setUpdatingOrderMap(prev => ({ ...prev, [opt.id]: true }));
        try {
            await api.put(`/assets/options/${opt.id}`, {
                type: opt.type,
                value: opt.value,
                sortOrder: newOrder,
                mandatory: opt.mandatory
            }, { headers: { Authorization: `Bearer ${token}` } });

            // Refresh the data to get the updated order
            await fetchAll();

            // Clear the editing state for this item
            setEditingOrder(prev => {
                const newEditingOrder = { ...prev };
                delete newEditingOrder[opt.id];
                return newEditingOrder;
            });
            alert('Order updated successfully!');
        } catch (err) {
            console.error('Error updating order:', err);
            alert('Error updating order');
        } finally {
            setUpdatingOrderMap(prev => {
                const newUpdatingOrderMap = { ...prev };
                delete newUpdatingOrderMap[opt.id];
                return newUpdatingOrderMap;
            });
        }
    };

    const handleCancelOrderEdit = (id) => {
        setEditingOrder(prev => {
            const newEditingOrder = { ...prev };
            delete newEditingOrder[id];
            return newEditingOrder;
        });
    };

    const handleBulkOrderEdit = () => {
        setBulkEditMode(true);
        const initialOrders = {};
        options.TEMPLATE_COLUMN.forEach((item, index) => {
            initialOrders[item.id] = item.sortOrder || index + 1;
        });
        setBulkOrders(initialOrders);
    };

    const handleBulkOrderChange = (id, value) => {
        setBulkOrders(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSaveBulkOrders = async () => {
        setSavingBulkOrders(true);
        try {
            console.log('Saving bulk orders with data:', bulkOrders);
            console.log('Current options.TEMPLATE_COLUMN:', options.TEMPLATE_COLUMN);
            
            // Validate all orders
            const orders = Object.entries(bulkOrders);
            for (const [id, order] of orders) {
                const numOrder = parseInt(order);
                if (isNaN(numOrder) || numOrder < 1) {
                    alert('Please enter valid order numbers (1 or greater) for all items');
                    return;
                }
            }

            // Update all orders
            await Promise.all(
                orders.map(([id, order]) => {
                    const numericId = parseInt(id);
                    const item = options.TEMPLATE_COLUMN.find(opt => opt.id === numericId);
                    console.log(`Updating item ID ${numericId} with order ${order}, found item:`, item);
                    if (!item) {
                        throw new Error(`Item with ID ${id} not found in template columns`);
                    }
                    return api.put(`/assets/options/${numericId}`, {
                        type: item.type,
                        value: item.value,
                        sortOrder: parseInt(order),
                        mandatory: item.mandatory
                    }, { headers: { Authorization: `Bearer ${token}` } });
                })
            );

            console.log('All updates completed, refreshing data...');
            // Refresh data
            await fetchAll();
            setBulkEditMode(false);
            setBulkOrders({});
        } catch (err) {
            console.error('Error saving bulk orders:', err);
            alert('Error saving orders: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingBulkOrders(false);
        }
    };

    const handleCancelBulkEdit = () => {
        setBulkEditMode(false);
        setBulkOrders({});
    };

    return (
        <div style={{ padding: '0px' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {CATEGORIES.map(cat => (
                        <div key={cat.key} style={{
                            background: 'white',
                            borderRadius: '16px',
                            border: `1px solid ${cat.border}`,
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            gridColumn: cat.span || 'auto'
                        }}>
                            {/* Card Header */}
                            <div style={{
                                background: cat.bg,
                                padding: '18px 20px',
                                borderBottom: `1px solid ${cat.border}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '1.25rem', display: 'flex', color: cat.color }}>{cat.icon}</span>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: cat.color }}>{cat.label}</h4>
                                    <span style={{
                                        marginLeft: 'auto',
                                        background: cat.color,
                                        color: 'white',
                                        borderRadius: '20px',
                                        padding: '2px 10px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700'
                                    }}>
                                        {options[cat.key].length}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{cat.description}</p>
                            </div>

                            {/* Add Input */}
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid #f1f5f9` }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder={`e.g. ${cat.key === 'STATUS' ? 'AVAILABLE' : cat.key === 'FIELD_TYPE' ? 'TEXT' : cat.key === 'TEMPLATE_COLUMN' ? 'Warranty' : 'Excellent'}`}
                                            value={newValue[cat.key]}
                                            onChange={e => setNewValue(prev => ({ ...prev, [cat.key]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleAdd(cat.key)}
                                            style={{
                                                padding: '8px 12px',
                                                border: `1px solid ${cat.border}`,
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                outline: 'none',
                                                background: '#fafafa'
                                            }}
                                        />
                                        {/* Field requirement options for Template Columns */}
                                        {cat.key === 'TEMPLATE_COLUMN' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
                                                <label style={{
                                                    fontSize: '0.8rem',
                                                    color: '#64748b',
                                                    fontWeight: '600',
                                                    marginBottom: '4px'
                                                }}>
                                                    Field Requirement:
                                                </label>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <input
                                                            type="radio"
                                                            id="mandatory-template"
                                                            name={`requirement-${cat.key}`}
                                                            checked={newMandatory[cat.key] === 'mandatory'}
                                                            onChange={() => setNewMandatory(prev => ({ ...prev, [cat.key]: 'mandatory' }))}
                                                            style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                accentColor: cat.color
                                                            }}
                                                        />
                                                        <label htmlFor="mandatory-template" style={{
                                                            fontSize: '0.8rem',
                                                            color: '#64748b',
                                                            cursor: 'pointer',
                                                            userSelect: 'none'
                                                        }}>
                                                            Mandatory
                                                        </label>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <input
                                                            type="radio"
                                                            id="optional-template"
                                                            name={`requirement-${cat.key}`}
                                                            checked={newMandatory[cat.key] === 'optional'}
                                                            onChange={() => setNewMandatory(prev => ({ ...prev, [cat.key]: 'optional' }))}
                                                            style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                accentColor: cat.color
                                                            }}
                                                        />
                                                        <label htmlFor="optional-template" style={{
                                                            fontSize: '0.8rem',
                                                            color: '#64748b',
                                                            cursor: 'pointer',
                                                            userSelect: 'none'
                                                        }}>
                                                            Optional
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Predefined Suggestions */}
                                        {cat.key === 'TEMPLATE_COLUMN' && (
                                            <div style={{ marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <label style={{
                                                        fontSize: '0.8rem',
                                                        color: '#475569',
                                                        fontWeight: '600'
                                                    }}>
                                                        Predefined suggestions (click to select):
                                                    </label>
                                                    {selectedPredefined.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleAddSelectedPredefined}
                                                            disabled={savingKey === 'TEMPLATE_COLUMN'}
                                                            style={{
                                                                background: '#14b8a6',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                cursor: savingKey === 'TEMPLATE_COLUMN' ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                boxShadow: '0 2px 4px rgba(20,184,166,0.2)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <FiPlus /> Add Selected ({selectedPredefined.length})
                                                        </button>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {PREDEFINED_COLUMNS.map(col => {
                                                        const isAdded = options.TEMPLATE_COLUMN.some(
                                                            opt => opt.value.trim().toLowerCase() === col.trim().toLowerCase()
                                                        );
                                                        const isSelected = selectedPredefined.includes(col);
                                                        return (
                                                            <button
                                                                key={col}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isAdded) return;
                                                                    togglePredefinedSelection(col);
                                                                }}
                                                                disabled={isAdded}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '500',
                                                                    border: isAdded
                                                                        ? '1px solid #e2e8f0'
                                                                        : isSelected
                                                                            ? '1px solid #14b8a6'
                                                                            : '1px solid #cbd5e1',
                                                                    background: isAdded
                                                                        ? '#f1f5f9'
                                                                        : isSelected
                                                                            ? '#14b8a6'
                                                                            : 'white',
                                                                    color: isAdded
                                                                        ? '#94a3b8'
                                                                        : isSelected
                                                                            ? 'white'
                                                                            : '#475569',
                                                                    cursor: isAdded ? 'not-allowed' : 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    boxShadow: isSelected ? '0 2px 4px rgba(20,184,166,0.15)' : 'none'
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    if (!isAdded && !isSelected) {
                                                                        e.currentTarget.style.borderColor = '#14b8a6';
                                                                        e.currentTarget.style.color = '#14b8a6';
                                                                        e.currentTarget.style.background = '#f0fdfa';
                                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                                    }
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    if (!isAdded && !isSelected) {
                                                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                                                        e.currentTarget.style.color = '#475569';
                                                                        e.currentTarget.style.background = 'white';
                                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                                    }
                                                                }}
                                                            >
                                                                {isAdded ? (
                                                                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>✓</span>
                                                                ) : isSelected ? (
                                                                    <span style={{ color: 'white', fontWeight: 'bold' }}>✓</span>
                                                                ) : null}
                                                                {col}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleAdd(cat.key)}
                                        disabled={savingKey === cat.key || !newValue[cat.key]?.trim()}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: savingKey === cat.key ? '#e2e8f0' : cat.color,
                                            color: savingKey === cat.key ? '#94a3b8' : 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            cursor: (savingKey === cat.key || !newValue[cat.key]?.trim()) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {savingKey === cat.key ? 'Adding...' : <><FiPlus /> Add</>}
                                    </button>
                                </div>
                            </div>

                            {/* Options List */}
                            <div style={{ padding: '12px 20px', maxHeight: '320px', overflowY: 'auto' }}>
                                {options[cat.key].length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '28px 0',
                                        color: '#cbd5e1',
                                        fontSize: '0.85rem'
                                    }}>
                                        No options added yet.<br />
                                        <span style={{ fontSize: '0.78rem' }}>Use the input above to add your first one.</span>
                                    </div>
                                ) : cat.key === 'TEMPLATE_COLUMN' ? (
                                    <div className="template-columns-manager">
                                        {/* Bulk Order Controls */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '16px',
                                            padding: '12px',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FiMove style={{ color: '#14b8a6' }} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                                    Order Management
                                                </span>
                                            </div>
                                            {!bulkEditMode ? (
                                                <button
                                                    onClick={handleBulkOrderEdit}
                                                    disabled={updatingOrder || updatingValue}
                                                    style={{
                                                        background: '#14b8a6',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500',
                                                        cursor: updatingOrder || updatingValue ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <FiEdit2 style={{ fontSize: '0.8rem' }} />
                                                    Edit Orders
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={handleSaveBulkOrders}
                                                        disabled={savingBulkOrders}
                                                        style={{
                                                            background: savingBulkOrders ? '#e2e8f0' : '#10b981',
                                                            color: savingBulkOrders ? '#94a3b8' : 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500',
                                                            cursor: savingBulkOrders ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <FiSave style={{ fontSize: '0.8rem' }} />
                                                        {savingBulkOrders ? 'Saving...' : 'Save All'}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelBulkEdit}
                                                        disabled={savingBulkOrders}
                                                        style={{
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500',
                                                            cursor: savingBulkOrders ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Template Columns List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {options.TEMPLATE_COLUMN.map((opt, index) => (
                                                <div
                                                    key={opt.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '12px',
                                                        background: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease',
                                                        cursor: bulkEditMode ? 'default' : 'move'
                                                    }}
                                                    draggable={!bulkEditMode}
                                                    onDragStart={(e) => !bulkEditMode && handleDragStart(e, opt)}
                                                    onDragOver={!bulkEditMode ? handleDragOver : undefined}
                                                    onDrop={(e) => !bulkEditMode && handleDrop(e, opt)}
                                                >
                                                    {/* Drag Handle */}
                                                    {!bulkEditMode && (
                                                        <div style={{
                                                            marginRight: '12px',
                                                            color: '#cbd5e1',
                                                            cursor: 'move',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}>
                                                            <FiMoreVertical />
                                                        </div>
                                                    )}

                                                    {/* Order Number */}
                                                    <div style={{
                                                        width: '60px',
                                                        marginRight: '12px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        color: '#64748b'
                                                    }}>
                                                        {bulkEditMode ? (
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={bulkOrders[opt.id] || ''}
                                                                onChange={(e) => handleBulkOrderChange(opt.id, e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                                                                }}
                                                                onWheel={(e) => e.target.blur()}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '4px 6px',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    textAlign: 'center',
                                                                    background: 'white'
                                                                }}
                                                            />
                                                        ) : (
                                                            `#${opt.sortOrder || index + 1}`
                                                        )}
                                                    </div>

                                                    {/* Column Name */}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                                        {editingId === opt.id ? (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    value={editingValue}
                                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveEdit(opt);
                                                                        if (e.key === 'Escape') handleCancelEdit();
                                                                    }}
                                                                    autoFocus
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '6px 8px',
                                                                        border: '1px solid #14b8a6',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.85rem',
                                                                        outline: 'none',
                                                                        background: 'white'
                                                                    }}
                                                                />
                                                                {/* Mandatory/Optional radio buttons for editing */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0' }}>
                                                                    <label style={{
                                                                        fontSize: '0.75rem',
                                                                        color: '#64748b',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        Field Requirement:
                                                                    </label>
                                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                            <input
                                                                                type="radio"
                                                                                id={`edit-mandatory-${opt.id}`}
                                                                                name={`edit-requirement-${opt.id}`}
                                                                                checked={editingMandatory?.[opt.id] === 'mandatory'}
                                                                                onChange={() => setEditingMandatory(prev => ({ ...prev, [opt.id]: 'mandatory' }))}
                                                                                style={{
                                                                                    width: '14px',
                                                                                    height: '14px',
                                                                                    accentColor: cat.color
                                                                                }}
                                                                            />
                                                                            <label htmlFor={`edit-mandatory-${opt.id}`} style={{
                                                                                fontSize: '0.75rem',
                                                                                color: '#64748b',
                                                                                cursor: 'pointer',
                                                                                userSelect: 'none'
                                                                            }}>
                                                                                Mandatory
                                                                            </label>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                            <input
                                                                                type="radio"
                                                                                id={`edit-optional-${opt.id}`}
                                                                                name={`edit-requirement-${opt.id}`}
                                                                                checked={editingMandatory?.[opt.id] === 'optional'}
                                                                                onChange={() => setEditingMandatory(prev => ({ ...prev, [opt.id]: 'optional' }))}
                                                                                style={{
                                                                                    width: '14px',
                                                                                    height: '14px',
                                                                                    accentColor: cat.color
                                                                                }}
                                                                            />
                                                                            <label htmlFor={`edit-optional-${opt.id}`} style={{
                                                                                fontSize: '0.75rem',
                                                                                color: '#64748b',
                                                                                cursor: 'pointer',
                                                                                userSelect: 'none'
                                                                            }}>
                                                                                Optional
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span style={{
                                                                    fontSize: '0.9rem',
                                                                    color: '#334155',
                                                                    fontWeight: '500'
                                                                }}>
                                                                    {opt.value}
                                                                </span>
                                                                {/* Mandatory/Optional indicator */}
                                                                {opt.mandatory === true && (
                                                                    <span style={{
                                                                        background: '#ef4444',
                                                                        color: 'white',
                                                                        borderRadius: '12px',
                                                                        padding: '2px 8px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '600',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center'
                                                                    }}>
                                                                        Required
                                                                    </span>
                                                                )}
                                                                {opt.mandatory === false && (
                                                                    <span style={{
                                                                        background: '#3b82f6',
                                                                        color: 'white',
                                                                        borderRadius: '12px',
                                                                        padding: '2px 8px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '600',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center'
                                                                    }}>
                                                                        Optional
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                                                        {editingId === opt.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleSaveEdit(opt)}
                                                                    disabled={updatingValue}
                                                                    style={{
                                                                        background: updatingValue ? '#e2e8f0' : '#10b981',
                                                                        border: 'none',
                                                                        color: updatingValue ? '#94a3b8' : 'white',
                                                                        cursor: updatingValue ? 'not-allowed' : 'pointer',
                                                                        padding: '4px 6px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    title="Save"
                                                                >
                                                                    <FiCheck />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    disabled={updatingValue}
                                                                    style={{
                                                                        background: '#ef4444',
                                                                        border: 'none',
                                                                        color: 'white',
                                                                        cursor: updatingValue ? 'not-allowed' : 'pointer',
                                                                        padding: '4px 6px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    title="Cancel"
                                                                >
                                                                    <FiX />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(opt)}
                                                                    disabled={bulkEditMode || updatingOrder || updatingValue}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: bulkEditMode || updatingOrder || updatingValue ? '#cbd5e1' : '#3b82f6',
                                                                        cursor: bulkEditMode || updatingOrder || updatingValue ? 'not-allowed' : 'pointer',
                                                                        padding: '4px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.9rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    title="Edit name"
                                                                >
                                                                    <FiEdit2 />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(cat.key, opt.id)}
                                                                    disabled={bulkEditMode || deletingId === opt.id || updatingOrder || updatingValue}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: bulkEditMode || deletingId === opt.id || updatingOrder || updatingValue ? '#cbd5e1' : '#ef4444',
                                                                        cursor: bulkEditMode || deletingId === opt.id || updatingOrder || updatingValue ? 'not-allowed' : 'pointer',
                                                                        padding: '4px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.9rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Other categories (STATUS, FIELD_TYPE, CONDITION) - keep original table format */
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {options[cat.key].map((opt, index) => (
                                                <tr key={opt.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                    <td style={{ padding: '8px 4px', fontWeight: '500', color: '#334155' }}>
                                                        <span style={{
                                                            fontSize: '0.8rem',
                                                            padding: cat.key === 'STATUS' ? '4px 12px' : '0',
                                                            background: cat.key === 'STATUS' ? cat.color : 'transparent',
                                                            color: cat.key === 'STATUS' ? 'white' : 'inherit',
                                                            borderRadius: cat.key === 'STATUS' ? '12px' : '0'
                                                        }}>
                                                            {opt.value}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleDelete(cat.key, opt.id)}
                                                            disabled={deletingId === opt.id}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: deletingId === opt.id ? '#cbd5e1' : '#f87171',
                                                                cursor: deletingId === opt.id ? 'not-allowed' : 'pointer',
                                                                padding: '4px',
                                                                borderRadius: '4px',
                                                                fontSize: '1rem',
                                                                lineHeight: 1
                                                            }}
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* Help Text */}
                                {cat.key === 'TEMPLATE_COLUMN' && options[cat.key].length > 0 && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px',
                                        background: '#f0fdfa',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        color: '#059669',
                                        border: '1px solid #a7f3d0'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '1rem' }}>💡</span>
                                            <strong>Quick Tips:</strong>
                                        </div>
                                        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '0.8rem' }}>
                                            <li>Drag and drop columns to reorder them</li>
                                            <li>Click "Edit Orders" to modify multiple positions at once</li>
                                            <li>Click the edit icon to rename column names and change requirement status</li>
                                            <li>Set fields as Mandatory or Optional when creating</li>
                                            <li>Change existing fields between Mandatory and Optional using the edit function</li>
                                            <li>Mandatory fields must be filled during asset registration</li>
                                            <li>Optional fields can be left empty during asset registration</li>
                                            <li>Changes are automatically saved and reflected in Excel templates</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
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

export default AssetDropdownManagement;
