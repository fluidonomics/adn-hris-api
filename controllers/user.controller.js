let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),
    AddressInfo       = require('../models/employee/employeeAddressDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    Notification      = require('../models/common/notification.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    AcademicInfo      = require('../models/employee/employeeAcademicDetails.model'),
    FamilyInfo        = require('../models/employee/employeeFamilyDetails.model'),
    PreviousEmploymentInfo = require('../models/employee/employeePreviousEmploymentDetails.model'),
    CertificationInfo = require('../models/employee/employeeCertificationDetails.model'),
    BankInfo          = require('../models/employee/employeeBankDetails.model'),
    SalaryInfo        = require('../models/employee/employeeSalaryDetails.model'),
    CarInfo           = require('../models/employee/employeeCarDetails.model'),
    DocumentsInfo     = require('../models/employee/employeeDocumentDetails.model'),
    PerformanceRatingInfo = require('../models/employee/employeePerformanceRatingDetails.model'),
    config            = require('../config/config'),
    crypto            = require('crypto'),
    async             = require('async'),
    nodemailer        = require('nodemailer'),
    hbs               = require('nodemailer-express-handlebars'),
    sgTransport       = require('nodemailer-sendgrid-transport'),
    uuidV1            = require('uuid/v1');
    require('dotenv').load()


function addPersonalInfoDetails(req, res, done) {
    let personalDetails = new PersonalInfo(req.body);
    personalDetails.emp_id = req.body.emp_id || req.query.emp_id;
    // personalDetails.gender = (req.body.gender == undefined) ? ((req.query.gender == undefined ? null : req.query.gender)) : req.body.gender;
    // personalDetails.personalMobileNumber = (req.body.personalMobileNumber == undefined) ? ((req.query.personalMobileNumber == undefined ? null : req.query.personalMobileNumber)) : req.body.personalMobileNumber;
    // personalDetails.personalEmail = (req.body.personalEmail == undefined) ? ((req.query.personalEmail == undefined ? null : req.query.personalEmail)) : req.body.personalEmail;
    // personalDetails.dob = (req.body.dob == undefined) ? ((req.query.dob == undefined ? null : new Date(req.body.dob))) : new Date(req.body.dob);
    // personalDetails.bloodGroup = (req.body.bloodGroup == undefined) ? ((req.query.bloodGroup == undefined ? null : req.query.bloodGroup)) : req.body.bloodGroup;
    // personalDetails.religion = req.body.religion;
    // personalDetails.nationality = req.body.nationality;
    // personalDetails.homePhone = req.body.homePhone;
    // personalDetails.motherName = req.body.motherName;
    // personalDetails.fatherName = req.body.fatherName;
    // personalDetails.maritialStatus = req.body.maritialStatus;
    // personalDetails.emergencyContactPerson = req.body.emergencyContactPerson;
    // personalDetails.emergencyContactNumber = req.body.emergencyContactNumber;
    // personalDetails.profileStatus = req.body.profileStatus;
    personalDetails.createdBy = 1;
    //personalDetails.createdBy =req.headers[emp_id];

    personalDetails.save(function(err, personalInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: personalInfoData
                }
            });
        }
        auditTrailEntry(personalDetails.emp_id, "personalDetails", personalDetails, "user", "personalDetails", "ADDED");
        return done(err, personalInfoData);   
    });
}

function updatePersonalInfoDetails(req, res, done) {
    let personalDetails = new PersonalInfo(req.body);
    // personalDetails.gender = (req.body.gender == undefined) ? ((req.query.gender == undefined ? null : req.query.gender)) : req.body.gender;
    // personalDetails.personalMobileNumber = (req.body.personalMobileNumber == undefined) ? ((req.query.personalMobileNumber == undefined ? null : req.query.personalMobileNumber)) : req.body.personalMobileNumber;
    // personalDetails.personalEmail = (req.body.personalEmail == undefined) ? ((req.query.personalEmail == undefined ? null : req.query.personalEmail)) : req.body.personalEmail;
    // personalDetails.dob = (req.body.dob == undefined) ? ((req.query.dob == undefined ? null : new Date(req.body.dob))) : new Date(req.body.dob);
    // personalDetails.bloodGroup = (req.body.bloodGroup == undefined) ? ((req.query.bloodGroup == undefined ? null : req.query.bloodGroup)) : req.body.bloodGroup;
    // personalDetails.religion = req.body.religion;
    // personalDetails.nationality = req.body.nationality;
    // personalDetails.homePhone = req.body.homePhone;
    // personalDetails.motherName = req.body.motherName;
    // personalDetails.fatherName = req.body.fatherName;
    // personalDetails.maritialStatus = req.body.maritialStatus;
    // personalDetails.emergencyContactPerson = req.body.emergencyContactPerson;
    // personalDetails.emergencyContactNumber = req.body.emergencyContactNumber;
    // personalDetails.profileStatus = req.body.profileStatus;
    personalDetails.updatedBy = 1;
    personalDetails.isCompleted = true;
    //personalDetails.updatedBy =req.headers[emp_id];

    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var personalInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    PersonalInfo.findOneAndUpdate(query, personalDetails, {
        new: true,
        projection: personalInfoProjection
    }, function(err, personalDetailsData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: personalDetailsData
                }
            });            
        }
        auditTrailEntry(personalDetails.emp_id, "personalDetails", personalDetails, "user", "personalDetails", "UPDATED");
        return done(err, personalDetailsData);
    });
}

function addAcademicInfoDetails(req, res, done) {
    let academicInfo = new AcademicInfo(req.body);
    academicInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // academicInfo.levelOfEducation = req.body.levelOfEducation;
    // academicInfo.examDegreeTitle = req.body.examDegreeTitle;
    // academicInfo.concentration = req.body.concentration;
    // academicInfo.instituteName = req.body.instituteName;
    // academicInfo.marks = req.body.marks;
    // academicInfo.result = req.body.result;
    // academicInfo.cgpa = req.body.cgpa;
    // academicInfo.scale = req.body.scale;
    // academicInfo.yearOfPassing = req.body.yearOfPassing;
    // academicInfo.duration = req.body.duration;
    // academicInfo.achievements = req.body.achievements;
    // academicInfo.isCompleted = true;
    academicInfo.createdBy = 1;

    //academicInfo.createdBy =req.headers[emp_id];

    academicInfo.save(function(err, academicInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: academicInfoData
                }
            });
        }           
        auditTrailEntry(academicInfo.emp_id, "academicInfo", academicInfo, "user", "academicInfo", "ADDED");
        return done(err, academicInfoData);
    });
}

