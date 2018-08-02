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
    Employee = require('../models/employee/employeeDetails.model'),
    EmailDetails = require('../class/sendEmail'),
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
                let leaveType = ["Annual Leave", "Sick Leave", "Maternity Leave", "Special Leave"]
                results1.forEach((x) => {
                    const balLeaveObj = results2.find(p => p._id === x.leave_type);
                    obj = {

                        'leaveType': leaveType[x.leave_type-1],
                        'appliedLeave': Math.round( (balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)),
                        'allotedLeave': Math.round(x.balance)
                    };
                    response.push(obj);

                })
                results2.forEach((x) => {
                    const balLeaveObj = results1.find(p => p.leave_type === x._id);
                     if (balLeaveObj === undefined) {
                        obj = {
                            'leaveType': leaveType[x.leave_type-1],
                            'appliedLeave': Math.round(x.totalAppliedLeaves),
                            'allotedLeave': Math.round(balLeaveObj.balance)
                        };
                        response.push(obj);
                     }
                })
                leaveType.forEach((x) => {

                    let result = response.filter(obj => {
                      return obj.leaveType === x
                    })
                    if (result.length == 0) {
                        response.push({
                            'leaveType': x,
                            'appliedLeave': 0,
                            'allotedLeave': 0
                           })
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
function applyLeave(req, res, done) {
    let startd = new Date(new Date(req.body.fromDate).getTime() + 86400000),
          endd = new Date(new Date(req.body.toDate).getTime() + 86400000);
    let flag = true;
    let message;
    const query = {
        $or: [{
            emp_id: req.body.emp_id,
            leave_type: req.body.leave_type,
            status: null
        },
        {
            emp_id: req.body.emp_id,
            leave_type: req.body.leave_type,
            status: "Approved"

        }]
    };
    let minusDayStart = new Date(startd.getTime() - 86400000);
    let minusDayEnd = new Date(endd.getTime() - 86400000);
    LeaveHoliday.find({
        $or:[{
            $and:
                [{"date": {$gt: minusDayStart}},
                {"date": {$lte: startd}}]
        },{
             $and:[{"date": {$gt: minusDayEnd}},
             {"date": {$lte: endd}}]
        }]
    }, function (err, details) {
        if (err) {
            flag = false;
            message = err.message;
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: message
                },
                result: {
                    message: message
                }
            });
        } else if (details.length > 0) {
            flag = false;
            message = "You cannot apply on holiday"
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: message
                },
                result: {
                    message: message
                }
            });

        } else {

            LeaveApply.find(query, function (err, details) {
                const sd = new Date(new Date(req.body.fromDate) + 86400000),
                      ed = new Date(new Date(req.body.toDate) + 86400000);
                for (let i = 0; i < details.length; i++) {
                let fromDate =  new Date(details[i].fromDate),
                    toDate =  new Date(details[i].toDate);
                    if (details[i].status == null  || details[i].status == undefined) {
                        if ((sd >= fromDate && ed <= toDate) ||
                            (sd <= fromDate && ed >= fromDate) ||
                            (sd <= toDate && ed >= toDate)) {
                            flag = false;
                            message = "Already applied";
                        }
                    }
                }
                let sdDay = sd.getDay(),
                    edDay = ed.getDay();
                if (sd.getD == 0 || sdDay == 6 || edDay == 0 || edDay == 1) {
                    message = "you can not apply leave on weekends";
                }
                let d = new Date();
                d.setDate(d.getDate()+7);
                if ((((ed - sd)/86400000 + 1) > 3) && (req.body.leave_type == 1) && sd <= d) {
                    flag = false;
                    message = "Annual Leave should be applied in seven days advance";
                }
                if (flag) {
                    let leavedetails = new LeaveApply(req.body);
                    leavedetails.emp_id = req.body.emp_id || req.query.emp_id;
                    leavedetails.status = req.body.status;
                    leavedetails.createdBy = parseInt(req.body.emp_id);
                    leavedetails.fromDate = sd;
                    leavedetails.toDate = ed;
                    leavedetails.updatedBy = parseInt(req.body.updatedBy);
                    leavedetails.days = (leavedetails.toDate - leavedetails.fromDate)/86400000 + 1
                    leavedetails.save(function (err, leavesInfoData) {
                        if (err) {
                            return res.status(403).json({
                                title: 'There is a problem',
                                error: {
                                    message: err
                                },
                                result: {
                                    message: leavesInfoData
                                }
                            });
                        }
                        leaveWorkflowDetails(leavesInfoData, req.body.updatedBy, 'applied');

                        if (req.body.emailTo && req.body.emailTo != "") {
                            var ccToList = req.body.emailTo.split(',');

                            ccToList.forEach((x) => {
                                try {
                                    var emailWithName = x.split('~');
                                    EmailDetails.sendToCCEmail(emailWithName[1], emailWithName[0]);
                                }
                                catch (e) {
                                }
                            })
                        }
                        return done(err, leavesInfoData);
                    });
                } else {
                    return res.status(403).json({
                        title: 'There is a problem',
                        error: {
                            message: message
                        },
                        result: {
                            message: message
                        }
                    });
                }

            });
        }
    });
}
function leaveWorkflowDetails(req, applied_by_id, step) {
    let _LeaveWorkflowDetails = new LeaveWorkflowHistory(req._doc);
    _LeaveWorkflowDetails.emp_id = parseInt(req._doc.emp_id);
    _LeaveWorkflowDetails.Owner = parseInt(applied_by_id);
    _LeaveWorkflowDetails.appliedLeaveId = parseInt(req._doc.leave_type);
    _LeaveWorkflowDetails.updatedAt = new Date(req._doc.updatedAt);
    _LeaveWorkflowDetails.Step = step;
    switch (step) {
        case 'applied':
            _LeaveWorkflowDetails.Status = 'pending';
            break;
        case 'cancelled':
            _LeaveWorkflowDetails.Status = 'Cancelled';


    }
    try {
        _LeaveWorkflowDetails.save(function (err, leavesInfoData) {
            if (err) {
            }
        });
    } catch (e) {
    }

}
let functions = {
    getLeaveBalance: (req, res) => {
        singleEmployeeLeaveBalance(req.query.empId, req.query.fiscalYearId, res);
    },
    postApplyLeave: (req, res) => {
        async.waterfall([
            function (done) {
                applyLeave(req, res, done);
            },
            function (_applyLeaveDetails, done) {
                return res.status(200).json(_applyLeaveDetails);
            }
        ])
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