import React, { useState } from "react";
import { Mail, Lock, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const sendOTP = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("https://nicoindustrial.com/api/user/forgotpassword", { email });

      toast.success("OTP sent. Please check your email for the OTP code");
      setCurrentStep(2);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send OTP";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("https://nicoindustrial.com/api/user/otpvalidate", { email, otp });

      toast.success("OTP verified successfully");
      setCurrentStep(3);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid OTP";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    setIsLoading(true);
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("https://nicoindustrial.com/api/user/updatePasswordAfterOtpValidation", { email, password: newPassword });

      toast.success("Password updated successfully! Redirecting to sign in...");
      navigate("/signin");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    await sendOTP();
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }
    await verifyOTP();
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    await resetPassword();
  };

  const goBack = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700">Step {currentStep} of 3</span>
        <span className="text-sm text-gray-500">
          {currentStep === 1 && "Enter Email"}
          {currentStep === 2 && "Verify OTP"}
          {currentStep === 3 && "Reset Password"}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <form onSubmit={handleEmailSubmit} data-aos="fade-up" className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
        <p className="text-gray-600">Enter your email address and we'll send you an OTP to reset your password.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your email address" />
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              Send OTP
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleOTPSubmit} data-aos="zoom-in" className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
        <p className="text-gray-600">
          We've sent a 6-digit OTP to <strong>{email}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
            Enter OTP
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
            placeholder="000000"
            maxLength="6"
          />
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

        <div className="flex space-x-3">
          <button type="button" onClick={goBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                Verify OTP
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-center">
        <button type="button" className="text-blue-600 hover:text-blue-700 text-sm" onClick={sendOTP}>
          Didn't receive the code? Resend
        </button>
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handlePasswordReset} data-aos="zoom-in" className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
        <p className="text-gray-600">Create a new password for your account</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter new password" />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm new password"
          />
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

        <div className="flex space-x-3">
          <button type="button" onClick={goBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <button type="submit" disabled={isLoading} className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                Reset Password
                <Check className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <ToastContainer />
      <div data-aos="fade-up" className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderProgressBar()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="mt-6 text-center">
          <NavLink to="/signin" className="text-blue-600 hover:text-blue-700 text-sm">
            Back to Sign In
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
