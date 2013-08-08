/*
 *  Generic require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.send('{status:Requires Authentication}', 404);
    }
    next();
};