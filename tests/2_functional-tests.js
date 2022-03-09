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
});

