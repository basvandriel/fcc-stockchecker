const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));

module.exports = async function(symbol) {
    return await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`)
}