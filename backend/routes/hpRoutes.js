const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getHPRecords,
  getHPById,
  recordHPPayment,
  getCustomerHistory,
  getAllCustomers,
  deleteHPRecord,
  updateHPRecord,
  getNextHPCode,
} = require("../controllers/hpController");

router.use(protect, authorize("admin", "manager", "cashier", "stockEmployee"));

router.route("/").get(getHPRecords);

router.get("/customers/all", getAllCustomers);
router.get("/customer/:phone/history", getCustomerHistory);
router.get("/next-code", getNextHPCode);

router
  .route("/:id")
  .get(getHPById)
  .put(authorize("admin", "manager"), updateHPRecord)
  .delete(authorize("admin", "manager"), deleteHPRecord);

router.post("/:id/payments", recordHPPayment);

module.exports = router;
