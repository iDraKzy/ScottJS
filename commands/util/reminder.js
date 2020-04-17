const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const parsems = require("parse-ms")

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
            examples: ["The following will remind you in 3 days, 6 hours and 5 minutes for 'I like dogs': !reminder 3d6h5m I like dogs"],
            format: "!reminder [time] [reason]",
            args: [
                {
                    type: "string",
                    key: "date",
                    prompt: "Dans combien de temps voulez-vous le rappel?",
                    error: "Ceci n'est pas un format valide"
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


    async run(msg, { date, reason }) {
        const reminderCollection = mongoUtil.getDb().collection("reminders")
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
                    .setTitle(`${this.client.emotes.check} Rappel créer avec succès`)
                    .setThumbnail(msg.author.displayAvatarURL)
                    .setColor("#3498DB")
                    .setDescription("Un message vous sera envoyé lorsque ce temps sera écoulé")
                    .addField("Temps avant envoi", displayTime)
                    .addField("Contenu du message", reason)
                    .setFooter(`Rappel ajouté`)
                    .setTimestamp(Date.now())
                msg.say(reminderEmbed)
            })
            .catch(e => {
                const reminderError = new RichEmbed()
                    .setTitle(`${this.client.emotes.cross} Une erreur est survenue lors de l'ajout de votre rappel à la base de donnée`)
                    .setColor("#E74C3C")
                    .setDescription("Contactez iDraKz#1760 ou Heyoxe#0557")
                    .addField("Description de l'erreur", e)
                msg.say(reminderError)
            })
    }
}