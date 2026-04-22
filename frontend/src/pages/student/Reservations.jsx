import React, { useState, useEffect } from 'react';
import { BookMarked, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { formatDate } from '../../utils/helpers';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function StudentReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reservations?limit=50')
      .then(res => setReservations(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reservation cancelled');
      setReservations(prev => prev.map(r => r._id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Reservations</h1>
      {reservations.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No reservations yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(r => (
            <div key={r._id} className="bg-white rounded-3xl p-5 shadow-card border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-20 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {r.book?.coverImage ? <img src={r.book.coverImage} className="w-full h-full object-cover" alt="" /> : <BookMarked className="w-6 h-6 text-primary-300" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{r.book?.title}</p>
                      <p className="text-slate-400 text-sm">{r.book?.author}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Queue Position</p>
                      <p className="font-bold text-primary-600">#{r.queuePosition}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Reserved</p>
                      <p className="font-medium text-slate-700">{formatDate(r.reservedAt)}</p>
                    </div>
                    {r.expiresAt && r.status === 'pending' && (
                      <div>
                        <p className="text-slate-400 text-xs">Expires</p>
                        <p className="font-medium text-amber-600">{formatDate(r.expiresAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {r.status === 'pending' && (
                <button onClick={() => handleCancel(r._id)} className="mt-3 text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <XCircle className="w-4 h-4" /> Cancel Reservation
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
