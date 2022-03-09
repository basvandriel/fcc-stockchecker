'use strict';

const fetch = require('../lib/fetchProxy')

const Stock = require('../lib/stock')
const IP = require('../lib/ip')

const hash = require('../lib/hash')

const resolveStockData = async (name, like, ip) => {
  const response = await fetch(name)
  const json = await response.json()

  // Bad input
  if(json == 'Invalid symbol' || json == 'Unknown symbol') return 

  // Re-name the json result
  const { symbol, latestPrice: price } = json

  const upsertOptions = { new: true, upsert: true}
  const stock = await Stock.findOneAndUpdate({ symbol }, { $set: { symbol }}, upsertOptions)

  let likes = stock.likes.length

  const existingIP = await IP.findOne({ value: ip, liked_stocks: {'_id': stock._id } }).exec()

  // Implement IP logic
  // Check if the like boolean is there and if the ip doesn't exist already in the likes
  if(like && existingIP == null)  {
    likes++

    // Look up the ip if it exists, else upsert with pushed stock id
    const ipModel = await IP.findOneAndUpdate({ value: ip }, 
      { $push: { liked_stocks: stock._id }}, upsertOptions
    )
    await Stock.updateOne({ _id: stock._id, symbol }, { $push: { likes: ipModel._id }})
  }

  return { stock: symbol, price, likes }
}

const compareStockData = async (left, right, like, ip) => {
  const stock1 = await resolveStockData(left, like, ip)
  const stock2 = await resolveStockData(right, like, ip)

  stock1['rel_likes'] = stock1['likes'] - stock2['likes'] 
  stock2['rel_likes'] = stock2['likes'] - stock1['likes'] 

  const compared = [stock1, stock2].map((s) => {
    delete s['likes']

    return s
  })

  return compared
}


module.exports = function (app) {  
  // Usage:
  // GET https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[symbol]/quote
  // Where:
  // symbol = msft | goog | aapl | ...
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      var ip = hash(req.headers['x-forwarded-for'] || req.socket.remoteAddress) 
      const stock = req.query['stock']

      // bool-check the like
      const like = JSON.parse(req.query['like'])

      let stockData = undefined
      if(Array.isArray(stock)) {
        const [left, right] = stock

        stockData = await compareStockData(left, right, like, ip)
      } else {
        stockData = await resolveStockData(stock, like, ip)
      }
      return res.json({ stockData });
    });
};
