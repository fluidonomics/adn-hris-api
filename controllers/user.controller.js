
let express           = require('express'),
    Employee          = require('../models/employee/employeeDetails.model'),
    PersonalDetails   = require('../models/employee/employeePersonalDetails.model'),
    OfficeDetails     = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorDetails = require('../models/employee/employeeSupervisorDetails.model'),
    Address           = require('../models/employee/employeeAddressDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    Notification      = require('../models/common/notification.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    AcademicInfo      = require('../models/employee/employeeAcademicDetails.model'),
    FamilyInfo        = require('../models/employee/employeeFamilyDetails.model'),
    PreviousEmployementHistory = require('../models/employee/employeePreviousEmploymentDetails.model'),
    CertificationInfo = require('../models/employee/employeeCertificationDetails.model'),
    Bank              = require('../models/employee/employeeBankDetails.model'),
    SalaryInfo        = require('../models/employee/employeeSalaryDetails.model'),
    CarInfo           = require('../models/employee/employeeCarDetails.model'),
    Documents         = require('../models/employee/employeeDocumentDetails.model'),
    config            = require('../config/config'),
    fs                = require('fs'),
    fse               = require('fs-extra'),
    mkdirP            = require('mkdirp'),
    multer            = require('multer'),
    mime              = require('mime'),
    path              = require('path'),
    crypto            = require('crypto'),
    async             = require('async'),
    nodemailer        = require('nodemailer'),
    hbs               = require('nodemailer-express-handlebars'),
    sgTransport       = require('nodemailer-sendgrid-transport'),
    uuidV1            = require('uuid/v1'),
    gm                = require('gm').subClass({imageMagick: true});
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
  let personalDetails = new PersonalDetails();
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
  personalDetails.maritialStatus = req.body.maritialStatus;
  personalDetails.emergencyContactPerson = req.body.emergencyContactPerson;
  personalDetails.emergencyContactNumber = req.body.emergencyContactNumber;
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
     let personalDetails = new PersonalDetails();
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
     personalDetails.maritialStatus = req.body.maritialStatus;
     personalDetails.emergencyContactPerson = req.body.emergencyContactPerson;
     personalDetails.emergencyContactNumber = req.body.emergencyContactNumber;
     personalDetails.profileStatus = req.body.profileStatus;
     personalDetails.updatedBy = 1;
    //personalDetails.updatedBy =req.headers[emp_id];

    let _id=req.body._id;
     var query={_id:_id,isDeleted:false}

     var personalInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    PersonalDetails.findOneAndUpdate(query, personalDetails, {new: true, projection:personalInfoProjection}, function(err, personalDetailsData){
    if(personalDetailsData)
    {
      return done(err,personalDetailsData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: personalDetailsData}
      });
    }
  });
}
function addAcademicInfoDetails(req,res,done)
{
  let academicInfo = new AcademicInfo();
  academicInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  academicInfo.levelOfEducation = req.body.levelOfEducation;
  academicInfo.examDegreeTitle =  req.body.examDegreeTitle;
  academicInfo.concentration = req.body.concentration;
  academicInfo.instituteName =  req.body.instituteName;
  academicInfo.marks = req.body.marks;
  academicInfo.result = req.body.result;
  academicInfo.cgpa = req.body.cgpa;
  academicInfo.scale = req.body.scale;
  academicInfo.yearOfPassing = req.body.yearOfPassing;
  academicInfo.duration = req.body.duration;
  academicInfo.achievements = req.body.achievements;
  academicInfo.isCompleted = true;
  academicInfo.createdBy = 1;

  //academicInfo.createdBy =req.headers[emp_id];

  academicInfo.save(function (err, academicInfoData) {
    if(academicInfoData)
    {
      auditTrailEntry(academicInfo.emp_id,"academicInfo",academicInfo,"user","academicInfo","ADDED");
      return done(err, academicInfoData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: academicInfoData}
      });
    }
  });
}
function updateAcademicInfoDetails(req,res,done)
{
  let academicInfo = new AcademicInfo();
  academicInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  academicInfo.levelOfEducation = req.body.levelOfEducation;
  academicInfo.examDegreeTitle =  req.body.examDegreeTitle;
  academicInfo.concentration = req.body.concentration;
  academicInfo.instituteName =  req.body.instituteName;
  academicInfo.marks = req.body.marks;
  academicInfo.result = req.body.result;
  academicInfo.cgpa = req.body.cgpa;
  academicInfo.scale = req.body.scale;
  academicInfo.yearOfPassing = req.body.yearOfPassing;
  academicInfo.duration = req.body.duration;
  academicInfo.achievements = req.body.achievements;
  academicInfo.isCompleted = true;
  academicInfo.updatedBy = 1;

  //academicInfo.updatedBy =req.headers[emp_id];
    let _id=req.body._id;
    var query={_id:_id,isDeleted:false}

    var academicInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    AcademicInfo.findOneAndUpdate(query, academicInfo, {new: true, projection:academicInfoProjection}, function(err, academicInfoData){
   if(academicInfoData)
   {
     return done(err,academicInfoData);
   }
   else{
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: academicInfoData}
     });
   }
 });
}

