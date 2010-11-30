function(doc) {
  function contains_match(str, candidates) {
    return candidates
           .map(function(re) { return re.test(str) })
           .reduce(function(state, res) { return state || res });
  }

  if(doc.message && doc.timestamp && doc.person && doc.person.nick) {
    var link_candidates = [ /http:\/\// , /www\./ , /\.com/, /\.io/ ];
    if(contains_match(doc.message, link_candidates)) {
      emit([doc.person.nick, doc.timestamp]);
      // First split the message into space-delimited words. Then URLs are further split so we can query their parts.
      var words = doc.message.split(/\s+/);
      words.forEach(function(word) {
        if(!contains_match(word, link_candidates)) {
          // Just emit for a normal word.
          emit([word, doc.timestamp], null);
        } else {
          // Emit on all subcomponents of the link (splitting on word boundaries and ignoring some meaningless parts).
          word.split(/\b/).forEach(function(sub_word) {
            var useless = [/http/, /:\/\//, /\./, /\?/, /\&/, /=/];
            if(!contains_match(sub_word, useless)) {
              emit([sub_word, doc.timestamp], null);
            }
          })
        }
      })
    }
  }
}
