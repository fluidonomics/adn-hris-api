let express = require('express'),
    User    = require('../models/user.model'),
    Employee    = require('../models/user.model'),
    PersonalEmpDetails  = require('../models/personalEmpDetails.model'),
    OfficeEmpDetails = require('../models/officeEmpDetails.model'),
    SupervisorDetails = require('../models/supervisorDetails.model'),
    AuditTrail = require('../models/auditTrail.model'),
    Notification = require('../models/notification.model'),
    UserRoles   = require('../models/empRole.model'),
    config  = require('../config/config'),
    fs      = require('fs'),
    fse     = require('fs-extra'),
    mkdirP  = require('mkdirp'),
    multer  = require('multer'),
    mime    = require('mime'),
    path    = require('path'),
    crypto  = require('crypto'),
    async       = require('async'),
    nodemailer  = require('nodemailer'),
    hbs         = require('nodemailer-express-handlebars'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    uuidV1      = require('uuid/v1'),
    gm      = require('gm').subClass({imageMagick: true});
    require('dotenv').load()


// this function deletes the image
let rmDir = (dirPath, removeSelf) => {
  if (removeSelf === undefined)
    removeSelf = true;
  try {
    var files = fs.readdirSync(dirPath);
  }
  catch (e) {
    return;
  }
  if (files.length > 0)
    for (let i = 0; i < files.length; i++) {
      let filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  if (removeSelf)
    fs.rmdirSync(dirPath);
};

// create a Temp storage for images, when the user submits the form, the temp image will be moved to the appropriate folder inside /uploads/forms/user_id/photo.jpg
let tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = config.paths.tmpImagePath;
    let stat = null;
    try {
      stat = fs.statSync(dest);
    }
    catch (err) {
      fs.mkdirSync(dest);
    }
    if (stat && !stat.isDirectory()) {
      throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
    }
    cb(null, dest);
  },
  filename   : (req, file, cb) => {
    // if you want even more random characters prefixing the filename then change the value '2' below as you wish, right now, 4 charaters are being prefixed
    crypto.pseudoRandomBytes(4, (err, raw) => {
      let filename = file.originalname.replace(/_/gi, '');
      cb(null, raw.toString('hex') + '.' + filename.toLowerCase());
    });
  }
});

//  multer configuration
let uploadTemp = multer({
  storage   : tempStorage,
  limits    : {
    fileSize: 5000000, // 5MB filesize limit
    parts   : 1
  },
  fileFilter: (req, file, cb) => {
    let filetypes = /jpe?g|png/;
    let mimetype = filetypes.test(file.mimetype);
    let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: File upload only supports the following filetypes - ' + filetypes);
  }
}).single('fileUp');

// When user submits the form, the temp image is copied to /uploads/forms/user_id/photo.jpg
let copyImage = (req, source) => {
  mkdirP(config.paths.profileImagePath + req.user._id, (err) => {
    if (err) {
      console.log(err);
    }
    fse.copy(config.paths.tmpImagePath + source, config.paths.profileImagePath + req.user._id + '/' + source)
      .then(() => {
        console.log(source);
      })
      .catch((error) => console.log(error));
  });
};

// delete the temp image from front-end
let deleteImage = (image) => {
  fse.remove(config.paths.tmpImagePath + image)
    .then(() => {
      console.log('success!');
    })
    .catch(err => {
      console.error(err);
    });
};

