require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');

async function seedAcademic() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  const academicBooks = [];
  
  // 1. MEDICINE (75)
  for (let i = 1; i <= 75; i++) {
    academicBooks.push({
      title: `Essentials of Clinical Medicine Vol ${i}`,
      author: 'Dr. Sarah Jenkins',
      category: 'Medicine & Health',
      isbn: `MED-900${i.toString().padStart(3, '0')}`,
      publishedYear: 2020 + (i % 4),
      language: 'english',
      coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=200&auto=format&fit=crop',
      totalCopies: 2,
      availableCopies: 2
    });
  }

  // 2. LAW (75)
  for (let i = 1; i <= 75; i++) {
    academicBooks.push({
      title: `Foundations of Constitutional Law Issue ${i}`,
      author: 'Prof. Robert Black',
      category: 'Law & Politics',
      isbn: `LAW-800${i.toString().padStart(3, '0')}`,
      publishedYear: 2019 + (i % 5),
      language: 'english',
      coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=200&auto=format&fit=crop',
      totalCopies: 2,
      availableCopies: 2
    });
  }

  // 3. MATHEMATICS (75)
  for (let i = 1; i <= 75; i++) {
    academicBooks.push({
      title: `Advanced Calculus and Analysis Part ${i}`,
      author: 'James Stewart PhD',
      category: 'Mathematics',
      isbn: `MAT-700${i.toString().padStart(3, '0')}`,
      publishedYear: 2021 + (i % 3),
      language: 'english',
      coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=200&auto=format&fit=crop',
      totalCopies: 2,
      availableCopies: 2
    });
  }

  // 4. EDUCATION (75)
  for (let i = 1; i <= 75; i++) {
    academicBooks.push({
      title: `Pedagogy and Modern Learning Theories Vol ${i}`,
      author: 'Dr. Emily Howard',
      category: 'Education',
      isbn: `EDU-600${i.toString().padStart(3, '0')}`,
      publishedYear: 2022 + (i % 2),
      language: 'english',
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9a177c809852?q=80&w=200&auto=format&fit=crop',
      totalCopies: 2,
      availableCopies: 2
    });
  }

  console.log(`🚀 Inserting ${academicBooks.length} specialized academic books...`);
  const saved = await Book.insertMany(academicBooks);

  const copies = [];
  for (const b of saved) {
    copies.push(
      { book: b._id, copyNumber: `${b._id.toString().slice(-4)}-C1`, status: 'available' },
      { book: b._id, copyNumber: `${b._id.toString().slice(-4)}-C2`, status: 'available' }
    );
  }
  await BookCopy.insertMany(copies);

  console.log('✨ Academic Seeding Complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seedAcademic();
