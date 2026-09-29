const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Uncomment when adding Auth
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);