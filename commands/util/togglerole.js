const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const mongoUtil = require("../../mongoUtil.js") 

module.exports = class BypassCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'togglerole',
        aliases: ["tr"],
        group: 'util',
        memberName: 'togglerole',
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_ROLES"],
        description: [
            {
                lang: "fr",
                text: "Assigne un rôle à l'utilisateur"
            },
            {
                lang: "en",
                text: "Assign a role to the user"
            }
        ],
        format: "!togglerole [role]",
        examples: ["!togglerole @Dj"],
        args: [{
            type: "role",
            prompt: "Which role do you want?",
            key: "role"
        }],
    })
}

    async run(message, { role }) {
        const db = mongoUtil.getDb()
        const collection = db.collection("guilds")
        const guildDoc = await collection.findOne({guild_id: message.guild.id})
        const selfAssignableRoles = guildDoc.selfAssignableRoles || []
        let embed = new RichEmbed()
        if (selfAssignableRoles.indexOf(role.id) != -1) {
            if (message.member.roles.has(role.id)) {
                message.member.removeRole(role.id)
                embed
                    .setTitle(`Scott vous a retiré le rôle ${role.name}`)
                    .setColor("#E74C3C")
            } else {
                message.member.addRole(role.id)
                embed
                    .setTitle(`Scott vous a assigné le rôle ${role.name}`)
                    .setColor("#2ECC71")
            }
        } else {
            embed
                .setTitle(`L'administrateur de votre serveur n'a pas rendu ce rôle assignable`)
                .setColor("#E74C3C")
        }
        message.channel.send(embed)
    }
}