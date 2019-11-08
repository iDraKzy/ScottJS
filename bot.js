const botSettings = require("./botsettings.json")
const prefix = botSettings.prefix
const { Client } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const path = require("path")
const mongodb = require("mongodb")
const levelFunc = require("./function/levelFunc.js")
const editDoc = require("./function/editDoc.js")
const mongoUtil = require("./mongoUtil.js")
const moment = require("moment")

mongoUtil.connectToServer((err, client) => {
  if (err) throw err
})

const bot = new Client({
  commandPrefix: prefix,
  owner: "323161865205317632",
  disableEveryone: true,
  unknownCommandResponse: false,
})

bot.registry
  .registerDefaultTypes()
  .registerGroups([
    ["music", "🎵 Music"],
    ["fun", "🎉 Fun"],
    ["userinfo", "ℹ User Info"],
    ["economy", "💎 Economy"],
    ["managment", "⚖ Server Managment"]
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    help: false,
  })
  .registerCommandsIn(path.join(__dirname, "commands"))



bot.on("ready", () => {
    bot.user.setActivity("!help", {type: "LISTENING" })
        .then(r => console.log("Activity set"))
        .catch(e => console.log(`Errors encountered when defining the activity. Error: ${e}`))
    console.log("I am ready!")
  
    bot.generateInvite(456518742).then(result => console.log(result))

    //Re-create guilds if needed
    const guildCollection = mongoUtil.getDb().collection("guilds")
    bot.guilds.forEach(async guild => {
        let guildDoc = await guildCollection.findOne({guild_id: guild.id})
        if (guildDoc === null) {
            await editDoc.createGuild(guild.id, guild.name)
        }
    })

    //Handle Reminder

    const reminderCollection = mongoUtil.getDb().collection("reminders")
    setInterval(async () => {
        console.log("Reminder handler called")
        const reminderList = await reminderCollection.find()
        const currentTime = Date.now()
        reminderList.forEach(reminder => {
            if (reminder["date"] < currentTime) {
                const userGuild = bot.guilds.get(reminder["guild"])
                const remindMember = userGuild.members.get(reminder["discord_id"])
                const remindEndEmbed = new RichEmbed()
                    .setTitle("Voici les informations que vous m'avez demandé de vous rappeler")
                    .setThumbnail(remindMember.user.displayAvatarURL)
                    .setDescription(reminder["reason"])
                    .setColor("#3498DB")
                    .setFooter(`Message envoyé le ${moment().format("DD/MM/YYYY [à] HH:mm:ss")}`)
                remindMember.user.send(remindEndEmbed)
                reminderCollection.deleteOne(reminder)
            }
        })
    }, 60000)

    //xp VocTime
    async function createDocOrUpdateVocTime(member) {
        console.log("findandCreateDoc called")
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        let userDoc = await collection.findOne({"discord_id": member.user.id.toString(10)})
        if(userDoc === null) {
            editDoc.insertDoc(member.user.id, member.guild, member.user.username, member.user.discriminator)
            } else {
                await editDoc.checkGuild(member.user.id, member.guild.id)
                updateVocTime(userDoc, member)
            }
    }

    function updateVocTime(userDoc, member) {
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        console.log("updateVocTime called")
        let oldVoc = userDoc["voc_time"]
        let newVoc = oldVoc + time / 1000
        collection.updateOne({"discord_id": member.user.id},{$set: {"voc_time": mongodb.Int32(newVoc)}})
        levelFunc.addPoints(member, (time / 1000) / 60 * 3)
    }

  //xp vocTime
    let time = 60000

    setInterval(() => {
        console.log("setInterval called")
        bot.channels.forEach(channel => {
        if (channel.type === "voice") {
            channel.members.forEach(client => {
                if(channel.members.size > 1 && client.user.bot !== true && client.mute !== true && channel.guild.afkChannelID !== channel.id) {
                    createDocOrUpdateVocTime(client)
                    }
                }
            )}
        })
    }, time)

})


bot.on("guildCreate", guild => {
    editDoc.createGuild(guild.id, guild.name)
})

bot.on("guildMemberAdd", member => {
    editDoc.insertDoc(member.user.id, member.guild.id, member.user.username, member.user.discriminator)
})

bot.on("message", async message => {
    //check
    if(message.author.bot === true) return
    if(message.channel.type === "dm") return

    //exp
    if (!message.content.startsWith(prefix)) {
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        message.channel.fetchMessages({ limit: 2})
            .then(async messages => {
                let contents = messages.map((x) => [x.author.id, x.createdTimestamp])
                if (contents[1] === undefined) return
                if ((contents[0][1] - contents[1][1] < 1000) && (contents[0][0] === contents[1][0])) return
                const info = {id: message.author.id, guild: message.member.guild.id, username: message.author.username, discriminator: message.author.discriminator}
                let userDoc = await collection.findOne({"discord_id": info.id})
                if (userDoc === null) {
                    editDoc.insertDoc(info.id, info.guild, info.username, info.discriminator)
                    } else {
                        await editDoc.checkGuild(info.id, info.guild)
                        updateMessage(userDoc, message.member)
                    }
                })
        }

    function updateMessage(userDoc, member) {
        console.log("updateMessage called")
        const db = mongoUtil.getDb()
        const collection = db.collection("members")
        let oldMessage = userDoc["message_sent"]
        let newMessage = oldMessage + 1
        collection.updateOne({"discord_id": userDoc["discord_id"]},{$set: {"message_sent": mongodb.Int32(newMessage)}})
        levelFunc.addPoints(member, 2)
    }
})

bot.login(botSettings.token)
    .then(r => console.log("Bot connected"))
    .catch(e => console.log(e))
module.exports.bot = bot