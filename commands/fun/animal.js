const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const editDoc = require("../../function/editDoc.js")
const request = require("request")
const moment = require("moment")


module.exports = class AnimalsCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "animal",
            aliases: ["randomanimal"],
            group: "fun",
            memberName: "animal",
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Envoi une image d'animal aléatoire (chat et chien uniquement pour l'instant)"
                },
                {
                    lang: "en",
                    text: "Send a random picture of an animal (cat and dog only at the moment)"
                }
            ],
            fortmat: "!animal [animal]",
            args: [{
                type: "string",
                prompt: "Quel animal désirez-vous (chat ou chien)",
                oneOf: ["chat", "chien", "dog", "cat"],
                key: "animal"
            }]
        })
    }
    async run(msg, { animal }) {
        editDoc.checkGuild(msg.author.id, msg.member.guild.id)
        var animalDisplay
        switch(animal) {
            case "cat":
                animalDisplay = "chat"
                break
            case "dog":
                animalDisplay = "chien"
                break
            case "chien":
                animalDisplay = "chien"
                animal = "dog"
                break
            case "chat":
                animalDisplay = "chat"
                animal = "cat"
                break
        }
        let displayDate = moment().format("DD[/]MM[/]YYYY [à] HH[:]mm[:]ss")

        let _url = `https://api.the${animal}api.com/v1/images/search`
        request.get(_url, (err, res, body) => {
            if (err) return msg.say("Une erreur est survenue")
            let randomImage = JSON.parse(body)
            editDoc.addImageRequested(msg)

            let imageEmbed = new RichEmbed()
                .setTitle(`Voici votre ${animalDisplay} aléatoire !`)
                .setColor("#9B59B6")
                .setImage(randomImage[0].url)
                .setFooter(`Demandé le ${displayDate} par ${msg.author.username}`)
    
            msg.say(imageEmbed)
        })

    }
}
