import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import './Calculations.css';
import { FiTrash, FiArrowUp, FiArrowDown } from 'react-icons/fi';

function SimpleStructureCreator({ onStructureCreated, onCancel, editingStructure }) {
  const [step, setStep] = useState('form'); // form, components, save
  const [structureTitle, setStructureTitle] = useState('');
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const hasLoadedEditingStructure = useRef(false);

  // Component types
  const componentTypes = [
    { value: 'FIXED_VALUE', label: 'Fixed value' },
    { value: 'FORMULA', label: 'Formula' },
    { value: 'AS_APPLICABLE', label: 'As applicable' },
  ];

  const sections = ['EARNINGS', 'DEDUCTIONS'];

  // Initialize form with editing structure data if provided
  useEffect(() => {
    if (editingStructure && !hasLoadedEditingStructure.current) {
      setStructureTitle(editingStructure.name || '');
      if (editingStructure.components && editingStructure.components.length > 0) {
        setComponents([...editingStructure.components].sort((a, b) => a.sequenceOrder - b.sequenceOrder).map(comp => ({
          id: comp.id || Date.now(),
          componentName: comp.componentName || '',
          section: comp.section || 'EARNINGS',
          componentType: comp.componentType || 'FIXED_VALUE',
          perMonthValue: comp.perMonthValue || '',
          perAnnumValue: comp.perAnnumValue || '',
          formula: comp.formula || '',
          sequenceOrder: comp.sequenceOrder || 1,
          highlighted: comp.highlighted || false,
        })));
      }
      hasLoadedEditingStructure.current = true;
      setStep('components');
    } else if (!editingStructure) {
      hasLoadedEditingStructure.current = false;
      setComponents([]);
      setStructureTitle('');
      setStep('form');
    }
  }, [editingStructure]);

  const handleCreateStructure = useCallback(async () => {
    if (!structureTitle.trim()) {
      setError('Please enter a template name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setComponents([]);
      setStep('components');
    } catch (err) {
      setError('Failed to create structure');
    } finally {
      setLoading(false);
    }
  }, [structureTitle]);

  const addComponent = useCallback((section = 'EARNINGS') => {
    // Find highest sequence order in this section
    const sectionComponents = components.filter(c => c.section === section);
    const maxSeq = sectionComponents.length > 0
      ? Math.max(...sectionComponents.map(c => c.sequenceOrder || 0))
      : 0;

    const newComp = {
      id: Date.now(),
      componentName: '',
      section: section,
      componentType: 'FIXED_VALUE',
      perMonthValue: '',
      perAnnumValue: '',
      formula: '',
      sequenceOrder: maxSeq + 1,
      highlighted: false
    };
    setComponents([...components, newComp]);
  }, [components]);

  const updateComponent = useCallback((index, field, value) => {
    const updatedComponents = [...components];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };

    // Auto-calculate annual from monthly if monthly is changed
    if (field === 'perMonthValue' && value && !isNaN(value)) {
      updatedComponents[index].perAnnumValue = parseFloat(value) * 12;
    }

    // Re-sequence within sections if section was changed
    if (field === 'section') {
      const earnings = updatedComponents.filter(c => c.section === 'EARNINGS');
      earnings.forEach((c, i) => c.sequenceOrder = i + 1);

      const deductions = updatedComponents.filter(c => c.section === 'DEDUCTIONS');
      deductions.forEach((c, i) => c.sequenceOrder = i + 1);
    }

    setComponents(updatedComponents);
  }, [components]);

  const moveComponent = useCallback((index, direction) => {
    const component = components[index];
    const section = component.section;

    // Find all components in the same section
    const sectionIndices = components
      .map((c, i) => (c.section === section ? i : -1))
      .filter(i => i !== -1);

    const sectionIndex = sectionIndices.indexOf(index);
    const targetSectionIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

    if (targetSectionIndex < 0 || targetSectionIndex >= sectionIndices.length) return;

    const targetGlobalIndex = sectionIndices[targetSectionIndex];

    const updatedComponents = [...components];
    const temp = updatedComponents[index];
    updatedComponents[index] = updatedComponents[targetGlobalIndex];
    updatedComponents[targetGlobalIndex] = temp;

    // Re-sequence within sections
    const earnings = updatedComponents.filter(c => c.section === 'EARNINGS');
    earnings.forEach((c, i) => c.sequenceOrder = i + 1);

    const deductions = updatedComponents.filter(c => c.section === 'DEDUCTIONS');
    deductions.forEach((c, i) => c.sequenceOrder = i + 1);

    setComponents(updatedComponents);
  }, [components]);

  const deleteComponent = useCallback((index) => {
    const updatedComponents = components.filter((_, i) => i !== index);

    // Re-sequence within sections
    const earnings = updatedComponents.filter(c => c.section === 'EARNINGS');
    earnings.forEach((c, i) => c.sequenceOrder = i + 1);

    const deductions = updatedComponents.filter(c => c.section === 'DEDUCTIONS');
    deductions.forEach((c, i) => c.sequenceOrder = i + 1);

    setComponents(updatedComponents);
  }, [components]);

  const saveStructure = useCallback(async () => {
    if (!structureTitle.trim()) {
      setError('Please enter a template name');
      return;
    }
    if (components.length === 0) {
      setError('Please add at least one component');
      return;
    }

    // Validate components
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (!comp.componentName.trim()) {
        setError(`Component: Name is required`);
        return;
      }
      if (comp.componentType === 'FIXED_VALUE' && (!comp.perMonthValue || isNaN(comp.perMonthValue))) {
        setError(`Component: Valid monthly value is required`);
        return;
      }
      if (comp.componentType === 'FORMULA' && !comp.formula.trim()) {
        setError(`Component: Formula is required`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const structureData = {
        name: structureTitle.trim(),
        description: editingStructure ? `Updated with ${components.length} components` : `Created with ${components.length} components`,
        status: 'ACTIVE',
        createdBy: 'admin',
        components: components.map(comp => ({
          componentName: comp.componentName.trim(),
          section: comp.section,
          componentType: comp.componentType,
          perMonthValue: comp.componentType === 'FIXED_VALUE' ? parseFloat(comp.perMonthValue) : null,
          perAnnumValue: comp.componentType === 'FIXED_VALUE' ? parseFloat(comp.perAnnumValue) : null,
          formula: comp.componentType === 'FORMULA' ? (comp.formula?.trim() || null) : null,
          sequenceOrder: comp.sequenceOrder,
          highlighted: comp.highlighted,
        })),
      };

      let response;
      if (editingStructure) {
        response = await api.put(`/v1/calculations/structures/${editingStructure.id}`, structureData);
        setSuccess('Structure updated successfully!');
      } else {
        response = await api.post('/v1/calculations/structures', structureData);
        setSuccess('Structure created successfully!');
      }

      setTimeout(() => {
        onStructureCreated(response.data);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || editingStructure ? 'Failed to update structure' : 'Failed to create structure');
    } finally {
      setLoading(false);
    }
  }, [structureTitle, components, onStructureCreated, editingStructure]);

  const renderFormStep = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label className="calc-label">Template Name *</label>
        <input
          type="text"
          className="calc-input"
          value={structureTitle}
          onChange={(e) => setStructureTitle(e.target.value)}
          placeholder="e.g. Salary Grade A - Engineering"
        />
      </div>

      {error && (
        <div className="calc-alert calc-alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="calc-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="calc-btn-primary"
          onClick={handleCreateStructure}
          disabled={!structureTitle.trim() || loading}
          style={{ backgroundColor: '#00B3A4' }}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );

  const renderComponentsStep = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#134e4a', marginBottom: '20px' }}>Add Components</h3>

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ color: '#334155', marginBottom: '10px' }}>Structure: {structureTitle}</h4>
        <p style={{ color: '#64748b', margin: 0 }}>
          Add components with types: Fixed Value, Formula, or As Applicable
        </p>
      </div>

      {error && (
        <div className="calc-alert calc-alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="salary-table-wrapper" style={{ marginBottom: '40px' }}>
        <h4 style={{ color: '#0d9488', marginBottom: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ backgroundColor: '#ccfbf1', padding: '4px 10px', borderRadius: '6px' }}>1. Earnings Section</span>
        </h4>
        <table className="salary-struct-table">
          <thead>
            <tr>
              <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '12px 8px', textAlign: 'center', fontWeight: '600', width: '80px' }}>Seq</th>
              <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '180px' }}>Component Name</th>
              <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '220px' }}>Type</th>
              <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '180px' }}>Per Month</th>
              <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '180px' }}>Per Annum</th>
              <th style={{ backgroundColor: '#629AF1', color: 'white', padding: '12px 8px', textAlign: 'center', fontWeight: '600', width: '160px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp, index) => ({ comp, index })).filter(x => x.comp.section === 'EARNINGS').map((x, subIndex, filteredArr) => (
              <tr key={x.comp.id}>
                <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                  {subIndex + 1}
                </td>
                <td>
                  <input
                    type="text"
                    className="inline-input"
                    value={x.comp.componentName}
                    onChange={(e) => updateComponent(x.index, 'componentName', e.target.value)}
                    placeholder="Component name"
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <select
                    className="inline-select"
                    value={x.comp.componentType}
                    onChange={(e) => updateComponent(x.index, 'componentType', e.target.value)}
                  >
                    {componentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {x.comp.componentType === 'AS_APPLICABLE' ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : x.comp.componentType === 'FORMULA' || x.comp.componentType?.includes('FORMULA') ? (
                    <input
                      type="text"
                      className="inline-input"
                      value={x.comp.formula || ''}
                      onChange={(e) => updateComponent(x.index, 'formula', e.target.value)}
                      placeholder="Formula"
                      style={{ width: '100%', fontFamily: 'monospace' }}
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      className="inline-input"
                      value={x.comp.perMonthValue}
                      onChange={(e) => updateComponent(x.index, 'perMonthValue', e.target.value)}
                      placeholder="Monthly"
                      style={{ width: '100%' }}
                    />
                  )}
                </td>
                <td>
                  {x.comp.componentType === 'AS_APPLICABLE' ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : x.comp.componentType === 'FORMULA' || x.comp.componentType?.includes('FORMULA') ? (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Auto (monthly × 12)
                    </span>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      className="inline-input"
                      value={x.comp.perAnnumValue}
                      onChange={(e) => updateComponent(x.index, 'perAnnumValue', e.target.value)}
                      placeholder="Annual"
                      style={{ width: '100%' }}
                    />
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button
                      className="icon-btn"
                      onClick={() => moveComponent(x.index, 'up')}
                      disabled={subIndex === 0}
                      style={{ background: 'transparent', border: 'none', padding: '4px', cursor: subIndex === 0 ? 'not-allowed' : 'pointer', opacity: subIndex === 0 ? 0.3 : 1 }}
                      title="Move Up"
                    >
                      <FiArrowUp style={{ color: '#0d9488' }} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => moveComponent(x.index, 'down')}
                      disabled={subIndex === filteredArr.length - 1}
                      style={{ background: 'transparent', border: 'none', padding: '4px', cursor: subIndex === filteredArr.length - 1 ? 'not-allowed' : 'pointer', opacity: subIndex === filteredArr.length - 1 ? 0.3 : 1 }}
                      title="Move Down"
                    >
                      <FiArrowDown style={{ color: '#0d9488' }} />
                    </button>
                    <button
                      className="icon-btn-del"
                      onClick={() => deleteComponent(x.index)}
                      style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
                      title="Delete"
                    >
                      <FiTrash style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {components.filter(c => c.section === 'EARNINGS').length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No earning components added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="salary-table-wrapper" style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#ef4444', marginBottom: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '6px' }}>2. Deductions Section</span>
        </h4>
        <table className="salary-struct-table">
          <thead>
            <tr>
              <th style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 8px', textAlign: 'center', fontWeight: '600', width: '80px' }}>Seq</th>
              <th style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '180px' }}>Component Name</th>
              <th style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '220px' }}>Type</th>
              <th style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '180px' }}>Per Month</th>
              <th style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 8px', textAlign: 'left', fontWeight: '600', width: '180px' }}>Per Annum</th>
              <th style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 8px', textAlign: 'center', fontWeight: '600', width: '160px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp, index) => ({ comp, index })).filter(x => x.comp.section === 'DEDUCTIONS').map((x, subIndex, filteredArr) => (
              <tr key={x.comp.id}>
                <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                  {subIndex + 1}
                </td>
                <td>
                  <input
                    type="text"
                    className="inline-input"
                    value={x.comp.componentName}
                    onChange={(e) => updateComponent(x.index, 'componentName', e.target.value)}
                    placeholder="Component name"
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <select
                    className="inline-select"
                    value={x.comp.componentType}
                    onChange={(e) => updateComponent(x.index, 'componentType', e.target.value)}
                  >
                    {componentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {x.comp.componentType === 'AS_APPLICABLE' ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : x.comp.componentType === 'FORMULA' || x.comp.componentType?.includes('FORMULA') ? (
                    <input
                      type="text"
                      className="inline-input"
                      value={x.comp.formula || ''}
                      onChange={(e) => updateComponent(x.index, 'formula', e.target.value)}
                      placeholder="Formula"
                      style={{ width: '100%', fontFamily: 'monospace' }}
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      className="inline-input"
                      value={x.comp.perMonthValue}
                      onChange={(e) => updateComponent(x.index, 'perMonthValue', e.target.value)}
                      placeholder="Monthly"
                      style={{ width: '100%' }}
                    />
                  )}
                </td>
                <td>
                  {x.comp.componentType === 'AS_APPLICABLE' ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : x.comp.componentType === 'FORMULA' || x.comp.componentType?.includes('FORMULA') ? (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Auto (monthly × 12)
                    </span>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      className="inline-input"
                      value={x.comp.perAnnumValue}
                      onChange={(e) => updateComponent(x.index, 'perAnnumValue', e.target.value)}
                      placeholder="Annual"
                      style={{ width: '100%' }}
                    />
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button
                      className="icon-btn"
                      onClick={() => moveComponent(x.index, 'up')}
                      disabled={subIndex === 0}
                      style={{ background: 'transparent', border: 'none', padding: '4px', cursor: subIndex === 0 ? 'not-allowed' : 'pointer', opacity: subIndex === 0 ? 0.3 : 1 }}
                      title="Move Up"
                    >
                      <FiArrowUp style={{ color: '#0d9488' }} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => moveComponent(x.index, 'down')}
                      disabled={subIndex === filteredArr.length - 1}
                      style={{ background: 'transparent', border: 'none', padding: '4px', cursor: subIndex === filteredArr.length - 1 ? 'not-allowed' : 'pointer', opacity: subIndex === filteredArr.length - 1 ? 0.3 : 1 }}
                      title="Move Down"
                    >
                      <FiArrowDown style={{ color: '#0d9488' }} />
                    </button>
                    <button
                      className="icon-btn-del"
                      onClick={() => deleteComponent(x.index)}
                      style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
                      title="Delete"
                    >
                      <FiTrash style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {components.filter(c => c.section === 'DEDUCTIONS').length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No deduction components added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button
          className="calc-btn-secondary"
          onClick={() => addComponent('EARNINGS')}
          style={{ flex: 1, backgroundColor: '#f0fdfa', borderColor: '#0d9488', color: '#0d9488' }}
        >
          + Add Earning Component
        </button>
        <button
          className="calc-btn-secondary"
          onClick={() => addComponent('DEDUCTIONS')}
          style={{ flex: 1, backgroundColor: '#fef2f2', borderColor: '#ef4444', color: '#ef4444' }}
        >
          + Add Deduction Component
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="calc-btn-secondary" onClick={() => setStep('form')}>
          Back
        </button>
        <button
          className="calc-btn-primary"
          onClick={saveStructure}
          disabled={components.length === 0 || loading}
          style={{ backgroundColor: '#00B3A4' }}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );

  const renderSaveStep = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3 style={{ color: '#134e4a', marginBottom: '20px' }}>Saving Template</h3>

      <div className="calc-spinner" style={{ marginBottom: '20px' }}>
        <div className="calc-spinner-ring" />
      </div>

      <p style={{ color: '#64748b', marginBottom: '20px' }}>
        Creating your structure template...
      </p>
    </div>
  );

  return (
    <div className="calc-modal-overlay">
      <div className="calc-modal" style={{ maxWidth: '1200px' }}>
        <div className="calc-modal-header">
          <h2>{editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}</h2>
          <button className="calc-modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="calc-modal-body">
          {step === 'form' && renderFormStep()}
          {step === 'components' && renderComponentsStep()}
          {step === 'save' && renderSaveStep()}
        </div>
      </div>
    </div>
  );
}

export default SimpleStructureCreator;
