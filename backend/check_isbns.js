require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/Book');

async function checkIsbns() {
  await mongoose.connect(process.env.MONGO_URI);
  const books = await Book.find({}).limit(10).select('title isbn');
  console.log('Sample ISBNs from DB:');
  books.forEach(b => console.log(`Title: ${b.title} | ISBN: ${b.isbn}`));
  await mongoose.disconnect();
}

checkIsbns();
