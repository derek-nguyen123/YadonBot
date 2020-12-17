const Discord = require("discord.js")

module.exports = {
    name: 'avatar',
	description: 'Create an embed with the avatar of the  mentioned user, or your own.',
	aliases: ['icon', 'pfp'],
	execute(message) {
        const user = message.mentions.users.first() || message.author;
        console.log(user.displayAvatarURL)
        const avatarEmbed = new Discord.MessageEmbed()
            .setAuthor(user.username)
            .setImage(user.displayAvatarURL({ dynamic: true }));
        message.channel.send(avatarEmbed);
	},
};