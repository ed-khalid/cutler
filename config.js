
var config = require('config-yml');

export default (prop) => (process.env.PRODUCTION) ? process.env[prop] : config[app][url]   



