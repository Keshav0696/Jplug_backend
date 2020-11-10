
const config = require('../config')
const nodemailer = require('nodemailer');

var sendMail = function (mailObj){
    return new Promise((resolve, rejects)=>{
        var transporter = nodemailer.createTransport({
              host: config.SMTP_HOST,
              // secure : true,
              port: config.SMTP_PORT,
              auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASSWORD
              }
            });
      var mailOptions = {
        to: mailObj.user.email,
        from:  config.SMTP_FROM,
        subject: mailObj.subject,
        html: mailObj.text,
      };
      transporter.sendMail(mailOptions, function(err){
        if(err){  console.log(err);
            rejects("unsuccessfull"); 
        }
        
        resolve();
      });
    })
    }

module.exports.sendMail = sendMail;