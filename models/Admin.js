const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Şifre düz metin olarak saklanır
});

module.exports = mongoose.model('Admin', adminSchema);
