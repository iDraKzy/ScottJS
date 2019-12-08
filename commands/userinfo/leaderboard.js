const { RichEmbed } = require("discord.js")
const { Command } = require('discord.js-commando')
const mongoUtil = require("../../mongoUtil.js")


module.exports = class LeaderboardCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: 'leaderboard',
            aliases: ["leader", "lb"],
            group: 'userinfo',
            memberName: 'leaderboard',
            clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
            description: [
                {
                    lang: "fr",
                    text: "Affiche le top 10 des utilisateurs du serveur."
                },
                {
                    lang: "en",
                    text: "Display the 10 most active users."
                }
            ],
            format: "!userinfo"
        })
    }

    async run(msg) {
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        let guildID = msg.member.guild.id.toString()


        //Get the 10 first user who are in the same guild as the message based on xp
        let userList = await collection.find({guild: guildID}).limit(10).sort("points", -1).toArray()

        //Create the embed
        const leaderEmbed = new RichEmbed()
            .setTitle(`Leaderboard du serveur ${msg.member.guild.name}`)
            .setColor("#2ECC71")
            .setThumbnail(msg.member.guild.iconURL)

        //Populate the embed with the users
        userList.forEach(async function(element, index) {
            leaderEmbed.addField("#" + (index + 1).toString(), element.username + " - " + Math.round(element.points) + " Points")
        })

        //Send the embed
        await msg.say(leaderEmbed)
    }
}