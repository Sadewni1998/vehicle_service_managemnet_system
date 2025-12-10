const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const {
  ensureAuthenticated,
  checkRole,
} = require("../middleware/authMiddleware");

router.get("/", serviceController.getAllServices);
router.post(
  "/",
  ensureAuthenticated,
  checkRole(["manager"]),
  serviceController.createService
);
router.put(
  "/:id",
  ensureAuthenticated,
  checkRole(["manager"]),
  serviceController.updateService
);
router.delete(
  "/:id",
  ensureAuthenticated,
  checkRole(["manager"]),
  serviceController.deleteService
);

module.exports = router;
