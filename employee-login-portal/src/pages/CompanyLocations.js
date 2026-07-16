import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import api from '../api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMapPin } from 'react-icons/fi';

function CompanyLocations() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Form state
  const [formData, setFormData] = useState({
    locationName: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    // Filter locations based on search term
    if (searchTerm.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter(location =>
        location.locationName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm, locations]);

  const fetchLocations = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await api.get('/admin/company-locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(response.data);
      setFilteredLocations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to fetch company locations');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      locationName: ''
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.locationName.trim()) {
      errors.locationName = 'Location name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddLocation = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('employeeEmail');
      await api.post('/admin/company-locations', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Email': userEmail
        }
      });
      setShowAddModal(false);
      resetForm();
      fetchLocations();
    } catch (err) {
      console.error('Error adding location:', err);
      setError(err.response?.data || 'Failed to add location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLocation = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('employeeEmail');
      await api.put(`/admin/company-locations/${selectedLocation.id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Email': userEmail
        }
      });
      setShowEditModal(false);
      resetForm();
      setSelectedLocation(null);
      fetchLocations();
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err.response?.data || 'Failed to update location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocation = async (location) => {
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('employeeEmail');
      await api.delete(`/admin/company-locations/${location.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Email': userEmail
        }
      });
      setSelectedLocation(null);
      fetchLocations();
    } catch (err) {
      console.error('Error deleting location:', err);
      alert(err.response?.data || 'Failed to delete location');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (location) => {
    setSelectedLocation(location);
    setFormData({
      locationName: location.locationName || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = async (location) => {
    if (window.confirm(`Are you sure you want to delete "${location.locationName}"? This action will deactivate the location and can be restored later.`)) {
      setSelectedLocation(location);
      await handleDeleteLocation(location);
    }
  };

  const containerStyle = {
    padding: isMobile ? '10px' : '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f6f8'
  };

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: isMobile ? '15px' : '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'normal',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#00B3A4',
    color: 'white'
  };

  const editButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '8px'
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '8px'
  };

  const searchInputStyle = {
    width: isMobile ? '100%' : '300px',
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    width: isMobile ? '90%' : '400px',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const formGroupStyle = {
    marginBottom: '15px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'normal',
    color: '#1F2937'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px'
  };

  return (
    <Sidebar>
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <h2 style={{ margin: 0, color: '#1F2937', fontWeight: 'normal' }}>Company locations</h2>
            <button style={primaryButtonStyle} onClick={() => { resetForm(); setShowAddModal(true); }}>
              Add location
            </button>
          </div>
          <div style={{ color: '#00B3A4', fontSize: '1rem', fontWeight: 'normal', marginTop: '8px' }}>
            Human resource information system - Manage and configure physical company locations
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ ...cardStyle, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {/* Locations List */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1F2937', fontWeight: 'normal', textAlign: 'left' }}>Locations ({filteredLocations.length})</h3>
          
          {loading ? (
            <div style={{ textAlign: 'left', padding: '20px 0', color: '#6b7280' }}>
              Loading locations...
            </div>
          ) : filteredLocations.length === 0 ? (
            <div style={{ textAlign: 'left', padding: '20px 0', color: '#6b7280' }}>
              {searchTerm ? 'No locations found matching your search' : 'No locations found. Add your first location!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredLocations.map((location) => (
                <div key={location.id} style={{ 
                   border: '1px solid #e5e7eb', 
                   borderRadius: '8px', 
                   padding: '15px',
                   backgroundColor: location.isActive ? '#ffffff' : '#f9fafb',
                   opacity: location.isActive ? 1 : 0.7
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#1F2937', fontWeight: 'normal', textAlign: 'left' }}>{location.locationName}</h4>
                        {!location.isActive && (
                          <span style={{ 
                            backgroundColor: '#fef3c7', 
                            color: '#92400e', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-block',
                            marginTop: '4px',
                            textAlign: 'left'
                          }}>
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                      <button style={editButtonStyle} onClick={() => openEditModal(location)}>
                        Edit
                      </button>
                      <button style={deleteButtonStyle} onClick={() => openDeleteModal(location)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1F2937', fontWeight: 'normal', textAlign: 'left' }}>Add new location</h3>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>Location name</label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g. Head office, Branch office"
                />
                {formErrors.locationName && <div style={errorStyle}>{formErrors.locationName}</div>}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
                <button
                  style={{ ...buttonStyle, backgroundColor: '#6b7280', color: 'white' }}
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  style={primaryButtonStyle}
                  onClick={handleAddLocation}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div style={modalOverlayStyle} onClick={() => setShowEditModal(false)}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1F2937', fontWeight: 'normal', textAlign: 'left' }}>Edit location</h3>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>Location name</label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g. Head office, Branch office"
                />
                {formErrors.locationName && <div style={errorStyle}>{formErrors.locationName}</div>}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
                <button
                  style={{ ...buttonStyle, backgroundColor: '#6b7280', color: 'white' }}
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  style={primaryButtonStyle}
                  onClick={handleEditLocation}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default CompanyLocations;
