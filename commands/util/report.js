const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")

module.exports = class ReportCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'report',
        aliases: ["r"],
        group: 'util',
        memberName: 'report',
        clientPermissions: ["SEND_MESSAGES", "MANAGE_CHANNELS", "VIEW_CHANNEL", "MANAGE_MESSAGES", "ADD_REACTIONS"],
        description: [
            {
                lang: "fr",
                text: "Report un membre aux administrateurs du serveur"
            },
            {
                lang: "en",
                text: "Report a member to the admin of the server"
            }
        ],
        format: "!report",
        details: "Lorsque la commande sera exécuté votre commande sera supprimé un nouveau canal ou seulement vous avez accès sera créer, vous permettant un signalement anonyme (votre pseudo sera quand même public pour les administrateurs)",
        throttling: {
            usages: 1,
            duration: 300
            }
        })
    }

    async run(msg) {
        const bot = this.client
        // Création du channel
        const createdChannel = await msg.guild.createChannel("report", {
            type: "text",
            permissionOverwrites: [{
                deny: ["VIEW_CHANNEL"],
                id: msg.guild.id
            },
            {
                allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
                id: msg.author.id
            },
            {
                allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"],
                id: bot.user.id
            }]
        })
        const reporterMember = msg.member
        const reporterID = msg.author.id
        const reportGuild = msg.member.guild
        const requestReportEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.warn} Ce rapport sera envoyé à l'administration`)
            .setDescription(`Entrez votre rapport ici <@${reporterID}>\n\nCe channel n'est visible que par vous\n\nTaggé la personne que vous souhaitez report (vous devez écrire le pseudo en entier) et envoyer la raison (message séparé)`)
            .setColor("#34495E")
        const IDReceivedEmbed = new RichEmbed()
            .setDescription("Vous pouvez entré la raison (+ preuves) ou taggé quelqu'un d'autre si vous vous êtes trompé\n\nSi vous avez déjà entré la raison et ne souhaite plus rien changé tapez \"confirmer\"")
            .setColor("#34495E")
        const reasonReceivedEmbed = new RichEmbed()
            .setTitle(":white_check_mark: Raison du rapport reçu")
            .setColor("#34495E")
        createdChannel.send(requestReportEmbed)
        msg.delete()
        // Define the variable that will be use on message receive
        let reportedID
        let reportReason
        // Create the collector
        const filter = m => m.author.id === reporterID
        const messageCollector = createdChannel.createCollector(filter, {time: 300000})
            messageCollector.on("collect", (collected) => {
                if(collected.content.match(/<@(\d){1,}>/)) { //check if the message is an id
                    reportedID = collected.content.toString().replace(/\D/g, '')
                    IDReceivedEmbed.setTitle(`${this.client.emotes.check} Utilisateur reporté reçu (${reportGuild.members.get(reportedID).user.username})`)
                    createdChannel.send(IDReceivedEmbed)
                } else if (collected.content === "confirmer") { //if the message is "confirmer" send the report
                    messageCollector.stop("confirmed")
                } else { //set the message has the reason
                    reportReason = collected.content
                    reasonReceivedEmbed.setFooter(`Vous pouvez entré une nouvelle raison si vous vous êtes trompé, taggé la personne que vous souhaitez reporté ou entrer \"confirmer\" si c'est déjà fait`)
                    reasonReceivedEmbed.setDescription(`Raison entrée : ${collected.content}`)
                    createdChannel.send(reasonReceivedEmbed)
                }
            })
            messageCollector.on("end", (collected, reason) => { //send the report
                if (reason === "confirmed") {
                    sendReport(msg, reporterMember, reporterID, reportGuild, reportedID, reportReason, this.client)
                    createdChannel.delete()
                } else {
                    reporterMember.send("Vous avez mis trop de temps") //@TODO: clean error
                    createdChannel.delete()
                }
            })

        async function sendReport(msg, reporterMember, reporterID, reportGuild, reportedID, reportReason, bot) { 
            let reportedMember = reportGuild.members.get(reportedID)
            console.log(reportedMember)
            if( reportedID === undefined || reportReason === undefined ) { //Check if the reason and the id are both defined
                reporterMember.send("Vous n'avez pas défini de raison et/ou d'utilisateur") //@TODO: Clean error
                return
            }
            const db = mongoUtil.getDb()
            const guildCollection = db.collection('guild')
            let guildDoc = await guildCollection.findOne({guild_id: reportGuild.id})
            let adminChannel = guildDoc["adminChannel"] //get the admin channel of the guild if on
            let messageSent
            const reportEmbed = new RichEmbed()
                .setTitle(`${bot.emotes.check} Nouveau rapport`)
                .setColor("#34495E")
                .addField("Utilisateur reporté", `<@${reportedID}>`)
                .addField("Raison", reportReason)
                .setFooter("⛔ : Bannir ; 🚫 : éjecter ; 📨 : Envoyer un rapport à notre équipe (Répond aux réactions pendant une journée)")
            if (adminChannel == "undefined") { //if channelAdmin is not defiend send the report to the owner of the guild
                reportEmbed.setDescription(`Rapport rédigé par <@${reporterID}>\n\n${bot.emotes.warn} Ce message est censé être envoyé dans un channel vous pouvez le définir avec \"!setadminchannel\"`)
                messageSent = await reportGuild.owner.send(reportEmbed)
            } else { //if channelAdmin is defined send the report to this channel
                reportEmbed.setDescription(`Rapport rédigé par <@${reporterID}>`)
                messageSent = await reportGuild.channels.get(adminChannel).send(reportEmbed)
            }
            await messageSent.react("⛔")
            await messageSent.react("🚫")
            await messageSent.react("📨")
            const filter = (reaction, user) => user.id != bot.user.id
            const reactionCollector = await messageSent.createReactionCollector(filter, {time: 86400000})
            reactionCollector.on("collect", res => { 
                switch(res.emoji.name) {    // use reaction to do an action on the reported user
                    case "⛔":
                        if(res.member.hasPermission("BAN_MEMBER") === true) {
                        bot.registry.commands.find("name", "ban").run(msg, {user: `<@${reportedID}>`, reason: reportReason})
                        reactionCollector.stop()
                        }
                        break
                    case "🚫":
                        if(res.member.hasPermission("KICK_MEMBER") === true) {
                        bot.registry.commands.find("name", "kick").run(msg, {user: `<@${reportedID}>`, reason: reportReason})
                        reactionCollector.stop()
                        }
                        break
                    case "📨":
                        console.log(res)
                        messageSent.channel.send("Work In Progress")
                        reactionCollector.stop()
                        break
                }
            })
        }
    }
}