function updateAcademicInfoDetails(req, res, done) {
    let academicInfo = new AcademicInfo(req.body);
    academicInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // academicInfo.levelOfEducation = req.body.levelOfEducation;
    // academicInfo.examDegreeTitle = req.body.examDegreeTitle;
    // academicInfo.concentration = req.body.concentration;
    // academicInfo.instituteName = req.body.instituteName;
    // academicInfo.marks = req.body.marks;
    // academicInfo.result = req.body.result;
    // academicInfo.cgpa = req.body.cgpa;
    // academicInfo.scale = req.body.scale;
    // academicInfo.yearOfPassing = req.body.yearOfPassing;
    // academicInfo.duration = req.body.duration;
    // academicInfo.achievements = req.body.achievements;
    // academicInfo.isCompleted = true;
    academicInfo.updatedBy = 1;

    //academicInfo.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var academicInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    AcademicInfo.findOneAndUpdate(query, academicInfo, {
        new: true,
        projection: academicInfoProjection
    }, function(err, academicInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: academicInfoData
                }
            });
        } 
        auditTrailEntry(academicInfo.emp_id, "academicInfo", academicInfo, "user", "academicInfo", "UPDATED");
        return done(err, academicInfoData);        
    });
}

function deleteAcademicInfoDetails(req, res, done) {
    let _id = req.body._id || req.query._id;

    let success = "Entry has been Deleted";
    var query = {
        _id: _id
    };
    AcademicInfo.deleteOne(query, function(err, academicInfoData) {
        if (err) {            
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: academicInfoData
                }
            });
        } 
        academicInfoData._id = _id;
        auditTrailEntry(1, "employeeacademicdetails", academicInfoData, "user", "deleteAcademicInfoDetails", "Deleted the Academic Info");
        return done(err, success);        
    });
}

function addPreviousEmploymentInfoDetails(req, res, done) {
    let previousEmploymentInfo = new PreviousEmploymentInfo(req.body);
    previousEmploymentInfo.emp_id = req.body.emp_id || req.query.emp_id;
    previousEmploymentInfo.isCompleted = true;
    previousEmploymentInfo.createdBy = 1;

    //previousEmploymentInfo.createdBy =req.headers[emp_id];

    previousEmploymentInfo.save(function(err, previousEmploymentInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: previousEmploymentInfoData
                }
            });
        }           
        auditTrailEntry(previousEmploymentInfo.emp_id, "previousEmploymentInfo", previousEmploymentInfo, "user", "previousEmploymentInfo", "ADDED");
        return done(err, previousEmploymentInfoData);
    });
}

function updatePreviousEmploymentInfoDetails(req, res, done) {
    let previousEmploymentInfo = new PreviousEmploymentInfo(req.body);
    previousEmploymentInfo.emp_id = req.body.emp_id || req.query.emp_id;
    previousEmploymentInfo.isCompleted = true;
    previousEmploymentInfo.updatedBy = 1;

    //previousEmploymentInfo.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var previousEmploymentInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    PreviousEmploymentInfo.findOneAndUpdate(query, previousEmploymentInfo, {
        new: true,
        projection: previousEmploymentInfoProjection
    }, function(err, previousEmploymentInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: previousEmploymentInfoData
                }
            });
        }          
        auditTrailEntry(previousEmploymentInfo.emp_id, "previousEmploymentInfo", previousEmploymentInfo, "user", "previousEmploymentInfo", "UPDATED");
        return done(err, previousEmploymentInfoData);
    });
}

function deletePreviousEmploymentInfoDetails(req, res, done) {
    let _id = req.body._id || req.query._id;

    let success = "Entry has been Deleted";
    var query = {
        _id: _id
    };
    PreviousEmploymentInfo.deleteOne(query, function(err, previousEmploymentInfoData) {
        if (err) {            
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: previousEmploymentInfoData
                }
            });
        } 
        previousEmploymentInfoData._id = _id;
        auditTrailEntry(1, "employeepreviousEmploymentdetails", previousEmploymentInfoData, "user", "deletePreviousEmploymentInfoDetails", "Deleted the PreviousEmployment Info");
        return done(err, success);        
    });
}

function addDocumentsInfoDetails(req, res, done) {
    let documents = new DocumentsInfo(req.body);
    documents.emp_id = req.body.emp_id || req.query.emp_id;
    // documents.nationalIdSmartCard = req.body.nationalIdSmartCard;
    // documents.nationalIdSmartCardDocURL = req.body.nationalIdSmartCardDocURL;
    // documents.passportNumber = req.body.passportNumber;
    // documents.passportNumberDocURL = req.body.passportNumberDocURL;
    // documents.birthRegistrationNumber = req.body.birthRegistrationNumber;
    // documents.birthRegistrationNumberDocURL = req.body.birthRegistrationNumberDocURL;
    // documents.nationalIDOldFormat = req.body.nationalIDOldFormat;
    // documents.nationalIDOldFormatDocURL = req.body.nationalIDOldFormatDocURL;
    documents.isCompleted = true;
    documents.createdBy = 1;

    //documents.createdBy =req.headers[emp_id];

    documents.save(function(err, documentsData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: documentsData
                }
            });
        }
        auditTrailEntry(documents.emp_id, "documents", documents, "user", "documents", "ADDED");
        return done(err, documentsData); 
    });
}

function updateDocumentsInfoDetails(req, res, done) {
    let documents = new DocumentsInfo(req.body);
    documents.emp_id = req.body.emp_id || req.query.emp_id;
    // documents.nationalIdSmartCard = req.body.nationalIdSmartCard;
    // documents.nationalIdSmartCardDocURL = req.body.nationalIdSmartCardDocURL;
    // documents.passportNumber = req.body.passportNumber;
    // documents.passportNumberDocURL = req.body.passportNumberDocURL;
    // documents.birthRegistrationNumber = req.body.birthRegistrationNumber;
    // documents.birthRegistrationNumberDocURL = req.body.birthRegistrationNumberDocURL;
    // documents.nationalIDOldFormat = req.body.nationalIDOldFormat;
    // documents.nationalIDOldFormatDocURL = req.body.nationalIDOldFormatDocURL;
    // documents.isCompleted = true;
    documents.updatedBy = 1;

    //documents.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var documentsProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    DocumentsInfo.findOneAndUpdate(query, documents, {
        new: true,
        projection: documentsProjection
    }, function(err, documentsData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: documentsData
                }
            });
        }
            auditTrailEntry(documents.emp_id, "documents", documents, "user", "documents", "UPDATED");
            return done(err, documentsData);
    });
}

function addFamilyInfoDetails(req, res, done) {
    let familyInfo = new FamilyInfo(req.body);
    familyInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // familyInfo.name = req.body.name;
    // familyInfo.relation_id = req.body.relation_id;
    // familyInfo.dateOfBirth = req.body.dateOfBirth;
    // familyInfo.contact = req.body.contact;
    // familyInfo.isCompleted = true;
    familyInfo.createdBy = 1;

    //familyInfo.createdBy =req.headers[emp_id];

    familyInfo.save(function(err, familyInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: familyInfoData
                }
            });
        }
            auditTrailEntry(familyInfo.emp_id, "familyInfo", familyInfo, "user", "familyInfo", "ADDED");
            return done(err, familyInfoData);
    });
}

