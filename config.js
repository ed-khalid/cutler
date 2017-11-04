
var config = require('config-yml');

let handler = function(prop) {
    return  (process.env.PRODUCTION) ? process.env[prop] : config.auth[prop]   
} 

module.exports = handler;  



