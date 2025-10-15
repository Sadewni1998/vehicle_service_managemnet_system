import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Car } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useGoogleAuth from "../hooks/useGoogleAuth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const {
    isGoogleLoaded,
    isLoading: isGoogleLoading,
    signInWithGoogle,
  } = useGoogleAuth();

  const onSubmit = async (data) => {
    setIsLoading(true);
    console.log("Login attempt with data:", data);
    const result = await login(data);
    console.log("Login result:", result);

    if (result.success) {
      // Redirect based on user type and role
      if (result.userType === "customer") {
        console.log("Redirecting to customer dashboard");
        navigate("/customer-dashboard");
      } else if (result.userType === "staff") {
        console.log("Staff login successful, role:", result.role);
        // Redirect based on staff role
        if (result.role === "receptionist") {
          console.log("Redirecting to receptionist dashboard");
          navigate("/receptionist-dashboard");
        } else if (result.role === "mechanic") {
          console.log("Redirecting to mechanic dashboard");
          navigate("/mechanic-dashboard");
        } else if (result.role === "service_advisor") {
          console.log("Redirecting to service advisor dashboard");
          navigate("/service-advisor-dashboard");
        } else if (result.role === "manager") {
          console.log("Redirecting to management dashboard");
          navigate("/management-dashboard");
        } else {
          console.log("Unknown role, redirecting to admin");
          // Default staff dashboard or admin
          navigate("/admin");
        }
      }
    } else {
      console.log("Login failed:", result.error);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const googleToken = await signInWithGoogle();
      const result = await googleSignIn(googleToken);
      if (result.success) {
        navigate("/customer-dashboard");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Hybrid Lanka" className="w-24.5 h-12" />
            <h2 className="text-4xl font-bold text-primary-600">
              Hybrid Lanka
            </h2>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in
          </h2>
          <p className="mt-2 mb-6 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create an account
            </Link>
          </p>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="name@example.com"
                  title="Enter a valid email, e.g., name@example.com"
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input-field pr-10"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!isGoogleLoaded || isGoogleLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Sign in with Google</span>
                {isGoogleLoading ? (
                  <span className="text-sm font-semibold">Signing in...</span>
                ) : (
                  <span className="text-sm font-semibold">Google</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
