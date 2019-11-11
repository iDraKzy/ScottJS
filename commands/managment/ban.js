const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")

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

    async run(msg, { user, reason, guild }) {
        if (guild) {         
            const db = mongoUtil.getDb()
            const guildCollection = await db.collection('guilds')
            let guildDoc = await guildCollection.findOne({guild_id: guild.id})
            let adminChannel = guildDoc["adminChannel"] //get the admin channel of the guild if on
            const banEmbedAdmin = new RichEmbed()
            .setDescription(`:warning: <@${user.id}> à été banni de ${guild.name}`)
            .setColor("#C0392B")
            .addField("Raison", reason)
            .addField("Durée", "Permanent")
            
            if (adminChannel == "undefined") { //if channelAdmin is not defiend send the report to the owner of the guild
                banEmbedAdmin.setTitle(`Bannissement automatique\n\n:warning: Ce message est censé être envoyé dans un channel vous pouvez le définir avec \"!setchannel admin\"`)
                await guild.owner.send(banEmbedAdmin)
            } else { //if channelAdmin is defined send the report to this channel
                await guild.channels.get(adminChannel).send(banEmbedAdmin)
            }
            user.ban({days: 7, reason: reason})
        } else {
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
}