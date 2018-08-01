let express = require('express'),

    LeaveWorkflowHistory = require('../models/leave/leaveWorkflowHistory.model'),
    LeaveDetailsCarryForward = require('../models/master/leaveDetailsCarryForward.model');
    LeaveApply = require('../models/leave/leaveApply.model'),
    LeaveHoliday = require('../models/leave/leaveHoliday.model'),
    LeaveTransactionType = require('../models/leave/leaveTransactioType.model'),
    PersonalInfo = require('../models/employee/employeePersonalDetails.model'),
    LeaveTypes = require('../models/leave/leaveTypes.model'),
    Department = require('../models/master/department.model'),
    OfficeDetails = require('../models/employee/employeeOfficeDetails.model'),
    LeaveBalance = require('../models/leave/EmployeeLeaveBalance.model'),
    EmployeeRoles = require('../models/master/role.model'),
    Employee = require('../models/employee/employeeDetails.model');
    EmailDetails: require('../class/sendEmail'),
    commonService = require('../controllers/common.controller'),
    userService = require('../controllers/user.controller'),
    EmployeeInfo = require('../models/employee/employeeDetails.model'),
    FinancialYear = require('../models/master/financialYear.model'),
    config = require('../config/config'),
    crypto = require('crypto'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    uuidV1 = require('uuid/v1');
require('dotenv').load()
function singleEmployeeLeaveBalance(currentEmpId, fiscalYearId, res) {
    let empId = parseInt(currentEmpId);
    console.log("parseint")
    let _fiscalYearId = parseInt(fiscalYearId);
    LeaveBalance.aggregate(
        // Pipeline
        [
            // Stage 1
            {
                $match: {
                    $or: [{ "emp_id": empId, "fiscalYearId": _fiscalYearId, "leave_type": 1 },
                    { "emp_id": empId, "fiscalYearId": _fiscalYearId, "leave_type": 2 },
                    { "emp_id": empId, "leave_type": 3 },
                    { "emp_id": empId, "leave_type": 4 }]

                }
            },

            // Stage 2
            {
                $project: {
                    leave_type: 1,
                    balance: 1
                }
            },

        ]
    ).exec(function (err, results1) {
        if (err) {
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: results1
                }
            });
        }
        LeaveApply.aggregate(// Pipeline
            [
                // Stage 1
                {
                    $match: {
                        "emp_id": empId,

                        // "isApproved": true
                    }
                },

                // Stage 2
                {
                    $addFields: {
                        "diffDate": { $subtract: ["$toDate", "$fromDate"] }
                    }
                },

                // Stage 3
                {
                    $addFields: {
                        "intDate": { $add: [{ $divide: ["$diffDate", 86400000] }, 1] }
                    }
                },

                {
                    "$match": {
                        $or: [
                            { "status": "Applied" }, //leave approved
                            { "status": "Applied (Pending)" }, //leave approved and pending to approve cancellation
                            { "status": null} //when leave applied
                            //{ "isApproved": true, "isCancelled": true} //leave approved and cancel approved --not counted
                            //{ "isApproved": null, "isCancelled": true} //leave applied and cancel approved  --not counted
                            //{ "isApproved": false } //leave applied and rejected  --not counted
                        ]
                    }
                },
                // Stage 4
                {
                    $group: {
                        _id: "$leave_type",
                        totalAppliedLeaves: { $sum: "$intDate" }
                    }
                },

            ]).exec(function (err1, results2) {
                if (err1) {
                    return res.status(403).json({
                        title: 'Error',
                        error: {
                            message: err1
                        },
                        result: {
                            message: results2
                        }
                    });
                }
                let response = [];
                console.log("results1=>",results1)
                console.log("results2=>",results2)
                results1.forEach((x) => {
                    const balLeaveObj = results2.find(p => p._id === x.leave_type);
                    console.log(balLeaveObj)
                    obj = {

                        'leaveType': x.leave_type,
                        'leaveBalance': Math.round((x.balance - (balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves))),
                        'totalLeave': Math.round(x.balance)
                    };
                    response.push(obj);

                })
                results2.forEach((x) => {
                    const balLeaveObj = results1.find(p => p.leave_type === x._id);
                     if (balLeaveObj === undefined) {
                        obj = {
                            'leaveType': x._id,
                            'appliedLeave': Math.round(x.totalAppliedLeaves)
                        };
                        response.push(obj);
                     }
                })
                return res.status(200).json(response);
            })
    });
}
function getLeavesByType(leaveTypesData, appliedLeaves, res) {
    let response = [];
    leaveTypesData.forEach((type) => {
        const leaves = appliedLeaves.filter(leave => (leave.leave_type == type.id));
        response.push({
            "types": type.type,
            "leaves": leaves
        })
    });
    return res.status(200).json(response);
}
let functions = {
    getLeaveBalance: (req, res) => {
        singleEmployeeLeaveBalance(req.query.empId, req.query.fiscalYearId, res);
    },
    getLeaveTypes: (req, res) => {
        let query = {
            'isDeleted': false
        };
        LeaveTypes.find(query, function (err, leaveTypesData) {
            if (leaveTypesData) {
                return res.status(200).json(leaveTypesData);
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
}


module.exports = functions;