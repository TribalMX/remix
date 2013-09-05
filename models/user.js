var mongoose = require('mongoose')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10
  , Schema = mongoose.Schema
  , authTypes = ['facebook'];

/**
 * User Schema
 */

var UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  provider: { type: String, default: '' },
  password: { type: String, default: '' },
  facebook: {}
});

/**
 * Validations
 */

var validatePresenceOf = function (value) {
  return value && value.length
}

UserSchema.path('name').validate(function (name) {
  // if you are authenticating by oauth provider, don't validate
  if (authTypes.indexOf(this.provider) !== -1) return true;
  return name.length;
}, 'Name cannot be blank');

UserSchema.path('email').validate(function (email) {
  // if you are authenticating by oauth provider, don't validate
  if (authTypes.indexOf(this.provider) !== -1) return true;
  return email.length
}, 'Email cannot be blank');

UserSchema.path('email').validate(function (email, fn) {
  //Facebook sometimes returns undefined for email
  if(typeof email == 'undefined') return fn(true);

  var User = mongoose.model('User');
  var user = this;
  // Check only when it is a new user or when email field is modified
  if (user.isNew || user.isModified('email')) {
    User.find({ email: email }).exec(function (err, users) {
      fn(err || users.length === 0);
    });
  } else {
    fn(true); 
  }
}, 'Email already exists');

UserSchema.path('username').validate(function (username) {
  // if you are authenticating by oauth provider, don't validate
  if (authTypes.indexOf(this.provider) !== -1) return true
  return username.length
}, 'Username cannot be blank');

UserSchema.path('username').validate(function (username, fn) {
  var User = mongoose.model('User');
  var user = this;
  // Check only when it is a new user or when username field is modified
  if (user.isNew || user.isModified('username')) {
    User.find({ username: username }).exec(function (err, users) {
      fn(err || users.length === 0);
    });
  } else {
    fn(true); 
  }
}, 'Usernam already exists');

UserSchema.path('password').validate(function (hashed_password) {
  // if you are authenticating by oauth provider, don't validate
  if (authTypes.indexOf(this.provider) !== -1) return true
  return hashed_password.length
}, 'Password cannot be blank')

/**
 * Pre-save hook for password validation and hashing
 */

UserSchema.pre('save', function(next){ 
  var user = this;

  //Check if neither password or provider is provided
  if(user.isNew) {
    if (!validatePresenceOf(user.password) && authTypes.indexOf(user.provider) === -1) {
      return next(new Error('Invalid password'));
    }
  }
  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
 
      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
  });
};
mongoose.model('User', UserSchema);