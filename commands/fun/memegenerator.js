const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const request = require("request")
const botSettings = require("../../botsettings.json")
const fetch = require("node-fetch")
const FormData = require("form-data")

module.exports = class MemeCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'meme',
        aliases: ["memegenerator", "memes"],
        group: 'fun',
        memberName: 'meme',
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
        description: [
            {
                lang: "fr",
                text: "Génère un meme choisi avec les textes entrées"
            },
            {
                lang: "en",
                text: "Generate a choosen meme avec the given texts"
            }
        ],
        format: "!meme [meme] [text1] [text2] [text3?] [text4?] [text5?]",
        details: "\n\n**Nombre de textes nécessaires :**\n\ndistracted: 3\nbatman: 2\ndrake: 2\ntwo_buttons: 2\nspongebob: 2\nchange_my_mind: 2\nleft_exit: 3\nbrain: 4\npikachu: 3 \nbaloon: 5\nthink: 2\nwinnie: 2\n",
        examples: ["!meme distracted box1 ; box2 ; box3", "!meme batman box1 ; box2"],
        args: [{
            type: "string",
            prompt: "Quelle meme souhaitez-vous utilisé ? (faites \"!help meme\" pour avoir une liste de tous les meme dispo",
            key: "meme",
            oneOf: ["distracted", "batman", "drake", "two_buttons", "spongebob", "change_my_mind", "left_exit", "brain", "pikachu", "baloon", "think", "winnie"],
            error: "Ceci n'est pas un meme valide"
            }, 
        {
            type: "string",
            prompt: "Texte séparé par des ; en fonction du nombre de box nécessaire pour chaque meme (\"!help meme\" pour savoir le nombre de box (sous details))",
            key: "box",
            error: "Texte invalide"
            }]
        })
    }

    async run(msg, { meme, box }) {
        const url = "https://api.imgflip.com/caption_image"
        let memeID
        let boxNumber
        switch(meme) {
            case "distracted":
                memeID = 112126428
                boxNumber = 3
                break
            case "batman":
                memeID = 438680
                boxNumber = 2
                break
            case "drake":
                memeID = 181913649
                boxNumber = 2
                break
            case "two_buttons":
                memeID = 87743020
                boxNumber = 2
                break
            case "spongebob":
                memeID = 102156234
                boxNumber = 2
                break
            case "change_my_mind":
                memeID = 129242436
                boxNumber = 2
                break
            case "left_exit":
                memeID = 124822590
                boxNumber = 3
                break
            case "brain":
                memeID = 93895088
                boxNumber = 4
                break
            case "pikachu":
                memeID = 155067746
                boxNumber = 3
                break
            case "baloon":
                memeID = 131087935
                boxNumber = 5
                break
            case "think":
                memeID = 89370399
                boxNumber = 2
                break
            case "winnie":
                memeID = 178591752
                boxNumber = 2
                break
        }
        box = box.split(" ; ")
        let valid = checkBoxNumber(box, boxNumber)
        if (valid === true) {
            let queryBox = []
            for (let index = 0; index < boxNumber; index++) {
                queryBox.push({
                    "text": box[index]
                })
            }
            let query = {
                template_id: memeID,
                username: botSettings.imgFlipUsername,
                password: botSettings.imgFlipPassword,
                boxes: queryBox
            }
            let boxes = query.boxes.map((k, i) => { return `boxes[${i}][text]=${encodeURIComponent(k.text)}`}).join('&')
            let params = `?template_id=${query.template_id}&username=${query.username}&password=${encodeURIComponent(query.password)}&${boxes}`
            fetch(url + params, {method: 'POST'})
                .then(res => res.json())
                .then(json => {
                    let generatedMeme = json.data.url
                    const memeEmbed = new RichEmbed()
                        .setTitle(`Voici le meme demandé par ${msg.author.username}`)
                        .setColor("#9B59B6")
                        .setImage(generatedMeme)
                        .setFooter(`Généré`)
                        .setTimestamp(Date.now())
                    msg.say(memeEmbed)
                })

        }
        
        function checkBoxNumber(box, boxNumber) {
            if(box.length !== boxNumber) {
                msg.say("Vous n'avez pas fourni le nombre de textes nécessaires, merci de séparer vos textes par \" ; \"")
                return false
            } else return true
        }
    }
}