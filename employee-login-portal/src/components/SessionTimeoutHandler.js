import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SessionTimeoutHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutDuration = 15 * 60 * 1000; // 15 minutes
  const timeoutId = useRef(null);

  // 🟦 ROUTES TO EXCLUDE FROM SESSION TIMEOUT
  const excludedRoutes = [
    "/onboarding/verify",
  ];

  // 🟦 Check dynamic route: /onboarding/:applicantId
  const isOnboardingApplicantPage =
    location.pathname.startsWith("/onboarding/") &&
    location.pathname.split("/").length === 3 &&
    !location.pathname.endsWith("verify");

  const isExcluded =
    excludedRoutes.includes(location.pathname) || isOnboardingApplicantPage;

  // Logout function
  const logout = useCallback(() => {
    sessionStorage.clear();
    alert("You have been logged out due to 15 minutes of inactivity.");

    navigate("/LoginPage");
  }, [navigate]);

  // Reset timer
  const resetTimer = useCallback(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(logout, timeoutDuration);
  }, [logout, timeoutDuration]);

  useEffect(() => {
    // 🛑 Skip session timeout completely on excluded routes
    if (isExcluded) {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      return;
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start timer

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [resetTimer, isExcluded]);

  return children;
};

export default SessionTimeoutHandler;
