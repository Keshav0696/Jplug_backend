
var express = require('express');
var router = express.Router();
const User = require('../models/User')
const crypto = require('crypto');
var passport = require('passport');
var bcrypt = require('bcryptjs');
const config = require('../config')
const nodemailer = require('nodemailer');
const message = require('../utils/enum');
const passwordResetToken = require('../models/ResetPassword');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const Mailer = require('../core/mail')
const FacebookTokenStrategy = require('passport-facebook-token');
// const GoogleTokenStrategy = require('passport-google-token');
const GoogleTokenStrategy = require('passport-google-token').Strategy;
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
 
  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });

// Register User
router.post('/register', async function(req, res){
     var body = req.body;
     body.role = body.role || 'MEMBER';
     var tmpToken = randtoken.generate(30);
     body.vcode = tmpToken;
     body.status = 'deactive';
      var newUser = new User(body);
      var found = await User.findOne({ email: req.body.email})
    if(!found){
      User.createUser(newUser, function(err, user){
        try{
        if(err) throw err;

        var mailOptions = {
          user: user,
          subject: 'Email Verification',
          text: `<p>Welcome to Project. Click the below link to activate your account:</p> <br/> <a href='http://localhost:3400/api/auth/verify-email-link/?email=${user.email}&token=${tmpToken}'>Verify Email Now</a>`
          }
        var registerEmail = Mailer.sendMail(mailOptions);
        registerEmail
            .then(sent => {
                let new_message = message.SUCCESSFULL_REGISTRATION;
                console.log(new_message)
            })
            .catch(sentErr => {
                console.log(sentErr)
            })
       return  res.status(200).send({status: 200, data: newUser}).end();
        }
        catch(e){
          console.log(e);
        }
      });
    }
    else{
      res.status(500).send({status: 500, data: null, message: "User already exist with this email"}).end()
    }

  });


  router.get('/verify-email-link',    (req,res)=>{
      let response = {};
      let email = req.query.email;
      let token = req.query.token;
      var query = { 'email': email }
            User.findOne(query, (err, result, data) => {
                if (err) {
                    //return err in failure handler
                    response.error = err;
                    response.code = 500;
                    response.message = message.SERVER_ERROR;
                    return res.status(500).json(response);
                }
                if (result) {
                    // console.log(data,code)
                    if (result.vcode == token) {
                         updateStatus(email, 'active', response,res);
                    } else {
                        //return err in failure handler
                        response.error = null;
                        response.code = 200;
                        response.message = message.VERIFICATION_LINK_FAILED
                        return  res.status(500).json(response);

                    }
                } else {
                    //return err in failure handler
                    response.error = null;
                    response.code = 404;
                    response.message = message.USER_NOT_FOUND_ERROR
                    return  res.status(500).json(response);
                }
            })
        })
    

  var updateStatus= function(email, status, response, res) {
    var tmpToken = randtoken.generate(30);
    var query = { 'email': email };
    var update = { 'vcode': tmpToken, 'status': status }
    User.updateOne(query, update, {new :true}, (err, result, data) => {
        if (err) {
            //return err in failure handler
            response.error = err;
            response.code = 500;
            response.message = message.SERVER_ERROR;
            return  res.status(500).json(response);
        }
        if(result) {
            response.result = 'Success'
            response.code = 200;
            response.message = message.VERIFICATION_SUCCESSFULL;
            return  res.status(200).json(response);
        }
    })
}


  passport.use(new GoogleTokenStrategy({
    clientID: '986961472243-fulld3ffucmhascuns30o5k39i93hktc.apps.googleusercontent.com',
    clientSecret: 'TXJjvl8v7n-hX5Arr7LjzboP'
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ 'googleId' : profile.id }, function(err, user) {
      if (err) return done(err);
      if (user)  {
        const token = jwt.sign({user}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
        user.token = token;
        return done(null, user);
    }
      else {
        // if there is no user found with that facebook id, create them
        var newUser = new User();
  
        // set all of the facebook information in our user model
        newUser.googleId = profile.id;
        // newUser.token = accessToken;
        const token = jwt.sign({newUser}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
        newUser.token = token;
        newUser.role = "MEMBER";
        newUser.firstname  = profile.displayName.split(' ').slice(0, -1).join(' ');
        newUser.lastname  = profile.displayName.split(' ').slice(-1).join(' ');

        newUser.type  = 'google';
        if (typeof profile.emails != 'undefined' && profile.emails.length > 0)
          newUser.email = profile.emails[0].value;
  
        // save our user to the database
        newUser.save(function(err) {
          if (err) throw err;
          return done(null, newUser);
        });
      }
    });
  }
));

router.post('/google/token',
  passport.authenticate('google-token'),
  function (req, res) {
    // do something with req.user
    // res.send(req.user? 200 : 401);
    res.status(req.user? 200 : 401).json({user: req.user}).end();
  });


  passport.use(new FacebookTokenStrategy({
    // clientID: '578617303046530',
    // clientSecret: 'db3754a847c830d48c4b9581138aedc3',
    clientID: '805856186862870',
    clientSecret: 'f71b203d46e2a3b37ca3e2abb3ff7477',
    fbGraphVersion: 'v3.0'
  }, function(accessToken, refreshToken, profile, done) {
    User.findOne({ 'facebookId' : profile.id }, function(err, user) {
      if (err) return done(err);
      if (user) {
          const token = jwt.sign({user}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
          user.token = token;
          return done(null, user);
      }
      else {
        // if there is no user found with that facebook id, create them
        var newUser = new User();
  
        // set all of the facebook information in our user model
        newUser.facebookId = profile.id;
        const token = jwt.sign({newUser}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
        newUser.token = token;
        newUser.role = "MEMBER";
        newUser.firstname  = profile.displayName.split(' ').slice(0, -1).join(' ');
        newUser.lastname  = profile.displayName.split(' ').slice(-1).join(' ');

        newUser.type  = 'facebook';
        if (typeof profile.emails != 'undefined' && profile.emails.length > 0)
          newUser.email = profile.emails[0].value;
  
        // save our user to the database
        newUser.save(function(err) {
          if (err) throw err;
          return done(null, newUser);
        });
      }
    });
  }
));


router.post('/facebook/token',
  passport.authenticate('facebook-token'),
  function (req, res) {
    // do something with req.user
    // res.send(req.user? 200 : 401);
    res.status(req.user? 200 : 401).json({user: req.user}).end();
  });

  //   // Endpoint to login
// /* POST login. */
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {session: false}, (err, user, info) => {
      if (err || !user) {
          return res.status(400).json({
              status : 400,
              message: err?err : 'Invalid Email or Password',
              user   : user
          });
      }
     req.login(user, {session: false}, (err) => {
         if (err) {
             res.send(err);
         }
         // generate a signed son web token with the contents of user object and return it in the response
         const token = jwt.sign({user}, '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4');
         user.token = token;
         return res.json({ status : 200, user});
      });
  })(req, res);
});




var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function(email, password, done) {
    User.getUserByEmail(email, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }
      if(user.password){
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
     	if(isMatch){
     	  return done(null, user);
     	} else {
     	  return done(null, false, {message: 'Invalid '});
     	}
     });
    }else{
      return done(null, false, {message: 'Please reset the password'});
    }
   });
  }
));

router.get('/logout', function(req, res){
req.logout();
res.send(null)
});



  module.exports = router;