function updateFamilyInfoDetails(req, res, done) {
    let familyInfo = new FamilyInfo(req.body);
    familyInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // familyInfo.name = req.body.name;
    // familyInfo.relation_id = req.body.relation_id;
    // familyInfo.dateOfBirth = req.body.dateOfBirth;
    // familyInfo.contact = req.body.contact;
    // familyInfo.isCompleted = true;
    familyInfo.updatedBy = 1;

    //familyInfo.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var familyInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    FamilyInfo.findOneAndUpdate(query, familyInfo, {
        new: true,
        projection: familyInfoProjection
    }, function(err, familyInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: familyInfoData
                }
            });
        }
            auditTrailEntry(familyInfo.emp_id, "familyInfo", familyInfo, "user", "familyInfo", "UPDATED");
            return done(err, familyInfoData);
        
    });
}

function deleteFamilyInfoDetails(req, res, done) {
    let _id = req.body._id || req.query._id;

    let success = "Entry has been Deleted";
    var query = {
        _id: _id
    };
    FamilyInfo.deleteOne(query, function(err, familyInfoData) {
        if (err) {            
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: familyInfoData
                }
            });
        } 
        familyInfoData._id = _id;
        auditTrailEntry(1, "employeefamilydetails", familyInfoData, "user", "deleteFamilyInfoDetails", "Deleted the Family Info");
        return done(err, success);        
    });
}

function addAddressInfoDetails(req, res, done) {
    let address = new AddressInfo(req.body);
    address.emp_id = req.body.emp_id || req.query.emp_id;

    // address.permanentAddressLine1 = req.body.permanentAddressLine1;
    // address.permanentAddressLine2 = req.body.permanentAddressLine2;
    // address.permanentAddressThana_id = req.body.permanentAddressThana_id;
    // address.permanentAddressDistrict_id = req.body.permanentAddressDistrict_id;
    // address.permanentAddressDivision_id = req.body.permanentAddressDivision_id;
    // address.permanentAddressPostCode = req.body.permanentAddressPostCode;

    // address.currentAddressLine1 = req.body.currentAddressLine1;
    // address.currentAddressLine2 = req.body.currentAddressLine2;
    // address.currentAddressThana_id = req.body.currentAddressThana_id;
    // address.currentAddressDistrict_id = req.body.currentAddressDistrict_id;
    // address.currentAddressDivision_id = req.body.currentAddressDivision_id;
    // address.currentAddressPostCode = req.body.currentAddressPostCode;

    // address.isSameAsCurrent = req.body.isSameAsCurrent;
    address.createdBy = 1;

    address.save(function(err, addressData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: addressData
                }
            });
        }            
        auditTrailEntry(address.emp_id, "address", address, "user", "address", "ADDED");
        return done(err, addressData);
    });
}

function updateAddressInfoDetails(req, res, done) {
    let address = new AddressInfo(req.body);
    address.emp_id = req.body.emp_id || req.query.emp_id;

    // address.permanentAddressLine1 = req.body.permanentAddressLine1;
    // address.permanentAddressLine2 = req.body.permanentAddressLine2;
    // address.permanentAddressThana_id = req.body.permanentAddressThana_id;
    // address.permanentAddressDistrict_id = req.body.permanentAddressDistrict_id;
    // address.permanentAddressDivision_id = req.body.permanentAddressDivision_id;
    // address.permanentAddressPostCode = req.body.permanentAddressPostCode;

    // address.currentAddressLine1 = req.body.currentAddressLine1;
    // address.currentAddressLine2 = req.body.currentAddressLine2;
    // address.currentAddressThana_id = req.body.currentAddressThana_id;
    // address.currentAddressDistrict_id = req.body.currentAddressDistrict_id;
    // address.currentAddressDivision_id = req.body.currentAddressDivision_id;
    // address.currentAddressPostCode = req.body.currentAddressPostCode;
    // address.isSameAsCurrent = req.body.isSameAsCurrent;
    address.updatedBy = 1;
    address.isCompleted = true;

    let _id = req.body._id;
    var query = {
        _id: _id,
        isActive: true
    }

    var addressInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    AddressInfo.findOneAndUpdate(query, address, {
        new: true,
        projection: addressInfoProjection
    }, function(err, addressData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: addressData
                }
            });
        }         
        auditTrailEntry(address.emp_id, "address", address, "user", "address", "UPDATED");
        return done(err, addressData);
    });
}

function addBankInfoDetails(req, res, done) {
    let bank = new BankInfo(req.body);
    bank.emp_id = req.body.emp_id || req.query.emp_id;
    // bank.bankName = req.body.bankName;
    // bank.accountName = req.body.accountName;
    // bank.accountNumber = req.body.accountNumber;
    // bank.currency = req.body.currency;
    // bank.modeOfPaymentType = req.body.modeOfPaymentType;
    // bank.isCompleted = true;
       bank.createdBy = 1;

    //bank.createdBy =req.headers[emp_id];

    bank.save(function(err, bankData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: bankData
                }
            });
        }

        auditTrailEntry(bank.emp_id, "bank", bank, "user", "bank", "ADDED");
         return done(err, bankData);
    });
}

function updateBankInfoDetails(req, res, done) {
    let bank = new BankInfo(req.body);
    bank.emp_id = req.body.emp_id || req.query.emp_id;
    // bank.bankName = req.body.bankName;
    // bank.accountName = req.body.accountName;
    // bank.accountNumber = req.body.accountNumber;
    // bank.currency = req.body.currency;
    // bank.modeOfPaymentType = req.body.modeOfPaymentType;
    // bank.emp_id = req.body.emp_id;
    // bank.isCompleted = true;
    bank.updatedBy = 1;

    //bank.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var bankProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    BankInfo.findOneAndUpdate(query, bank, {
        new: true,
        projection: bankProjection
    }, function(err, bankData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: bankData
                }
            });
        } 
            auditTrailEntry(bank.emp_id, "bank", bank, "user", "bank", "UPDATED");
            return done(err, bankData);
        });
}

function addSalaryInfoDetails(req, res, done) {
    let salaryInfo = new SalaryInfo(req.body);
    salaryInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // salaryInfo.basic = req.body.basic;
    // salaryInfo.hra = req.body.hra;
    // salaryInfo.conveyanceAllowance = req.body.conveyanceAllowance;
    // salaryInfo.lfa = req.body.lfa;
    // salaryInfo.medicalAllowance = req.body.medicalAllowance;
    // salaryInfo.specialAllowance = req.body.specialAllowance;
    // salaryInfo.grossSalary = req.body.grossSalary;
    // salaryInfo.lunchAllowance = req.body.lunchAllowance;
    // salaryInfo.mobileAllowance = req.body.mobileAllowance;
    // salaryInfo.otherAllowance = req.body.otherAllowance;
    // salaryInfo.totalEarnings = req.body.totalEarnings;
    // salaryInfo.festivalAllowance = req.body.festivalAllowance;
    // salaryInfo.providentFundMembership = req.body.providentFundMembership;
    // salaryInfo.groupLifeInsurance = req.body.groupLifeInsurance;
    // salaryInfo.hospitalizationScheme = req.body.hospitalizationScheme;
    // salaryInfo.isHike = req.body.isHike;
    // salaryInfo.isCompleted = true;
    salaryInfo.createdBy = 1;

    //salaryInfo.createdBy =req.headers[emp_id];

    salaryInfo.save(function(err, salaryInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: salaryInfoData
                }
            });
        }            
        auditTrailEntry(salaryInfo.emp_id, "salaryInfo", salaryInfo, "user", "salaryInfo", "ADDED");
        return done(err, salaryInfoData);
    });
}

