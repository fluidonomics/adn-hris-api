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
    ProfileProcessInfo = require('../models/employee/employeeProfileProcessDetails.model'),
    config            = require('../config/config'),
    crypto            = require('crypto'),
    async             = require('async'),
    nodemailer        = require('nodemailer'),
    hbs               = require('nodemailer-express-handlebars'),
    sgTransport       = require('nodemailer-sendgrid-transport'),
    uploadCtrl=         require('./upload.controller'),
    uuidV1            = require('uuid/v1');
    require('dotenv').load()


function addPersonalInfoDetails(req, res, done) {
    let personalDetails = new PersonalInfo(req.body);
    personalDetails.emp_id = req.body.emp_id || req.query.emp_id;
    personalDetails.isCompleted = true;
    personalDetails.createdBy = parseInt(req.headers.uid);
    //personalDetails.createdBy = 0;
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
    personalDetails.updatedBy =  parseInt(req.headers.uid);
    personalDetails.isCompleted = true;

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
    academicInfo.isCompleted = true;
    academicInfo.createdBy = parseInt(req.headers.uid);

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
    academicInfo.isCompleted = true;
    academicInfo.updatedBy = parseInt(req.headers.uid);

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
       // createdBy: false,
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

function addProfileProcessInfoDetails(req, res, done) {
    let profileProcessInfo = new ProfileProcessInfo(req.body);
    profileProcessInfo.emp_id = req.body.emp_id || req.query.emp_id;
    profileProcessInfo.createdBy = parseInt(req.headers.uid);
    //profileProcessInfo.createdBy = 0;
    profileProcessInfo.save(function(err, profileProcessInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: profileProcessInfoData
                }
            });
        }           
        auditTrailEntry(profileProcessInfo.emp_id, "profileProcessInfo", profileProcessInfo, "user", "profileProcessInfo", "ADDED");
        return done(err, profileProcessInfoData);
    });
}

function updateProfileProcessInfoDetails(req, res, done) {
    let profileProcessInfo = new ProfileProcessInfo(req.body);
    profileProcessInfo.emp_id = req.body.emp_id || req.query.emp_id;
    profileProcessInfo.updatedBy = parseInt(req.headers.uid);

    let _id = req.body._id;
    var query = {
        _id: _id,
        isActive: true
    }

    var profileProcessInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        //createdBy: true,
    };

    ProfileProcessInfo.findOneAndUpdate(query, profileProcessInfo, {
        new: true,
        projection: profileProcessInfoProjection
    }, function(err, profileProcessData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: profileProcessData
                }
            });
        } 
        auditTrailEntry(profileProcessInfo.emp_id, "profileProcessInfo", profileProcessInfo, "user", "profileProcessInfo", "UPDATED");
        let profileProcess={
            "_id":profileProcessData._id,
            "emp_id":profileProcessData.emp_id,
            "supervisorStatus": profileProcessData.supervisorStatus,
            "hrStatus": profileProcessData.hrStatus,
            "employeeStatus": profileProcessData.employeeStatus,
            "hrSupervisorSendbackComment":profileProcessData.hrSupervisorSendbackComment,
            "hrSendbackComment":profileProcessData.hrSendbackComment,
            "isEmployeeSubmitted":profileProcessData.employeeStatus== 'Submitted'? true:false,
            "isHrSubmitted":profileProcessData.hrStatus== 'Submitted'? true:false,
            "isHrSendBack":profileProcessData.hrStatus== 'SendBack'? true:false,
            "isSupervisorApproved":profileProcessData.supervisorStatus== 'Approved'? true:false,
            "isSupervisorSendBack":profileProcessData.supervisorStatus== 'SendBack'? true:false,
            "createdBy":profileProcessData.createdBy
        } 
        return done(err, profileProcess);        
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
    previousEmploymentInfo.createdBy = parseInt(req.headers.uid);

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
    previousEmploymentInfo.updatedBy = parseInt(req.headers.uid);

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

