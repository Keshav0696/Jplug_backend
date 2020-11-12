'user strict';
const mongoose = require('mongoose');
const config = require('../config');
mongoose.connect(process.env.MONGODB_URI ||config.dbURI, { useNewUrlParser: true })
        .then(connect => console.log('connected to mongodb..'))
        .catch(e => console.log('could not connect to mongodb', e))