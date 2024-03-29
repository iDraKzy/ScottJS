const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")

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
            oneOf: ["french", "english", "fr", "en"],
            error: "french et english seulent"
        }],
        userPermissions: ["MANAGE_GUILD"]
    })
}

    async run(msg, { lang }) {
        const guild = msg.guild.id
        const db = mongoUtil.getDb()
        const guildCollection = db.collection("guilds")
        let langDisplay
        if (lang === ("fr" || "french")) {
            lang = "fr"
            langDisplay = "français"
        } else if (lang === ("en" || "english")) {
            lang = "en"
            langDisplay = "anglais"
        }
        console.log(lang, langDisplay)
        guildCollection.updateOne({guild_id: guild}, {$set: {lang: lang}})
        const changeLanguageEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.check} Nouvelle langue définie sur ${langDisplay}`)
            .setDescription(":warning: Les messages systèmes sont en anglais pour l'instant")
            .setColor("#34495E")
            .setThumbnail(msg.member.guild.iconURL)
            .setFooter(`Effectué`)
            .setTimestamp(Date.now())
        msg.say(changeLanguageEmbed)
    }
}