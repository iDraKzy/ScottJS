const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const parsems = require("parse-ms")

module.exports = class BanCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'ban',
        aliases: ["ban"],
        group: 'moderation',
        memberName: 'ban',
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
        format: "!ban [utilisateur] [raison] [time?]",
        examples: ["!ban @iDraKz Pas gentil 3d5h2m", "!ban @iDraKz Pas gentil"],
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
        },
        {
            type: "string",
            prompt: "Durée du bannissement",
            key: "date",
            default: 0,
            error: "Ceci n'est pas un temps valide"
        }]
    })
}

    async run(msg, { user, reason, date }) {
        console.log(date)
        const db = mongoUtil.getDb()
        const guild = msg.guild
        let member = user.toString().replace(/\D/g, '')
        member = guild.members.get(member)
        let banEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.warn} Vous avez été banni de ${guild.name}`)
            .setDescription(`Vous avez été banni par <@${msg.author.id}>`)
            .setColor("#C0392B")
            .addField("Raison", reason)

        if (date !== 0) {
            console.log(member)
            const tempBanCollection = db.collection("tempban")
            const regex = /(\d{1,})\D{1,}/gm
            let parsedDate = []
            let m
            while ((m = regex.exec(date)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                parsedDate.push(m[0])
            }
            const charNumb = {
                'd': 1440,
                'h': 60,
                'm': 1
            }
            let mins = 0
            parsedDate.forEach((element) => {
                if (element.replace(/[0-9]/gm, '') in charNumb) {
                    mins += Number(element.substring(0, element.length - 1)) * charNumb[element.replace(/[0-9]/gm, '')] 
                }
            })
            const minsMS = mins * 60 * 1000
            const query = {
                discord_id: member.user.id,
                guild: member.guild.id,
                username: member.user.username,
                date: Date.now() + minsMS,
                reason: reason
            }
            let displayTime = parsems(minsMS)
            if (displayTime.days !== 0) {
                displayTime = `${displayTime.days} jours, ${displayTime.hours} heures et ${displayTime.minutes} minutes`
            } else if (displayTime.hours !== 0) {
                displayTime = `${displayTime.hours} heures et ${displayTime.minutes} minutes`
            } else {
                displayTime = `${displayTime.minutes} minutes`
            }

            banEmbed.addField("Durée", displayTime)

            tempBanCollection.insertOne(query)
                .catch(e => {
                    const errorTempBanEmbed = new RichEmbed()
                        .setTitle(`${this.client.emotes.cross} Une erreur est survenue`)
                        .setColor("#E74C3C")
                    return msg.send(errorTempBanEmbed)
                })
        } else {
            banEmbed.addField("Durée", "Permanent")
        }
        await member.send(banEmbed)
        member.ban({days: 7, reason: reason})
    }
    
    async call(user, reason, guild) {
        const guildCollection = await mongoUtil.getDb().collection('guilds')
        const guildDoc = await guildCollection.findOne({guild_id: guild.id})
        const adminChannel = guildDoc["adminChannel"] //get the admin channel of the guild if on
        user.ban({days: 7, reason: reason})
        const banEmbedAdmin = new RichEmbed()
            .setDescription(`${this.client.emotes.warn} <@${user.id}> à été banni de ${guild.name}`)
            .setColor("#C0392B")
            .addField("Raison", reason)
            .addField("Durée", "Permanent")
        
        if (adminChannel == "undefined") { //if channelAdmin is not defiend send the report to the owner of the guild
            banEmbedAdmin.setTitle(`Bannissement automatique\n\n${this.client.emotes.warn} Ce message est censé être envoyé dans un channel vous pouvez le définir avec \"!setchannel admin\"`)
            await guild.owner.send(banEmbedAdmin)
        } else { //if channelAdmin is defined send the report to this channel
            await guild.channels.get(adminChannel).send(banEmbedAdmin)
        }
    }
}