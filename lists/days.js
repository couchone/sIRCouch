function(head, req) {
	var ddoc = this;
	var templates = ddoc.templates;
	var mustache = require('lib/mustache');
	var row;
	provides('html',
		function() {
			var channel = (req.query.startkey && req.query.startkey[0] ? req.query.startkey[0] : '');
			send(mustache.to_html(templates.home_header, {'channel':channel, 'channel_encoded':encodeURIComponent(channel)}));
			send('<div class="dates">');
			var i = 0;
			var rows = [];
			var top = 0;
			while(row = getRow()) {
				if (row.value > top) top = row.value;
				rows.push(row);
//				send('<li><strong>'+row.value.person.nick+':</strong> '+row.value.message+'</a></li>');
//				send('<li id="'+i+'" class="user-'+row.value.person.nick+'"><span class="ts">['+time+']</span><span class="t">'+row.value.message+'</span></li>');
			}
			log(top);
			if (!req.query.group) {
				send('<p>There are '+rows[0].value+' messages.</p>');
			} else {
//				send(JSON.stringify(rows, null, "\t"));
				rows.forEach(function (row, idx) {
				log((row.value/top)*100);
					send('<a href="/irc-logs-couchone-internal/_design/logs/_list/chats/all-by-channel?startkey=[%22%23%23couchone-internal%22, [%22'+row.key[1][0]+'%22,%22'+row.key[1][1]+'%22,%22'+row.key[1][2]+'%22]]&reduce=false">');
					send(row.key[1][0]+'-'+row.key[1][1]+'-'+row.key[1][2]+'</a>');
					send('<div class="bar"><div style="width:'+((row.value/top)*100)+'%">&nbsp;</div></div>');
				});
			}
			send('</div>');
		}
	);
}