const { Command } = require('discord.js-commando')
const { RichEmbed } = require("discord.js")
const moment = require("moment")
const mongoUtil = require("../../mongoUtil.js")
const i18n_module = require("i18n-nodejs")

module.exports = class HelpCommand extends Command {
    constructor(bot) {
        super(bot, {
        name: 'help',
        aliases: ["help"],
        group: 'util',
        memberName: 'help',
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "ADD_REACTIONS"],
        description: [
            {
                lang: "fr",
                text: "Affiche toutes les commandes dispo ou affiche des informations sur une commande spécifier"
            },
            {
                lang: "en",
                text: "Display all available commands or detailied informations about a specified one"
            }
        ],
        examples: ["!help", "!help userinfo"],
        format: "!help [command?]",
        args: [{
            type: "command",
            prompt: "De quelle commande souhaitez vous obtenir des informations ?",
            key: "command",
            default: "undefined"
        }]
    })
}

    async run(msg, { command }) {
        const db = mongoUtil.getDb()
        const guildCollection = db.collection("guilds")
        const guildDoc = await guildCollection.findOne({guild_id: msg.guild.id})
        const lang = guildDoc["lang"]
        console.log(lang)
        let translateHelp = new i18n_module(lang, "./../../translation/help.json")
        if (command == "undefined") {
            const helpEmbed = new RichEmbed()
                .setTitle(`${translateHelp.__("availableCommand")} ${this.client.user.username}`)
                .setColor("#3498DB")
                .setDescription(translateHelp.__("reactWith"))
                .setFooter(translateHelp.__("stopReact"))

            let tempGroup = []
            this.client.registry.groups.forEach(group => {
                
                let tempCommand = []
                let displayTempCommand = []
                group.commands.forEach(command => {
                    if (command.ownerOnly !== true) {
                        tempCommand.push(command)
                        displayTempCommand.push(command.name)
                    }
                })
                tempGroup.push({
                    name: group.name,
                    emoji: group.name.match(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/)[0], //get the emoji out of the string
                    commands: tempCommand
                })
                helpEmbed.addField(`**${group.name}**`, displayTempCommand.join(", "))
            })
            helpEmbed.addField(":robot: **Scott**", translateHelp.__("addMe"))
            const messageSent = await msg.say(helpEmbed)
            for(let i = 0; i < tempGroup.length; i++) { //generate reaction emoji for all groups
                await messageSent.react(tempGroup[i].emoji)
            }
            const filter = (reaction, user) => user.id === msg.author.id
            const reactionCollector = messageSent.createReactionCollector(filter, {time: 180000})
            let commandEmbed = generateEmbed() //reset embed for embed editing
            let subMessages = undefined
            reactionCollector.on("collect", async res => { let category = tempGroup.find(group => res.emoji.name === group.emoji) //check if the reaction is link to one
                category.commands.forEach(command => {
                    commandEmbed.setTitle(`${translateHelp.__("categoryInfo")} ${category.name}`)
                    commandEmbed.addField(`**${command.name.charAt(0).toUpperCase() + command.name.slice(1)}**`, command.description.find(desc => desc.lang === lang).text)
                })
                await res.remove()
                if (subMessages === undefined) {
                    subMessages = await msg.say(commandEmbed)
                } else {
                    await subMessages.edit(commandEmbed)
                }
                commandEmbed = {}
                commandEmbed = generateEmbed()
            })
            reactionCollector.on("end", res => messageSent.clearReactions())
        } else {
            const currentDate = moment().format(translateHelp.__("dateFormat"))
            const commandInfoEmbed = new RichEmbed()
                .setTitle(`${translateHelp.__("commandInfo")} ${command.name.charAt(0).toUpperCase() + command.name.slice(1)}`)
                .setColor("#3498DB")
                .addField("Description", command.description.find(desc => desc.lang === lang).text)
                .setFooter(`${translateHelp.__("requested")} ${currentDate}`)
            if (command.format != null) {
                commandInfoEmbed.addField(translateHelp.__("usage"), command.format)
            }
            if (command.details != null) {
                commandInfoEmbed.addField(translateHelp.__("moreInfo"), command.details)
            }
            if (command.examples != null) {
                commandInfoEmbed.addField(translateHelp.__("examples"), command.examples)
            }
            await msg.say(commandInfoEmbed)
        }
        
        function generateEmbed() {
            return new RichEmbed()
                .setColor("#3498DB")
                .setFooter(translateHelp.__("getInfo"))
        }
    }   
}