function addDocumentsDetails(req,res,done)
{
  let documents = new Documents();
  documents.emp_id = req.body.emp_id  || req.query.emp_id;
  documents.nationalIdSmartCard = req.body.nationalIdSmartCard;
  documents.nationalIdSmartCardDocURL =  req.body.nationalIdSmartCardDocURL;
  documents.passportNumber = req.body.passportNumber;
  documents.passportNumberDocURL =  req.body.passportNumberDocURL;
  documents.birthRegistrationNumber = req.body.birthRegistrationNumber;
  documents.birthRegistrationNumberDocURL = req.body.birthRegistrationNumberDocURL;
  documents.nationalIDOldFormat = req.body.nationalIDOldFormat;
  documents.nationalIDOldFormatDocURL = req.body.nationalIDOldFormatDocURL;
  documents.isCompleted = true;
  documents.createdBy = 1;

  //documents.createdBy =req.headers[emp_id];

  documents.save(function (err, documentsData) {
    if(documentsData)
    {
      auditTrailEntry(documents.emp_id,"documents",documents,"user","documents","ADDED");
      return done(err, documentsData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: documentsData}
      });
    }
  });
}
function updateDocumentsDetails(req,res,done)
{
  let documents = new Documents();
  documents.emp_id = req.body.emp_id  || req.query.emp_id;
  documents.nationalIdSmartCard = req.body.nationalIdSmartCard;
  documents.nationalIdSmartCardDocURL =  req.body.nationalIdSmartCardDocURL;
  documents.passportNumber = req.body.passportNumber;
  documents.passportNumberDocURL =  req.body.passportNumberDocURL;
  documents.birthRegistrationNumber = req.body.birthRegistrationNumber;
  documents.birthRegistrationNumberDocURL = req.body.birthRegistrationNumberDocURL;
  documents.nationalIDOldFormat = req.body.nationalIDOldFormat;
  documents.nationalIDOldFormatDocURL = req.body.nationalIDOldFormatDocURL;
  documents.isCompleted = true;
  documents.updatedBy = 1;

  //documents.updatedBy =req.headers[emp_id];
    let _id=req.body._id;
    var query={_id:_id,isDeleted:false}

    var documentsProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    Documents.findOneAndUpdate(query, documents, {new: true, projection:documentsProjection}, function(err, documentsData){
   if(documentsData)
   {
     return done(err,documentsData);
   }
   else{
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: documentsData}
     });
   }
 });
}
function addFamilyInfoDetails(req,res,done)
{
  let familyInfo = new FamilyInfo();
  familyInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  familyInfo.name = req.body.name;
  familyInfo.relation_id =  req.body.relation_id;
  familyInfo.dateOfBirth = req.body.dateOfBirth;
  familyInfo.contact =  req.body.contact;
  familyInfo.isCompleted = true;
  familyInfo.createdBy = 1;

  //familyInfo.createdBy =req.headers[emp_id];

  familyInfo.save(function (err, familyInfoData) {
    if(familyInfoData)
    {
      auditTrailEntry(familyInfo.emp_id,"familyInfo",familyInfo,"user","familyInfo","ADDED");
      return done(err, familyInfoData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: familyInfoData}
      });
    }
  });
}
function updateFamilyInfoDetails(req,res,done)
{
  let familyInfo = new FamilyInfo();
  familyInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  familyInfo.name = req.body.name;
  familyInfo.relation_id =  req.body.relation_id;
  familyInfo.dateOfBirth = req.body.dateOfBirth;
  familyInfo.contact =  req.body.contact;
  familyInfo.isCompleted = true;
  familyInfo.updatedBy = 1;

  //familyInfo.updatedBy =req.headers[emp_id];
    let _id=req.body._id;
    var query={_id:_id,isDeleted:false}

    var familyInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    FamilyInfo.findOneAndUpdate(query, familyInfo, {new: true, projection:familyInfoProjection}, function(err, familyInfoData){
   if(familyInfoData)
   {
     return done(err,familyInfoData);
   }
   else{
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: familyInfoData}
     });
   }
 });
}

