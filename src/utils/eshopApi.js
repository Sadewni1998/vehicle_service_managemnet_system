import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with auth token
const eshopApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
eshopApi.interceptors.request.use(
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

export const fetchEshopItems = async () => {
  const res = await axios.get("/api/eshop");
  return res.data.data;
};

export const addEshopItem = async (itemData) => {
  // Check if itemData contains a file object in itemImage
  if (itemData.itemImage instanceof File) {
    const formData = new FormData();
    // Append all fields to FormData
    Object.keys(itemData).forEach((key) => {
      formData.append(key, itemData[key]);
    });

    const res = await eshopApi.post("/eshop", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  }

  const res = await eshopApi.post("/eshop", itemData);
  return res.data.data;
};

export const updateEshopItem = async (id, itemData) => {
  // Check if itemData contains a file object in itemImage
  if (itemData.itemImage instanceof File) {
    const formData = new FormData();
    // Append all fields to FormData
    Object.keys(itemData).forEach((key) => {
      formData.append(key, itemData[key]);
    });

    const res = await eshopApi.put(`/eshop/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  }

  const res = await eshopApi.put(`/eshop/${id}`, itemData);
  return res.data.data;
};

export const deleteEshopItem = async (id) => {
  const res = await axios.delete(`/api/eshop/${id}`);
  return res.data;
};

// Checkout API
export const checkoutOrder = async (checkoutData) => {
  const res = await eshopApi.post("/eshop/checkout", checkoutData);
  return res.data;
};

// Get customer orders
export const getCustomerOrders = async () => {
  const res = await eshopApi.get("/eshop/orders");
  return res.data.data;
};
