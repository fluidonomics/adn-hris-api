let express           = require('express'),
    Role              = require('../models/master/role.model'),
    Company           = require('../models/master/company.model'),
    Division          = require('../models/master/division.model'),
    Department        = require('../models/master/department.model'),
    Vertical          = require('../models/master/vertical.model'),
    SubVertical       = require('../models/master/subVertical.model'),
    Facility          = require('../models/master/facility.model'),
    Document          = require('../models/master/document.model'),
    CompanyBusiness   = require('../models/master/companyBusiness.model'),
    MaritalStatus     = require('../models/master/maritalStatus.model'),
    Currency          = require('../models/master/currency.model'),
    Grade             = require('../models/master/grade.model'),
    Designation       = require('../models/master/designation.model'),
    GradeDesignation  = require('../models/master/gradeDesignation.model'),
    AddressLocation   = require('../models/master/location.model'),
    ManagementType    = require('../models/master/managementType.model'),
    EmploymentType    = require('../models/master/employmentType.model'),
    EmploymentStatus  = require('../models/master/employmentStatus.model'),
    Education         = require('../models/master/education.model'),
    PerformanceRating = require('../models/master/performanceRating.model'),
    Relation          = require('../models/master/relation.model'), 
    Employee          = require('../models/employee/employeeDetails.model'),
    SupervisorDetails = require('../models/employee/employeeSupervisorDetails.model'),
    EmployeeRole      = require('../models/employee/employeeRoleDetails.model'),

    OfficeDetails     = require('../models/employee/employeeOfficeDetails.model'),
    BankInfo          = require('../models/employee/employeeBankDetails.model'),
    SalaryInfo        = require('../models/employee/employeeSalaryDetails.model'),
    CarInfo           = require('../models/employee/employeeCarDetails.model'),
    PersonalInfo = require('../models/employee/employeePersonalDetails.model'),

    PersonalDetails   = require('../models/employee/employeePersonalDetails.model'),
    AddressInfo       = require('../models/employee/employeeAddressDetails.model'),
    DocumentsInfo     = require('../models/employee/employeeDocumentDetails.model'),
    AcademicInfo      = require('../models/employee/employeeAcademicDetails.model'),
    CertificationInfo = require('../models/employee/employeeCertificationDetails.model'),
    PreviousEmploymentInfo = require('../models/employee/employeePreviousEmploymentDetails.model'),
    FamilyInfo        = require('../models/employee/employeeFamilyDetails.model'),


    ProfileProcessStatus= require('../models/employee/employeeProfileProcessDetails.model'),
    uuidV1            = require('uuid/v1'),
    async             = require('async')
    awaitEach         = require('await-each');
    sendEmailInfo     =require('../class/sendEmail');
    Notify     =require('../class/notify');
    require('dotenv').load()

function getDesignationByGrade(req, res) {

    var gradeDesignationProjection = {
        createdAt: false,
        updatedAt: false,
        isActive: false,
        updatedBy: false,
        createdBy: false
    };
    var grade_id = req.body.grade_id || req.params.grade_id || req.query.grade_id;
    var query = {
        grade_id: grade_id,
        isActive: true
    }
    GradeDesignation.find(query, gradeDesignationProjection, function(err, gradeHirearchyData) {
        if (gradeHirearchyData) {
            var hirarchyArray = [];
            if (gradeHirearchyData) {
                gradeHirearchyData.forEach(element => {
                    hirarchyArray.push(element.designation_id);
                });
            }

            var querys = {
                isActive: true
            }
            var designationProjection = {
                createdAt: false,
                updatedAt: false,
                isActive: false,
                updatedBy: false,
                createdBy: false
            };
            Designation.find(querys, designationProjection, {
                    sort: {
                        _id: 1
                    }
                })
                .where('_id')
                .in(hirarchyArray)
                .exec(function(err, designationData) {
                    if (designationData) {
                        return res.status(200).json(designationData);
                    } else {
                        return res.status(403).json({
                            title: 'Error',
                            error: {
                                message: err
                            },
                            result: {
                                message: result
                            }
                        });
                    }

                });
        } else {
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        }

    })
}



function sendEmailMail(req,res)
{
    let toemail=req.body.toEmail;
    let subject=req.body.subject;
    let htmlBody=req.body.htmlBody;

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
    let mailOptions = {
        from: '"Team HRIS" <hris@adnsl.net>', // sender address
        to: toemail,
        subject: subject, // Subject line
        html: htmlBody
    };
    transporter.sendMail(mailOptions, (error2, info) => {
        if (error2) {
            return console.log("RESULT ERROR = ", error2);
        }
        res.status(200).json(true);
     });
}

