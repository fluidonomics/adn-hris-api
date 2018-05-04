let express           = require('express'),
    Role              = require('../models/master/role.model'),
    Company           = require('../models/master/company.model'),
    Division          = require('../models/master/division.model'),
    Department        = require('../models/master/department.model'),
    Vertical          = require('../models/master/vertical.model'),
    SubVertical       = require('../models/master/subVertical.model'),
    MaritalStatus     = require('../models/master/maritalStatus.model'),
    Currency          = require('../models/master/currency.model'),
    Grade             = require('../models/master/grade.model'),
    Designation       = require('../models/master/designation.model'),
    GradeDesignation  = require('../models/master/gradeDesignation.model'),
    AddressLocation   = require('../models/master/location.model'),
    ManagementType    = require('../models/master/managementType.model'),
    EmploymentType    = require('../models/master/employmentType.model'),
    EmploymentStatus  = require('../models/master/employmentStatus.model'),
    Education  = require('../models/master/education.model'),
    PerformanceRating = require('../models/master/performanceRating.model'),
    Relation          = require('../models/master/relation.model'),    
    SupervisorDetails = require('../models/employee/employeeSupervisorDetails.model'),
    PersonalDetails   = require('../models/employee/employeePersonalDetails.model'),
    OfficeDetails     = require('../models/employee/employeeOfficeDetails.model'),
    Employee          = require('../models/employee/employeeDetails.model'),
    BankInfo          = require('../models/employee/employeeBankDetails.model'),
    SalaryInfo        = require('../models/employee/employeeSalaryDetails.model'),
    EmployeeRole      = require('../models/employee/employeeRoleDetails.model'),
    ProfileProcessStatus= require('../models/employee/employeeProfileProcessDetails.model'),
    uuidV1            = require('uuid/v1'),
    async             = require('async')
    awaitEach         = require('await-each');

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


function getProfileProcessStatusInfoDetails(req,res)
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
        ProfileProcessStatus.findOne(query, function(err, profileData)
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
                "profileProcess":profileData.personalProfileStatus,
                "officeProfileStatus":profileData.officeProfileStatus,
                "hrSupervisorSendbackComment":profileData.hrSupervisorSendbackComment,
                "hrSendbackComment":profileData.hrSendbackComment,
                "isOfficeProfileCompleted":(profileData.officeProfileStatus== 'Approved' ? true :false),
                "isPersonalProfileCompleted":(profileData.personalProfileStatus== 'Approved'||'Submitted' ||'SentBack' ? true :false)
        }
        return res.status(200).json(profile);
        });
    }
    else{
        ProfileProcessStatus.findOne(query, function(err, profileData)
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
        return res.status(200).json({"data":profileData});
        });
    }
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
          if(managementType_id==1 && (employmentType_id==1||employmentType_id==2))
          {
            query = {isDeleted: false, _id: { $lte: 13 } }
          }
          else if((managementType_id==1 && employmentType_id==3)||(managementType_id==2 && employmentType_id==5))
          {
            query = {isDeleted: false,_id:1001}
          }
          else if(managementType_id==2 && employmentType_id==4)
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
    getEmployee: (req, res) => {
        var query = {
            isDeleted: false
        }
        var employeeProjection = {
            createdAt: false,
            updatedAt: false,
            isDeleted: false,
            updatedBy: false,
            createdBy: false
        };
        Employee.find({}, employeeProjection, {
          sort: {
              _id: 1
          }
      }, function(err, employeeData) {
            if (employeeData) {
                return res.status(200).json(employeeData);
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
            if (company_id && emp_id) {
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
                                company_id: company_id
                            }
                            Employee.find(subQuery).where('_id').in(supervisorEmpArray).select('fullName').exec(function(err, empSupervisorData) {
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
                Employee.find(subQuery).where('_id').in(empArray).select('fullName').exec(function(err, empData) {
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
            Employee.find(subQuery).where('_id').in(arrRoles).select('_id, fullName').exec(function(err, empData) {
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
    checkEmailUnique: (req, res) => {
      var personalEmail =  req.params.personalEmail || req.query.personalEmail;
      var officeEmail =  req.params.officeEmail || req.query.officeEmail;
      var query = {
          isDeleted: false,
          personalEmail:personalEmail
      }
      if(personalEmail)
      {
        PersonalDetails.find(query, function(err, PersonalDetailsData) {
          if(PersonalDetailsData)
          {
            if(PersonalDetailsData.length > 0)
            {
              return res.status(200).json(false);
            }
            return res.status(200).json(true);
          }
          return res.status(403).json({
            title: 'Error',
            error: {
                message: err
            }
        });
        })
      }
      if(officeEmail)
      {
        query = {isDeleted: false,officeEmail:officeEmail}
        var officeEmpDetailsProjection = {
          _id: true,
        };
        OfficeDetails.find(query, officeEmpDetailsProjection, function(err, PersonalDetailsData) {
          if(PersonalDetailsData)
          {
            if(PersonalDetailsData.length >0)
            {
              return res.status(200).json(false);
            }
            return res.status(200).json(true);
          }
          return res.status(403).json({
            title: 'Error',
            error: {
                message: err
            }
           
        });
        })
      }
    },
    checkTabCompleted: (req, res) => {
        var tab =  req.params.tab || req.query.tab;
        var emp_id =  req.params.emp_id || req.query.emp_id;
    
        if(tab="Office")
        {
        var query = {
                isDeleted: false,
                emp_id:parseInt(emp_id)
        }
        OfficeDetails.count(query, function (err, count) {
            if (count>0) 
            {
                BankInfo.count(query, function (err, count) {
                    if (count>0) 
                    {
                        SalaryInfo.count({isActive: true,emp_id:parseInt(emp_id)}, function (err, count) {
                            if (count>0) 
                            {
                                return res.status(200).json(true);
                            }
                            return res.status(200).json(false);
                        });
                    }
                    else{
                        return res.status(200).json(false); 
                    }
                });  
            }
            else{
            return res.status(200).json(false);
            }
        });
        }
        else 
        {
        var query = {
                isDeleted: false,
                emp_id:parseInt(emp_id),
                isCompleted:true
        }
        PersonalDetails.count(query, function (err, count) {
            if(count>0)
            {
                //    AddressDetails.count({isActive:true,emp_id:parseInt(emp_id),isCompleted:true},function(err,count)
                //    {
                    
                //    })
                return res.status(200).json(true);
            }
            else{
                return res.status(200).json(false); 
            }
        });
            

        }



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
};

module.exports = functions;