const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")

module.exports = class BypassCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'bypassglobalbans',
        aliases: ["bypassglobalbans"],
        group: 'managment',
        memberName: 'bypassglobalbans',
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
        description: [
            {
                lang: "fr",
                text: "Fr"
            },
            {
                lang: "en",
                text: "En"
            }
        ],
        format: "!bypassglobalbans [true/false]",
        examples: ["!bypassglobalbans true"],
        args: [{
            type: "boolean",
            prompt: "Do you want to Bypass Global Bans?",
            key: "state"
        }],
        userPermissions: ["MANAGE_GUILD"]
    })
}

    async run(msg, { state }) {
        const guild = msg.guild.id
        const db = mongoUtil.getDb()
        const guildCollection = await db.collection("guilds")
        let display
        switch(state) {
            case false:
                display = "prenderont effet"
                break
            case true:
                display = "ne prenderont pas effet"
                break
        }
        guildCollection.updateOne({guild_id: guild}, {$set: { bypassGlobalBans: state}})
        const bypassEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.check} Les Global Bans ${display}`)
            .setColor("#34495E")
            .setThumbnail(msg.author.displayAvatarURL)
            .setFooter(`Effectué`)
            .setTimestamp(Date.now())
        msg.say(bypassEmbed)
    }
}