
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameID: String,
    summoner: String,
    region: String,
    users: [{ 
        userID: String,
        choice: String
    }],
    startTime: Number
});

module.exports = mongoose.model("Game", gameSchema)