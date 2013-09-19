var request = require('request')
  , qs = require('querystring')
  , mongoose = require('mongoose')
  , videogami = require('../config/videogami')
  , User = mongoose.model('User')
  , Remix = mongoose.model('Remix')
  , Clip = mongoose.model('Clip');

/*
 * GET home page.
 */

// exports.index = function(req, res){
//   if(req.isAuthenticated()) {
//     if(!req.user.username) {
//     //If user is not full registerd yet(for fb user)
//       var user = req.user;
//       //Terminate the created session
//       req.logout();
//       res.render('login', {page: "fbUserRegister", user: user});
//     } else {
//     //Log in to the app
//       res.render('index'); 
//     }
//   } else {
//     res.render('login', {page: "main"});
//   }
// }
exports.index = function(req, res){
  if(req.isAuthenticated()) {
    res.render('index'); 
  } else {
    res.render('login', {page: "main"});
  }
}
exports.remix = function(req, res){
  var data = {}
  data.username = videogami.user;
  data.token = videogami.api_key;
  Remix.findById(req.params.id, function(err, remix){
    if (err) {console.log(err); return res.send(500);}
    if(!remix) return res.send(404);
    var numGifs = 0;
    for(var i = 0; i < remix.clips.length; i++) {
      (function(i){
        //Request to videogami server
        request.get({
          url: videogami.host + "/video/" + remix.clips[i].videogami_vid,
          qs: data,
          json: true,
        }, function (error, response, body) {
          numGifs++;
          if(body.video && body.video.gifs) {
            remix.gifs[i] = body.video.gifs.fast;
            remix.clips[i].gif = body.video.gifs.fast;
          } else {
            remix.gifs[i] = "Not Found";
            remix.clips[i].gif ="Not Found";
          }
          //When every gifs are loaded
          if(numGifs == remix.clips.length){
            // console.log(remix);
            var url = "http://" + req.headers.host + req.url;
            res.render('remix', {remix: remix, url: url, back: req.query.back});
          }
        });
      })(i);
    }
  });
};
exports.admin = function(req, res){
  if(!req.isAuthenticated()) {
    res.render('admin', {isAdmin: false});
  } else {
    if(req.user.username == "remixAdmin") {
      res.render('admin', {isAdmin: true, username: req.user.username});
    } else {
      res.render('admin', {isAdmin: false});
    };
  }
};
exports.createUser = function(req, res){
  //Create new user 
  var user = new User({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });
  // save user to database
  user.save(function(err) {
    if (err) {
      console.log(err);
      return res.send(500, err);
    }
    //Create session for this user
    req.login(user, function(err) {
      if (err) { return res.send(500, err) }
      res.send({
        username: user.username,
        name: user.name,
        email: user.email
      }); 
    }); //login
  }); //save
};
exports.login = function(req, res){
  var data = "";
  if(req.user) data = {user: req.user.username};
  res.send(data);
};
exports.loginAdmin = function(req, res){
  var data = null;
  if(req.user) {
    if(req.user.username == "remixAdmin") {
      data = {user: req.user.username};
    } else {
      req.logout();
    }
  } 
  res.send(data);
};
exports.logout = function(req, res){
  req.logout();
  res.redirect('/');
};