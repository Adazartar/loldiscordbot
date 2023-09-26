
const User = require('../models/User');
const Game = require('../models/Game');

async function test(msg, args){
    console.log(`Test command successful with: ${args}`);
    console.log(`${msg.author.id} ${msg.author.globalName}`);
    checkUser(msg.author.id, msg.author.globalName);
    console.log(args[4]);
}

async function getLiveMatch(msg, summoner, region){
    try{
        const code = await regionToCode(msg, region);
        if (code === "EXIT") return {gameID: -1, startTime: 0};

        const playerLink = `https://${code}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${process.env.RIOT_API_KEY}`;
        const playerResponse = await fetch(playerLink);

        if(playerResponse.ok){
            let playerData = await response.json();
            let encryptSummID = playerData.id;
            const spectatorLink = `https://${code}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${encryptSummID}?api_key=${process.env.RIOT_API_KEY}`;
            const spectatorResponse = await fetch(spectatorLink);

            if(spectatorResponse.ok){
                let spectatorData = await response.json();
                const currentTime = Date.now();
                const gameStartTime = spectatorData.gameStartTime;

                if(currentTime - gameStartTime <= 300000){
                    return {gameID: spectatorData.gameId, startTime: spectatorData.gameStartTime};
                }
                else{
                    await msg.channel.send(`${summoner} is longer than 5 minutes into the game, guessing is over`);
                    return {gameID: -1, startTime: 0};
                }
            }
            else{
                await msg.channel.send(`${summoner} is not in a live game`);
                return {gameID: -1, startTime: 0};
            }
        }
        else{
            await msg.channel.send($`${summoner} couldn't be found`);
            return {gameID: -1, startTime: 0};
        }
    }
    catch{
        await msg.channel.send("Riot API key has degraded");
        return {gameID: -1, startTime: 0};
    }
}

async function updateGame(msg, summoner, gameID, choice, startTime){
    try {
        const game = await Game.find({ gameID : gameID });
        if(game.length === 0){
            const newGame = await Game.create({
                gameID: gameID,
                summoner: summoner,
                users: [
                    { userID : msg.author.id,
                    choice: choice }
                ],
                startTime: startTime
            });
            await newGame.save();
        }
        else {
            await game.users.push({
                user: msg.author.id,
                choice: choice
            });
            await game.save()
        }
    }
    catch (e){
        console.log(e.message);
    }
}

async function checkUser(userID, username){
    try {
        const user = await User.find({ userID : userID });
        if(user.length === 0){
            const newUser = await User.create({
                username: username,
                userID: userID,
                wins: 0,
                loses: 0
            });
            await newUser.save();
            console.log(`New user entered into database ${username}`);
        }
    }
    catch (e){
        console.log(e.message);
    }
}

async function lol(msg, args){
    await checkUser(msg.author.id, msg.author.globalName);
    const currentTime = Date.now();
    const [summoner, region, choice] = [args[0], args[1], await choiceSimplifier(msg, args[2])];
    if(choice === "INVALID") {
        return;
    }
    else{
        let match = await Game.find({summoner: summoner});
        if (match.length === 0){
            const {gameID: newGameID, startTime: newStartTime} = await getLiveMatch(msg, summoner, region);
            if (newGameID === -1) return;
            else await updateGame(msg, summoner, newGameID, choice, newStartTime);
        }
        else if (match === -1) return;
        else if (currentTime - match.startTime > 300000){
            await msg.channel.send(`${summoner} is longer than 5 minutes into the game, guessing is over`);
            return;
        }
        else await updateGame(msg, summoner, match.gameID, choice, startTime);
    }
}

async function regionToRouting(msg, region){
    try{
        if (["NA", "BR", "LAN", "LAS"].includes(region.toUpperCase())) return "AMERICAS";
        else if (["KR","JP"].includes(region.toUpperCase())) return "ASIA";
        else if (["EUNE", "EUW", "TR", "RU"].includes(region.toUpperCase())) return "EUROPE";
        else if (["OCE", "PH2", "SG2", "TH2", "TW2", "VN2"].includes(region.toUpperCase())) return "SEA";
        else await msg.channel.send('Region entered was invalid');
    }
    catch{
        await help(msg);
    }
}

async function regionToCode(msg, region){
    try{
        const fixedRegion = region.toUpperCase();
        if (fixedRegion === "BR") return "BR1";
        else if (fixedRegion === "EUNE") return "EUN1";
        else if (fixedRegion === "EUW") return "EUW1";
        else if (fixedRegion === "LAN") return "LA1";
        else if (fixedRegion === "LAS") return "LA2";
        else if (fixedRegion === "NA") return "NA1";
        else if (fixedRegion === "OCE") return "OC1";
        else if (fixedRegion === "RU") return "RU1";
        else if (fixedRegion === "TR") return "TR1";
        else if (fixedRegion === "JP") return "JP1";
        else if (fixedRegion === "KR") return "KR";
        else if (fixedRegion === "PH") return "PH2";
        else if (fixedRegion === "SG") return "SG2";
        else if (fixedRegion === "TW") return "TW2";
        else if (fixedRegion === "TH") return "TH2";
        else if (fixedRegion === "VN") return "VN2";
        else {
            await msg.channel.send('Region entered was invalid');
            return "EXIT";
        }
    }
    catch{
        await help(msg);
        return "EXIT";
    }
}

async function choiceSimplifier(msg, choice){
    try{
        if(["W", "WIN"].includes(choice.toUpperCase())) return "W";
        else if(["L", "LOSE", "LOSS"].includes(choice.toUpperCase())) return "L";
        
        else {
            await help(msg);
            return "INVALID";
        }
    }
    catch{
        await help(msg);
        return "INVALID";
    }
}

async function help(msg){
    await msg.channel.send('Please use the command in the form: $lol [Username] [Region] [W/L]');
}


module.exports = {
    test,
    lol
}
