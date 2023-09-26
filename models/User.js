
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    userID: String,
    wins: Number,
    loses: Number
});

module.exports = mongoose.model("User", userSchema)