const { Command } = require('discord.js-commando')
const mongoUtil = require("../../mongoUtil.js")

module.exports = class ShifumiCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'shifumi',
        group: 'economy',
        memberName: 'shifumi',
        description: [
            {
                lang: "fr",
                text: "Défie un joueur à un shifumi (pierre, feuille, ciseau)"
            },
            {
                lang: "en",
                text: "Challenge a player to a shifumi"
            }
        ],
        examples: ["!shifumi @iDraKz 1000"],
        fomat: ["!shifumi [user] [amount]"],
        args: [
            {
                type: "user",
                prompt: "Quelle utilisateur voulez-vous défié ?",
                key: "user",
                error: "Ceci n'est pas un utilisateur valide"
            },
            {
                type: "integer",
                prompt: "Combien voulez-vous parié ?",
                key: "amount",
                error: "Ceci n'est pas un montant valide"
            }
        ]
    })
}

    async run(msg, { user, amount }) {
        //Check if both user are different
        if (msg.author.id === user.id) {
            const sameUserError = new RichEmbed()
                .setTitle(`${this.client.emotes.cross} Vous ne pouvez pas vous provoquer en duel vous-même`)
                .setDescription("Duel annulé")
                .setColor("#E74C3C")
                .setThumbnail(msg.author.displayAvatarURL)
            return msg.say(sameUserError)
        }
        user = msg.guild.members.get(user.id).user

        //Check if both user has enough
        const checkMoneySender = await checkMoney(msg.author.id, amount)
        const checkMoneyReceiver = await checkMoney(user.id, amount)
        let notEnoughMoneyEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.cross} Vous n'avez pas assez de :gem:`)
            .setColor("#E74C3C")
        if (checkMoneySender[0] === false) { //check if sender has enough
            notEnoughMoneyEmbed.setThumbnail(msg.author.displayAvatarURL)
                .addField("Solde", `${checkMoneySender[1]} :gem:`)
            return msg.say(notEnoughMoneyEmbed)
        } else if (checkMoneyReceiver[0] === false) { //check if receiver has enough
            notEnoughMoneyEmbed.setThumbnail(user.displayAvatarURL)
                .addField("Solde", `${checkMoneyReceiver[1]} :gem:`)
            return msg.say(notEnoughMoneyEmbed)
        }

        //if check ok wait for answer
        const awaitDuelEmbed = new RichEmbed()
            .setTitle(`Vous avez provoqué ${user.username} à un shifumi`)
            .setDescription(`En attente de la réponse de <@${user.id}> tapez !accept pour accepter`)
            .setColor("#3498DB")
            .setThumbnail(msg.author.displayAvatarURL)
            .setFooter(`Duel provoqué le ${moment().format("DD/MM/YYYY [à] HH:mm:ss")}`)
        msg.say(awaitDuelEmbed)
        const filter = m => m.author.id === user.id && m.content.startsWith("!accept")

        //Collector to check if the receiver accept
        let collector = msg.channel.createCollector(filter, { time: 15000 })
        collector.on("collect", async element => {
            collector.stop("confirmation")
            //Create message and react to it
            const shifumiEmbed = new RichEmbed()
                .setTitle("Réagissez avec le mouvement que vous souhaitez faire")
                .setDescription("Le résultat sera affiché dans le cannal dans le quel le shifumi à été lancé")
                .setColor("#3498DB")
            let senderMessage = await msg.author.say(shifumiEmbed)
            let receiverMessage = await user.say(shifumiEmbed)
            let playerMessages = [senderMessage, receiverMessage]
            playerMessages.forEach(async message => {
                await message.react("✊")
                await message.react("🤚")
                await message.react("✌️")
            })
            //Create collector of senderMessage
            let reactionArray = []
            const senderFilter = (reaction, user) => (user.author.id === msg.author.id) && (reaction.emoji.name === ("✊" || "🤚" || "✌️"))
            senderMessage.awaitReactions(senderFilter, { max: 1 })
                .then(collected => {
                    collected = collected.array()
                    const querySender = {
                        player: msg.author,
                        pos: collected[0].emoji.name
                    }
                    reactionArray.push(querySender)
                })
            //Create collector of receiverMessage
            const receiverFilter = (reaction, user) => (user.author.id === user.id) && (reaction.emoji.name === ("✊" || "🤚" || "✌️"))
            receiverMessage.awaitReactions(receiverFilter, { max: 1 })
                .then(collected => {
                    collected = collected.array()
                    queryReceiver = {
                        player: user,
                        pos: collected[0].emoji.name
                    } 
                    reactionArray.push(queryReceiver)
                })
            const bothReceived = await checkBothReceived(reactionArray)
            if (bothReceived === true) {
                
            }
        })
        async function checkBothReceived(array) {
            setTimeout(() => {
                if (array.length < 2) {
                    checkBothReceived(array)
                } else {
                    return true
                }
            }, 1000)
        }
    }
}