var createError = require('http-errors');
var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
const config = require('./config');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
const winston = require('winston');
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const applogger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});



require('./models');
require('./models/User');

var authRouter = require('./routes/auth');

var cors = require('cors');

var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
next();
});

app.options('*', cors()); 

// // Express Session
app.use(session({
  secret: config.sessionSecret,
  saveUninitialized: true,
  resave: true
}));


// Passport init
app.use(passport.initialize());
app.use(passport.session());

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',  function(req, res){
res.send("SUCCESS")
}
);
const User = mongoose.model('User')

router.post('/registerForBuyer', async function(req, res){
  console.log("tregevvv")
   const {username, address1, email, password, dob, zip_code} = req.body;
   if(!username) { 
       return  res.status(400).send({status: 400, message: "username is required"}).end()
   }else if(!address1){
      return  res.status(400).send({status: 400, message: "address1 is required"}).end()
   }else if(!email){
      return  res.status(400).send({status: 400, message: "email is required"}).end()
   }else if(!password){
      return  res.status(400).send({status: 400, message: "password is required"}).end()
   }else if(!dob){
      return  res.status(400).send({status: 400, message: "dob is required"}).end()
   }else if(!zip_code){
      return  res.status(400).send({status: 400, message: "zip_code is required"}).end()
   }else if(_calculateAge(new Date(dob)) < 21){
      return  res.status(400).send({status: 400, message: "Your age must be atleast 21"}).end()
   }
   req.body.role = req.body.role || 'BUYER';
   var tmpToken = randtoken.generate(30);
   req.body.vcode = tmpToken;
   req.body.status = 'deactive';
    var newUser = new User(req.body);
    var found = await User.findOne({ email: req.body.email})
  if(!found){
    User.createUser(newUser, function(err, user){
      try{
      if(err) throw err;

      // var mailOptions = {
      //   user: user,
      //   subject: 'Email Verification',
      //   text: `<p>Welcome to Project. Click the below link to activate your account:</p> <br/> <a href='http://localhost:3400/api/auth/verify-email-link/?email=${user.email}&token=${tmpToken}'>Verify Email Now</a>`
      //   }
      // var registerEmail = Mailer.sendMail(mailOptions);
      // registerEmail
      //     .then(sent => {
      //         let new_message = message.SUCCESSFULL_REGISTRATION;
      //         console.log(new_message)
      //     })
      //     .catch(sentErr => {
      //         console.log(sentErr)
      //     })
     return  res.status(200).send({status: 200, data: newUser}).end();
      }
      catch(e){
          return  res.status(500).send({status: 500, data: null, message:e.message}).end()

      }
    });
  }
  else{
   return  res.status(500).send({status: 500, data: null, message: "User already exist with this email"}).end()
  }

});


// passport.use(new JWTStrategy({
//         jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
//         secretOrKey   : '8A169E5DFB4F18C678DBAD19A4B4A17F1F8154713192E618DCDBF7D8C9E9ABA4'
//     },
//     function (jwtPayload, cb) {
//         //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
//        let user =  jwtPayload.user ? jwtPayload.user : jwtPayload.newUser;
//         return User.findOne({_id : user._id})
//             .then(user => {
//                 return cb(null, user);
//             })
//             .catch(err => {
//               // applogger.info('Jwt Third console', err);
//                 return cb(err);
//             });
//     }
// ));

// function jwt (req, res, next){
//   passport.authenticate('jwt', { session: false }, function(err, user, info) { 
//       if (err) { return next(err); } 
//       applogger.info('Jwt Second  console',{ user, err});

//       if (!user) { return res.send("Custom Unauthorised").end(); } 
//       // edit as per comment
//       //return res.send("Test Route Accessed").end();
//       req.user = user;   // Forward user information to the next middleware
//       next();
//   })(req, res, next);
// }

app.use('/api/auth', authRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
































  

