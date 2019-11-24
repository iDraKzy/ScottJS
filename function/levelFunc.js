const mongodb = require("mongodb")
const mongoUtil = require("../mongoUtil.js")
const { RichEmbed } = require("discord.js")
const mybot = require("../bot.js")
const moment = require("moment")

function getExpFromLevel(level) {
  if (level <= 1) {
      return 0   
  } else {
      return (getExpFromLevel(level - 1) + (100 * (level - 1)))
  }
}

async function checkLevel(member) {
  console.log("level called")
  const collection = mongoUtil.getDb().collection("members")
  const guildCollection = mongoUtil.getDb().collection("guilds")
  const userDoc = await collection.findOne({"discord_id": member.user.id})
  const currentLevel = userDoc.level
  const points = userDoc.points
  const necessaryXp = await getExpFromLevel(currentLevel + 1)
  if(points > necessaryXp) {
    const oldMoney = userDoc.money
    const moneyToAdd = currentLevel * 200
    const newMoney = oldMoney + moneyToAdd
    const currentTime = moment().format("DD[/]MM[/]YYYY [à] HH[:]mm[:]ss")
    const nextLevelEmbed = new RichEmbed()
      .setTitle(`Félicitation ${userDoc.username}`)
      .setThumbnail(member.user.displayAvatarURL)
      .setDescription("Vous êtes passé de niveau et avez gagné des :gem:")
      .setColor("#F1C40F")
      .addField("Nouveau niveau", currentLevel + 1)
      .addField("Vous avez gagné", `${moneyToAdd} :gem:`, true)
      .addField("Portemonnaie", `${newMoney} :gem:`, true)
      .setFooter(`Niveau passé le ${currentTime}`)
    const guildDoc = await guildCollection.findOne({guild_id: member.guild.id})
    const channelID = guildDoc["botChannel"]
    if(channelID === "undefined") {
      nextLevelEmbed.setDescription(`Félicitation ${userDoc.username} \n\n :warning: Ce message est censé être envoyé sur un serveur ! \n Demandé à l'administrateur de ${member.guild.name} d'en définir un en utilisant la commande "!setchannel"`)
      mybot.bot.users.get(userDoc.discord_id).send(nextLevelEmbed)
    } else {
      member.guild.channels.get(channelID).send(nextLevelEmbed)
    }

    collection.updateOne({"discord_id": userDoc.discord_id}, { $set: { level: mongodb.Int32(currentLevel + 1), money: mongodb.Int32(newMoney) } })
  }
}


module.exports.addPoints = async function(member, pointsToAdd) {
  console.log("addPoints called")
  const collection = mongoUtil.getDb().collection("members")
  const userDoc = await collection.findOne({discord_id: member.user.id})
  const oldPoints = userDoc.points
  const newPoints = oldPoints + pointsToAdd
  collection.updateOne({"discord_id": member.user.id}, {$set: {"points": mongodb.Double(newPoints)}})
    .then(r => console.log(`Modified ${r.matchedCount} documents`))
    .catch(e => console.log(`An error has been encountered while updating a document. Error: ${e}`))
  await checkLevel(member)
}
  
  
  
  