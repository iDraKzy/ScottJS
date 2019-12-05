const {
	Command
} = require("discord.js-commando")
const mongoUtil = require("../../mongoUtil.js")
const Canvas = require("canvas")
const Attachment = require("discord.js").Attachment
const editDoc = require("../../function/editDoc.js")


module.exports = class UserInfoCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: "userinfo",
			aliases: ["card", "profile", "ui", "p"],
			group: "userinfo",
			memberName: "userinfo",
			clientPermissions: ["SEND_MESSAGES", "VIEW_CHANNEL"],
			description: [{
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
		const db = mongoUtil.getDb()
		const collection = db.collection("members")
		let userDoc = await collection.findOne({ "discord_id": msg.author.id })
		const channel = msg.channel

		const AcessLevel = (!userDoc.accessLevel) ? 'Human' : userDoc.accessLevel
		console.log(AcessLevel)
		const UserType = {
			'Developer': {
				display: 'Developer',
				color: '#21d862'
			},
			'Staff': {
				display: 'Staff',
				color: '#916CE8'
			},
			'Friend': {
				display: 'Friend',
				color: '#4683FF'
			},
			'Contributor': {
				display: 'Contributor',
				color: '#E9A339'
			},
			'Premium': {
				display: 'Premium',
				color: '#FFE600'
			},
			'Human': {
				display: 'Human',
				color: '#B1B1B1'
			},
			'Banned': {
				display: 'Banned',
				color: '#E93939'
			}
		}
		function applyText(canvas, text) {
			const ctx = canvas.getContext("2d")
			let fontSize = 26
			do {
				ctx.font = `${fontSize -= 1}px "Segoe Bold"`
			} while (ctx.measureText(text).width > 250)

			return ctx.font
		}

		function getExpFromLevel(level) {
			if (level <= 1) {
				return 0
			} else {
				return (getExpFromLevel(level - 1) + (100 * (level - 1)))
			}
		}
		Canvas.registerFont(`./fonts/Segoe UI.ttf`, { family: "Segoe"});
		Canvas.registerFont(`./fonts/Segoe UI Semibold.ttf`, { family: "Segoe Semibold"});
		Canvas.registerFont(`./fonts/Segoe UI Bold.ttf`, { family: "Segoe Bold"});

		const cardWidth = 690
		const cardHeight = 122

		const userAvatar = await Canvas.loadImage(msg.author.displayAvatarURL)
		const usrBack = (!userDoc.cardBackground) ? 'https://i.pinimg.com/originals/6f/e0/50/6fe05014404f18ae55970e61ed7692fb.jpg' : userDoc.cardBackground
		const userBackground = await Canvas.loadImage(usrBack)

		const typeColor = UserType[AcessLevel].color
		const typeName = UserType[AcessLevel].display
		const rank = 1
		const allUsers = 109302
		const currentLevel = userDoc.level
		const currentXp = userDoc.points
		const neededXp = await getExpFromLevel(userDoc.level + 1)
		const name = ((msg.member.displayName.length > 16) && (msg.author.username.length < msg.member.displayName.length)) ? msg.author.username : msg.member.displayName


		const canvas = Canvas.createCanvas(cardWidth, cardHeight)
		const ctx = canvas.getContext('2d')


		const newHeight = (userBackground.height * cardWidth) / userBackground.width
		ctx.beginPath()
		ctx.arc((cardHeight / 2), (cardHeight / 2), (cardHeight / 2), 0.5 * Math.PI, 1.5 * Math.PI);
		ctx.lineTo(cardWidth - (cardHeight / 2), 0)
		ctx.arc(cardWidth - (cardHeight / 2), (cardHeight / 2), (cardHeight / 2), 1.5 * Math.PI, 2.5 * Math.PI);
		ctx.lineTo((cardHeight / 2), cardHeight)
		ctx.clip()
		ctx.fill('#FFFFFF')
		ctx.drawImage(userBackground, 0, -((newHeight / 2) - (cardHeight / 2)), cardWidth, newHeight)
		ctx.restore()
		ctx.save()

		/* Userinfo Form */
		ctx.beginPath()
		ctx.moveTo(0, 0)
		ctx.lineTo((cardWidth / 2) + 60, 0)
		ctx.lineTo((cardWidth / 2), cardHeight)
		ctx.lineTo(0, cardHeight)
		ctx.globalAlpha = 0.7;
		ctx.globalCompositeOperation = 'multiply'
		ctx.fillStyle = '#2B2B2B'
		ctx.fill()
		ctx.restore()
		ctx.save()

		/* User Border */
		ctx.beginPath();
		ctx.arc((cardHeight * 0.05) + ((cardHeight * 0.9) / 2), cardHeight / 2, (cardHeight * 0.9) / 2, 0, Math.PI * 2);
		ctx.clip()
		ctx.fillStyle = typeColor
		ctx.fill()
		ctx.restore()
		ctx.save()

		/* User Avatar */
		ctx.beginPath();
		ctx.arc((cardHeight * 0.05) + ((cardHeight * 0.9) / 2) + 0, cardHeight / 2, ((cardHeight * 0.9) / 2) - 3, 0, Math.PI * 2);
		ctx.clip()
		ctx.drawImage(userAvatar, (cardHeight * 0.05), (cardHeight * 0.05), (cardHeight * 0.9), (cardHeight * 0.9))
		ctx.restore()
		ctx.save()

		/* Text */
		// Username
		ctx.font = applyText(canvas, name)
		ctx.fillStyle = '#FFFFFF'
		ctx.fillText(name, 134, 35 + 2)

		// Type
		ctx.font = '22px "Segoe Semibold"'
		ctx.fillStyle = typeColor
		ctx.fillText(typeName, 134, 28 + 35)

		// Level
		ctx.font = '17px "Segoe"'
		ctx.fillStyle = '#FFFFFF'
		ctx.fillText(`Level ${currentLevel} (${currentXp} / ${neededXp})`, 134, 22 + 65)

		// Rank
		ctx.font = '17px "Segoe"'
		ctx.fillStyle = '#FFFFFF'
		ctx.fillText('Rank #? / Soon™', 134, 22 + 88)

		const attachment = new Attachment(canvas.toBuffer(), "user_card.png");
		channel.send(attachment)
	}
}