const express = require('express');
const router = express.Router();
const {
  getSuppliers, createSupplier, updateSupplier,
  getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
  getInvoices, createInvoice, payInvoice,
} = require('../controllers/procurementController');
const { authenticate, isAdminOrLibrarian, isStaff } = require('../middleware/auth');
const { uploadInvoice } = require('../config/cloudinary');

// Suppliers
router.get('/suppliers', authenticate, isStaff, getSuppliers);
router.post('/suppliers', authenticate, isAdminOrLibrarian, createSupplier);
router.put('/suppliers/:id', authenticate, isAdminOrLibrarian, updateSupplier);

// Purchase Orders
router.get('/purchase-orders', authenticate, isStaff, getPurchaseOrders);
router.post('/purchase-orders', authenticate, isAdminOrLibrarian, createPurchaseOrder);
router.post('/purchase-orders/:id/receive', authenticate, isStaff, receivePurchaseOrder);

// Invoices
router.get('/invoices', authenticate, isStaff, getInvoices);
router.post('/invoices', authenticate, isAdminOrLibrarian, uploadInvoice.single('pdf'), createInvoice);
router.post('/invoices/:id/pay', authenticate, isAdminOrLibrarian, payInvoice);

module.exports = router;
