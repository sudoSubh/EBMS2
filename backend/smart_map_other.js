const mongoose = require('mongoose');
const Book = require('./src/models/Book');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const RULES = [
  { 
    cat: 'Technology & CS', 
    keywords: ['computer', 'programming', 'software', 'internet', 'web', 'data', 'algorithm', 'coding', 'javascript', 'python', 'java', 'digital', 'science fiction', 'robotic'] 
  },
  { 
    cat: 'Science & Nature', 
    keywords: ['physics', 'chemistry', 'biology', 'math', 'calculus', 'astronomy', 'cosmos', 'evolution', 'nature', 'animal', 'ecology', 'environment', 'geology', 'space'] 
  },
  { 
    cat: 'Business & Economics', 
    keywords: ['money', 'finance', 'market', 'trade', 'startup', 'management', 'leadership', 'economy', 'marketing', 'investment', 'success', 'business', 'political', 'government', 'policy'] 
  },
  { 
    cat: 'Fiction & Literature', 
    keywords: ['novel', 'story', 'tale', 'fiction', 'romance', 'thriller', 'mystery', 'detective', 'poetry', 'poem', 'drama', 'classic', 'juvenile', 'comics', 'humor', 'adventure'] 
  },
  { 
    cat: 'Philosophy & Psychology', 
    keywords: ['mind', 'think', 'mental', 'behavior', 'ethics', 'logic', 'philosophy', 'psychology', 'spirit', 'god', 'religion', 'wisdom', 'bible', 'church', 'christian', 'yoga', 'self-help'] 
  },
  { 
    cat: 'History', 
    keywords: ['war', 'ancient', 'medieval', 'civilization', 'history', 'empire', 'century', 'biography', 'autobiography', 'life of', 'revolution', 'archaeology', 'military'] 
  },
  { 
    cat: 'Medicine & Health', 
    keywords: ['doctor', 'anatomy', 'health', 'disease', 'surgery', 'clinical', 'medical', 'nurse', 'pharmacy', 'nutrition', 'cooking', 'recipe', 'diet', 'sports', 'fitness'] 
  },
  { 
    cat: 'Art & Design', 
    keywords: ['paint', 'sculpt', 'architecture', 'design', 'photography', 'art ', 'creative', 'music', 'fashion', 'craft', 'hobby'] 
  },
  { 
    cat: 'Travel & Geography', 
    keywords: ['travel', 'guide', 'map', 'geography', 'earth', 'continent', 'country', 'adventure', 'explore', 'tourism', 'atlas'] 
  },
  { 
    cat: 'American literature', 
    keywords: ['american', 'usa', 'united states', 'hemingway', 'twain', 'fitzgerald', 'faulkner', 'steinbeck', 'poe', 'whitman', 'dickinson'] 
  },
  { 
    cat: 'Literary Criticism', 
    keywords: ['criticism', 'analysis', 'literary', 'theory', 'essay', 'review', 'interpretation', 'studies', 'journal'] 
  }
];

async function smartMapOther() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const otherBooks = await Book.find({ category: 'Other' });
    console.log(`Found ${otherBooks.length} books in "Other" category.`);

    let mappedCount = 0;
    for (const book of otherBooks) {
      const text = `${book.title} ${book.description || ''} ${book.author}`.toLowerCase();
      
      let foundCat = null;
      for (const rule of RULES) {
        if (rule.keywords.some(kw => text.includes(kw))) {
          foundCat = rule.cat;
          break; // Take the first match
        }
      }

      if (foundCat) {
        book.category = foundCat;
        await book.save();
        mappedCount++;
      }
    }

    console.log(`Successfully re-mapped ${mappedCount} books from "Other" to specific categories.`);
    process.exit(0);
  } catch (error) {
    console.error('Mapping failed:', error);
    process.exit(1);
  }
}

smartMapOther();
