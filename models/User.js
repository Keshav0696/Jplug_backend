var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var UserSchema = mongoose.Schema({
  firstname: {
    type: String,
    required : true
  },
  lastname:{
    type : String,
    required : true
  },
  role : {
    type : String,
    enum : ["MEMBER", "ADMIN", "VENDOR", "OPERATOR"]
  },
  address : {
    type : String,
  },
  phoneNo : {
    type : String,
  },
  password: {
    type: String
  },
  email: {
    type: String,
  },
  status  : {
   type : String,
   enum : ["active", "deactive"],
   default : "active"
  },
  vcode: { type: String, required: false },
  deleted : Boolean,
  token: String,
  create_at: {
    type : Date,
    default : Date.now
  },
  updated_at: {
     type : Date,
     default : Date.now
   }

});

var User = module.exports = mongoose.model('User', UserSchema);
module.exports = User
module.exports.createUser = function(newUser, callback){
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
      newUser.password = hash;
      newUser.save(callback);
    });
  });
}

module.exports.getUserByUsername = function(username, callback){
    var query = {username: username};
    User.findOne(query, callback);
  }

  module.exports.getUserByEmail = function(username, callback){
    var query = {email: username, status : 'active', deleted : {$exists: false}};
    User.findOne(query, callback);
  }
  
  module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
  }
  
  module.exports.comparePassword = function(candidatePassword, userPassoword, callback){
  
      bcrypt.compare(candidatePassword, userPassoword, function(err, result) {
          if (err) { throw (err); }
          callback(null, result);
      });
  }