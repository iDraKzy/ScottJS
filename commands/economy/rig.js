const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")

module.exports = class DailiesCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: 'rig',
            aliases: ["rig"],
            group: 'economy',
            memberName: 'rig',
            ownerOnly: true,
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Soyez sûr de gagner le prochain coin-flip."
                },
                {
                    lang: "en",
                    text: "Be sure to win the next coin-flip."
                }
            ]
        })
    }
    async run(msg) {
        if (msg.channel.type === "dm") {
            const db = mongoUtil.getDb()
            const collection = db.collection("members")
            const userDoc = await collection.findOne({discord_id: msg.author.id})
            const isRigged = userDoc["isRigged"]
            collection.updateOne({discord_id: msg.author.id}, {$set: {isRigged: !isRigged}})
            if (isRigged) {
                const offEmbed = new RichEmbed()
                    .setTitle("Maître! Que faites-vous voyons? Vous avez les même chances de gagner ou de perde au coin-flip que ces misérables humains, reprennez-vous bon dieu!")
                    .setColor("#E74C3C")
                await msg.say(offEmbed)           
            } else {
                const onEmbed = new RichEmbed()
                    .setTitle("Maître, je vais m'empresser de modifier notre algorithme de coin-flip aléatoire afin de vous faire gagner à chaques fois.")
                    .setColor("#2ECC71")
                await msg.say(onEmbed)               
            }
        } else {
            msg.delete()
        }
    }
}