function addPersonalInfoDetails(req,res,done)
{
  let personalDetails = new PersonalEmpDetails();
  personalDetails.emp_id = req.body.emp_id || req.query.emp_id;
  personalDetails.gender = (req.body.gender == undefined) ? ((req.query.gender == undefined ? null: req.query.gender)):req.body.gender;
  personalDetails.personalMobileNumber = (req.body.personalMobileNumber == undefined) ? ((req.query.personalMobileNumber == undefined ? null: req.query.personalMobileNumber)):req.body.personalMobileNumber;
  personalDetails.personalEmail = (req.body.personalEmail == undefined) ? ((req.query.personalEmail == undefined ? null: req.query.personalEmail)):req.body.personalEmail;
  personalDetails.dob = (req.body.dob == undefined) ? ((req.query.dob == undefined ? null: new Date(req.body.dob))):new Date(req.body.dob);
  personalDetails.bloodGroup = (req.body.bloodGroup == undefined) ? ((req.query.bloodGroup == undefined ? null: req.query.bloodGroup)):req.body.bloodGroup;
  personalDetails.religion = req.body.religion;
  personalDetails.nationality = req.body.nationality;
  personalDetails.homePhone = req.body.homePhone;
  personalDetails.motherName = req.body.motherName;
  personalDetails.fatherName = req.body.fatherName;
  personalDetails.presentAddressLine1 = req.body.presentAddressLine1;
  personalDetails.permanentAddressLine1 = req.body.permanentAddressLine1;
  personalDetails.maritialStatus = req.body.maritialStatus;
  personalDetails.emergencyContactPerson = req.body.emergencyContactPerson;
  personalDetails.emergencyContactNumber = req.body.emergencyContactNumber;
  personalDetails.permanentAddressThana_id= req.body.permanentAddressThana_id;
  personalDetails.permanentAddressDistrict_id = req.body.permanentAddressDistrict_id;
  personalDetails.permanentAddressDivision_id = req.body.permanentAddressDivision_id;
  personalDetails.permanentAddressPostCode = req.body.permanentAddressPostCode;
  personalDetails.presentAddressLine2 = req.body.presentAddressLine2;
  personalDetails.presentAddressThana_id = req.body.presentAddressThana_id;
  personalDetails.presentAddressDistrict_id = req.body.presentAddressDistrict_id;
  personalDetails.presentAddressDivision_id = req.body.presentAddressDivision_id;
  personalDetails.presentAddressPostCode = req.body.presentAddressPostCode;
  personalDetails.profileStatus = req.body.profileStatus;
  personalDetails.createdBy = 1;
  //personalDetails.createdBy =req.headers[emp_id];

  personalDetails.save(function (err, personalInfoData) {
    if(personalInfoData)
    {
      auditTrailEntry(personalDetails.emp_id,"personalDetails",personalDetails,"user","personalDetails","ADDED");
      return done(err, personalInfoData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: personalInfoData}
      });
    }
  });
}

function updatePersonalInfoDetails(req,res,done)
{
     let personalDetails = new PersonalEmpDetails();
     personalDetails.emp_id = req.body.emp_id || req.query.emp_id;
     personalDetails.gender = (req.body.gender == undefined) ? ((req.query.gender == undefined ? null: req.query.gender)):req.body.gender;
     personalDetails.personalMobileNumber = (req.body.personalMobileNumber == undefined) ? ((req.query.personalMobileNumber == undefined ? null: req.query.personalMobileNumber)):req.body.personalMobileNumber;
     personalDetails.personalEmail = (req.body.personalEmail == undefined) ? ((req.query.personalEmail == undefined ? null: req.query.personalEmail)):req.body.personalEmail;
     personalDetails.dob = (req.body.dob == undefined) ? ((req.query.dob == undefined ? null: new Date(req.body.dob))):new Date(req.body.dob);
     personalDetails.bloodGroup = (req.body.bloodGroup == undefined) ? ((req.query.bloodGroup == undefined ? null: req.query.bloodGroup)):req.body.bloodGroup;
     personalDetails.religion = req.body.religion;
     personalDetails.nationality = req.body.nationality;
     personalDetails.homePhone = req.body.homePhone;
     personalDetails.motherName = req.body.motherName;
     personalDetails.fatherName = req.body.fatherName;
     personalDetails.presentAddressLine1 = req.body.presentAddressLine1;
     personalDetails.permanentAddressLine1 = req.body.permanentAddressLine1;
     personalDetails.maritialStatus = req.body.maritialStatus;
     personalDetails.emergencyContactPerson = req.body.emergencyContactPerson;
     personalDetails.emergencyContactNumber = req.body.emergencyContactNumber;
     personalDetails.permanentAddressThana_id= req.body.permanentAddressThana_id;
     personalDetails.permanentAddressDistrict_id = req.body.permanentAddressDistrict_id;
     personalDetails.permanentAddressDivision_id = req.body.permanentAddressDivision_id;
     personalDetails.permanentAddressPostCode = req.body.permanentAddressPostCode;
     personalDetails.presentAddressLine2 = req.body.presentAddressLine2;
     personalDetails.presentAddressThana_id = req.body.presentAddressThana_id;
     personalDetails.presentAddressDistrict_id = req.body.presentAddressDistrict_id;
     personalDetails.presentAddressDivision_id = req.body.presentAddressDivision_id;
     personalDetails.presentAddressPostCode = req.body.presentAddressPostCode;
     personalDetails.profileStatus = req.body.profileStatus;
     personalDetails.updatedBy = 1;
    //personalDetails.updatedBy =req.headers[emp_id];
     var query={_id:26}
    
    PersonalEmpDetails.findOneAndUpdate(query, personalDetails, {new: true}, function(err, personalDetailsData){
    if(personalDetailsData)
    {
      return done(err,personalDetailsData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: result}
      });
    }
  });
}


