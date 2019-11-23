const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const moment = require("moment")
const { addPoints } = require("../../function/levelFunc.js")
const { addMoney } = require("../../function/econFunc.js")
const roundTo = require("round-to")

module.exports = class ConvertCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'convert',
            aliases: ["transform"],
            group: 'economy',
            memberName: 'convert',
            clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
            description: [
                {
                    lang: "fr",
                    text: "Convertissez vos gemmes en Xp (50 gemmes => 1Xp)"
                },
                {
                    lang: "en",
                    text: "Convert your gems into Xp (50 gems => 1Xp)"
                }
            ],
            examples: ['!convert 100'],
            args: [{
                type: "integer",
                prompt: "Combien de gemmes voulez-vous convertir ?",
                key: "amount"
            }]
        })
    }

    async run(msg, { amount }) {
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        let userDoc = await collection.findOne({discord_id: msg.author.id})
        let currentTime = moment().format("DD[/]MM[/]YYYY [à] HH[:]mm[:]ss")
        let currentMoney = userDoc["money"]
        let currentPoints = userDoc["points"]
        const convertErrorEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.cross} Convertion de gemmes de ${msg.author.username}`)
            .setThumbnail(msg.author.displayAvatarURL)
            .setColor("#E74C3C")
            .addField("Votre portemonnaie", `${currentMoney} :gem:`)
            .setFooter(`Demandé le ${currentTime}`)
        if(amount > currentMoney) {
            convertErrorEmbed.setDescription("Vous n'avez pas assez de :gem:")
            return msg.say(convertErrorEmbed)
        } else if (amount < 0) {
            convertErrorEmbed.setDescription("Vous ne pouvez pas convertir un nombre négatif de :gem:")
            return msg.say(convertErrorEmbed)
        } else {
            const convertEmbed = new RichEmbed()
                .setTitle(`${this.client.emotes.check} Convertion de gemmes pour ${msg.author.username}`)
                .setDescription(`Vous avez converti ${amount} :gem: avec succès`)
                .setThumbnail(msg.author.displayAvatarURL)
                .setColor("#3498DB")
                .addField("Nouveau portemonnaie", `${currentMoney - amount} :gem:`)
                .addField("Nouvelle expérience", `${roundTo(currentPoints + amount / 50, 2)} Xp`)
                .setFooter(`Converti le ${currentTime}`)
            console.log(`amount : ${amount/50}`)
            addPoints(msg.member, amount / 50)
            addMoney(msg.author.id, -(amount))
            msg.say(convertEmbed)
        }
    }
}