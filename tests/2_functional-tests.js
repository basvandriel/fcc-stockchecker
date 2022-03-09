const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

const { connection } = require('../lib/db')

chai.use(chaiHttp);

suite('Functional Tests', function() {
  beforeEach((cb) => connection.collection('stocks').deleteMany({}, cb));
  beforeEach((cb) => connection.collection('ips').deleteMany({}, cb));



  test('Viewing one stock: GET request to /api/stock-prices/', function(done) { // <= Pass in done callback
      const stock = 'GOOG';
      chai.request(server).get('/api/stock-prices').query({ like: false, stock }).end(function(err, { status, body }){
          assert.equal(status, 200)
          assert.isTrue('stockData' in body)

          const { price, likes } = body.stockData

          assert.equal(likes, 0)
          assert.equal(stock, body.stockData.stock)
          assert.typeOf(price, 'number')
        });
        done();
    });
    test("Viewing one stock and liking it: GET request to /api/stock-prices/", function(done) {
      const stock = 'AAPL';
      chai.request(server).get('/api/stock-prices').query({ like: true, stock }).end(function(err, { status, body }){
          assert.equal(status, 200)
          assert.isTrue('stockData' in body)

          const { price, likes } = body.stockData

          assert.equal(likes, 1)
          assert.equal(stock, body.stockData.stock)
          assert.typeOf(price, 'number')
        });
        done();
    });


    test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", async () => {
      const stock = 'MSFT';
      const getAndLike = async () => {
        return chai.request(server).get('/api/stock-prices').query({ like: true, stock })
      }

      await getAndLike()
      const { status, body } = await getAndLike()

      assert.equal(status, 200)
      assert.isTrue('stockData' in body)

      const { price, likes } = body.stockData

      assert.equal(likes, 1)
      assert.equal(stock, body.stockData.stock)
      assert.typeOf(price, 'number')
    });
});

