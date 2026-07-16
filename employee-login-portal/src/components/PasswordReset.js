
import React from "react";
import { useNavigate } from "react-router-dom";
import "./PasswordReset.css";
 import api from "../api"; 
function PasswordReset() {
  const navigate = useNavigate();

  // Navigate to the login route when the button is clicked
  const handleBackToSignIn = () => {
    navigate("/LoginPage");
  };
 
  return (
    <div className="password-changed-container">
      {/* For mobile, we only show the successful reset content,
          the logo and side image are often omitted for a cleaner look. */}
     
      <div className="right-section">
        {/* Check icon - The image in the provided screenshot is a green circle with a white checkmark. */}
        {/* NOTE: You should ensure that 'image.jpg' is indeed this success icon. */}
        <img
          src={require("../assets/image.jpg")}
          alt="Success Checkmark"
          className="check-image"
        />
       
        <div className="content">
          <h2>Password changed</h2>
          <p>
            Your password has been reset successfully.
            Please wait for 15 minutes before signing in with your new password.
          </p>
          <button onClick={handleBackToSignIn}>Back To Sign In</button>

        </div>
      </div>
    </div>
  );
}

export default PasswordReset;