function sendResetPasswordLink(token,emp_id,email_id,done)
{
    let queryUpdate={ $set: {resetPasswordToken:token, resetPasswordExpires: Date.now() + 3600000 }};
    Employee.findOneAndUpdate({_id:emp_id,isDeleted:false},queryUpdate,function(err,user)
    {
    if (err) {
        return res.status(403).json({
        title: 'There was an error',
        error: err
        });
    }
    if(user)
    {
        if(email_id)
        sendEmailInfo.sendEmailResetPassword(email_id, process.env.HostUrl+"/reset/"+token)
    }
    done(err, user);
    });
}
function getAllEmployeeEmails(req, res) {

    PersonalInfo.aggregate([
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "emp_id",
                "foreignField": "_id",
                "as": "emp_name"
            }
        },
        {
            "$unwind": {
                path: "$emp_name",
                "preserveNullAndEmptyArrays": true
            }
        },
        { "$match": { "isDeleted": false } },
        {
            "$project": {
                "_id": "$_id",
                "emp_id": "$emp_id",
                "emp_name": "$emp_name.fullName",
                "personalEmail": "$personalEmail"
            }
        }

    ]).exec(function (err, results) {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: results
                }
            });
        }
        return res.status(200).json({ "data": results });
    });
}
function getMonthFromDate(date) {
    let d = new Date(date);
    return (d.getUTCMonth() + 1);
}
function getDayFromDate(date) {
    let d = new Date(date);
    return d.getUTCDate();
}
let functions = {
    getRole: (req, res) => {
        var query = {
            isActive: true,
            roleName: {$ne: 'Admin'}
        }

    
        var roleProjection = {
            createdAt: false,
            updatedAt: false,
            isActive: false,
            updatedBy: false,
            createdBy: false
        };
        Role.find(query, roleProjection, {
          sort: {
              _id: 1
          }
      }, function(err, roleData) {
            if (roleData) {
                return res.status(200).json(roleData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getCompany: (req, res) => {
        var query = {
            isDeleted: false
        }
        var companyProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Company.find({}, companyProjection, {
          sort: {
              _id: 1
          }
      }, function(err, companyData) {
            if (companyData) {
                return res.status(200).json(companyData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getAllEmployeeEmails: (req, res) => {
        getAllEmployeeEmails(req, res);
    },
    getDocuments: (req, res) => {
        var query = {
            isDeleted: false
        }
        var documentProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Document.find({}, documentProjection, {
          sort: {
              _id: 1
          }
      }, function(err, documentData) {
            if (documentData) {
                return res.status(200).json(documentData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getFacility: (req, res) => {
        var query = {
            isDeleted: false
        }
        var facilityProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Facility.find({}, facilityProjection, {
          sort: {
              _id: 1
          }
      }, function(err, facilityData) {
            if (facilityData) {
                return res.status(200).json(facilityData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
     getCompanyBusiness: (req, res) => {
        var query = {
            isDeleted: false
        }
        var companyBusinessProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        CompanyBusiness.find({}, companyBusinessProjection, {
          sort: {
              _id: 1
          }
      }, function(err, companyBusinessData) {
            if (companyBusinessData) {
                return res.status(200).json(companyBusinessData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getDivision: (req, res) => {
        var query = {
            isDeleted: false
        }
        var divisionProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Division.find(query, divisionProjection, {
          sort: {
              _id: 1
          }
      }, function(err, divisionData) {
            if (divisionData) {
                return res.status(200).json(divisionData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
    getDepartment: (req, res) => {
        var query = {
            isDeleted: false
        }
        var division_id = req.body.division_id || req.params.division_id || req.query.division_id;
        if (division_id) {
            query = {
                division_id: division_id,
                isDeleted: false
            }
        }
        var departmentProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Department.find(query, departmentProjection, {
          sort: {
              _id: 1
          }
      }, function(err, departmentData) {
            if (departmentData) {
                return res.status(200).json(departmentData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getVertical: (req, res) => {
        var query = {
            isDeleted: false
        }
        var department_id = req.body.department_id || req.params.department_id || req.query.department_id;
        if (department_id) {
            query = {
                department_id: department_id,
                isDeleted: false
            }
        }
        var verticalProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false,
            department_id: false
        };
        Vertical.find(query, verticalProjection, {
          sort: {
              _id: 1
          }
      }, function(err, verticalData) {
            if (verticalData) {
                return res.status(200).json(verticalData);
            }

            return res.status(403).json({
                title: 'Add new Grade failed!',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
    getSubVertical: (req, res) => {
        var vertical_id = req.body.vertical_id || req.params.vertical_id || req.query.vertical_id;
        var query = {
            isDeleted: false
        }
        if (vertical_id) {
            query = {
                vertical_id: vertical_id,
                isDeleted: false
            }
        }
        var subVerticalProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };

        SubVertical.find(query, subVerticalProjection, {
          sort: {
              _id: 1
          }
      }, function(err, subVerticalData) {
            if (subVerticalData) {
                return res.status(200).json(subVerticalData);
            }

            return res.status(403).json({
                title: 'Add new Grade failed!',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
    getMaritalStatus: (req, res) => {
        var query = {
            isDeleted: false
        }
        var maritalStatusProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        MaritalStatus.find(query, maritalStatusProjection, {
          sort: {
              _id: 1
          }
      }, function(err, maritalStatusData) {
            if (maritalStatusData) {
                return res.status(200).json(maritalStatusData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
    getCurrency: (req, res) => {
        var query = {
            isDeleted: false
        }
        var currencyProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Currency.find(query, currencyProjection, {
          sort: {
              _id: 1
          }
      }, function(err, currencyData) {
            if (currencyData) {
                return res.status(200).json(currencyData);
            }

            return res.status(403).json({
                title: 'Add new Grade failed!',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
    getGrade: (req, res) => {
        var managementType_id = req.body.managementType_id || req.params.managementType_id || req.query.managementType_id;
        var employmentType_id = req.body.employmentType_id || req.params.employmentType_id || req.query.employmentType_id;
        var query = {
            isDeleted: false
        }
        if( managementType_id && employmentType_id)
        {
          if(managementType_id==1 && (employmentType_id==1||employmentType_id==2||employmentType_id==4))
          {
            query = {isDeleted: false, _id: { $lte: 13 } }
          }
          else if((managementType_id==1 && employmentType_id==3)||(managementType_id==2 && employmentType_id==6))
          {
            query = {isDeleted: false,_id:1001}
          }
          else if(managementType_id==2 && (employmentType_id==5||employmentType_id==7))
          {
              query = {isDeleted: false,_id:{$in:[14,15,16]}}
          }
        }

        var gradeProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Grade.find(query, gradeProjection, {
          sort: {
              _id: 1
          }
      }, function(err, gradeData) {
            if (gradeData) {
                return res.status(200).json(gradeData);
            }

            return res.status(403).json({
                title: 'Add new Grade failed!',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getDesignation: (req, res) => {
        var grade_id = req.body.grade_id || req.params.grade_id || req.query.grade_id;
        var query = {
            isActive: true,
        }
        if (grade_id) {
            getDesignationByGrade(req, res);
        } else {
            var gradeProjection = {
                createdAt: false,
                updatedAt: false,
                isActive: false,
                updatedBy: false,
                createdBy: false
            };
            Designation.find(query, gradeProjection, {
                sort: {
                    _id: 1
                }
            }, function(err, designationData) {
                if (designationData) {
                    return res.status(200).json(designationData);
                }

                return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    },
                    result: {
                        message: result
                    }
                });

            })
        }
    },
    getLocation: (req, res) => {
      var query = {parent_id:null};
      var parent_id = req.body.parent_id || req.params.parent_id || req.query.parent_id;
      if (parent_id) 
      {
        query = {parent_id: parent_id}
      }
      var locationProjection = {
          createdAt: false,
          updatedAt: false,
          updatedBy: false,
          createdBy: false
      };
      AddressLocation.find(query,locationProjection, {sort: {_id: 1}},function(err, locationData)
      {
          if (locationData) {
              return res.status(200).json(locationData);
          }

          return res.status(403).json({
              title: 'Error',
              error: {
                  message: err
              },
              result: {
                  message: result
              }
          });
      })
    },
    getGradeDesignation: (req, res) => {
        var query = {
            isActive: true
        }
        var gradeDesignationProjection = {
            createdAt: false,
            updatedAt: false,
            isActive: false,
            updatedBy: false,
            createdBy: false
        };
        GradeDesignation.find(query, gradeDesignationProjection, {
          sort: {
              _id: 1
          }
      }, function(err, gradeDesignationData) {
            if (gradeDesignationData) {
                return res.status(200).json(gradeDesignationData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
    getManagementType: (req, res) => {
      
        var query = {
            isDeleted: false
        }
        var managementTypeProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        ManagementType.find({}, managementTypeProjection, {
          sort: {
              _id: 1
          }
      }, function(err, managementTypeData) {
            if (managementTypeData) {
                return res.status(200).json(managementTypeData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getEmploymentType: (req, res) => {
       var managementType_id = req.body.managementType_id || req.params.managementType_id || req.query.managementType_id;
        var query = {
            isDeleted: false
        }
        if(managementType_id)
        {
          query = {
                isDeleted: false,
                managementType_id:managementType_id
           }
        }
        var employmentTypeProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        EmploymentType.find(query, employmentTypeProjection, {
          sort: {
              _id: 1
          }
      }, function(err, employmentTypeData) {
            if (employmentTypeData) {
                return res.status(200).json(employmentTypeData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getEmploymentStatus: (req, res) => {
        var query = {
            isDeleted: false
        }
        var employmentStatusProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        EmploymentStatus.find({}, employmentStatusProjection, {
          sort: {
              _id: 1
          }
      }, function(err, employmentStatusData) {
            if (employmentStatusData) {
                return res.status(200).json(employmentStatusData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },

    getEmployee:(req, res)=>
    {
        Employee.aggregate([
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
                "from": "employeepersonaldetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "personalDetails"
            }
        },
        {
            "$unwind": "$personalDetails"
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
        {
            "$lookup": {
                "from": "kraworkflowdetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "kraworkflowdetails"
            }
        },
        {"$unwind": {
            "path": "$kraworkflowdetails","preserveNullAndEmptyArrays": true
        }},
        {"$match": {"isDeleted":false,"designations.isActive":true,"officeDetails.isDeleted":false,"_id":parseInt(req.query.emp_id)} },
        {"$project":{
          "_id":"$_id",
          "fullName":"$fullName",
          "userName":"$userName",
          "isAccountActive":"$isAccountActive",
          "profileImage":"$profileImage",
          "grade_id":"$grade_id",
          "supervisorDetails":"$employees",
          "profileProcessDetails":"$employeeprofileProcessDetails",
          "personalDetails":"$personalDetails",
          "officeDetails":"$officeDetails",
          "designationDetails":"$designations",
          "kraWorkflow":"$kraworkflowdetails"
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
        return res.status(200).json(results[0]);
     });
    },

    getEducation: (req, res) => {
        var query = {parent_id:null};
        var parent_id = req.body.parent_id || req.params.parent_id || req.query.parent_id;
        if (parent_id) 
        {
          query = {parent_id: parent_id}
        }
        var educationProjection = {
            createdAt: false,
            updatedAt: false,
            updatedBy: false,
            createdBy: false
        };
        Education.find(query,educationProjection, {sort: {_id: 1}},function(err, educationData)
        {
            if (educationData) {
                return res.status(200).json(educationData);
            }
  
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
    getHr: (req, res) => {
        var query = {
            isDeleted: false,
            role_id: 2
        }
        var empRoleProjection = {
            emp_id: true,
        };
        EmployeeRole.find(query, empRoleProjection, {
          sort: {
              _id: 1
          }
      }, function(err, empRoleData) {
            var empArray = [];
            if (empRoleData) {
                empRoleData.forEach(element => {
                    empArray.push(element.emp_id);
                });
            }
            let subQuery = {
                isDeleted: false
            };
            var company_id = req.body.company_id || req.params.company_id || req.query.company_id;
            var emp_id = req.body.emp_id || req.params.emp_id || req.query.emp_id;
            //if (company_id && emp_id) { //change for ver hr
            if (emp_id) {
                let supervisorQuery = {
                    isActive: true,
                    emp_id: emp_id
                }
                SupervisorDetails.find(supervisorQuery).select('primarySupervisorEmp_id').exec(function(err, supervisorDetailsData) {
                    if (supervisorDetailsData) {
                        var supervisorEmpArray = [];
                        if (supervisorDetailsData) {
                            supervisorDetailsData.forEach(element => {
                                supervisorEmpArray.push(element.primarySupervisorEmp_id);
                            });
                            subQuery = {
                                isDeleted: false,
                                //change for ver hr
                                //company_id: company_id
                            }
                            Employee.find(subQuery).where('_id').in(supervisorEmpArray).select('fullName userName').exec(function(err, empSupervisorData) {
                                if (empSupervisorData) {
                                    return res.status(200).json(empSupervisorData);
                                }

                                return res.status(403).json({
                                    title: 'Error',
                                    error: {
                                        message: err
                                    },
                                    result: {
                                        message: result
                                    }
                                });
                            })
                        }
                    }
                });
            } else {
                if (company_id) {
                    subQuery = {
                        isDeleted: false,
                        company_id: company_id
                    }
                }
                Employee.find(subQuery).where('_id').in(empArray).select('fullName userName').exec(function(err, empData) {
                    if (empData) {
                        return res.status(200).json(empData);
                    }

                    return res.status(403).json({
                        title: 'Error',
                        error: {
                            message: err
                        },
                        result: {
                            message: result
                        }
                    });
                })
            }

        })
    },
    
    getSupervisor: (req, res) => {
        var query = {
            isDeleted: false,
            role_id: 4
        }
        var empRoleProjection = {
            emp_id: true,
        };
        EmployeeRole.find(query, empRoleProjection, {
          sort: {
              _id: 1
          }
      }, function(err, empRoleData) {
            let subQuery = {
                isDeleted: false
            };
            var grade_id = req.body.grade_id || req.params.grade_id || req.query.grade_id;
            if (grade_id) {
                subQuery = {
                    isDeleted: false,
                    grade_id: {$lte: grade_id}
                }
            }
            let arrRoles=[];
            for (let i = 0; i < empRoleData.length; i++) { 
                arrRoles.push(empRoleData[i].emp_id);
            }
            Employee.find(subQuery).where('_id').in(arrRoles).select('_id, fullName userName').exec(function(err, empData) {
                if (empData) {
                    return res.status(200).json(empData);
                }

                return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    },
                    result: {
                        message: result
                    }
                });
            })
        })
    },

    getKraSupervisor: (req, res) => {
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
        var kraSupervisorProjection = {
            _id: false,
            leaveSupervisorEmp_id:false,
            emp_id:false,
            createdAt: false,
            updatedAt: false,
            isActive: false,
            reason:false,
            updatedBy: false,
            createdBy: false,
        };
     
        SupervisorDetails.aggregate([
            {
                  "$lookup": {
                      "from": "employeedetails",
                      "localField": "primarySupervisorEmp_id",
                      "foreignField": "_id",
                      "as": "primarySupervisor"
                  }
            },
            {
                "$unwind": "$primarySupervisor"
            },
            {
                            "$lookup": {
                                "from": "employeedetails",
                                "localField": "secondarySupervisorEmp_id",
                                "foreignField": "_id",
                                "as": "secondarySupervisor"
                              }
            },
            { "$match": { "emp_id":parseInt(emp_id),"isActive":true} },
            {"$project":{
                "primarySupervisor":"$primarySupervisor",
                "secondarySupervisor":"$secondarySupervisor",
              }}
          ])
          .exec(function(err, results){
              if(err)
              {
                return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: results
                }});
              }

              let supervisorData=[];
              supervisorData.push({"_id":results[0].primarySupervisor._id,"fullName":results[0].primarySupervisor.fullName})
              if(results[0].secondarySupervisor.length > 0)
              {
                supervisorData.push({"_id":results[0].secondarySupervisor[0]._id,"fullName":results[0].secondarySupervisor[0].fullName})
              }
              return res.status(200).json(supervisorData);


          });

        // SupervisorDetails.find(query, kraSupervisorProjection,function(err, kraSupervisorData) {
        //     if (kraSupervisorData) {
        //         let kraSupervisors=[];
        //         kraSupervisors.push(kraSupervisorData[0].primarySupervisorEmp_id);
        //         kraSupervisors.push(kraSupervisorData[1].secondarySupervisorEmp_id);
        //         return res.status(200).json(kraSupervisorData);
        //     }

        //     return res.status(403).json({
        //         title: 'Error',
        //         error: {
        //             message: err
        //         },
        //         result: {
        //             message: result
        //         }
        //     });
        // })
    },

    
    checkEmailExists: (req, res) => {
      Promise.all([
        PersonalDetails.find({personalEmail:req.query.email}).count().exec(),
        OfficeDetails.find({officeEmail:req.query.email}).count().exec()
      ]).then(function(counts) {
          if(counts[0] > 0 || counts[1] > 0)
          {
            return res.status(200).json(true);
          }
          else{
           return res.status(200).json(false);
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

    getTabStatus: (req, res) => {
        let emp_id = parseInt(req.params.emp_id || req.query.emp_id);
        Promise.all([
            //Personal Profile
            PersonalDetails.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(),   
            AddressInfo.find({emp_id:emp_id,isActive:true,isCompleted:true}).count().exec(),       
            DocumentsInfo.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(),   
            AcademicInfo.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(),      
            CertificationInfo.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(), 
            PreviousEmploymentInfo.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(),
            FamilyInfo.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(),
           
            //Office Profile
            OfficeDetails.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(),   
            BankInfo.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec(),         
            SalaryInfo.find({emp_id:emp_id,isActive:true,isCompleted:true}).count().exec(),        
            CarInfo.find({emp_id:emp_id,isDeleted:false,isCompleted:true}).count().exec() 
          ]).then(function(counts) {
             let statusData= {
                "isPersonalInfo":(counts[0]>0)?true:false,
                "isAddress":(counts[1]>0)?true:false,
                "isDocuments":(counts[2]>0)?true:false,
                "isAcademicInfo":(counts[3]>0)?true:false,
                "isCertificate":(counts[4]>0)?true:false,
                "isEmployment":(counts[5]>0)?true:false,
                "isFamilyInfo":(counts[6]>0)?true:false,
                "isOffice":(counts[7]>0)?true:false,
                "isBankInfo":(counts[8]>0)?true:false,
                "isSalaryInfo":(counts[9]>0)?true:false,
                "isCarInfo":(counts[10]>0)?true:false,
             }
            return res.status(200).json(statusData);
          })
          .catch(function(err) {
            return res.status(403).json({
                                title: 'Error',
                                error: {
                                    message: err
                                }
                    });
          });
          
          

        // var tab =  req.params.tab || req.query.tab;
        // let emp_id = parseInt(req.params.emp_id || req.query.emp_id);
        // if(tab=="Office")
        // {
        //     Employee.aggregate([
        //         {
        //             "$lookup": {
        //                 "from": "employeeofficedetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeeofficedetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeebankdetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeebankdetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeesalarydetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeesalarydetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeecardetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeecardetails"
        //               }
        //         },
        //         { "$match": 
        //            {
        //              "_id": parseInt(emp_id),
        //              "isDeleted":false,
        //              "employeeofficedetails.isDeleted":false,
        //              "employeebankdetails.isDeleted":false,
        //              "employeesalarydetails.isActive":true,
        //              "employeecardetails.isDeleted":false,
                    
        //              "employeeofficedetails.isCompleted":true,
        //              "employeebankdetails.isCompleted":true,
        //              "employeesalarydetails.isCompleted":true,
        //              "employeecardetails.isCompleted":true,
                  
        //            }
        //         },
        //         {
        //             "$project":{
        //                     "office":{$size:"$employeeofficedetails"},
        //                     "bank":{$size:"$employeebankdetails"},
        //                     "salary":{$size:"$employeesalarydetails"},
        //                     "car":{$size:"$employeecardetails"},
        //                 }
        //         }
        //         ]).exec(function(err, employeeDetailsData){
        //           if(err)
        //           {
        //             return res.status(403).json({
        //                 title: 'Error',
        //                 error: {
        //                     message: err
        //                 },
        //                 result: {
        //                     message: result
        //                 }
        //             });
        //           }
        //           else if(employeeDetailsData.length > 0 && employeeDetailsData[0].office > 0 
        //             && employeeDetailsData[0].bank > 0
        //             && employeeDetailsData[0].salary > 0 
        //             && employeeDetailsData[0].car > 0
        //           )
        //           {
        //             return res.status(200).json(true);
        //           }
        //           else{
        //             return res.status(200).json(false);
        //           }
        //     });
        // }
        // else 
        // {
        //     Employee.aggregate([
        //         {
        //             "$lookup": {
        //                 "from": "employeepersonaldetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeepersonaldetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeeaddressdetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeeaddressdetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeedocumentdetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeedocumentdetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeeacademicdetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeeacademicdetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeecertificationdetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeecertificationdetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeepreviousemploymentdetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeepreviousemploymentdetails"
        //               }
        //         },
        //         {
        //             "$lookup": {
        //                 "from": "employeefamilydetails",
        //                 "localField": "_id",
        //                 "foreignField": "emp_id",
        //                 "as": "employeefamilydetails"
        //               }
        //         },
        //         { "$match": 
        //            {
        //             "_id": parseInt(emp_id),
        //             "isDeleted":false,
        //              "employeepersonaldetails.isDeleted":false,
        //              "employeeaddressdetails.isActive":true,
        //              "employeedocumentdetails.isDeleted":false,
        //              "employeeacademicdetails.isDeleted":false,
        //              "employeecertificationdetails.isDeleted":false,
        //              "employeepreviousemploymentdetails.isDeleted":false,
        //              "employeefamilydetails.isDeleted":false,
        //              "employeepersonaldetails.isCompleted":true,
        //              "employeeaddressdetails.isCompleted":true,
        //              "employeedocumentdetails.isCompleted":true,
        //              "employeeacademicdetails.isCompleted":true,
        //              "employeecertificationdetails.isCompleted":true,
        //              "employeepreviousemploymentdetails.isCompleted":true,
        //              "employeefamilydetails.isCompleted":true,
        //            }
        //         },
        //         {
        //             "$project":{
        //                     "personal":{$size:"$employeepersonaldetails"},
        //                     "address":{$size:"$employeeaddressdetails"},
        //                     "documents":{$size:"$employeedocumentdetails"},
        //                     "academicInfo":{$size:"$employeeacademicdetails"},
        //                     "certificateInfo":{$size:"$employeecertificationdetails"},
        //                     "employment":{$size:"$employeepreviousemploymentdetails"},
        //                     "familyInfo":{$size:"$employeefamilydetails"}
        //                 }
        //         }
        //         ]).exec(function(err, employeeDetailsData){
        //           if(err)
        //           {
        //             return res.status(403).json({
        //                 title: 'Error',
        //                 error: {
        //                     message: err
        //                 },
        //                 result: {
        //                     message: result
        //                 }
        //             });
        //           }
        //           else if(employeeDetailsData.length > 0 && employeeDetailsData[0].personal > 0 
        //             && employeeDetailsData[0].address > 0
        //             && employeeDetailsData[0].documents > 0 
        //             && employeeDetailsData[0].academicInfo > 0
        //             && employeeDetailsData[0].certificateInfo > 0
        //             && employeeDetailsData[0].employment > 0
        //             && employeeDetailsData[0].familyInfo > 0
        //           )
        //           {
        //             return res.status(200).json(true);
        //           }
        //           else{
        //             return res.status(200).json(false);
        //           }
        //     });
        // }




    },
    
    getPerformanceRating: (req, res) => {
        var query = {
            isDeleted: false
        }
        var performanceRatingProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        PerformanceRating.find({}, performanceRatingProjection, {sort: {_id: 1}}, function(err, performanceRatingData) {
            if (performanceRatingData) {
                return res.status(200).json(performanceRatingData);
            }

            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });

        })
    },
    getRelation: (req, res) => {
        var query = {
            isDeleted: false
        }
        var relationProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
            Relation.find({}, relationProjection, {sort: {_id: 1}}, function(err, relationData) {
                if (relationData) {
                    return res.status(200).json(relationData);
                }
                return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    },
                    result: {
                        message: result
                    }
            });
        })
    },
    getProfileProcessStatus: (req, res) => {
        getProfileProcessStatusInfoDetails(req, res);
    },

    sendEmail: (req, res) => {
        sendEmailMail(req, res);
    },

    resetPasswordByHr: (req, res) => {
        let emailId;
        async.waterfall([
            function(done){
              crypto.randomBytes(20, function (err, buf) {
                let token = buf.toString('hex');
                done(err, token);
              });
            },
            function(token, done){
                OfficeDetails.findOne({emp_id: req.body.emp_id,isDeleted:false}, function (err, office) {
                    if (err) {
                      return res.status(403).json({
                        title: 'There was an error',
                        error: err
                      });
                    }
                    else{
                        if (!office.officeEmail) {
                            PersonalDetails.findOne({emp_id:req.body.emp_id},function(err, personalData){
                                if (err) {
                                    return res.status(403).json({
                                    title: 'There was an error',
                                    error: err
                                    });
                                }
                                else{
                                    if(personalData && personalData.personalEmail)
                                    sendResetPasswordLink(token,req.body.emp_id,personalData.personalEmail,done);
                                }
                            });
                        }
                        else{
                            if(office && office.officeEmail)
                            sendResetPasswordLink(token,req.body.emp_id,office.officeEmail,done);
                        }
                    }
                  })
            },
            function(result) {
              return res.status(200).json({"message":"Reset Password Link Send to Your Email Address"}); 
            }
          ]);
    },

    // sendNotification: (req, res) => {
    //     Notify.getNotificaton(1);
    //     return res.status().json(true);
    // },
    
    getEmployeeRoles:(req,res)=>
    {
        let emp_id=req.query.emp_id;
        Role.aggregate([
            {
                  "$lookup": {
                      "from": "employeeroledetails",
                      "localField": "_id",
                      "foreignField": "role_id",
                      "as": "employeeroles"
                  }
            },
            {"$match": {"roleName": {$nin: ['Admin','HR2']}}}
        ]).sort('-_id').exec(function(err,data)
        {
          if(err)
          {
            return res.status(403).json(false);
          }
          else{
             let empRoleData=[];
             for (let i = 0; i < data.length; i++) {
                var empRoleCount=data[i].employeeroles.filter(function (item){
                   return item.emp_id== parseInt(emp_id) && item.isDeleted==false;
                });
                empRoleData.push({"_id":empRoleCount && empRoleCount.length > 0  ? empRoleCount[0]._id: null,
                                  "roleName":data[i].roleName,
                                  "role_id":data[i]._id,
                                  "emp_id":parseInt(emp_id),
                                  "checked": empRoleCount && empRoleCount.length > 0 ? true : false})
                if(i==(data.length-1))
                {
                    return res.status(200).json({"data":empRoleData});
                }
             }
          }
        });
    },

    addEmployeeRole:(req,res)=>
    {
        let employeeRole = new EmployeeRole(req.body);
        employeeRole.createdBy = parseInt(req.headers.uid);
        employeeRole.save(function(err, employeeRole) {
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
            AuditTrail.auditTrailEntry(req.body.emp_id, "employeeRoleDetails", employeeRole, "common", "employeeRoleDetails", "ADDED");
            return res.status(200).json({message:'Added'});
        });
    },

    deleteEmployeeRole:(req,res)=>
    {
        if(parseInt(req.body.role_id)==3 || parseInt(req.body.role_id)==4)
        {
            Promise.all([
                SupervisorDetails.find({ 
                    $and :[
                    {
                        $or: [ { primarySupervisorEmp_id: parseInt(req.body.emp_id) }, { secondarySupervisorEmp_id: parseInt(req.body.emp_id) },{ leaveSupervisorEmp_id: parseInt(req.body.emp_id) } ]
                    },
                    { 
                        isActive:true
                    }     
                ]
                }).count().exec(),
              ]).then(function(counts) {
                  if(counts[0] > 0)
                  {
                    return res.status(200).json({error:"Can not remove role has dependency."});
                  }
                  var query = {
                     _id: parseInt(req.body._id),
                     isDeleted:false
                  }
                  EmployeeRole.findOneAndUpdate(query, {$set:{isDeleted:true}}, {new: true}, function(err, employeeRole){
                    if(err){
                        return res.status(403).json({
                            title: 'There was a problem',
                            error: {
                                message: err
                            },
                            result: {
                                message: employeeRole
                            }
                        });
                    }
                    AuditTrail.auditTrailEntry(parseInt(req.body.emp_id), "employeeRoleDetails", {isDeleted:true}, "common", "employeeRoleDetails", "Role Deleted");
                    return res.status(200).json("Removed");
                });
            });
        }
        if(parseInt(req.body.role_id==1))
        {
            Promise.all([
            OfficeDetails.find({
                hrspoc_id:parseInt(req.body.emp_id)
            }).count().exec(),
        ]).then(function(counts) {
            if(counts[0] > 0)
            {
              return res.status(200).json({error:"Can not delete role has dependency."});
            }
            var query = {
               _id: parseInt(req.body._id),
               isDeleted:false
            }
            EmployeeRole.findOneAndUpdate(query, {$set:{isDeleted:true}}, {new: true}, function(err, employeeRole){
              if(err){
                  return res.status(403).json({
                      title: 'There was a problem',
                      error: {
                          message: err
                      },
                      result: {
                          message: employeeRole
                      }
                  });
              }
              AuditTrail.auditTrailEntry(parseInt(req.body.emp_id), "employeeRoleDetails", {isDeleted:true}, "common", "employeeRoleDetails", "Role Deleted");
              return res.status(200).json({data:employeeRole});
            });
          });
        }
    },

    getEmployeeDocument:(req,res)=>
    {
        let emp_id=req.query.emp_id;
        Document.aggregate([
            {
                  "$lookup": {
                      "from": "employeeexternaldocumentdetails",
                      "localField": "_id",
                      "foreignField": "externalDocument_id",
                      "as": "employeeexternaldocumentdetails"
                  },
            }
        ]).exec(function(err,data)
        {
            if(err)
            {
              return res.status(403).json(false);
            }
            else{
               let empDocumentData=[];
               for (let i = 0; i < data.length; i++) {
                  var empCount=data[i].employeeexternaldocumentdetails.filter(function (item){
                     return item.emp_id== parseInt(emp_id)
                  });
                  empDocumentData.push(
                      { "_id":empCount && empCount.length > 0  ? empCount[0]._id: null,
                        "emp_id":parseInt(req.query.emp_id),
                        "externalDocument_id":data[i]._id,
                        "documentName":data[i].documentName,
                        "externalDocumentUrl":empCount && empCount.length > 0 ? empCount[0].externalDocumentUrl :null, 
                        "checked": empCount && empCount.length != 0 ? true : false
                    })
                  if(i==(data.length-1))
                  {
                      return res.status(200).json({"data":empDocumentData});
                  }
               }
            }
          });
    },

   

    getMonthFromDate: (req, res) => {
        getMonthFromDate(req);
    },
    getDayFromDate: (req, res) => {
        getDayFromDate(req);
    }
};

module.exports = functions;