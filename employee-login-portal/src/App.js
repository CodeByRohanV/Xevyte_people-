import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from "./pages/PrivateRoute";
import { handleSSOCallback } from './auth/SSOHandler';

import OrgChart from './pages/OrgChart';

import LoginPage from './components/LoginPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ChangePasswordPage from "./components/ChangePasswordPage";
import Dashboard from './pages/Dashboard';
import ResetLinkSent from './components/ResetLinkSent';
import PasswordReset from './components/PasswordReset';
import SessionTimeoutHandler from "./components/SessionTimeoutHandler";
import PolicyPage from './pages/PolicyPage';
import MyTeamRes from './pages/MyTeamRes';
import PublicExitInterviewForm from './pages/PublicExitInterviewForm';

import AttendancePage from './pages/AttendancePage';
import ClaimsPage from './pages/ClaimsPage';
import EmployeeDirectory from './pages/EmployeeDirectory';
import EmployeeHandBook from './pages/EmployeeHandBook';
import EmployeeKnowledgeHub from './pages/EmployeeKnowledgeHub';
import ExitManagement from './pages/ExitManagement';
import HelpDesk from './pages/HelpDesk';
import Holiday from './pages/Holiday';
import Leaves from './pages/Leaves';
import Payslips from './pages/Payslips';
import Performance from './pages/Performance';
import Training from './pages/Training';
import Travel from './pages/Travel';
import Reports from './pages/Reports';
import NewClaim from './pages/NewClaim';
import ClaimHistoryPage from './pages/ClaimHistoryPage';
import ClaimStatusPage from './pages/ClaimStatusPage';
import ManagerDashBoard from "./pages/ManagerDashBoard";
import FinanceDashboard from "./pages/FinanceDashboard";
import HRDashboard from "./pages/HRDashboard";
import MyTasks from "./pages/MyTasks";
import Saveddrafts from "./pages/Saveddrafts";
import Mygoals from './pages/Mygoals';
import Selfassessment from './pages/Selfassessment';
import Myteam from './pages/Myteam';
import Newgoal from './pages/Newgoal';
import Managergoals from './pages/Managergoals';
import Reviewer from './pages/Reviewer';
import Employeegoal from './pages/Employeegoal';
import InProgressgoals from './pages/InProgressgoals';
import Submittedgoals from './pages/Submittedgoals';
import Rejectedgoals from './pages/Rejectedgoals';
import Pendinggoals from './pages/Pendinggoals';
import Reviewergoals from './pages/Reviewergoals';
import Hrgoals from './pages/Hrgoals';
import Finalhrgoals from './pages/Finalhrgoals';
import Submitfeedback from './pages/Submitfeedback';
import Goalhistory from './pages/Goalhistory';
import Mytimesheets from './pages/Mytimesheets';
import ManagerTasks from './pages/ManagerTasks';
import HRTasks from './pages/HrTasks';
import LeavesDraft from './pages/LeavesDraft';
import LeaveHistory from './pages/LeaveHistory';
import Mngtimesheetrequest from './pages/Mngtimesheetrequest';
import Mngtimesheetds from './pages/Mngtimesheetds';
import Hrtimesheetds from './pages/Hrtimesheetds';
import HRTimesheet from './pages/HRTimesheet';
import MyTeamPage from './pages/MyTeamPage';
import MyTeamLeave from './pages/MyTeamLeave';
import MyTeamTravel from './pages/MyTeamTravel';
import CustomerList from './pages/CustomerList';
import ProjectPage from './pages/ProjectPage';
import SowPage from './pages/SowPage';
import AllocationPage from './pages/AllocationPage';
import ApprovalRequests from './pages/ApprovalRequests';

import Notifications from './pages/Notifications';
import OnBoardingPage from './pages/OnBoardingPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import Preonboarding from './pages/Preonboarding';
import OnboardingForm from './pages/OnboardingForm';
import ViewPreOnboarding from "./pages/ViewPreOnboarding";
import ConfirmationPage from "./pages/ConfirmationPage";
import PreonboardingFinancePage from "./pages/PreonboardingFinancePage";
import HRViewPreOnboardingDetails from "./pages/HRViewPreOnboardingDetails";
import OnboardingVerify from "./pages/OnboardingVerify";
import AdminAccessPage from "./pages/AdminAccessPage";
import GrievancePage from "./pages/GrievancePage";
import PayrollManagement from "./pages/PayrollManagement";
import Allocations from "./pages/Allocations";
import EmployeeDirectoryDetails from "./pages/EmployeeDirectoryDetails";
import DocumentHub from "./pages/DocumentHub";
// import LMSLandingPage from "./pages/LMSLandingPage";
import YTDReportPage from "./pages/YTDReportPage";
import CompensationManagement from './pages/CompensationManagement';
import AssetManagement from './pages/AssetManagement/AssetManagement';
import ITDeclaration from './pages/ITDeclaration';
import CompanyLocations from './pages/CompanyLocations';
import AcknowledgePoliciesPage from './pages/AcknowledgePoliciesPage';
import ScalozAnalyticsHub from './pages/ScalozAnalyticsHub';
import AttendanceAnalyticsDeep from './pages/AttendanceAnalyticsDeep';
import AnalyticsComingSoon from './pages/AnalyticsComingSoon';