function addAddressInfoDetails(req,res,done){
  let address = new Address();
  address.emp_id = req.body.emp_id || req.query.emp_id;
  
  address.permanentAddressLine1 = req.body.permanentAddressLine1;
  address.permanentAddressLine2 = req.body.permanentAddressLine2;
  address.permanentAddressThana_id= req.body.permanentAddressThana_id;
  address.permanentAddressDistrict_id = req.body.permanentAddressDistrict_id;
  address.permanentAddressDivision_id = req.body.permanentAddressDivision_id;
  address.permanentAddressPostCode = req.body.permanentAddressPostCode;

  address.currentAddressLine1 = req.body.currentAddressLine1;
  address.currentAddressLine2 = req.body.currentAddressLine2;
  address.currentAddressThana_id = req.body.currentAddressThana_id;
  address.currentAddressDistrict_id = req.body.currentAddressDistrict_id;
  address.currentAddressDivision_id = req.body.currentAddressDivision_id;
  address.currentAddressPostCode = req.body.currentAddressPostCode;

  address.isSameAsCurrent = req.body.isSameAsCurrent;
  address.createdBy = 1;

  address.save(function (err, addressData) {
    if(addressData)
    {
      auditTrailEntry(address.emp_id,"address",address,"user","address","ADDED");
      return done(err, addressData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: addressData}
      });
    }
  });
}
function updateAddressInfoDetails(req,res,done)
{
  let address = new Address();
  address.emp_id = req.body.emp_id || req.query.emp_id;
  
  address.permanentAddressLine1 = req.body.permanentAddressLine1;
  address.permanentAddressLine2 = req.body.permanentAddressLine2;
  address.permanentAddressThana_id= req.body.permanentAddressThana_id;
  address.permanentAddressDistrict_id = req.body.permanentAddressDistrict_id;
  address.permanentAddressDivision_id = req.body.permanentAddressDivision_id;
  address.permanentAddressPostCode = req.body.permanentAddressPostCode;

  address.currentAddressLine1 = req.body.currentAddressLine1;
  address.currentAddressLine2 = req.body.currentAddressLine2;
  address.currentAddressThana_id = req.body.currentAddressThana_id;
  address.currentAddressDistrict_id = req.body.currentAddressDistrict_id;
  address.currentAddressDivision_id = req.body.currentAddressDivision_id;
  address.currentAddressPostCode = req.body.currentAddressPostCode;
  address.isSameAsCurrent = req.body.isSameAsCurrent;
  address.updatedBy = 1;

    let _id=req.body._id;
    var query={_id:_id,isActive:true}

     var addressInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    Address.findOneAndUpdate(query, address, {new: true,projection:addressInfoProjection}, function(err, addressData){
    if(addressData)
    {
      return done(err,addressData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: addressData}
      });
    }
  });
}
function addBankDetails(req,res,done)
{
  let bank = new Bank();
  bank.emp_id = req.body.emp_id  || req.query.emp_id;
  bank.bankName = req.body.bankName;
  bank.accountName = req.body.accountName;
  bank.accountNumber = req.body.accountNumber;
  bank.currency = req.body.currency;
  bank.modeOfPaymentType = req.body.modeOfPaymentType;
  bank.isCompleted = true;
  bank.createdBy = 1;

  //bank.createdBy =req.headers[emp_id];

  bank.save(function (err, bankData) {
    if(bankData)
    {
      auditTrailEntry(bank.emp_id,"bank",bank,"user","bank","ADDED");
      return done(err, bankData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: bankData}
      });
    }
  });
}
function updateBankDetails(req,res,done)
{
  let bank = new Bank();
  bank.emp_id = req.body.emp_id  || req.query.emp_id;
  bank.bankName = req.body.bankName;
  bank.accountName = req.body.accountName;
  bank.accountNumber = req.body.accountNumber;
  bank.currency = req.body.currency;
  bank.modeOfPaymentType = req.body.modeOfPaymentType;
  bank.emp_id = req.body.emp_id;  
  bank.isCompleted = true;
  bank.updatedBy = 1;

  //bank.updatedBy =req.headers[emp_id];
    let _id=req.body._id;
    var query={_id:_id,isDeleted:false}

    var bankProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    Bank.findOneAndUpdate(query, bank, {new: true, projection:bankProjection}, function(err, bankData){
   if(bankData)
   {
     return done(err,bankData);
   }
   else{
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: bankData}
     });
   }
 });
}
function addSalaryInfoDetails(req,res,done)
{
  let salaryInfo = new SalaryInfo();
  salaryInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  salaryInfo.basic = req.body.basic;
  salaryInfo.hra =  req.body.hra;
  salaryInfo.conveyanceAllowance = req.body.conveyanceAllowance;
  salaryInfo.lfa =  req.body.lfa;
  salaryInfo.medicalAllowance = req.body.medicalAllowance;
  salaryInfo.specialAllowance = req.body.specialAllowance;
  salaryInfo.grossSalary = req.body.grossSalary;
  salaryInfo.lunchAllowance = req.body.lunchAllowance;
  salaryInfo.mobileAllowance = req.body.mobileAllowance;
  salaryInfo.otherAllowance = req.body.otherAllowance;
  salaryInfo.totalEarnings = req.body.totalEarnings;
  salaryInfo.festivalAllowance = req.body.festivalAllowance;
  salaryInfo.providentFundMembership = req.body.providentFundMembership;
  salaryInfo.groupLifeInsurance = req.body.groupLifeInsurance;
  salaryInfo.hospitalizationScheme = req.body.hospitalizationScheme;
  salaryInfo.isHike = req.body.isHike;
  salaryInfo.isCompleted = true;
  salaryInfo.createdBy = 1;

  //salaryInfo.createdBy =req.headers[emp_id];

  salaryInfo.save(function (err, salaryInfoData) {
    if(salaryInfoData)
    {
      auditTrailEntry(salaryInfo.emp_id,"salaryInfo",salaryInfo,"user","salaryInfo","ADDED");
      return done(err, salaryInfoData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: salaryInfoData}
      });
    }
  });
}
function updateSalaryInfoDetails(req,res,done)
{
  let salaryInfo = new SalaryInfo();
  salaryInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  salaryInfo.basic = req.body.basic;
  salaryInfo.hra =  req.body.hra;
  salaryInfo.conveyanceAllowance = req.body.conveyanceAllowance;
  salaryInfo.lfa =  req.body.lfa;
  salaryInfo.medicalAllowance = req.body.medicalAllowance;
  salaryInfo.specialAllowance = req.body.specialAllowance;
  salaryInfo.grossSalary = req.body.grossSalary;
  salaryInfo.lunchAllowance = req.body.lunchAllowance;
  salaryInfo.mobileAllowance = req.body.mobileAllowance;
  salaryInfo.otherAllowance = req.body.otherAllowance;
  salaryInfo.totalEarnings = req.body.totalEarnings;
  salaryInfo.festivalAllowance = req.body.festivalAllowance;
  salaryInfo.providentFundMembership = req.body.providentFundMembership;
  salaryInfo.groupLifeInsurance = req.body.groupLifeInsurance;
  salaryInfo.hospitalizationScheme = req.body.hospitalizationScheme;
  salaryInfo.isHike = req.body.isHike;
  salaryInfo.isCompleted = true;
  salaryInfo.updatedBy = 1;

  //salaryInfo.updatedBy =req.headers[emp_id];
    let _id=req.body._id;
    var query={_id:_id,isActive:true}

    var salaryInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    SalaryInfo.findOneAndUpdate(query, salaryInfo, {new: true, projection:salaryInfoProjection}, function(err, salaryInfoData){
   if(salaryInfoData)
   {
     return done(err,salaryInfoData);
   }
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: salaryInfoData}
     });
 });
}


