const db = require("../config/db");

exports.getAllServices = async (req, res) => {
  try {
    const [services] = await db.query("SELECT * FROM services");
    // Map DB columns to frontend properties
    const mappedServices = services.map((service) => ({
      id: service.serviceId,
      name: service.serviceName,
      charge: parseFloat(service.price),
      discount: parseFloat(service.discount || 0),
    }));
    res.json(mappedServices);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Server error fetching services" });
  }
};

exports.createService = async (req, res) => {
  const { name, charge, discount } = req.body;
  if (!name || !charge) {
    return res
      .status(400)
      .json({ message: "Service name and charge are required" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO services (serviceName, price, discount) VALUES (?, ?, ?)",
      [name, charge, discount || 0]
    );
    res.status(201).json({
      message: "Service created",
      serviceId: result.insertId,
      service: {
        id: result.insertId,
        name,
        charge,
        discount: discount || 0,
      },
    });
  } catch (error) {
    console.error("Error creating service:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Service name already exists" });
    }
    res.status(500).json({ message: "Server error creating service" });
  }
};

exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { name, charge, discount } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE services SET serviceName = ?, price = ?, discount = ? WHERE serviceId = ?",
      [name, charge, discount || 0, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service updated" });
  } catch (error) {
    console.error("Error updating service:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Service name already exists" });
    }
    res.status(500).json({ message: "Server error updating service" });
  }
};

exports.deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM services WHERE serviceId = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service deleted" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error deleting service" });
  }
};
