import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { FiPlus, FiTrash2, FiLayers, FiBookmark, FiGrid, FiChevronDown, FiChevronUp, FiSettings, FiEdit } from 'react-icons/fi';

function PerformanceAdmin() {
  const [activeTab, setActiveTab] = useState('Template Builder');
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refs for forms scrolling
  const goalFormRef = useRef(null);
  const attrFormRef = useRef(null);
  // Custom department management state
  const [customDepartments, setCustomDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [deptSectionOpen, setDeptSectionOpen] = useState(true);
  const [deptLoading, setDeptLoading] = useState(false);

  // Form states — Goals Template
  const [goalTemplateName, setGoalTemplateName] = useState('');
  const [goalSelectedDepartment, setGoalSelectedDepartment] = useState('');
  const [goals, setGoals] = useState([
    { goalTitle: '', goalDescription: '', metric: '', target: '' }
  ]);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [editingGoalTemplateId, setEditingGoalTemplateId] = useState(null);

  // Form states — Attribute Template
  const [attrTemplateName, setAttrTemplateName] = useState('');
  const [attrSelectedDepartment, setAttrSelectedDepartment] = useState('');
  const [attributes, setAttributes] = useState([
    { attributeTitle: '', attributeDescription: '', metric: '', target: '' }
  ]);
  const [submittingAttr, setSubmittingAttr] = useState(false);
  const [editingAttrTemplateId, setEditingAttrTemplateId] = useState(null);

  const [goalErrors, setGoalErrors] = useState({
    templateName: '',
    department: '',
    rows: []
  });
  const [attrErrors, setAttrErrors] = useState({
    templateName: '',
    department: '',
    rows: []
  });

  // Performance Configurations states
  const [timePeriods, setTimePeriods] = useState(() => {
    const saved = localStorage.getItem('performance_time_periods');
    return saved ? JSON.parse(saved) : [
      { id: 1, frequency: 'Quarterly', year: '2026', quarter: 'Q1', month: 'January, February, March', status: 'Active' }
    ];
  });
  const [configFrequency, setConfigFrequency] = useState('Quarterly');
  const [configYear, setConfigYear] = useState('2026');
  const [configQuarter, setConfigQuarter] = useState('Q1');
  const [configMonth, setConfigMonth] = useState('January');
  const [selectedQuarterMonths, setSelectedQuarterMonths] = useState([]);

  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthAbsoluteIndex = (val) => {
    const parts = val.split(' ');
    const m = parts[0];
    const y = parts[1] || configYear;
    return Number(y) * 12 + allMonths.indexOf(m);
  };

  const getMonthsForQuarter = (q, year) => {
    const saved = localStorage.getItem('performance_time_periods');
    const yr = year || configYear;
    if (saved) {
      try {
        const periods = JSON.parse(saved);
        const match = periods.find(
          p => p.frequency === 'Quarterly' && p.quarter === q && p.year === yr
        );
        if (match && match.month) {
          return match.month.split(', ').map(m => m.includes(' ') ? m : `${m} ${yr}`);
        }
      } catch (err) {
        console.error('Error parsing performance_time_periods in getMonthsForQuarter:', err);
      }
    }
    switch (q) {
      case 'Q1': return ['January', 'February', 'March'].map(m => `${m} ${yr}`);
      case 'Q2': return ['April', 'May', 'June'].map(m => `${m} ${yr}`);
      case 'Q3': return ['July', 'August', 'September'].map(m => `${m} ${yr}`);
      case 'Q4': return ['October', 'November', 'December'].map(m => `${m} ${yr}`);
      default: return allMonths.map(m => `${m} ${yr}`);
    }
  };

  const getMonthsForHalf = (h, year) => {
    const saved = localStorage.getItem('performance_time_periods');
    const yr = year || configYear;
    if (saved) {
      try {
        const periods = JSON.parse(saved);
        const match = periods.find(
          p => p.frequency === 'Half Yearly' && p.quarter === h && p.year === yr
        );
        if (match && match.month) {
          return match.month.split(', ').map(m => m.includes(' ') ? m : `${m} ${yr}`);
        }
      } catch (err) {
        console.error('Error parsing performance_time_periods in getMonthsForHalf:', err);
      }
    }
    switch (h) {
      case 'H1': return ['January', 'February', 'March', 'April', 'May', 'June'].map(m => `${m} ${yr}`);
      case 'H2': return ['July', 'August', 'September', 'October', 'November', 'December'].map(m => `${m} ${yr}`);
      default: return allMonths.map(m => `${m} ${yr}`);
    }
  };

  const getUsedMonthsInOtherQuarters = (periods, yr, qtr) => {
    const used = new Set();
    periods.forEach(p => {
      if (
        p.year === yr &&
        p.frequency === 'Quarterly' &&
        p.quarter !== qtr
      ) {
        if (p.month) {
          p.month.split(', ').forEach(m => used.add(m));
        }
      }
    });
    return used;
  };

  const getUsedMonthsInOtherHalves = (periods, yr, hf) => {
    const used = new Set();
    periods.forEach(p => {
      if (
        p.year === yr &&
        p.frequency === 'Half Yearly' &&
        p.quarter !== hf
      ) {
        if (p.month) {
          p.month.split(', ').forEach(m => used.add(m));
        }
      }
    });
    return used;
  };

  useEffect(() => {
    if (configFrequency === 'Quarterly') {
      const matchingPeriod = timePeriods.find(
        p => p.frequency === 'Quarterly' && p.year === configYear && p.quarter === configQuarter
      );
      let months = [];
      if (matchingPeriod && matchingPeriod.month) {
        months = matchingPeriod.month.split(', ').map(m => m.includes(' ') ? m : `${m} ${configYear}`);
      } else {
        months = getMonthsForQuarter(configQuarter, configYear);
      }
      const used = getUsedMonthsInOtherQuarters(timePeriods, configYear, configQuarter);
      setSelectedQuarterMonths(months.filter(m => !used.has(m)));
    } else if (configFrequency === 'Half Yearly') {
      const matchingPeriod = timePeriods.find(
        p => p.frequency === 'Half Yearly' && p.year === configYear && p.quarter === configQuarter
      );
      let months = [];
      if (matchingPeriod && matchingPeriod.month) {
        months = matchingPeriod.month.split(', ').map(m => m.includes(' ') ? m : `${m} ${configYear}`);
      } else {
        months = getMonthsForHalf(configQuarter, configYear);
      }
      const used = getUsedMonthsInOtherHalves(timePeriods, configYear, configQuarter);
      setSelectedQuarterMonths(months.filter(m => !used.has(m)));
    } else if (configFrequency === 'Yearly') {
      const matchingPeriod = timePeriods.find(
        p => p.frequency === 'Yearly' && p.year === configYear
      );
      let months = [];
      if (matchingPeriod && matchingPeriod.month) {
        months = matchingPeriod.month.split(', ').map(m => m.includes(' ') ? m : `${m} ${configYear}`);
      } else {
        months = allMonths.map(m => `${m} ${configYear}`);
      }
      setSelectedQuarterMonths(months);
    }
  }, [configQuarter, configYear, configFrequency, timePeriods]);

  const handleFrequencyChange = (freq) => {
    setConfigFrequency(freq);
    if (freq === 'Quarterly') {
      setConfigQuarter('Q1');
      setConfigMonth('January');
    } else if (freq === 'Half Yearly') {
      setConfigQuarter('H1');
      setConfigMonth('January');
    } else if (freq === 'Monthly') {
      setConfigMonth('January');
    } else {
      setConfigMonth('');
      setConfigQuarter('');
    }
  };

  const handleQuarterChange = (q) => {
    setConfigQuarter(q);
    const months = configFrequency === 'Half Yearly'
      ? getMonthsForHalf(q, configYear)
      : getMonthsForQuarter(q, configYear);
    setConfigMonth(months[0]);
  };

  const handleAddTimePeriod = (e) => {
    e.preventDefault();

    if (configFrequency === 'Monthly') {
      const exists = timePeriods.some(
        p => p.frequency === 'Monthly' && p.year === configYear && p.month === configMonth
      );
      if (exists) {
        alert(`This Monthly cycle (${configMonth} ${configYear}) has already been configured.`);
        return;
      }

      const newPeriod = {
        id: Date.now(),
        frequency: 'Monthly',
        year: configYear,
        quarter: '',
        month: configMonth,
        status: 'Active'
      };

      const updated = [...timePeriods, newPeriod];
      setTimePeriods(updated);
      localStorage.setItem('performance_time_periods', JSON.stringify(updated));
      alert('Monthly time period configuration added successfully!');
      return;
    }

    let monthVal = '';
    if (configFrequency === 'Quarterly' || configFrequency === 'Half Yearly' || configFrequency === 'Yearly') {
      const exists = timePeriods.some(
        p => p.frequency === configFrequency && p.year === configYear && (configFrequency === 'Yearly' ? true : p.quarter === configQuarter)
      );
      if (exists) {
        alert(`This ${configFrequency} cycle (${configFrequency === 'Yearly' ? configYear : configQuarter + ' - ' + configYear}) has already been configured.`);
        return;
      }

      const expectedMonthsCount = configFrequency === 'Quarterly' ? 3 : (configFrequency === 'Half Yearly' ? 6 : 12);
      if (selectedQuarterMonths.length !== expectedMonthsCount) {
        alert(`Please select exactly ${expectedMonthsCount} months for the ${configFrequency === 'Quarterly' ? 'quarter' : (configFrequency === 'Half Yearly' ? 'half-year' : 'yearly period')}.`);
        return;
      }
      // Sort months to be in chronological order
      const sortedMonths = [...selectedQuarterMonths].sort(
        (a, b) => getMonthAbsoluteIndex(a) - getMonthAbsoluteIndex(b)
      );

      // Verify consecutive sequence
      const indices = sortedMonths.map(m => getMonthAbsoluteIndex(m));
      let isSequential = true;
      for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i - 1] + 1) {
          isSequential = false;
          break;
        }
      }
      if (!isSequential) {
        alert('Months must be selected in a consecutive sequence.');
        return;
      }

      monthVal = sortedMonths.join(', ');
    }

    const newPeriod = {
      id: Date.now(),
      frequency: configFrequency,
      year: configYear,
      quarter: (configFrequency === 'Quarterly' || configFrequency === 'Half Yearly') ? configQuarter : '',
      month: monthVal,
      status: 'Active'
    };

    const updated = [...timePeriods, newPeriod];
    setTimePeriods(updated);
    localStorage.setItem('performance_time_periods', JSON.stringify(updated));
    alert('Time period configuration added successfully!');
  };

  const handleDeleteTimePeriod = (id) => {
    if (!window.confirm('Are you sure you want to delete this time period configuration?')) return;
    const updated = timePeriods.filter(p => p.id !== id);
    setTimePeriods(updated);
    localStorage.setItem('performance_time_periods', JSON.stringify(updated));
    alert('Time period configuration deleted.');
  };

  const handleClearAllTimePeriods = () => {
    if (!window.confirm('Are you sure you want to delete ALL configured time periods? This cannot be undone.')) return;
    setTimePeriods([]);
    localStorage.removeItem('performance_time_periods');
    alert('All time period configurations cleared.');
  };

  useEffect(() => {
    fetchDepartments();
    fetchTemplates();
    fetchCustomDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/employees/distinct-departments');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      const fallbackDepts = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations'];
      setDepartments(fallbackDepts);
    }
  };

  const fetchCustomDepartments = async () => {
    try {
      const response = await api.get('/performance/departments');
      setCustomDepartments(response.data || []);
    } catch (err) {
      console.error('Error fetching custom departments:', err);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/performance/templates');
      setTemplates(response.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      alert('Failed to load goal templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (tpl) => {
    const isGoalTpl = tpl.goals && tpl.goals.length > 0;
    if (isGoalTpl) {
      setEditingGoalTemplateId(tpl.id);
      setGoalTemplateName(tpl.templateName);
      setGoalSelectedDepartment(tpl.department);
      setGoals(tpl.goals.map(g => ({
        id: g.id,
        goalTitle: g.goalTitle,
        goalDescription: g.goalDescription || '',
        metric: g.metric || '',
        target: g.target || ''
      })));
      setGoalErrors({
        templateName: '',
        department: '',
        rows: tpl.goals.map(() => ({}))
      });
      setTimeout(() => {
        goalFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      setEditingAttrTemplateId(tpl.id);
      setAttrTemplateName(tpl.templateName);
      setAttrSelectedDepartment(tpl.department);
      
      const list = getTemplateAttributeList(tpl);
      setAttributes(list.map((a, idx) => {
        const orig = tpl.templateAttributes && tpl.templateAttributes[idx];
        return {
          id: orig ? orig.id : null,
          attributeTitle: a.title,
          attributeDescription: a.description || '',
          metric: a.metric === '—' ? '' : a.metric
        };
      }));
      setAttrErrors({
        templateName: '',
        department: '',
        rows: list.map(() => ({}))
      });
      setTimeout(() => {
        attrFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };


  // ── Goals handlers ──────────────────────────────────────────────────────
  const handleGoalChange = (index, field, value) => {
    if (field === 'metric') {
      if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) > 100)) {
        return;
      }
    }
    const updated = [...goals];
    updated[index][field] = value;
    setGoals(updated);
    setGoalErrors(prev => {
      const rows = [...prev.rows];
      if (rows[index]) {
        rows[index] = { ...rows[index], [field]: '' };
      }
      return { ...prev, rows };
    });
  };

  const handleAddGoalRow = () => {
    setGoals([...goals, { goalTitle: '', goalDescription: '', metric: '', target: '' }]);
    setGoalErrors(prev => ({
      ...prev,
      rows: [...prev.rows, {}]
    }));
  };

  const handleRemoveGoalRow = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
    setGoalErrors(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index)
    }));
  };

  // ── Attributes handlers ──────────────────────────────────────────────────
  const handleAttributeChange = (index, field, value) => {
    if (field === 'metric') {
      if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) > 100)) {
        return;
      }
    }
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
    setAttrErrors(prev => {
      const rows = [...prev.rows];
      if (rows[index]) {
        rows[index] = { ...rows[index], [field]: '' };
      }
      return { ...prev, rows };
    });
  };

  const handleAddAttributeRow = () => {
    setAttributes([...attributes, { attributeTitle: '', attributeDescription: '', metric: '', target: '' }]);
    setAttrErrors(prev => ({
      ...prev,
      rows: [...prev.rows, {}]
    }));
  };

  const handleRemoveAttributeRow = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
    setAttrErrors(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index)
    }));
  };

  // ── Submit — Goals Template ──────────────────────────────────────────────
  const handleSubmitGoalTemplate = async (e) => {
    e.preventDefault();

    let hasErrors = false;
    const errors = {
      templateName: '',
      department: '',
      rows: []
    };

    if (!goalTemplateName.trim()) {
      errors.templateName = 'Template name is required.';
      hasErrors = true;
    }
    if (!goalSelectedDepartment) {
      errors.department = 'Department is required.';
      hasErrors = true;
    }

    const rowErrors = [];
    goals.forEach((g, idx) => {
      const rowErr = {};
      if (!g.goalTitle?.trim()) {
        rowErr.goalTitle = 'Title is required.';
        hasErrors = true;
      }
      if (!g.goalDescription?.trim()) {
        rowErr.goalDescription = 'Description is required.';
        hasErrors = true;
      }
      if (!g.metric) {
        rowErr.metric = 'Weightage is required.';
        hasErrors = true;
      }
      if (!g.target?.trim()) {
        rowErr.target = 'Target is required.';
        hasErrors = true;
      }
      rowErrors.push(rowErr);
    });
    errors.rows = rowErrors;

    if (hasErrors) {
      setGoalErrors(errors);
      const missingFields = [];
      if (!goalTemplateName.trim()) {
        missingFields.push('Template Name');
      }
      if (!goalSelectedDepartment) {
        missingFields.push('Target Department');
      }
      let rowTitleMissing = false;
      let rowDescMissing = false;
      let rowMetricMissing = false;
      let rowTargetMissing = false;
      goals.forEach((g) => {
        if (!g.goalTitle?.trim()) rowTitleMissing = true;
        if (!g.goalDescription?.trim()) rowDescMissing = true;
        if (!g.metric) rowMetricMissing = true;
        if (!g.target?.trim()) rowTargetMissing = true;
      });
      if (rowTitleMissing) missingFields.push('Goal Title');
      if (rowDescMissing) missingFields.push('Description');
      if (rowMetricMissing) missingFields.push('Weightage');
      if (rowTargetMissing) missingFields.push('Target');

      alert('Please fill in all mandatory fields:\n' + missingFields.map(f => `- ${f}`).join('\n'));
      return;
    }

    setSubmittingGoal(true);
    const payload = {
      id: editingGoalTemplateId || null,
      templateName: goalTemplateName.trim(),
      department: goalSelectedDepartment,
      goals: goals.map(g => ({
        id: g.id || null,
        goalTitle: g.goalTitle,
        goalDescription: g.goalDescription,
        metric: g.metric,
        target: g.target
      })),
      templateAttributes: []
    };
    try {
      await api.post('/performance/templates', payload);
      alert(editingGoalTemplateId ? 'Goals Template updated successfully!' : 'Goals Template created successfully!');
      setGoalTemplateName('');
      setGoalSelectedDepartment('');
      setGoals([{ goalTitle: '', goalDescription: '', metric: '', target: '' }]);
      setGoalErrors({ templateName: '', department: '', rows: [] });
      setEditingGoalTemplateId(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving goals template:', err);
      alert(err.response?.data?.message || 'Failed to save Goals Template.');
    } finally {
      setSubmittingGoal(false);
    }
  };

  // ── Submit — Attribute Template ──────────────────────────────────────────
  const handleSubmitAttributeTemplate = async (e) => {
    e.preventDefault();

    let hasErrors = false;
    const errors = {
      templateName: '',
      department: '',
      rows: []
    };

    if (!attrTemplateName.trim()) {
      errors.templateName = 'Template name is required.';
      hasErrors = true;
    }
    if (!attrSelectedDepartment) {
      errors.department = 'Department is required.';
      hasErrors = true;
    }

    const rowErrors = [];
    attributes.forEach((a, idx) => {
      const rowErr = {};
      if (!a.attributeTitle?.trim()) {
        rowErr.attributeTitle = 'Title is required.';
        hasErrors = true;
      }
      if (!a.attributeDescription?.trim()) {
        rowErr.attributeDescription = 'Description is required.';
        hasErrors = true;
      }
      rowErrors.push(rowErr);
    });
    errors.rows = rowErrors;

    if (hasErrors) {
      setAttrErrors(errors);
      const missingFields = [];
      if (!attrTemplateName.trim()) {
        missingFields.push('Template Name');
      }
      if (!attrSelectedDepartment) {
        missingFields.push('Target Department');
      }
      let rowTitleMissing = false;
      let rowDescMissing = false;
      attributes.forEach((a) => {
        if (!a.attributeTitle?.trim()) rowTitleMissing = true;
        if (!a.attributeDescription?.trim()) rowDescMissing = true;
      });
      if (rowTitleMissing) missingFields.push('Attribute Title');
      if (rowDescMissing) missingFields.push('Description');

      alert('Please fill in all mandatory fields:\n' + missingFields.map(f => `- ${f}`).join('\n'));
      return;
    }

    setSubmittingAttr(true);
    const payload = {
      id: editingAttrTemplateId || null,
      templateName: attrTemplateName.trim(),
      department: attrSelectedDepartment,
      goals: [],
      templateAttributes: attributes.map(a => ({
        id: a.id || null,
        attributeTitle: a.attributeTitle,
        attributeDescription: a.attributeDescription,
        metric: ''
      }))
    };
    try {
      await api.post('/performance/templates', payload);
      alert(editingAttrTemplateId ? 'Attribute Template updated successfully!' : 'Attribute Template created successfully!');
      setAttrTemplateName('');
      setAttrSelectedDepartment('');
      setAttributes([{ attributeTitle: '', attributeDescription: '', metric: '', target: '' }]);
      setAttrErrors({ templateName: '', department: '', rows: [] });
      setEditingAttrTemplateId(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving attribute template:', err);
      alert(err.response?.data?.message || 'Failed to save Attribute Template.');
    } finally {
      setSubmittingAttr(false);
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.delete(`/performance/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
      alert('Template deleted successfully.');
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template.');
    }
  };

  // ── Custom Department handlers ────────────────────────────────────────────
  const handleAddDepartment = async () => {
    const trimmed = newDeptName.trim();
    if (!trimmed) { alert('Please enter a department name.'); return; }
    setDeptLoading(true);
    try {
      await api.post('/performance/departments', { name: trimmed });
      setNewDeptName('');
      alert(`Department "${trimmed}" added successfully.`);
      // Refresh both lists so the dropdown updates immediately
      await fetchCustomDepartments();
      await fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add department.');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    try {
      await api.delete(`/performance/departments/${id}`);
      setCustomDepartments(prev => prev.filter(d => d.id !== id));
      alert(`Department "${name}" removed.`);
      // Refresh merged list
      await fetchDepartments();
    } catch (err) {
      alert('Failed to delete department.');
    }
  };



  // ── Styles ───────────────────────────────────────────────────────────────
  const formCardStyle = {
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    padding: '28px',
    marginBottom: '28px'
  };

  const inputStyle = {
    padding: '10px 14px',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    width: '100%',
    boxSizing: 'border-box'
  };

  const focusInputStyle = (e) => {
    e.target.style.borderColor = '#14b8a6';
    e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)';
  };

  const blurInputStyle = (e) => {
    e.target.style.borderColor = '#cbd5e1';
    e.target.style.boxShadow = 'none';
  };

  const addRowBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.2s'
  };

  // ── Shared Table renderer (goals / attributes) ────────────────────────────
  const renderGridTable = (rows, onChange, onRemove, onAdd, config, rowErrors = []) => (
    <div style={{ textAlign: 'left', marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
        {config.label}
      </label>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              {config.columns.map(col => (
                <th key={col.key} style={{ padding: '12px', color: '#475569', fontWeight: '600', textAlign: col.align || 'left', width: col.width }}>
                  {col.header}
                </th>
              ))}
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', textAlign: 'center', width: '8%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 1} style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px' }}>
                  No items added. Click "{config.addLabel}" to add one.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {config.columns.map(col => {
                    return (
                      <td key={col.key} style={{ padding: '10px' }}>
                        {col.type === 'select' ? (
                          <select
                            value={row[col.key] || ''}
                            onChange={(e) => onChange(idx, col.key, e.target.value)}
                            style={{
                              ...inputStyle,
                              padding: '8px 10px',
                              textAlign: col.align === 'center' ? 'center' : 'left',
                              cursor: 'pointer'
                            }}
                            onFocus={focusInputStyle}
                            onBlur={blurInputStyle}
                          >
                            <option value="" disabled>{col.placeholder || 'Select'}</option>
                            {(col.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : col.key === 'metric' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type={col.type || 'text'}
                              placeholder={col.placeholder || ''}
                              value={row[col.key] || ''}
                              onChange={(e) => onChange(idx, col.key, e.target.value)}
                              style={{
                                ...inputStyle,
                                padding: '8px 10px',
                                textAlign: col.align === 'center' ? 'center' : 'left',
                                width: 'calc(100% - 16px)'
                              }}
                              onFocus={focusInputStyle}
                              onBlur={blurInputStyle}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>%</span>
                          </div>
                        ) : (
                          <input
                            type={col.type || 'text'}
                            placeholder={col.placeholder || ''}
                            value={row[col.key] || ''}
                            onChange={(e) => onChange(idx, col.key, e.target.value)}
                            style={{
                              ...inputStyle,
                              padding: '8px 10px',
                              textAlign: col.align === 'center' ? 'center' : 'left'
                            }}
                            onFocus={focusInputStyle}
                            onBlur={blurInputStyle}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAdd}
        style={addRowBtnStyle}
        onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
      >
        <FiPlus />
        {config.addLabel}
      </button>
    </div>
  );

  const goalColumns = [
    { key: 'goalTitle', header: 'Goal Title *', placeholder: 'Goal Title', width: '25%', required: true },
    { key: 'goalDescription', header: 'Description *', placeholder: 'Goal Description', width: '45%' },
    { key: 'metric', header: 'Weightage (%) *', placeholder: 'e.g. 20', width: '12%', type: 'number', align: 'center' },
    { key: 'target', header: 'Target *', placeholder: 'e.g. 5', width: '10%', align: 'center' }
  ];

  const attributeColumns = [
    { key: 'attributeTitle', header: 'Attribute Title *', placeholder: 'Attribute Title', width: '35%', required: true },
    { key: 'attributeDescription', header: 'Description *', placeholder: 'Attribute Description', width: '55%' }
  ];

  const tabContainerStyle = {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '24px',
    paddingBottom: '0px'
  };

  const getTabButtonStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '600',
      color: isActive ? '#00B3A4' : '#64748b',
      border: 'none',
      borderBottom: isActive ? '3px solid #00B3A4' : '3px solid transparent',
      background: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '-2px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      outline: 'none'
    };
  };

  const getTemplateAttributeList = (tpl) => {
    if (tpl.templateAttributes && tpl.templateAttributes.length > 0) {
      return tpl.templateAttributes.map(a => ({
        title: a.attributeTitle,
        description: a.attributeDescription,
        metric: a.metric ? a.metric : '—'
      }));
    } else if (tpl.attributes && tpl.attributes.trim()) {
      return tpl.attributes.split(',').map(attr => ({
        title: attr.trim(),
        description: '—',
        metric: '—'
      }));
    }
    return [];
  };

  const goalTemplates = templates.filter(tpl => tpl.goals && tpl.goals.length > 0);
  const attributeTemplates = templates.filter(tpl => (tpl.templateAttributes && tpl.templateAttributes.length > 0) || (tpl.attributes && tpl.attributes.trim()));

  return (
    <div style={{ width: '95%', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Title Header */}
      <div style={{ textAlign: 'left', marginBottom: '28px' }}>
        <h2 style={{ color: '#1F2937', fontSize: '28px', fontWeight: '700', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Performance Template Builder
        </h2>
        <p style={{ color: '#00B3A4', margin: 0, fontSize: '15px' }}>
          Define default performance goal templates, goals, and evaluation attributes per department.
        </p>
      </div>



      {/* Tabs */}
      <div style={tabContainerStyle}>
        <button
          type="button"
          onClick={() => setActiveTab('Template Builder')}
          style={getTabButtonStyle('Template Builder')}
        >
          <FiLayers />
          Template Builder
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Configurations')}
          style={getTabButtonStyle('Configurations')}
        >
          <FiSettings />
          Configurations
        </button>
      </div>

      {activeTab === 'Template Builder' && (
        <>
          {/* ── Manage Departments Card ─────────────────────────────────────── */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '0', marginBottom: '28px', overflow: 'hidden' }}>
            {/* Collapsible Header */}
            <button
              type="button"
              onClick={() => setDeptSectionOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 28px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: deptSectionOpen ? '1px solid #e2e8f0' : 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '17px', fontWeight: '700', color: '#1F2937' }}>
                <FiGrid style={{ color: '#00B3A4', fontSize: '18px' }} />
                Manage Departments
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '2px 10px' }}>
                  {customDepartments.length} custom
                </span>
              </span>
              {deptSectionOpen
                ? <FiChevronUp style={{ color: '#64748b', fontSize: '18px' }} />
                : <FiChevronDown style={{ color: '#64748b', fontSize: '18px' }} />
              }
            </button>

            {deptSectionOpen && (
              <div style={{ padding: '24px 28px' }}>
                <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#64748b', textAlign: 'left' }}>
                  Add custom departments beyond those already in your employee records. These will appear in the Target Department dropdown below.
                </p>

                {/* Add new department row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="e.g. Innovation Labs, R&D, Legal..."
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddDepartment()}
                    style={{
                      flex: 1, padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px',
                      fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                    onFocus={e => { e.target.style.borderColor = '#00B3A4'; e.target.style.boxShadow = '0 0 0 3px rgba(0,179,164,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    disabled={deptLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      backgroundColor: '#00B3A4', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
                      fontWeight: '600', cursor: deptLoading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', transition: 'background 0.2s', opacity: deptLoading ? 0.7 : 1
                    }}
                    onMouseEnter={e => { if (!deptLoading) e.currentTarget.style.backgroundColor = '#00968A'; }}
                    onMouseLeave={e => { if (!deptLoading) e.currentTarget.style.backgroundColor = '#00B3A4'; }}
                  >
                    <FiPlus />
                    {deptLoading ? 'Adding…' : 'Add Department'}
                  </button>
                </div>

                {/* Custom departments list */}
                {customDepartments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', fontSize: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    No custom departments added yet. Add one above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {customDepartments.map(dept => (
                      <div
                        key={dept.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          backgroundColor: '#f0fdfa', border: '1.5px solid #99f6e4',
                          borderRadius: '8px', padding: '6px 14px', fontSize: '14px',
                          color: '#0d9488', fontWeight: '600'
                        }}
                      >
                        <span>{dept.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0', display: 'flex', alignItems: 'center', fontSize: '14px', lineHeight: 1 }}
                          title={`Remove ${dept.name}`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Goals Template Form ─────────────────────────────────────── */}
          <div ref={goalFormRef} style={formCardStyle}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0fdf4', color: '#0d9488', fontSize: '15px', fontWeight: '700' }}>G</span>
              {editingGoalTemplateId ? 'Edit Goals Template' : 'Create Goals Template'}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', textAlign: 'left' }}>
              Define goal-based performance targets for a department.
            </p>

            <form onSubmit={handleSubmitGoalTemplate} noValidate>
              {/* Template Name + Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                    Template Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q3 Software Engineer Goals"
                    value={goalTemplateName}
                    onChange={(e) => setGoalTemplateName(e.target.value)}
                    style={inputStyle}
                    onFocus={focusInputStyle}
                    onBlur={blurInputStyle}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                    Target Department *
                  </label>
                  <select
                    value={goalSelectedDepartment}
                    onChange={(e) => setGoalSelectedDepartment(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer'
                    }}
                    onFocus={focusInputStyle}
                    onBlur={blurInputStyle}
                  >
                    <option value="" disabled>Select</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Goals Grid */}
              {renderGridTable(
                goals,
                handleGoalChange,
                handleRemoveGoalRow,
                handleAddGoalRow,
                { label: 'Goals Template List', addLabel: 'Add Goal Row', columns: goalColumns },
                goalErrors.rows
              )}

              {editingGoalTemplateId ? (
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={submittingGoal}
                    style={{
                      backgroundColor: '#0d9488',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 28px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: submittingGoal ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                      flex: 1
                    }}
                    onMouseEnter={(e) => { if (!submittingGoal) e.target.style.backgroundColor = '#0f766e'; }}
                    onMouseLeave={(e) => { if (!submittingGoal) e.target.style.backgroundColor = '#0d9488'; }}
                  >
                    {submittingGoal ? 'Updating Goals Template...' : 'Update Goals Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGoalTemplateId(null);
                      setGoalTemplateName('');
                      setGoalSelectedDepartment('');
                      setGoals([{ goalTitle: '', goalDescription: '', metric: '', target: '' }]);
                    }}
                    style={{
                      backgroundColor: '#64748b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 28px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#475569'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#64748b'}
                  >
                    Cancel Edit
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submittingGoal}
                  style={{
                    backgroundColor: '#0d9488',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 28px',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: submittingGoal ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    width: '100%',
                    marginTop: '10px'
                  }}
                  onMouseEnter={(e) => { if (!submittingGoal) e.target.style.backgroundColor = '#0f766e'; }}
                  onMouseLeave={(e) => { if (!submittingGoal) e.target.style.backgroundColor = '#0d9488'; }}
                >
                  {submittingGoal ? 'Saving Goals Template...' : 'Save Goals Template'}
                </button>
              )}
            </form>
          </div>

          {/* ── Attribute Template Form ──────────────────────────────────── */}
          <div ref={attrFormRef} style={formCardStyle}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0fdf4', color: '#0d9488', fontSize: '15px', fontWeight: '700' }}>A</span>
              {editingAttrTemplateId ? 'Edit Attribute Template' : 'Create Attribute Template'}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', textAlign: 'left' }}>
              Define behavioral / competency attributes evaluated for a department.
            </p>

            <form onSubmit={handleSubmitAttributeTemplate} noValidate>
              {/* Template Name + Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                    Template Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q3 Behavioral Attributes"
                    value={attrTemplateName}
                    onChange={(e) => setAttrTemplateName(e.target.value)}
                    style={inputStyle}
                    onFocus={focusInputStyle}
                    onBlur={blurInputStyle}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                    Target Department *
                  </label>
                  <select
                    value={attrSelectedDepartment}
                    onChange={(e) => setAttrSelectedDepartment(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer'
                    }}
                    onFocus={focusInputStyle}
                    onBlur={blurInputStyle}
                  >
                    <option value="" disabled>Select</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attributes Grid */}
              {renderGridTable(
                attributes,
                handleAttributeChange,
                handleRemoveAttributeRow,
                handleAddAttributeRow,
                { label: 'Attributes Evaluated', addLabel: 'Add Attribute Row', columns: attributeColumns },
                attrErrors.rows
              )}

              {editingAttrTemplateId ? (
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={submittingAttr}
                    style={{
                      backgroundColor: '#0d9488',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 28px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: submittingAttr ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                      flex: 1
                    }}
                    onMouseEnter={(e) => { if (!submittingAttr) e.target.style.backgroundColor = '#0f766e'; }}
                    onMouseLeave={(e) => { if (!submittingAttr) e.target.style.backgroundColor = '#0d9488'; }}
                  >
                    {submittingAttr ? 'Updating Attribute Template...' : 'Update Attribute Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAttrTemplateId(null);
                      setAttrTemplateName('');
                      setAttrSelectedDepartment('');
                      setAttributes([{ attributeTitle: '', attributeDescription: '', metric: '', target: '' }]);
                    }}
                    style={{
                      backgroundColor: '#64748b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 28px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#475569'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#64748b'}
                  >
                    Cancel Edit
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submittingAttr}
                  style={{
                    backgroundColor: '#0d9488',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 28px',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: submittingAttr ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    width: '100%',
                    marginTop: '10px'
                  }}
                  onMouseEnter={(e) => { if (!submittingAttr) e.target.style.backgroundColor = '#0f766e'; }}
                  onMouseLeave={(e) => { if (!submittingAttr) e.target.style.backgroundColor = '#0d9488'; }}
                >
                  {submittingAttr ? 'Saving Attribute Template...' : 'Save Attribute Template'}
                </button>
              )}
            </form>
          </div>

          {/* Active Goal Templates Stack */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginTop: '28px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBookmark style={{ color: '#00B3A4' }} />
              Active Goal Templates ({goalTemplates.length})
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading templates...</div>
            ) : goalTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic' }}>
                No goal templates defined yet. Define a template above.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '20%' }}>Template Name</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '10%' }}>Department</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '15%' }}>Goal Title</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '35%' }}>Description</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'center', width: '10%', whiteSpace: 'nowrap' }}>Weightage (%)</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'center', width: '5%' }}>Target</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'center', width: '5%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalTemplates.flatMap((tpl) => {
                      const goalsCount = tpl.goals ? tpl.goals.length : 0;
                      const rowSpanCount = goalsCount > 0 ? goalsCount : 1;

                      const rows = [];
                      for (let i = 0; i < rowSpanCount; i++) {
                        const g = tpl.goals && tpl.goals[i];
                        const isFirst = i === 0;

                        rows.push(
                          <tr key={`${tpl.id}-${i}`} style={{ borderBottom: i === rowSpanCount - 1 ? '2px solid #cbd5e1' : '1px solid #e2e8f0' }}>
                            {isFirst && (
                              <>
                                <td rowSpan={rowSpanCount} style={{ padding: '14px', color: '#1f2937', fontWeight: '600', textAlign: 'left', verticalAlign: 'middle', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                                  {tpl.templateName}
                                </td>
                                <td rowSpan={rowSpanCount} style={{ padding: '14px', color: '#475569', textAlign: 'left', verticalAlign: 'middle' }}>
                                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                                    {tpl.department}
                                  </span>
                                </td>
                              </>
                            )}

                            <td style={{ padding: '14px', color: '#1e293b', fontWeight: '500', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                              {g ? g.goalTitle : '—'}
                            </td>
                            <td style={{ padding: '14px', color: '#64748b', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                              {g && g.goalDescription ? g.goalDescription : '—'}
                            </td>
                            <td style={{ padding: '14px', color: '#0369a1', fontWeight: '600', textAlign: 'center' }}>
                              {g && g.metric ? `${g.metric}%` : '—'}
                            </td>
                            <td style={{ padding: '14px', color: '#0d9488', fontWeight: '600', textAlign: 'center' }}>
                              {g && g.target ? g.target : '—'}
                            </td>

                            {isFirst && (
                              <td rowSpan={rowSpanCount} style={{ padding: '14px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEditTemplate(tpl)}
                                    title={`Edit ${tpl.templateName}`}
                                    style={{ background: 'transparent', color: '#0d9488', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '6px', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#0f766e'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#0d9488'}
                                  >
                                    <FiEdit />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(tpl.id, tpl.templateName)}
                                    title={`Delete ${tpl.templateName}`}
                                    style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '6px', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      }
                      return rows;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Attribute Templates Stack */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginTop: '28px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBookmark style={{ color: '#7c3aed' }} />
              Active Attribute Templates ({attributeTemplates.length})
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading templates...</div>
            ) : attributeTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic' }}>
                No attribute templates defined yet. Define a template above.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '20%' }}>Template Name</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '15%' }}>Department</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '20%' }}>Attribute Title</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '40%' }}>Description</th>
                      <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'center', width: '5%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attributeTemplates.flatMap((tpl) => {
                      const list = getTemplateAttributeList(tpl);
                      const attrCount = list.length;
                      const rowSpanCount = attrCount > 0 ? attrCount : 1;

                      const rows = [];
                      for (let i = 0; i < rowSpanCount; i++) {
                        const a = list[i];
                        const isFirst = i === 0;

                        rows.push(
                          <tr key={`${tpl.id}-${i}`} style={{ borderBottom: i === rowSpanCount - 1 ? '2px solid #cbd5e1' : '1px solid #e2e8f0' }}>
                            {isFirst && (
                              <>
                                <td rowSpan={rowSpanCount} style={{ padding: '14px', color: '#1f2937', fontWeight: '600', textAlign: 'left', verticalAlign: 'middle', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                                  {tpl.templateName}
                                </td>
                                <td rowSpan={rowSpanCount} style={{ padding: '14px', color: '#475569', textAlign: 'left', verticalAlign: 'middle' }}>
                                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                                    {tpl.department}
                                  </span>
                                </td>
                              </>
                            )}

                            <td style={{ padding: '14px', color: '#1e293b', fontWeight: '500', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                              {a ? a.title : '—'}
                            </td>
                            <td style={{ padding: '14px', color: '#64748b', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                              {a ? a.description : '—'}
                            </td>

                            {isFirst && (
                              <td rowSpan={rowSpanCount} style={{ padding: '14px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEditTemplate(tpl)}
                                    title={`Edit ${tpl.templateName}`}
                                    style={{ background: 'transparent', color: '#0d9488', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '6px', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#0f766e'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#0d9488'}
                                  >
                                    <FiEdit />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(tpl.id, tpl.templateName)}
                                    title={`Delete ${tpl.templateName}`}
                                    style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '6px', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      }
                      return rows;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'Configurations' && (() => {
        const currentYear = new Date().getFullYear();
        const yearsOptions = [String(currentYear - 1), String(currentYear), String(currentYear + 1)];
        return (
          <div style={{ textAlign: 'left' }}>
            {/* Add Time Period Card */}
            <div style={formCardStyle}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiPlus style={{ color: '#00B3A4' }} />
                Add Performance Evaluation Cycle / Time Period
              </h3>

              <form onSubmit={handleAddTimePeriod}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                      Frequency *
                    </label>
                    <select
                      value={configFrequency}
                      onChange={(e) => handleFrequencyChange(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={focusInputStyle}
                      onBlur={blurInputStyle}
                      required
                    >
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half Yearly">Half Yearly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                      Year *
                    </label>
                    <select
                      value={configYear}
                      onChange={(e) => {
                        setConfigYear(e.target.value);
                      }}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={focusInputStyle}
                      onBlur={blurInputStyle}
                      required
                    >
                      {yearsOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {(configFrequency === 'Quarterly' || configFrequency === 'Half Yearly') && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        {configFrequency === 'Quarterly' ? 'Quarter *' : 'Half *'}
                      </label>
                      <select
                        value={configQuarter}
                        onChange={(e) => handleQuarterChange(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={focusInputStyle}
                        onBlur={blurInputStyle}
                        required
                      >
                        {configFrequency === 'Quarterly' ? (
                          <>
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                            <option value="Q4">Q4</option>
                          </>
                        ) : (
                          <>
                            <option value="H1">H1</option>
                            <option value="H2">H2</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {configFrequency === 'Monthly' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Month *
                      </label>
                      <select
                        value={configMonth}
                        onChange={(e) => setConfigMonth(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={focusInputStyle}
                        onBlur={blurInputStyle}
                        required
                      >
                        {allMonths.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}



                  {(configFrequency === 'Quarterly' || configFrequency === 'Half Yearly' || configFrequency === 'Yearly') && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Months *
                      </label>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '12px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff'
                      }}>
                        {/* Year 1 Section */}
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                            Year {configYear}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px' }}>
                            {allMonths.map(m => {
                              const monthKey = `${m} ${configYear}`;
                              return (
                                <label key={monthKey} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '13px',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  fontWeight: '500'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedQuarterMonths.includes(monthKey)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const maxMonths = configFrequency === 'Quarterly' ? 3 : (configFrequency === 'Half Yearly' ? 6 : 12);
                                        if (selectedQuarterMonths.length >= maxMonths) {
                                          alert(`You can only select a maximum of ${maxMonths} months.`);
                                          return;
                                        }
                                        setSelectedQuarterMonths([...selectedQuarterMonths, monthKey]);
                                      } else {
                                        setSelectedQuarterMonths(selectedQuarterMonths.filter(x => x !== monthKey));
                                      }
                                    }}
                                    style={{ width: '15px', height: '15px', accentColor: '#00B3A4', cursor: 'pointer' }}
                                  />
                                  {m}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Year 2 Section */}
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                            Year {Number(configYear) + 1}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px' }}>
                            {allMonths.map(m => {
                              const monthKey = `${m} ${Number(configYear) + 1}`;
                              return (
                                <label key={monthKey} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '13px',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  fontWeight: '500'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedQuarterMonths.includes(monthKey)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const maxMonths = configFrequency === 'Quarterly' ? 3 : (configFrequency === 'Half Yearly' ? 6 : 12);
                                        if (selectedQuarterMonths.length >= maxMonths) {
                                          alert(`You can only select a maximum of ${maxMonths} months.`);
                                          return;
                                        }
                                        setSelectedQuarterMonths([...selectedQuarterMonths, monthKey]);
                                      } else {
                                        setSelectedQuarterMonths(selectedQuarterMonths.filter(x => x !== monthKey));
                                      }
                                    }}
                                    style={{ width: '15px', height: '15px', accentColor: '#00B3A4', cursor: 'pointer' }}
                                  />
                                  {m}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#00B3A4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#00968A'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = '#00B3A4'; }}
                >
                  <FiPlus />
                  Add Time Period
                </button>
              </form>
            </div>

            {/* Active Time Periods List */}
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiBookmark style={{ color: '#00B3A4' }} />
                  Configured Time Periods ({timePeriods.length})
                </h3>
                {timePeriods.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTimePeriods}
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #ef4444',
                      color: '#ef4444',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FiTrash2 size={13} /> Clear All
                  </button>
                )}
              </div>

              {timePeriods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic' }}>
                  No time periods configured yet. Define one above.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                        <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '25%' }}>Period Details</th>
                        <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '25%' }}>Frequency</th>
                        <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '20%' }}>Year</th>
                        <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'left', width: '20%' }}>Status</th>
                        <th style={{ padding: '14px', color: '#475569', fontWeight: '600', textAlign: 'center', width: '10%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timePeriods.map((period) => (
                        <tr key={period.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '14px', color: '#1f2937', fontWeight: '600', textAlign: 'left' }}>
                            {period.frequency === 'Yearly' && `Year ${period.year}${period.month ? ' (' + period.month + ')' : ''}`}
                            {period.frequency === 'Monthly' && `${period.month} ${period.year}`}
                            {period.frequency === 'Quarterly' && `${period.quarter} (${period.month}) - ${period.year}`}
                            {period.frequency === 'Half Yearly' && `${period.quarter} (${period.month}) - ${period.year}`}
                          </td>
                          <td style={{ padding: '14px', color: '#475569', textAlign: 'left' }}>
                            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                              {period.frequency}
                            </span>
                          </td>
                          <td style={{ padding: '14px', color: '#475569', textAlign: 'left' }}>
                            {period.year}
                          </td>
                          <td style={{ padding: '14px', color: '#10b981', textAlign: 'left', fontWeight: '600' }}>
                            {period.status}
                          </td>
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTimePeriod(period.id)}
                              style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '6px', transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default PerformanceAdmin;
