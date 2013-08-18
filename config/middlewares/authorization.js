/*
 *  Generic require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.send('{status:Requires Authentication}', 401);
    }
    next();
};
exports.requiresAdmin = function (req, res, next) {
    if (!req.isAuthenticated() || !(req.user.username == "remixAdmin")) {
        return res.send('{status:Requires Authentication}', 401);
    } 
    next();
};