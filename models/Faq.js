const mongoose = require("mongoose");

// FAQ Schema tanımı
const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// FAQ model oluşturma
const Faq = mongoose.model("Faq", faqSchema);

module.exports = Faq;
