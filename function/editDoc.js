const mongodb = require("mongodb")
const mongoUtil = require("../mongoUtil.js")
const levelFunc = require("./levelFunc.js")

module.exports.insertDoc = function (discord_id, guild, username, discriminator) {
  guild = [guild]
  const collection = mongoUtil.getDb().collection("members")
  const insertQuery = {
    "guild": guild,
    "discord_id": discord_id,
    "username": username,
    "discriminator": discriminator,
    "message_sent": mongodb.Int32(0),
    "voc_time": mongodb.Int32(0),
    "image_requested": mongodb.Int32(0),
    "points": mongodb.Double(0),
    "money": mongodb.Int32(0),
    "lastDailies": 0,
    "level": mongodb.Int32(1)
  }
  collection.insertOne(insertQuery)
      .then(r => console.log(`New member inserted successfully. InsertId: ${r.insertedId}`))
      .catch(e => console.log(`An error has been ecountered while trying to insert a new member. Error: ${e}`))
}

module.exports.checkGuild = async function (id, guild) {
    const db = mongoUtil.getDb()
    const collection = db.collection("members")
    let userDoc = await collection.findOne({discord_id: id})
    let match = false
    let guildList = userDoc["guild"]
    guildList.forEach(element => {
      if (element === guild) {
        match = true
      }   
    });
    if (match === false) {
      guildList.push(guild.toString())
      collection.updateOne({discord_id: id}, {$set: {guild: guildList}})
    }
}

module.exports.createGuild = async function(id, name) {
  const guildCollection = mongoUtil.getDb().collection("guilds")
  const guildDoc = await guildCollection.findOne({id: id})
    if (guildDoc === null) {
      const guildInsertQuery = {
        guild_id: id.toString(),
        name: name,
        botChannel: "undefined",
        adminChannel: "undefined",
        lang: "en"
      }
      await guildCollection.insertOne(guildInsertQuery)
          .then(r => console.log(`Guild inserted with the id ${r.insertedId}`))
          .catch(e => console.log(`Error encountered while creating guild. Error: ${e}`))
    }
}

module.exports.addImageRequested = async function(msg) {
  const db = mongoUtil.getDb()
  const collection = db.collection("members")
  const info = {
    id: msg.author.id,
    guild: msg.member.guild.id,
    username: msg.author.username,
    driscriminator: msg.author.discriminator
  }
  let userDoc = await collection.findOne({"discord_id": info.id})
  if (userDoc === null) {
    this.insertDoc(info.id, info.guild, info.username, info.driscriminator)
  } else {
    let oldImage = userDoc["image_requested"]
    let newImage = oldImage + 1
    collection.updateOne({"discord_id": userDoc["discord_id"]}, {$set: {"image_requested": mongodb.Int32(newImage)}})
    await levelFunc.addPoints(msg.member, 1)
  }
}