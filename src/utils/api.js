import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - handle gracefully
      const currentPath = window.location.pathname;

      // Only redirect to login if not already on login/register pages
      if (
        !currentPath.includes("/login") &&
        !currentPath.includes("/register")
      ) {
        // Clear auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Show user-friendly message
        if (window.toast) {
          window.toast.error("Session expired. Please log in again.");
        }

        // Small delay before redirect to allow toast to show
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  googleSignIn: (token) => api.post("/auth/google", { token }),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (userData) => api.put("/auth/profile", userData),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post("/bookings", bookingData),
  getAll: (params) => api.get("/bookings", { params }),
  getUserBookings: (params) => api.get("/bookings/user", { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  delete: (id) => api.delete(`/bookings/${id}`),
  getStats: () => api.get("/bookings/stats"),
};

// Contact API
export const contactAPI = {
  submit: (messageData) => api.post("/contact", messageData),
  getAll: (params) => api.get("/contact", { params }),
  getById: (id) => api.get(`/contact/${id}`),
  updateStatus: (id, status) => api.put(`/contact/${id}/status`, status),
  delete: (id) => api.delete(`/contact/${id}`),
  getStats: () => api.get("/contact/stats"),
};

// Breakdown Service API
export const breakdownAPI = {
  create: (requestData) => api.post("/breakdown/request", requestData),
  getMyRequests: () => api.get("/breakdown/my-requests"),
  getAll: (params) => api.get("/breakdown", { params }),
  getById: (id) => api.get(`/breakdown/${id}`),
  updateStatus: (id, status) => api.put(`/breakdown/${id}/status`, status),
  delete: (id) => api.delete(`/breakdown/${id}`),
  getStats: () => api.get("/breakdown/stats"),
};

// Staff API
export const staffAPI = {
  register: (staffData) => api.post("/staff/register", staffData),
  login: (credentials) => api.post("/staff/login", credentials),
  getProfile: () => api.get("/staff/profile"),
  updateProfile: (staffData) => api.put("/staff/profile", staffData),
  getStats: () => api.get("/staff/stats"),
};

// Customer API
export const customerAPI = {
  getStats: () => api.get("/auth/stats"),
};

// Receptionist API
export const receptionistAPI = {
  getAllBookings: (params) => api.get("/bookings", { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    api.put(`/bookings/${id}/status`, { status }),
  getBookingStats: () => api.get("/bookings/stats"),
  getTodayBookings: () => api.get("/bookings/today"),
};

// Service Advisor API
export const serviceAdvisorAPI = {
  getArrivedBookings: () => api.get("/bookings/arrived"),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    api.put(`/bookings/${id}/status`, { status }),
  assignMechanicsToBooking: (bookingId, mechanicIds) =>
    api.put(`/bookings/${bookingId}/assign-mechanics`, { mechanicIds }),
  assignSparePartsToBooking: (bookingId, spareParts) =>
    api.put(`/bookings/${bookingId}/assign-spare-parts`, { spareParts }),
};

// Mechanics API
export const mechanicsAPI = {
  getAvailableMechanics: () => api.get("/mechanics/available"),
  getAllMechanics: (params) => api.get("/mechanics", { params }),
};

// Jobcard API
export const jobcardAPI = {
  getMechanicJobcards: (mechanicId) =>
    api.get(`/jobcards/mechanic/${mechanicId}`),
  getJobcardById: (jobcardId) => api.get(`/jobcards/${jobcardId}`),
  updateJobcardStatus: (jobcardId, status) =>
    api.put(`/jobcards/${jobcardId}/status`, { status }),
};

// Spare Parts API
export const sparePartsAPI = {
  getAllSpareParts: (params) => api.get("/spareparts", { params }),
  getSparePartsCategories: () => api.get("/spareparts/categories"),
};

// Vehicle API
export const vehicleAPI = {
  getUserVehicles: () => api.get("/vehicles"),
  addVehicle: (vehicleData) => api.post("/vehicles", vehicleData),
  getVehicleById: (id) => api.get(`/vehicles/${id}`),
  updateVehicle: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
};

// General API
export const generalAPI = {
  getServices: () => api.get("/users/services"),
  getParts: (params) => api.get("/users/parts", { params }),
  getPartCategories: () => api.get("/users/parts/categories"),
  getPartBrands: () => api.get("/users/parts/brands"),
  getTeam: () => api.get("/users/team"),
  getTestimonials: (params) => api.get("/users/testimonials", { params }),
  getVehicles: () => api.get("/users/vehicles"),
  addVehicle: (vehicleData) => api.post("/users/vehicles", vehicleData),
  updateVehicle: (id, vehicleData) =>
    api.put(`/users/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/users/vehicles/${id}`),
  healthCheck: () => api.get("/health"),
};

export default api;