//Function to Add Personal Details
function crudPersonalInfo(req,res) {
  var personalDetails_id = req.body._id || req.query._id;
   if(!personalDetails_id)
   {
     async.waterfall([
       function(done)
        {
          addPersonalInfoDetails(req,res,done);
        },
        function(personalDetailsData,done)
        {
          return res.status(200).json(personalDetailsData);
        }
     ]);
   }
   else{
      async.waterfall([
          function(done)
          {
            updatePersonalInfoDetails(req,res,done);
          },
          function(personalDetailsData,done)
          {
            return res.status(200).json(personalDetailsData);
          }
      ]);
   }
}


let notificationFlag = 0;
function sendNotifications(emp, title, message, senderEmp_id, recipientEmp_id, type_id, linkUrl) {
  //emp.hrspoc -> super (bussHrHead) -> revi(GroupHrHEad)
  //emp._id ->
   //Send Notification to Supervisor
    let notification = new Notification();
    notification.emp_id = emp._id;
    notification.title = title;
    notification.message = message;
    notification.linkUrl = linkUrl;
    notification.senderEmp_id = 1;
    notification.recipientEmp_id = recipientEmp_id;
    notification.type_id = type_id;
    notification.createdBy = 1;
    notification.save(function (err, result) {
      if(result)
      {
        //Send Bussiness Hr Head
        if(notificationFlag == 0){
          sendNotifications(emp, title, message, senderEmp_id, emp.businessHrHead_id, type_id, linkUrl);
          notificationFlag++;
        }
        else if(notificationFlag == 1){
          sendNotifications(emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
          notificationFlag++;
        }
        else if(notificationFlag == 2){
          sendNotifications(emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
          notificationFlag++;
        }
        else{
          return res.status(200).json(
            {
              message : "Success"
            }
          );
        }
      }
      else{
        return res.status(403).json({
          title: 'There was a problem',
          error: {message: err},
          result: {message: result}
        });
      }
    });
}

function auditTrailEntry(emp_id,collectionName,collectionDocument,controllerName,action,comments){
  let auditTrail = new AuditTrail();
  auditTrail.emp_id = emp_id;
  auditTrail.collectionName = collectionName;
  auditTrail.document_id = collectionDocument._id;
  auditTrail.document_values = JSON.stringify(collectionDocument);
  auditTrail.controllerName = controllerName;
  auditTrail.action = action;
  auditTrail.comments = comments;
  auditTrail.save();
}

function getPersonalInfoAndAddress(req,res)
{
  async.parallel({
    personalInfo:function(done) {
      getPersonalInfo(req,res,done)
    },
    addressInfo:function(done) {
      getAddressDetails(req,res,done)
    }
  },
  function(err, results) {
    return res.status(200).json(results);
  });
}

function getPersonalInfo (req,res,done)
{
  let query={_id:1};
  var personalInfoProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
    PersonalEmpDetails.findOne(query,personalInfoProjection,function (err, personalEmpDetails) {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: err
        });
      }
      return done(err,personalEmpDetails)
    });
}

