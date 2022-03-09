const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

const IP = require('../lib/ip')
const Stock = require('../lib/stock')

chai.use(chaiHttp);

suite('Functional Tests', function() {
  afterEach((done) => {
    IP.deleteMany({}).then(() => {
      Stock.deleteMany({}, done)
    })
  })


  test('Viewing one stock: GET request to /api/stock-prices/', async function() {
      const stock = 'GOOG';
      const { status, body } =  await chai.request(server).get('/api/stock-prices').query({ like: false, stock })

      assert.equal(status, 200)
      assert.isTrue('stockData' in body)

      const { price, likes } = body.stockData

      assert.equal(likes, 0)
      assert.equal(stock, body.stockData.stock)
      assert.typeOf(price, 'number')
    });

    test("Viewing one stock and liking it: GET request to /api/stock-prices/", async function() {
      const stock = 'AAPL';
      const { status, body } = await chai.request(server).get('/api/stock-prices').query({ like: true, stock })

      assert.equal(status, 200)
      assert.isTrue('stockData' in body)

      const { price, likes } = body.stockData

      assert.equal(likes, 1)
      assert.equal(stock, body.stockData.stock)
      assert.typeOf(price, 'number')
    });

    test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", async () => {
      const getAndLike = async () => {
        return chai.request(server).get('/api/stock-prices').query({ like: true, stock: 'MSFT' })
      }
      await getAndLike()
      const { status, body } = await getAndLike()

      assert.equal(status, 200)
      assert.isTrue('stockData' in body)

      const { price, likes } = body.stockData

      assert.equal(likes, 1)
      assert.equal('MSFT', body.stockData.stock)
      assert.typeOf(price, 'number')
    });

    test("Viewing two stocks: GET request to /api/stock-prices/", async () => {
      const { status, body } = await chai.request(server).get('/api/stock-prices').query({ like: false, stock: ['MSFT', 'GOOG'] })

      assert.equal(status, 200)
      assert.isTrue('stockData' in body)
      assert.isTrue(Array.isArray(body.stockData))
    });

    test("Viewing two stocks and liking them: GET request to /api/stock-prices/", async () => {
      const { status, body } = await chai.request(server).get('/api/stock-prices').query({ like: true, stock: ['MSFT', 'GOOG'] })
      
      assert.equal(status, 200)
      assert.isTrue('stockData' in body)
      assert.isTrue(Array.isArray(body.stockData))

      // Since both stocks are liked, difference is 0
      // so should equal
      assert.equal(body.stockData[0]['rel_likes'], body.stockData[1]['rel_likes'])
    })
});

