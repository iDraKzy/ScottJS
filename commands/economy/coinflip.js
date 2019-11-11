const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js") 
const { addMoney } = require("../../function/editDoc.js")
const mongoUtil = require("../../mongoUtil.js")
const i18n_module = require("i18n-nodejs")

module.exports = class CoinFlipCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: 'coinflip',
            aliases: ["cf", "flip"],
            group: 'economy',
            memberName: 'coinflip',
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            format: "!coinflip [side] [bet]",
            description: [
                {
                    lang: "fr",
                    text: "Lance une pièce, parié sur pile ou face et choisisez le montant que vous pariez (gagner double la mise)"
                },
                {
                    lang: "en",
                    text: "Flip a coin, bet on head or tail and pick an amount of gems to bet (you double your bet if you win)"
                }
            ],
            examples: ['!coinflip pile 10000', '!cf face 5000', '!coinflip pile 2000'],
            args: [{
                type: "string",
                prompt: "Pile ou face ?",
                oneOf: ["pile", "face", "head", "tail"],
                key: "side",
                error: "Ceci n'est pas une face valide"
            },
            {   
                type: "integer",
                prompt: "Combien voulez-vous parié ?",
                key: "bet",
                error: "Ceci n'est pas un montant valide"
            }]
        })
    }

    async run(msg, { side, bet }) {
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        const guildCollection = db.collection("guilds")
        const guildDoc = await guildCollection.findOne({guild_id: msg.guild.id})
        const lang = guildDoc["lang"]
        let translateCoinflip = new i18n_module(lang, "./../../translation/coinflip.json")
        let userDoc = await collection.findOne({discord_id: msg.author.id})
        let currentMoney = userDoc["money"]
        switch(side) {
            case "face":
                side = "head"
                break
            case "pile":
                side = "tail"
                break
        }
        if(bet > currentMoney) {
            const notEnoughMoneyEmbed = new RichEmbed()
                .setTitle(translateCoinflip.__("errorFlip"))
                .setColor("#E74C3C")
                .setThumbnail(msg.author.displayAvatarURL)
                .setDescription(translateCoinflip.__("notEnough"))
                .addField(translateCoinflip.__("wallet"), `${currentMoney} :gem:`)
            return msg.say(notEnoughMoneyEmbed)
        } else {
            let coinFlip = Math.round(Math.random() * 10)
            console.log(coinFlip)
            let coinImage
            let result
            if( coinFlip <= 5) {
                result = "head"
                coinImage = "https://www.random.org/coins/faces/60-eur/belgium-1euro/obverse.jpg"
                // head
            } else {
                result = "tail"
                coinImage = "https://www.random.org/coins/faces/60-eur/belgium-1euro/reverse.jpg"
                // tail
            }
            const resultEmbed = new RichEmbed()
                .setTitle(translateCoinflip.__("flipName", {name: msg.author.username}))
                .setColor("#3498DB")
                .setThumbnail(msg.author.displayAvatarURL)
                .setImage(coinImage)
                .addField(translateCoinflip.__("betOn"), translateCoinflip.__(side))
                .addField(translateCoinflip.__("bet"), `${bet} :gem:`)

            if(result === side) {
                resultEmbed.setDescription(translateCoinflip.__("won", {emoji: this.client.emojis.get("589792970266640413")}))
                addMoney(msg.author.id, bet)
                currentMoney += bet
                resultEmbed.addField(translateCoinflip.__("newBalance"), `${currentMoney} :gem:`)
            } else {
                resultEmbed.setDescription(translateCoinflip.__("lost", {emoji: this.client.emojis.get("589793004965855272")}))
                addMoney(msg.author.id, -(bet))
                currentMoney -= bet
                resultEmbed.addField(translateCoinflip.__("newBalance"), `${currentMoney} :gem:`)
            }
            msg.say(resultEmbed)
        }
    }
}