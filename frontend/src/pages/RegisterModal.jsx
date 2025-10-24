import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "../styles/RegisterModal.css";

const RegisterModal = ({ close }) => {
  const [role, setRole] = useState("user");
  const [isRegister, setIsRegister] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const endpoint = isRegister ? "register" : "login";

    try {
      const res = await fetch(`http://localhost:5000/api/${endpoint}/${role}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Backend Response:", data);
      setMessage(data.message || "Something went wrong.");

      if (data.success && !isRegister) {
        localStorage.setItem("token", data.token);
        if (role === "user") {
          localStorage.setItem("user", JSON.stringify(data.user));
          close();
          navigate("/user-dashboard");
        } else if (role === "worker") {
          if (data.worker) {
            localStorage.setItem("worker", JSON.stringify(data.worker));
          }
          close();
          navigate("/worker-dashboard");
        }
      } else if (data.success && isRegister) {
        setMessage("Registration successful! Please login.");
        setIsRegister(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Network error. Check backend connection.");
    }
  };

  // ✅ Google login success handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) {
        setMessage("Google login failed: No credentials received.");
        return;
      }

      // Send Google token to backend with role
      const res = await axios.post(`http://localhost:5000/api/auth/google/${role}`, {
        credential,
      });

      const data = res.data;
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(role, JSON.stringify(data[role]));
        setMessage("Google sign-in successful!");
        close();
        if (role === "user") {
          navigate("/user-dashboard");
        } else if (role === "worker") {
          navigate("/worker-dashboard");
        }
      }
    } catch (error) {
      console.error("Google auth error:", error);
      setMessage("Google sign-in failed. Try again.");
    }
  };

  const handleGoogleFailure = () => {
    setMessage("Google sign-in was cancelled or failed.");
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));

    try {
      const res = await fetch(`http://localhost:5000/api/forgot-password/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("OTP sent to your email. Please check your inbox.");
        setIsResetPassword(true);
        setIsForgotPassword(false);
      } else {
        setMessage(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage("Network error. Check backend connection.");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));

    try {
      const res = await fetch(`http://localhost:5000/api/reset-password/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Password reset successfully! Please login.");
        setIsResetPassword(false);
        setIsRegister(false);
      } else {
        setMessage(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage("Network error. Check backend connection.");
    }
  };

  return (
    <div className="modal">
      <>
        {isResetPassword ? (
          <form onSubmit={handleResetPasswordSubmit} className="modal-content">
            <h3>Reset Password as {role}</h3>

            <input name="email" placeholder="Email" required />
            <input name="otp" placeholder="OTP" required />
            <input name="newPassword" type="password" placeholder="New Password" required />

            <button type="submit">Reset Password</button>

            <button
              type="button"
              onClick={() => setIsResetPassword(false)}
            >
              Back to Login
            </button>
            <button type="button" onClick={close}>Close</button>

            {message && (
              <p className={`feedback ${message.includes("failed") ? "error" : ""}`}>
                {message}
              </p>
            )}
          </form>
        ) : isForgotPassword ? (
        <form onSubmit={handleForgotPasswordSubmit} className="modal-content">
          <h3>Forgot Password as {role}</h3>

          <div className="role-toggle">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={role === "user" ? "active" : ""}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setRole("worker")}
              className={role === "worker" ? "active" : ""}
            >
              Worker
            </button>
          </div>

          <input name="email" placeholder="Email" required />

          <button type="submit">Send OTP</button>

          <button
            type="button"
            onClick={() => setIsForgotPassword(false)}
          >
            Back to Login
          </button>
          <button type="button" onClick={close}>Close</button>

          {message && (
            <p className={`feedback ${message.includes("failed") ? "error" : ""}`}>
              {message}
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="modal-content">
          <h3>
            {isRegister ? "Register" : "Login"} as {role}
          </h3>

          <div className="role-toggle">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={role === "user" ? "active" : ""}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setRole("worker")}
              className={role === "worker" ? "active" : ""}
            >
              Worker
            </button>
          </div>

          <input name="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />

          {isRegister && (
            <>
              <input name="name" placeholder="Name" required />
              <input name="mobile" placeholder="Mobile" />
              <input name="location" placeholder="Location" />
              <select name="gender" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input name="area" placeholder="Area" />
              <input name="district" placeholder="District" />
              <input name="profilePicture" type="file" accept="image/*" />
            </>
          )}

          <button type="submit">{isRegister ? "Register" : "Login"}</button>

          {/* --- OAuth Divider --- */}
          <div className="oauth-divider">
            <span>OR</span>
          </div>

          {/* --- Google Login Button --- */}
          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
            />
          </div>

          {!isRegister && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="forgot-password-link"
            >
              Forgot Password?
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Switch to Login" : "Switch to Register"}
          </button>
          <button type="button" onClick={close}>Close</button>

          {message && (
            <p className={`feedback ${message.includes("failed") ? "error" : ""}`}>
              {message}
            </p>
          )}
        </form>
      )}
      </>
    </div>
  );
};

export default RegisterModal;
