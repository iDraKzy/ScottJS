const commando = require('discord.js-commando');
const editDoc = require("../../function/editDoc.js")
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const moment = require("moment")

module.exports = class GiveCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'give',
            aliases: ["gv"],
            group: 'economy',
            memberName: 'give',
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Donnez des gemmes à quelqu'un"
                },
                {
                    lang: "en",
                    text: "Give some gems to someone"
                }
            ],
            examples: ['!give @iDraKz 10'],
            args: [{
                type: "user",
                prompt: "Utilisateur au quel vous souhaitez donner des gemmes",
                key: "receiver"
            },
            {
                type: "integer",
                prompt: "Combien de gemmes souhaitez-vous donner ?",
                key: "give"
            }]
        })
    }

    async run(msg, { receiver, give }) {
        const db = mongoUtil.getDb()
        const collection = db.collection("members")

        let userDocReceiver = await collection.findOne({discord_id: receiver.id})
        let userDocGiver = await collection.findOne({discord_id: msg.author.id})
        let currentGiverMoney = userDocGiver["money"]
        let currentTime = moment().format("DD/MM/YYYY [à] HH:mm:ss")
        //check
        let errorEmbed = new RichEmbed()
            .setTitle(`${this.client.emojis.get("589793004965855272")} Don de ${msg.author.username}`)
            .setColor("#E74C3C")
            .setThumbnail(msg.author.displayAvatarURL)
            .setFooter(`Demandé le ${currentTime}`)
        if(give < 1) {
            errorEmbed.setDescription("Vous ne pouvez pas faire un don d'une valeur négative")
            return msg.say(errorEmbed)
        } else if (give > currentGiverMoney) {
            errorEmbed.setDescription("Vous ne pouvez pas donné plus que ce que vous n'avez")
            return msg.say(errorEmbed)
        }
        //execute
        editDoc.addMoney(receiver.id, give)
        editDoc.addMoney(msg.author.id, -(give))
        let giveEmbed = new RichEmbed()
            .setTitle(`${this.client.emojis.get("589792970266640413")} Don de ${msg.author.username}`)
            .setColor("#3498DB")
            .setThumbnail(msg.author.displayAvatarURL)
            .setDescription("Votre don à bien été enregistré")
            .addField("Valeur du don", `${give} :gem:`)
            .addField(`Nouveau portemonnaie de ${msg.author.username}`, `${currentGiverMoney - give} :gem:`)
            .addField(`Nouveau portemonnaie de ${receiver.username}`, `${userDocReceiver["money"] + give} :gem:`)
            .setFooter(`Don effectué le ${currentTime}`)
        msg.say(giveEmbed)
    }
}