function getAddressDetails(req,res,done) {
  let query={_id:1};
  var addressProjection = {
   createdAt: false,
   updatedAt: false,
   isDeleted: false,
   updatedBy: false,
   createdBy: false,
 };
   OfficeEmpDetails.findOne(query,addressProjection, function (err, addressData) {
     if (err) {
       return res.status(403).json({
         title: 'There was an error, please try again later',
         error: err
       });
     }
     return done(err,addressData)
   });
}

function getDocuments(req,res)
{
  //  let query={_id:1};
  // var documentProjection = {
  //   createdAt: false,
  //   updatedAt: false,
  //   isDeleted: false,
  //   updatedBy: false,
  //   createdBy: false,
  // };
  //   Documents.find(query,documentProjection, function (err, documentsData) {
  //     if (documentsData) {
  //       return res.status(200).json(documentsData);
  //     }

  //     return res.status(403).json({
  //       title: 'There was an error, please try again later',
  //       error: err,
  //       result: {message: documentsData}
  //     });
  //   });
}

function getAcademicInfo(req,res,done)
{
  // let query={_id:1};
  // var academicProjection = {
  //   createdAt: false,
  //   updatedAt: false,
  //   isDeleted: false,
  //   updatedBy: false,
  //   createdBy: false,
  // };
  //   AcademicInfo.find(query,academicProjection, function (err, academicInfoData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,academicInfoData)
  //   });
}

function getCertificationsDetails(req,res,done)
{
  // let query={_id:1};
  // var certificateProjection = {
  //   createdAt: false,
  //   updatedAt: false,
  //   isDeleted: false,
  //   updatedBy: false,
  //   createdBy: false,
  // };
  //   CertificateDetails.find(query,certificateProjection, function (err, certificateDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,certificateDetailsData)
  //   });
}

function getTraniningInfo(req,res,done)
{
  // let query={_id:1};
   // var traningInfoProjection = {
  //   createdAt: false,
  //   updatedAt: false,
  //   isDeleted: false,
  //   updatedBy: false,
  //   createdBy: false,
  // };
  //   TraningInfo.find(query,traningInfoProjection, function (err, traningInfoData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,traningInfoData)
  //   });
}

function getAcademicInfoAndCertificationsAndTraniningInfo(req,res)
{
  async.parallel([
    function (done) {
      getAcademicInfo(req,res,done)
    },
    function (done) {
      getCertificationsDetails(req,res,done)
    },
    function (done) {
      getTraniningInfo(req,res,done)
    }],
    function(err, results) {
        return res.status(200).json({"academicInfo":results[0],"certificationDetails":results[1],"traninigInfo":results[2]});
    });
}

function getPreviousEmployementHistory(req,res)
{
  //  let query={_id:1};
  //   PreviousEmployementHistory.find(query, function (err, previousEmployementHistoryData) {
  //     if (previousEmployementHistoryData) {
  //       return res.status(200).json(previousEmployementHistoryData);
  //     }
  //     return res.status(403).json({
  //       title: 'There was an error, please try again later',
  //       error: err,
  //       result: {message: documentsData}
  //     });
  //   });
}

function getFamilyInfo(req,res)
{
  //  let query={_id:1};
  //   FamilyInfo.find(query, function (err, familyInfoData) {
  //     if (familyInfoData) {
  //       return res.status(200).json(familyInfoData);
  //     }
  //     return res.status(403).json({
  //       title: 'There was an error, please try again later',
  //       error: err,
  //       result: {message: documentsData}
  //     });
  //   });
}

function getOfficeInfoAndJoiningDetailsAndPositionDetailsAndPerformanceDairy(req,res)
{
  async.parallel([
    function (done) {
      getOfficeInfo(req,res,done)
    },
    function (done) {
      getJoiningDetails(req,res,done)
    },
    function (done) {
      getPositionDetails(req,res,done)
    },
    function (done) {
      getPerformanceDairy(req,res,done)
    }],
    function (err,results) {
        return res.status(200).json({"officeInfo":results[0],"joiningDetails":results[1],"postionDetails":results[2],"performanceDairy":results[3]});
    }
  );
}

