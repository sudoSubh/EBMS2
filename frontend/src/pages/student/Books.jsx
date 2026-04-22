import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import Pagination from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { CardContainer, CardBody, CardItem } from '../../components/ui/3d-card';
import { WavyBackground } from '../../components/ui/wavy-background';

const CATEGORIES = ['Fiction', 'Science', 'Technology', 'History', 'Philosophy', 'Mathematics', 'Literature', 'Business'];

export default function StudentBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });

  const fetchBooks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: pagination.limit,
        ...(search && { search }),
        ...(category && { category }),
        ...(availability && { availability }),
      });
      const res = await api.get(`/books?${params}`);
      setBooks(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load books'); }
    finally { setLoading(false); }
  }, [search, category, availability, pagination.limit]);

  useEffect(() => {
    const t = setTimeout(() => fetchBooks(1), 300);
    return () => clearTimeout(t);
  }, [search, category, availability]);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
      <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.1)]">
        <WavyBackground colors={['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee']} className="max-w-4xl mx-auto pb-20 pt-10" containerClassName="h-[25rem] rounded-[3rem] bg-[#0c0c10]">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-7xl font-black text-white text-center mb-6 tracking-tighter" style={{ textShadow: '0 4px 40px rgba(0,0,0,0.8)'}}
          >
            Library <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Catalog</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-xl text-zinc-300 text-center font-medium drop-shadow-xl"
          >
            Explore our collection of <span className="text-white font-bold">{pagination.total}</span> assets.
          </motion.p>
        </WavyBackground>
      </div>

      {/* Search & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-[#121216]/80 backdrop-blur-2xl rounded-[2rem] p-4 sm:p-6 shadow-2xl border border-white/5 flex flex-wrap gap-4 z-20 relative"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search titles, authors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-500"
          />
        </div>
        <div className="relative min-w-[160px] flex-1 sm:flex-none cursor-pointer">
          <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full pl-10 pr-10 py-3.5 border border-white/10 rounded-2xl text-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white/5 hover:bg-white/10 transition-colors appearance-none cursor-pointer">
            <option value="" className="bg-zinc-900">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
          </select>
        </div>
        <div className="relative min-w-[160px] flex-1 sm:flex-none cursor-pointer">
          <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select value={availability} onChange={e => setAvailability(e.target.value)} className="w-full pl-10 pr-10 py-3.5 border border-white/10 rounded-2xl text-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white/5 hover:bg-white/10 transition-colors appearance-none cursor-pointer">
            <option value="" className="bg-zinc-900">Any Status</option>
            <option value="available" className="bg-zinc-900">Available</option>
            <option value="unavailable" className="bg-zinc-900">Unavailable</option>
          </select>
        </div>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>
      ) : books.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white/5 backdrop-blur-sm rounded-[2.5rem] border border-white/10 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-white/5 rounded-3xl mx-auto flex items-center justify-center border border-white/5 mb-6">
            <BookOpen className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-2xl font-bold text-white mb-2">No assets found</p>
          <p className="text-zinc-500">Try adjusting your search criteria or filters.</p>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            <AnimatePresence>
              {books.map((book, i) => (
                <motion.div
                  key={book._id}
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <CardContainer className="inter-var group h-full">
                    <CardBody className="bg-[#121217] relative group/card hover:shadow-2xl hover:shadow-indigo-500/20 w-auto sm:w-[18rem] h-full min-h-[420px] rounded-[2.5rem] p-5 flex flex-col border border-white/10 hover:border-indigo-500/30 transition-all duration-500">
                      
                      <CardItem
                        translateZ="60"
                        className="w-full h-[280px] bg-[#1a1a24] rounded-[1.8rem] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center flex-shrink-0 relative group-hover/card:shadow-[inset_0_0_40px_rgba(99,102,241,0.2)] transition-shadow duration-500"
                      >
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                        ) : (
                          <div className="flex flex-col items-center text-zinc-600 group-hover/card:text-indigo-400 transition-colors">
                            <BookOpen className="w-12 h-12 mb-2" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">No Cover</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                        
                        {/* Floating Availability Badge */}
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${book.availableCopies > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Out'}
                          </span>
                        </div>
                      </CardItem>

                      <div className="pt-6 flex flex-col flex-1">
                        <CardItem
                          translateZ="40"
                          className="font-bold text-white text-[17px] leading-tight mb-1 font-display"
                        >
                          {truncate(book.title, 40)}
                        </CardItem>
                        <CardItem
                          translateZ="20"
                          className="text-zinc-400 text-sm mb-4"
                        >
                          {book.author}
                        </CardItem>

                        <CardItem translateZ="30" className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between w-full">
                          <div className="px-3 py-1 bg-white/5 rounded-md border border-white/5 text-[10px] font-medium text-zinc-300 uppercase tracking-wider">
                            {book.category}
                          </div>
                          <div className="flex items-center gap-1 text-zinc-500 text-xs font-mono">
                            <span>ID:</span>
                            <span className="text-zinc-400">{book.isbn || 'N/A'}</span>
                          </div>
                        </CardItem>
                      </div>
                    </CardBody>
                  </CardContainer>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {pagination.pages > 1 && (
            <div className="flex justify-center pt-8 border-t border-white/10 mt-12 bg-white/5 backdrop-blur-md rounded-[2rem] p-6">
              <Pagination {...pagination} onPageChange={fetchBooks} />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
