const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTransactions,
} = require("../controllers/accountController");

router.use(protect);

// BUG-13: Restrict finance GET endpoints to admin and manager only
router
  .route("/")
  .get(authorize("admin", "manager"), getAccounts)
  .post(authorize("admin"), createAccount);

router
  .route("/:id")
  .put(authorize("admin"), updateAccount)
  .delete(authorize("admin"), deleteAccount);

// BUG-13: Restrict account transactions to admin and manager only
router.get(
  "/:id/transactions",
  authorize("admin", "manager"),
  getAccountTransactions,
);

module.exports = router;
