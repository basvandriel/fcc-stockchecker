const { mongoose: { Schema, model }} = require('./db')

const schema = new Schema({ 
    value: 'string',
    liked_stocks: [{
        type: Schema.Types.ObjectId,
        ref: "Stock"
    }]
});

module.exports = model('IP', schema)