const { Command } = require('discord.js-commando');
const playFile = require('./play.js');

module.exports = class ShuffleQueueCommand extends Command {
  constructor(bot) {
    super(bot, {
      name: 'shuffle',
      memberName: 'shuffle',
      group: 'music',
      description: 'Shuffle the song queue',
      guildOnly: true
    });
  }
  run(message) {
    var voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.reply('Join a channel and try again');

    var dispatcher = playFile.dispatcher;

    if (typeof dispatcher == 'undefined') {
      return message.reply('There is no song playing right now!');
    }

    if (playFile.queue.length < 1)
      return message.say('There are no songs in queue');

    shuffleQueue(playFile.queue);

    return message.say('Queue shuffled, to view new queue, call queue command');
  }
};

function shuffleQueue(queue) {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
}