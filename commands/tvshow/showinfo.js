const { Command } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
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
            .then(res => {
                //Si la fonction ne returne rien envoi une erreur
                if (res === undefined) {
                    const showErrorEmbed = new RichEmbed()
                        .setTitle("Cette série n'existe pas")
                        .setColor("#E74C3C")
                    msg.say(showErrorEmbed)
                    return
                }
                const showEmbed = new RichEmbed()
                    .setTitle(`Informations à propos de la série ${res.displayName}`)
                    .setDescription(`Synopsis en anglais : \n\n${res.synopsis.replace(/<br>/g, "\n").replace(/<(\/)?b>/g, "**")}`) //TODO: Translation
                    .setImage(res.image.slice(0, -3) + "jpg")
                    .setColor("#8E44AD")
                    .addField("Statut", res.status) //TODO: Translation
                    .addField("Pays", res.country)
                    .addField("Chaîne", res.network)
                    .addField("Note", res.rating)
                    .addField("Genre", res.genres.join(", "))
                    .setFooter(`Informations fournies par Episodate.com`)
                if (res.countdown != null) {
                    showEmbed.addField("Prochain épisode", `${res.countdown.name}\n${res.countdown.air_date} UTC sur ${res.network}`)
                }
                msg.say(showEmbed)
            })
    }
}