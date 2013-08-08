
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
            clientID: "FACEBOOK CLIENT ID",
            clientSecret: "FACEBOOK CLIENT SECRET",
            callbackURL: "http://localhost:3000/auth/facebook/callback"
        }
    },
    test: {
        db: "mongodb://localhost/remixcity_test", 
        root: rootPath, 
        app: {
            name: "Remix the City"
        },
        facebook: {
            clientID: "FACEBOOK CLIENT ID",
            clientSecret: "FACEBOOK CLIENT SECRET",
            callbackURL: "http://example.com/auth/facebook/callback"
        }
    },
    production: {}
};
