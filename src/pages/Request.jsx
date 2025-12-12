import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Car,
  Wrench,
  CheckCircle,
  Phone,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react";
import { breakdownAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  unicodeNameRegex,
  sanitizeNameInput,
  sanitizePhoneInput,
  tenDigitPhoneRegex,
} from "../utils/validators";

const Request = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [distance, setDistance] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });

  // Shop location (Hybrid Lanka, Piliyandala)
  const SHOP_LOCATION = {
    latitude: 6.796387128410733,
    longitude: 79.94012391349249,
  };

  // Pricing Configuration (LKR)
  const PRICING = {
    BASE_FEE: 1500,
    PER_KM_RATE: 120,
    NIGHT_MULTIPLIER: 1.5, // 10 PM to 6 AM
  };

  const calculateCost = (dist, type) => {
    if (!dist) return null;

    const currentHour = new Date().getHours();
    const isNight = currentHour >= 22 || currentHour < 6;

    let cost = PRICING.BASE_FEE + parseFloat(dist) * PRICING.PER_KM_RATE;

    // Apply night multiplier
    if (isNight) {
      cost *= PRICING.NIGHT_MULTIPLIER;
    }

    return Math.round(cost / 100) * 100; // Round to nearest 100
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(2); // Return distance with 2 decimal places
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const { user, isAuthenticated, isCustomer } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm();

  const selectedEmergencyType = watch("emergency_type");

  // Update cost when emergency type changes
  useEffect(() => {
    if (distance) {
      const cost = calculateCost(distance);
      setEstimatedCost(cost);
    }
  }, [distance, selectedEmergencyType]);

  // Prefill name and phone when user is logged in as a customer
  useEffect(() => {
    if (isAuthenticated && isCustomer && user) {
      if (user.name) setValue("name", user.name);
      if (user.phone) setValue("phone_number", user.phone);
    }
  }, [isAuthenticated, isCustomer, user, setValue]);

  const onSubmit = async (data) => {
    // Check if location is available
    if (!coordinates.latitude || !coordinates.longitude) {
      toast.error("Please get your current location before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      // Map form data to backend expected format for public requests
      const requestData = {
        name: data.name,
        phone: data.phone_number,
        vehicleNumber: String(data.vehicle_number || "").toUpperCase(),
        vehicleType: data.vehicle_type,
        emergencyType: data.emergency_type,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        problemDescription: data.problem_description,
        additionalInfo: data.additional_info || "",
        price: estimatedCost, // Send the calculated estimated cost
      };

      const response = await breakdownAPI.create(requestData);
      toast.success("Breakdown service request submitted successfully!");
      reset();
      setCoordinates({ latitude: null, longitude: null });
      setDistance(null);
      setEstimatedCost(null);
      // Redirect to Customer Dashboard Breakdown Requests tab
      navigate("/customer-dashboard?tab=breakdown-requests");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to submit breakdown request. Please try again.";
      toast.error(message);
      console.error("Breakdown request error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Calculate distance from shop
          const dist = calculateDistance(
            SHOP_LOCATION.latitude,
            SHOP_LOCATION.longitude,
            latitude,
            longitude
          );
          setDistance(dist);

          // Use Google Maps Geocoding API to get address
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY"
            }`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch address");
          }

          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const address = data.results[0].formatted_address;
            setValue("location", address);
            setCoordinates({ latitude, longitude });
            toast.success("Location detected and filled automatically!");
          } else {
            // Fallback to coordinates if address not found
            setValue("location", `${latitude}, ${longitude}`);
            setCoordinates({ latitude, longitude });
            toast.success("Location coordinates detected!");
          }
        } catch (error) {
          console.error("Error getting address:", error);
          // Fallback to coordinates
          const { latitude, longitude } = position.coords;
          setValue("location", `${latitude}, ${longitude}`);
          setCoordinates({ latitude, longitude });
          toast.success("Location coordinates detected!");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to retrieve your location. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }

        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const vehicleTypes = [
    "Wagon",
    "Sedan",
    "SUV",
    "Hatchback",
    "Pickup/ Double Cab",
    "Jeep/ Crossover",
    "Mini Car/ Kei car",
    "Van",
  ];
  const emergencyTypes = [
    "Engine Failure",
    "Battery Dead",
    "Flat Tire",
    "Accident",
    "Overheating",
    "Transmission Issue",
    "Electrical Problem",
    "Other",
  ];

  return (
    <div>
      {/* Page Header */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: "url(/img/carousel-bg-1.jpg)" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Breakdown Service</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> /{" "}
              <span className="text-primary-400">Breakdown Service</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Emergency Info */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Clock className="w-12 h-12 text-red-600" />,
                title: "24/7 Emergency Service",
                description:
                  "Our breakdown service is available 24/7 to help you when you need it most. We understand that breakdowns don't happen on schedule.",
              },
              {
                icon: <MapPin className="w-12 h-12 text-primary-600" />,
                title: "Quick Response",
                description:
                  "We provide rapid response to your location with our mobile service units equipped with all necessary tools and parts.",
              },
              {
                icon: <Wrench className="w-12 h-12 text-primary-600" />,
                title: "Expert Technicians",
                description:
                  "Our certified technicians are trained to handle all types of vehicle breakdowns and will get you back on the road safely.",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="flex p-8 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex-shrink-0 mr-6">{service.icon}</div>
                <div>
                  <h5 className="text-xl font-semibold mb-3">
                    {service.title}
                  </h5>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <a
                    href="#"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Read More
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown Request Form */}
      <section className="section-padding bg-gray-900">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold text-white mb-6">
                Emergency Breakdown Service
              </h1>
              <p className="text-white text-lg leading-relaxed mb-6">
                When your vehicle breaks down, you need reliable help fast. Our
                emergency breakdown service provides 24/7 roadside assistance
                with certified technicians who can diagnose and repair most
                issues on the spot. We're equipped with mobile service units and
                genuine parts to get you back on the road quickly and safely.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-white">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                  <span>24/7 Emergency Response</span>
                </div>
                <div className="flex items-center text-white">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                  <span>Mobile Service Units</span>
                </div>
                <div className="flex items-center text-white">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                  <span>Certified Technicians</span>
                </div>
                <div className="flex items-center text-white">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                  <span>Genuine Parts Available</span>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="bg-primary-600 p-8 rounded-lg">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Request Breakdown Service
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Name with Initials"
                    className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                    inputMode="text"
                    aria-label="Name with Initials"
                    title="Letters only. Allowed separators: space, hyphen (-), apostrophe ('), and period (.)"
                    {...register("name", {
                      required: "Name is required",
                      validate: (v) =>
                        unicodeNameRegex.test(v || "") ||
                        "Use letters only; separators allowed: space, hyphen (-), apostrophe ('), period (.)",
                      onChange: (e) => {
                        const sanitized = sanitizeNameInput(e.target.value);
                        if (sanitized !== e.target.value)
                          e.target.value = sanitized;
                      },
                    })}
                    defaultValue={
                      isAuthenticated && isCustomer ? user?.name || "" : ""
                    }
                    readOnly={isAuthenticated && isCustomer && !!user?.name}
                  />
                  {errors.name && (
                    <p className="text-red-200 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="tel"
                      placeholder="0712345678"
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      inputMode="numeric"
                      maxLength={10}
                      title="Enter 10 digits, e.g., 0712345678"
                      {...register("phone_number", {
                        required: "Phone number is required",
                        validate: (v) =>
                          tenDigitPhoneRegex.test((v || "").trim()) ||
                          "Phone number must be exactly 10 digits",
                        onChange: (e) => {
                          const sanitized = sanitizePhoneInput(e.target.value);
                          if (sanitized !== e.target.value)
                            e.target.value = sanitized;
                        },
                      })}
                      defaultValue={
                        isAuthenticated && isCustomer ? user?.phone || "" : ""
                      }
                      readOnly={isAuthenticated && isCustomer && !!user?.phone}
                    />
                    {errors.phone_number && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.phone_number.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Vehicle Number"
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      {...register("vehicle_number", {
                        required: "Vehicle number is required",
                      })}
                    />
                    {errors.vehicle_number && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.vehicle_number.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      defaultValue=""
                      {...register("vehicle_type", {
                        required: "Vehicle type is required",
                      })}
                    >
                      <option value="" disabled hidden>
                        Vehicle Type
                      </option>
                      {vehicleTypes.map((type) => (
                        <option key={type} value={type.toLowerCase()}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.vehicle_type && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.vehicle_type.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <select
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      defaultValue=""
                      {...register("emergency_type", {
                        required: "Emergency type is required",
                      })}
                    >
                      <option value="" disabled hidden>
                        Type of Emergency
                      </option>
                      {emergencyTypes.map((type) => (
                        <option key={type} value={type.toLowerCase()}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.emergency_type && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.emergency_type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Location (Street Address, City)"
                      className="w-full px-4 py-3 pr-12 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      {...register("location", {
                        required: "Location is required",
                      })}
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
                      title="Get current location"
                    >
                      {isGettingLocation ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Navigation className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.location && (
                    <p className="text-red-200 text-sm mt-1">
                      {errors.location.message}
                    </p>
                  )}
                  <p className="text-gray-300 text-xs mt-1">
                    Click the location icon to automatically detect your current
                    location
                  </p>
                  {distance && (
                    <div className="mt-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">
                          Distance from shop:
                        </span>
                        <span className="text-white font-semibold">
                          {distance} km
                        </span>
                      </div>

                      <div className="mb-2 text-right">
                        <a
                          href={`https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 text-xs hover:text-blue-300 inline-flex items-center transition-colors"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Verify location on Google Maps
                        </a>
                      </div>

                      {parseFloat(distance) > 500 && (
                        <div className="p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm mt-2 flex items-start">
                          <span className="mr-2">⚠️</span>
                          <span>
                            You appear to be {distance} km away. Please check
                            the map link above to verify your detected location.
                            We only service within Sri Lanka.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <textarea
                    placeholder="Describe the problem or symptoms"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                    {...register("problem_description", {
                      required: "Problem description is required",
                    })}
                  />
                  {errors.problem_description && (
                    <p className="text-red-200 text-sm mt-1">
                      {errors.problem_description.message}
                    </p>
                  )}
                </div>

                <div>
                  <textarea
                    placeholder="Additional Information (Optional)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                    {...register("additional_info")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-900 text-white font-semibold py-4 px-6 rounded-lg 
                            transition-colors duration-300 
                            hover:bg-white hover:text-red-600 
                            disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Submitting Request..."
                    : "Request Emergency Service"}
                </button>

                {estimatedCost && (
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-300 mb-1">Estimated Cost</p>
                    <p className="text-green-400 font-bold text-2xl">
                      LKR {estimatedCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      *Final cost may vary based on actual inspection and
                      additional parts required.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact Info */}
      <section className="section-padding bg-red-50">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Emergency Contact
            </h2>
            <p className="text-gray-600 text-lg">
              For immediate assistance, call our emergency hotline
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Phone className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Emergency Hotline</h3>
              <p className="text-2xl font-bold text-red-600">011-234-5678</p>
              <p className="text-gray-600">Available 24/7</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Service Area</h3>
              <p className="text-lg font-semibold text-primary-600">
                Colombo & Suburbs
              </p>
              <p className="text-gray-600">Within 30 minutes</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Clock className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Response Time</h3>
              <p className="text-lg font-semibold text-green-600">
                15-30 Minutes
              </p>
              <p className="text-gray-600">Average response</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Request;
