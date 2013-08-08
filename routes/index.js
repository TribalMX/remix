
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

exports.logout = function(req, res){
    req.logout();
    res.redirect('/');
};