function addCarInfoDetails(req,res,done)
{
  let carInfo = new CarInfo();
  carInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  carInfo.companyRegistrationNumber = req.body.companyRegistrationNumber;
  carInfo.companyEffectiveDate =  req.body.companyEffectiveDate;
  carInfo.companyExpiryDate = req.body.companyExpiryDate;
  carInfo.companyFuelAllowance =  req.body.companyFuelAllowance;
  carInfo.companyMaintenanceAllowance = req.body.companyMaintenanceAllowance;
  carInfo.companyDriverAllowance = req.body.companyDriverAllowance;
  carInfo.companyGrossPay = req.body.companyGrossPay;
  carInfo.privateRegistrationNumber = req.body.privateRegistrationNumber;
  carInfo.privateEffectiveDate = req.body.privateEffectiveDate;
  carInfo.privateExpiryDate = req.body.privateExpiryDate;
  carInfo.privateCarUsageAllowance = req.body.privateCarUsageAllowance;
  carInfo.isCompleted = true;
  carInfo.createdBy = 1;

  //carInfo.createdBy =req.headers[emp_id];

  carInfo.save(function (err, carInfoData) {
    if(carInfoData)
    {
      auditTrailEntry(carInfo.emp_id,"carInfo",carInfo,"user","carInfo","ADDED");
      return done(err, carInfoData);
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: carInfoData}
      });
    }
  });
}
function updateCarInfoDetails(req,res,done)
{
  let carInfo = new CarInfo();
  carInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  carInfo.companyRegistrationNumber = req.body.companyRegistrationNumber;
  carInfo.companyEffectiveDate =  req.body.companyEffectiveDate;
  carInfo.companyExpiryDate = req.body.companyExpiryDate;
  carInfo.companyFuelAllowance =  req.body.companyFuelAllowance;
  carInfo.companyMaintenanceAllowance = req.body.companyMaintenanceAllowance;
  carInfo.companyDriverAllowance = req.body.companyDriverAllowance;
  carInfo.companyGrossPay = req.body.companyGrossPay;
  carInfo.privateRegistrationNumber = req.body.privateRegistrationNumber;
  carInfo.privateEffectiveDate = req.body.privateEffectiveDate;
  carInfo.privateExpiryDate = req.body.privateExpiryDate;
  carInfo.privateCarUsageAllowance = req.body.privateCarUsageAllowance;
  carInfo.isCompleted = true;
  carInfo.updatedBy = 1;

  //carInfo.updatedBy =req.headers[emp_id];
    let _id=req.body._id;
    var query={_id:_id,isDeleted:false}

    var carInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    CarInfo.findOneAndUpdate(query, carInfo, {new: true, projection:carInfoProjection}, function(err, carInfoData){
   if(carInfoData)
   {
     return done(err,carInfoData);
   }
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: carInfoData}
     });
 });
}


