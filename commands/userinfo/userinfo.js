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
			format: "!userinfo",
            args: [
                {
                    type: "user",
                    prompt: "Quelle utilisateur souhaitez-vous connaître les stats ?",
                    default: "",
                    key: "userInfo"
                }
            ]
		})
	}
	async run(msg, { userInfo }) {
		let user, member
        if (!userInfo) {
			user = msg.author
			member = msg.member
        } else {
			member = msg.guild.members.get(userInfo.id)
			user = member.user
		}
		
		let db, collection, userDoc, channel, rank, allUsers, AcessLevel, usrBack, typeColor, typeName, currentLevel, currentXp, neededXp, name, LevelMessage, RankMessage
		channel = msg.channel
		if (user.bot && ['628022462164107269', '642476723698532404'].indexOf(user.id) === -1) return;
		if (['628022462164107269', '642476723698532404'].indexOf(user.id) > -1) {
			name = 'Administrator'
			LevelMessage = `Level Unknown`
			RankMessage = `Rank Error`
			typeName = 'System'
			typeColor = '#E93939'
			usrBack = 'https://media.discordapp.net/attachments/642479335000768523/652681251236610109/test.jpg'
		} else {
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
			editDoc.checkGuild(user.id, member.guild.id)
			db = mongoUtil.getDb()
			collection = db.collection("members")
			userDoc = await collection.findOne({ "discord_id": user.id })
			rank = await (await collection.find({}).sort({ points: -1 }).toArray()).map((object) => { return object.discord_id }).indexOf(user.id)
			allUsers = await collection.countDocuments()
			AcessLevel = (!userDoc.accessLevel) ? 'Human' : userDoc.accessLevel
			usrBack = (!userDoc.cardBackground) ? 'https://i.pinimg.com/originals/6f/e0/50/6fe05014404f18ae55970e61ed7692fb.jpg' : userDoc.cardBackground
			typeColor = UserType[AcessLevel].color
			typeName = UserType[AcessLevel].display
			currentLevel = userDoc.level
			currentXp = userDoc.points
			neededXp = await getExpFromLevel(userDoc.level + 1)
			name = ((member.displayName.length > 16) && (user.username.length < member.displayName.length)) ? user.username : member.displayName
			LevelMessage = `Level ${currentLevel} (${currentXp} / ${neededXp})`
			RankMessage = `Rank #${rank} / ${allUsers}`
			if (user.id === '263275868313354240') {
				LevelMessage = `Level 72 (63 / 0)`
				RankMessage = `Rank -1 / ${allUsers}`
				usrBack = 'http://www.4usky.com/data/out/90/164818238-sword-art-online-wallpapers.jpg'
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
		// const rank = 1
		// const allUsers = 109302
		
		
		const canvas = Canvas.createCanvas(cardWidth, cardHeight)
		const ctx = canvas.getContext('2d')

		
		/*
		name = 'Administrator'
		LevelMessage = `Level Unknown`
		RankMessage = `Rank Error`
		typeName = 'System'
		*/

		const userAvatar = await Canvas.loadImage(user.displayAvatarURL)
		const userBackground = await Canvas.loadImage(usrBack)
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
		ctx.fillText(LevelMessage, 134, 22 + 65)

		// Rank
		ctx.font = '17px "Segoe"'
		ctx.fillStyle = '#FFFFFF'
		ctx.fillText(RankMessage, 134, 22 + 88)

		const attachment = new Attachment(canvas.toBuffer(), "user_card.png");
		channel.send(attachment)
	}
}