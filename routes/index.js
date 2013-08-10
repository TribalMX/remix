
/*
 * GET home page.
 */

exports.index = function(req, res){
    if(!req.isAuthenticated()) {
        res.render('login');
    } else {
        res.render('index');
    }
};
exports.login = function(req, res){
    var data = "";
    if(req.user) data = {user: req.user.username};
    res.send(data);
};
exports.logout = function(req, res){
    req.logout();
    res.redirect('/');
};