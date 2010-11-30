function(doc) {
  if (doc.created_at) {
    emit(doc.created_at, doc);
  } else if(doc.timestamp) {
    emit(doc.timestamp, doc);
  }
};