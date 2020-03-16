const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js")

module.exports = class BypassCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'toggleselfrole',
        aliases: ["setselfassignablerole", "defineselfassignablerole"],
        group: 'managment',
        memberName: 'setselfrole',
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_ROLES"],
        description: [
            {
                lang: "fr",
                text: "Défini ou supprime un rôle qui pourra être défini manuellement par l'utilisateur"
            },
            {
                lang: "en",
                text: "Define or delete a role which users are allowed to assign to themself"
            }
        ],
        format: "!setselfrole [role]",
        examples: ["!setselfrole @Dj", "!setselfassignablerole @Dj"],
        args: [{
            type: "role",
            prompt: "Which role do you want to make self assignable?",
            key: "role"
        }],
        userPermissions: ["MANAGE_GUILD"]
    })
}

    async run(message, { role }) {
        const db = mongoUtil.getDb()
        const collection = db.collection("guilds")
        const guildDoc = await collection.findOne({guild_id: message.guild.id})
        console.log(guildDoc)
        const currentArray = guildDoc.selfAssignableRoles || []
        let embed
        if (currentArray.indexOf(role.id) == -1) {
            currentArray.push(role.id)
            collection.updateOne({guild_id: message.guild.id}, {$set: {selfAssignableRoles: currentArray}})
            embed = new RichEmbed()
                .setTitle(`${role.name} ajouté aux rôles assignables par les utilisateurs`)
                .setColor("#2ECC71")
        } else {
            currentArray.splice(currentArray.indexOf(role.id))
            collection.updateOne({guild_id: message.guild.id}, {$set: {selfAssignableRoles: currentArray}})
            embed = new RichEmbed()
                .setTitle(`${role.name} supprimé des rôles assignables par les utilisateurs`)
                .setColor("#E74C3C")
        }
        message.channel.send(embed)
    } 
}