function updateSalaryInfoDetails(req, res, done) {
    let salaryInfo = new SalaryInfo(req.body);
    salaryInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // salaryInfo.basic = req.body.basic;
    // salaryInfo.hra = req.body.hra;
    // salaryInfo.conveyanceAllowance = req.body.conveyanceAllowance;
    // salaryInfo.lfa = req.body.lfa;
    // salaryInfo.medicalAllowance = req.body.medicalAllowance;
    // salaryInfo.specialAllowance = req.body.specialAllowance;
    // salaryInfo.grossSalary = req.body.grossSalary;
    // salaryInfo.lunchAllowance = req.body.lunchAllowance;
    // salaryInfo.mobileAllowance = req.body.mobileAllowance;
    // salaryInfo.otherAllowance = req.body.otherAllowance;
    // salaryInfo.totalEarnings = req.body.totalEarnings;
    // salaryInfo.festivalAllowance = req.body.festivalAllowance;
    // salaryInfo.providentFundMembership = req.body.providentFundMembership;
    // salaryInfo.groupLifeInsurance = req.body.groupLifeInsurance;
    // salaryInfo.hospitalizationScheme = req.body.hospitalizationScheme;
    // salaryInfo.isHike = req.body.isHike;
    // salaryInfo.isCompleted = true;
    salaryInfo.updatedBy = 1;

    //salaryInfo.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isActive: true
    }

    var salaryInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    SalaryInfo.findOneAndUpdate(query, salaryInfo, {
        new: true,
        projection: salaryInfoProjection
    }, function(err, salaryInfoData) {
        if (err) {
            return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: salaryInfoData
            }
        });
        }        
        auditTrailEntry(salaryInfo.emp_id, "salaryInfo", salaryInfo, "user", "salaryInfo", "UPDATED");
        return done(err, salaryInfoData);
    });
}

function addCarInfoDetails(req, res, done) {
    let carInfo = new CarInfo(req.body);
    carInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // carInfo.companyRegistrationNumber = req.body.companyRegistrationNumber;
    // carInfo.companyEffectiveDate = req.body.companyEffectiveDate;
    // carInfo.companyExpiryDate = req.body.companyExpiryDate;
    // carInfo.companyFuelAllowance = req.body.companyFuelAllowance;
    // carInfo.companyMaintenanceAllowance = req.body.companyMaintenanceAllowance;
    // carInfo.companyDriverAllowance = req.body.companyDriverAllowance;
    // carInfo.companyGrossPay = req.body.companyGrossPay;
    // carInfo.privateRegistrationNumber = req.body.privateRegistrationNumber;
    // carInfo.privateEffectiveDate = req.body.privateEffectiveDate;
    // carInfo.privateExpiryDate = req.body.privateExpiryDate;
    // carInfo.privateCarUsageAllowance = req.body.privateCarUsageAllowance;
    // carInfo.isCompleted = true;
    carInfo.createdBy = 1;

    //carInfo.createdBy =req.headers[emp_id];

    carInfo.save(function(err, carInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: carInfoData
                }
            });
        }            
        auditTrailEntry(carInfo.emp_id, "carInfo", carInfo, "user", "carInfo", "ADDED");
         return done(err, carInfoData);
    });
}

function updateCarInfoDetails(req, res, done) {
    let carInfo = new CarInfo(req.body);
    carInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // carInfo.companyRegistrationNumber = req.body.companyRegistrationNumber;
    // carInfo.companyEffectiveDate = req.body.companyEffectiveDate;
    // carInfo.companyExpiryDate = req.body.companyExpiryDate;
    // carInfo.companyFuelAllowance = req.body.companyFuelAllowance;
    // carInfo.companyMaintenanceAllowance = req.body.companyMaintenanceAllowance;
    // carInfo.companyDriverAllowance = req.body.companyDriverAllowance;
    // carInfo.companyGrossPay = req.body.companyGrossPay;
    // carInfo.privateRegistrationNumber = req.body.privateRegistrationNumber;
    // carInfo.privateEffectiveDate = req.body.privateEffectiveDate;
    // carInfo.privateExpiryDate = req.body.privateExpiryDate;
    // carInfo.privateCarUsageAllowance = req.body.privateCarUsageAllowance;
    // carInfo.isCompleted = true;
    carInfo.updatedBy = 1;

    //carInfo.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var carInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    CarInfo.findOneAndUpdate(query, carInfo, {
        new: true,
        projection: carInfoProjection
    }, function(err, carInfoData) {
        if (err) {
            return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: carInfoData
            }
        });
        }       
        auditTrailEntry(carInfo.emp_id, "carInfo", carInfo, "user", "carInfo", "UPDATED");
         return done(err, carInfoData);
    });
}


function addCertificationInfoDetails(req, res, done) {
    let certificationInfo = new CertificationInfo(req.body);
    certificationInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // certificationInfo.certificationTitle = req.body.certificationTitle;
    // certificationInfo.location = req.body.location;
    // certificationInfo.institution = req.body.institution;
    // certificationInfo.duration = req.body.duration;
    // certificationInfo.topicsCovered = req.body.topicsCovered;
    // certificationInfo.isCompleted = true;
    certificationInfo.createdBy = 1;

    //certificationInfo.createdBy =req.headers[emp_id];

    certificationInfo.save(function(err, certificationInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: certificationInfoData
                }
            });
        }            
        auditTrailEntry(certificationInfo.emp_id, "certificationInfo", certificationInfo, "user", "certificationInfo", "ADDED");
        req.query.emp_id = certificationInfo.emp_id;
        getCertificationInfoDetails(req, res, done)
    });
}

function updateCertificationInfoDetails(req, res, done) {
    let certificationInfo = new CertificationInfo(req.body);
    certificationInfo.emp_id = req.body.emp_id || req.query.emp_id;
    // certificationInfo.certificationTitle = req.body.certificationTitle;
    // certificationInfo.location = req.body.location;
    // certificationInfo.institution = req.body.institution;
    // certificationInfo.duration = req.body.duration;
    // certificationInfo.topicsCovered = req.body.topicsCovered;
    // certificationInfo.isCompleted = true;
    certificationInfo.updatedBy = 1;

    //certificationInfo.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var certificationInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    CertificationInfo.findOneAndUpdate(query, certificationInfo, {
        new: true,
        projection: certificationInfoProjection
    }, function(err, certificationInfoData) {
        if (err) {
            return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: certificationInfoData
            }
        });
        }        
        auditTrailEntry(certificationInfo.emp_id, "certificationInfo", certificationInfo, "user", "certificationInfo", "UPDATED");
        return done(err, certificationInfoData);
    });
}
function deleteCertificationInfoDetails(req, res, done) {
    let _id = req.body._id || req.query._id;

    let success = "Entry has been Deleted";
    var query = {
        _id: _id
    };
    CertificationInfo.deleteOne(query, function(err, certificationInfoData) {
        if (err) {            
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: certificationInfoData
                }
            });
        } 
        certificationInfoData._id = _id;
        auditTrailEntry(1, "employeecertificationdetails", certificationInfoData, "user", "deleteCertificationInfoDetails", "Deleted the Certification Info");
        return done(err, success);        
    });
}


