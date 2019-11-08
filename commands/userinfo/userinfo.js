const { Command } = require("discord.js-commando")
const mongoUtil = require("../../mongoUtil.js")
const Canvas = require("canvas")
const Attachment = require("discord.js").Attachment
const editDoc = require("../../function/editDoc.js")


module.exports = class UserInfoCommand extends Command {
    constructor(bot) {
        super(bot, {
          name: "userinfo",
          aliases: ["card", "profile"],
          group: "userinfo",
          memberName: "userinfo",
          clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
          description: [
              {
                lang: "fr",
                text: "Envoi votre profile utilisateur."
              },
              {
                lang: "en",
                text: "Send the profile your user profile."
              }
            ],
          format: "!userinfo"
        })
    }
    async run(msg) {
      editDoc.checkGuild(msg.author.id, msg.member.guild.id)
      function roundedImage(ctx, x, y, width, height, radius) {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        }

        function applyText(canvas, text) {
            const ctx = canvas.getContext("2d")
        
            let fontSize = 26
        
            do {
                ctx.font = `bold ${fontSize -= 1}px Segoe UI`
            } while (ctx.measureText(text).width > canvas.width - 100)
        
            return ctx.font
          }

        function getUsername(username, nickname) {
            if(nickname === null || nickname.length < 4) {
                return username
              } else {
                return nickname
              }
          }

          function getExpFromLevel(level) {
            if (level <= 1) {
                return 0   
            } else {
                return (getExpFromLevel(level - 1) + (100 * (level - 1)))
            }
          }
          const width = 420
          const height = 100
          const backgroundImage = "sao.jpg"
        
          const db = mongoUtil.getDb()
          const collection = db.collection("members")
          let userDoc = await collection.findOne({"discord_id": msg.author.id})
          const channel = msg.channel
    
          const canvas = Canvas.createCanvas(width, height)
          const ctx = canvas.getContext("2d")
          const imageSize = canvas.height * 0.84
          const imageMargin = canvas.height * 0.16
          //background
          roundedImage(ctx, 0, 0, canvas.width, canvas.height, 30)
          ctx.clip()
          const background = await Canvas.loadImage(`./background/${backgroundImage}`)
          ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
          ctx.save()
    
          //username
          ctx.shadowColor = "black"
          ctx.shadowOffsetX = 6
          ctx.shadowOffsetY = 6
          ctx.shadowBlur = 6
    
          let username = getUsername(msg.author.username, msg.member.nickname)
          ctx.font = applyText(canvas, username)
          ctx.fillStyle = "#FFFFFF"
          ctx.fillText(username, canvas.width / 4.3, canvas.height * 0.45)
          
          //display role
          let role = msg.member.highestRole.name
          if(role == "@everyone") {
            role = ""
          }
          ctx.font = "20px Segoe UI"
          ctx.fillText(role, canvas.height / 2 + 1.1 * imageSize / 2, canvas.height * 0.7)
    
          //setup progress-bar
          let progressBarThickness = canvas.height * 0.07
          let progressBarX = canvas.height / 2
          let progressBarY = canvas.height / 2 - imageSize / 2
          let progressBarWidth = canvas.width - imageSize / 2 - 20
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          ctx.shadowBlur = 0
    
          roundedImage(ctx, progressBarX, progressBarY, progressBarWidth, progressBarThickness, 5)
          ctx.clip()
          ctx.fillStyle = "#202020"
          ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarThickness)
          let currentXp = userDoc["points"]
          let necessaryXp = await getExpFromLevel(userDoc["level"] + 1)
          ctx.restore()
          ctx.save()
    
          //fil progress-bar
          let nescessaryXpThisLevel = await getExpFromLevel(userDoc["level"])
          let currentXpProgressBar = currentXp - nescessaryXpThisLevel
          let necessaryXpProgressBar = necessaryXp - nescessaryXpThisLevel
    
          let percentAchieved = Math.round(currentXpProgressBar) / necessaryXpProgressBar
          let progress = progressBarWidth * percentAchieved
          if(percentAchieved !== 0) {
            roundedImage(ctx, progressBarX, progressBarY, progress, progressBarThickness, 5)
            ctx.clip()
            ctx.fillStyle = "#0087EE"
            ctx.fillRect(progressBarX, progressBarY, progress, progressBarThickness)
          }
          ctx.restore()
          ctx.save()
    
          //avatar
          ctx.beginPath()
          ctx.arc(canvas.height / 2, canvas.height / 2, imageSize / 2, 0, Math.PI * 2, true)
          ctx.closePath()
          ctx.clip()
    
          const avatar = await Canvas.loadImage(msg.author.displayAvatarURL)
          let y
          let x = y = canvas.height / 2 - imageSize / 2
          ctx.drawImage(avatar, x, y, imageSize, imageSize)
          ctx.restore()
          ctx.save()
    
          //display level
          let levelWidth = canvas.width * 0.07
          let levelHeight = canvas.height  * 0.12
          const levelRect = {
            x: canvas.height / 2 - levelWidth / 2,
            y: canvas.height - imageMargin,
          }
          roundedImage(ctx, levelRect.x, levelRect.y, levelWidth, levelHeight, 7)
          ctx.clip()
          ctx.fillStyle = "#202020"
          ctx.fillRect(levelRect.x, levelRect.y, levelWidth, levelHeight)
          ctx.fillStyle = "#FFFFFF"
          ctx.font = "10px Segoe UI"
          let levelDoc = userDoc["level"]
          let levelSize = ctx.measureText(levelDoc).width
          const levelDisplay = {
            x: canvas.height / 2 - levelSize * 0.6,
            y: levelRect.y + levelHeight * 0.75
          }
          ctx.fillText(levelDoc, levelDisplay.x, levelDisplay.y)
          ctx.restore()
          ctx.save()
    
    
          const attachment = new Attachment(canvas.toBuffer(), "user_card.png");
          channel.send(attachment)

          
    }
}