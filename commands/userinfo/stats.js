const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const roundTo = require("round-to")
const editDoc = require("../../function/editDoc.js")
const moment = require("moment")




module.exports = class StatsCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "stats",
            aliases: ["statistics", "stat", "info"],
            group: "userinfo",
            memberName: "stats",
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Envoi vos statistiques utilisateurs"
                },
                {
                    lang: "en",
                    text: "Send your user stats"
                }
            ],
            format: "!stats"
        })
    }
    async run(msg) {
        const db = mongoUtil.getDb()
        editDoc.checkGuild(msg.author.id, msg.member.guild.id)
        const collection = db.collection("members")
        const currentDate = moment().format("DD/MM/YYYY [à] HH:mm:ss")
        let userDoc = await collection.findOne({"discord_id": msg.author.id})
        console.log(userDoc)
        let messageSent = userDoc["message_sent"]
        let vocTime = userDoc["voc_time"]
        let imagesRequest = userDoc["image_requested"]
        let points = Math.round(userDoc["points"])
        let level = userDoc["level"]
        let money = userDoc["money"]

        let hour = roundTo.down(vocTime / 3600, 0)
        vocTime -= hour * 3600
        let minute = roundTo.down(vocTime / 60, 0)
        vocTime -= minute * 60
        let second = vocTime
        hour = addZero(hour)
        minute = addZero(minute)
        second = addZero(second)
        vocTime = hour + ":" + minute + ":" + second
        let statsEmbed = new RichEmbed()
            .setTitle(`Statistiques de ${msg.author.username}`)
            .setColor("#2ECC71")
            .setThumbnail(msg.author.avatarURL)
            .addField("Messages envoyés", messageSent, true)
            .addField("Images demandés", imagesRequest, true)
            .addField("Xp actuel", points, true)
            .addField("Niveau actuel", level, true)
            .addField("Temps passé dans un canal", vocTime)
            .addField("Gemmes actuelles", `${money} :gem:`)
            .setFooter(`Demandé le ${currentDate}`)
        msg.say(statsEmbed)

        function addZero(number) {
            if (number < 10) {
              return "0" + number.toString()
            } else return number
          }
    }
}