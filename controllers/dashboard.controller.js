let Role = require("../models/master/role.model"),
    EmpRoleDetails = require("../models/employee/employeeRoleDetails.model"),
    EmpOfficedetails = require("../models/employee/employeeOfficeDetails.model"),
    KraWorkflowDetails = require("../models/kra/kraWorkFlowDetails.model");




    
    

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
                                "role_id" : 6.0
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

    let functions = {

        getHrEmpratio: (req, res) => {

            getHrEmpRatio(req, res);
        },
        getEmpType: (req, res) => {

            getEmpTypeRatio(req, res);
        },
        getKraDetails: (req, res) => {

            getKraDetail(req, res);
        }
    }

    module.exports = functions;