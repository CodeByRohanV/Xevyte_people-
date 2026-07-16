import React from 'react';
import { FaCheckCircle, FaRegCircle, FaClock } from 'react-icons/fa';

// Base steps that will be dynamically updated based on status
const BASE_EXIT_STEPS = [
  'Resignation Submitted',
  'Manager & Reviewer Approval',
  'Clearance (HR + Admin)',
  'Final Settlement (Finance)',
];

// ✅ Status → step mapping (NO rejection here)
const STATUS_MAP = {
  "no resignation submitted": -1,
  "pending approval": 0,
  "draft": 0,

  "approved by manager": 1,
  "approved by reviewer": 1,
  "approved by manager and reviewer": 2,

  "hr approved": 2,
  "hr cleared": 2,
  "admin cleared": 2,
  "clearance completed": 3,

  "final approved - exit complete": 4,
  "finance approved": 4,
  "finance completed": 4,
};

const ExitProgressTracker = ({ resignation }) => {
  const { 
    status: currentStatus, 
    hrCleared, 
    adminCleared,
    managerActorName, managerDelegatorName,
    reviewerActorName, reviewerDelegatorName,
    hrActorName, hrDelegatorName,
    adminActorName, adminDelegatorName,
    financeActorName, financeDelegatorName
  } = resignation || {};

  const normalizedStatus = currentStatus
    ? currentStatus.toLowerCase().trim()
    : "pending approval";

  // 🔥 REJECTION DETECTION (KEY FIX)
  const isRejected = normalizedStatus.startsWith("rejected");

  // 🔥 NO RESIGNATION DETECTION
  const isNoResignation = normalizedStatus === "no resignation submitted" || !resignation;

  // 🔥 CORE LOGIC
  const currentStepIndex = isRejected || isNoResignation
    ? -1
    : STATUS_MAP[normalizedStatus] ?? 0;

  const percent = isRejected || isNoResignation ? 0 : Math.min((currentStepIndex) * 25, 100);

  // 🔥 MESSAGE FOR NO RESIGNATION
  const subtitleMessage = isNoResignation 
    ? "no resignation submitted"
    : "Track your resignation and clearance progress";

  // Attribution helper
  const renderAttribution = (actor, delegator) => {
    if (!actor) return null;
    return (
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', fontStyle: 'italic' }}>
        By {actor} {delegator ? `(on behalf of ${delegator})` : ''}
      </div>
    );
  };

  // 🔥 DYNAMIC STEP LABELS BASED ON STATUS
  const getDynamicStepLabels = () => {
    const steps = [
      { label: 'Resignation Submitted', attribution: null },
      { label: 'Manager & Reviewer Approval', attribution: null },
      { label: 'Clearance (HR + Admin)', attribution: null },
      { label: 'Final Settlement (Finance)', attribution: null },
    ];
    
    // Step 1: Manager & Reviewer Approval
    if (normalizedStatus === "pending approval") {
      steps[1].label = "Pending Manager & Reviewer";
    } else if (normalizedStatus === "approved by manager") {
      steps[1].label = "Manager approved, pending Reviewer";
      steps[1].attribution = renderAttribution(managerActorName, managerDelegatorName);
    } else if (normalizedStatus === "approved by reviewer") {
      steps[1].label = "Reviewer approved, pending Manager";
      steps[1].attribution = renderAttribution(reviewerActorName, reviewerDelegatorName);
    } else if (normalizedStatus === "approved by manager and reviewer" || currentStepIndex > 1) {
      steps[1].label = "Manager & Reviewer Approved";
      steps[1].attribution = (
        <>
          {renderAttribution(managerActorName, managerDelegatorName)}
          {renderAttribution(reviewerActorName, reviewerDelegatorName)}
        </>
      );
    }
    
    // Step 2: HR & Admin Clearance
    if (normalizedStatus === "approved by manager and reviewer") {
      steps[2].label = "Pending HR approval";
    } else if (normalizedStatus === "clearance completed" || (hrCleared && adminCleared)) {
      steps[2].label = "Clearance completed (HR + Admin)";
      steps[2].attribution = (
        <>
          {renderAttribution(hrActorName, hrDelegatorName)}
          {renderAttribution(adminActorName, adminDelegatorName)}
        </>
      );
    } else if (hrCleared && !adminCleared) {
      steps[2].label = "HR cleared, pending Admin";
      steps[2].attribution = renderAttribution(hrActorName, hrDelegatorName);
    } else if (!hrCleared && adminCleared) {
      steps[2].label = "Admin cleared, pending HR";
      steps[2].attribution = renderAttribution(adminActorName, adminDelegatorName);
    } else if (normalizedStatus === "hr approved" || normalizedStatus.includes("clear")) {
      steps[2].label = "HR Approved, pending Clearance";
      steps[2].attribution = renderAttribution(hrActorName, hrDelegatorName);
    }

    // Step 3: Finance
    if (currentStepIndex === 4) {
      steps[3].attribution = renderAttribution(financeActorName, financeDelegatorName);
    }
    
    return steps;
  };

  const dynamicSteps = getDynamicStepLabels();

  return (
    <div className="exit-tracker-container">
      <h3 className="exit-tracker-title">Exit Process Progress</h3>
      <p className="exit-tracker-subtitle">
        {subtitleMessage}
      </p>

      <div className="exit-tracker-header">
        <strong>Overall Progress</strong>
        <span>{percent}%</span>
      </div>

      <div className="exit-tracker-progress">
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: "#14b8a6",
            borderRadius: "5px",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div className="exit-step-grid">
        {dynamicSteps.map((stepObj, index) => {
          const isComplete = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          let Icon = FaRegCircle;
          let color = "#9ca3af";
          let fontWeight = "normal";
          let bg = "#F5F7FA"; // Soft blue-grey background color for pending steps

          if (isComplete) {
            Icon = FaCheckCircle;
            color = "#10b981";
            fontWeight = "600";
            bg = "#f0fdfa"; // Soft green background color for completed steps
          } else if (isActive) {
            Icon = FaClock;
            color = "#14b8a6";
            fontWeight = "600";
            bg = "#f0fdfa"; // Soft green background color for active steps
          }

          return (
            <div 
              key={index} 
              className="exit-step-item" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                backgroundColor: bg
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon style={{ color, fontSize: "20px" }} />
                <span style={{ color, fontWeight }}>
                  {stepObj.label}
                </span>
              </div>
              <div style={{ paddingLeft: '28px' }}>
                {stepObj.attribution}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = `
.exit-tracker-container {
  padding: 1rem 0;
  background-color: transparent;
  width: 100%;
}

.exit-tracker-title {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.exit-tracker-subtitle {
  color: #64748b;
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: 2rem;
}

.exit-tracker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.exit-tracker-progress {
  height: 12px;
  background-color: #f1f5f9;
  border-radius: 20px;
  margin-bottom: 3rem;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.exit-step-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.exit-step-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: #F5F7FA;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.exit-step-item:hover {
  background-color: #f0fdfa;
  border-color: #ccfbf1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.1);
}

@media (max-width: 768px) {
  .exit-tracker-container {
    padding: 0.5rem 0;
  }
  
  .exit-tracker-title {
    font-size: 1.25rem;
  }

  .exit-tracker-subtitle {
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .exit-tracker-progress {
    margin-bottom: 2rem;
  }

  .exit-step-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .exit-step-item {
    padding: 0.75rem;
  }
}
`;

if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = styles;
  document.head.appendChild(style);
}

export default ExitProgressTracker;
