'use strict';

const mongoose = require('mongoose');
const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));


module.exports = function (app) {
  var mongoDB = 'mongodb://127.0.0.1/fcc-stockchecker';
  mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

  const schema = new mongoose.Schema({ name: 'string', likes: 'number' });
  schema.statics.findOneOrCreate = function findOneOrCreate(condition, callback) {
    const self = this
    self.findOne(condition, (err, result) => {
        return result ? callback(err, result) : self.create(condition, (err, result) => { return callback(err, result) })
    })
  }
  const Stock = mongoose.model('Stock', schema);

  //Get the default connection
  var db = mongoose.connection;
  
  //Bind connection to error event (to get notification of connection errors)
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));

  
  // Usage:
  // GET https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[symbol]/quote
  // Where:
  // symbol = msft | goog | aapl | ...
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const symbol = req.query['stock']

      // bool-check the like
      const like = JSON.parse(req.query['like'])
      const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`)

      // If it finds something
      if(await response.text() == '"Invalid symbol"') {
        return
      }

      // Re-name the json result
      const { symbol: stock, latestPrice: price } = await response.json()

      let doc = await Stock.findOne({ name: stock }).exec();

      if(!doc) {
        doc = new Stock({ name: stock, likes: like ? 1 : 0 })
        await doc.save()
      }
      const likes = doc['likes'] ?? 0

      if(like) {
        doc.likes = likes + 1
        await doc.save()
      }
      return res.json({ "stockData": { stock, price, likes: doc.likes }});
    });
};
