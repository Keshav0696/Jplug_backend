
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
// passport.serializeUser(function(user, done) {
//     done(null, user.id);
//   });
 
//   passport.deserializeUser(function(id, done) {
//     User.getUserById(id, function(err, user) {
//       done(err, user);
//     });
//   });


var { generateToken, sendToken } = require('../utils/token.utils');
var outhConfig = require('../outhConfig');
var request = require('request');
require('../passport')();


router.get('/check', async function(req, res){
 res.send("jgdgfhdg")
})
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

router
    .post('/twitter/reverse',function(req, res) {
        request.post({
            url: 'https://api.twitter.com/oauth/request_token',
            oauth: {
                oauth_callback: "http%3A%2F%2Flocalhost%3A3000%2Ftwitter-callback",
                consumer_key: outhConfig.twitterAuth.consumerKey,
                consumer_secret: outhConfig.twitterAuth.consumerSecret
            }
        }, function (err, r, body) {
            if (err) {
                return res.send(500, { message: e.message });
            }
            var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
            res.send(JSON.parse(jsonStr));
        });
    });

router
    .post('/twitter', (req, res, next) => {
        request.post({
            url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
            oauth: {
                consumer_key: outhConfig.twitterAuth.consumerKey,
                consumer_secret: outhConfig.twitterAuth.consumerSecret,
                token: req.query.oauth_token
            },
            form: { oauth_verifier: req.query.oauth_verifier }
        }, function (err, r, body) {
            if (err) {
                return res.send(500, { message: err.message });
            }

            const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
            const parsedBody = JSON.parse(bodyString);

            req.body['oauth_token'] = parsedBody.oauth_token;
            req.body['oauth_token_secret'] = parsedBody.oauth_token_secret;
            req.body['user_id'] = parsedBody.user_id;

            next();
        });
    }, passport.authenticate('twitter-token', {session: false}), function(req, res, next) {
        if (!req.user) {
            return res.send(401, 'User Not Authenticated');
        }
        req.auth = {
            id: req.user.id
        };

        return next();
    }, generateToken, sendToken);

router
    .post('/facebook', passport.authenticate('facebook-token', {session: false}), function(req, res, next) {
        if (!req.user) {
            return res.send(401, 'User Not Authenticated');
        }
        req.auth = {
            id: req.user.id
        };

        next();
    }, generateToken, sendToken);

router
    .post('/google' , passport.authenticate('google-token', {session: false}), function(req, res, next) {
        if (!req.user) {
            return res.send(401, 'User Not Authenticated');
        }
        req.auth = {
            id: req.user.id
        };

        next();
    }, generateToken, sendToken);


router.get('/logout', function(req, res){
req.logout();
res.send(null)
});



  module.exports = router;