const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")

module.exports = class KickCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'kick',
        aliases: ["eject"],
        group: 'moderation',
        memberName: 'kick',
        clientPermissiosn: ["KICK_MEMBERS", "VIEW_CHANNEL"],
        description: [
            {
                lang: "fr",
                text: "Expulse un utilisateur et lui envoi la raison"
            },
            {
                lang: "en",
                text: "Kick a user and send him the reason"
            }
        ],
        format: "!kick [utilisateur] [raison]",
        examples: ["!kick @iDraKz Pas gentil"],
        userPermissions: ["KICK_MEMBERS"],
        clientPermissions: ["KICK_MEMBERS"],
        args: [{
            type: "user",
            prompt: "Qui voulez-vous bannir ?",
            key: "user",
            error: "Ceci n'est pas un utilisateur valide"
        },
        {
            type: "string",
            prompt: "Raison de l'expulsion",
            key: "reason",
            error: "Ceci n'est pas une raison valide"
        }]
    })
}

    async run(msg, { user, reason }) {
        const guild = msg.guild
        user = user.toString().replace(/\D/g, '')
        user = guild.members.get(user)
        user.kick(reason)
        const kickEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.warn} Vous avez été expulsé de ${guild.name}`)
            .setDescription(`Vous avez été expulsé par <@${msg.author.id}>`)
            .setColor("#C0392B")
            .addField("Raison", reason)
        user.send(kickEmbed)
    }
}