function getOfficeInfo(req,res,done)
{
  // let query={_id:1};
  //   OfficeInfo.find(query, function (err, officeInfoData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,officeData)
  //   });
}

function getJoiningDetails(req,res,officeInfo,done)
{
  // let query={_id:1};
  //   JoiningDetails.find(query, function (err, joiningDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,joiningDetailsData)
  //   });
}

function getPositionDetails(req,res,done)
{
  // let query={_id:1};
  //   PositionDetails.find(query, function (err, positionDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,positionDetailsData)
  //   });

}

function getPerformanceDairy(req,res,done)
{
    // let query={_id:1};
  //   PerformanceDairy.find(query, function (err, performanceDairyData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,performanceDairyData)
  //   });
}

function getBankDetailsAndSalaryDetailsAndOtherBanefitDetailsAndCompanyCarAndPersonalCarDetails(req,res)
{
  async.parallel([
    function (done) {
      getBankDetails(req,res,done)
    },
    function (done) {
      getSalaryDetails(req,res,done)
    },
    function (done) {
      getOtherBanefitDetails(req,res,done)
    },
    function (done) {
      getCompanyCarDetails(req,res,done)
    },
    function (done) {
      getPersonalCarDetails(req,res,done)
    }],
    function (err,results) {
        return res.status(200).json({"bankInfo":results[0],"salaryDetails":results[1],"otherBanefitDetails":results[2],"companyCarDetails":results[3],"personalCarDetails":results[4]});
    });

}

function getBankDetails(req,res,done)
{
  // let query={_id:1};
  //   BankDetails.find(query, function (err, bankDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,bankDetailsData)
  //   });
}

function getSalaryDetails(req,res,done)
{
   // let query={_id:1};
  //   SalaryDetails.find(query, function (err, salaryDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,salaryDetailsData)
  //   });
}

function getOtherBanefitDetails(req,res,done)
{
     // let query={_id:1};
  //   OtherBenefitDetails.find(query, function (err, otherBenefitDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,otherBenefitDetailsData)
  //   });
}

function getCompanyCarDetails(req,res,done)
{
  // let query={_id:1};
  //   CompanyCarDetails.find(query, function (err, companyCarDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,companyCarDetailsData)
  //   });
}

function getPersonalCarDetails(req,res,done)
{
   // let query={_id:1};
  //   PersonalCarDetails.find(query, function (err, personalCarDetailsData) {
  //     if (err) {
  //       return res.status(403).json({
  //         title: 'There was an error, please try again later',
  //         error: err
  //       });
  //     }
  //     return done(err,personalCarDetailsData)
  //   });
}

//Save Embeded array of Employee Roles
function addEmpRoles(i, req, res, emp)  {
  let empRole=new UserRoles();
  empRole.emp_id = emp._id;
  empRole.role_id = req.body.roles[i];
  empRole.save(function(err,roleDaata)
  {
    auditTrailEntry(emp._id,"user",empRole,"addEmpRole","Role added for the Employee");
    if((i+1) < req.body.roles.length){
      addEmpRoles(i+1,req,res,emp);
    }
    // async.waterfall([
    //   function (done) {
    //      auditTrailEntry(emp._id,"user",empRole,"addEmpRole","Role added for the Employee");
    //      done(null);
    //   },
    //   function (done) {
    //     if((i+1) < req.body.roles.length){
    //       addEmpRoles(i+1,req,res,emp,flag);
    //     }
    //     else {
    //       if(flag=="addEmp"){
    //             sendWelComeEmail(emp,req.body.personalEmail);
    //             async.waterfall([
    //               function (done) {
    //                 addofficeDetailsDetails(req,res,emp._id,done)
    //               },
    //               function (officeDetails, done) {
    //                 addsupervisorDetails(req,res,emp._id,done)
    //               },
    //               function (supervisorDetails,done) {
    //                 let dataToSend = [{"userName" : emp.userName}];
    //                 return res.status(200).json(
    //                   dataToSend
    //                 );
    //               }
    //             ]);
    //       }
    //       else{
    //         return res.status(200).json({
    //           status : '200',
    //           message: 'Registration Successfull'
    //         });
    //      }
    //     }
    //   }
    // ]);
  });
}

