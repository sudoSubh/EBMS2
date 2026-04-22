import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Shield, UserX, UserCheck, Edit2, Users as UsersIcon, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { formatDate, getRoleBadgeClass, debounce } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { TiltCard } from '../../components/ui/TiltCard';
import { ScrollReveal } from '../../components/ui/FloatingElements';

const ROLES = ['student', 'staff', 'librarian', 'admin'];

const rowVariants = {
  hidden: { opacity: 0, x: -15, filter: 'blur(4px)' },
  visible: (i) => ({
    opacity: 1, x: 0, filter: 'blur(0px)',
    transition: { delay: i * 0.03, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'student', phone: '', department: '', studentId: '', employeeId: '' });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: pagination.limit,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      });
      const res = await api.get(`/users?${params}`);
      setUsers(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, roleFilter, pagination.limit]);

  useEffect(() => { fetchUsers(1); }, [search, roleFilter]);

  const openModal = (user = null) => {
    setEditUser(user);
    setForm(user ? {
      name: user.name, email: user.email, role: user.role,
      phone: user.phone || '', department: user.department || '',
      studentId: user.studentId || '', employeeId: user.employeeId || '',
    } : { name: '', email: '', role: 'student', phone: '', department: '', studentId: '', employeeId: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser._id}`, form);
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to save user');
    } finally { setSubmitting(false); }
  };

  const toggleBlock = async (user) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    const reason = user.isBlocked ? '' : prompt(`Reason for blocking ${user.name}:`);
    if (!user.isBlocked && !reason) return;
    try {
      await api.put(`/users/${user._id}`, { isBlocked: !user.isBlocked, blockedReason: reason });
      toast.success(`User ${action}ed`);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const debouncedSearch = debounce((v) => setSearch(v), 300);

  // Role color map for avatar gradient
  const roleGradients = {
    admin: 'from-red-500 to-orange-600',
    librarian: 'from-violet-500 to-purple-600',
    staff: 'from-blue-500 to-cyan-600',
    student: 'from-primary-500 to-violet-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="page-title flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center border border-primary-500/30"
            >
              <UsersIcon className="w-5 h-5 text-primary-400" />
            </motion.div>
            User Management
          </h1>
          <p className="page-subtitle ml-13">{pagination.total} registered users across the system</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>Add User</Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="admin-card flex gap-3"
      >
        <div className="flex-1">
          <Input placeholder="Search name, email, ID..." onChange={e => debouncedSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
        </div>
        <div className="flex gap-2">
          {['', ...ROLES].map(r => (
            <motion.button
              key={r}
              onClick={() => setRoleFilter(r)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 capitalize ${roleFilter === r ? 'bg-primary-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-white hover:bg-surface-700'}`}
            >
              {r || 'All'}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      {loading ? <TableSkeleton rows={10} cols={6} /> : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="admin-card p-0"
        >
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>ID</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                    <UsersIcon className="w-8 h-8 text-slate-600" />
                    <span>No users found</span>
                  </motion.div>
                </td></tr>
              ) : users.map((user, i) => (
                <motion.tr
                  key={user._id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleGradients[user.role] || roleGradients.student} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}
                      >
                        {user.name[0].toUpperCase()}
                      </motion.div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><Badge variant={getRoleBadgeClass(user.role)}>{user.role}</Badge></td>
                  <td className="font-mono text-xs text-slate-500">{user.studentId || user.employeeId || '—'}</td>
                  <td className="text-slate-400">{user.phone || '—'}</td>
                  <td>
                    {user.isBlocked ? (
                      <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                        <Badge variant="badge-danger">Blocked</Badge>
                      </motion.span>
                    ) : user.isActive ? (
                      <Badge variant="badge-success">Active</Badge>
                    ) : (
                      <Badge variant="badge-gray">Inactive</Badge>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <motion.button
                        onClick={() => openModal(user)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => toggleBlock(user)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-1.5 rounded-lg transition-colors ${user.isBlocked ? 'hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400' : 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'}`}
                        title={user.isBlocked ? 'Unblock' : 'Block'}
                      >
                        {user.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-surface-700">
            <Pagination {...pagination} onPageChange={fetchUsers} />
          </div>
        </motion.div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={!!editUser} />
            <div>
              <label className="label">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Student ID" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} />
            <Input label="Employee ID" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} />
            <Input label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} containerClassName="col-span-2" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>{editUser ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
