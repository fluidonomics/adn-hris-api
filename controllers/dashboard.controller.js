let Role = require("../models/master/role.model"),
    EmpRoleDetails = require("../models/employee/employeeRoleDetails.model"),
    EmpOfficedetails = require("../models/employee/employeeOfficeDetails.model"),
    MidTermMaster = require("../models/midterm/midtermmaster"),
    KraWorkflowDetails = require("../models/kra/kraWorkFlowDetails.model"),
    LearningMaster = require("../models/learning/learningmaster"),
    EmployeeDetails = require("../models/employee/employeeDetails.model"),
    EmployeePersonalDetails = require("../models/employee/employeePersonalDetails.model");



    
    

    function getHrEmpRatio(req, res) {
        
        // EmpRoleDetails.count({ $or : [{role_id: 2}, {role_id: 6}]}, function (err, result) {
        //     if (err) {
        //         next(err);
        //     } else {
        //         res.json(result);
        //     }
        // })
        EmpRoleDetails.aggregate([
            { 
                "$facet" : {
                    "hr_count" : [
                        {
                            "$match" : {
                                $and: [{"role_id" : 2.0}, {"role_id" : {$ne: 6.0}}]
                            }
                        }, 
                        {
                            "$count" : "hr_count"
                        }
                    ], 
                    "emp_count" : [
                        {
                            "$match" : {
                                "role_id" : 5.0
                            }
                        }, 
                        {
                            "$count" : "emp_count"
                        }
                    ],
                    "sup_count" : [
                        {
                            "$match" : {
                                "role_id" : 4.0
                            }
                        }, 
                        {
                            "$count" : "sup_count"
                        }
                    ]
                }
            }, 
            { 
                "$project" : {
                    "hr_count" : {
                        "$arrayElemAt" : [
                            "$hr_count.hr_count", 
                            0.0
                        ]
                    }, 
                    "emp_count" : {
                        "$arrayElemAt" : [
                            "$emp_count.emp_count", 
                            0.0
                        ]
                    },
                    "sup_count" : {
                        "$arrayElemAt" : [
                            "$sup_count.sup_count", 
                            0.0
                        ]
                    }
                }
            }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "HR EMP Count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }


    function getEmpTypeRatio(req, res) {

        EmpOfficedetails.aggregate([

            {
                "$facet" : {
                    "emp_count" : [
                        {
                            "$count" : "emp_count"
                        }
                    ],
                    "mgmt_emp_count" : [
                        {
                                "$match" : {
                                    "managementType_id" : 1
                                }
                        },
                        {
                            "$count" : "mgmt_emp_count"
                        }
                    ]
                }
            },
            { 
                "$project" : {
                    "emp_count" : {
                        "$arrayElemAt" : [
                            "$emp_count.emp_count", 
                            0.0
                        ]
                    }, 
                    "mgmt_emp_count" : {
                        "$arrayElemAt" : [
                            "$mgmt_emp_count.mgmt_emp_count", 
                            0.0
                        ]
                    }
                }
            }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "Management EMP Count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getKraDetail(req, res) {
        

        let queryObj = {
            "$match": {}
        };
        queryObj['$match']['$and'] = [];
        queryObj['$match']['$and'].push({
            $and: [{
                "createdAt": {
                    $gte: new Date(req.query.fromDate)
                }
            },
            {
                "createdAt": {
                    $lte: new Date(req.query.toDate)
                }
            }
            ]
        });
        KraWorkflowDetails.aggregate([
            queryObj,
            {
                    "$facet" : {
                        "init_count" : [
                            {
                                "$match" : {
                                    "status" : "Initiated"
                                }
                            }, 
                            {
                                "$count" : "init_count"
                            }
                        ], 
                        "approved_count" : [
                            {
                                "$match" : {
                                    "status" : "Approved"
                                }
                            }, 
                            {
                                "$count" : "approved_count"
                            }
                        ],
                        "sendback_count" : [
                            {
                                "$match" : {
                                    "status" : "SendBack"
                                }
                            }, 
                            {
                                "$count" : "sendback_count"
                            }
                        ],
                        "submit_count" : [
                            {
                                "$match" : {
                                    "status" : "Submitted"
                                }
                            }, 
                            {
                                "$count" : "submit_count"
                            }
                        ],
                        "terminate_count" : [
                            {
                                "$match" : {
                                    "status" : "Terminated"
                                }
                            }, 
                            {
                                "$count" : "terminate_count"
                            }
                        ],
                    }
                },
                { 
                    "$project" : {
                        "init_count" : {
                            "$arrayElemAt" : [
                                "$init_count.init_count", 
                                0.0
                            ]
                        }, 
                        "approved_count" : {
                            "$arrayElemAt" : [
                                "$approved_count.approved_count", 
                                0.0
                            ]
                        },
                        "sendback_count" : {
                            "$arrayElemAt" : [
                                "$sendback_count.sendback_count", 
                                0.0
                            ]
                        },
                        "submit_count" : {
                            "$arrayElemAt" : [
                                "$submit_count.submit_count", 
                                0.0
                            ]
                        },
                        "terminate_count" : {
                            "$arrayElemAt" : [
                                "$terminate_count.terminate_count", 
                                0.0
                            ]
                        }
                    }
                }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "KRA workflow details count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getEmpDetail(req, res) {

        let queryObj = {
            "$match": {}
        };
        queryObj['$match']['$and'] = [];
        queryObj['$match']['$and'].push({
            $and: [{
                "createdAt": {
                    $gte: new Date(req.query.fromDate)
                }
            },
            {
                "createdAt": {
                    $lte: new Date(req.query.toDate)
                }
            }
            ]
        });

        KraWorkflowDetails.aggregate([
            queryObj,
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employees"
                }
                
            },
            {
                "$unwind": {
                    "path": "$employees", "preserveNullAndEmptyArrays": true
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
            {
                "$unwind": {
                    "path": "$supervisor", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "supervisor.primarySupervisorEmp_id",
                    "foreignField": "_id",
                    "as": "empsupdetails"
                }
            },
            {
                "$unwind": {
                    "path": "$empsupdetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "updatedBy",
                    "foreignField": "_id",
                    "as": "updatedetails"
                }
            },
            {
                "$unwind": {
                    "path": "$updatedetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "createdBy",
                    "foreignField": "_id",
                    "as": "createdetails"
                }
            },
            {
                "$unwind": {
                    "path": "$createdetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    "empName": "$employees.fullName",
                    "empId": "$employees.userName",
                    "supId": "$empsupdetails.userName",
                    "supname": "$empsupdetails.fullName",
                    "status": "$status",
                    "createdDate": "$createdAt",
                    "updatedBy": { $ifNull: [ "$updatedetails.fullName", "$createdetails.fullName" ] },
                    "updatedDate": "$updatedAt"


                }
            }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "KRA emp details count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getmtrdetail(req, res) {

        let queryObj = {
            "$match": {}
        };
        queryObj['$match']['$and'] = [];
        queryObj['$match']['$and'].push({
            $and: [{
                "createdAt": {
                    $gte: new Date(req.query.fromDate)
                }
            },
            {
                "createdAt": {
                    $lte: new Date(req.query.toDate)
                }
            }
            ]
        });

        MidTermMaster.aggregate([
            queryObj,
            {
                    "$facet" : {
                        "init_count" : [
                            {
                                "$match" : {
                                    "status" : "Initiated"
                                }
                            }, 
                            {
                                "$count" : "init_count"
                            }
                        ], 
                        "approved_count" : [
                            {
                                "$match" : {
                                    "status" : "Approved"
                                }
                            }, 
                            {
                                "$count" : "approved_count"
                            }
                        ],
                        "sendback_count" : [
                            {
                                "$match" : {
                                    "status" : "SendBack"
                                }
                            }, 
                            {
                                "$count" : "sendback_count"
                            }
                        ],
                        "submit_count" : [
                            {
                                "$match" : {
                                    "status" : "Submitted"
                                }
                            }, 
                            {
                                "$count" : "submit_count"
                            }
                        ],
                        "terminate_count" : [
                            {
                                "$match" : {
                                    "status" : "Terminated"
                                }
                            }, 
                            {
                                "$count" : "terminate_count"
                            }
                        ],
                    }
                },
                { 
                    "$project" : {
                        "init_count" : {
                            "$arrayElemAt" : [
                                "$init_count.init_count", 
                                0.0
                            ]
                        }, 
                        "approved_count" : {
                            "$arrayElemAt" : [
                                "$approved_count.approved_count", 
                                0.0
                            ]
                        },
                        "sendback_count" : {
                            "$arrayElemAt" : [
                                "$sendback_count.sendback_count", 
                                0.0
                            ]
                        },
                        "submit_count" : {
                            "$arrayElemAt" : [
                                "$submit_count.submit_count", 
                                0.0
                            ]
                        },
                        "terminate_count" : {
                            "$arrayElemAt" : [
                                "$terminate_count.terminate_count", 
                                0.0
                            ]
                        }
                    }
                }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "MTR workflow details count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getMtrEmpDetail(req, res) {

        let queryObj = {
            "$match": {}
        };
        queryObj['$match']['$and'] = [];
        queryObj['$match']['$and'].push({
            $and: [{
                "createdAt": {
                    $gte: new Date(req.query.fromDate)
                }
            },
            {
                "createdAt": {
                    $lte: new Date(req.query.toDate)
                }
            }
            ]
        });

        MidTermMaster.aggregate([
            queryObj,
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employees"
                }
            },
            {
                "$unwind": {
                    "path": "$employees", "preserveNullAndEmptyArrays": true
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
            {
                "$unwind": {
                    "path": "$supervisor", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "supervisor.primarySupervisorEmp_id",
                    "foreignField": "_id",
                    "as": "empsupdetails"
                }
            },
            {
                "$unwind": {
                    "path": "$empsupdetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "updatedBy",
                    "foreignField": "_id",
                    "as": "updatedetails"
                }
            },
            {
                "$unwind": {
                    "path": "$updatedetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "createdBy",
                    "foreignField": "_id",
                    "as": "createdetails"
                }
            },
            {
                "$unwind": {
                    "path": "$createdetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    "empName": "$employees.fullName",
                    "supname": "$empsupdetails.fullName",
                    "empId": "$employees.userName",
                    "supId": "$empsupdetails.userName",
                    "status": "$status",
                    "createdDate": "$createdAt",
                    "updatedBy": { $ifNull: [ "$updatedetails.fullName", "$createdetails.fullName" ] },
                    "updatedDate": "$updatedAt"

                }
            }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "MTR emp details count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getLearningStatuses(req, res) {

        let queryObj = {
            "$match": {}
        };
        queryObj['$match']['$and'] = [];
        queryObj['$match']['$and'].push({
            $and: [{
                "createdAt": {
                    $gte: new Date(req.query.fromDate)
                }
            },
            {
                "createdAt": {
                    $lte: new Date(req.query.toDate)
                }
            }
            ]
        });

        LearningMaster.aggregate([
            queryObj,
            {
                    "$facet" : {
                        "init_count" : [
                            {
                                "$match" : {
                                    "status" : "Initiated"
                                }
                            }, 
                            {
                                "$count" : "init_count"
                            }
                        ], 
                        "approved_count" : [
                            {
                                "$match" : {
                                    "status" : "Approved"
                                }
                            }, 
                            {
                                "$count" : "approved_count"
                            }
                        ],
                        "sendback_count" : [
                            {
                                "$match" : {
                                    "status" : "SendBack"
                                }
                            }, 
                            {
                                "$count" : "sendback_count"
                            }
                        ],
                        "submit_count" : [
                            {
                                "$match" : {
                                    "status" : "Submitted"
                                }
                            }, 
                            {
                                "$count" : "submit_count"
                            }
                        ],
                        "terminate_count" : [
                            {
                                "$match" : {
                                    "status" : "Terminated"
                                }
                            }, 
                            {
                                "$count" : "terminate_count"
                            }
                        ],
                    }
                },
                { 
                    "$project" : {
                        "init_count" : {
                            "$arrayElemAt" : [
                                "$init_count.init_count", 
                                0.0
                            ]
                        }, 
                        "approved_count" : {
                            "$arrayElemAt" : [
                                "$approved_count.approved_count", 
                                0.0
                            ]
                        },
                        "sendback_count" : {
                            "$arrayElemAt" : [
                                "$sendback_count.sendback_count", 
                                0.0
                            ]
                        },
                        "submit_count" : {
                            "$arrayElemAt" : [
                                "$submit_count.submit_count", 
                                0.0
                            ]
                        },
                        "terminate_count" : {
                            "$arrayElemAt" : [
                                "$terminate_count.terminate_count", 
                                0.0
                            ]
                        }
                    }
                }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "Learning workflow details count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getLearningEmpDetail(req, res) {

        let queryObj = {
            "$match": {}
        };
        queryObj['$match']['$and'] = [];
        queryObj['$match']['$and'].push({
            $and: [{
                "createdAt": {
                    $gte: new Date(req.query.fromDate)
                }
            },
            {
                "createdAt": {
                    $lte: new Date(req.query.toDate)
                }
            }
            ]
        });

        LearningMaster.aggregate([
            queryObj,
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employees"
                }
            },
            {
                "$unwind": {
                    "path": "$employees", "preserveNullAndEmptyArrays": true
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
            {
                "$unwind": {
                    "path": "$supervisor", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "supervisor.primarySupervisorEmp_id",
                    "foreignField": "_id",
                    "as": "empsupdetails"
                }
            },
            {
                "$unwind": {
                    "path": "$empsupdetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "updatedBy",
                    "foreignField": "_id",
                    "as": "updatedetails"
                }
            },
            {
                "$unwind": {
                    "path": "$updatedetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "createdBy",
                    "foreignField": "_id",
                    "as": "createdetails"
                }
            },
            {
                "$unwind": {
                    "path": "$createdetails", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    "empName": "$employees.fullName",
                    "supname": "$empsupdetails.fullName",
                    "empId": "$employees.userName",
                    "supId": "$empsupdetails.userName",
                    "status": "$status",
                    "createdDate": "$createdAt",
                    "updatedBy": { $ifNull: [ "$updatedetails.fullName", "$createdetails.fullName" ] },
                    "updatedDate": "$updatedAt"

                }
            }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "Learning emp details count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getEmployeeAge(req, res) {
        let emp = 36;

        EmployeePersonalDetails.aggregate([
            
            {
                "$match" : {
                    $expr:{ $and: [{"$gt":[{"$subtract":[new Date(), "$dob"]}, 1000*60*60*24*365*59]}, {"$lt":[{"$subtract":[new Date(), "$dob"]}, 1000*60*60*24*365*60]}]}
                }
            },
            {
                $count: "retire"
            }
           
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "count of emp older than 59 Years",
                result: {
                  message: data
                }
              });
            }
        
          });
        
    }

    function getEmpCountByGrades(req, res) {

        EmployeeDetails.aggregate([
            { "$lookup": {
                "from": "grades",
                "localField": "grade_id",
                "foreignField": "_id",
                "as": "gradeinfo"
            }},
            {"$group" : {_id:"$grade_id", count: {$sum:1}, gradeName: {$first: "$gradeinfo.gradeName"}}}
            
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "Emp grades count",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    function getEmpInfosAndGrade(req, res) {

        EmployeeDetails.aggregate([

            { "$lookup": {
                "from": "grades",
                "localField": "grade_id",
                "foreignField": "_id",
                "as": "gradeinfo"
            }},
            {
                "$unwind": {
                    "path": "$gradeinfo", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "designations",
                    "localField": "designation_id",
                    "foreignField": "_id",
                    "as": "designation"
                }
            },
            {
                "$unwind": {
                    "path": "$designation", "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    "empName": "$fullName",
                    "empId": "$userName",
                    "gradeName": "$gradeinfo.gradeName",
                    "designation": "$designation.designationName"

                }
            }
        ]).exec(function (err, data) {
            if (err) {
              return res.status(403).json({
                title: "There was a Problem",
                error: {
                  message: err
                },
                result: {
                  message: data
                }
        
              });
            } else {
              return res.status(200).json({
                title: "Emp grades details",
                result: {
                  message: data
                }
              });
            }
        
          });
    }

    let functions = {

        getHrEmpratio: (req, res) => {

            getHrEmpRatio(req, res);
        },
        getEmpType: (req, res) => {

            getEmpTypeRatio(req, res);
        },
        getKraDetails: (req, res) => {

            getKraDetail(req, res);
        },
        getEmpDetails: (req, res) => {

            getEmpDetail(req, res);
        },
        germtrdetails: (req, res) => {

            getmtrdetail(req, res);
        },
        getMtrEmpDetails: (req, res) => {

            getMtrEmpDetail(req, res);
        },
        getLearningStatus: (req, res) => {

            getLearningStatuses(req, res);
        },
        getLearningEmpDetails: (req, res) => {

            getLearningEmpDetail(req, res);
        },
        getEmpAge: (req, res) => {

            getEmployeeAge(req, res);
        },
        getEmpCountByGrade: (req, res) => {

            getEmpCountByGrades(req, res);
        },
        getEmpInfoAndGrade: (req, res) => {

            getEmpInfosAndGrade(req, res);
        }
    }

    module.exports = functions;