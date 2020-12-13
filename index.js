const fs = require('fs');
const { prefix, token } = require('./config.json');
const Discord = require('discord.js');

// create a new Discord client
const client = new Discord.Client();
client.commands = new Discord.Collection();

// Go through the commands folder for any js files and set up any commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

// Read a message
client.on('message', message => {
    // If it doesn't start with the prefix or if the author is a bot just exit early
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Get the arguments and the name of the command from the message
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Find the command from either the name or any given aliases
    // Include aliases: ['alias1', 'alias2', ...etc] to include any aliases for a command
    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));    
    if (!command) return;

    // Commands that can only be executed for a server (guilds refer to servers)
    // Include guildOnly: true to denote a server only command
    if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

    // Commands with required arguments
    // Include args: true to denote a command with mandatory arguments
    // Include usage: *whatever arguments they need* to denote proper usage
    if (command.args && !args.length) {
        let reply = message.channel.send("You didn't provide the correct arguments.")
        if (command.usage) {
            reply += `\n${command.name} command should look like: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply)
    }

    // Cooldown for any given command
    // Include cooldown: time in seconds
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }
    
    timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.channel.send('There was an error trying to execute that command!');
    }
    
});

// login to Discord with your app's token
client.login(token);
