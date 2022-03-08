const { Schema, model } = require('./db')

const schema = new Schema({ name: 'string', likes: 'number' });
const Stock = model('Stock', schema);

module.exports = Stock