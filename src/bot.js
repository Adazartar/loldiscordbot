require('dotenv').config();

const { Client, IntentsBitField } = require('discord.js');

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log("Connected to database"));

const { test, lol } = require('./commands.js');
const PREFIX = '$';
const commands = new Map();
commands.set('test', test);
commands.set('lol', lol);

const { runPersistentTasks } = require('./persistent.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
        
    ],
});


client.login(process.env.BOT_TOKEN);

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`)
});

client.on('messageCreate', (msg) => {
    if(msg.author.bot) return;
    if(msg.content.startsWith(PREFIX)){
        const [CMD_NAME, ...args] = msg.content
        .trim()
        .substring(PREFIX.length)
        .split(/\s+/);
        if (commands.has(CMD_NAME)){
            commands.get(CMD_NAME)(msg, args);
        }
    }
});

runPersistentTasks();


