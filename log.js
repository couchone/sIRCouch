var request = require('request'),
    sys = require('sys'),
    irc = require('./IRC/lib/irc');
  
var ircOptions = {
    server: 'irc.freenode.net'
};

var couchOptions = {
    uri:'http://127.0.0.1:5984/couchdbirc',
    method:'POST',
    headers:{'content-type':'application/json'}
};

var opts = {
    nick : 'couchlogbot',
    room : '#couchlog',
    roomPass : '******'
};

var bot = new irc(ircOptions);
bot.connect(function () {
  
  bot.nick(opts.nick);

  if (opts.roomPass) { 
    bot.join(opts.room, opts.roomPass);
  } else {
    bot.join(opts.room);
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
    }
  });
});
