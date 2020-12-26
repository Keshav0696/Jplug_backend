const shortid = require('shortid')
let AWS = require('aws-sdk');
let multerS3 = require('multer-s3')
let multer = require('multer')
let path = require('path');
const User = require('../models/User')
const Mailer = require('../core/mail')
const randtoken = require('rand-token');
const s3 = new AWS.S3({
    accessKeyId: 'AKIAIV6LXCK4U7PL24HQ',
    secretAccessKey: '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'
});

const checkFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    console.log('-------------->', extname, mimetype, file.originalname, path.extname(file.originalname).toLowerCase(), file.mimetype);
    if (extname) {
        return cb(null, true);
    } else {
        cb(__('INVALID_IMAGE'));
    }
};
const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: "jplug",
        metadata: (req, file, callBack) => {
            console.log('ppp meta=> ', file);
            callBack(null, { fieldName: file.fieldname })
        },
        key: (req, file, callBack) => {
            console.log('ppp => ', file);
            let fileExtn = path.extname(file.originalname).toLowerCase();
            var filename = shortid.generate() + "-" + (+new Date).toString(36) + fileExtn; //If you want to save into a folder concat de name of the folder to the path
            req.filename = filename;
            callBack(null, 'seller/' + filename)
        }
    }),
    // limits: { fileSize: 50 * 1024 * 1024 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).array('photos', 2);


exports.registerNewSeller = (req, res) => {
    try {
        uploadS3(req, res, async (error) => {
            if (error) {
                console.log('errors', error);
                return res.status(500).send({ status: false, message: 'Some error occurd' });
            } else {
                let { businessName, businessEmail, phone, webUrl, businessType, address, address2, city, state, operationTime } = req.body;
                if (!businessName) return res.status(400).send({ status: 400, message: 'Business name mandatory' });
                if (!businessEmail) return res.status(400).status(400).send({ status: 400, message: 'Business email mandatory' });
                if (!phone) return res.status(400).send({ status: 400, message: 'Phone number is mandatory' });
                if (phone.length < 10) return res.status(400).send({ status: 400, message: 'Invalid phone number' });
                if (!webUrl) return res.status(400).send({ status: 400, message: 'Website url is mandatory' });
                if (!businessType) return res.status(400).send({ status: 400, message: 'Business type mandatory' });
                if (!address) return res.status(400).send({ status: 400, message: 'Address is mandatory' });
                if (!city) return res.status(400).send({ status: 400, message: 'City is mandatory' });
                if (!state) return res.status(400).send({ status: 400, message: 'State is mandatory' });
                if (!operationTime) return res.status(400).send({ status: 400, message: 'Operation time is mandatory' });
                var found = await User.findOne({ email: businessEmail, accountType: 1 })
                if (!found) {
                    let tmpToken = randtoken.generate(30);
                    var newUser = new User({
                        businessName: businessName,
                        email: businessEmail,
                        businessEmail: businessEmail,
                        website: webUrl,
                        businessType: businessType,
                        city: city,
                        state: state,
                        ownerPhone: phone,
                        image: req.filename,
                        accountType: 1,
                        address1: address,
                        address2: address2,
                        operationDays: operationTime,
                        role: "SELLER",
                        vcode: tmpToken,
                        status: "deactive",

                    });
                    User.createUser(newUser, function (err, user) {
                        try {
                            if (err) throw err;
                            var mailOptions = {
                                user: user,
                                subject: 'Email Verification',
                                text: `<p>Welcome to Project. Click the below link to activate your account:</p> <br/> <a href='http://localhost:3000/api/auth/verify-email-link/?email=${user.email}&token=${tmpToken}'>Verify Email Now</a>`
                            }
                            var registerEmail = Mailer.sendMail(mailOptions);
                            registerEmail.then(sent => {
                                let new_message = message.SUCCESSFULL_REGISTRATION;
                                console.log(new_message)
                            }).catch(sentErr => {
                                console.log(sentErr)
                            })
                            return res.status(200).send({ status: 200, data: newUser }).end();
                        } catch (e) {
                            return res.status(500).send({ status: 500, data: null, message: e.message }).end()

                        }
                    });
                } else {
                    return res.status(500).send({ status: 500, data: null, message: "User already exist with this email" }).end()
                }
            }
        });
    } catch (e) {
        console.log("Error -> ", e);
    }

}
