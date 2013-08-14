var mongoose = require('mongoose')
  , FacebookStrategy = require('passport-facebook').Strategy
  , LocalStrategy = require('passport-local').Strategy
  , User = mongoose.model('User');

module.exports = function(passport, config) {
  //Serialize Sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL 
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({'facebook.id': profile.id}, function(err, user) {
        if (err) { return done(err);}
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            username: profile.username,
            provider: 'facebook',
            facebook: profile._json
          });
          user.save(function (err){
            if (err) console.log(err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));
  // passport.use(new LocalStrategy({usernameField: "password"},
  passport.use(new LocalStrategy(
    function(username, password, done) {
      User.findOne({'username': username}, function(err, user) {
        if (err) { return done(err); }
        if (!user && username == "remixKid") {
          user = new User({
            name: "remixKid",
            username: "remixKid"
          });
          user.save(function(err) {
            if (err) console.log(err);
            return done(err, user);
          }); 
        } else if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }
        if ( username == "remixKid" && !(password == "fabspaces")) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
    }
  ));
}