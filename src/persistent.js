
const User = require('../models/User');
const Game = require('../models/Game');

let time = 0;
const sec = 1000;

async function runPersistentTasks(){
    setInterval(notifyAlive, 1 * sec);
    setInterval(checkForGames, 300 * sec);
}


async function notifyAlive(){
    time += 1;
    if(time % 300 === 0){
        console.log(`Bot has been active for ${time/60} minutes`);
    }
}

async function checkForGames(){
    const activeGames = await Game.find();
    try{
        activeGames.forEach(async (game) => {
            const matchID = game.matchID;
            const region = game.region;
            const gameLink = `https://${regionToRouting(region)}.api.riotgames.com/lol/match/v5/matches/${region}_${matchID}?api_key=${process.env.RIOT_API_KEY}`;
            const gameResponse = await fetch(gameLink);
            if(gameResponse.ok){
                let gameData = await gameResponse.json()
                await updatePlayerScores(game, gameData);
                await Game.deleteOne({_id: game._id});
            }
        });
    }
    catch{
        console.log("Issue checking the games");
    }
}

async function updatePlayerScores(game, gameData){
    const users = game.users;
    const summoner = await gameData.participants.find(participant => participant.summonerName === game.summoner);
    const won = summoner.win;
    users.forEach(async (user) => {
        if(user.choice === "W" && won || user.choice === "L" && !won){
            const userInGame = await User.find({userID: user.userID});
            const currWins = user.wins;
            await User.updateOne({userID: userInGame.userID}, {wins: currWins + 1});
        }
        else if(user.choice === "W" && !won || user.choice === "L" && won){
            const userInGame = await User.find({userID: user.userID});
            const currLoses = user.loses;
            await User.updateOne({userID: userInGame.userID}, {loses: currLoses + 1});
        }
        
    });
}

async function regionToRouting(region){
    try{
        if (["NA", "BR", "LAN", "LAS"].includes(region.toUpperCase())) return "AMERICAS";
        else if (["KR","JP"].includes(region.toUpperCase())) return "ASIA";
        else if (["EUNE", "EUW", "TR", "RU"].includes(region.toUpperCase())) return "EUROPE";
        else if (["OC1", "PH2", "SG2", "TH2", "TW2", "VN2"].includes(region.toUpperCase())) return "SEA";
        else await msg.channel.send('Region entered was invalid');
    }
    catch (e){
        console.log(e.message);
    }
}

module.exports = { runPersistentTasks }