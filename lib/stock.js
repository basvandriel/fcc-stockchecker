const { Schema, model } = require('./db')

const schema = new Schema({ 
    name: 'string', likes: 'number', ip_likes: [{
        type: Schema.Types.ObjectId,
        ref: "IP"
    }]
});

module.exports = model('Stock', schema)