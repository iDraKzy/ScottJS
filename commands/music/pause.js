const playFile = require('./play.js');
const { Command } = require('discord.js-commando');

module.exports = class PauseCommand extends Command {
  constructor(bot) {
    super(bot, {
      name: 'pause',
      aliases: ['pause-song', 'hold'],
      memberName: 'pause',
      group: 'music',
      description: 'Pause the current playing song',
      guildOnly: true
    });
  }

  run(message) {
    var voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.reply('Join a channel and try again');

    const dispatcher = playFile.dispatcher;

    if (typeof dispatcher == 'undefined') {
      return message.say('There is no song playing right now!');
    }

    message.say('Song paused :pause_button:');

    dispatcher.pause();
  }
};