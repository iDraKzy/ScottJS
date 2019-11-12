const { Command } = require("discord.js-commando")
const showFunc = require("../../function/showFunc.js")

module.exports = class ShowInfoCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: 'showinfo',
            aliases: ["tvshow", "show"],
            group: 'tvshow',
            memberName: 'showinfo',
            clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
            description: [
                {
                    lang: "fr",
                    text: "Obtenir les informations sur une série télé. Attention entré le nom original de votre série en entier."
                },
                {
                    lang: "en",
                    text: "Obtain informations about a Tv Show. Attention please type the original name of your show in its totality"
                }
            ],
            args: [
                {
                    type: "string",
                    prompt: "Pour quelle série souhaitez-vous obtenir des infos?",
                    key: "show",
                    error: "Ceci n'est pas une entrée valide"
                }
            ]
        })
    }
    async run(msg, { show }) {
        showFunc.getShow(show)
            .then(res => console.log(`res: ${res}`))
    }
}