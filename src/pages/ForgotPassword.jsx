import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const onEmailSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authAPI.forgotPassword(data.email);
      setEmail(data.email);
      setStep(2);
      toast.success("OTP sent to your email.");
    } catch (error) {
      toast.error("Unable to process request right now. Please try again.");
      console.error("Forgot password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authAPI.verifyOTP(email, data.otp);
      setOtp(data.otp);
      setStep(3);
      toast.success("OTP verified.");
    } catch (error) {
      toast.error("Invalid OTP or expired.");
      console.error("OTP verification error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authAPI.resetPassword(email, otp, data.newPassword);
      toast.success("Password reset successfully. Please login.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast.error("Failed to reset password.");
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center pb-24 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Hybrid Lanka" className="w-24.5 h-12" />
            <h2 className="text-4xl font-bold text-primary-600">
              Hybrid Lanka
            </h2>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {step === 1 && "Reset your password"}
          {step === 2 && "Enter OTP"}
          {step === 3 && "Set New Password"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 &&
            "Enter the email linked to your account and we'll send an OTP."}
          {step === 2 && `Enter the OTP sent to ${email}`}
          {step === 3 && "Enter your new password."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSubmit(onEmailSubmit)}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="input-field"
                    placeholder="name@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-6" onSubmit={handleSubmit(onOtpSubmit)}>
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    type="text"
                    className="input-field"
                    placeholder="Enter 6-digit OTP"
                    {...register("otp", {
                      required: "OTP is required",
                      minLength: {
                        value: 6,
                        message: "OTP must be 6 digits",
                      },
                      maxLength: {
                        value: 6,
                        message: "OTP must be 6 digits",
                      },
                    })}
                  />
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.otp.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form
              className="space-y-6"
              onSubmit={handleSubmit(onPasswordSubmit)}
            >
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    type="password"
                    className="input-field"
                    {...register("newPassword", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    type="password"
                    className="input-field"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (val) => {
                        if (watch("newPassword") != val) {
                          return "Your passwords do NOT match";
                        }
                      },
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Did you remember your password?</p>
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
