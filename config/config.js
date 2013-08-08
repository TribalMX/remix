
var path = require('path')
  , rootPath = path.normalize(__dirname + '/..');
  
module.exports = {
    development: {
        db: "mongodb://localhost/remixcity_dev", 
        root: rootPath, 
        app: {
            name: "Remix the City"
        },
        facebook: {
            clientID: "",
            clientSecret: "",
            callbackURL: ""
        }
    },
    test: {
        db: "mongodb://localhost/remixcity_dev", 
        root: rootPath, 
        app: {
            name: "Remix the City"
        },
        facebook: {
            clientID: "",
            clientSecret: "",
            callbackURL: ""
        }
    },
    production: {},
}
