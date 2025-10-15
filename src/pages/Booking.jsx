import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Car, Wrench, CheckCircle, AlertCircle } from "lucide-react";
import { bookingsAPI, authAPI, vehicleAPI } from "../utils/api";
import {
  unicodeNameRegex,
  sanitizeNameInput,
  sanitizePhoneInput,
  tenDigitPhoneRegex,
} from "../utils/validators";
import { useAuth } from "../context/AuthContext";
// Debug components removed for production

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const minDate = `${yyyy}-${mm}-${dd}`;

const timeSlots = [
  "07:30 AM - 09:30 AM",
  "09:30 AM - 11:30 AM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 07:30 PM",
];

const Booking = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingAvailability, setBookingAvailability] = useState({
    isAvailable: true,
    currentCount: 0,
    limit: 8,
    remainingSlots: 8,
    message: "",
  });
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const [timeSlotAvailability, setTimeSlotAvailability] = useState({
    availableTimeSlots: [],
    bookedTimeSlots: [],
    isLoading: true,
  });
  const [selectedDate, setSelectedDate] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      selected_vehicle: "",
    },
  });

  // Check booking availability on component mount
  useEffect(() => {
    console.log("🚗 Booking component mounted. Auth state:", {
      isAuthenticated,
      user,
    });
    checkBookingAvailability();
    if (isAuthenticated && user) {
      console.log("🚗 User is authenticated, fetching vehicles...");
      fetchUserVehicles();
    } else {
      console.log("🚗 User not authenticated or user data missing");
    }
  }, [isAuthenticated, user]);

  // Debug vehicles state changes
  useEffect(() => {
    console.log("🚗 Vehicles state changed:", {
      vehiclesCount: vehicles.length,
      vehicles: vehicles,
      isLoadingVehicles: isLoadingVehicles,
    });
  }, [vehicles, isLoadingVehicles]);

  // Auto-populate customer data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setValue("name", user.name || "");
      // Sanitize phone in case stored value contains spaces or symbols
      setValue("phone_number", sanitizePhoneInput(user.phone || ""));
    }
  }, [isAuthenticated, user, setValue]);

  // Fetch user vehicles
  const fetchUserVehicles = async () => {
    console.log("🚗 Fetching user vehicles...", {
      isAuthenticated,
      user,
      token: localStorage.getItem("token") ? "Present" : "Missing",
    });

    try {
      setIsLoadingVehicles(true);
      const response = await vehicleAPI.getUserVehicles();
      console.log("🚗 Vehicle API response:", response);

      // Check response structure
      if (!response) {
        console.error("❌ No response from vehicle API");
        setVehicles([]);
        return;
      }

      if (!response.data) {
        console.error("❌ No data in vehicle API response");
        setVehicles([]);
        return;
      }

      const vehiclesData = response.data?.data || response.data || [];
      console.log("🚗 Processed vehicles data:", vehiclesData);
      console.log(
        "🚗 Vehicles data type:",
        typeof vehiclesData,
        Array.isArray(vehiclesData)
      );

      if (Array.isArray(vehiclesData)) {
        setVehicles(vehiclesData);
        console.log(
          "✅ Vehicles set successfully:",
          vehiclesData.length,
          "vehicles"
        );
      } else {
        console.error("❌ Vehicles data is not an array:", vehiclesData);
        setVehicles([]);
      }
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
      console.error("❌ Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error("Failed to load your vehicles");
      setVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Handle vehicle selection
  const handleVehicleSelection = (vehicleId) => {
    console.log("🚗 Vehicle selection changed:", vehicleId);

    if (!vehicleId) {
      setSelectedVehicle(null);
      setValue("selected_vehicle", "", { shouldValidate: true });
      setValue("vehicle_number", "");
      setValue("vehicle_type", "");
      setValue("vehicle_brand", "");
      setValue("vehicle_brand_model", "");
      return;
    }

    // Try both vehicleId and id fields for compatibility
    const idNum = Number(vehicleId);
    const vehicle = vehicles.find(
      (v) =>
        v.vehicleId == vehicleId ||
        v.vehicleId == idNum ||
        v.id == vehicleId ||
        v.id == idNum
    );
    console.log("🚗 Selected vehicle found:", vehicle);

    if (vehicle) {
      setSelectedVehicle(vehicle);
      // also set the selected_vehicle form field explicitly to keep RHF in sync
      setValue("selected_vehicle", String(vehicle.vehicleId || vehicle.id), {
        shouldValidate: true,
      });
      setValue("vehicle_number", vehicle.vehicleNumber);
      setValue("vehicle_type", vehicle.type);
      setValue("vehicle_brand", vehicle.brand);
      setValue("vehicle_brand_model", vehicle.model);
      setValue("manufactured_year", vehicle.manufactureYear);
      setValue("fuel_type", vehicle.fuelType);
      setValue("transmission_type", vehicle.transmission);

      console.log("🚗 Vehicle data set:", {
        vehicleNumber: vehicle.vehicleNumber,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
      });
    }
  };

  // Watch for date changes to update time slot availability
  const watchedDate = watch("service_date");
  useEffect(() => {
    if (watchedDate) {
      setSelectedDate(watchedDate);
      checkTimeSlotAvailability(watchedDate);
    }
  }, [watchedDate]);

  const checkBookingAvailability = async () => {
    try {
      setIsCheckingAvailability(true);
      const response = await fetch(
        "http://localhost:5000/api/bookings/availability"
      );
      const data = await response.json();
      setBookingAvailability(data);
    } catch (error) {
      console.error("Error checking booking availability:", error);
      toast.error("Failed to check booking availability");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const checkTimeSlotAvailability = async (date) => {
    try {
      setTimeSlotAvailability((prev) => ({ ...prev, isLoading: true }));
      const response = await fetch(
        `http://localhost:5000/api/bookings/time-slots?date=${date}`
      );
      const data = await response.json();
      setTimeSlotAvailability({
        availableTimeSlots: data.availableTimeSlots || [],
        bookedTimeSlots: data.bookedTimeSlots || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error checking time slot availability:", error);
      toast.error("Failed to check time slot availability");
      setTimeSlotAvailability((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Helper function to check if a time slot is in the past
  const isTimeSlotInPast = (timeSlot, selectedDate) => {
    if (!selectedDate || !timeSlot) return false;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // Get today's date as YYYY-MM-DD

    // If selected date is in the future, no time slots are in the past
    if (selectedDate > todayStr) return false;

    // If selected date is in the past, all time slots are in the past
    if (selectedDate < todayStr) return true;

    // If selected date is today, check if the time slot has passed
    if (selectedDate === todayStr) {
      const currentTime = today.getHours() * 60 + today.getMinutes();

      // Extract start time from time slot (e.g., "07:30 AM - 09:00 AM" -> "07:30 AM")
      const startTimeStr = timeSlot.split(" - ")[0];
      const [time, period] = startTimeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      let slotStartMinutes = hours * 60 + minutes;

      // Convert to 24-hour format
      if (period === "PM" && hours !== 12) {
        slotStartMinutes += 12 * 60;
      } else if (period === "AM" && hours === 12) {
        slotStartMinutes -= 12 * 60;
      }

      return currentTime > slotStartMinutes;
    }

    return false;
  };

  const onSubmit = async (data) => {
    // Check if booking is still available before submitting
    if (!bookingAvailability.isAvailable) {
      toast.error(
        "Booking limit reached for today. Please try again tomorrow."
      );
      return;
    }

    // Check if a vehicle is selected
    if (!selectedVehicle) {
      toast.error("Please select a vehicle for the service.");
      return;
    }

    // Check if selected time slot is in the past
    if (isTimeSlotInPast(data.time_slots, data.service_date)) {
      toast.error(
        "The selected time slot is in the past. Please choose a future time slot."
      );
      return;
    }

    // Check if selected time slot is still available
    if (timeSlotAvailability.bookedTimeSlots.includes(data.time_slots)) {
      toast.error(
        "The selected time slot is no longer available. Please choose another time slot."
      );
      // Refresh time slot availability
      if (selectedDate) {
        await checkTimeSlotAvailability(selectedDate);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(
        "🚀 Submitting booking for vehicle:",
        selectedVehicle?.vehicleNumber
      );

      // Transform form data to match backend expectations
      const bookingData = {
        name: data.name,
        phone: data.phone_number,
        vehicleNumber: data.vehicle_number,
        vehicleType: data.vehicle_type,
        fuelType: data.fuel_type,
        vehicleBrand: data.vehicle_brand,
        vehicleBrandModel: data.vehicle_brand_model,
        manufacturedYear: data.manufactured_year,
        transmissionType: data.transmission_type,
        bookingDate: data.service_date,
        timeSlot: data.time_slots,
        serviceTypes: data.services || [],
        specialRequests: data.special_requests,
      };

      // Validate that vehicle data is present
      if (!bookingData.vehicleNumber || !bookingData.vehicleType) {
        console.error("❌ Missing vehicle data in booking submission");
        toast.error("Please select a vehicle before submitting");
        setIsSubmitting(false);
        return;
      }

      const response = await bookingsAPI.create(bookingData);
      console.log("✅ Booking created successfully:", response);
      toast.success("Booking submitted successfully!");
      reset();

      // Refresh booking availability and time slots after successful booking
      await checkBookingAvailability();
      if (selectedDate) {
        await checkTimeSlotAvailability(selectedDate);
      }
    } catch (error) {
      console.error("❌ Booking submission failed:", error);

      const message =
        error.response?.data?.message ||
        "Failed to submit booking. Please try again.";
      toast.error(message);

      // If it's a limit reached error, refresh availability
      if (error.response?.status === 429) {
        await checkBookingAvailability();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-4xl font-bold mb-4">Booking</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> /{" "}
              <span className="text-primary-400">Booking</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Services Info */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <CheckCircle className="w-12 h-12 text-primary-600" />,
                title: "Quality Servicing",
                description:
                  "At Hybrid Lanka, we deliver top-notch service with skilled technicians and advanced tools, ensuring meticulous care for every vehicle.",
              },
              {
                icon: <Wrench className="w-12 h-12 text-primary-600" />,
                title: "Expert Workers",
                description:
                  "Our expert technicians are highly experienced and specially trained to handle all automotive needs with the latest tools and techniques.",
              },
              {
                icon: <Car className="w-12 h-12 text-primary-600" />,
                title: "Modern Equipment",
                description:
                  "We use state-of-the-art tools and technology to deliver top-quality service with precise diagnostics and efficient repairs.",
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

      {/* Booking Form */}
      <section className="section-padding bg-gray-900">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold text-white mb-6">
                Certified and Award Winning Car Repair Service Provider
              </h1>
              <p className="text-white text-lg leading-relaxed">
                Hybrid Lanka is a certified, award-winning car repair service
                provider committed to excellence. We have a team of skilled
                technicians equipped with the latest tools and technology to
                provide top-quality repairs and maintenance. Our dedication to
                customer satisfaction and high standards of service has earned
                us numerous awards and certifications in the automotive
                industry.
              </p>
            </div>

            {/* Right Side - Form */}
            <div className="bg-primary-600 p-8 rounded-lg">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Book For A Service
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                    />
                    {errors.name && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
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
                    />
                    {errors.phone_number && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.phone_number.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <select
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white bg-white text-gray-900"
                      {...register("selected_vehicle", {
                        required: "Please select a vehicle",
                        onChange: (e) => handleVehicleSelection(e.target.value),
                      })}
                      defaultValue=""
                      disabled={isLoadingVehicles || !isAuthenticated}
                    >
                      <option value="" disabled>
                        {!isAuthenticated
                          ? "Please log in first"
                          : isLoadingVehicles
                          ? "Loading vehicles..."
                          : vehicles.length === 0
                          ? "No vehicles found - Add vehicles first"
                          : `Select Your Vehicle (${vehicles.length} available)`}
                      </option>
                      {vehicles.map((vehicle) => (
                        <option
                          key={vehicle.vehicleId || vehicle.id}
                          value={String(vehicle.vehicleId || vehicle.id)}
                        >
                          {vehicle.vehicleNumber || vehicle.licenseNumber}
                        </option>
                      ))}
                    </select>
                    {errors.selected_vehicle && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.selected_vehicle.message}
                      </p>
                    )}
                    {!isAuthenticated && (
                      <div className="text-yellow-200 text-sm mt-1">
                        <p>Please log in to see your vehicles.</p>
                      </div>
                    )}
                    {isAuthenticated &&
                      vehicles.length === 0 &&
                      !isLoadingVehicles && (
                        <div className="text-yellow-200 text-sm mt-1">
                          <p>No vehicles found.</p>
                          <p>
                            Please{" "}
                            <a
                              href="/customer-dashboard"
                              className="underline hover:text-yellow-100"
                            >
                              add a vehicle in your dashboard
                            </a>{" "}
                            first.
                          </p>
                        </div>
                      )}

                    {/* Hidden inputs for vehicle details */}
                    <input type="hidden" {...register("vehicle_number")} />
                    <input type="hidden" {...register("vehicle_type")} />
                    <input type="hidden" {...register("vehicle_brand")} />
                    <input type="hidden" {...register("vehicle_brand_model")} />
                    <input type="hidden" {...register("manufactured_year")} />
                    <input type="hidden" {...register("fuel_type")} />
                    <input type="hidden" {...register("transmission_type")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date input */}
                  <div>
                    <input
                      type="date"
                      placeholder="Service Date"
                      className="block w-full h-[48px] px-4 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-white appearance-none"
                      min={minDate}
                      {...register("service_date", {
                        required: "Service date is required",
                      })}
                    />
                    {errors.service_date && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.service_date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <select
                      className="block w-full h-[48px] px-4 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-white appearance-none"
                      defaultValue=""
                      {...register("time_slots", {
                        required: "Time slot is required",
                        validate: (value) => {
                          if (!selectedDate)
                            return "Please select a date first";
                          if (isTimeSlotInPast(value, selectedDate)) {
                            return "This time slot is in the past";
                          }
                          if (
                            timeSlotAvailability.bookedTimeSlots.includes(value)
                          ) {
                            return "This time slot is no longer available";
                          }
                          return true;
                        },
                      })}
                      disabled={!selectedDate || timeSlotAvailability.isLoading}
                    >
                      <option value="" disabled hidden>
                        {!selectedDate
                          ? "Select Date First"
                          : timeSlotAvailability.isLoading
                          ? "Loading time slots..."
                          : "Select Time Slot"}
                      </option>
                      {timeSlots.map((slot) => {
                        const isAvailable =
                          timeSlotAvailability.availableTimeSlots.includes(
                            slot
                          );
                        const isBooked =
                          timeSlotAvailability.bookedTimeSlots.includes(slot);
                        const isInPast = isTimeSlotInPast(slot, selectedDate);
                        const isDisabled = isBooked || isInPast;

                        let statusText = "";
                        if (isInPast) {
                          statusText = "(Past)";
                        } else if (isBooked) {
                          statusText = "(Booked)";
                        } else if (isAvailable) {
                          statusText = "(Available)";
                        }

                        return (
                          <option
                            key={slot}
                            value={slot}
                            disabled={isDisabled}
                            className={
                              isInPast
                                ? "text-gray-500 bg-gray-200"
                                : isBooked
                                ? "text-gray-400 bg-gray-100"
                                : ""
                            }
                          >
                            {slot} {statusText}
                          </option>
                        );
                      })}
                    </select>
                    {errors.time_slots && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.time_slots.message}
                      </p>
                    )}
                  </div>
                </div>

                {/*Services Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="fullservice"
                        {...register("services")}
                      />
                      <span>Full Service</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="engine"
                        {...register("services")}
                      />
                      <span>Engine Servicing</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="transmission"
                        {...register("services")}
                      />
                      <span>Transmission Service</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="oil"
                        {...register("services")}
                      />
                      <span>Oil & Filter Service</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="wash"
                        {...register("services")}
                      />
                      <span>Body Wash</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="diagnostic"
                        {...register("services")}
                      />
                      <span>Diagnostic Test</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="tire"
                        {...register("services")}
                      />
                      <span>Wheel Alignment</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value="vacuum"
                        {...register("services")}
                      />
                      <span>Vacuum Cleaning</span>
                    </label>
                  </div>
                </div>

                <div>
                  <textarea
                    placeholder="Special Requests"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                    {...register("special_requests")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !bookingAvailability.isAvailable ||
                    isCheckingAvailability ||
                    !selectedDate ||
                    timeSlotAvailability.isLoading
                  }
                  className={`w-full font-semibold py-4 px-6 rounded-lg transition-colors duration-300 ${
                    !bookingAvailability.isAvailable ||
                    isCheckingAvailability ||
                    !selectedDate ||
                    timeSlotAvailability.isLoading
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-blue-900 text-white hover:bg-white hover:text-red-600"
                  } disabled:opacity-50`}
                >
                  {isCheckingAvailability || timeSlotAvailability.isLoading
                    ? "Checking Availability..."
                    : !bookingAvailability.isAvailable
                    ? "Booking Unavailable"
                    : !selectedDate
                    ? "Select Date First"
                    : isSubmitting
                    ? "Booking..."
                    : "Book Now"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Debug component removed for production */}
    </div>
  );
};

export default Booking;
