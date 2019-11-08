const { Command } = require('discord.js-commando');
const playFile = require('./play.js');

module.exports = class RemoveSongCommand extends Command {
  constructor(bot) {
    super(bot, {
      name: 'remove',
      memberName: 'remove',
      group: 'music',
      description: 'Remove a specific song from queue',
      guildOnly: true,
      args: [
        {
          key: 'songNumber',
          prompt: 'What song number do you want to remove from queue?',
          type: 'integer',
          validate: songNumber =>
            songNumber > 1 && songNumber <= playFile.queue.length
        }
      ]
    });
  }
  run(message, { songNumber }) {
    var voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Join a channel and try again');

    var dispatcher = playFile.dispatcher;

    if (typeof dispatcher == 'undefined') {
      return message.reply('There is no song playing right now!');
    }

    if (playFile.queue.length < 1)
      return message.say('There are no songs in queue');

    playFile.queue.splice(songNumber - 1, 1);
    return message.say(`Removed song number ${songNumber} from queue`);
  }
};