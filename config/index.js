'use strict';
const dotenv = require('dotenv').config();
var init = function () {
	return require('./config.json');
}
module.exports = init();