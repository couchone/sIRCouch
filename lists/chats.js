function(head, req) {
	var ddoc = this;
	var templates = ddoc.templates;
	var mustache = require('lib/mustache');
	var row;
	if (req.query.reduce != "false") {
		//start({'Location: '+req.path.join('/')+'?'+req.query.join('&')+'reduce=false'});
	}
	provides('html',
		function() {
			var channel = (req.query.startkey && req.query.startkey[0] ? req.query.startkey[0] : '');
			var date = (req.query.startkey && req.query.startkey[1] ? req.query.startkey[1] : '');
			send(mustache.to_html(templates.home_header, {'channel':channel, 'channel_encoded':encodeURIComponent(channel), 'date':date.join('-')}));
			send('<ul class="lines">');
			var i = 0;
			var rows = [];
			while(row = getRow()) {
				rows.push(row);
			}

			if (req.query.reduce == "false") {
				rows.forEach(function(row, idx) {
					if (row.value.timestamp) {
						var time = row.value.timestamp.split('T')[1].split(':');
						time = time[0]+':'+time[1];
					} else {
						var time = '';
					}
					var is_action = (row.value.message.substr(1,6) == 'ACTION');
					send('<li id="'+i+'" class="'+(is_action ? 'action ' : '')+'user-'+row.value.person.nick+'"><span class="ts">['+time+']</span><span class="t">');
					if (is_action) {
						var msg = row.value.message.substr(7);
						send(row.value.person.nick+' '+msg.substr(0, msg.length-1));
					} else {
						send('&lt;'+row.value.person.nick+'&gt; '+row.value.message);
					}
					send('</span></li>');
				});
			}
			send('</ul>');
			send('</body></html>');
		}
	);
}