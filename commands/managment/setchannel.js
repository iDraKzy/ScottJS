const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")

module.exports = class SetChannelCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: 'setchannel',
            aliases: ["botchannel", "messagechannel"],
            group: 'managment',
            memberName: 'setchannel',
            clientPermissiosn: ["VIEW_CHANNEL", "SEND_MESSAGES"],
            description: [
                {
                    lang: "fr",
                    text: "Définis le channel mentionné comme le type de cannal sépcifé (admin (cannal ou les rapports administratifs seront envoyés) ou bot (cannal ou les messages automatiques du bot seront envoyés)) (Admin uniquement)"
                },
                {
                    lang: "en",
                    text: "Set the mentionned channel to the type you specified (admin (the channel where the administration report should be sent) or bot (channel where the automatic messages of the bot should be send)) (Admin Only)"
                }
            ],
            format: "!setchannel [type de channel] [channel]",
            args: [{
                type: "string",
                prompt: "Définissez le type de channel (bot ou admin)",
                key: "type",
                error: "Le type ne peut être que \"bot\" ou \"admin\""
            }, 
            {
                type: "channel",
                prompt: "Quelle channel souhaitez vous utilisé (taggé le)",
                key: "channel",
                error: "Vous devez taggé un channel"
            }],
            userPermissions: ["MANAGE_GUILD"]
        })
    }

    async run(msg, { type, channel }) {
        const db = mongoUtil.getDb()
        const guildCollection = db.collection("guilds")
        const guildID = msg.guild.id
        channel = channel.toString().replace(/\D/g, '')
        let updateQuery
        switch(type) {
            case "bot":
                updateQuery = {
                    $set: {botChannel: channel}
                }
                break
            case "admin":
                updateQuery = {
                    $set: {adminChannel: channel}
                }
                break
        }
        guildCollection.updateOne({guild_id: guildID}, updateQuery)
        const setChannelEmbed = new RichEmbed()
            .setTitle(`${this.client.emotes.check} Nouveau channel ${type} défini`)
            .setColor("#34495E")
            .setThumbnail(msg.member.guild.iconURL)
            .setDescription(`Nouveau channel défini sur <#${channel}>`)
            .setFooter(`Effectué`)
            .setTimestamp(Date.now())
        msg.say(setChannelEmbed)
    }
}