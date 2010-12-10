function(doc) {
  date = doc.timestamp.split('-');
  date[2] = date[2].substr(0, 2);
  emit([doc.channel, date], doc);
}