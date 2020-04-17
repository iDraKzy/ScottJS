const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const editDoc = require("../../function/editDoc.js")
const fetch = require("node-fetch")


module.exports = class CatCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "cat",
            aliases: ["chat"],
            group: "fun",
            memberName: "cat",
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Envoi une image de chat aléatoire"
                },
                {
                    lang: "en",
                    text: "Send a random picture of a cat"
                }
            ],
            format: "!cat"
        })
    }
    async run(msg) {
        editDoc.checkGuild(msg.author.id, msg.member.guild.id)

        fetch("https://api.thecatapi.com/v1/images/search")
            .then(res => res.json())
            .then(json => {
                console.log(json)
                editDoc.addImageRequested(msg)
                const catEmbed = new RichEmbed()
                    .setTitle("Voici votre chat aléatoire")
                    .setColor("#9B59B6")
                    .setImage(json[0].url)
                    .setFooter(`Demandé par ${msg.author.username}`)
                    .setTimestamp(Date.now())
                msg.say(catEmbed)
            })
            .catch(() => {
                const errorCatEmbed = new RichEmbed()
                    .setTitle(`${this.client.emotes.cross} Une erreur est survenue`)
                    .setDescription("Contactez iDraKz#1760 ou Heyoxe#0557")
                    .setColor("#E74C3C")
                msg.say(errorCatEmbed)
            })
    }
}
