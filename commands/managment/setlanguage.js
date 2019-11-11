const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")
const moment = require("moment")

module.exports = class LanguageCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'setlanguage',
        aliases: ["language"],
        group: 'managment',
        memberName: 'setlanguage',
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
        description: [
            {
                lang: "fr",
                text: "Défini la langue du serveur (anglais ou français uniquement votre )"
            },
            {
                lang: "en",
                text: "Define the language for your server (enlish or french only)"
            }
        ],
        format: "!setlanguage [language]",
        examples: ["!setlanguage french"],
        args: [{
            type: "string",
            prompt: "Which language do you want to use ? (french/english)",
            key: "lang",
            oneOf: ["french", "english"],
            error: "french et english seulent"
        }],
        userPermissions: ["MANAGE_GUILD"]
    })
}

    async run(msg, { lang }) {
        const guild = msg.guild.id
        const db = mongoUtil.getDb()
        const guildCollection = db.collection("guilds")
        const currentTime = moment().format("DD/MM/YYYY [à] HH:mm:ss")
        let langDisplay
        switch(lang) {
            case "french":
                lang = "fr"
                langDisplay = "français"
                break
            case "english":
                lang = "en"
                langDisplay = "anglais"
                break
        }
        console.log(lang)
        guildCollection.updateOne({guild_id: guild}, {$set: {lang: lang}})
        const changeLanguageEmbed = new RichEmbed()
            .setTitle(`${this.client.emojis.get("589792970266640413")} Nouvelle langue définie sur ${langDisplay}`)
            .setDescription(":warning: Les messages systèmes sont en anglais pour l'instant")
            .setColor("#34495E")
            .setThumbnail(msg.author.displayAvatarURL)
            .setFooter(`Effectué le ${currentTime}`)
        msg.say(changeLanguageEmbed)
    }
}