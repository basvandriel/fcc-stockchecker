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

      let stock = await Stock.findOne({ name }).exec();

      // If the stock can't be find, assign it to a new one
      if(!stock) stock = new Stock({ name })
      
      // Save the stock
      await stock.save()
    
      // Implement IP logic
      // Check if the like boolean is there and if the ip doesn't exist already in the likes
      if(like && !await IP.findOne({ value: ip, liked_stocks: {'_id': stock._id } }).exec())  {
        // Look up the ip if it exists, else upsert with pushed stock id
        const ipModel = await IP.findOneAndUpdate({ value: ip }, { $push: { liked_stocks: stock._id }}, {
          new: true,
          upsert: true
        })

        await Stock.updateOne({ _id: stock._id, name }, { $push: { likes: ipModel._id }})
      }

      return res.json({ "stockData": { stock: name, price, likes: stock.likes.length }});
    });
};
