const botSettings = require("./botsettings.json")
const prefix = botSettings.prefix
const { Client } = require("discord.js-commando")
const { RichEmbed } = require("discord.js")
const path = require("path")
const mongodb = require("mongodb")
const levelFunc = require("./function/levelFunc.js")
const { resetLimit } = require("./function/econFunc.js")
const editDoc = require("./function/editDoc.js")
const mongoUtil = require("./mongoUtil.js")
const moment = require("moment")

mongoUtil.connectToServer((err, client) => {
  if (err) throw err
})

const bot = new Client({
  commandPrefix: prefix,
  owner: ["323161865205317632", "263275868313354240"],
  disableEveryone: true,
  unknownCommandResponse: false,
})

bot.registry
  .registerDefaultTypes()
  .registerGroups([
    ["music", "🎵 Music"],
    ["fun", "🎉 Fun"],
    ["tvshow", "📺 TV Show"],
    ["userinfo", "ℹ User Info"],
    ["economy", "💎 Economy"],
    ["managment", "⚖ Server Managment"],
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    help: false,
  })
  .registerCommandsIn(path.join(__dirname, "commands"))


  bot.emotes = {
      check: "<:Check:589792970266640413>",
      cross: "<:Cross:589793004965855272>",
      info: "<:Info:632686188687261716>",
      question: "<:Question:632686615126474792>",
      warn: "<:Warn:632686188704301142>"
  }



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

    async function resetLimit() {
        let nowDateMidnight = new Date(Date.now()).setHours(23,59,59)
        console.log('Reset Limit')
        const db = mongoUtil.getDb()
        let collection = db.collection("meta")
        collection.updateOne({usr: 'Scott'}, {$set: {
            midnight: nowDateMidnight
        }})
        let userCollection = db.collection("members")
        userCollection.updateMany({}, {$set: {
            won: 0
        }})
        checkLimit()
    }
    
    async function checkLimit() {
        let nowDateMidnight = new Date(Date.now()).setHours(23,58,00)
        const db = mongoUtil.getDb()
        let collection = db.collection("meta")
        let userDoc = await collection.findOne({usr: 'Scott'})
        console.log('Check Limit')
        if (!userDoc.midnight) {
            resetLimit()
        } else {
            let midnight = userDoc.midnight
            console.log(nowDateMidnight - Date.now())
            console.log(nowDateMidnight)
            console.log(Date.now())
            if ((midnight - nowDateMidnight) < 0) {
                console.log('Timeout')
                setTimeout(() => { resetLimit() }, (nowDateMidnight - Date.now() + 60000))
            }
        }
    }

    checkLimit()
    //Handle tempban
    const tempBanCollection = mongoUtil.getDb().collection("tempban")
    setInterval(async () => {
        console.info("Tempban handler called")
        const tempBanList = await tempBanCollection.find()
        const currentTime = Date.now()
        tempBanList.forEach(async ban => {
            if (ban.date < currentTime) {
                const bannedMemberGuild = bot.guilds.get(ban.guild)
                const bannedUser = await bot.fetchUser(ban.discord_id, false)
                const bannedDMChannel = await bannedUser.createDM()
                bannedMemberGuild.unban(bannedUser, "Ban expired")
                    .then(user => {
                        const unbanTempEmbed = new RichEmbed()
                            .setTitle(`${bot.emotes.check} Vous avez été débanni du serveur ${bannedMemberGuild.name}`)
                            .setColor("#2ECC71")
                        bannedDMChannel.send(unbanTempEmbed)
                        tempBanCollection.deleteOne({discord_id: bannedUser.id})
                    })
                    .catch(() => {
                        tempBanCollection.deleteOne({discord_id: bannedUser.id})
                    })
            }
        })
    }, 10000)

    //Handle Reminder
    const reminderCollection = mongoUtil.getDb().collection("reminders")
    setInterval(async () => {
        console.log("Reminder handler called")
        const reminderList = await reminderCollection.find()
        const currentTime = Date.now()
        reminderList.forEach(reminder => {
            if (reminder.date < currentTime) {
                bot.fetchUser(reminder.discord_id)
                    .then(async user => {
                        remindDMChannel = await user.createDM()
                        const remindEndEmbed = new RichEmbed()
                            .setTitle("Voici les informations que vous m'avez demandé de vous rappeler")
                            .setThumbnail(user.displayAvatarURL)
                            .setDescription(reminder.reason)
                            .setColor("#3498DB")
                            .setFooter(`Message envoyé le ${moment().format("DD/MM/YYYY [à] HH:mm:ss")}`)
                        remindDMChannel.send(remindEndEmbed)
                        reminderCollection.deleteOne(reminder)
                })
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
        let oldVoc = userDoc.voc_time
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

bot.on("guildMemberAdd", async member => {
    const db = mongoUtil.getDb()
    const collection = await db.collection("members")
    const userDoc = await collection.findOne({"discord_id": member.user.id.toString(10)})
    if (userDoc === null) {
        editDoc.insertDoc(member.user.id, member.guild.id, member.user.username, member.user.discriminator)
    }

    const guildCollection = await db.collection('guilds')
    const guildDoc = await guildCollection.findOne({guild_id: member.guild.id})
    const bypassGlobalBans = guildDoc["bypassGlobalBans"] //get the admin channel of the guild if on
    if (userDoc.isGlobalBanned && !bypassGlobalBans) {
        const banEmbed = new RichEmbed()
            .setTitle(`:warning: Vous avez été banni de ${member.guild.name}`)
            .setDescription(`Vous avez été banni par <@${bot.user.id}>`)
            .setColor("#C0392B")
            .addField("Raison", "Global Banned...")
            .addField("Durée", "Permanent")
        member.send(banEmbed)
        bot.registry.commands.get("ban").call(member, "Global Banned...", member.guild)
    } else if (userDoc.isGlobalBanned && bypassGlobalBans) {
        let adminChannel = guildDoc["adminChannel"] //get the admin channel of the guild if on
        const banEmbedAdmin = new RichEmbed()
        .setDescription(`:warning: <@${member.id}> est un utilisateur à risques! Faites attention <@${member.guild.owner.id}>`)
        .setColor("#C0392B")
        
        if (adminChannel == "undefined") { //if channelAdmin is not defiend send the report to the owner of the guild
            banEmbedAdmin.setTitle(`:warning: Ce message est censé être envoyé dans un channel vous pouvez le définir avec \"!setchannel admin\"`)
            await member.guild.owner.send(banEmbedAdmin)
        } else { //if channelAdmin is defined send the report to this channel
            await member.guild.channels.get(adminChannel).send(banEmbedAdmin)
        }       
    }
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
        let oldMessage = userDoc.message_sent
        let newMessage = oldMessage + 1
        collection.updateOne({"discord_id": userDoc.discord_id},{$set: {"message_sent": mongodb.Int32(newMessage)}})
        levelFunc.addPoints(member, 2)
    }
})

bot.login(botSettings.token)
    .then(() => console.log("Bot connected"))
    .catch(e => console.log(e))

setTimeout(() => {
    if (bot.status !== 0) {
        err = "Connection issue with discord"
        throw err
    }
}, 10000)

module.exports.bot = bot