function addCertificationInfoDetails(req,res,done)
{
  let certificationInfo = new CertificationInfo();
  certificationInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  certificationInfo.certificationTitle = req.body.certificationTitle;
  certificationInfo.location =  req.body.location;
  certificationInfo.institution = req.body.institution;
  certificationInfo.duration =  req.body.duration;
  certificationInfo.topicsCovered = req.body.topicsCovered;
  certificationInfo.isCompleted = true;
  certificationInfo.createdBy = 1;

  //certificationInfo.createdBy =req.headers[emp_id];

  certificationInfo.save(function (err, certificationInfoData) {
    if(certificationInfoData)
    {
      auditTrailEntry(certificationInfo.emp_id,"certificationInfo",certificationInfo,"user","certificationInfo","ADDED");
      //return done(err, certificationInfoData);
      req.query.emp_id = certificationInfo.emp_id;
      getCertificationDetails(req,res,done)
    }
    else{
      return res.status(403).json({
        title: 'There was a problem',
        error: {message: err},
        result: {message: certificationInfoData}
      });
    }
  });
}
function updateCertificationInfoDetails(req,res,done)
{
  let certificationInfo = new CertificationInfo();
  certificationInfo.emp_id = req.body.emp_id  || req.query.emp_id;
  certificationInfo.certificationTitle = req.body.certificationTitle;
  certificationInfo.location =  req.body.location;
  certificationInfo.institution = req.body.institution;
  certificationInfo.duration =  req.body.duration;
  certificationInfo.topicsCovered = req.body.topicsCovered;
  certificationInfo.isCompleted = true;
  certificationInfo.updatedBy = 1;

  //certificationInfo.updatedBy =req.headers[emp_id];
    let _id=req.body._id;
    var query={_id:_id,isDeleted:false}

    var certificationInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    CertificationInfo.findOneAndUpdate(query, certificationInfo, {new: true, projection:certificationInfoProjection}, function(err, certificationInfoData){
   if(certificationInfoData)
   {
     return done(err,certificationInfoData);
   }
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: certificationInfoData}
     });
 });
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
//Save Embeded array of Employee Roles
function addEmpRoles(i, req, res, emp)  {
  let empRole=new EmployeeRoles();
  empRole.emp_id = emp._id;
  empRole.role_id = req.body.roles[i];
  empRole.save(function(err,roleDaata)
  {
    auditTrailEntry(emp._id,"user",empRole,"addEmpRole","Role added for the Employee");
    if((i+1) < req.body.roles.length){
      addEmpRoles(i+1,req,res,emp);
    }
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
function addofficeInfoDetails(req,res,done)
{

     let officeEmpDetails = new OfficeDetails();
     officeEmpDetails.emp_id = req.body.emp_id;
     officeEmpDetails.employmentStatus_id = req.body.employmentStatus_id;
     officeEmpDetails.managementType_id = req.body.managementType_id;
     officeEmpDetails.jobTitle = req.body.jobTitle;
     officeEmpDetails.idCardNumber = req.body.idCardNumber;
     
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
function updateofficeInfoDetails(req,res,done)
{
     let officeEmpDetails = new OfficeDetails();
     officeEmpDetails.emp_id = req.body.emp_id;
     officeEmpDetails.employmentStatus_id = req.body.employmentStatus_id;
     officeEmpDetails.managementType_id = req.body.managementType_id;
     officeEmpDetails.jobTitle = req.body.jobTitle;
     officeEmpDetails.idCardNumber = req.body.idCardNumber;
     //officeEmpDetails.designation = req.body.designation;
     officeEmpDetails.division_id = req.body.division_id;
     officeEmpDetails.department_id = req.body.department_id;
     officeEmpDetails.vertical_id = req.body.vertical_id;
     officeEmpDetails.subVertical_id = req.body.subVertical_id;
     officeEmpDetails.hrspoc_id = req.body.hrspoc_id;
     officeEmpDetails.businessHrHead_id = req.body.businessHrHead_id;
     officeEmpDetails.groupHrHead_id = req.body.groupHrHead_id;
     officeEmpDetails.createdBy=1;

     let _id=req.body._id;
    var query={_id:_id,isDeleted:false}

    var officeDetailsProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
    };

    OfficeDetails.findOneAndUpdate(query, academicInfo, {new: true, projection:officeDetailsProjection}, function(err, officeDetailsData){
   if(officeDetailsData)
   {
     return done(err,officeDetailsData);
   }
   else{
     return res.status(403).json({
       title: 'There was a problem',
       error: {message: err},
       result: {message: officeDetailsData}
     });
   }
 });
}
function  addSupervisorDetails(req,res,done)
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
function  updateSupervisorDetails(req,res,done)
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
function getPersonalInfoDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
    query={emp_id:emp_id,isDeleted:false};
  }
  var personalInfoProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
  PersonalDetails.findOne(query,personalInfoProjection,function (err, personalEmpDetails) {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: err
        });
      }
       return res.status(200).json(personalEmpDetails);
  });
}
function getAddressInfoDetails(req,res) {
  let emp_id=req.query.emp_id;
  let query={isActive:true};
  if(emp_id)
  {
    query={emp_id:emp_id,isActive:true};
  }
  var addressInfoProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
  Address.findOne(query,addressInfoProjection,function (err, addressDetails) {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: err
        });
      }
       return res.status(200).json(addressDetails);
  });
}
function getDocumentsDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
    query={emp_id:emp_id,isDeleted:false};
  }
  var documentProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
    Documents.findOne(query,documentProjection, function (err, documentsData) {
      if (documentsData) {
        return res.status(200).json(documentsData);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: documentsData}
      });
    });
}
function getAcademicInfo(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
   query={emp_id:emp_id,isDeleted:false};
  }
  var academicProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
    AcademicInfo.find(query,academicProjection, function (err, academicInfoData) {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: err
        });
      }
        return res.status(200).json(academicInfoData);
    });
}
function getCertificationDetails(req,res, done)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
   query={emp_id:emp_id,isDeleted:false};
  }
  var certificateAndTraniningProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
  CertificationInfo.find(query,certificateAndTraniningProjection, function (err, certificateDetailsData) {
      if (certificateDetailsData) {        
        return done (err,certificateDetailsData);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: certificateDetailsData}
      });
    });
}
function getPreviousEmployementHistoryDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
    query={emp_id:emp_id,isDeleted:true};
  }
  var previousEmployementHistoryInfoProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
    PreviousEmployementHistory.find(query,previousEmployementHistoryInfoProjection, function (err, previousEmployementHistoryData) {
      if (previousEmployementHistoryData) {
        return res.status(200).json(previousEmployementHistoryData);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: previousEmployementHistoryData}
      });
    });
}
function getFamilyInfoDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  
  if(emp_id)
  {
   query={emp_id:emp_id,isDeleted:false};
  }
  var familyInfoProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
    FamilyInfo.find(query, familyInfoProjection, function (err, familyInfoData) {
      if (familyInfoData) {
        return res.status(200).json(familyInfoData);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: documentsData}
      });
    });
}
function getOfficeInfoDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
   query={emp_id:emp_id,isDeleted:false};
  }
  var officeInfoProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
    OfficeDetails.find(query,officeInfoProjection, function (err, officeInfoData) {
      if (officeInfoData) {
        return res.status(200).json(officeInfoData);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: officeInfoData}
      });
    });
}
function getJoiningInfoDetails(req,res)
{
  // let emp_id=req.query.emp_id;
  // let query={isDeleted:false};
  // if(emp_id)
  // {
  //  query={emp_id:emp_id,isDeleted:false};
  // }
  // var joiningInfoProjection = {
  //   createdAt: false,
  //   updatedAt: false,
  //   isDeleted: false,
  //   updatedBy: false,
  //   createdBy: false,
  // };
  //   JoiningDetails.find(query,joiningInfoProjection, function (err, joiningDetailsData) {
  // if (joiningDetailsData) {
  //   return res.status(200).json(joiningDetailsData);
  // }
  // return res.status(403).json({
  //   title: 'There was an error, please try again later',
  //   error: err,
  //   result: {message: joiningDetailsData}
  // });
  //   });
}
function getPositionInfoDetails(req,res)
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
function getPerformanceDairyInfoDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
   query={emp_id:emp_id,isDeleted:false};
  }
  var performanceDairyProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
  PerformanceDairy.find(query, function (err, performanceDairyProjection) {
      if (performanceDairyProjection) {
        return res.status(200).json(performanceDairyProjection);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: performanceDairyProjection}
      });
   });
}
function getBankInfoDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
   query={emp_id:emp_id,isDeleted:false};
  }
  var bankDetailsProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
  Bank.findOne(query,bankDetailsProjection, function (err, bankDetailsData) {
      if (bankDetailsData) {
        return res.status(200).json(bankDetailsData);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: bankDetailsData}
      });
  });
}
function getSalaryInfoDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isActive:true};
  if(emp_id)
  {
   query={emp_id:emp_id,isActive:true};
  }
  var salaryDetailsProjection = {
    createdAt: false,
    updatedAt: false,
    isActive: false,
    updatedBy: false,
    createdBy: false,
  };
  SalaryInfo.findOne(query,salaryDetailsProjection, function (err, salaryDetailsData) {
    if (salaryDetailsData) {
      return res.status(200).json(salaryDetailsData);
    }
    return res.status(403).json({
      title: 'There was an error, please try again later',
      error: err,
      result: {message: salaryDetailsData}
    });
  });
}
function getCarInfoDetails(req,res)
{
  let emp_id=req.query.emp_id;
  let query={isDeleted:false};
  if(emp_id)
  {
   query={emp_id:emp_id,isDeleted:false};
  }
  var carInfoProjection = {
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
    updatedBy: false,
    createdBy: false,
  };
  CarInfo.findOne(query,carInfoProjection, function (err, carDetailsData) {
       if (carDetailsData) {
        return res.status(200).json(carDetailsData);
      }
      return res.status(403).json({
        title: 'There was an error, please try again later',
        error: err,
        result: {message: carDetailsData}
      });
    });
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
          emp.grade_id = req.body.grade_id;
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
                  addofficeInfoDetails(req,res,done)
                },
                function (done) {
                  addSupervisorDetails(req,res,done)
                },
                function(done)
                {
                  addPersonalInfoDetails(req,res,done)
                }],
                function (done) {
                  //let dataToSend = [{"userName" : emp.userName}];
                  return res.status(200).json({"userName" : emp.userName});
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

  getEmployeeDetails:(req, res)=>
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

  getPersonalInfo:(req, res)=>
  {
     getPersonalInfoDetails(req, res);
  },
  getAddressDetails:(req, res)=>
  {
    getAddressInfoDetails(req, res);
  },
  getDocuments:(req, res)=>
  {
    getDocumentsDetails(req, res);
  },
  getAcademicInfo:(req, res)=>
  {
    getAcademicInfo(req, res);
  },
  getCertification:(req, res)=>
  {
    async.parallel([
      function(done){
        getCertificationDetails(req, res, done)
      },
      function(certificateDetailsData)
      {
        return res.json(200).json(certificateDetailsData);
      }
    ])
  },
  getPreviousEmployementHistory:(req, res)=>
  {
    getPreviousEmployementHistoryDetails(req, res);
  },
  getFamilyInfo:(req, res)=>
  {
    getFamilyInfoDetails(req, res);
  },
  getOfficeInfo:(req, res)=>
  {
    getOfficeInfoDetails(req, res)
  },
  getJoiningDetails:(req, res)=>
  {
    getJoiningInfoDetails(req, res)
  },
  getPositionDetails:(req, res)=>
  {
    getPositionInfoDetails(req, res)
  },
  getPerformanceDairy:(req, res)=>
  {
    getPerformanceDairyInfoDetails(req, res);
  },
  getBankDetails:(req, res)=>
  {
    getBankInfoDetails(req, res);
  },
  getSalaryDetails:(req, res)=>
  {
    getSalaryInfoDetails(req, res);
  },
  getCarDetails:(req, res)=>
  {
    getCarInfoDetails(req, res);
  },

  addPersonalInfo:(req, res)=>
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
  },
  updatePersonalInfo:(req, res)=>
  {
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
  },

  addAcademicInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        addAcademicInfoDetails(req,res,done);
       },
       function(academicInfoData,done)
       {
         return res.status(200).json(academicInfoData);
       }
    ]);
  },

  updateAcademicInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        updateAcademicInfoDetails(req,res,done);
       },
       function(academicInfoData,done)
       {
         return res.status(200).json(academicInfoData);
       }
    ]);
  },

  addDocuments:(req, res)=>
  {
    async.waterfall([
      function(done)
      {
        addDocumentsDetails(req,res,done);
      },
      function(documentsData,done)
      {
        return res.status(200).json(documentsData);
      }
    ]);
  },

  updateDocuments:(req, res)=>
  {
    async.waterfall([
      function(done)
      {
        updateDocumentsDetails(req,res,done);
      },
      function(documentsData,done)
      {
        return res.status(200).json(documentsData);
      }
    ]);
  },

  addFamilyInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        addFamilyInfoDetails(req,res,done);
       },
       function(familyInfoData,done)
       {
         return res.status(200).json(familyInfoData);
       }
    ]);
  },
  updateFamilyInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        updateFamilyInfoDetails(req,res,done);
       },
       function(familyInfoData,done)
       {
         return res.status(200).json(familyInfoData);
       }
    ]);
  },

  addAddress:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        addAddressInfoDetails(req,res,done);
       },
       function(addressDetailsData,done)
       {
         return res.status(200).json(addressDetailsData);
       }
    ]);
  },
  updateAddress:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        updateAddressInfoDetails(req,res,done);
       },
       function(addressDetailsData,done)
       {
         return res.status(200).json(addressDetailsData);
       }
    ]);
  },
  addofficeDetails:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        addofficeInfoDetails(req,res,done);
       },
       function(officeInfoDetailsData,done)
       {
         return res.status(200).json(officeInfoDetailsData);
       }
    ]);
  },
  addBank:(req, res)=>
  {
    async.waterfall([
      function(done)
      {
        addBankDetails(req,res,done);
      },
      function(bankData,done)
      {
        return res.status(200).json(bankData);
      }
    ]);
  },

  updateBank:(req, res)=>
  {
    async.waterfall([
      function(done)
      {
        updateBankDetails(req,res,done);
      },
      function(bankData,done)
      {
        return res.status(200).json(bankData);
      }
    ]);
  },

  addSalaryInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        addSalaryInfoDetails(req,res,done);
       },
       function(salaryInfoData,done)
       {
         return res.status(200).json(salaryInfoData);
       }
    ]);
  },

  updateSalaryInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        updateSalaryInfoDetails(req,res,done);
       },
       function(salaryInfoData,done)
       {
         return res.status(200).json(salaryInfoData);
       }
    ]);
  },

  addCarInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        addCarInfoDetails(req,res,done);
       },
       function(carInfoData,done)
       {
         return res.status(200).json(carInfoData);
       }
    ]);
  },

  updateCarInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        updateCarInfoDetails(req,res,done);
       },
       function(carInfoData,done)
       {
         return res.status(200).json(carInfoData);
       }
    ]);
  },

  
  addCertificationInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        addCertificationInfoDetails(req,res,done);
       },
       function(certificationInfoData,done)
       {
         return res.status(200).json(certificationInfoData);
       }
    ]);
  },

  updateCertificationInfo:(req, res)=>
  {
    async.waterfall([
      function(done)
       {
        updateCertificationInfoDetails(req,res,done);
       },
       function(certificationInfoData,done)
       {
         return res.status(200).json(certificationInfoData);
       }
    ]);
  },

  // updateofficeDetails:(req, res)=>
  // {
  //   async.waterfall([
  //     function(done)
  //      {
  //       updatePersonalInfoDetails(req,res,done);
  //      },
  //      function(personalDetailsData,done)
  //      {
  //        return res.status(200).json(personalDetailsData);
  //      }
  //   ]);
  // },

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
