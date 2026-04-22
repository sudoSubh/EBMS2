import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, options = {}) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatCurrency(amount, currency = '₹') {
  if (amount === null || amount === undefined) return '—';
  return `${currency}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getRoleBadgeClass(role) {
  const map = {
    admin: 'badge-purple',
    librarian: 'badge-info',
    staff: 'badge-warning',
    student: 'badge-gray',
  };
  return map[role] || 'badge-gray';
}

export function getStatusBadgeClass(status) {
  const map = {
    active: 'badge-success',
    returned: 'badge-gray',
    overdue: 'badge-danger',
    lost: 'badge-danger',
    pending: 'badge-warning',
    fulfilled: 'badge-success',
    cancelled: 'badge-gray',
    expired: 'badge-gray',
    paid: 'badge-success',
    partial: 'badge-warning',
    waived: 'badge-info',
    available: 'badge-success',
    issued: 'badge-warning',
    reserved: 'badge-info',
    damaged: 'badge-danger',
    sent: 'badge-info',
    received: 'badge-success',
    draft: 'badge-gray',
  };
  return map[status] || 'badge-gray';
}

export function getDaysOverdue(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function truncate(str, len = 40) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
