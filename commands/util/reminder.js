const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const parsems = require("parse-ms")
const moment = require("moment")

module.exports = class ReminderCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: 'reminder',
            aliases: ["remind", "rappel"],
            group: 'util',
            memberName: 'reminder',
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Défini un rappel et envoi un message lorsque la date est atteinte"
                },
                {
                    lang: "en",
                    text: "Define a reminder and send a private message once the date is reached"
                }
            ],
            examples: ["!reminder 1:06:10:15 Go to sleep", "!reminder 0:00:50:15"],
            format: "!reminder [time] [reason]",
            args: [
                {
                    type: "integer",
                    key: "mins",
                    prompt: "Combien de minutes avant le rappel ?",
                    error: "Ceci n'est pas un nombre"
                },
                {
                    type: "string",
                    key: "reason",
                    prompt: "Quel message devrais-je vous envoyer ?",
                    error: "Ceci n'est pas un text valide"
                }
            ]
        })
    }


    async run(msg, { mins, reason }) {
        const reminderCollection = mongoUtil.getDb().collection("reminders")
        const minsMS = mins * 60 * 1000
        const query = {
            discord_id: msg.author.id,
            guild: msg.guild.id,
            username: msg.author.username,
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
        reminderCollection.insertOne(query)
            .then(() => {
                const reminderEmbed = new RichEmbed()
                    .setTitle(":white_check_mark: Rappel créer avec succès")
                    .setThumbnail(msg.author.displayAvatarURL)
                    .setColor("#3498DB")
                    .setDescription("Un message vous sera envoyé lorsque ce temps sera écoulé")
                    .addField("Temps avant envoi", displayTime)
                    .addField("Contenu du message", reason)
                    .setFooter(`Rappel ajouté le ${moment().format("DD/MM/YYYY [à] HH:mm:ss")}`)
                msg.say(reminderEmbed)
            })
            .catch(e => {
                const reminderError = new RichEmbed()
                    .setTitle(":x: Une erreur est survenue lors de l'ajout de votre rappel à la base de donnée")
                    .setColor("#E74C3C")
                    .setDescription("Contactez iDraKz#1760")
                    .addField("Description de l'erreur", e)
                msg.say(reminderError)
            })
    }
}