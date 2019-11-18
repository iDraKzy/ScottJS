const { Command } = require("discord.js-commando")
const { addMoney } = require("../../function/editDoc.js")
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const moment = require("moment")
const ms = require("parse-ms")
const i18n_module = require("i18n-nodejs")

module.exports = class DailiesCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: 'dailies',
            aliases: ["daily", "journalier"],
            group: 'economy',
            memberName: 'dailies',
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Réclame vos gemmes journalières."
                },
                {
                    lang: "en",
                    text: "Claim your daily gems."
                }
            ]
        })
    }
    async run(msg) {
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        const guildCollection = db.collection("guilds")
        const guildDoc = await guildCollection.findOne({guild_id: msg.guild.id})
        const translateDailies = new i18n_module(guildDoc.lang, "./../../translation/dailies.json")
        const userDoc = await collection.findOne({discord_id: msg.author.id})
        const lastDailies = userDoc.lastDailies
        const currentDate = Date.now()
        let gemToAdd = 1000 + (50 * userDoc.level) //Calculate base gems
        //Check premium
        switch(userDoc.premium) {
            case 1:
                gemToAdd * 1.25
                break
            case 2:
                gemToAdd * 1.5
                break
            case 3:
                gemToAdd * 1.75
                break
            case 4:
                gemToAdd * 2
                break
        }
        const currentGem = userDoc["money"] + gemToAdd
        if(currentDate - 1000 * 60 * 60 * 22 >= lastDailies) {
            //Give the gem if it was more than 22h since last dailies
            addMoney(msg.author.id, gemToAdd)
            const displayDate = moment().format(translateDailies.__("dateFormat"))
            collection.updateOne({discord_id: msg.author.id}, {$set: {lastDailies: currentDate}})
            const dailiesEmbed = new RichEmbed()
                .setTitle(translateDailies.__("rewardNameEmoji", {name: msg.author.username, emoji: this.client.emotes.check}))
                .setColor("#3498DB")
                .setDescription(translateDailies.__("gemReward", {gem: gemToAdd}))
                .setThumbnail(msg.author.displayAvatarURL)
                .setFooter(`${translateDailies.__("requested")} ${displayDate}`)
                .addField(translateDailies.__("gem"), `${currentGem} :gem:`)
            await msg.say(dailiesEmbed)
        } else {
            //Send an error if it was less
            let timePassed = currentDate - lastDailies
            let timeLeft = ms(1000 * 60 * 60 * 22 - timePassed)
            let timeLeftDisplay = moment().set({'hour': timeLeft.hours, 'minute': timeLeft.minutes, 'second': timeLeft.seconds}).format("HH:mm:ss")
            let dailiesFailEmbed = new RichEmbed ()
                .setTitle(translateDailies.__("rewardNameEmoji", {name: msg.author.username, emoji: this.client.emotes.cross}))
                .setColor("#E74C3C")
                .setThumbnail(msg.author.displayAvatarURL)
                .setDescription(`${translateDailies.__("alreadyReceived")} ${timeLeftDisplay}.`)
            await msg.say(dailiesFailEmbed)
        }
    }
}