function deleteAndRenameDocument (req, res, done)
{
    if(req.body.birthRegistrationNumberDocURL && req.body.birthRegistrationNumberDocURL.split('/')[0]=='tmp' )
    {
        uploadCtrl.copyAndMoveImage(req.body.birthRegistrationNumberDocURL,'document/');
        req.body.birthRegistrationNumberDocURL= req.body.birthRegistrationNumberDocURL.replace('tmp','document')
    }
    if(req.body.nationalIDOldFormatDocURL && req.body.nationalIDOldFormatDocURL.split('/')[0]=='tmp' )
    {
        uploadCtrl.copyAndMoveImage(req.body.nationalIDOldFormatDocURL,'document/');
        req.body.nationalIDOldFormatDocURL=req.body.nationalIDOldFormatDocURL.replace('tmp','document')
    }
    if(req.body.nationalIdSmartCardDocURL && req.body.nationalIdSmartCardDocURL.split('/')[0]=='tmp' )
    {
        uploadCtrl.copyAndMoveImage(req.body.nationalIdSmartCardDocURL,'document/');
        req.body.nationalIdSmartCardDocURL=req.body.nationalIdSmartCardDocURL.replace('tmp','document')
    }
    if(req.body.passportNumberDocURL && req.body.passportNumberDocURL.split('/')[0]=='tmp' )
    {
        uploadCtrl.copyAndMoveImage(req.body.passportNumberDocURL,'document/');
        req.body.passportNumberDocURL=req.body.passportNumberDocURL.replace('tmp','document')
    }
    return done(null, req);     
}

function addDocumentsInfoDetails(req, res, done) {
    async.waterfall([
        function(callback) {
           deleteAndRenameDocument(req, res, callback)
        },
        function(req, callback) {
            let documents = new DocumentsInfo(req.body);
            documents.emp_id = req.body.emp_id || req.query.emp_id;
            documents.isCompleted = true;
            documents.createdBy = parseInt(req.headers.uid);

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
    ]);
}

function updateDocumentsInfoDetails(req, res, done) {
    async.waterfall([
        function(callback) {
          deleteAndRenameDocument(req, res, callback)
        },
        function(req, callback) {
            let documents = new DocumentsInfo(req.body);
            documents.emp_id = req.body.emp_id || req.query.emp_id;
            documents.isCompleted = true;
            documents.updatedBy = parseInt(req.headers.uid);
        
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
    ]);
}

function addFamilyInfoDetails(req, res, done) {
    let familyInfo = new FamilyInfo(req.body);
    familyInfo.emp_id = req.body.emp_id || req.query.emp_id;
    familyInfo.isCompleted = true;
    familyInfo.createdBy = parseInt(req.headers.uid);
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
    familyInfo.isCompleted = true;
    familyInfo.updatedBy = parseInt(req.headers.uid);

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
        //createdBy: false,
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
    address.createdBy = parseInt(req.headers.uid);
    address.isCompleted = true;

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
    address.updatedBy = parseInt(req.headers.uid);
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
       // createdBy: false,
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
    bank.isCompleted = true;
    bank.createdBy = parseInt(req.headers.uid);


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
    bank.isCompleted = true;
    bank.updatedBy = parseInt(req.headers.uid);

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

function addSalaryInfoDetailsWithUpdate(req, res, done) {
    let emp_id=parseInt(req.body.emp_id || req.query.emp_id);
    SalaryInfo.updateMany({emp_id:emp_id}, { $set: { isActive: false } },function(err,salaryUpdate)
    { 
        if(err)
        {
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
        else{
            addSalaryInfoDetails(req, res, done);            
            // let salaryInfo = new SalaryInfo(req.body);
            // salaryInfo.emp_id = req.body.emp_id || req.query.emp_id;
            // salaryInfo.isCompleted = true;
            // salaryInfo.createdBy = parseInt(req.headers.uid);
            // salaryInfo.save(function(err, salaryInfoData) {
            //     if (err) {
            //         return res.status(403).json({
            //             title: 'There was a problem',
            //             error: {
            //                 message: err
            //             },
            //             result: {
            //                 message: salaryInfoData
            //             }
            //         });
            //     }            
            //     auditTrailEntry(salaryInfo.emp_id, "salaryInfo", salaryInfo, "user", "salaryInfo", "ADDED");
            //     return done(err, salaryInfoData);
            // });
       }
    })
}

function addSalaryInfoDetails(req, res, done) {
    let emp_id=parseInt(req.body.emp_id || req.query.emp_id);
    let salaryInfo = new SalaryInfo(req.body);
            salaryInfo.emp_id = req.body.emp_id || req.query.emp_id;
            salaryInfo.isCompleted = true;
            salaryInfo.createdBy = parseInt(req.headers.uid);
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
    salaryInfo.isCompleted = true;
    salaryInfo.updatedBy = parseInt(req.headers.uid);

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
    carInfo.isCompleted = true;
    carInfo.createdBy = parseInt(req.headers.uid);

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
    carInfo.isCompleted = true;
    carInfo.updatedBy = parseInt(req.headers.uid);
    
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
    certificationInfo.isCompleted = true;
    certificationInfo.createdBy = parseInt(req.headers.uid);


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
        return done(err, certificationInfoData);
    });
}

function updateCertificationInfoDetails(req, res, done) {
    let certificationInfo = new CertificationInfo(req.body);
    certificationInfo.emp_id = req.body.emp_id || req.query.emp_id;
    certificationInfo.isCompleted = true;
    certificationInfo.updatedBy = parseInt(req.headers.uid);

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
    performanceRatingInfo.createdBy = parseInt(req.headers.uid);


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
    performanceRatingInfo.updatedBy = parseInt(req.headers.uid);

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
    notification.createdBy = parseInt(req.headers.uid);
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
    empRole.createdBy = parseInt(req.headers.uid);
    //empRole.createdBy = 0;
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
            redirectUrl:process.env.HostUrl +"/reset/" + emp.resetPasswordToken,
            uid: uuidV1()
        }
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions);
}