function sendWelComeEmail(emp,toemail)
{
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
    from: config.email.welcome.from, // sender address
    to: toemail,
    subject: config.email.welcome.subject, // Subject line
    template: 'email-welcome',
      context : {
         fullName:emp.fullName,
         userName:emp.userName,
         token: emp.resetPasswordToken,
         uid  : uuidV1()
      }
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions);
}

function addofficeDetailsDetails(req,res,done)
{

     let officeEmpDetails = new OfficeEmpDetails();
     officeEmpDetails.emp_id = req.body.emp_id;
     officeEmpDetails.employmentStatus_id = req.body.employmentStatus_id;
     officeEmpDetails.managementType_id = req.body.managementType_id;
     officeEmpDetails.jobTitle = req.body.jobTitle;
     //officeEmpDetails.designation = req.body.designation;
     officeEmpDetails.division_id = req.body.division_id;
     officeEmpDetails.department_id = req.body.department_id;
     officeEmpDetails.vertical_id = req.body.vertical_id;
     officeEmpDetails.subVertical_id = req.body.subVertical_id;
     officeEmpDetails.hrspoc_id = req.body.hrspoc_id;
     officeEmpDetails.businessHrHead_id = req.body.businessHrHead_id;
     officeEmpDetails.groupHrHead_id = req.body.groupHrHead_id;
     officeEmpDetails.save(function (err, officeDetailsData)
     {
       if(officeDetailsData)
        {
           auditTrailEntry(officeEmpDetails.emp_id,"officeDetails",officeEmpDetails,"user","addOfficeDetails","Office ");
           return done(err,officeDetailsData);
        }
        return res.status(403).json({
          title: 'There was a problem',
          error: {message: err},
          result: {message: officeDetailsData}
        });
     });


}

function addsupervisorDetails(req,res,done)
{
  let supervisorDetails = new SupervisorDetails();
  supervisorDetails.emp_id = req.body.emp_id;
  supervisorDetails.primarySupervisorEmp_id = req.body.primarySupervisorEmp_id;
  supervisorDetails.createdBy = 1;
  supervisorDetails.save(function (err, supervisorDetailsData) {
    if(supervisorDetailsData)
    {
      auditTrailEntry(supervisorDetails.emp_id,"supervisorDetails",supervisorDetails,"user","addsupervisorDetails","ADDED");
      return done(err,supervisorDetailsData);
    }
    return res.status(403).json({
      title: 'There was a problem',
      error: {message: err},
      result: {message: supervisorDetailsData}
    });

  })
}

