require('dotenv').config();
const mongoose = require('mongoose');
const Book = mongoose.model('Book', new mongoose.Schema({ title: String }));

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Book.countDocuments({});
  console.log('COUNT:' + count);
  await mongoose.disconnect();
}
check();
