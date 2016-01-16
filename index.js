if (!process.env.SLACK_TOKEN || !process.env.WIT_TOKEN ) {
    console.log('Error: Specify Slack or WIT token in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var Witbot = require('witbot');
var os = require('os');
var slackToken = process.env.SLACK_TOKEN;
var witToken = process.env.WIT_TOKEN;
var controller = Botkit.slackbot({
    debug: false,
    json_file_store: './db_slack',
});

var bot = controller.spawn({
    token: slackToken
}).startRTM();

var witbot = Witbot(witToken);

controller.hears('.*', ['direct_message','direct_mention','mention','ambient'],function(bot, message){
    witbot.process(message.text, bot, message);
});

witbot.hears('how_are_you', 0.5, function (bot, message, outcome) {
  bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: 'robot_face',
  },function(err, res) {
      if (err) {
          bot.botkit.log('Failed to add emoji reaction :(',err);
      }
  });
  controller.storage.users.get(message.user,function(err, user) {
      if (user && user.name) {
          bot.reply(message,'Hello ' + user.name + '!!');
      } else {
          bot.reply(message,'Hello.');
      }
  });
});

witbot.hears('call_me', 0.5, function(bot, message, outcome) {
    if(!outcome.entities.contact || outcome.entities.contact.lenght === 0){
        bot.reply(message, 'I can remember your name, but I need to know first');
        return;
    }
    var user = {
        id: message.user,
    };
    user.name = outcome.entities.contact[0].value;
    controller.storage.users.save(user,function(err, id) {
        if(err){
            console.error(err);
            bot.reply(message, 'Uh oh, there was a problem to remember your name, sorry!');
            return;
        }
            bot.reply(message,'Got it. I will call you *' + user.name + '* from now on.');
    });
});

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm here!");
});

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.');
});

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.');
  bot.reply(message, 'It\'s nice to talk to you directly.');
});

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'You really do care about me. :heart:');
});

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.';
  bot.reply(message, help);
});

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.';
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }];

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp);
  });
});

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n');
});
