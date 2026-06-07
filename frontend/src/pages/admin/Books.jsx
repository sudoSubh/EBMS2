import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, BookOpen, Edit2, Trash2, Eye, Copy } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { formatDate, truncate, debounce } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Fiction & Literature', 'Science & Nature', 'Technology & CS', 'History', 
  'Business & Economics', 'Philosophy & Psychology', 'Art & Design', 
  'Medicine & Health', 'Travel & Geography', 'Literary Criticism', 
  'American literature', 'Other'
];

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', availability: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', publisher: '', publishedYear: '',
    category: '', description: '', pages: '', language: 'English',
    type: 'physical', location: '', totalCopies: 1,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchBooks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: pagination.limit,
        ...(search && { search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.availability && { availability: filters.availability }),
        ...(filters.type && { type: filters.type }),
      });
      const res = await api.get(`/books?${params}`);
      setBooks(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.limit]);

  useEffect(() => { fetchBooks(1); }, [search, filters]);

  const debouncedSearch = debounce((val) => setSearch(val), 300);

  const openModal = (book = null) => {
    setEditBook(book);
    setForm(book ? {
      title: book.title, author: book.author, isbn: book.isbn || '',
      publisher: book.publisher || '', publishedYear: book.publishedYear || '',
      category: book.category, description: book.description || '',
      pages: book.pages || '', language: book.language || 'English',
      type: book.type || 'physical', location: book.location || '',
      totalCopies: book.totalCopies || 0,
    } : {
      title: '', author: '', isbn: '', publisher: '', publishedYear: '',
      category: '', description: '', pages: '', language: 'English',
      type: 'physical', location: '', totalCopies: 1,
    });
    setImage(null);
    setImagePreview(book?.coverImage || '');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key]) formData.append(key, form[key]);
      });
      if (image) formData.append('coverImage', image);

      if (editBook) {
        await api.put(`/books/${editBook._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Book updated successfully');
      } else {
        await api.post('/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Book created successfully');
      }
      setShowModal(false);
      fetchBooks(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to save book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book? This action cannot be undone.')) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      fetchBooks(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete book');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="page-title">Book Management</h1>
          <p className="page-subtitle">{pagination.total} books in catalog</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>
            Add Book
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="admin-card flex flex-wrap gap-3"
      >
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search title, author, ISBN..."
            onChange={(e) => debouncedSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))} className="input-field w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.availability} onChange={(e) => setFilters(f => ({ ...f, availability: e.target.value }))} className="input-field w-40">
          <option value="">Available</option>
          <option value="available">Available Only</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))} className="input-field w-36">
          <option value="">All Types</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
          <option value="both">Both</option>
        </select>
      </motion.div>

      {/* Table */}
      {loading ? <TableSkeleton rows={8} cols={6} /> : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="admin-card p-0"
        >
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Copies</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">No books found</td></tr>
                ) : books.map((book, i) => (
                  <motion.tr
                    key={book._id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{
                      backgroundColor: 'rgba(30, 41, 59, 0.6)',
                      transition: { duration: 0.15 },
                    }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          className="w-10 h-14 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0 overflow-hidden"
                        >
                          {book.coverImage ? (
                            <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-slate-500" />
                          )}
                        </motion.div>
                        <div>
                          <p className="font-medium text-white">{truncate(book.title, 30)}</p>
                          <p className="text-xs text-slate-500">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{book.isbn || '—'}</td>
                    <td><span className="badge badge-info">{book.category}</span></td>
                    <td>
                      <span className="text-emerald-400 font-medium">{book.availableCopies}</span>
                      <span className="text-slate-500">/{book.totalCopies}</span>
                    </td>
                    <td><span className={`badge ${book.type === 'digital' ? 'badge-purple' : 'badge-gray'}`}>{book.type}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <motion.button
                          onClick={() => openModal(book)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-lg hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(book._id)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-surface-700">
            <Pagination {...pagination} onPageChange={fetchBooks} />
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editBook ? 'Edit Book' : 'Add New Book'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            <Input label="Author *" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} required />
            <Input label="ISBN" value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} />
            <Input label="Publisher" value={form.publisher} onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))} />
            <Input label="Year" type="number" value={form.publishedYear} onChange={e => setForm(f => ({ ...f, publishedYear: e.target.value }))} />
            <Input label="Pages" type="number" value={form.pages} onChange={e => setForm(f => ({ ...f, pages: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required className="input-field">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Shelf Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            {!editBook && (
              <Input label="Number of Copies *" type="number" min="1" value={form.totalCopies} onChange={e => setForm(f => ({ ...f, totalCopies: e.target.value }))} required />
            )}
          </div>
          <div className="space-y-2">
            <label className="label">Cover Image</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-28 rounded-xl bg-surface-700 border border-surface-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20"
                />
                <p className="text-[10px] text-slate-500 mt-2">JPG, PNG or WEBP. Recommended size: 400x600px.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field h-24 resize-none" placeholder="Add a brief description..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>{editBook ? 'Update Book' : 'Create Book'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
