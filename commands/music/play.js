const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const Youtube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const { youtubeAPI } = require('../../botsettings.json');
const youtube = new Youtube(youtubeAPI);

var queue = [];
var isPlaying;

module.exports = class PlayCommand extends Command {
  constructor(bot) {
    super(bot, {
      name: 'play',
      aliases: ['play-song', 'add'],
      memberName: 'play',
      group: 'music',
      description: 'Play any song or playlist from youtube',
      guildOnly: true,
      clientPermissions: ['SPEAK', 'CONNECT'],
      throttling: {
        usages: 2,
        duration: 5
      },
      args: [
        {
          key: 'query',
          prompt: 'What song or playlist would you like to listen to?',
          type: 'string',
          validate: query => query.length > 0 && query.length < 200
        }
      ]
    });
  }

  async run(message, { query }) {
    // initial checking
    module.exports.msg = message
    var voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.say('Join a channel and try again');
    // end initial check

    // This if statement checks if the user entered a youtube playlist url
    if (
      query.match(
        /^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/
      )
    ) {
      try {
        const playlist = await youtube.getPlaylist(query);
        const videosObj = await playlist.getVideos(10); // remove the 10 if you removed the queue limit conditions below
        //const videos = Object.entries(videosObj);
        for (let i = 0; i < videosObj.length; i++) {
          const video = await videosObj[i].fetch();

          const url = `https://www.youtube.com/watch?v=${video.raw.id}`;
          const title = video.raw.snippet.title;
          let duration = formatDuration(video.duration);
          const thumbnail = video.thumbnails.high.url;
          if (duration == '00:00') duration = 'Live Stream';
          const song = {
            url,
            title,
            duration,
            thumbnail,
            voiceChannel
          };
          // this can be uncommented if you choose not to limit the queue
          // if (queue.length < 10) {
          //
          queue.push(song);
          // } else {
          //   return message.say(
          //     `I can't play the full playlist because there will be more than 10 songs in queue`
          //   );
          // }
        }
        if (isPlaying == false || typeof isPlaying == 'undefined') {
          isPlaying = true;
          return playSong(queue, message);
        } else if (isPlaying == true) {
          return message.say(
            `Playlist - :musical_note:  ${playlist.title} :musical_note: has been added to queue`
          );
        }
      } catch (err) {
        console.error(err);
        return message.say('Playlist is either private or it does not exist');
      }
    }

    // This if statement checks if the user entered a youtube url, it can be any kind of youtube url
    if (query.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/)) {
      const url = query;
      try {
        query = query
          .replace(/(>|<)/gi, '')
          .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
        const id = query[2].split(/[^0-9a-z_\-]/i)[0];
        const video = await youtube.getVideoByID(id);
        // // can be uncommented if you don't want the bot to play live streams
        // if (video.raw.snippet.liveBroadcastContent === 'live') {
        //   return message.say("I don't support live streams!");
        // }
        // // can be uncommented if you don't want the bot to play videos longer than 1 hour
        // if (video.duration.hours !== 0) {
        //   return message.say('I cannot play videos longer than 1 hour');
        // }
        const title = video.title;
        let duration = formatDuration(video.duration);
        const thumbnail = video.thumbnails.high.url;
        if (duration == '00:00') duration = 'Live Stream';
        const song = {
          url,
          title,
          duration,
          thumbnail,
          voiceChannel
        };
        // // can be uncommented if you don't want to limit the queue
        // if (queue.length > 10) {
        //   return message.say(
        //     'There are too many songs in the queue already, skip or wait a bit'
        //   );
        // }
        queue.push(song);
        if (isPlaying == false || typeof isPlaying == 'undefined') {
          isPlaying = true;
          return playSong(queue, message);
        } else if (isPlaying == true) {
          return message.say(`${song.title} added to queue`);
        }
      } catch (err) {
        console.error(err);
        return message.say('Something went wrong, please try later');
      }
    }
    try {
      var videos = await youtube.searchVideos(query, 1);
      console.log(videos)
      } catch (err) {
        console.error(err);
        return message.say(
          'Something went wrong'
        );
      }
      try {
        var video = await youtube.getVideoByID(videos[0].id);
        // // can be uncommented if you don't want the bot to play live streams
        // if (video.raw.snippet.liveBroadcastContent === 'live') {
        //   songEmbed.delete();
        //   return message.say("I don't support live streams!");
        // }

        // // can be uncommented if you don't want the bot to play videos longer than 1 hour
        // if (video.duration.hours !== 0) {
        //   songEmbed.delete();
        //   return message.say('I cannot play videos longer than 1 hour');
        // }
      } catch (err) {
        console.error(err);
        return message.say(
          'An error has occured when trying to get the video ID from youtube'
        );
      }
      const url = `https://www.youtube.com/watch?v=${video.raw.id}`;
      const title = video.title;
      let duration = formatDuration(video.duration);
      const thumbnail = video.thumbnails.high.url;
      try {
        if (duration == '00:00') duration = 'Live Stream';
        const song = {
          url,
          title,
          duration,
          thumbnail,
          voiceChannel
        };
        // // can be uncommented if you don't want to limit the queue
        // if (queue.length > 10) {
        //   songEmbed.delete();
        //   return message.say(
        //     'There are too many songs in the queue already, skip or wait a bit'
        //   );
        // }
        queue.push(song);
        if (isPlaying == false || typeof isPlaying == 'undefined') {
          isPlaying = true;
          playSong(queue, message);
        } else if (isPlaying == true) {
          return message.say(`${song.title} added to queue`);
        }
      } catch (err) {
        console.error(err);
        return message.say('queue process gone wrong');
      }
    } catch (err) {
      console.error(err);
      return message.say(
        'Something went wrong with searching the video you requested :('
      );
    }
  }


function playSong(queue, message) {
  let channel;
  queue[0].voiceChannel
    .join()
    .then(connection => {
      const dispatcher = connection
        .playStream(
          ytdl(queue[0].url, {
            quality: 'highestaudio',
            highWaterMark: 1024 * 1024 * 10
          })
        )
        .on('start', () => {
          module.exports.dispatcher = dispatcher;
          module.exports.queue = queue;
          channel = queue[0].voiceChannel;
          const videoEmbed = new RichEmbed()
            .setThumbnail(queue[0].thumbnail)
            .setColor('#e9f931')
            .addField('Now Playing:', queue[0].title)
            .addField('Duration:', queue[0].duration);
          if (queue[1]) videoEmbed.addField('Next Song:', queue[1].title);
          message.say(videoEmbed);
          return queue.shift();
        })
        .on('end', () => {
          if (queue.length >= 1) {
            return playSong(queue, message);
          } else {
            isPlaying = false;
            return channel.leave();
          }
        })
        .on('error', e => {
          message.say('Cannot play song');
          console.error(e);
          return channel.leave();
        });
    })
    .catch(e => {
      console.error(e);
      return channel.leave();
    });
}

function formatDuration(durationObj) {
  const duration = `${durationObj.hours ? durationObj.hours + ':' : ''}${
    durationObj.minutes ? durationObj.minutes : '00'
  }:${
    durationObj.seconds < 10
      ? '0' + durationObj.seconds
      : durationObj.seconds
      ? durationObj.seconds
      : '00'
  }`;
  return duration;
}