function addPerformanceRatingInfoDetails(req, res, done) {
    let performanceRatingInfo = new PerformanceRatingInfo(req.body);
    performanceRatingInfo.emp_id = req.body.emp_id || req.query.emp_id;

    performanceRatingInfo.isCompleted = true;
    performanceRatingInfo.createdBy = 1;

    //performanceRatingInfo.createdBy =req.headers[emp_id];

    performanceRatingInfo.save(function(err, performanceRatingInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: performanceRatingInfoData
                }
            });
        }           
        auditTrailEntry(performanceRatingInfo.emp_id, "performanceRatingInfo", performanceRatingInfo, "user", "performanceRatingInfo", "ADDED");
        return done(err, performanceRatingInfoData);
    });
}

function updatePerformanceRatingInfoDetails(req, res, done) {
    let performanceRatingInfo = new PerformanceRatingInfo(req.body);
    performanceRatingInfo.emp_id = req.body.emp_id || req.query.emp_id;

    performanceRatingInfo.isCompleted = true;
    performanceRatingInfo.updatedBy = 1;

    //performanceRatingInfo.updatedBy =req.headers[emp_id];
    let _id = req.body._id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var performanceRatingInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    PerformanceRatingInfo.findOneAndUpdate(query, performanceRatingInfo, {
        new: true,
        projection: performanceRatingInfoProjection
    }, function(err, performanceRatingInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: performanceRatingInfoData
                }
            });
        } 
        auditTrailEntry(performanceRatingInfo.emp_id, "performanceRatingInfo", performanceRatingInfo, "user", "performanceRatingInfo", "UPDATED");
        return done(err, performanceRatingInfoData);        
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
    notification.save(function(err, result) {
        if (result) {
            //Send Bussiness Hr Head
            if (notificationFlag == 0) {
                sendNotifications(emp, title, message, senderEmp_id, emp.businessHrHead_id, type_id, linkUrl);
                notificationFlag++;
            } else if (notificationFlag == 1) {
                sendNotifications(emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
                notificationFlag++;
            } else if (notificationFlag == 2) {
                sendNotifications(emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
                notificationFlag++;
            } else {
                return res.status(200).json({
                    message: "Success"
                });
            }
        } else {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        }
    });
}

function auditTrailEntry(emp_id, collectionName, collectionDocument, controllerName, action, comments) {
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
function addEmpRoles(i, req, res, emp) {
    let empRole = new EmployeeRoles();
    empRole.emp_id = emp._id;
    empRole.role_id = req.body.roles[i];
    empRole.save(function(err, roleDaata) {
        auditTrailEntry(emp._id, "user", empRole, "addEmpRole", "Role added for the Employee");
        if ((i + 1) < req.body.roles.length) {
            addEmpRoles(i + 1, req, res, emp);
        }
    });
}

function sendWelComeEmail(emp, toemail) {
    let options = {
        viewPath: config.paths.emailPath,
        extName: '.hbs'
    };
    let transporter = nodemailer.createTransport({
        host: process.env.EmailHost,
        secure: false,
        auth: {
            user: process.env.EmailUser,
            pass: process.env.EmailPassword
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    transporter.use('compile', hbs(options));

    let mailOptions = {
        from: config.email.welcome.from, // sender address
        to: toemail,
        subject: config.email.welcome.subject, // Subject line
        template: 'email-welcome',
        context: {
            fullName: emp.fullName,
            userName: emp.userName,
            token: emp.resetPasswordToken,
            uid: uuidV1()
        }
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions);
}

function addOfficeInfoDetails(req, res, done) {

    let officeEmpDetails = new OfficeInfo(req.body);
    officeEmpDetails.emp_id = req.body.emp_id;
    // officeEmpDetails.employmentStatus_id = req.body.employmentStatus_id;
    // officeEmpDetails.managementType_id = req.body.managementType_id;
    // officeEmpDetails.jobTitle = req.body.jobTitle;
    // officeEmpDetails.idCardNumber = req.body.idCardNumber;

    // //officeEmpDetails.designation = req.body.designation;
    // officeEmpDetails.division_id = req.body.division_id;
    // officeEmpDetails.department_id = req.body.department_id;
    // officeEmpDetails.vertical_id = req.body.vertical_id;
    // officeEmpDetails.subVertical_id = req.body.subVertical_id;
    // officeEmpDetails.hrspoc_id = req.body.hrspoc_id;
    // officeEmpDetails.businessHrHead_id = req.body.businessHrHead_id;
    // officeEmpDetails.groupHrHead_id = req.body.groupHrHead_id;
    officeEmpDetails.createdBy = 1;

    officeEmpDetails.save(function(err, officeDetailsData) {
        if (officeDetailsData) {
            auditTrailEntry(officeEmpDetails.emp_id, "officeDetails", officeEmpDetails, "user", "addOfficeDetails", "Office ");
            return done(err, officeDetailsData);
        }
        return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: officeDetailsData
            }
        });
    });
}

function updateofficeInfoDetails(req, res) {
    let _id = req.body._id;
    let emp_id=req.body.emp_id;
    var query = {
        _id: emp_id,
        isDeleted: false
    }

    var queryUpdate={};
    queryUpdate={ $set: { updatedBy:1, fullName: req.body.fullName }};
    EmployeeInfo.findOneAndUpdate(query, queryUpdate,
        function(err,employeeData)
        {
           if(employeeData)
           {
                query = {
                    _id: _id,
                    isDeleted: false
                }
                queryUpdate=   {$set:{
                        "idCardNumber" : req.body.idCardNumber,
                        "officeEmail": req.body.officeEmail,
                        "officePhone" : req.body.officePhone,
                        "officeMobile" : req.body.officeMobile,
                        "facility" : req.body.facility,
                        "city" : req.body.city,
                        "country" : req.body.country,
                        "costCentre" : req.body.costCentre,
                        "dateOfJoining" : req.body.dateOfJoining,
                        "dateOfConfirmation" : req.body.dateOfConfirmation,
                        "workPermitNumber" : req.body.workPermitNumber,
                        "workPermitEffectiveDate" : req.body.workPermitEffectiveDate,
                        "workPermitExpiryDate" : req.body.workPermitExpiryDate,
                        "updatedBy":1,
                        "isCompleted": true
                }};
                OfficeInfo.findOneAndUpdate(query, queryUpdate, function(err, officeDetailsData) {
                    if (officeDetailsData)
                    { 
                        req.query.emp_id= req.body.emp_id;
                        return getOfficeInfoDetails(req,res);
                    } 
                    else 
                    {
                        return res.status(403).json({
                            title: 'There was a problem',
                            error: {
                                message: err
                            },
                            result: {
                                message: officeDetailsData
                            }
                        });
                    }
                });
           }
           else {
                return res.status(403).json({
                    title: 'There was a problem',
                    error: {
                        message: err
                    },
                    result: {
                        message: officeDetailsData
                    }
                });
           }
        }
    )
}

function updatepositionInfoDetails(req, res) {
    let _id = req.body.emp_id;
    var query = {
        _id: _id,
        isDeleted: false
    }

    var queryUpdate={};
    queryUpdate={ $set: { updatedBy:1,
                          employmentType_id: req.body.employmentType_id,
                          designation_id : req.body.designation_id,
                          company_id :req.body.company_id,
                          grade_id : req.body.grade_id
                 }};
    EmployeeInfo.findOneAndUpdate(query,  queryUpdate,function(err,employeeData)
    {
           if(employeeData)
           {

                query = {
                    _id: req.body._id,
                    isDeleted: false
                }
                queryUpdate=   {$set:{
                    "division_id" :req.body.division_id,
                    "department_id" :req.body.department_id,
                    "vertical_id" :req.body.vertical_id,
                    "subVertical_id" : req.body.subVertical_id,
                    "managementType_id" : req.body.managementType_id,
                    "tenureOfContract" :req.body.tenureOfContract, 
                    "groupHrHead_id" : req.body.groupHrHead_id,
                    "businessHrHead_id" :req.body.businessHrHead_id,
                    "jobTitle" :req.body.jobTitle,
                    "hrspoc_id" :req.body.hrspoc_id
                }};
                OfficeInfo.findOneAndUpdate(query, queryUpdate, function(err, officeDetailsData) {
                    if (officeDetailsData)
                    { 
                        query = {
                            _id:req.body.supervisor_Id,
                            isActive: true
                        }
                        queryUpdate={$set:{
                            "emp_id" :req.body.emp_id,
                            "primarySupervisorEmp_id" :req.body.primarySupervisorEmp_id,
                        }}
                        SupervisorInfo.findOneAndUpdate(query, queryUpdate, function(err, supervisorData) {
                            if(supervisorData)
                            {
                               req.query.emp_id=req.body.emp_id;
                               return getPositionInfoDetails(req,res);
                            }
                            else 
                            {
                                return res.status(403).json({
                                    title: 'There was a problem',
                                    error: {
                                        message: err
                                    },
                                    result: {
                                        message: supervisorData
                                    }
                                });
                            }
                        });
                    } 
                    else 
                    {
                        return res.status(403).json({
                            title: 'There was a problem',
                            error: {
                                message: err
                            },
                            result: {
                                message: officeDetailsData
                            }
                        });
                    }
                });
           }
           else {
                return res.status(403).json({
                    title: 'There was a problem',
                    error: {
                        message: err
                    },
                    result: {
                        message: employeeData
                    }
                });
           }
    });
}

function addSupervisorDetails(req, res, done) {
    let supervisorDetails = new SupervisorInfo();
    supervisorDetails.emp_id = req.body.emp_id;
    supervisorDetails.primarySupervisorEmp_id = req.body.primarySupervisorEmp_id;
    supervisorDetails.createdBy = 1;

    supervisorDetails.save(function(err, supervisorDetailsData) {
        if (supervisorDetailsData) {
            auditTrailEntry(supervisorDetails.emp_id, "supervisorDetails", supervisorDetails, "user", "addsupervisorDetails", "ADDED");
            return done(err, supervisorDetailsData);
        }
        return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: supervisorDetailsData
            }
        });

    })
}

