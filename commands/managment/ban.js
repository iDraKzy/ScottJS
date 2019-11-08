const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")

module.exports = class BanCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'ban',
        aliases: ["ban"],
        group: 'managment',
        memberName: 'ban',
        clientPermissiosn: ["VIEW_CHANNEL", "BAN_MEMBERS"],
        description: [
            {
                lang: "fr",
                text: "Bannis un utilisateur et lui envoi la raison"
            },
            {
                lang: "en",
                text: "Ban a user and send him the reason"
            }
        ],
        format: "!ban [utilisateur] [raison]",
        examples: ["!ban @iDraKz Pas gentil"],
        userPermissions: ["BAN_MEMBERS"],
        clientPermission: ["BAN_MEMBERS"],
        args: [{
            type: "user",
            prompt: "Qui voulez-vous bannir ?",
            key: "user",
            error: "Ceci n'est pas un utilisateur valide"
        },
        {
            type: "string",
            prompt: "Raison du bannissement",
            key: "reason",
            error: "Ceci n'est pas une raison valide"
        }]
    })
}

    async run(msg, { user, reason }) {
        const guild = msg.guild
        user = user.toString().replace(/\D/g, '')
        user = guild.members.get(user)
        user.ban({days: 7, reason: reason})
        const banEmbed = new RichEmbed()
            .setTitle(`:warning: Vous avez été banni de ${guild.name}`)
            .setDescription(`Vous avez été banni par <@${msg.author.id}>`)
            .setColor("#C0392B")
            .addField("Raison", reason)
            .addField("Durée", "Permanent")
        user.send(banEmbed)
    }
}