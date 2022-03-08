'use strict';

const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));

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
      const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`)

      const json = await response.json()

      // Bad input
      if(json == 'Invalid symbol') return

      // Re-name the json result
      const { symbol: stock, latestPrice: price } = json

      let doc = await Stock.findOne({ name: stock }).exec();

      // If the stock can't be find, assign it to a new one
      if(!doc) doc = new Stock({ name: stock, likes: like ? 1 : 0 })
    
      const foundIP = await IP.findOne({ value: ip }).exec()

      // Implement IP logic
      if(like && !foundIP)  {
        const newIP = new IP({ value: ip })
        await newIP.save()

        doc.likes = (doc['likes'] ?? 0) + 1
      }
      await doc.save()

      return res.json({ "stockData": { stock, price, likes: doc.likes }});
    });
};
