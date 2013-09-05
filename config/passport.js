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
            if (err) { console.log(err); return done(err); }
            return done(err, user);
          });
        //Some user created in  beta1 doesn't have email. So, create them
        } else if(!user.email) {
          user.email = profile.emails[0].value;
          user.save(function (err){
            if (err) { console.log(err); return done(err); }
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));
  // use local strategy
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Unknown user' })
        }
        user.comparePassword(password, function(err, isMatch) {
          if (err) { return done(err); } 
          if(!isMatch) {
            return done(null, false, { message: 'Invalid password' });
          } else {
            return done(null, user);
          }
        });
      })
    }
  ));
}