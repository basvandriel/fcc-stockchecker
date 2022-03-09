'use strict';

const fetch = require('../lib/fetchProxy')

const Stock = require('../lib/stock')
const IP = require('../lib/ip')


class StockData {
    name;
    price;
    likes;

    constructor(name, price, likes) {
      self.name = name;
      self.price = price;
      self.likes = likes
    }
}

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
  let stock1 = await resolveStockData(left, like, ip)
  let stock2 = await resolveStockData(right, like, ip)
  
  stock1['likes'] = stock1['likes'] - stock2['likes']
  stock2['likes'] = stock2['likes'] - stock1['likes']

  const compared = [stock1, stock2].map((s) => {
    s['rel_likes'] = s['likes']
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
      var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 

      const inputStock = req.query['stock']

      // bool-check the like
      const like = JSON.parse(req.query['like'])

      let stockData = undefined
      if(Array.isArray(inputStock)) {
        const [left, right] = inputStock

        stockData = await compareStockData(left, right, like, ip)
      } else {
        stockData = await resolveStockData(inputStock, like, ip)
      }
      return res.json({ stockData });
    });
};
