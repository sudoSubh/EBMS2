const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── SUPPLIERS ──────────────────────────────────────────────────────────────

const getSuppliers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = {};
  if (search) query.name = { $regex: search, $options: 'i' };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [suppliers, total] = await Promise.all([
    Supplier.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
    Supplier.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, suppliers, { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) });
});

const createSupplier = asyncHandler(async (req, res) => {
  const count = await Supplier.countDocuments();
  const supplier = await Supplier.create({
    ...req.body,
    code: req.body.code || `SUP-${String(count + 1).padStart(4, '0')}`,
  });
  return ApiResponse.created(res, supplier);
});

const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) return ApiResponse.notFound(res, 'Supplier not found');
  return ApiResponse.success(res, supplier);
});

// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

const getPurchaseOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [orders, total] = await Promise.all([
    PurchaseOrder.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit))
      .populate('supplier', 'name code').populate('createdBy', 'name'),
    PurchaseOrder.countDocuments(query),
  ]);
  return ApiResponse.paginated(res, orders, { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) });
});

const createPurchaseOrder = asyncHandler(async (req, res) => {
  const count = await PurchaseOrder.countDocuments();
  const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const subtotal = req.body.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = req.body.tax || 0;
  const discount = req.body.discount || 0;

  const order = await PurchaseOrder.create({
    ...req.body,
    poNumber,
    subtotal,
    totalAmount: subtotal + tax - discount,
    createdBy: req.user._id,
  });

  return ApiResponse.created(res, order);
});

const receivePurchaseOrder = asyncHandler(async (req, res) => {
  const { receivedItems } = req.body; // [{ itemIndex, receivedQuantity }]
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Purchase order not found');

  for (const received of receivedItems) {
    const item = order.items[received.itemIndex];
    if (!item) continue;

    item.receivedQuantity = (item.receivedQuantity || 0) + received.receivedQuantity;

    // Create book copies if book is linked
    if (item.book) {
      const book = await Book.findById(item.book);
      for (let i = 0; i < received.receivedQuantity; i++) {
        const copyCount = await BookCopy.countDocuments({ book: item.book });
        const copy = await BookCopy.create({
          book: item.book,
          copyNumber: `${item.isbn || item.book.toString().slice(-6)}-${String(copyCount + 1).padStart(3, '0')}`,
          purchaseDate: new Date(),
          purchasePrice: item.unitPrice,
          purchaseOrder: order._id,
          condition: 'new',
        });
      }
      await Book.findByIdAndUpdate(item.book, {
        $inc: {
          totalCopies: received.receivedQuantity,
          availableCopies: received.receivedQuantity,
        },
      });
    }
  }

  const allReceived = order.items.every((item) => item.receivedQuantity >= item.quantity);
  const anyReceived = order.items.some((item) => (item.receivedQuantity || 0) > 0);

  order.status = allReceived ? 'received' : anyReceived ? 'partial' : order.status;
  if (allReceived) order.deliveredDate = new Date();
  await order.save();

  await Supplier.findByIdAndUpdate(order.supplier, { $inc: { totalOrders: 1 } });

  return ApiResponse.success(res, order, 'Order updated with received items');
});

// ─── INVOICES ─────────────────────────────────────────────────────────────────

const getInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [invoices, total] = await Promise.all([
    Invoice.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit))
      .populate('supplier', 'name').populate('purchaseOrder', 'poNumber'),
    Invoice.countDocuments(query),
  ]);
  return ApiResponse.paginated(res, invoices, { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) });
});

const createInvoice = asyncHandler(async (req, res) => {
  const invoiceData = { ...req.body, createdBy: req.user._id };
  if (req.file) {
    invoiceData.pdfUrl = req.file.path;
    invoiceData.pdfPublicId = req.file.filename;
  }
  const invoice = await Invoice.create(invoiceData);
  return ApiResponse.created(res, invoice);
});

const payInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return ApiResponse.notFound(res, 'Invoice not found');

  invoice.status = 'paid';
  invoice.paidAt = new Date();
  await invoice.save();

  await Supplier.findByIdAndUpdate(invoice.supplier, { $inc: { totalSpent: invoice.totalAmount } });
  return ApiResponse.success(res, invoice, 'Invoice marked as paid');
});

module.exports = {
  getSuppliers, createSupplier, updateSupplier,
  getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
  getInvoices, createInvoice, payInvoice,
};
