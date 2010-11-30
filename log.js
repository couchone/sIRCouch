var request = require('request'),
    sys = require('sys'),
    irc = require('./IRC/lib/irc');
  
var ircOptions = {
    server: 'irc.freenode.net'
};

var defaults = {
    nick : 'couchlogbot',
    room : '#couchlog',
    roomPass : '******',
    couchUser: '',
    couchPass: '',
    hello: ''
};

if(process.env.help) {
  console.log('The following environment variables set the behaviour:');
  console.log('');
  console.log('Name\tDefault');
  console.log('=-=-=-=-=-=-=-=');
  for (var key in defaults) {
    console.log(key + '\t' + '"' + defaults[key] + '"');
  }
  process.exit(0);
}

var opts = {};
for (var key in defaults) {
  opts[key] = process.env[key] || defaults[key];
}

var couchOptions = {
    uri: 'http://' + (opts.couchUser == '' ? '' : opts.couchUser + ':' + opts.couchPass + '@') + '127.0.0.1:5984/couchdbirc',
    method:'POST',
    headers:{'content-type':'application/json'}
};

var bot = new irc(ircOptions);
bot.connect(function () {
  
  bot.nick(opts.nick);

  if (opts.roomPass) { 
    bot.join(opts.room, opts.roomPass);
  } else {
    bot.join(opts.room);
  }

  if(opts.hello) {
    setTimeout(function() { bot.privmsg(opts.room, opts.hello); }, 1000);
  }
  
  bot.addListener('privmsg', function (message) {
    if (message.params.length === 2) {
      message.channel = message.params[0];
      message.message = message.params[1];
      delete message.params;
    }
    if (message.channel === opts.room) {
      message.timestamp = new Date();
      couchOptions.body = JSON.stringify(message);
      couchOptions.headers['content-length'] = couchOptions.body.length;
      request(couchOptions, function (err, resp, body) {
        sys.puts(body);
      });

      if(message.message && new RegExp(opts.nick).test(message.message))
        bot.privmsg(opts.room, 'Who said my name?');
    }
  });
});
