const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const { addMoney } = require("../../function/editDoc.js")
const moment = require("moment")
const { checkMoney } = require("../../function/econFunc.js")

module.exports = class DuelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'duel',
            aliases: ["1v1"],
            group: 'economy',
            memberName: 'duel',
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            format: "!duel [user] [amount]",
            examples: ["!duel @iDraKz 1000"],
            description: [
                {
                    lang: "fr",
                    text: "Provoque un utilisateur en duel, si il accepte et que vous perdez il remportera votre mise."
                },
                {
                    lang: "en",
                    text: "Challenge a user in a duel, if he agrees and you lose, you'll lose all the gems you've bet"
                }
            ],
            args: [
                {
                    type: "user",
                    prompt: "Quelle utilisateur souhaitez-vous provoquer en duel ?",
                    key: "user",
                    error: "Ceci n'est pas un utilisateur"
                },
                {
                    type: "integer",
                    prompt: "Combien souhaitez-vous misé ?",
                    key: "amount",
                    error: "Ceci n'est pas un montant valide"
                }
            ]
        })
    }

    async run(msg, { user, amount }) {
        user = msg.guild.members.get(user.id).user
        //Check if both user has enough
        const checkMoneySender = await checkMoney(msg.author.id, amount)
        const checkMoneyReceiver = await checkMoney(user.id, amount)
        let notEnoughMoneyEmbed = new RichEmbed()
            .setTitle(`:x: Vous n'avez pas assez de :gem:`)
            .setColor("#E74C3C")
        if (checkMoneySender[0] === false) { //check if sender has enough
            notEnoughMoneyEmbed.setThumbnail(msg.author.displayAvatarURL)
                .addField("Solde", `${checkMoneySender[1]} :gem:`)
            msg.say(notEnoughMoneyEmbed)
            return
        } else if (checkMoneyReceiver[0] === false) { //check if receiver has enough
            notEnoughMoneyEmbed.setThumbnail(user.displayAvatarURL)
                .addField("Solde", `${checkMoneyReceiver[1]} :gem:`)
            msg.say(notEnoughMoneyEmbed)
            return
        }
        //if check ok, wait for receiver answer
        const awaitDuelEmbed = new RichEmbed()
            .setTitle(`Vous avez provoqué ${user.username} en duel`)
            .setDescription(`En attente de la réponse de <@${user.id}> tapez !accept pour accepter`)
            .setColor("#3498DB")
            .setThumbnail(msg.author.displayAvatarURL)
            .setFooter(`Duel provoqué le ${moment().format("DD/MM/YYYY [à] HH:mm:ss")}`)
        msg.say(awaitDuelEmbed)
        const filter = m => m.author.id === user.id && m.content.startsWith("!accept")
        //Collector to check if the receiver accept
        let collector = msg.channel.createCollector(filter, { time: 15000})
        collector.on("collect", element => {
            const duelRules = new RichEmbed()
                .setTitle(`${this.client.emojis.get("589792970266640413")} Duel accepté`)
                .setColor("#3498DB")
                .setDescription("Le premier à envoyer un message à partir de maintenant sera déclarer gagnant")
                .addField("Somme en jeu", `${amount} :gem:`)
            await msg.say(duelRules)
            const filterAwait = m => m.author.id === msg.author.id && m.author.id === user.id
            let winner, loser
            //Define the winner
            msg.channel.awaitMessages(filterAwait, { max: 1 })
                .then(collected => {
                    const messageReceived = collected.array()[0]
                    if (messageReceived.author.id === msg.author.id) {
                        winner = msg.author
                        loser = user
                    } else {
                        winner = user
                        loser = msg.author
                    }
                    const winEmbed = new RichEmbed()
                        .setTitle(`Félicitation ${winner.username} vous avez gagné`)
                        .setDescription(`${this.client.emojis.get("589792970266640413")} ${winner.username} vous remportez ${amount} :gem:\n\n\
                        ${this.client.emojis.get("589793004965855272")} ${loser.username} vous perdez ${amount} :gem:`)
                        .setThumbnail(winner.displayAvatarURL)
                        .setColor("#3498DB")
                        .setFooter(`Duel effectué le ${moment().format("DD/MM/YYYY [à] HH:mm:ss")}`)
                    msg.say(winEmbed)
                    addMoney(winner.id, amount)
                    addMoney(loser.id, -(amount))
                    collector.stop("confirmation")
            })
        })
            //Generate the embed declaring the winner
        collector.on("end", (collected, reason) => {
            if (reason !== "confirmation") {
                const timeoutEmbed = new RichEmbed()
                    .setTitle(`${this.client.emojis.get("589793004965855272")} ${user.username} n'a pas répondu`)
                    .setColor("#E74C3C")
                    .setDescription("Duel annulé")
                    .setThumbnail(user.displayAvatarURL)
                msg.say(timeoutEmbed)
            }
        })
    }
}