function addOfficeInfoDetails(req, res, done) {

    let officeEmpDetails = new OfficeInfo(req.body);
    officeEmpDetails.emp_id = req.body.emp_id;
    officeEmpDetails.createdBy = parseInt(req.headers.uid);
    //officeEmpDetails.createdBy = 0;

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
    queryUpdate={ $set: { updatedBy: parseInt(req.headers.uid), fullName: req.body.fullName }};
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
                        "updatedBy":parseInt(req.headers.uid),
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
    queryUpdate={ $set: { updatedBy: parseInt(req.headers.uid),
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
                            _id:req.body.supervisor_id,
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
    supervisorDetails.createdBy = parseInt(req.headers.uid);
    //supervisorDetails.createdBy = 0;

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
    supervisorDetails.updatedBy = parseInt(req.headers.uid);

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
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: documentsData
                }
            });
        }
        return res.status(200).json(documentsData);
    });
}

function getProfileProcessInfoDetails(req,res)
{
    let emp_id=req.body.emp_id||req.query.emp_id;
    let query={
        isActive:true
    }
    if(emp_id)
    {
        query={
            emp_id:emp_id,
            isActive:true
        }
    }
    ProfileProcessInfo.findOne(query, function(err, profileData)
    {
        if(err)
        {
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: profileData
                }
            });  
        }
        let profile={
                "_id":profileData._id,
                "emp_id":profileData.emp_id,
                "hrSendbackComment": profileData.hrSendbackComment,
                "hrSupervisorSendbackComment": profileData.hrSupervisorSendbackComment,
                "supervisorStatus": profileData.supervisorStatus,
                "hrStatus": profileData.hrStatus,
                "employeeStatus": profileData.employeeStatus,
                "hrSupervisorSendbackComment":profileData.hrSupervisorSendbackComment,
                "hrSendbackComment":profileData.hrSendbackComment,
                "isEmployeeSubmitted":profileData.employeeStatus== 'Submitted'? true:false,
                "isHrSubmitted":profileData.hrStatus== 'Submitted'? true:false,
                "isHrSendBack":profileData.hrStatus== 'SendBack'? true:false,
                "isSupervisorApproved":profileData.supervisorStatus== 'Approved'? true:false,
                "isSupervisorSendBack":profileData.supervisorStatus== 'SendBack'? true:false,
                "createdBy":profileData.createdBy
        } 
        return res.status(200).json(profile);
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
        // createdBy: false,
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
        // createdBy: false,
    };
    CertificationInfo.find(query, certificationAndTraniningProjection, function(err, certificationDetailsData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: certificationDetailsData
                }
            });
        }
        return done(err, certificationDetailsData);
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
        // createdBy: false,
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
        // createdBy: false,
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
                    dateOfConfirmation :results[0].dateOfConfirmation ? new Date(results[0].dateOfConfirmation):null,
                    workPermitNumber : results[0].workPermitNumber,
                    workPermitEffectiveDate :results[0].workPermitEffectiveDate ? new Date(results[0].workPermitEffectiveDate):null,
                    workPermitExpiryDate :results[0].workPermitExpiryDate ? new Date(results[0].workPermitExpiryDate):null,
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
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err,
                result: {
                    message: performanceRatingProjection
                }
            });
            
        }
        return res.status(200).json(performanceRatingProjection);
        
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
        //uncomment below line to add user from backend.
        //req.headers.uid =0;
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    let token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                let emp = new EmployeeInfo();
                emp.resetPasswordToken = token;
                emp.resetPasswordExpires = Date.now() + 86400000; // 24 hours
                emp.fullName = req.body.fullName;
                emp.password = "Test@123";
                emp.employmentType_id = req.body.employmentType_id;
                emp.designation_id = req.body.designation_id;
                emp.company_id = req.body.company_id;
                emp.grade_id = req.body.grade_id;
                emp.userName = req.body.userName;
                emp.createdBy = parseInt(req.headers.uid);
                //emp.createdBy = 0;

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
                                },
                                function(done)
                                {
                                    addProfileProcessInfoDetails(req, res, done)
                                }
                            ],
                            function(done) {
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
        EmployeeInfo.aggregate([
        {
            "$lookup": {
                "from": "designations",
                "localField": "designation_id",
                "foreignField": "_id",
                "as": "designations"
            }
        },
        {
          "$unwind": "$designations"
        },
        {
          "$lookup": {
              "from": "employeeofficedetails",
              "localField": "_id",
              "foreignField": "emp_id",
              "as": "officeDetails"
          }
        },
        {
          "$unwind": "$officeDetails"
        },
        {
            "$lookup": {
                "from": "employeesupervisordetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "supervisor"
            }
        },
        {
            "$unwind": "$supervisor"
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "supervisor.primarySupervisorEmp_id",
                "foreignField": "_id",
                "as": "employees"
            }
        },
        {
            "$unwind": "$employees"
        },
        {
            "$lookup": {
                "from": "employeeprofileprocessdetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "employeeprofileProcessDetails"
            }
        },
        {
            "$unwind": "$employeeprofileProcessDetails"
        },
        {"$match": {"isDeleted":false,"designations.isActive":true,"officeDetails.isDeleted":false} },
        {"$project":{
          "_id":"$_id",
          "fullName":"$fullName",
          "profileImage":"$profileImage",
          "officeEmail":"$officeDetails.officeEmail",
          "designation":"$designations.designationName",
          "supervisor":"$employees.fullName",
          "hrScope_Id":'$officeDetails.hrspoc_id',
          "supervisor_id":"$employees._id",
          "profileProcessDetails":"$employeeprofileProcessDetails"
        }}
        ]).exec(function(err, results){
        if(err)
        {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: results
                }
            });
        } 
        return res.status(200).json({"data":results});
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
    getProfileProcessInfo: (req, res) => {
        getProfileProcessInfoDetails(req, res);
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

    addProfileProcessInfo: (req, res) => {
        async.waterfall([
            function(done) {
                addProfileProcessInfoDetails(req, res, done);
            },
            function(profileProcessInfoData, done) {
                return res.status(200).json(profileProcessInfoData);
            }
        ]);
    },

    updateProfileProcessInfo: (req, res) => {
        async.waterfall([
            function(done) {
                updateProfileProcessInfoDetails(req, res, done);
            },
            function(profileProcessInfoData, done) {
                return res.status(200).json(profileProcessInfoData);
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
        let emp_id=req.body.emp_id || req.query.emp_id;
        Promise.all([
          SalaryInfo.find({emp_id:emp_id,isActive:true}).count().exec(),   
          ]).then(function(counts) {
              if(counts[0]>0)
              {
                async.waterfall([
                    function(done) {
                        addSalaryInfoDetailsWithUpdate(req, res, done);
                    },
                    function(salaryInfoData, done) {
                        return res.status(200).json(salaryInfoData);
                    }
                ]);
              }
              else{
                async.waterfall([
                    function(done) {
                        addSalaryInfoDetails(req, res, done);
                    },
                    function(salaryInfoData, done) {
                        return res.status(200).json(salaryInfoData);
                    }
                ]);
              }
          })
          .catch(function(err) {
            return res.status(403).json({
                                title: 'Error',
                                error: {
                                    message: err
                                }
                });
          });
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
        EmployeeInfo.findById(userId, function(err, user) {
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
