let express          = require('express'),
    Employee         = require('../models/employee/employeeDetails.model'),
    PersonalDetails  = require('../models/employee/employeePersonalDetails.model'),
    EmployeeRoles    = require('../models/employee/employeeRoleDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    Roles            = require('../models/master/role.model'),
    jwt              = require('jsonwebtoken-refresh');
    config           = require('../config/config'),
    path             = require('path'),
    crypto           = require('crypto'),
    nodemailer       = require('nodemailer'),
    hbs              = require('nodemailer-express-handlebars'),
    uuidV1           = require('uuid/v1'),
    async            = require('async'),
    awaitEach        =require('await-each');
    sendEmailInfo     =require('../class/sendEmail');
    require('dotenv').load()
 

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
      else if(!user) {
        return res.status(403).json({
          title: 'Wrong Email or Password',
          error: {message: 'Username or Password is incorrect'}
        });
      }
      else
      {
        if(user.isAccountActive)
        {
          user.comparePassword(req.body.password, (err, isMatch) => {
          if(!isMatch)
          {
              return res.status(403).json({
                title: 'Wrong Email or Password',
                error: {message: 'Username or Password is incorrect'}
              });
          }
          Employee.aggregate([
                {
                  "$lookup": {
                      "from": "employeeroledetails",
                      "localField": "_id",
                      "foreignField": "emp_id",
                      "as": "employeeroles"
                  }
                },
                {
                      "$lookup": {
                          "from": "roles",
                          "localField": "employeeroles.role_id",
                          "foreignField": "_id",
                          "as": "roles"
                      }
                },
                {
                    "$lookup": {
                        "from": "employeepersonaldetails",
                        "localField": "_id",
                        "foreignField": "emp_id",
                        "as": "employeepersonaldetails"
                      }
                },
                {
                  "$unwind": "$employeepersonaldetails"
                },
                {
                    "$lookup": {
                        "from": "employeeofficedetails",
                        "localField": "_id",
                        "foreignField": "emp_id",
                        "as": "employeeofficedetails"
                      }
                },
                {
                  "$unwind": "$employeeofficedetails"
                },
                { "$match": {"_id":user._id,"isDeleted":false,"userName": req.body.userName,"roles.isActive":true,"employeepersonaldetails.isDeleted":false,"employeeofficedetails.isDeleted":false,"employeeroles.isDeleted":false} },
                {"$project":{
                  "_id": "$_id",
                  "officeEmail"      :"$employeeofficedetails.officeEmail",
                  "personalEmail"    :"$employeepersonaldetails.personalEmail",
                  "profileImage"     :"$profileImage",
                  "fullName"         :"$fullName",
                  "designation_id"   :"$designation_id",
                  "roles"            :"$roles.roleName",
                  "userName"         :"$userName"
                }}
              ]).exec(function(err, employeeDetailsData){
                let userInfo = setUserInfo(employeeDetailsData[0]);
                res.setHeader('access-token', jwt.sign(employeeDetailsData[0], process.env.Secret, {expiresIn: process.env.JwtExpire}));
                res.setHeader('client', "application_id");
                res.setHeader('expiry', '');
                res.setHeader('token-type', 'Bearer');
                res.setHeader('uid', employeeDetailsData[0]._id);
                return res.status(200).json(employeeDetailsData[0]);
            }); 
          })
        }
        else{
              return res.status(403).json({
                title: 'Account is deactivated',
                error: {message: 'Please change your password and login'}
              });
          }
       } 
      });
    },
    // requesting password reset and setting the fields resetPasswordToken to a newly generated token
    // and resetPasswordExpires to the exact date the form is submitted so we can set/check the validity of the timestamp (token is valid for only one hour)
    // after that, the user must request a new password reset. 
    forgetPassword: (req, res, next) => {
      async.waterfall([
        function(done){
          crypto.randomBytes(20, function (err, buf) {
            let token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done){
          OfficeInfo.findOne({officeEmail: req.body.officeEmail,isDeleted:false}, function (err, office) {
            if (err) {
              return res.status(403).json({
                title: 'There was an error',
                error: err
              });
            }
            if (!office) {
              return res.status(200).json({
                title: 'Please check if your email is correct',
                error: {message: 'Please check if your email is correct'}
              });
            }
            let queryUpdate={ $set: {resetPasswordToken:token, resetPasswordExpires: Date.now() + 3600000 }};
            Employee.findOneAndUpdate({_id:office.emp_id,isDeleted:false},queryUpdate,function(err,user)
            {
              if (err) {
                return res.status(403).json({
                  title: 'There was an error',
                  error: err
                });
              }
              if(user)
              {
                sendEmailInfo.sendEmailResetPassword(req.body.officeEmail, process.env.HostUrl+"/reset/"+token)
              }
              done(err, user);
            });
          })
        },
        function(result) {
          return res.status(200).json({"message":"Reset Password Link Send to Your Email Address"}); 
        }
      ]);
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
      let token = req.body.token;
      Employee.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
        if (err) {
          return res.status(403).json({
            title: 'An error occured',
            error: err
          });
        }
        if (!user) {
          return res.status(401).json({
            title: 'There was an error',
            error: {message: 'Please check if your email is correct'}
          });
        }

        user.password = req.body.newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.isAccountActive=true;
        user.save(function (err) {
          if (err)
           {
             return res.status(403).json({
               title: 'There was a problem',
               error: {
                   message:err
               }
             });
           }
           else{
            OfficeInfo.findOne({emp_id: user._id,isDeleted:false}, function (err, office) {
              sendEmailInfo.sendEmailResetPasswordComplete(office.officeEmail,user.fullName,user.userName);
              return res.status(200).json({"message":"Reset Password Success Please Login With new Password"});
            });
           }
        });
      });
    },

    validateToken: (req, res) => {
          let token=req.headers['access-token'];
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
    }
};

module.exports = functions;


