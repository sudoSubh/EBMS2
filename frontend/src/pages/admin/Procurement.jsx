import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, FileText, CheckCheck, ShoppingCart, Truck, Receipt, ArrowRight, X, Search, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TABS = ['purchase-orders', 'suppliers', 'invoices'];

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function SearchSelect({ placeholder, onSearch, renderItem, onSelect, selected, renderSelected }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await onSearch(query);
      setResults(r); setOpen(true); setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative z-50">
      {selected ? (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          <div>{renderSelected(selected)}</div>
          <button type="button" onClick={() => onSelect(null)} className="text-slate-400 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder={placeholder} 
            className="input-field pl-9" 
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
          )}
          {open && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-surface-800 border border-surface-600 rounded-xl max-h-56 overflow-y-auto shadow-2xl z-[100]">
              {results.length > 0 ? (
                results.map((item) => (
                  <button 
                    key={item._id} 
                    type="button" 
                    onClick={() => { onSelect(item); setQuery(''); setOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-surface-700 border-b border-surface-700 last:border-0 transition-colors"
                  >
                    {renderItem(item)}
                  </button>
                ))
              ) : query.trim() && !loading ? (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  <p>No results found for "{query}"</p>
                  <p className="text-xs mt-1">Make sure you have added this supplier in the 'Suppliers' tab first.</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProcurement() {
  const [tab, setTab] = useState('purchase-orders');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({});
  const [poItems, setPoItems] = useState([]); // For PO creation
  const [selectedSupplier, setSelectedSupplier] = useState(null); // For PO creation
  const [selectedPO, setSelectedPO] = useState(null); // For receiving OR linking to invoice
  const [selectedInvoicePO, setSelectedInvoicePO] = useState(null); // Specifically for Invoice creation
  const [selectedInvoiceSupplier, setSelectedInvoiceSupplier] = useState(null); // For Invoice creation
  const [receiveData, setReceiveData] = useState([]); // Array of { itemIndex, receivedQuantity }

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const endpoint = tab === 'purchase-orders' ? 'procurement/purchase-orders' : tab === 'invoices' ? 'procurement/invoices' : 'procurement/suppliers';
      const res = await api.get(`/${endpoint}?page=${page}&limit=${pagination.limit}`);
      setData(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [tab, pagination.limit]);

  useEffect(() => { fetchData(1); }, [tab]);

  // Handle generalized creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = tab === 'purchase-orders' ? 'procurement/purchase-orders' : tab === 'invoices' ? 'procurement/invoices' : 'procurement/suppliers';
      
      const payload = { ...form };
      if (tab === 'purchase-orders') {
        if (!selectedSupplier) throw new Error("Supplier is required");
        if (poItems.length === 0) throw new Error("At least one item is required");
        payload.supplier = selectedSupplier._id;
        payload.items = poItems;
      }

      if (tab === 'invoices') {
        if (!selectedInvoiceSupplier) throw new Error("Supplier is required");
        payload.supplier = selectedInvoiceSupplier._id;
        if (selectedInvoicePO) payload.purchaseOrder = selectedInvoicePO._id;
      }

      await api.post(`/${endpoint}`, payload);
      toast.success('Created successfully');
      setShowModal(false); setForm({}); setPoItems([]); setSelectedSupplier(null);
      setSelectedInvoiceSupplier(null); setSelectedInvoicePO(null);
      fetchData(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    } finally { setSubmitting(false); }
  };

  // Handle Receiving PO
  const handleReceive = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { receivedItems: receiveData.filter(d => d.receivedQuantity > 0) };
      if (payload.receivedItems.length === 0) throw new Error("No quantities marked as received.");

      await api.post(`/procurement/purchase-orders/${selectedPO._id}/receive`, payload);
      toast.success("Inventory strictly updated and PO marked as received.");
      setShowReceiveModal(false); setSelectedPO(null); setReceiveData([]);
      fetchData(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed to receive items'); }
    finally { setSubmitting(false); }
  };

  const openReceiveModal = (po) => {
    setSelectedPO(po);
    setReceiveData(po.items.map((it, idx) => ({ itemIndex: idx, receivedQuantity: 0, maxAllowed: it.quantity - (it.receivedQuantity || 0) })));
    setShowReceiveModal(true);
  };

  const renderTable = () => {
    if (tab === 'purchase-orders') return (
      <table className="table">
        <thead><tr><th>PO Number</th><th>Supplier</th><th>Order Status</th><th>Fulfillment</th><th>Total</th><th>Options</th></tr></thead>
        <tbody>
          {data.map((po, i) => {
            const totalItems = po.items?.reduce((s, it) => s + it.quantity, 0) || 0;
            const rcvItems = po.items?.reduce((s, it) => s + (it.receivedQuantity || 0), 0) || 0;
            return (
              <motion.tr key={po._id} custom={i} variants={rowVariants} initial="hidden" animate="visible">
                <td className="font-mono text-xs text-violet-400 font-bold">{po.poNumber}</td>
                <td>
                  <p className="font-medium text-white">{po.supplier?.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(po.orderDate)}</p>
                </td>
                <td><StatusBadge status={po.status} /></td>
                <td>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono"><span className="text-emerald-400">{rcvItems}</span><span>{totalItems}</span></div>
                    <div className="w-full bg-surface-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${totalItems > 0 ? (rcvItems / totalItems) * 100 : 0}%` }} />
                    </div>
                  </div>
                </td>
                <td className="font-bold text-white font-mono">{formatCurrency(po.totalAmount)}</td>
                <td>
                  {['draft', 'sent', 'partial'].includes(po.status) && (
                    <Button variant="secondary" onClick={() => openReceiveModal(po)} className="py-1 px-3 text-xs flex items-center gap-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30">
                      <Truck className="w-3 h-3" /> Receive
                    </Button>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    );
    if (tab === 'suppliers') return (
      <table className="table">
        <thead><tr><th>Name</th><th>Code</th><th>Contact</th><th>Email</th><th>Total POs</th><th>Status</th></tr></thead>
        <tbody>
          {data.map((s, i) => (
            <motion.tr key={s._id} custom={i} variants={rowVariants} initial="hidden" animate="visible">
              <td className="font-medium text-white">{s.name}</td>
              <td className="font-mono text-xs text-slate-500">{s.code}</td>
              <td className="text-slate-400">{s.contactPerson || '—'}</td>
              <td className="text-slate-400">{s.email || '—'}</td>
              <td><span className="font-bold text-primary-400 bg-primary-500/20 px-2 py-0.5 rounded-full">{s.totalOrders}</span></td>
              <td><StatusBadge status={s.isActive ? 'active' : 'cancelled'} /></td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    );
    if (tab === 'invoices') return (
      <table className="table">
        <thead><tr><th>Invoice #</th><th>Supplier</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {data.map((inv, i) => (
            <motion.tr key={inv._id} custom={i} variants={rowVariants} initial="hidden" animate="visible">
              <td className="font-mono text-xs text-amber-400 font-bold">{inv.invoiceNumber}</td>
              <td className="font-medium text-white">{inv.supplier?.name}</td>
              <td className="font-bold text-white">{formatCurrency(inv.totalAmount)}</td>
              <td><StatusBadge status={inv.status} /></td>
              <td className="text-slate-400 text-sm">{formatDate(inv.invoiceDate)}</td>
              <td>
                <div className="flex items-center gap-2">
                  {inv.status === 'pending' && (
                    <Button
                      onClick={async () => { await api.post(`/procurement/invoices/${inv._id}/pay`); toast.success('Invoice Paid & Billed'); fetchData(pagination.page); }}
                      variant="success" className="py-1 px-3 text-xs"
                    >
                      <CheckCheck className="w-3 h-3 mr-1 inline" /> Pay
                    </Button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    );
  };

  const addItemToPO = () => setPoItems([...poItems, { bookTitle: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const updatePOItem = (idx, field, val) => {
    const updated = [...poItems];
    updated[idx][field] = val;
    if (field === 'quantity' || field === 'unitPrice') updated[idx].totalPrice = updated[idx].quantity * updated[idx].unitPrice;
    setPoItems(updated);
    
    const newSubtotal = updated.reduce((sum, item) => sum + item.totalPrice, 0);
    setForm(f => ({ ...f, subtotal: newSubtotal, totalAmount: newSubtotal + (f.tax || 0) - (f.discount || 0) }));
  };

  const renderForm = () => {
    if (tab === 'purchase-orders') return (
       <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
           <div className="col-span-2">
             <label className="label">Select Supplier *</label>
             <SearchSelect 
               placeholder="Search by vendor name..." 
               onSearch={async (q) => (await api.get(`/procurement/suppliers?search=${q}`)).data}
               selected={selectedSupplier}
               onSelect={setSelectedSupplier}
               renderItem={(s) => <div className="text-white font-medium">{s.name} <span className="text-xs text-slate-500 font-mono ml-2">{s.code}</span></div>}
               renderSelected={(s) => <div className="text-emerald-300 font-bold flex items-center gap-2"><Truck className="w-4 h-4"/> {s.name}</div>}
             />
           </div>
           <Input label="Expected Delivery" type="date" value={form.expectedDelivery || ''} onChange={e => setForm(f => ({ ...f, expectedDelivery: e.target.value }))} />
         </div>
         
         <div className="space-y-3">
           <div className="flex justify-between items-end"><h4 className="text-white font-bold text-sm uppercase tracking-wider">Order Items</h4> <Button type="button" onClick={addItemToPO} variant="secondary" className="text-xs py-1 px-2 border border-slate-600"><Plus className="w-3 h-3 inline mr-1"/> Add Row</Button></div>
           {poItems.map((item, idx) => (
             <div key={idx} className="flex gap-2 items-start bg-surface-700/30 p-2 rounded-xl border border-surface-600">
               <div className="flex-1 space-y-2">
                 <SearchSelect 
                   placeholder="Search catalog book (optional but recommended for auto-sync)" 
                   onSearch={async (q) => (await api.get(`/books?search=${q}`)).data}
                   selected={item.bookObj}
                   onSelect={(b) => { 
                     const updated = [...poItems]; 
                     if (b) { updated[idx].book = b._id; updated[idx].bookObj = b; updated[idx].bookTitle = b.title; updated[idx].isbn = b.isbn || ''; }
                     else { delete updated[idx].book; delete updated[idx].bookObj; }
                     setPoItems(updated);
                   }}
                   renderItem={(b) => <div className="text-white font-medium">{b.title}</div>}
                   renderSelected={(b) => <div className="text-emerald-300 text-sm font-bold truncate max-w-[200px]">{b.title}</div>}
                 />
                 <Input placeholder="Book Title *" value={item.bookTitle} onChange={e => updatePOItem(idx, 'bookTitle', e.target.value)} required />
                 {/* Qty and Price line */}
                 <div className="flex gap-2">
                   <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updatePOItem(idx, 'quantity', parseInt(e.target.value))} required containerClassName="w-20" />
                   <Input type="number" min="0" placeholder="Unit Price ₹" value={item.unitPrice} onChange={e => updatePOItem(idx, 'unitPrice', parseInt(e.target.value))} required containerClassName="flex-1" />
                   <div className="bg-surface-800 rounded-lg px-3 py-2 border border-surface-600 flex items-center justify-center font-mono text-emerald-400 font-bold flex-1">
                     ₹{item.totalPrice}
                   </div>
                 </div>
               </div>
               <button type="button" onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
             </div>
           ))}
           {poItems.length === 0 && <div className="text-center py-6 text-slate-500 text-sm bg-surface-700/20 rounded-xl border border-dashed border-surface-600">No items added to this PO yet.</div>}
         </div>

         {/* Summary Calc */}
         {poItems.length > 0 && (
           <div className="mt-4 pt-4 border-t border-surface-600 space-y-2 text-sm">
             <div className="flex justify-between text-slate-300"><span>Subtotal:</span> <span className="font-mono">₹{form.subtotal || 0}</span></div>
             <div className="flex gap-4">
                 <Input label="Add Tax ₹" type="number" value={form.tax || ''} onChange={e => { const t = parseFloat(e.target.value)||0; setForm(f => ({ ...f, tax: t, totalAmount: (f.subtotal||0) + t - (f.discount||0) }))}} containerClassName="flex-1" />
                 <Input label="Discount ₹" type="number" value={form.discount || ''} onChange={e => { const d = parseFloat(e.target.value)||0; setForm(f => ({ ...f, discount: d, totalAmount: (f.subtotal||0) + (f.tax||0) - d }))}} containerClassName="flex-1" />
             </div>
             <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-surface-600 mt-2"><span>Total Ordered:</span> <span className="font-mono text-violet-400">₹{form.totalAmount || form.subtotal || 0}</span></div>
           </div>
         )}
       </div>
    );
    if (tab === 'suppliers') return (
      <div className="grid grid-cols-2 gap-4">
        <Input label="Business Name *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <Input label="Contact Person" value={form.contactPerson || ''} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
        <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <Input label="Phone" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <Input label="GSTIN / Business Reg" value={form.gstin || ''} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} containerClassName="col-span-2" />
      </div>
    );
    if (tab === 'invoices') return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Select Supplier *</label>
            <SearchSelect 
              placeholder="Search by vendor name..." 
              onSearch={async (q) => (await api.get(`/procurement/suppliers?search=${q}`)).data}
              selected={selectedInvoiceSupplier}
              onSelect={setSelectedInvoiceSupplier}
              renderItem={(s) => <div className="text-white font-medium">{s.name} <span className="text-xs text-slate-500 font-mono ml-2">{s.code}</span></div>}
              renderSelected={(s) => <div className="text-emerald-300 font-bold flex items-center gap-2"><Truck className="w-4 h-4"/> {s.name}</div>}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Link Purchase Order (Optional)</label>
            <SearchSelect 
              placeholder="Search PO Number..." 
              onSearch={async (q) => (await api.get(`/procurement/purchase-orders?status=sent&search=${q}`)).data}
              selected={selectedInvoicePO}
              onSelect={(po) => {
                setSelectedInvoicePO(po);
                if (po) {
                  setForm(f => ({ ...f, subtotal: po.subtotal, tax: po.tax, discount: po.discount, totalAmount: po.totalAmount }));
                  if (!selectedInvoiceSupplier) setSelectedInvoiceSupplier(po.supplier);
                }
              }}
              renderItem={(po) => <div className="text-white font-medium">{po.poNumber} <span className="text-xs text-slate-500 font-mono ml-2">{formatCurrency(po.totalAmount)}</span></div>}
              renderSelected={(po) => <div className="text-violet-300 font-bold flex items-center gap-2"><FileText className="w-4 h-4"/> {po.poNumber}</div>}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Invoice Number *" value={form.invoiceNumber || ''} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} required placeholder="e.g. INV-1002" />
          <Input label="Invoice Date *" type="date" value={form.invoiceDate || ''} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} required />
          <Input label="Subtotal ₹ *" type="number" value={form.subtotal || ''} onChange={e => setForm(f => ({ ...f, subtotal: parseFloat(e.target.value), totalAmount: parseFloat(e.target.value) + (f.tax || 0) - (f.discount || 0) }))} required />
          <Input label="Total Amount ₹ *" type="number" value={form.totalAmount || ''} readOnly className="bg-surface-800 font-bold text-emerald-400" />
        </div>
        <div className="flex gap-4">
           <Input label="Tax ₹" type="number" value={form.tax || ''} onChange={e => { const t = parseFloat(e.target.value)||0; setForm(f => ({ ...f, tax: t, totalAmount: (f.subtotal||0) + t - (f.discount||0) }))}} containerClassName="flex-1" />
           <Input label="Discount ₹" type="number" value={form.discount || ''} onChange={e => { const d = parseFloat(e.target.value)||0; setForm(f => ({ ...f, discount: d, totalAmount: (f.subtotal||0) + (f.tax||0) - d }))}} containerClassName="flex-1" />
        </div>
      </div>
    );
  };

  const renderReceiveModal = () => (
    <Modal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} title="Receive Delivery Truck" size="md">
      {selectedPO && (
        <form onSubmit={handleReceive} className="space-y-4">
           <div className="bg-surface-700/50 p-4 border border-surface-600 rounded-xl mb-4">
             <p className="text-sm text-slate-400 font-mono">PO: <span className="text-violet-400 font-bold">{selectedPO.poNumber}</span></p>
             <p className="text-white font-medium">{selectedPO.supplier?.name}</p>
             <p className="text-xs text-slate-500 mt-2">Log the exact quantity of books dropped off. The system will auto-generate barcodes and add them identically to the student catalog instantaneously.</p>
           </div>
           
           <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
             {selectedPO.items.map((item, idx) => {
               const allowed = item.quantity - (item.receivedQuantity || 0);
               if (allowed <= 0) return null;
               
               return (
                 <div key={idx} className="bg-surface-800 border border-surface-600 rounded-xl p-3 flex items-center justify-between gap-4">
                   <div className="flex-1">
                     <p className="text-white font-bold text-sm">{item.bookTitle}</p>
                     <p className="text-xs font-mono text-slate-500">Ordered: {item.quantity} | Previously Received: {item.receivedQuantity || 0}</p>
                   </div>
                   <div className="w-24">
                     <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Arrived</label>
                     <input type="number" min="0" max={allowed} value={receiveData[idx]?.receivedQuantity || 0} onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        const nd = [...receiveData];
                        nd[idx].receivedQuantity = v > allowed ? allowed : v;
                        setReceiveData(nd);
                     }} className="input-field text-center py-1.5" />
                   </div>
                 </div>
               );
             })}
           </div>
           
           <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
             <Button variant="secondary" type="button" onClick={() => setShowReceiveModal(false)}>Cancel Processing</Button>
             <Button type="submit" variant="success" isLoading={submitting}>Log Delivery into Inventory</Button>
           </div>
        </form>
      )}
    </Modal>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/30">
              <ShoppingCart className="w-5 h-5 text-violet-400" />
            </div>
            Procurement Division
          </h1>
          <p className="page-subtitle">Draft POs, track vendor shipments, and inject inventory.</p>
        </div>
        <Button onClick={() => { setForm({}); setShowModal(true); }} leftIcon={<Plus className="w-4 h-4" />}>New {tab.replace('-', ' ')}</Button>
      </motion.div>

      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize flex items-center gap-2 ${tab === t ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:text-white hover:bg-surface-700 border border-surface-700'}`}
          >
            {t === 'purchase-orders' ? <ShoppingCart className="w-4 h-4"/> : t === 'suppliers' ? <Truck className="w-4 h-4"/> : <Receipt className="w-4 h-4"/>}
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {loading ? <TableSkeleton rows={6} cols={6} /> : (
            <div className="admin-card p-0 overflow-hidden">
              <div className="overflow-x-auto">{renderTable()}</div>
              {pagination.pages > 1 && <div className="px-4 py-3 border-t border-surface-700"><Pagination {...pagination} onPageChange={fetchData} /></div>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Create ${tab.replace('-', ' ')}`} size={tab === 'purchase-orders' ? 'md' : 'sm'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderForm()}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700 mt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>Issue Documentation</Button>
          </div>
        </form>
      </Modal>

      {renderReceiveModal()}
    </div>
  );
}
