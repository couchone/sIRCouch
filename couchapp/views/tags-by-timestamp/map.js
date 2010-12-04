function(doc) {
  var tag_re = /\B#(\w|[_-])+/g; // Hash then anything, as long as the hash isn't e.g. in a URL.

  if(doc.message && doc.timestamp) {
    var stamp = doc.timestamp;
    var matches = doc.message.match(tag_re) || [];

    if(matches.length)
      emit([doc.person.nick, stamp], null);

    matches.forEach(function(tag) {
      // Emit once for "#tag" and once for "tag" to be more human-friendly.
      emit([tag                  , stamp], null);
      emit([tag.replace(/^#/, ""), stamp], null);
    })
  }
}