let functions = {
  addEmployee: (req, res) => {
    async.waterfall([
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          let token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
          let emp=new Employee();

          //Fill Employee Details
          emp.resetPasswordToken = token;
          emp.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          emp.fullName = req.body.fullName;
          emp.password = "Test@123";
          //emp.email = req.body.email;
          //emp.officeEmail = req.body.officeEmail;
          emp.employmentType_id = req.body.employmentType_id;
          emp.designation_id = req.body.designation_id;
          emp.company_id = req.body.company_id;
          emp.userName = req.body.userName;
          emp.createdBy = 1;

          emp.save(req,function (err, result) {
            if(result)
            {
              auditTrailEntry(emp._id,"employee",emp,"user","addEmployee","Employee Added");
              addEmpRoles(0,req,res,emp);
              req.body.emp_id=emp._id;
              sendWelComeEmail(emp,req.body.personalEmail);
              async.parallel([
                function (done) {
                  addofficeDetailsDetails(req,res,done)
                },
                function (done) {
                  addsupervisorDetails(req,res,done)
                },
                function(done)
                {
                  addPersonalInfoDetails(req,res,done)
                }],
                function (done) {
                  //let dataToSend = [{"userName" : emp.userName}];
                  return res.status(200).json(
                    [{"userName" : emp.userName}]
                  );
                });
            }
            else{
              return res.status(403).json({
                title: 'There was a problem',
                error: {message: err},
                result: {message: result}
              });
            }
          });
      }
    ]);
  },
  // Add Emplyoee Personal Details
  employeeDetails(req, res)
  {
    let params=req.query.formName
    if(params)
    {
      switch(params) {
        case "personal":
            crudPersonalInfo(req, res);
            break;
        case "address":
            crudUpdateAddress(req, res);
            break;
        default:
            break;
    }
    }
  },

  getEmployeeDetails(req, res,next)
  {
    let params=req.query.formName;
    if(params)
    {
      switch(params) {
        case "personal":
            getPersonalInfoAndAddress(req, res);
            break;
        case "documents":
            getDocuments(req, res);
            break;
        case "education":
            getAcademicInfoAndCertificationsAndTraniningInfo(req, res);
            break;
        case "employement":
            getPreviousEmployementHistory(req, res);
            break;
        case "family":
            getFamilyInfo(req, res);
            break;
        case "office":
            getOfficeInfoAndJoiningDetailsAndPositionDetailsAndPerformanceDairy(req, res);
            break;
        case "payroll":
           getBankDetailsAndSalaryDetailsAndOtherBanefitDetailsAndCompanyCarAndPersonalCarDetails(req, res);
            break;
        default:
            getPersonalInfoAndAddress();
            break;
      }
    }
  },

  // Get User Info
  getUserInfo: (req, res) => {
    User.findOne({_id: req.user._id}, function (err, user) {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: err
        });
      }
      return res.status(200).json({
        user: user
      });
    });
  },

  // Upload Image to Server Temp Folder
  uploadImage: (req, res) => {
    let userId = req.user._id;
    uploadTemp(req, res, (err) => {
      if (err) {
        console.log(err);
      }
      if (req.file !== undefined) {
        gm(req.file.path)
          .resize(445, null)
          .noProfile()
          .write(req.file.path, (err) => {
            if (err) {
              console.log(err);
              res.status(500).json({
                message: 'The file you selected is not an image'
              });
            }
            User.findById(userId, (err, user) => {
              if (err) {
                return res.status(403).json({
                  title: 'There was an error, please try again later',
                  error: err
                });
              }
              if (!user) {
                return res.status(403).json({
                  title: 'You cannot change the password',
                  error: {message: 'You do not have access rights'}
                });
              }
              if (user) {
                user.profilePic = req.file.filename;
                user.save((err, result) => {
                  if (err) {
                    return res.status(403).json({
                      title: 'There was an error, please try again later',
                      error: err
                    });
                  } else {
                    if (req.file.filename !== undefined) {
                      copyImage(req, req.file.filename);
                    }
                  }
                });
              }
            });
            res.status(201).json(req.file.filename);
          });
      }
    });
  },

  // Delete Temporary Image From Temp Folder
  deleteImage: (req, res) => {
    let params = req.params.id;
    deleteImage(params);
    res.status(200).json({
      message: 'Image deleted successfully!'
    });
  },

  // Change User Password via Front End (not via email)
  changePassword: (req, res) => {
    let userId = req.user._id;
    User.findById(userId, function (err, user) {
      console.log(user);
      if (err) {
        return res.status(500).json({
          title: 'There was a problem',
          error: err
        });
      }
      if (!user) {
        return res.status(403).json({
          title: 'You cannot change the password',
          error: {message: 'You do not have access rights'}
        });
      }
      else {
        user.comparePassword(req.body.currentPassword, (err, isMatch) => {
          if (err) {
            return res.status(403).json({
              title: 'There was a problem',
              error: {message: 'Your current password is wrong!'}
            });
          }
          if (!isMatch) {
            return res.status(403).json({
              title: 'There was a problem',
              error: {message: 'Your current password is wrong!'}
            });
          }
          if (isMatch) {
            let newPassword = req.body.newPassword;
            user.set('password', newPassword);
            user.save((err) => {
              if (err) {
                console.log(err);
                return res.status(500).json({
                  err: {message: 'There was an error, please try again'}
                });
              }
              res.status(201).json({
                message: 'Your password has changed successfully!'
              });
            });
          }
        });
      }
    });
  }
};

module.exports = functions;
