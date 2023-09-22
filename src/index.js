
const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();
const { test } = require('./commands.js');

const PREFIX = '$';
const commands = new Map();
commands.set('test', test);

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


