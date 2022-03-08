const { mongoose: { Schema, model } } = require('./db')

const schema = new Schema({ 
    symbol: 'string', 
    likes: [{ type: Schema.Types.ObjectId, ref: "IP" }]
});

module.exports = model('Stock', schema)