function(doc) {
  var tag_re = /\B#(\w|[_-])+/g; // Hash then anything, as long as the hash isn't e.g. in a URL.

  if(doc.message && doc.timestamp) {
    //var stamp = doc.timestamp.split('-');
    //stamp[2] = stamp[2].substr(0, 2);
    var stamp = doc.timestamp;

    var matches = doc.message.match(tag_re) || [];
    matches.forEach(function(tag) {
      // Emit once for "#tag" and once for "tag" to be more human-friendly.
      emit([tag                  , stamp], null);
      emit([tag.replace(/^#/, ""), stamp], null);
    })
  }
}