// ── SSO: Capture ?scaloz_token=... from Scaloz IAM redirect before React renders
handleSSOCallback();

function App() {
  return (
    <Router>
      <SessionTimeoutHandler>
        <Routes>
          <Route path="/policy/:policyKey" element={<PolicyPage />} />

          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />

          <Route path="/LoginPage" element={<LoginPage />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-link-sent" element={<ResetLinkSent />} />
          <Route path="/password-reset-success" element={<PasswordReset />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Protected Routes */}

          <Route path="/Home" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          {/* Claims */}
          <Route path="/Claims" element={<PrivateRoute><ClaimsPage /></PrivateRoute>} />

          <Route path="/claims/status" element={<PrivateRoute><ClaimStatusPage /></PrivateRoute>} />
          <Route path="/claims/history" element={<PrivateRoute><ClaimHistoryPage /></PrivateRoute>} />
          <Route path="/new" element={<PrivateRoute><NewClaim /></PrivateRoute>} />
          <Route path="/manager-dashboard" element={<PrivateRoute><ManagerDashBoard /></PrivateRoute>} />
          <Route path="/finance-dashboard" element={<PrivateRoute><FinanceDashboard /></PrivateRoute>} />
          <Route path="/task" element={<PrivateRoute><MyTasks /></PrivateRoute>} />
          <Route path="/drafts" element={<PrivateRoute><Saveddrafts /></PrivateRoute>} />

          {/* Timesheet */}

          <Route path="/TimeSheet" element={<PrivateRoute><AttendancePage /></PrivateRoute>} />

          <Route path="/mngtime" element={<PrivateRoute><Mngtimesheetds /></PrivateRoute>} />
          <Route path="/mngreq" element={<PrivateRoute><Mngtimesheetrequest /></PrivateRoute>} />
          <Route path="/hrgreq" element={<PrivateRoute><Hrtimesheetds /></PrivateRoute>} />
          <Route path="/timesheets" element={<PrivateRoute><HRTimesheet /></PrivateRoute>} />

          <Route path="/MyTimeSheets" element={<PrivateRoute><Mytimesheets /></PrivateRoute>} />
          <Route path="/MyTeam" element={<PrivateRoute><MyTeamPage /></PrivateRoute>} />
          <Route path="/approval-requests" element={<PrivateRoute><ApprovalRequests /></PrivateRoute>} />

          {/* Goals Performance */}
          <Route path="/PerformanceManagement" element={<PrivateRoute><Performance /></PrivateRoute>} />

          <Route path="/goals" element={<PrivateRoute><Mygoals /></PrivateRoute>} />
          <Route path="/selfassessment" element={<PrivateRoute><Selfassessment /></PrivateRoute>} />
          <Route path="/myteam" element={<PrivateRoute><Myteam /></PrivateRoute>} />
          <Route path="/myteam/newgoal" element={<PrivateRoute><Newgoal /></PrivateRoute>} />
          <Route path="/managergoals" element={<PrivateRoute><Managergoals /></PrivateRoute>} />
          <Route path="/reviewer" element={<PrivateRoute><Reviewer /></PrivateRoute>} />

          <Route path="/GoalsPage" element={<PrivateRoute><Employeegoal /></PrivateRoute>} />

          <Route path="/inprogressgoals" element={<PrivateRoute><InProgressgoals /></PrivateRoute>} />
          <Route path="/submittedgoals" element={<PrivateRoute><Submittedgoals /></PrivateRoute>} />
          <Route path="/rejectedgoals" element={<PrivateRoute><Rejectedgoals /></PrivateRoute>} />
          <Route path="/pendinggoals" element={<PrivateRoute><Pendinggoals /></PrivateRoute>} />

          <Route path="/ReviewerGoalsPage" element={<PrivateRoute><Reviewergoals /></PrivateRoute>} />
          <Route path="/hrgoals" element={<PrivateRoute><Hrgoals /></PrivateRoute>} />
          <Route path="/HrGoalsPage" element={<PrivateRoute><Finalhrgoals /></PrivateRoute>} />

          <Route path="/submitfeedback" element={<PrivateRoute><Submitfeedback /></PrivateRoute>} />
          <Route path="/goalhistory" element={<PrivateRoute><Goalhistory /></PrivateRoute>} />

          {/* Leaves */}

          <Route path="/Leaves" element={<PrivateRoute><Leaves /></PrivateRoute>} />

          <Route path="/myteam2" element={<PrivateRoute><MyTeamLeave /></PrivateRoute>} />
          <Route path="/manager/tasks" element={<PrivateRoute><ManagerTasks /></PrivateRoute>} />
          <Route path="/hr/tasks" element={<PrivateRoute><HRTasks /></PrivateRoute>} />
          <Route path="/saved-drafts" element={<PrivateRoute><LeavesDraft /></PrivateRoute>} />
          <Route path="/leave-history" element={<PrivateRoute><LeaveHistory /></PrivateRoute>} />

          {/* Travel */}

          <Route path="/Travels" element={<PrivateRoute><Travel /></PrivateRoute>} />
          <Route path="/myteam3" element={<PrivateRoute><MyTeamTravel /></PrivateRoute>} />

          <Route path="/EmployeeHandBook" element={<PrivateRoute><EmployeeHandBook /></PrivateRoute>} />
          <Route path="/EmployeeKnowledgeHub" element={<PrivateRoute><EmployeeKnowledgeHub /></PrivateRoute>} />
          <Route path="/HolidayCalender" element={<PrivateRoute><Holiday /></PrivateRoute>} />

          <Route path="/EmployeeDirectory" element={<PrivateRoute><EmployeeDirectory /></PrivateRoute>} />
          <Route path="/OrgChart" element={<PrivateRoute><OrgChart /></PrivateRoute>} />
          <Route path="/ExitManagement" element={<PrivateRoute><ExitManagement /></PrivateRoute>} />
          <Route path="/HelpDesk" element={<PrivateRoute><HelpDesk /></PrivateRoute>} />
          <Route path="/Payslips" element={<PrivateRoute><Payslips /></PrivateRoute>} />
          <Route path="/Training" element={<PrivateRoute><Training /></PrivateRoute>} />
          <Route path="/Onboarding" element={<PrivateRoute><OnBoardingPage /></PrivateRoute>} />
          <Route path="/ProfileSettings" element={<PrivateRoute><ProfileSettingsPage /></PrivateRoute>} />
          <Route
            path="/employee/:employeeId"
            element={<PrivateRoute><EmployeeDirectoryDetails /></PrivateRoute>}
          />
          {/* Contract Manangement */}
          <Route path="/Projects" element={<PrivateRoute><ProjectPage /></PrivateRoute>} />
          <Route path="/Customers" element={<PrivateRoute><CustomerList /></PrivateRoute>} />
          <Route path="/Sows" element={<PrivateRoute><SowPage /></PrivateRoute>} />
          <Route path="/Allocations" element={<PrivateRoute><AllocationPage /></PrivateRoute>} />

          <Route path="/Notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

          <Route path="/myteamres" element={<PrivateRoute><MyTeamRes /></PrivateRoute>} />
          <Route path="/employee/feedback/form" element={<PublicExitInterviewForm />} />
          <Route path="/preonboarding" element={<Preonboarding />} />
          <Route path="/onboarding/:applicantId" element={<OnboardingForm />} />
          <Route path="/view-preonboarding/:applicantId" element={<ViewPreOnboarding />} />
          <Route path="/finance/preonboarding" element={<PreonboardingFinancePage />} />
          <Route path="/finance/confirmationpage" element={<ConfirmationPage />} />
          <Route path="/finance/hrviewpreonboardingdetails" element={<HRViewPreOnboardingDetails />} />
          <Route path="/onboarding/verify" element={<OnboardingVerify />} />
          <Route path="/Admin" element={<PrivateRoute><AdminAccessPage /></PrivateRoute>} />
          <Route path="/Grievance" element={<PrivateRoute><GrievancePage /></PrivateRoute>} />
          <Route path="/PayrollManagement" element={<PrivateRoute><PayrollManagement /></PrivateRoute>} />
          <Route path="/AllocationsPage" element={<PrivateRoute><Allocations /></PrivateRoute>} />
          <Route path="/CompensationManagement" element={<PrivateRoute><CompensationManagement /></PrivateRoute>} />
          <Route path="/YTDReport" element={<PrivateRoute><YTDReportPage /></PrivateRoute>} />

          <Route path="/documenthub" element={<PrivateRoute>< DocumentHub /></PrivateRoute>} />
          {/* <Route path="/LMS" element={<PrivateRoute><LMSLandingPage /></PrivateRoute>} /> */}
          <Route path="/AssetManagement" element={<PrivateRoute><AssetManagement /></PrivateRoute>} />
          <Route path="/ITDeclaration" element={<PrivateRoute><ITDeclaration /></PrivateRoute>} />
          <Route path="/CompanyLocations" element={<PrivateRoute><CompanyLocations /></PrivateRoute>} />
          <Route path="/AcknowledgePolicies" element={<PrivateRoute><AcknowledgePoliciesPage /></PrivateRoute>} />
          <Route path="/Reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><ScalozAnalyticsHub /></PrivateRoute>} />
          <Route path="/analytics/attendance" element={<PrivateRoute><AttendanceAnalyticsDeep /></PrivateRoute>} />
          <Route path="/analytics/leave" element={<PrivateRoute><AnalyticsComingSoon /></PrivateRoute>} />
          <Route path="/analytics/payroll" element={<PrivateRoute><AnalyticsComingSoon /></PrivateRoute>} />
          <Route path="/analytics/performance" element={<PrivateRoute><AnalyticsComingSoon /></PrivateRoute>} />
          <Route path="/analytics/expense" element={<PrivateRoute><AnalyticsComingSoon /></PrivateRoute>} />
          <Route path="/analytics/workforce" element={<PrivateRoute><AnalyticsComingSoon /></PrivateRoute>} />
        </Routes>
      </SessionTimeoutHandler>
    </Router>
  );
}

export default App;
