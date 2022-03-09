const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

/**
 * If we're testing the application
 */
const test = process.env.NODE_ENV == 'test'

// mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports.connect = async function connect() {
    const server = await MongoMemoryServer.create();
    const uri = test ? server.getUri() : process.env.DB;

    const opts = {useNewUrlParser: true, useUnifiedTopology: true}

    return mongoose.connect(uri, opts)
}

module.exports.connection = db

module.exports.mongoose = mongoose