function updateSupervisorDetails(req, res, done) {
    let supervisorDetails = new SupervisorInfo();
    supervisorDetails.emp_id = req.body.emp_id;
    supervisorDetails.primarySupervisorEmp_id = req.body.primarySupervisorEmp_id;
    supervisorDetails.createdBy = 1;

    // SupervisorInfo.save(function (err, supervisorDetailsData) {
    //   if(supervisorDetailsData)
    //   {
    //     auditTrailEntry(supervisorDetails.emp_id,"supervisorDetails",supervisorDetails,"user","addsupervisorDetails","ADDED");
    //     return done(err,supervisorDetailsData);
    //   }
    //   return res.status(403).json({
    //     title: 'There was a problem',
    //     error: {message: err},
    //     result: {message: supervisorDetailsData}
    //   });

    // })
}

function getPersonalInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var personalInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    PersonalInfo.findOne(query, personalInfoProjection, function(err, personalEmpDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(personalEmpDetails);
    });
}

function getAddressInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isActive: true
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isActive: true
        };
    }
    var addressInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    AddressInfo.findOne(query, addressInfoProjection, function(err, addressDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(addressDetails);
    });
}

function getDocumentsInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var documentProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    DocumentsInfo.findOne(query, documentProjection, function(err, documentsData) {
        if (documentsData) {
            return res.status(200).json(documentsData);
        }
        return res.status(403).json({
            title: 'There was an error, please try again later',
            error: err,
            result: {
                message: documentsData
            }
        });
    });
}

function getAcademicnfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var academicProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    AcademicInfo.find(query, academicProjection, function(err, academicInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json({
            'data': academicInfoData
        });
    });
}

function getCertificationInfoDetails(req, res, done) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var certificationAndTraniningProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    CertificationInfo.find(query, certificationAndTraniningProjection, function(err, certificationDetailsData) {
        if (certificationDetailsData) {
            return done(err, certificationDetailsData);
        }
        return res.status(403).json({
            title: 'There was an error, please try again later',
            error: err,
            result: {
                message: certificationDetailsData
            }
        });
    });
}

function getPreviousEmploymentInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var previousEmploymentInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    PreviousEmploymentInfo.find(query, previousEmploymentInfoProjection, function(err, previousEmploymentData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: previousEmploymentData
                }
            });
        }
        return res.status(200).json({"data":previousEmploymentData});
    });
}

function getFamilyInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };

    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var familyInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    FamilyInfo.find(query, familyInfoProjection, function(err, familyInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: familyInfoData
                }
            });
        }
        
        return res.status(200).json({"data":familyInfoData});
    });
}

function getOfficeInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    OfficeInfo.aggregate([
        {
              "$lookup": {
                  "from": "employeedetails",
                  "localField": "emp_id",
                  "foreignField": "_id",
                  "as": "employees"
              }
        },
        { "$match": { "emp_id":parseInt(emp_id),"isDeleted":false,"employees.isDeleted":false} },  
      ])
      .exec(function(err, results){
       if(err)
       {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: results
                }
            });
       }
       else{
           let officeInfoData={};
           if(results.length > 0)
           {
                officeInfoData = {
                    _id : results[0]._id,
                    emp_id: results[0].employees[0]._id,
                    fullName : results[0].employees[0].fullName,
                    userName : results[0].employees[0].userName,
                    idCardNumber : results[0].idCardNumber,
                    officeEmail: results[0].officeEmail,
                    officePhone : results[0].officePhone,
                    officeMobile : results[0].officeMobile,
                    facility : results[0].facility,
                    city : results[0].city,
                    country : results[0].country,
                    costCentre : results[0].costCentre,
                    dateOfJoining :results[0].dateOfJoining ? new Date(results[0].dateOfJoining):null,
                    dateOfConfirmation :results[0].dateOfConfirmation ? new Date(results[0].dateOfJoining):null,
                    workPermitNumber : results[0].workPermitNumber,
                    workPermitEffectiveDate :results[0].workPermitEffectiveDate ? new Date(results[0].workPermitEffectiveDate):null,
                    workPermitExpiryDate :results[0].workPermitExpiryDate ? new Date(results[0].workPermitEffectiveDate):null,
                }; 
           }
           return res.status(200).json(officeInfoData);
       }
      });
}


function getPositionInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    OfficeInfo.aggregate([
        {
              "$lookup": {
                  "from": "employeedetails",
                  "localField": "emp_id",
                  "foreignField": "_id",
                  "as": "employees"
              }
        },
        {
            "$lookup": {
                "from": "employeesupervisordetails",
                "localField": "emp_id",
                "foreignField": "emp_id",
                "as": "supervisor"
            }
        },
        {"$match": { "emp_id":parseInt(emp_id),"isDeleted":false,"employees.isDeleted":false,"supervisor.isActive":true} } 
       
      ])
      .exec(function(err, results){
        if(err)
        {
             return res.status(403).json({
                 title: 'There was an error, please try again later',
                 error: err,
                 result: {
                     message: results
                 }
             });
        }
        else{
            let positionInfoData={};
            if(results.length > 0)
            {
                positionInfoData=  {
                    _id :  results[0]._id,
                    emp_id:results[0].employees[0]._id,
                    company_id:  results[0].employees[0].company_id,
                    division_id : results[0].division_id,
                    department_id : results[0].department_id,
                    vertical_id : results[0].vertical_id,
                    subVertical_id :  results[0].subVertical_id,
                    managementType_id :  results[0].managementType_id,
                    tenureOfContract : results[0].tenureOfContract, 
                    groupHrHead_id :  results[0].groupHrHead_id,
                    businessHrHead_id : results[0].businessHrHead_id,
                    employmentType_id :  results[0].employees[0].employmentType_id,
                    employmentStatus_id :results[0].employmentStatus_id, 
                    grade_id :  results[0].employees[0].grade_id,
                    designation_id : results[0].employees[0].designation_id,
                    jobTitle :results[0].jobTitle,
                    hrspoc_id : results[0].hrspoc_id,
                    primarySupervisorEmp_id:parseInt(results[0].supervisor[0].primarySupervisorEmp_id),
                    supervisor_Id:parseInt(results[0].supervisor[0]._id),
                    isCompleted : results[0].isCompleted
                  }
            }
            return res.status(200).json(positionInfoData);
        }
      })
}

function getPerformanceRatingInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var performanceRatingProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    PerformanceRatingInfo.find(query, function(err, performanceRatingProjection) {
        if (performanceRatingProjection) {
            return res.status(200).json(performanceRatingProjection);
        }
        return res.status(403).json({
            title: 'There was an error, please try again later',
            error: err,
            result: {
                message: performanceRatingProjection
            }
        });
    });
}

function getBankInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var bankDetailsProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    BankInfo.findOne(query, bankDetailsProjection, function(err, bankDetailsData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: bankDetailsData
                }
            });
        }
        return res.status(200).json(bankDetailsData);
     
    });
}

function getSalaryInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isActive: true
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isActive: true
        };
    }
    var salaryDetailsProjection = {
        createdAt: false,
        updatedAt: false,
        isActive: false,
        updatedBy: false,
        createdBy: false,
    };
    SalaryInfo.findOne(query, salaryDetailsProjection, function(err, salaryDetailsData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: salaryDetailsData
                }
            });
        }
        return res.status(200).json(salaryDetailsData);
    });
}

function getCarInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let query = {
        isDeleted: false
    };
    if (emp_id) {
        query = {
            emp_id: emp_id,
            isDeleted: false
        };
    }
    var carInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    CarInfo.findOne(query, carInfoProjection, function(err, carDetailsData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: carDetailsData
                }
            });
        }
        return res.status(200).json(carDetailsData);
    });
}

