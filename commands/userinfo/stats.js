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
                    text: "Envoi vos statistiques utilisateurs ou celle d'un utilisateur spécifié"
                },
                {
                    lang: "en",
                    text: "Send your user stats or the one of a specified user"
                }
            ],
            format: "!stats",
            args: [
                {
                    type: "user",
                    prompt: "Quelle utilisateur souhaitez-vous connaître les stats ?",
                    default: "",
                    key: "user"
                }
            ],
        })
    }
    async run(msg, { user }) {

        //Handler if user is specified
        if (!user) {
            user = msg.author
        } else {
            const member = msg.guild.members.get(user.id)
            user = member.user
            editDoc.checkGuild(user.id, member.guild.id)
        }
        const db = mongoUtil.getDb()
        editDoc.checkGuild(msg.author.id, msg.member.guild.id)
        const collection = db.collection("members")
        const currentDate = moment().format("DD/MM/YYYY [à] HH:mm:ss")
        const userDoc = await collection.findOne({"discord_id": user.id})
        let vocTime = userDoc.voc_time
        console.log(userDoc)

        //Stringify the vocTime
        let hour = roundTo.down(vocTime / 3600, 0)
        vocTime -= hour * 3600
        let minute = roundTo.down(vocTime / 60, 0)
        vocTime -= minute * 60
        let second = vocTime
        hour = addZero(hour)
        minute = addZero(minute)
        second = addZero(second)
        vocTime = hour + ":" + minute + ":" + second

        //Create and send the Embed
        let statsEmbed = new RichEmbed()
            .setTitle(`Statistiques de ${user.username}`)
            .setColor("#2ECC71")
            .setThumbnail(user.displayAvatarURL)
            .addField("Messages envoyés", userDoc.message_sent, true)
            .addField("Images demandés", userDoc.image_requested, true)
            .addField("Xp actuel", Math.round(userDoc.points), true)
            .addField("Niveau actuel", userDoc.level, true)
            .addField("Temps passé dans un canal", vocTime)
            .addField("Gemmes actuelles", `${userDoc.money} :gem:`)
            .setFooter(`Demandé le ${currentDate}`)
        msg.say(statsEmbed)

        function addZero(number) {
            if (number < 10) {
              return "0" + number.toString()
            } else return number
          }
    }
}