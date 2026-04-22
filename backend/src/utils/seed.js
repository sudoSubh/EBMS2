require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const Supplier = require('../models/Supplier');
const Settings = require('../models/Settings');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ebms';

const categories = ['Fiction', 'Science', 'Technology', 'History', 'Philosophy', 'Mathematics', 'Literature', 'Business'];

const books = [
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Technology', publisher: 'Prentice Hall', publishedYear: 2008, description: 'A handbook of agile software craftsmanship', pages: 431 },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', category: 'Fiction', publisher: 'Scribner', publishedYear: 1925, description: 'A story of the fabulously wealthy Jay Gatsby', pages: 180 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', category: 'History', publisher: 'Harper', publishedYear: 2011, description: 'A Brief History of Humankind', pages: 443 },
  { title: 'Design Patterns', author: 'Gang of Four', isbn: '9780201633610', category: 'Technology', publisher: 'Addison-Wesley', publishedYear: 1994, description: 'Elements of Reusable Object-Oriented Software', pages: 395 },
  { title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', isbn: '9780135957059', category: 'Technology', publisher: 'Addison-Wesley', publishedYear: 2019, description: 'Your Journey to Mastery', pages: 352 },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', category: 'Mathematics', publisher: 'MIT Press', publishedYear: 2009, description: 'Comprehensive introduction to modern algorithms', pages: 1312 },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', category: 'Business', publisher: 'Avery', publishedYear: 2018, description: 'Tiny changes, remarkable results', pages: 320 },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', category: 'Science', publisher: 'Farrar, Straus and Giroux', publishedYear: 2011, description: 'A groundbreaking tour of the mind', pages: 499 },
  { title: '1984', author: 'George Orwell', isbn: '9780451524935', category: 'Fiction', publisher: 'Signet Classic', publishedYear: 1949, description: 'A dystopian social science fiction novel', pages: 328 },
  { title: 'The Republic', author: 'Plato', isbn: '9780140455113', category: 'Philosophy', publisher: 'Penguin Classics', publishedYear: -380, description: 'Plato\'s masterwork on justice and ideal state', pages: 416 },
  { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', isbn: '9780596517748', category: 'Technology', publisher: 'O\'Reilly', publishedYear: 2008, description: 'Unearthing the Excellence in JavaScript', pages: 172 },
  { title: 'Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', category: 'Science', publisher: 'Bantam Books', publishedYear: 1988, description: 'From the Big Bang to black holes', pages: 212 },
];

const users = [
  { email: 'admin@ebms.com', name: 'System Admin', role: 'admin', phone: '9000000001', isActive: true },
  { email: 'librarian@ebms.com', name: 'John Librarian', role: 'librarian', phone: '9000000002', isActive: true },
  { email: 'staff@ebms.com', name: 'Mike Staff', role: 'staff', phone: '9000000003', isActive: true },
  { email: 'alice@student.com', name: 'Alice Johnson', role: 'student', studentId: 'STU001', phone: '9000000004', isActive: true },
  { email: 'bob@student.com', name: 'Bob Smith', role: 'student', studentId: 'STU002', phone: '9000000005', isActive: true },
  { email: 'carol@student.com', name: 'Carol Williams', role: 'student', studentId: 'STU003', phone: '9000000006', isActive: true },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      BookCopy.deleteMany({}),
      Supplier.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Seed settings
    await Settings.create({ key: 'global' });
    console.log('⚙️  Settings created');

    // Seed users
    const createdUsers = await User.insertMany(users);
    console.log(`👥 ${createdUsers.length} users created`);

    // Seed supplier
    const supplier = await Supplier.create({
      name: 'BookWorld Publishers',
      code: 'SUP-0001',
      contactPerson: 'Raj Kumar',
      email: 'contact@bookworld.com',
      phone: '9876543210',
    });

    // Seed books with copies
    for (const bookData of books) {
      const book = await Book.create({ ...bookData, supplier: supplier._id, totalCopies: 3, availableCopies: 3 });
      for (let i = 1; i <= 3; i++) {
        await BookCopy.create({
          book: book._id,
          copyNumber: `${book.isbn.slice(-6)}-${String(i).padStart(3, '0')}`,
          condition: 'good',
          status: 'available',
        });
      }
    }
    console.log(`📚 ${books.length} books seeded with 3 copies each`);

    console.log('\n✅ SEED COMPLETE!');
    console.log('📋 Test accounts (password set via Supabase):');
    users.forEach(u => console.log(`   ${u.role.toUpperCase()}: ${u.email}`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
