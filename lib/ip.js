const { Schema, model } = require('./db')

const schema = new Schema({ value: 'string', });

const IP = model('IP', schema)

module.exports = IP