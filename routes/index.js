
/*
 * GET home page.
 */

exports.index = function(req, res){
  if(!req.isAuthenticated()) {
    res.render('login');
  } else {
    res.render('index');
  }
}
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
exports.login = function(req, res){
  var data = "";
  if(req.user) data = {user: req.user.username};
  res.send(data);
};
exports.loginAdmin = function(req, res){
  var data = null;
  if(req.user && req.user.username == "remixAdmin") data = {user: req.user.username};
  res.send(data);
};
exports.logout = function(req, res){
  req.logout();
  res.redirect('/');
};