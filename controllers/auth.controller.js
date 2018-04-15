let express     = require('express'),
    Employee    = require('../models/user.model'),
    PersonalEmpDetails  = require('../models/personalEmpDetails.model'),
    UserRoles   = require('../models/empRole.model'),
    Roles       = require('../models/role.model'),
    jwt         = require('jsonwebtoken-refresh');
    config      = require('../config/config'),
    fs          = require('fs'),
    multer      = require('multer'),
    mime        = require('mime'),
    path        = require('path'),
    crypto      = require('crypto'),
    gm          = require('gm').subClass({imageMagick: true}),
    nodemailer  = require('nodemailer'),
    hbs         = require('nodemailer-express-handlebars'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    uuidV1      = require('uuid/v1'),
    async       = require('async'),
    awaitEach   =require('await-each');
    require('dotenv').load()

// function generateToken(user) {
//   return jwt.sign(user, config.secret, {expiresIn: config.jwtExpire});
// }

function generateToken(user) {
  return jwt.sign(user, process.env.Secret, {expiresIn: process.env.JwtExpire});
}

function setUserInfo(req) {
  return {
    _id  : req._id,
    email: req.email,
    role : req.role
  };
}

let functions = {
    loginUser: (req, res) => {
      Employee.findOne({userName: req.body.userName}, (err, user) => {
        if (err) {
          return res.status(500).json({
            title: 'There was a problem',
            error: err
          });
        }
        if (!user) {
          return res.status(403).json({
            title: 'Wrong Email or Password',
            error: {message: 'Please check if your password or email are correct'}
          });
        } else {
          var loginData = {};
          user.comparePassword(req.body.password, (err, isMatch) => {
            if (isMatch && !err) {
            let userInfo = setUserInfo(user);
            UserRoles.aggregate([
              {
                    "$lookup": {
                        "from": "roles",
                        "localField": "role_id",
                        "foreignField": "_id",
                        "as": "roles"
                    }
              },
              {
                "$lookup": {
                    "from": "employees",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employees"
                  }
              },
              { "$match": { "emp_id": user._id,"employees.isDeleted":false,"roles.isActive":true} },  
            ]).exec(function(err, results){
              var roles = [];
              var i = 0;
                //console.log(results[0].employees[0]);
                if(results.length > 0){
                  PersonalEmpDetails.find({ "emp_id": user._id}).exec(function(pdErr, personalDetailsResults){
                        results.forEach(element => {
                          roles.push(element.roles[0].roleName);
                          i++;
                        });

                      loginData = {
                        _id              :results[0].employees[0]._id,
                        officeEmail      :"",
                        personalEmail    :personalDetailsResults[0].personalEmail,
                        profileImage     :results[0].employees[0].profileImage,
                        fullName         :results[0].employees[0].fullName,
                        designation_id   :results[0].employees[0].designation_id,
                        roles            :roles
                      };

                      res.setHeader('access-token', jwt.sign(loginData, process.env.Secret, {expiresIn: process.env.JwtExpire}));
                      res.setHeader('client', "application_id");
                      res.setHeader('expiry', '');
                      res.setHeader('token-type', 'Bearer');
                      res.setHeader('uid', results[0].employees[0]._id);

                      // return res.status(200).json({
                      //   status : '200',
                      //   message: 'Login successful!',
                      //   //token  : generateToken(userInfo),
                      //   data   : loginData
                      // });
                      return res.status(200).json(loginData);
                  });
              }
            })
            } else {
              return res.status(403).json({
                status: '403',
                title : 'Wrong Email or Password',
                error : {message: 'Please check your email or password'}
              });

            }
          });
        }
      }).populate("employee").populate("role");
    },

    // requesting password reset and setting the fields resetPasswordToken to a newly generated token
    // and resetPasswordExpires to the exact date the form is submitted so we can set/check the validity of the timestamp (token is valid for only one hour)
    // after that, the user must request a new password reset. 
    forgetPassword: (req, res, next) => {
      async.waterfall([
        function (done) {
          crypto.randomBytes(20, function (err, buf) {
            let token = buf.toString('hex');
            done(err, token);
          });
        },
        function (token, done) {
          Employee.findOne({email: req.body.email}, function (err, user) {
            if (err) {
              return res.status(403).json({
                title: 'There was an error',
                error: err
              });
            }
            if (!user) {
              return res.status(403).json({
                title: 'Please check if your email is correct',
                error: {message: 'Please check if your email is correct'}
              });
            }
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
            user.save(function (err) {
              done(err, token, user);
            });
          });
        },
        // sending the notification email to the user with the link and the token created above
        (token, user, done) => {
          let options = {
            viewPath: config.paths.emailPath,
            extName : '.hbs'
          };
          let transporter = nodemailer.createTransport({
            host: process.env.EmailHost,
            secure: false,
            auth: {
                user: process.env.EmailUser,
                pass: process.env.EmailPassword
            },
            tls:{
              rejectUnauthorized: false
            }
          });
          transporter.use('compile', hbs(options));
          let mailOptions = {
            from: config.email.forget.from, // sender address
            to: req.body.email,
            subject: config.email.forget.subject, // Subject line
            template: 'email-password',
            context : {
              token: token,
              uid  : uuidV1()
            }
            };
             // send mail with defined transport object
            transporter.sendMail(mailOptions, (error2, info) => {
                if (error2) {
                    return console.log("RESULT ERROR = ", error2);
                }
            });
        }
      ], (err) => {
        if (err) return next(err);
      });
    },
  
    // Verify if password reset token is valid ie not expired
    verifyPasswordResetToken: (req, res) => {
      let token = req.params.token;
      Employee.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
        if (err) {
          return res.status(403).json({
            title: 'An error occured',
            error: err
          });
        }
        if (!user) {
          return res.status(403).json({
            title: 'Password cannot be changed!',
            error: {message: 'Password reset token is invalid or has expired.'}
          });
        }
        return res.status(200).json({
          message: 'Success',
          token  : token
        });
      });
    },
  
    // after getting token from email, check if it's still valid and then proceed in password reset by
    // getting the user new password, hashing it and then reset the passwordToken and passwordExpires fields to undefined
    changePassword: (req, res) => {
      async.waterfall([
        function (done) {
          let token = req.params.token;
          User.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
            if (err) {
              return res.status(403).json({
                title: 'An error occured',
                error: err
              });
            }
            if (!user) {
              return res.status(403).json({
                title: 'There was an error',
                error: {message: 'Please check if your email is correct'}
              });
            }
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
  
            user.save(function (err) {
              done(err, user);
            });
          });
        },
        // sending notification email to user that his password has changed
        (user, done) => {
          let options = {
            viewPath: config.paths.emailPath,
            extName : '.hbs'
          };
          let transporter = nodemailer.createTransport({
            host: process.env.EmailHost,
            secure: false,
            auth: {
                user: process.env.EmailUser,
                pass: process.env.EmailPassword
            },
            tls:{
              rejectUnauthorized: false
            }
          });
          transporter.use('compile', hbs(options));
          let mailOptions = {
            from: config.email.resetPassword.from, // sender address
            to: req.body.email,
            subject: config.email.resetPassword.subject, // Subject line
            template: 'email-notify-password-reset',
            context : {
              email: user.email,
              uid  : uuidV1()
            }
            };
             // send mail with defined transport object
            transporter.sendMail(mailOptions, (error2, info) => {
                if (error2) {
                    return console.log("RESULT ERROR = ", error2);
                }
            });
        }],
         (err) => {
        if (err) {
          console.log(err);
        }
      });
    },

    validateToken: (req, res) => {
    //if(req.headers && (req.headers.Authorization)
      // if(req.headers.access-token)
      // {
          let token=req.headers['access-token'];
        
          //let token=req.headers.Authorization.split(' ')[1] || req.headers['access-token'];
          jwt.verify(token,process.env.Secret, function(err, decoded) {
            if (err) {
              return res.status(401).json({
                error: err
              });
            }
          else{
              Employee.find({_id:parseInt(decoded._id),isDeleted:false},function(err,users)
              {
                if(err)
                {
                return res.status(500).json({
                    status: 'error'
                  });
                }
      
                var originalDecoded = jwt.decode(token, {complete: true});
                var refreshedToken = jwt.refresh(originalDecoded, 3600, process.env.Secret);
              
                res.setHeader('access-token', refreshedToken);
                res.setHeader('client', "application_id");
                res.setHeader('expiry', '');
                res.setHeader('token-type', 'Bearer');
                res.setHeader('uid', "");
                
                delete originalDecoded.payload.iat;
                delete originalDecoded.payload.exp;
                return res.status(200).json(originalDecoded.payload);
              })
            }
          });
      // }
    }
};

module.exports = functions;


