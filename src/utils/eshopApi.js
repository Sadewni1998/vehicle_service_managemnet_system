import axios from "axios";

export const fetchEshopItems = async () => {
  const res = await axios.get("/api/eshop");
  return res.data.data;
};

export const addEshopItem = async (itemData) => {
  const res = await axios.post("/api/eshop", itemData);
  return res.data.data;
};

export const updateEshopItem = async (id, itemData) => {
  const res = await axios.put(`/api/eshop/${id}`, itemData);
  return res.data.data;
};

export const deleteEshopItem = async (id) => {
  const res = await axios.delete(`/api/eshop/${id}`);
  return res.data;
};
