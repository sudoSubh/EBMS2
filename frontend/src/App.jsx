import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Admin
import AdminLogin from './pages/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBooks from './pages/admin/Books';
import AdminUsers from './pages/admin/Users';
import AdminTransactions from './pages/admin/Transactions';
import AdminFines from './pages/admin/Fines';
import AdminReservations from './pages/admin/Reservations';
import AdminProcurement from './pages/admin/Procurement';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';

// Student
import StudentLogin from './pages/student/Login';
import StudentRegister from './pages/student/Register';
import StudentLayout from './components/student/StudentLayout';
import StudentHome from './pages/student/Home';
import StudentBooks from './pages/student/Books';
import StudentMyBooks from './pages/student/MyBooks';
import StudentFines from './pages/student/Fines';
import StudentReservations from './pages/student/Reservations';
import StudentNotifications from './pages/student/Notifications';

import { PageLoader } from './components/ui/LoadingSpinner';
import { FloatingShapes } from './components/ui/FloatingElements';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center text-center relative overflow-hidden">
      <FloatingShapes className="opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10"
      >
        <motion.h1
          className="text-9xl font-black text-gradient"
          animate={{ rotateY: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ perspective: '500px' }}
        >
          404
        </motion.h1>
        <p className="text-slate-400 mt-4 text-lg">This page wandered off the shelves</p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link to="/" className="mt-8 inline-block btn-primary shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            Return Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* Admin Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="fines" element={<AdminFines />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="procurement" element={<AdminProcurement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Student Portal */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/home" replace />} />
            <Route path="home" element={<StudentHome />} />
            <Route path="books" element={<StudentBooks />} />
            <Route path="my-books" element={<StudentMyBooks />} />
            <Route path="reservations" element={<StudentReservations />} />
            <Route path="fines" element={<StudentFines />} />
            <Route path="notifications" element={<StudentNotifications />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
