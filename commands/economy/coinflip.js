const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js") 
const { checkMoney, addMoney } = require("../../function/econFunc.js")
const mongoUtil = require("../../mongoUtil.js")
const i18n_module = require("i18n-nodejs")
const mongodb = require("mongodb")

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
        let isRigged = userDoc["isRigged"]
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
                .setTitle(translateCoinflip.__("errorFlip", {emoji: this.client.emotes.cross}))
                .setColor("#E74C3C")
                .setThumbnail(msg.author.displayAvatarURL)
                .setDescription(translateCoinflip.__("notEnough"))
                .addField(translateCoinflip.__("wallet"), `${currentMoney} :gem:`)
            return msg.say(notEnoughMoneyEmbed)
        } else {
            const gemsMeta = await checkMoney(msg.author.id, bet)
            if (bet > 10000) {
                const noMoreThan = new RichEmbed()
                    .setTitle(translateCoinflip.__("errorFlip", {emoji: this.client.emotes.cross}))
                    .setColor("#E74C3C")
                    .setThumbnail(msg.author.displayAvatarURL)
                    .setDescription(translateCoinflip.__("noMoreThan", {limit: gemsMeta[2]}))
                return msg.say(noMoreThan)
            }
            console.log(gemsMeta)
            if (!gemsMeta[5]) {
                const Embed = new RichEmbed()
                    .setTitle(translateCoinflip.__("info", { emoji: this.client.emotes.info}))
                    .setColor("#3498db")
                    .setDescription(translateCoinflip.__("dailyLimit"))
                msg.say(Embed)                   
            }
            if ((gemsMeta[3] + bet) > gemsMeta[2]) {
                const Embed = new RichEmbed()
                    .setTitle(translateCoinflip.__("errorFlip", {emoji: this.client.emotes.cross}))
                    .setColor("#E74C3C")
                    .setThumbnail(msg.author.displayAvatarURL)
                    .setDescription(translateCoinflip.__("winningLimitReached"))
                    .addField(translateCoinflip.__("limit"), `${gemsMeta[2]} :gem:`)
                    .addField(translateCoinflip.__("gemsRecivied"), `${gemsMeta[3]} :gem:`)
                return msg.say(Embed)
            } else {
                let coinFlip = Math.round(Math.random() * 10)
                let coinImage
                let result
                if( coinFlip <= 5 || (isRigged && side == "head")) {
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
                    
                    if(result === side || isRigged) {
                        resultEmbed.setDescription(translateCoinflip.__("won", {emoji: this.client.emotes.check}))
                        addMoney(msg.author.id, bet)
                        currentMoney += bet
                        resultEmbed.addField(translateCoinflip.__("newBalance"), `${currentMoney} :gem:`)
                        resultEmbed.addBlankField()
                        resultEmbed.addField(translateCoinflip.__("limit"), `${gemsMeta[2]} :gem:`)
                        resultEmbed.addField(translateCoinflip.__("gemsRecivied"), `${gemsMeta[3] + bet} :gem:`)
                        collection.updateOne({discord_id: msg.author.id}, {$set: {
                            won: mongodb.Int32(gemsMeta[3] + bet)
                        }})
                    } else {
                        resultEmbed.setDescription(translateCoinflip.__("lost", {emoji: this.client.emotes.cross}))
                        addMoney(msg.author.id, -(bet))
                        currentMoney -= bet
                        resultEmbed.addField(translateCoinflip.__("newBalance"), `${currentMoney} :gem:`)
                        resultEmbed.addBlankField()
                        resultEmbed.addField(translateCoinflip.__("limit"), `${gemsMeta[2]} :gem:`)
                        resultEmbed.addField(translateCoinflip.__("gemsRecivied"), `${gemsMeta[3]} :gem:`)
                }
                msg.say(resultEmbed)
            }
        }
    }
}