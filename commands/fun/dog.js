const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const editDoc = require("../../function/editDoc.js")
const fetch = require("node-fetch")
const moment = require("moment")


module.exports = class DogCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "dog",
            aliases: ["chien"],
            group: "fun",
            memberName: "dog",
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Envoi une image de chien aléatoire"
                },
                {
                    lang: "en",
                    text: "Send a random picture of a dog"
                }
            ],
            format: "!cat"
        })
    }
    async run(msg) {
        editDoc.checkGuild(msg.author.id, msg.member.guild.id)
        let displayDate = moment().format("DD[/]MM[/]YYYY [à] HH[:]mm[:]ss")

        fetch("https://api.thedogapi.com/v1/images/search")
            .then(res => res.json())
            .then(json => {
                console.log(json)
                editDoc.addImageRequested(msg)
                const dogEmbed = new RichEmbed()
                    .setTitle("Voici votre chien aléatoire")
                    .setColor("#9B59B6")
                    .setImage(json[0].url)
                    .setFooter(`Demandé le ${displayDate} par ${msg.author.username}`)
                msg.say(dogEmbed)
            })
            .catch(() => {
                const errorDogEmbed = new RichEmbed()
                    .setTitle(`${this.client.emotes.cross} Une erreur est survenue`)
                    .setDescription("Contactez iDraKz#1760 ou Heyoxe#0557")
                    .setColor("#E74C3C")
                msg.say(errorDogEmbed)
            })
    }
}
