const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const playFile = require('./play.js');

module.exports = class QueueCommand extends Command {
  constructor(bot) {
    super(bot, {
      name: 'queue',
      aliases: ['song-list', 'next-songs'],
      group: 'music',
      memberName: 'queue',
      guildOnly: true,
      description: 'Display the song queue'
    });
  }

  run(message) {
    const queue = playFile.queue;
    if (!queue) return message.say('There are no songs in queue!');
    const titleArray = [];
    queue.map(obj => {
      titleArray.push(obj.title);
    });
    var queueEmbed = new RichEmbed()
      .setColor('#ff7373')
      .setTitle('Music Queue');
    for (let i = 0; i < titleArray.length; i++) {
      queueEmbed.addField(`${i + 1}:`, `${titleArray[i]}`);
    }
    return message.say(queueEmbed);
  }
};