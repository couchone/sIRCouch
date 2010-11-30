var request = require('request'),
    sys = require('sys'),
    irc = require('./IRC/lib/irc');
  
var ircOptions = {
    server: 'irc.freenode.net'
};

var defaults = {
    couchdb: 'http://127.0.0.1:5984/couchdbirc',
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

var couchdb_uri = 'http://' + (opts.couchUser == '' ? '' : opts.couchUser + ':' + opts.couchPass + '@') + opts.couchdb.replace(/^http:\/\//, '').replace(/\/$/, '');
var couchOptions = {
    uri: couchdb_uri,
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

      if(message.message && new RegExp(opts.nick).test(message.message)) {
        var cmd_re = new RegExp(opts.nick + '.*?\\s(\\w+)\\s*(.*)$');
        var cmd_match = message.message.match(cmd_re);
        if(!cmd_match) {
          bot.privmsg(opts.room, 'Who said my name? Type `' + opts.nick + ' help` for command listing');
        } else {
          // Command is one word, and the options are "key1=val1 key2=val2" pairs, converted to an object.
          var command = cmd_match[1];
          var cmd_opts = cmd_match[2].split(/\s+/)
                         .map(function(pair) { return pair.split(/=/) })
                         .reduce(function(state, kv) { if(kv[0] && kv[1]) { state[kv[0]] = kv[1]; } return state }, {});

          if(command == 'help') {
            [ 'Supported commands:'
            , '  help -- display help'
            , '  search -- history search: tag=some_hashtag or link=some_word_or_nick; optionally limit=NN'
            ].forEach(function(line) { bot.privmsg(opts.room, line) });
          } else if(command == 'search') {
            if(!('tag' in cmd_opts) && !('link' in cmd_opts)) {
              bot.privmsg(opts.room, "Unknown search. Use `help` command to see syntax.");
            } else {
              var keyword = cmd_opts.tag || cmd_opts.link
                , startkey = [keyword, null]
                , endkey   = [keyword, {}]
                , limit    = parseInt(cmd_opts.limit || '5') // This will be done client-side to show 5/10 results found.
                , view = cmd_opts.tag ? 'tags-by-timestamp' : 'links-by-timestamp'
                ;

              startkey = encodeURIComponent(JSON.stringify(startkey));
              endkey = encodeURIComponent(JSON.stringify(endkey));
              var query = { uri: couchdb_uri + '/_design/logs/_view/' + view + '?include_docs=true&reduce=false&startkey=' + startkey + '&endkey=' + endkey };
              request(query, function(er, resp, body) {
                if(er) {
                  bot.privmsg(opts.room, 'HTTP error: ' + body);
                } else {
                  body = JSON.parse(body);
                  if(body.error) {
                    bot.privmsg(opts.room, 'Query error: ' + JSON.stringify(body));
                  } else {
                    if(body.rows.length == 0) {
                      bot.privmsg(opts.room, 'Query for ' + cmd_match[2] + ' -- No results found');
                    } else {
                      bot.privmsg(opts.room, 'Query for ' + cmd_match[2] + ' returned ' + (limit < body.rows.length ? limit : body.rows.length) + '/' + body.rows.length);
                      body.rows.slice(0, limit).forEach(function(row) {
                        bot.privmsg(opts.room, row.doc.timestamp + ' ' + row.doc.person.nick + ': ' + row.doc.message);
                      })
                    }
                  }
                }
              })
            }
          }
        }
      }
    }
  });
});
