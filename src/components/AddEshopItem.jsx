import React, { useState } from "react";
import axios from "axios";

const AddEshopItem = ({ onSuccess }) => {
  const [form, setForm] = useState({
    itemCode: "",
    itemName: "",
    description: "",
    price: 0,
    quantity: 0,
    discountPercentage: 0,
    itemImage: "",
    itemBrand: "",
    itemType: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("/api/eshop", form);
      setSuccess("Item added successfully!");
      setForm({
        itemCode: "",
        itemName: "",
        description: "",
        price: 0,
        quantity: 0,
        discountPercentage: 0,
        itemImage: "",
        itemBrand: "",
        itemType: "",
      });
      if (onSuccess) onSuccess(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error adding item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow-md max-w-xl mx-auto"
    >
      <h2 className="text-xl font-bold mb-4">Add New Item</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Item Code *</label>
          <input
            name="itemCode"
            value={form.itemCode}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Item Name *</label>
          <input
            name="itemName"
            value={form.itemName}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Discount (%)</label>
          <input
            name="discountPercentage"
            type="number"
            value={form.discountPercentage}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="col-span-2">
          <label className="block mb-1">Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Quantity *</label>
          <input
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Price (Rs.) *</label>
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="col-span-2">
          <label className="block mb-1">Item Image URL</label>
          <input
            name="itemImage"
            value={form.itemImage}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Brand *</label>
          <select
            name="itemBrand"
            value={form.itemBrand}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Brand</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
            <option value="Suzuki">Suzuki</option>
            <option value="Ford">Ford</option>
            <option value="Mazda">Mazda</option>
            <option value="Isuzu">Isuzu</option>
            <option value="Subaru">Subaru</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Item Type *</label>
          <select
            name="itemType"
            value={form.itemType}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Type</option>
            <option value="Engine Parts">Engine Parts</option>
            <option value="Break Parts">Break Parts</option>
            <option value="Suspension">Suspension</option>
            <option value="Electrical">Electrical</option>
            <option value="Body Parts">Body Parts</option>
            <option value="Filters">Filters</option>
            <option value="Fluids">Fluids</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Adding..." : "Add Item"}
      </button>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {success && <div className="mt-2 text-green-600">{success}</div>}
    </form>
  );
};

export default AddEshopItem;
