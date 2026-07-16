// ClearanceDetailsModal.js
import React from "react";
import PropTypes from "prop-types";

const ClearanceDetailsModal = ({ visible, onClose, task, clearanceData, onSubmit }) => {
  if (!visible || !task) return null;

  const clearanceItemsToDisplay = [
    { key: 'laptopSerial', label: 'Laptop Serial No.', commentKey: null, isCheckbox: false, roles: ['admin'] },
    { key: 'accessCardReturned', label: 'Access Card/ID Returned', commentKey: 'accessCardComment', isCheckbox: true, roles: ['admin'] },
    { key: 'emailAccountClosed', label: 'Email Account Closed', commentKey: 'emailClosedComment', isCheckbox: true, roles: ['admin'] },
    { key: 'vpnAccessRevoked', label: 'VPN/Access Revoked', commentKey: 'vpnRevokedComment', isCheckbox: true, roles: ['admin'] },
    { key: 'softwareLicensesDeallocated', label: 'Software Licenses Deallocated', commentKey: 'softwareDeallocatedComment', isCheckbox: true, roles: ['admin'] },
    { key: 'idCardReturnedFlag', label: 'ID Card Returned', commentKey: 'idCardReturnedComment', isCheckbox: true, roles: ['admin'] },
    { key: 'exitInterviewCompleted', label: 'Exit Interview Feedback Received', commentKey: 'exitInterviewCompletedComment', isCheckbox: true, roles: ['hr'] },
    { key: 'documentHandover', label: 'Document Handover', commentKey: 'documentHandoverComment', isCheckbox: true, roles: ['hr'] },
    { key: 'knowledgeTransfer', label: 'Knowledge Transfer Documentation', commentKey: 'knowledgeTransferComment', isCheckbox: true, roles: ['hr'] },
    { key: 'timesheetFilled', label: 'Timesheet Filled', commentKey: 'timesheetFilledComment', isCheckbox: true, roles: ['hr'] },
    { key: 'insuranceDeactivation', label: 'Insurance Deactivation', commentKey: 'insuranceDeactivationComment', isCheckbox: true, roles: ['hr'] },
  ];

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: '900px' }}>
        <div style={{ ...headerStyle, backgroundColor: '#FF8C00' }}>
          💰 Final Settlement for {task.employeeName}
        </div>

        <div style={{ padding: '20px' }}>
          <h4 style={sectionTitleStyle}>Clearance Status & Details</h4>

          <div style={summaryRowStyle}>
            <div><strong>LWD:</strong> <span style={{ color: 'red' }}>{clearanceData?.lastWorkingDay || 'N/A'}</span></div>
            <div><strong>Admin Cleared:</strong> {task.adminCleared ? '✅ YES' : '❌ NO'}</div>
            <div><strong>HR Cleared:</strong> {task.hrFinalApproval ? '✅ YES' : '❌ NO'}</div>
          </div>

          <div style={checklistContainerStyle}>
            <div style={checklistHeaderStyle}>
              <div>Item</div>
              <div style={{ textAlign: 'center' }}>Status</div>
              <div>Comment/Note</div>
            </div>

            {clearanceItemsToDisplay.map(item => (
              <div key={item.key} style={checklistItemStyle}>
                <div style={{ color: item.roles.includes('admin') ? '#007bff' : '#2196F3' }}>
                  {item.label} ({item.roles.includes('admin') ? 'IT/Admin' : 'HR'})
                </div>

                <div style={{ textAlign: 'center' }}>
                  {item.isCheckbox ? (
                    <span style={{ color: clearanceData?.[item.key] ? '#4CAF50' : '#F44336' }}>
                      {clearanceData?.[item.key] ? 'Cleared' : 'Pending'}
                    </span>
                  ) : (
                    <span>{clearanceData?.[item.key] || 'N/A'}</span>
                  )}
                </div>

                <div style={{ fontSize: '0.85em', color: '#666' }}>
                  {clearanceData?.[item.commentKey] || '—'}
                </div>
              </div>
            ))}
          </div>

          <label><strong>HR General Comments:</strong></label>
          <div style={commentBoxStyle}>
            {clearanceData?.hrClearanceComments || 'No general comments provided by HR.'}
          </div>

          <h4 style={sectionTitleStyle}>Final Settlement Details</h4>

          {/* Add Finance input fields here later if needed */}

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button onClick={onSubmit} style={submitBtnStyle}>Submit Settlement</button>
          </div>
        </div>
      </div>
    </div>
  );
};

ClearanceDetailsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.object,
  clearanceData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

// Styles
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' };
const headerStyle = { color: 'white', padding: '15px 20px', fontSize: '1.2em', fontWeight: 'bold' };
const sectionTitleStyle = { borderBottom: '2px solid #ddd', paddingBottom: '5px', marginTop: '10px', color: '#003366' };
const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', margin: '10px 0', background: '#eef', padding: '10px' };
const checklistContainerStyle = { border: '1px solid #ddd', borderRadius: '6px', padding: '10px' };
const checklistHeaderStyle = { display: 'grid', gridTemplateColumns: '1fr 100px 1.5fr', fontWeight: 'bold', borderBottom: '1px solid #ccc' };
const checklistItemStyle = { display: 'grid', gridTemplateColumns: '1fr 100px 1.5fr', padding: '8px 0', borderBottom: '1px dotted #ddd' };
const commentBoxStyle = { border: '1px solid #ddd', padding: '10px', background: '#fff', borderRadius: '6px', margin: '10px 0' };
const cancelBtnStyle = { marginRight: '10px', padding: '8px 16px', borderRadius: '4px', backgroundColor: '#eee', color: 'black', cursor: 'pointer' };
const submitBtnStyle = { backgroundColor: '#FF8C00', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontWeight: 'bold' };

export default ClearanceDetailsModal;
