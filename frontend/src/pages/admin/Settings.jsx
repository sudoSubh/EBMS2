import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Save, Settings2, BookOpen, Banknote, BookmarkCheck, Bell, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => { setSettings(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const update = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  if (!settings) return <p className="text-slate-400">Settings not available</p>;

  const Section = ({ title, icon: Icon, iconColor, children, index }) => (
    <motion.div
      custom={index}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="admin-card space-y-4 relative overflow-hidden group"
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <h3 className="text-base font-bold text-white border-b border-surface-700 pb-3 flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className={`w-8 h-8 rounded-xl bg-${iconColor}-500/15 flex items-center justify-center border border-${iconColor}-500/25`}
          >
            <Icon className={`w-4 h-4 text-${iconColor}-400`} />
          </motion.div>
          {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">{children}</div>
      </div>
    </motion.div>
  );

  const Field = ({ label, section, field, type = 'text', suffix }) => (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <label className="label">
        {label}
        {suffix && <span className="text-slate-500 ml-1 text-xs">({suffix})</span>}
      </label>
      <input
        type={type}
        value={settings[section]?.[field] ?? ''}
        onChange={e => update(section, field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        className="input-field"
      />
    </motion.div>
  );

  const Toggle = ({ label, section, field }) => {
    const checked = settings[section]?.[field] ?? false;
    return (
      <motion.label
        whileHover={{ x: 2 }}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={e => update(section, field, e.target.checked)}
          />
          <motion.div
            animate={{
              backgroundColor: checked ? '#4f46e5' : '#334155',
              boxShadow: checked ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none',
            }}
            transition={{ duration: 0.3 }}
            className="w-11 h-6 rounded-full"
          />
          <motion.div
            animate={{ x: checked ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md"
          />
        </div>
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
      </motion.label>
    );
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="page-title flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-500/20 to-zinc-500/20 flex items-center justify-center border border-slate-500/30"
            >
              <Settings2 className="w-5 h-5 text-slate-400" />
            </motion.div>
            System Settings
          </h1>
          <p className="page-subtitle">Configure library rules and policies</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>Save Settings</Button>
        </motion.div>
      </motion.div>

      <Section title="Borrowing Rules" icon={BookOpen} iconColor="primary" index={0}>
        <Field label="Student Max Books" section="borrowing" field="studentMaxBooks" type="number" />
        <Field label="Staff Max Books" section="borrowing" field="staffMaxBooks" type="number" />
        <Field label="Librarian Max Books" section="borrowing" field="librarianMaxBooks" type="number" />
        <Field label="Student Loan Days" section="borrowing" field="studentLoanDays" type="number" suffix="days" />
        <Field label="Staff Loan Days" section="borrowing" field="staffLoanDays" type="number" suffix="days" />
        <Field label="Max Renewals" section="borrowing" field="maxRenewals" type="number" />
      </Section>

      <Section title="Fine Policy" icon={Banknote} iconColor="amber" index={1}>
        <Field label="Fine Per Day" section="fines" field="finePerDay" type="number" suffix="₹/day" />
        <Field label="Grace Period" section="fines" field="gracePeriodDays" type="number" suffix="days" />
        <Field label="Max Fine Amount" section="fines" field="maxFineAmount" type="number" suffix="₹" />
        <Field label="Block Threshold" section="fines" field="blockOnFineAmount" type="number" suffix="₹" />
        <Field label="Currency Symbol" section="fines" field="currencySymbol" />
      </Section>

      <Section title="Reservations" icon={BookmarkCheck} iconColor="blue" index={2}>
        <Field label="Max Reservations Per User" section="reservations" field="maxReservationsPerUser" type="number" />
        <Field label="Reservation Expiry" section="reservations" field="reservationExpiryDays" type="number" suffix="days" />
      </Section>

      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="admin-card space-y-4"
      >
        <h3 className="text-base font-bold text-white border-b border-surface-700 pb-3 flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center border border-rose-500/25"
          >
            <Bell className="w-4 h-4 text-rose-400" />
          </motion.div>
          Notifications
        </h3>
        <div className="space-y-4">
          <Toggle label="Enable Email Notifications" section="notifications" field="enableEmailNotifications" />
          <Toggle label="Enable SMS Notifications" section="notifications" field="enableSMSNotifications" />
          <div className="max-w-xs">
            <Field label="Due Date Reminder (days before)" section="notifications" field="dueDateReminderDays" type="number" />
          </div>
        </div>
      </motion.div>

      <Section title="Library Info" icon={Building2} iconColor="emerald" index={4}>
        <Field label="Library Name" section="library" field="name" />
        <Field label="Email" section="library" field="email" />
        <Field label="Phone" section="library" field="phone" />
      </Section>
    </form>
  );
}
