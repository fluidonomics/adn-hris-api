let express     = require('express'),
    Employee    = require('../models/user.model'),
    PersonalEmpDetails  = require('../models/personalEmpDetails.model'),
    UserRoles   = require('../models/empRole.model'),
    Roles       = require('../models/role.model'),
    jwt         = require('jsonwebtoken'),
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

function generateToken(user) {
  return jwt.sign(user, config.secret, {expiresIn: config.jwtExpire});
}

function setUserInfo(req) {
  return {
    _id  : req._id,
    email: req.email,
    role : req.role
  };
}



// function setUserInfoRegister(req) {
//   return {
//     _id      : req._id,
//     email    : req.email,
//     role     : req.role,
//     updatedAt: req.updatedAt,
//     createdAt: req.createdAt
//   };
// }

// //Save Embeded array of Employee Roles 
// function addEmpRoles(i, req, emp_id, res)  {
//   let empRole=new UserRoles();
//   empRole.emp_id = emp_id;
//   empRole.role_id = req.body.roles[i];
//   empRole.save(function(err,roleDaata)
//   {
//     if((i+1) < req.body.roles.length){
//       addEmpRoles(i+1,req, emp_id, res);
//     }
//     else{
//        return res.status(200).json({ status : '200',message: 'Registration Successfull',
//            //token  : generateToken(userInfo),
//            //user   : setUserInfoRegister(result)
//         });
//     }
//   });
// }

let functions = {

    // let user = new Employee({
    //   email   : "test@test.com",
    //   password: "mytest",
    // });
    // user.save(function (err, result) {
    //   if (err) {
    //     return res.status(403).json({
    //       title: 'There was a problem',
    //       error: {message: 'The email you entered already exists'}
    //     });
    //   }
    //   // // send welcome email to the user
    //   // let options = {
    //   //   viewPath: config.paths.emailPath,
    //   //   extName : '.hbs'
    //   // };
    //   // let send_grid = {
    //   //   auth: {
    //   //     api_user: config.api_user,
    //   //     api_key : config.api_key
    //   //   }
    //   // };
    //   // let mailOptions = {
    //   //   to      : "req.body.email",
    //   //   from    : 'no-reply@yourdomain.com',
    //   //   subject : 'Welcome to ngx-Form',
    //   //   template: 'email-welcome',
    //   //   context : {
    //   //     // set this uuid because gmail truncates email message and adds 3 dots (how stupid) when footer or main content of the email is the same across all emails sent to the user. For example, if you send out emails very often to the user, footer, header and sometimes body is always the same. This unique id is injected into the email 3 times so gmail thinks footer, header and body are not the same like previous emails.
    //   //     uid: uuidV1()
    //   //   }
    //   // };
    //   // let mailer = nodemailer.createTransport(sgTransport(send_grid));
    //   // mailer.use('compile', hbs(options));
    //   // mailer.sendMail(mailOptions, (err) => {
    //   //   if (err) {
    //   //     console.log(err);
    //   //   }
    //   // });

    //   let userInfo = setUserInfo(user);
    //   res.status(200).json({
    //     status : '200',
    //     message: 'Registration Successfull',
    //     token  : generateToken(userInfo),
    //     //user   : setUserInfoRegister(result)
    //   });
    // });

  //},

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
            //user.roles=UserRoles.find({});

          //   UserRoles.find({ "emp_Id": user._id },function(err, results){
          //     console.log(results);
          //  })
         
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
            //   {
            //     "$lookup": {
            //         "from": "role",
            //         "localField": "_id",
            //         "foreignField": "role_Id",
            //         "as": "resultingRoleTagsArray"
            //     }
            //}
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
                      emp_id           :results[0].employees[0]._id,
                      //officeEmail      :results[0].employees[0].officeEmail,
                      personalEmail    :personalDetailsResults[0].personalEmail,
                      profileImage    :results[0].employees[0].profileImage,
                      fullName         :results[0].employees[0].fullName,
                      hierarchy_id     :results[0].employees[0].hierarchy_id,
                      roles            :roles
                    };
                    return res.status(200).json({
                      status : '200',
                      message: 'Login successful!',
                      token  : generateToken(userInfo),
                      data   : loginData
                    });
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
            host: 'mail-b01.cloudmailbox.in',
            secure: false,
            auth: {
                user: 'test@mail-b01.cloudmailbox.in',
                pass: 'DEfER#e'
            }
           });
           transporter.use('compile', hbs(options));
           let mailOptions = {
            from: '"test.org" <info@test.org>', // sender address
            to: ToEmail, // list of receivers
            subject: Subject, // Subject line
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
  
  
  
          // // let options = {
          // //   viewPath: config.paths.emailPath,
          // //   extName : '.hbs'
          // // };
          // // let send_grid = {
          // //   auth: {
          // //     api_user: config.api_user,
          // //     api_key : config.api_key
          // //   }
          // // };
          // // let mailer = nodemailer.createTransport(sgTransport(send_grid));
          // // mailer.use('compile', hbs(options));
          // // let mailOptions = {
          // //   to      : user.email,
          // //   from    : 'no-reply@yourdomain.com',
          // //   subject : 'ngx-Form | Password Reset Requested  ',
          // //   template: 'email-password',
          // //   context : {
          // //     token: token,
          // //     uid  : uuidV1()
          // //   }
          // // };
          // // mailer.sendMail(mailOptions, (err) => {
          // //   return res.status(200).json({
          // //     message: 'Success'
          // //   });
          // // });
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
          let send_grid = {
            auth: {
              api_user: config.api_user,
              api_key : config.api_key
            }
          };
          let options = {
            viewPath: config.paths.emailPath,
            extName : '.hbs'
          };
          let mailer = nodemailer.createTransport(sgTransport(send_grid));
          mailer.use('compile', hbs(options));
          let mailOptions = {
            to      : user.email,
            from    : 'no-reply@petlocator.gr',
            subject : 'ngx-Form | Your password has changed',
            template: 'email-notify-password-reset',
            context : {
              email: user.email,
              uid  : uuidV1()
            }
          };
          mailer.sendMail(mailOptions, (err) => {
            if (err) {
              console.log(err);
            }
            return res.status(200).json({
              message: 'Success'
            });
          });
        }
      ], (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
};

module.exports = functions;


