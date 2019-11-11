const botSettings = require("./botsettings.json")
const saslprep = require("saslprep")
const MongoClient = require('mongodb').MongoClient
const url = `mongodb://scott:${botSettings.mongoDBPassword}@51.75.123.85:29751/?authSource=admin`

let _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
          _db = client.db('scott');
          return callback(err);
        }
    )
  },

  getDb: function() {
    return _db;
  }
};