let functions = {
    addEmployee: (req, res) => {
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    let token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                let emp = new EmployeeInfo();

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

                emp.save(req, function(err, result) {
                    if (result) {
                        req.body.roles=[5];
                        auditTrailEntry(emp._id, "employee", emp, "user", "addEmployee", "Employee Added");
                        addEmpRoles(0, req, res, emp);
                        req.body.emp_id = emp._id;
                        sendWelComeEmail(emp, req.body.personalEmail);
                        async.parallel([
                                function(done) {
                                    addOfficeInfoDetails(req, res, done)
                                },
                                function(done) {
                                    addSupervisorDetails(req, res, done)
                                },
                                function(done) {
                                    addPersonalInfoDetails(req, res, done)
                                }
                            ],
                            function(done) {
                                //let dataToSend = [{"userName" : emp.userName}];
                                return res.status(200).json({
                                    "userName": emp.userName
                                });
                            });
                    } else {
                        return res.status(403).json({
                            title: 'There was a problem',
                            error: {
                                message: err
                            },
                            result: {
                                message: result
                            }
                        });
                    }
                });
            }
        ]);
    },
    getAllEmployee(req, res)
    {
        let query = {
            isDeleted: false
        };
        var EmployeeInfoProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false,
        };
        EmployeeInfo.find(query, EmployeeInfoProjection, function(err, employeeDetailsData) {
            if (err) {
                return res.status(403).json({
                    title: 'There was an error, please try again later',
                    error: err,
                    result: {
                        message: employeeDetailsData
                    }
                });
            }

            return res.status(200).json({"data":employeeDetailsData});
        });
    },
    getPersonalInfo: (req, res) => {
        getPersonalInfoDetails(req, res);
    },
    getAddressInfo: (req, res) => {
        getAddressInfoDetails(req, res);
    },
    getDocumentsInfo: (req, res) => {
        getDocumentsInfoDetails(req, res);
    },
    getAcademicInfo: (req, res) => {
        getAcademicnfoDetails(req, res);
    },
    getCertificationInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getCertificationInfoDetails(req, res, done);
            },
            function(certificationDetailsData, done) {
                return res.status(200).json({
                    "data": certificationDetailsData
                });
            }
        ]);
    },
    getPreviousEmploymentInfo: (req, res) => {
        getPreviousEmploymentInfoDetails(req, res);
    },
    getFamilyInfo: (req, res) => {
        getFamilyInfoDetails(req, res);
    },
    getOfficeInfo: (req, res) => {
        getOfficeInfoDetails(req, res)
    },
    getPositionInfo: (req, res) => {
        getPositionInfoDetails(req, res)
    },
    getPerformanceRatingInfo: (req, res) => {
        getPerformanceRatingInfoDetails(req, res);
    },
    getBankInfo: (req, res) => {
        getBankInfoDetails(req, res);
    },
    getSalaryInfo: (req, res) => {
        getSalaryInfoDetails(req, res);
    },
    getCarInfo: (req, res) => {
        getCarInfoDetails(req, res);
    },

    addPersonalInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addPersonalInfoDetails(req, res, done);
            },
            function(personalDetailsData, done) {
                return res.status(200).json(personalDetailsData);
            }
        ]);
    },
    updatePersonalInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updatePersonalInfoDetails(req, res, done);
            },
            function(personalDetailsData, done) {
                return res.status(200).json(personalDetailsData);
            }
        ]);
    },

    addAcademicInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addAcademicInfoDetails(req, res, done);
            },
            function(academicInfoData, done) {
                return res.status(200).json(academicInfoData);
            }
        ]);
    },

    updateAcademicInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateAcademicInfoDetails(req, res, done);
            },
            function(academicInfoData, done) {
                return res.status(200).json(academicInfoData);
            }
        ]);
    },
    deleteAcademicInfo: (req, res) => {
        async.waterfall([
            function(done) {
                deleteAcademicInfoDetails(req, res, done);
            },
            function(academicInfoData, done) {
                return res.status(200).json(academicInfoData);
            }
        ]);
    },

    addPreviousEmploymentInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addPreviousEmploymentInfoDetails(req, res, done);
            },
            function(previousEmploymentInfoData, done) {
                return res.status(200).json(previousEmploymentInfoData);
            }
        ]);
    },

    updatePreviousEmploymentInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updatePreviousEmploymentInfoDetails(req, res, done);
            },
            function(previousEmploymentInfoData, done) {
                return res.status(200).json(previousEmploymentInfoData);
            }
        ]);
    },
    deletePreviousEmploymentInfo: (req, res) => {
        async.waterfall([
            function(done) {
                deletePreviousEmploymentInfoDetails(req, res, done);
            },
            function(previousEmploymentInfoData, done) {
                return res.status(200).json(previousEmploymentInfoData);
            }
        ]);
    },

    addDocumentsInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addDocumentsInfoDetails(req, res, done);
            },
            function(documentsData, done) {
                return res.status(200).json(documentsData);
            }
        ]);
    },

    updateDocumentsInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateDocumentsInfoDetails(req, res, done);
            },
            function(documentsData, done) {
                return res.status(200).json(documentsData);
            }
        ]);
    },

    addFamilyInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addFamilyInfoDetails(req, res, done);
            },
            function(familyInfoData, done) {
                return res.status(200).json(familyInfoData);
            }
        ]);
    },
    updateFamilyInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateFamilyInfoDetails(req, res, done);
            },
            function(familyInfoData, done) {
                return res.status(200).json(familyInfoData);
            }
        ]);
    },
    deleteFamilyInfo: (req, res) => {
        async.waterfall([
            function(done) {
                deleteFamilyInfoDetails(req, res, done);
            },
            function(familyInfoData, done) {
                return res.status(200).json(familyInfoData);
            }
        ]);
    },

    addAddressInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addAddressInfoDetails(req, res, done);
            },
            function(addressDetailsData, done) {
                return res.status(200).json(addressDetailsData);
            }
        ]);
    },
    updateAddressInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateAddressInfoDetails(req, res, done);
            },
            function(addressDetailsData, done) {
                return res.status(200).json(addressDetailsData);
            }
        ]);
    },
    addOfficeInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addOfficeInfoDetails(req, res, done);
            },
            function(officeInfoDetailsData, done) {
                return res.status(200).json(officeInfoDetailsData);
            }
        ]);
    },
    addBankInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addBankInfoDetails(req, res, done);
            },
            function(bankData, done) {
                return res.status(200).json(bankData);
            }
        ]);
    },

    updateBankInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateBankInfoDetails(req, res, done);
            },
            function(bankData, done) {
                return res.status(200).json(bankData);
            }
        ]);
    },

    addSalaryInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addSalaryInfoDetails(req, res, done);
            },
            function(salaryInfoData, done) {
                return res.status(200).json(salaryInfoData);
            }
        ]);
    },

    updateSalaryInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateSalaryInfoDetails(req, res, done);
            },
            function(salaryInfoData, done) {
                return res.status(200).json(salaryInfoData);
            }
        ]);
    },

    addCarInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addCarInfoDetails(req, res, done);
            },
            function(carInfoData, done) {
                return res.status(200).json(carInfoData);
            }
        ]);
    },

    updateCarInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateCarInfoDetails(req, res, done);
            },
            function(carInfoData, done) {
                return res.status(200).json(carInfoData);
            }
        ]);
    },


    addCertificationInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addCertificationInfoDetails(req, res, done);
            },
            function(certificationInfoData, done) {
                return res.status(200).json(certificationInfoData);
            }
        ]);
    },

    updateCertificationInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateCertificationInfoDetails(req, res, done);
            },
            function(certificationInfoData, done) {
                return res.status(200).json(certificationInfoData);
            }
        ]);
    },

    deleteCertificationInfo: (req, res) => {
        async.waterfall([
            function(done) {
                deleteCertificationInfoDetails(req, res, done);
            },
            function(certificationInfoData, done) {
                return res.status(200).json(certificationInfoData);
            }
        ]);
    },

    addPerformanceRatingInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addPerformanceRatingInfoDetails(req, res, done);
            },
            function(performanceRatingInfoData, done) {
                return res.status(200).json(performanceRatingInfoData);
            }
        ]);
    },

    updatePerformanceRatingInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updatePerformanceRatingInfoDetails(req, res, done);
            },
            function(performanceRatingInfoData, done) {
                return res.status(200).json(performanceRatingInfoData);
            }
        ]);
    },

    updateOfficeInfo:(req, res)=>
    {
        updateofficeInfoDetails(req,res);
    },
    updatePositionInfo:(req, res)=>
    {
       updatepositionInfoDetails(req, res);
    },

    // Change User Password via Front End (not via email)
    changePassword: (req, res) => {
        let userId = req.user._id;
        User.findById(userId, function(err, user) {
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
                    error: {
                        message: 'You do not have access rights'
                    }
                });
            } else {
                user.comparePassword(req.body.currentPassword, (err, isMatch) => {
                    if (err) {
                        return res.status(403).json({
                            title: 'There was a problem',
                            error: {
                                message: 'Your current password is wrong!'
                            }
                        });
                    }
                    if (!isMatch) {
                        return res.status(403).json({
                            title: 'There was a problem',
                            error: {
                                message: 'Your current password is wrong!'
                            }
                        });
                    }
                    if (isMatch) {
                        let newPassword = req.body.newPassword;
                        user.set('password', newPassword);
                        user.save((err) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).json({
                                    err: {
                                        message: 'There was an error, please try again'
                                    }
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
