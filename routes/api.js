'use strict';

const fetch = require('../lib/fetchProxy')

const Stock = require('../lib/stock')
const IP = require('../lib/ip')


module.exports = function (app) {  
  // Usage:
  // GET https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[symbol]/quote
  // Where:
  // symbol = msft | goog | aapl | ...
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 

      const symbol = req.query['stock']

      // bool-check the like
      const like = JSON.parse(req.query['like'])
      const response = await fetch(symbol)

      const json = await response.json()

      // Bad input
      if(json == 'Invalid symbol') return

      // Re-name the json result
      const { symbol: name, latestPrice: price } = json

      const upsertOptions = { new: true, upsert: true}
      const stock = await Stock.findOneAndUpdate({ name }, { $set: { name }}, upsertOptions)

      let likes = stock.likes.length

      // Implement IP logic
      // Check if the like boolean is there and if the ip doesn't exist already in the likes
      if(like && !await IP.findOne({ value: ip, liked_stocks: {'_id': stock._id } }).exec())  {
        // Look up the ip if it exists, else upsert with pushed stock id
        const ipModel = await IP.findOneAndUpdate({ value: ip }, 
          { $push: { liked_stocks: stock._id }}, upsertOptions
        )
        await Stock.updateOne({ _id: stock._id, name }, { $push: { likes: ipModel._id }})
        likes++
      }

      return res.json({ "stockData": { stock: name, price, likes }});
    });
};
