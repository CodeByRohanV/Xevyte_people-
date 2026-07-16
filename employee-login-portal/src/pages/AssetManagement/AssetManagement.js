import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar.js';
import AssetMaster from './AssetMaster';
import AssetAllocation from './AssetAllocation';
import './AssetManagement.css';
import api from "../../api";

const AssetManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const tabsRef = useRef(null);

    const [activeTab, setActiveTab] = useState('Asset Inventory');
    const [summary, setSummary] = useState({
        totalAssets: 0,
        allocatedCount: 0,
        inStockCount: 0
    });

    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const employeeId = sessionStorage.getItem("employeeId");
    const token = sessionStorage.getItem("token");

    const fetchAssetSummary = React.useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.get('/assets/summary', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || { total: 0, allocated: 0, inStock: 0 };
            
            setSummary({
                totalAssets: data.total || 0,
                allocatedCount: data.allocated || 0,
                inStockCount: data.inStock || 0
            });
        } catch (err) {
            console.error("Error fetching asset summary:", err);
        }
    }, [token]);

    useEffect(() => {
        fetchAssetSummary();
    }, [fetchAssetSummary]);

    // Handle navigation state - prioritize sessionStorage over location.state for persistence
    useEffect(() => {
        // Try to get the active tab from sessionStorage first (for refresh persistence)
        const savedTab = sessionStorage.getItem('assetManagementActiveTab');
        if (savedTab && ['Asset Inventory', 'Allocations'].includes(savedTab)) {
            setActiveTab(savedTab);
        } else if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            // Also save to sessionStorage for future refreshes
            sessionStorage.setItem('assetManagementActiveTab', location.state.activeTab);
        }
    }, [location.state]);

    const tabItems = ['Asset Inventory', 'Allocations'];

    const tabIcons = {};

    const checkScrollButtons = () => {
        if (tabsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        return () => window.removeEventListener('resize', checkScrollButtons);
    }, [tabItems]);

    const scrollTabs = (direction) => {
        if (tabsRef.current) {
            const scrollAmount = 200;
            tabsRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(checkScrollButtons, 300);
        }
    };

    const renderContent = () => {
        return (
            <>
                {activeTab === 'Asset Inventory' && (
                    <AssetMaster onAssetChange={fetchAssetSummary} />
                )}
                {activeTab === 'Allocations' && (
                    <AssetAllocation onAssetChange={fetchAssetSummary} />
                )}
            </>
        );
    };

    return (
        <Sidebar>
            <div className="asset-page-container">
                <h2 className="asset-page-title">
                    Asset Management
                </h2>
                <div className="asset-subtitle" style={{ color: '#00B3A4', fontSize: '15px', marginTop: '-12px', marginBottom: '24px', fontWeight: '500' }}>
                    Manage your assets inventory and track allocation progress
                </div>

                <div className="asset-header-stats">
                    <div className="asset-quick-stats">
                        <div className="asset-stat-card total-assets">
                            <div className="asset-stat-details">
                                <div className="asset-stat-value">{summary.totalAssets}</div>
                                <div className="asset-stat-label">TOTAL ASSETS</div>
                            </div>
                        </div>

                        <div className="asset-stat-card allocated">
                            <div className="asset-stat-details">
                                <div className="asset-stat-value">{summary.allocatedCount}</div>
                                <div className="asset-stat-label">ALLOCATED</div>
                            </div>
                        </div>

                        <div className="asset-stat-card in-stock">
                            <div className="asset-stat-details">
                                <div className="asset-stat-value">{summary.inStockCount}</div>
                                <div className="asset-stat-label">IN STOCK</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="asset-tabs-container">
                    {showLeftArrow && (
                        <button className="tab-nav-arrow tab-nav-left" onClick={() => scrollTabs('left')}>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                    )}
                    <div className="asset-tabs" ref={tabsRef} onScroll={checkScrollButtons}>
                        {tabItems.map(tab => (
                            <button
                                key={tab}
                                className={`asset-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tab);
                                    // Save to sessionStorage for refresh persistence
                                    sessionStorage.setItem('assetManagementActiveTab', tab);
                                    navigate(location.pathname, { replace: true, state: { activeTab: tab } });
                                }}
                            >
                                <span className="tab-text">{tab}</span>
                            </button>
                        ))}
                    </div>
                    {showRightArrow && (
                        <button className="tab-nav-arrow tab-nav-right" onClick={() => scrollTabs('right')}>
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    )}
                </div>

                <div className="asset-main-content">
                    {renderContent()}
                </div>
            </div>
        </Sidebar>
    );
};

export default AssetManagement;
