const playFile = require('./play.js');
const { Command } = require('discord.js-commando');

module.exports = class ResumeCommand extends Command {
  constructor(bot) {
    super(bot, {
      name: 'resume',
      aliases: ['resume-song', 'continue'],
      memberName: 'resume',
      group: 'music',
      description: 'Resume the current paused song',
      guildOnly: true
    });
  }

  run(message) {
    var voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.reply('Join a channel and try again');

    const dispatcher = playFile.dispatcher;

    if (typeof dispatcher == 'undefined') {
      return message.reply('There is no song playing right now!');
    }

    message.say('Song resumed :play_pause:');

    dispatcher.resume();
    console.log(dispatcher.stream)
  }
};