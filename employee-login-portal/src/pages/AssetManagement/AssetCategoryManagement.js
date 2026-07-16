import React, { useState, useEffect } from 'react';
import api from "../../api";
import ToastNotification from "../../components/ToastNotification";

const AssetCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const token = sessionStorage.getItem("token");

    const [customDropdownTypes, setCustomDropdownTypes] = useState([]);
    const [FIELD_TYPES, setFieldTypes] = useState([]);

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

    // State for categories to create/edit
    const [categoriesToCreate, setCategoriesToCreate] = useState([
        { name: '', active: true, fieldConfigs: [], parentCategory: null, subCategories: [] }
    ]);


    useEffect(() => {
        fetchCategories();
        fetchCustomTypes();
    }, []);

    const fetchCustomTypes = async () => {
        if (!token) return;
        try {
            const response = await api.get('/assets/options/FIELD_TYPE', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = Array.isArray(response.data) ? response.data : [];
            const typesFromDb = data.map(opt => opt.value);
            setFieldTypes(typesFromDb);
        } catch (error) {
            console.error("Error fetching custom types", error);
            setFieldTypes([]);
        }
    };

    useEffect(() => {
        if (showModal) {
            fetchCategories(); // Refresh categories when modal opens
        }
    }, [showModal]);

    const fetchCategories = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get('/assets/categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Categories fetched (raw):', response.data);
            const data = Array.isArray(response.data) ? response.data : (response.data?.content || []);
            console.log('Categories prepared for state:', data);
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories", error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (index, field, value) => {
        console.log('Category change:', index, field, value);
        const updated = [...categoriesToCreate];
        if (field === 'parentCategory') {
            updated[index][field] = value ? { id: parseInt(value) } : null;
        } else {
            updated[index][field] = value;
        }
        setCategoriesToCreate(updated);
    };

    const handleAddField = (catIdx) => {
        const updated = [...categoriesToCreate];
        updated[catIdx].fieldConfigs.push({
            fieldName: '',
            fieldType: '',
            mandatory: false,
            uniqueField: false,
            active: true
        });
        setCategoriesToCreate(updated);
    };

    const handleAddSubCategory = (catIdx) => {
        const updated = [...categoriesToCreate];
        if (!updated[catIdx].subCategories) {
            updated[catIdx].subCategories = [];
        }
        updated[catIdx].subCategories.push('');
        setCategoriesToCreate(updated);
    };

    const handleRemoveSubCategory = (catIdx, subIdx) => {
        const updated = [...categoriesToCreate];
        updated[catIdx].subCategories.splice(subIdx, 1);
        setCategoriesToCreate(updated);
    };

    const handleSubCategoryChange = (catIdx, subIdx, value) => {
        const updated = [...categoriesToCreate];
        updated[catIdx].subCategories[subIdx] = value;
        setCategoriesToCreate(updated);
    };

    const handleRemoveField = (catIdx, fieldIdx) => {
        const updated = [...categoriesToCreate];
        updated[catIdx].fieldConfigs.splice(fieldIdx, 1);
        setCategoriesToCreate(updated);
    };

    const handleFieldChange = (catIdx, fieldIdx, prop, value) => {
        const updated = [...categoriesToCreate];
        updated[catIdx].fieldConfigs[fieldIdx][prop] = value;
        setCategoriesToCreate(updated);
    };

    const handleAddClick = () => {
        setIsEditMode(false);
        setIsViewMode(false);
        setCategoriesToCreate([{
            name: '',
            active: true,
            fieldConfigs: [],
            parentCategory: null,
            subCategories: [] // Initialize subCategories array
        }]);
        setShowModal(true);
    };

    const handleViewClick = (cat) => {
        setIsEditMode(false);
        setIsViewMode(true);
        // Find existing sub-categories from the main list
        const existingSubs = categories
            .filter(c => c.parentCategory && c.parentCategory.id === cat.id)
            .map(c => c.name);

        setCategoriesToCreate([{
            ...cat,
            parentCategory: cat.parentCategory ? { id: cat.parentCategory.id } : null,
            fieldConfigs: cat.fieldConfigs ? cat.fieldConfigs.map(f => ({ ...f })) : [],
            subCategories: existingSubs
        }]);
        setShowModal(true);
    };

    const handleAddSubClick = (parent) => {
        console.log('Adding subcategory to parent:', parent);
        setIsEditMode(false);
        setCategoriesToCreate([{
            name: '',
            active: true,
            fieldConfigs: [],
            parentCategory: { id: parent.id },
            subCategories: []
        }]);
        setShowModal(true);
    };

    const handleEditClick = (cat) => {
        setIsEditMode(true);
        setIsViewMode(false);
        // Find existing sub-categories from the main list
        const existingSubs = categories
            .filter(c => c.parentCategory && c.parentCategory.id === cat.id)
            .map(c => c.name);

        // Map category to state, ensuring all properties are present
        setCategoriesToCreate([{
            ...cat,
            parentCategory: cat.parentCategory ? { id: cat.parentCategory.id } : null,
            fieldConfigs: cat.fieldConfigs ? cat.fieldConfigs.map(f => ({ ...f })) : [],
            subCategories: existingSubs
        }]);
        setShowModal(true);
    };

    const handleSaveAll = async () => {
        const mainCategory = categoriesToCreate[0];
        if (!mainCategory.name.trim()) {
            alert("Please provide a category name.");
            return;
        }

        // Validate subcategories
        if (mainCategory.subCategories) {
            const subNames = new Set();
            for (let i = 0; i < mainCategory.subCategories.length; i++) {
                const subName = mainCategory.subCategories[i].trim();
                if (!subName) {
                    alert(`Please provide a name for subcategory ${i + 1}.`);
                    return;
                }
                if (subNames.has(subName.toLowerCase())) {
                    alert(`Duplicate subcategory name entered: ${subName}`);
                    return;
                }
                // Global existence check for subcategories
                const existsGlobally = categories.find(c => c.name.toLowerCase() === subName.toLowerCase());
                const isExistingChild = existsGlobally && existsGlobally.parentCategory && mainCategory.id && existsGlobally.parentCategory.id === mainCategory.id;
                
                if (existsGlobally && !isExistingChild) {
                    alert(`Category "${subName}" already exists.`);
                    return;
                }
                subNames.add(subName.toLowerCase());
            }
        }

        // Check for duplicate root category name
        const isDuplicateRoot = categories.some(c => 
            c.id !== mainCategory.id && 
            c.name.toLowerCase() === mainCategory.name.trim().toLowerCase()
        );

        if (isDuplicateRoot) {
            alert("A category with this name already exists.");
            return;
        }

        try {
            setLoading(true);

            // Separate sub-category names from the main payload to avoid JSON parse errors
            // as the backend expects a list of AssetCategory objects, not Strings.
            const payload = { ...mainCategory };
            const subCategoryNames = payload.subCategories || [];
            delete payload.subCategories;

            if (isEditMode) {
                // 1. Update main category (handles fields and name changes)
                await api.put(`/assets/categories/${mainCategory.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // 2. Identify and create ONLY new subcategories
                // Get all existing categories to check for global name conflicts and current children
                const currentSubs = categories
                    .filter(c => c.parentCategory && c.parentCategory.id === mainCategory.id)
                    .map(c => c.name.toLowerCase());

                for (const subName of subCategoryNames) {
                    const cleanName = subName.trim();
                    if (!cleanName) continue;

                    // Skip if already a subcategory of this parent
                    if (currentSubs.includes(cleanName.toLowerCase())) {
                        console.log(`Skipping existing subcategory: ${cleanName}`);
                        continue;
                    }

                    // Check if category exists elsewhere in system (since name is globally unique)
                    const existsGlobally = categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase());
                    if (existsGlobally) {
                        console.warn(`Category ${cleanName} already exists elsewhere. Skipping auto-create.`);
                        continue;
                    }

                    const subCategoryWithParent = {
                        name: cleanName,
                        active: true,
                        fieldConfigs: [],
                        parentCategory: { id: mainCategory.id }
                    };
                    await api.post('/assets/categories', subCategoryWithParent, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } else {
                // 1. Create main category first
                // Check if root category already exists
                const rootExists = categories.find(c => !c.parentCategory && c.name.toLowerCase() === mainCategory.name.trim().toLowerCase());

                let mainCatId;
                if (rootExists) {
                    mainCatId = rootExists.id;
                    // If it exists, maybe update it? For now, we use existing
                } else {
                    const createdMainCategory = await api.post('/assets/categories', payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    mainCatId = createdMainCategory.data.id;
                }

                // 2. Create subcategories
                for (const subName of subCategoryNames) {
                    const cleanName = subName.trim();
                    if (!cleanName) continue;

                    // Check global existence
                    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) continue;

                    const subCategoryWithParent = {
                        name: cleanName,
                        active: true,
                        fieldConfigs: [],
                        parentCategory: { id: mainCatId }
                    };
                    await api.post('/assets/categories', subCategoryWithParent, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            setShowModal(false);
            alert("Category saved successfully!");
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert(error.response?.data?.message || "Error saving category");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (cat) => {
        try {
            await api.put(`/assets/categories/${cat.id}`, { ...cat, active: !cat.active }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCategories();
        } catch (error) {
            alert("Error updating status");
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category? All associated assets will also be deleted.")) return;
        try {
            await api.delete(`/assets/categories/${id}?userId=ADMIN`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCategories();
        } catch (error) {
            const msg = error.response?.data || "Error deleting category";
            alert(msg);
        }
    };

    const renderCategoryRows = () => {
        if (!Array.isArray(categories)) {
            console.warn('renderCategoryRows: categories is not an array', categories);
            return null;
        }

        const rootCategories = categories.filter(cat => {
            const isRoot = !cat.parentCategory ||
                cat.parentCategory === null ||
                (typeof cat.parentCategory === 'object' && Object.keys(cat.parentCategory).length === 0);
            return isRoot;
        });

        console.log('Rendering root categories:', rootCategories.length, 'out of', categories.length);

        if (rootCategories.length === 0 && categories.length > 0) {
            console.warn('All categories were filtered out. Check parentCategory values:', categories.map(c => ({ id: c.id, name: c.name, parent: c.parentCategory })));
        }

        return rootCategories.map(cat => (
            <tr key={cat.id} className="root-category-row">
                <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{cat.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ID: #{cat.id}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <button
                        onClick={() => !isViewMode && toggleStatus(cat)}
                        className={`status-pill ${cat.active ? 'active' : 'inactive'}`}
                        disabled={isViewMode}
                        style={{ cursor: isViewMode ? 'default' : 'pointer' }}
                    >
                        {cat.active ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-btn-view" title="View Details" onClick={() => handleViewClick(cat)}>
                            <i className="bi bi-eye"></i>
                        </button>
                        <button className="icon-btn-edit" title="Edit Category" onClick={() => handleEditClick(cat)}>
                            <i className="bi bi-pencil"></i>
                        </button>
                        <button className="icon-btn-delete" title="Delete Category" onClick={() => deleteCategory(cat.id)}>
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div className="category-management">
            <div className="section-header">
                <div>
                    <h3 className="section-title">Asset Categories</h3>
                    <p className="section-subtitle">Define your asset classification structure and custom dynamic fields.</p>
                </div>
                <button className="btn-primary" onClick={handleAddClick}>
                    <i className="bi bi-plus-square"></i> Add New Category
                </button>
            </div>

            <div className="asset-table-container">
                <table className="asset-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(categories) && categories.length > 0 ? (
                            renderCategoryRows()
                        ) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '60px' }}>
                                    {loading ? 'Refreshing list...' : 'No categories defined yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-form">
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', color: '#1e293b' }}>
                                {isViewMode ? `View Category: ${categoriesToCreate[0].name}` : (isEditMode ? `Edit Category: ${categoriesToCreate[0].name}` : 'Add New Category')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="close-btn" title="Close Modal">&times;</button>
                        </div>

                        <div className="modal-body">
                            <div className="categories-creation-list">
                                {categoriesToCreate.map((cat, catIdx) => (
                                    <div key={catIdx} className="category-form-row">
                                        <div className="category-main-inputs">
                                            <div style={{ flex: 1.5 }}>
                                                <label>Category Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. Mobile Phones, Cloud Servers"
                                                    value={cat.name}
                                                    onChange={(e) => handleCategoryChange(catIdx, 'name', e.target.value)}
                                                    disabled={isViewMode}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label>Sub-categories</label>
                                                <div style={{ marginBottom: '12px' }}>
                                                    {cat.subCategories && cat.subCategories.length > 0 ? (
                                                        cat.subCategories.map((subName, subIdx) => (
                                                            <div key={subIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="e.g. Laptops, Desktops"
                                                                    value={subName}
                                                                    onChange={(e) => handleSubCategoryChange(catIdx, subIdx, e.target.value)}
                                                                    style={{
                                                                        fontSize: '0.85rem',
                                                                        flex: 1,
                                                                        backgroundColor: isViewMode ? '#f8fafc' : 'white',
                                                                        color: isViewMode ? '#334155' : 'inherit',
                                                                        fontWeight: isViewMode ? '500' : 'normal'
                                                                    }}
                                                                    disabled={isViewMode}
                                                                />
                                                                {!isViewMode && (
                                                                    <button
                                                                        className="btn-icon-danger"
                                                                        onClick={() => handleRemoveSubCategory(catIdx, subIdx)}
                                                                        title="Remove Sub-Category"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div style={{
                                                            padding: '12px',
                                                            background: '#f8fafc',
                                                            borderRadius: '8px',
                                                            border: '1px dashed #cbd5e1',
                                                            color: '#94a3b8',
                                                            fontSize: '0.85rem',
                                                            textAlign: 'center'
                                                        }}>
                                                            No sub-categories defined.
                                                        </div>
                                                    )}
                                                    {!isViewMode && (
                                                        <button
                                                            onClick={() => handleAddSubCategory(catIdx)}
                                                            style={{
                                                                background: '#f0f9ff',
                                                                color: '#0ea5e9',
                                                                border: '1px solid #7dd3fc',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '500',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                width: '100%',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <i className="bi bi-plus-circle"></i> Add Subcategory
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '25px' }}>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={cat.active}
                                                        onChange={(e) => handleCategoryChange(catIdx, 'active', e.target.checked)}
                                                        disabled={isViewMode}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                                <span style={{ marginLeft: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Active</span>
                                            </div>
                                        </div>

                                        {/* Dynamic Fields Section */}
                                        <div className="fields-config-area">
                                            <div className="fields-header">
                                                <h4>Category-Specific Dynamic Fields</h4>
                                                {!isViewMode && (
                                                    <button
                                                        className="btn-primary-field"
                                                        onClick={() => handleAddField(catIdx)}
                                                        style={{
                                                            background: '#3b82f6',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.target.style.background = '#2563eb';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.target.style.background = '#3b82f6';
                                                            e.target.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <i className="bi bi-plus"></i> Add Field Configuration
                                                    </button>
                                                )}
                                            </div>

                                            {cat.fieldConfigs.length > 0 ? (
                                                <div className="fields-grid">
                                                    <div className="fields-grid-header">
                                                        <span>Field Label</span>
                                                        <span>Data Type</span>
                                                        <span style={{ textAlign: 'center' }}>Mandatory</span>
                                                        <span></span>
                                                    </div>
                                                    {cat.fieldConfigs.map((field, fieldIdx) => (
                                                        <div key={fieldIdx} className="field-config-row">
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Processor Type"
                                                                className="form-control"
                                                                value={field.fieldName}
                                                                onChange={(e) => handleFieldChange(catIdx, fieldIdx, 'fieldName', e.target.value)}
                                                                disabled={isViewMode}
                                                            />
                                                            <select
                                                                className="form-control"
                                                                value={field.fieldType}
                                                                onChange={(e) => handleFieldChange(catIdx, fieldIdx, 'fieldType', e.target.value)}
                                                                disabled={isViewMode}
                                                            >
                                                                <option value="">-- Select Type --</option>
                                                                {FIELD_TYPES.map(type => (
                                                                    <option key={type} value={type}>{type}</option>
                                                                ))}
                                                            </select>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.mandatory}
                                                                    onChange={(e) => handleFieldChange(catIdx, fieldIdx, 'mandatory', e.target.checked)}
                                                                    style={{ width: '18px', height: '18px' }}
                                                                    disabled={isViewMode}
                                                                />
                                                            </div>
                                                            {!isViewMode && (
                                                                <button className="btn-icon-danger" onClick={() => handleRemoveField(catIdx, fieldIdx)}>
                                                                    <i className="bi bi-trash3"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="no-fields-msg">
                                                    No specific dynamic fields defined for this category.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <div style={{ flex: 1 }}></div>
                            <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ minWidth: '100px' }}>{isViewMode ? 'Close' : 'Cancel'}</button>
                            {!isViewMode && (
                                <button className="btn-primary" onClick={handleSaveAll} disabled={loading} style={{ minWidth: '160px' }}>
                                    {loading ? 'Saving Changes...' : (isEditMode ? 'Update Category' : 'Save Category')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                    .category-management { padding: 24px; color: #1e293b; }
                    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
                    .section-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a; }
                    .section-subtitle { color: #64748b; font-size: 0.95rem; margin-top: 4px; }
                    
                    .asset-table th { background: #14B8A6; color: white; border-bottom: 2px solid #0d9488; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; padding: 16px; }
                    .asset-table td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
                    
                    .root-category-row { background: #fff; }
                    .sub-category-row { background: #fafafa; }
                    
                    .parent-cat-badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
                    .root-cat-badge { color: #94a3b8; font-style: italic; font-size: 0.8rem; }
                    
                    .field-tags-container { display: flex; flex-wrap: wrap; gap: 6px; }
                    .field-tag { background: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.75rem; font-weight: 500; display: flex; align-items: center; gap: 4px; }
                    .type-label { color: #64748b; font-size: 0.7rem; }
                    .mandatory-star { color: #ef4444; font-weight: bold; }
                    .no-fields { color: #cbd5e1; font-size: 0.85rem; }
                    
                    .status-pill { border: none; padding: 6px 14px; border-radius: 30px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                    .status-pill.active { background: #dcfce7; color: #166534; }
                    .status-pill.inactive { background: #fee2e2; color: #991b1b; }
                    .status-pill:hover { opacity: 0.85; transform: translateY(-1px); }
                    .icon-btn-view { background: #f0f9ff; color: #0369a1; border: 1px solid #7dd3fc; padding: 6px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
                    .icon-btn-view:hover { background: #0369a1; color: white; }
                    
                    .icon-btn-edit { background: #eff6ff; color: #2563eb; border: 1px solid #3b82f6; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
                    .icon-btn-delete { background: #fff1f2; color: #e11d48; border: 1px solid #f43f5e; padding: 6px 10px; border-radius: 6px; cursor: pointer; }

                    .category-form-row { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                    .category-main-inputs { display: flex; gap: 24px; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; align-items: flex-start; }
                    .category-main-inputs label { font-weight: 600; margin-bottom: 10px; display: block; font-size: 0.85rem; color: #334155; }
                    
                    .fields-config-area { background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; }
                    .fields-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .fields-header h4 { font-size: 0.95rem; font-weight: 700; margin: 0; color: #334155; }
                    
                    .fields-grid { display: flex; flex-direction: column; gap: 10px; }
                    .fields-grid-header { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 40px; gap: 16px; font-size: 0.75rem; font-weight: 700; color: #94a3b8; padding: 0 16px; text-transform: uppercase; }
                    .field-config-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 40px; gap: 16px; align-items: center; background: white; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
                    
                    .no-fields-msg { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 24px; background: white; border-radius: 8px; border: 1px dashed #cbd5e1; }
                    
                    /* Improved Modal Styles */
                    .modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background-color: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                        zIndex: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    
                    .modal-content.premium-form {
                        background: white;
                        border-radius: 20px;
                        width: 100%;
                        max-width: 900px;
                        max-height: 95vh;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        position: relative;
                    }
                    
                    .modal-header {
                        padding: 24px 32px;
                        border-bottom: 1px solid #f1f5f9;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: white;
                        flex-shrink: 0;
                    }
                    
                    .modal-body {
                        padding: 32px;
                        overflow-y: auto;
                        flex: 1;
                        background: #fdfdfd;
                    }
                    
                    .modal-footer {
                        padding: 20px 32px;
                        border-top: 1px solid #f1f5f9;
                        display: flex;
                        gap: 16px;
                        background: white;
                        flex-shrink: 0;
                    }
                    
                    .close-btn {
                        background: #f1f5f9;
                        border: none;
                        color: #64748b;
                        font-size: 28px;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                        line-height:1;
                        padding-bottom: 4px;
                    }
                    
                    .close-btn:hover {
                        background: #e2e8f0;
                        color: #1e293b;
                        transform: rotate(90deg);
                    }

                    .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
                    .toggle-switch input { opacity: 0; width: 0; height: 0; }
                    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; }
                    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; }
                    input:checked + .slider { background-color: #3b82f6; }
                    input:checked + .slider:before { transform: translateX(20px); }
                    .slider.round { border-radius: 34px; }
                    .slider.round:before { border-radius: 50%; }

                    @media (max-width: 768px) {
                        .modal-header, .modal-body, .modal-footer { padding: 16px 20px; }
                        .modal-content.premium-form { max-height: 100vh; border-radius: 0; }
                        .category-main-inputs { flex-direction: column; gap: 16px; }
                                }
                    }
                `}</style>

            <ToastNotification
                isOpen={toast.isOpen}
                onClose={closeToast}
                message={toast.message}
                type={toast.type}
            />
        </div>
    );
};

export default AssetCategoryManagement;