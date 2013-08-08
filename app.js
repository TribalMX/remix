
/**
 * Module dependencies.
 */

var express = require('express')
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
var models_path = __dirname +   '/models'
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
// app.set('view engine', 'jade')   ;
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('thisisthecitysecret'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(__dirname +'public'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//RESTfull Routes
app.get('/api/public/remixes', api.getRemixes);

app.get('/api/remixes', auth.requiresLogin, api.getRemixes);
app.post('/api/remixes', auth.requiresLogin, api.postRemix);

app.get('/api/clips', auth.requiresLogin, api.getClips);
app.post('/api/clips', auth.requiresLogin, api.postClip);

//uploading api
app.get('/uploadApi/upload', auth.requiresLogin, api.upload);
app.post('/uploadApi/upload', auth.requiresLogin, api.upload);
app.post('/uploadApi/video', auth.requiresLogin,  api.upload);
app.delete('/uploadApi/upload/:id/cancel', auth.requiresLogin,  api.upload);

app.get('/', routes.index);
app.get('/logout', routes.logout);

//Authentication Routes
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login'}));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Remix the City listening on port ' + app.get('port') + " for " + env);
});
