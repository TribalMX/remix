
/**
 * Module dependencies.
 */
var express = require('express')
  , mongoStore = require('connect-mongo')(express)
  , fs = require('fs')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , mongoose = require('mongoose')
  , auth = require('./config/middlewares/authorization');

// Bootstrap db connection
mongoose.connect(config.db);
// Bootstrap models
var models_path = __dirname +   '/models';
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})
// Bootstrap passport config
require('./config/passport')(passport, config);

var routes = require('./routes')
  , api = require('./routes/api')
  , app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('thisisthecitysecret'));
// express/mongo session storage
app.use(express.session({
  secret: 'thisisthecitysecretsession',
  store: new mongoStore({
    url: config.db,
    collection : 'sessions'
  })
}));
// use passport session
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//RESTfull Routes
app.get('/api/users/login', auth.requiresLogin, api.getLoginUser);
app.get('/api/users/:id', auth.requiresLogin, api.getUserById);

app.get('/test', api.getRemixes);
app.get('/api/public/remixes', api.getRemixes);
app.get('/api/remixes', auth.requiresLogin, api.getRemixes);
app.post('/api/remixes', auth.requiresLogin, api.postRemix);

app.get('/api/clips', auth.requiresLogin, api.getClips);
app.get('/api/clips/:id', auth.requiresLogin, api.getClipById);
app.post('/api/clips', auth.requiresLogin, api.postClip);

//uploading api
app.get('/uploadApi/upload', auth.requiresLogin, api.upload);
app.post('/uploadApi/upload', auth.requiresLogin, api.upload);
app.post('/uploadApi/video', auth.requiresLogin,  api.upload);
app.delete('/uploadApi/upload/:id/cancel', auth.requiresLogin,  api.upload);

//Admin Api
app.get('/admin/clips/unapproved', auth.requiresAdmin, api.getAllUnapprovedClips);
app.put('/admin/clips/unapproved/:id', auth.requiresAdmin, api.approveClip);

app.put('/admin/remixes/:id', auth.requiresAdmin, api.updateRemix);

//Serve pages
app.get('/', routes.index);
app.get('/remixes/:id', routes.remix);
app.get('/admin', routes.admin);

//Authentication and User Routes
app.post('/users', routes.createUser);
app.post('/login', passport.authenticate('local', {failureRedirect: '/'}), routes.login);
app.post('/loginAdmin', passport.authenticate('local', {failureRedirect: '/admin'}), routes.loginAdmin);
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/'}));
app.get('/logout', routes.logout);

//Test

console.log("TEST START");
var User = mongoose.model('User')
// // create a user a new user
var testUser = new User({
    username: "testPwd",
    name: "testName",
    email: "sample@sample2.net",
    password: "Password"
});
 
// save user to database
testUser.save(function(err) {
  console.log("Password Hasing Test");
  if (err) throw err;
  // fetch user and test password verification
  User.findOne({ username: 'testPwd' }, function(err, user) {
      console.log(user);
      if (err) throw err;
      // test a matching password
      user.comparePassword('Password', function(err, isMatch) {
          if (err) throw err;
          console.log('Password:', isMatch); // -&gt; Password123: true
      });
   
      // test a failing password
      user.comparePassword('123Password', function(err, isMatch) {
          if (err) throw err;
          console.log('123Password:', isMatch); // -&gt; 123Password: false
      });
      user.remove();
  });
});

//Test Done
http.createServer(app).listen(app.get('port'), function(){
  console.log('Remix the City listening on port ' + app.get('port') + " for " + env);
});
