
import React, { useEffect, useState } from "react";
import { formatDateTimeToIST } from '../utils/DateUtils';
import Sidebar from './Sidebar.js';
import api from "../api";
import { FiBell, FiCheckCircle, FiClock, FiInfo, FiActivity } from "react-icons/fi";
import "./Notifications.css";

const Notifications = () => {
  const employeeId = sessionStorage.getItem("employeeId");
  const token = sessionStorage.getItem("token");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId || !token) {
      setLoading(false);
      return;
    }
    fetchNotifications();
  }, [employeeId, token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/read/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map(n =>
        api.post(`/notifications/read/${n.id}`, null, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return (
    <Sidebar>
      <div className="notif-page-container1">
        <div className="notif-main-card">
          <header className="notif-header">
            <div className="notif-header-left">
              <div className="notif-header-text">
                <h1>Notifications</h1>
              </div>
            </div>
            <div className="notif-header-right">
              {notifications.some(n => !n.read) && (
                <button className="notif-action-btn" onClick={markAllAsRead}>
                  <FiCheckCircle /> Mark all as read
                </button>
              )}
            </div>
          </header>

          <div className="notif-body">
            {loading ? (
              <div className="notif-loader-wrapper">
                <div className="notif-spinner"></div>
                <p>Loading updates...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty-state">
                <h3>All Caught Up!</h3>
                <p>Your notification tray is currently empty. We'll let you know when something new arrives.</p>
              </div>
            ) : (
              <div className="notif-items-list">
                {notifications
                  .slice()
                  .sort((a, b) => b.id - a.id)
                  .map(n => {
                    return (
                      <div
                        key={n.id}
                        className={`notif-card-item ${n.read ? 'is-read' : 'is-unread'}`}
                        onClick={() => !n.read && markAsRead(n.id)}
                      >
                        <div className="notif-card-indicator"></div>
                        <div className="notif-symbol-holder">
                          {!n.read ? (
                            <FiBell style={{ color: '#64748b' }} />
                          ) : (
                            <FiCheckCircle style={{ color: '#64748b' }} />
                          )}
                          {!n.read && <span className="unread-dot"></span>}
                        </div>
                        <div className="notif-card-body">
                          <p className="notif-card-text">{n.message}</p>
                          <div className="notif-card-footer">
                            <span className="notif-card-time">
                              <FiClock />
                              {formatDateTimeToIST(n.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default Notifications;
