const { Command } = require('discord.js-commando')
const Discord = require("discord.js")
const editDoc = require("../../function/editDoc.js")
const fetch = require("node-fetch")

module.exports = class PhotosComamnd extends Command {
    constructor(client) {
        super(client, {
            name: 'photos',
            aliases: ["pic", "randompic", "randomphotos"],
            group: 'fun',
            memberName: 'photos',
            clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
            format: "!photos",
            description: [
                {
                    lang: "fr",
                    text: "Envoi une photo complètement aléatoire"
                },
                {
                    lang: "en",
                    text: "Send a completely random picture"
                }
            ]
        })
    }

    async run(msg) {
        let width = getRandom(3, 19) * 100
        let height = getRandom(3, 10) * 100
        let url = `https://picsum.photos/${width}/${height}.jpg`
        fetch(url, { method: 'GET' })
            .then(res => res.buffer())
            .then(buffer => {
                editDoc.addImageRequested(msg)

                const Attachment = new Discord.Attachment(buffer, "photos.jpg")
                let photosEmbed = new Discord.RichEmbed()
                    .setTitle("Voici votre photo aléatoire")
                    .setColor("#9B59B6")
                    .attachFile(Attachment)
                    .setFooter(`Demandé par ${msg.author.username}`)
                    .setTimestamp(Date.now())
                msg.say(photosEmbed)
            })

        function getRandom(min, max) {
            return Math.round(Math.random() * (max - min) + min);
        }
    }
}