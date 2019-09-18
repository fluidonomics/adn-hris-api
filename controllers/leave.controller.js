let express = require('express'),
    _ = require('lodash');
LeaveWorkflowHistory = require('../models/leave/leaveWorkflowHistory.model'),
    LeaveDetailsCarryForward = require('../models/master/leaveDetailsCarryForward.model'),
    LeaveApply = require('../models/leave/leaveApply.model'),
    LeaveMaster = require('../models/leave/leaveApplyMaster.model'),
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
    SupervisorInfo = require('../models/employee/employeeSupervisorDetails.model'),
    uploadController = require('./upload.controller'),
    uploadClass = require('../class/upload'),
    moment = require('moment'),
    config = require('../config/config'),
    crypto = require('crypto'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    uuidV1 = require('uuid/v1'),
    SendEmail = require('../class/sendEmail'),
    // json2xls = require('json2xls');
    // fs = require('fs');
    xlsx2json = require('xlsx2json'),
    XLSX = require('xlsx'),
    dateFn = require('date-fns');
require('dotenv').load()

function getAllLeaveBalance(req, res) {
    let _fiscalYearId = (req.query.fiscalYearId);
    let year = (req.query.year);
    let month = (req.query.month);
    let fromDate = (req.query.fromDate);
    let endDate = (req.query.toDate);
    let projectQuery = {
        $project: {
            emp_id: 1,
            fiscalYearId: 1,
            leave_type: 1,
            balance: 1,
            startDate: 1,
            endDate: 1,
            monthStart: {
                $month: '$startDate'
            },
            yearStart: {
                $year: '$startDate'
            }
        }
    };
    let queryObj = {
        '$match': {}
    };
    queryObj['$match']['$and'] = [{
        "isDeleted": false
    }]
    let query = {};
    if (month != null && month != undefined) {
        queryObj['$match']['$and'].push({
            "monthStart": parseInt(month)
        })
    }
    if (year != null && year != undefined) {
        queryObj['$match']['$and'].push({
            "yearStart": parseInt(year)
        })
    }
    let toDate = new Date(endDate);
    toDate.setDate(toDate.getDate() + 1)
    let queryForDate = {
        '$match': {}
    };
    queryForDate['$match']['$and'] = [{
        "isDeleted": false
    }]
    if (fromDate && endDate) {
        queryForDate['$match']['$and'].push({
            $and: [{
                "fromDate": {
                    $gte: new Date(fromDate)
                }
            },
            {
                "fromDate": {
                    $lte: toDate
                }
            }
            ]
        });
    }
    if (year != null && year != undefined) {
        query = {
            $match: {
                $or: [{
                    "yearStart": parseInt(year),
                    "leave_type": 1
                },
                {
                    "yearStart": parseInt(year),
                    "leave_type": 2
                },
                {
                    "leave_type": 3
                },
                {
                    "leave_type": 4
                }
                ]

            }
        }
    } else if (_fiscalYearId != null && _fiscalYearId != undefined) {
        console.log("_fiscalYearId")
        query = {
            $match: {
                $or: [{
                    "fiscalYearId": parseInt(_fiscalYearId),
                    "leave_type": 1
                },
                {
                    "fiscalYearId": parseInt(_fiscalYearId),
                    "leave_type": 2
                },
                {
                    "leave_type": 3
                },
                {
                    "leave_type": 4
                }
                ]

            }
        }
    } else {
        query = {
            $match: {
                $or: [{
                    "leave_type": 1
                },
                {
                    "leave_type": 2
                },
                {
                    "leave_type": 3
                },
                {
                    "leave_type": 4
                }
                ]

            }
        }
    }
    console.log(query)
    LeaveBalance.aggregate(
        // Pipeline
        [projectQuery,
            query,
            // matchQuery,
            {
                $group: {
                    _id: "$leave_type",
                    totalBalance: {
                        $sum: "$balance"
                    }
                }
            },
        ]
    ).exec(function (err, results1) {
        console.log(results1)
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
        LeaveApply.aggregate( // Pipeline
            [{
                $project: {
                    emp_id: 1,
                    leave_type: 1,
                    status: 1,
                    toDate: 1,
                    fromDate: 1,
                    days: 1,
                    isDeleted: 1,
                    attachment: 1,
                    monthStart: {
                        $month: '$fromDate'
                    },
                    yearStart: {
                        $year: '$fromDate'
                    }
                }
            },
                queryForDate,
                queryObj,

            {
                "$match": {
                    $or: [{
                        "status": "Applied"
                    }, //leave approved
                    {
                        "status": "Approved"
                    }, //leave approved and pending to approve cancellation
                    {
                        "status": "Pending Withdrawal"
                    }, //apply for withdraw leave,
                    {
                        "status": "Pending Cancellation"
                    }, //apply for cancel leave,
                    {
                        "status": "System Approved"
                    } //apply for cancel leave,
                    ]
                }
            },
            // Stage 4
            {
                $group: {
                    _id: "$leave_type",
                    totalAppliedLeaves: {
                        $sum: "$days"
                    }
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
                    const balLeaveObj = results2.find(p => p._id === x._id);
                    obj = {
                        'leaveTypeId': x._id,
                        'leaveType': leaveType[x._id - 1],
                        'appliedLeave': Math.round((balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)),
                        'totalBalance': Math.round(x.totalBalance),
                        'percentage': Math.round((balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)) * 100 / Math.round(x.totalBalance),
                        // 'leaveBalance': Math.round(x.totalBalance) - (Math.round( (balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)))
                    };
                    response.push(obj);

                })
                results2.forEach((x) => {
                    const balLeaveObj = results1.find(p => p._id === x._id);
                    if (balLeaveObj === undefined) {
                        obj = {
                            'leaveTypeId': x._id,
                            'leaveType': leaveType[x._id - 1],
                            'appliedLeave': Math.round(x.totalAppliedLeaves),
                            'allotedLeave': (x.balance == null || x.balance == undefined) ? 0 : Math.round(x.balance),
                            'totalBalance': (x.balance == null || x.balance == undefined) ? 0 : Math.round(x.balance) - Math.round(x.totalAppliedLeaves),
                            'percentage': (x.balance == null || x.balance == undefined) ? 0 : Math.round(x.balance) * 100 / (x.balance == null || x.balance == undefined) ? 0 : Math.round(x.balance) - Math.round(x.totalAppliedLeaves)
                        };
                        response.push(obj);
                    }
                })
                leaveType.forEach((x, index) => {
                    let result = response.filter((obj) => {
                        return obj.leaveType === x
                    })
                    if (result.length == 0) {
                        response.push({
                            '_id': parseInt(index) + 1,
                            'leaveType': x,
                            'appliedLeave': 0,
                            'allotedLeave': 0,
                            'leaveBalance': 0,
                            'percentage': 0
                        })
                    }

                })

                return res.status(200).json(response);
            })
    });
}

function singleEmployeeLeaveBalance(currentEmpId, fiscalYearId, fromDate, endDate, res) {
    let empId = parseInt(currentEmpId);
    let _fiscalYearId = parseInt(fiscalYearId);
    let projectQuery = {
        $project: {
            emp_id: 1,
            fiscalYearId: 1,
            leave_type: 1,
            balance: 1,
            startDate: 1,
            endDate: 1,
            monthStart: {
                $month: '$startDate'
            },
            yearStart: {
                $year: '$startDate'
            },
            paid: 1,
            unpaid: 1,
            isAvailed: 1
        }
    };

    let toDate = new Date(endDate);
    toDate.setDate(toDate.getDate() + 1)
    let queryForDate = {
        '$match': {}
    };
    queryForDate['$match']['$and'] = [{
        "emp_id": empId
    }]
    if (fromDate && endDate) {
        queryForDate['$match']['$and'].push({
            $and: [{
                "fromDate": {
                    $gte: new Date(fromDate)
                }
            },
            {
                "fromDate": {
                    $lte: toDate
                }
            }
            ]
        });
    }

    let querySpecial = {
        $match: {
            $or: [{
                "emp_id": empId,
                "leave_type": 3
            },
            {
                "emp_id": empId,
                "leave_type": 4
            }]
        }
    }

    async.waterfall([
        (done) => {
            let query = {
                $match: {
                    $or: [{
                        "emp_id": empId,
                        "leave_type": 1,
                        "fiscalYearId": _fiscalYearId
                    },
                    {
                        "emp_id": empId,
                        "leave_type": 2,
                        "fiscalYearId": _fiscalYearId
                    },
                    {
                        "emp_id": empId,
                        "leave_type": 3,
                        "isAvailed": false
                    },
                    {
                        "emp_id": empId,
                        "leave_type": 4,
                        "isAvailed": false
                    }]
                }
            };
            LeaveBalance.aggregate(
                [
                    query,
                    projectQuery
                ]
            ).exec(function (err, leaveBalances) {
                done(err, leaveBalances);
            });
        },
        (leaveBalances, done) => {
            LeaveApply.aggregate( // Pipeline
                [{
                    $match: {
                        "emp_id": empId,
                    }
                },
                {
                    "$match": {
                        $or: [{
                            $and: [{
                                "leave_type": { $in: [1, 2] }
                            },
                            {
                                "status": { $in: ["Applied", "Approved", "Pending Withdrawal", "Pending Cancellation", "System Approved"] }
                            },
                            {
                                "fiscalYearId": _fiscalYearId
                            }]
                        },
                        {
                            $and: [{
                                "leave_type": { $in: [3, 4] }
                            },
                            {
                                "status": { $in: ["Applied", "Pending Withdrawal", "Pending Cancellation"] }
                            }]
                        }]
                    }
                },
                    queryForDate,
                {
                    $project: {
                        emp_id: 1,
                        leave_type: 1,
                        status: 1,
                        toDate: 1,
                        fromDate: 1,
                        days: 1,
                        attachment: 1,
                        monthStart: {
                            $month: '$fromDate'
                        },
                        yearStart: {
                            $year: '$fromDate'
                        },
                        fiscalYearId: 1
                    }
                },
                // Stage 4
                {
                    $group: {
                        _id: "$leave_type",
                        totalAppliedLeaves: {
                            $sum: "$days"
                        }
                    }
                }
                ]).exec(function (err, appliedLeaves) {
                    done(err, { leaveBalances: leaveBalances, appliedLeaves: appliedLeaves });
                });
        },
        (leaveData, done) => {
            let finalBalances = [];
            let leaveType = ["Annual Leave", "Sick Leave", "Maternity Leave", "Special Leave"]
            if (leaveData.leaveBalances && leaveData.leaveBalances.length > 0) {
                leaveData.leaveBalances.forEach((x) => {
                    const balLeaveObj = leaveData.appliedLeaves.find(p => p._id === x.leave_type);
                    obj = {
                        'leaveTypeId': x.leave_type,
                        'leaveType': leaveType[x.leave_type - 1],
                        'appliedLeave': Math.round((balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)),
                        'allotedLeave': Math.round(x.balance),
                        'leaveBalance': Math.round(x.balance) - (Math.round((balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)))
                    };
                    finalBalances.push(obj);
                });
            }
            done(null, finalBalances);
        }
    ], (err, response) => {
        if (err) {
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: response
                }
            });
        }
        return res.status(200).json(response);
    })
}

getLeaveTransaction: (req, res) => {
    let query = {
        isDeleted: false
    }
    var transactionProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    LeaveTransactionType.find(query, transactionProjection, {
        sort: {
            _id: 1
        }
    }, function (err, leaveTransactionTypeData) {
        if (leaveTransactionTypeData) {
            return res.status(200).json(leaveTransactionTypeData);
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
};

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
    let fromDateBody = moment(req.body.fromDate + ' UTC').utc().format();
    let toDateBody = moment(req.body.toDate + ' UTC').utc().format();
    let startd = new Date(new Date(req.body.fromDate).getTime() + 86400000),
        endd = new Date(new Date(req.body.toDate).getTime() + 86400000);
    let flag = true;
    let message;
    const query = {
        $or: [{
            emp_id: parseInt(req.body.emp_id),
            status: null
        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Approved"

        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Applied"

        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Pending Withdrawal"

        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Pending Cancellation"

        }
        ]
    };
    let minusDayStart = new Date(startd.getTime() - 86400000);
    let minusDayEnd = new Date(endd.getTime() - 86400000);
    LeaveHoliday.find({
        $or: [{
            $and: [{
                "date": {
                    $gt: minusDayStart
                }
            },
            {
                "date": {
                    $lte: startd
                }
            }
            ]
        }, {
            $and: [{
                "date": {
                    $gt: minusDayEnd
                }
            },
            {
                "date": {
                    $lte: endd
                }
            }
            ]
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
                for (let i = 0; i < details.length; i++) {
                    let fromDate = moment(details[i].fromDate + ' UTC').utc().format(),
                        toDate = moment(details[i].toDate + 'UTC').utc().format();
                    let fromDateMongo = new Date(new Date(fromDate).getFullYear(), new Date(fromDate).getMonth(), new Date(fromDate).getDate()),
                        toDateMongo = new Date(new Date(toDate).getFullYear(), new Date(toDate).getMonth(), new Date(toDate).getDate());
                    let fromDateApi = new Date(new Date(fromDateBody).getFullYear(), new Date(fromDateBody).getMonth(), new Date(fromDateBody).getDate()),
                        toDateApi = new Date(new Date(toDateBody).getFullYear(), new Date(toDateBody).getMonth(), new Date(toDateBody).getDate());
                    if ((fromDateApi >= fromDateMongo && toDateApi <= toDateMongo) ||
                        (fromDateApi <= fromDateMongo && toDateApi >= fromDateMongo) ||
                        (fromDateApi <= toDateMongo && toDateApi >= toDateMongo)) {
                        flag = false;
                        message = "Already applied";
                    }
                }
                let sdDay = moment(fromDateBody).day(),
                    edDay = moment(toDateBody).day();
                if (sdDay == 5 || sdDay == 6 || edDay == 5 || edDay == 6) {
                    flag = false;
                    message = "You can not apply leave on weekends";
                }
                let d = moment(moment().add(7, 'days').format('YYYY-MM-DD') + ' UTC').utc().format();

                if (((moment(toDateBody).diff(fromDateBody, 'days') + 1) > 3) && (req.body.leave_type == 1) && fromDateBody <= d && req.body.emp_id == req.body.apply_by_id && req.body.userType == 'employee') {
                    flag = false;
                    message = "Annual Leave should be applied in seven days advance";
                }
                if (flag) {
                    let data = {
                        fromDateBody: fromDateBody,
                        toDateBody: toDateBody
                    }
                    createLeave(req, data).then(leaveData => {
                        leaveWorkflowDetails(leaveData, req.body.updatedBy, 'applied');

                        if (req.body.emailTo && req.body.emailTo != "") {
                            var ccToList = req.body.emailTo.split(',');

                            ccToList.forEach((x) => {
                                try {
                                    var emailWithName = x.split('~');
                                    EmailDetails.sendToCCEmail(emailWithName[1], emailWithName[0]);
                                } catch (e) { }
                            })
                        }

                        let queryForFindEmployee = {
                            _id: req.body.emp_id,
                            isDeleted: false
                        }
                        EmployeeInfo.findOne(queryForFindEmployee, function (err, employeee) {
                            if (err) {
                                // Do nothing
                            }
                            let queryForFindSupervisor = {
                                _id: req.body.supervisor_id,
                                isDeleted: false
                            }
                            EmployeeInfo.findOne(queryForFindSupervisor, function (err, supervisor) {
                                if (err) {
                                    // Nothing
                                }
                                if (supervisor != null) {
                                    let queryForFindSupervisorOfficeDetail = {
                                        emp_id: supervisor._id,
                                        isDeleted: false
                                    }
                                    OfficeDetails.find(queryForFindSupervisorOfficeDetail, function (err, supervisorOfficeDetail) {
                                        if (err) {
                                            // Nothing
                                        }
                                        if (supervisorOfficeDetail.length > 0 && supervisorOfficeDetail[0]['officeEmail'] != null) {

                                            let queryForFindLeaveType = {
                                                _id: req.body.leave_type,
                                                isDeleted: false
                                            }

                                            LeaveTypes.findOne(queryForFindLeaveType, function (err, leaveType) {
                                                if (err) {
                                                    // Do nothing
                                                }

                                                if (req.body.apply_by_id != req.body.emp_id) {
                                                    let queryForEmployeeOfficeDetails = {
                                                        _id: req.body.emp_id,
                                                        isDeleted: false
                                                    }
                                                    OfficeDetails.findOne(queryForEmployeeOfficeDetails, function (err, officeDetails) {
                                                        if (err) {

                                                        }
                                                        let queryForAppliedByData = {
                                                            _id: req.body.apply_by_id,
                                                            isDeleted: false
                                                        }
                                                        EmployeeInfo.findOne(queryForAppliedByData, function (err, appliedByDetails) {
                                                            if (err) {

                                                            }
                                                            let appliedLeaveId = leaveData._id;
                                                            let linktoSend = req.body.link + '/' + appliedLeaveId;
                                                            let data = {
                                                                fullName: supervisor.fullName,
                                                                empName: employeee.fullName,
                                                                appliedBy: appliedByDetails.fullName,
                                                                leaveType: leaveType.type,
                                                                appliedDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                fromDate: req.body.fromDate,
                                                                toDate: req.body.toDate,
                                                                action_link: linktoSend
                                                            }
                                                            SendEmail.sendEmailToSuprsvrNotifyAppliedLeave(supervisorOfficeDetail[0]['officeEmail'], data);
                                                            data = {
                                                                fullName: employeee.fullName,
                                                                appliedBy: appliedByDetails.fullName,
                                                                leaveType: leaveType.type,
                                                                appliedDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                fromDate: req.body.fromDate,
                                                                toDate: req.body.toDate,
                                                                action_link: linktoSend
                                                            }
                                                            SendEmail.sendEmailToEmployeeNotifyAppliedLeave(officeDetails['officeEmail'], data);
                                                        })

                                                    })
                                                } else {
                                                    let appliedLeaveId = leaveData._id;
                                                    let linktoSend = req.body.link + '/' + appliedLeaveId;
                                                    let data = {
                                                        fullName: supervisor.fullName,
                                                        empName: employeee.fullName,
                                                        appliedBy: employeee.fullName,
                                                        leaveType: leaveType.type,
                                                        appliedDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                        fromDate: req.body.fromDate,
                                                        toDate: req.body.toDate,
                                                        action_link: linktoSend
                                                    }


                                                    SendEmail.sendEmailToSuprsvrNotifyAppliedLeave(supervisorOfficeDetail[0]['officeEmail'], data);

                                                }
                                            });
                                        }
                                    })
                                }
                            });
                        });
                        return done(err, leaveData);
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

function applyLeaveMaternitySpecial(req, res, done) {
    let dates = [moment(req.body.fromDate), moment(req.body.toDate)];
    let additionalLeaves = req.body.additionalLeaves;
    additionalLeaves.forEach(leave => {
        dates.push(moment(leave.fromDate));
        dates.push(moment(leave.toDate));
    })
    let minFromDate = moment.min(dates).toDate();
    let maxToDate = moment.max(dates).toDate();

    let fromDateBody = moment(minFromDate + ' UTC').utc().format();
    let toDateBody = moment(maxToDate + ' UTC').utc().format();
    let startd = new Date(new Date(minFromDate).getTime() + 86400000),
        endd = new Date(new Date(maxToDate).getTime() + 86400000);
    let flag = true;
    let message;
    const query = {
        $or: [{
            emp_id: parseInt(req.body.emp_id),
            status: null
        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Approved"

        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Applied"

        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Pending Withdrawal"

        },
        {
            emp_id: parseInt(req.body.emp_id),
            status: "Pending Cancellation"

        }
        ]
    };
    let minusDayStart = new Date(startd.getTime() - 86400000);
    let minusDayEnd = new Date(endd.getTime() - 86400000);
    LeaveHoliday.find({
        $or: [{
            $and: [{
                "date": {
                    $gt: minusDayStart
                }
            },
            {
                "date": {
                    $lte: startd
                }
            }
            ]
        }, {
            $and: [{
                "date": {
                    $gt: minusDayEnd
                }
            },
            {
                "date": {
                    $lte: endd
                }
            }
            ]
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
                for (let i = 0; i < details.length; i++) {
                    let fromDate = moment(details[i].fromDate + ' UTC').utc().format(),
                        toDate = moment(details[i].toDate + 'UTC').utc().format();
                    let fromDateMongo = new Date(new Date(fromDate).getFullYear(), new Date(fromDate).getMonth(), new Date(fromDate).getDate()),
                        toDateMongo = new Date(new Date(toDate).getFullYear(), new Date(toDate).getMonth(), new Date(toDate).getDate());
                    let fromDateApi = new Date(new Date(fromDateBody).getFullYear(), new Date(fromDateBody).getMonth(), new Date(fromDateBody).getDate()),
                        toDateApi = new Date(new Date(toDateBody).getFullYear(), new Date(toDateBody).getMonth(), new Date(toDateBody).getDate());
                    if ((fromDateApi >= fromDateMongo && toDateApi <= toDateMongo) ||
                        (fromDateApi <= fromDateMongo && toDateApi >= fromDateMongo) ||
                        (fromDateApi <= toDateMongo && toDateApi >= toDateMongo)) {
                        flag = false;
                        message = "Already applied";
                    }
                }
                let sdDay = moment(fromDateBody).day(),
                    edDay = moment(toDateBody).day();
                if (sdDay == 5 || sdDay == 6 || edDay == 5 || edDay == 6) {
                    flag = false;
                    message = "You can not apply leave on weekends";
                }
                let d = moment(moment().add(7, 'days').format('YYYY-MM-DD') + ' UTC').utc().format();

                if (((moment(toDateBody).diff(fromDateBody, 'days') + 1) > 3) && (req.body.leave_type == 1) && fromDateBody <= d && req.body.emp_id == req.body.apply_by_id) {
                    flag = false;
                    message = "Annual Leave should be applied in seven days advance";
                }
                if (flag) {
                    let data = {
                        fromDateBody: fromDateBody,
                        toDateBody: toDateBody
                    }
                    createLeave(req, data).then(leaveData => {
                        if (req.body.emailTo && req.body.emailTo != "") {
                            var ccToList = req.body.emailTo.split(',');

                            ccToList.forEach((x) => {
                                try {
                                    var emailWithName = x.split('~');
                                    EmailDetails.sendToCCEmail(emailWithName[1], emailWithName[0]);
                                } catch (e) { }
                            })
                        }

                        let queryForFindEmployee = {
                            _id: req.body.emp_id,
                            isDeleted: false
                        }
                        EmployeeInfo.findOne(queryForFindEmployee, function (err, employeee) {
                            if (err) {
                                // Do nothing
                            }
                            let queryForFindSupervisor = {
                                _id: req.body.supervisor_id,
                                isDeleted: false
                            }
                            EmployeeInfo.findOne(queryForFindSupervisor, function (err, supervisor) {
                                if (err) {
                                    // Nothing
                                }
                                if (supervisor != null) {
                                    let queryForFindSupervisorOfficeDetail = {
                                        emp_id: supervisor._id,
                                        isDeleted: false
                                    }
                                    OfficeDetails.find(queryForFindSupervisorOfficeDetail, function (err, supervisorOfficeDetail) {
                                        if (err) {
                                            // Nothing
                                        }
                                        if (supervisorOfficeDetail.length > 0 && supervisorOfficeDetail[0]['officeEmail'] != null) {

                                            let queryForFindLeaveType = {
                                                _id: req.body.leave_type,
                                                isDeleted: false
                                            }

                                            LeaveTypes.findOne(queryForFindLeaveType, function (err, leaveType) {
                                                if (err) {
                                                    // Do nothing
                                                }

                                                if (req.body.apply_by_id != req.body.emp_id) {
                                                    let queryForEmployeeOfficeDetails = {
                                                        _id: req.body.emp_id,
                                                        isDeleted: false
                                                    }
                                                    OfficeDetails.findOne(queryForEmployeeOfficeDetails, function (err, officeDetails) {
                                                        if (err) {

                                                        }
                                                        let queryForAppliedByData = {
                                                            _id: req.body.apply_by_id,
                                                            isDeleted: false
                                                        }
                                                        EmployeeInfo.findOne(queryForAppliedByData, function (err, appliedByDetails) {
                                                            if (err) {

                                                            }
                                                            let appliedLeaveId = leaveData._id;
                                                            let linktoSend = req.body.link + '/' + appliedLeaveId;
                                                            let data = {
                                                                fullName: supervisor.fullName,
                                                                empName: employeee.fullName,
                                                                appliedBy: appliedByDetails.fullName,
                                                                leaveType: leaveType.type,
                                                                appliedDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                fromDate: minFromDate,
                                                                toDate: maxToDate,
                                                                action_link: linktoSend
                                                            }
                                                            SendEmail.sendEmailToSuprsvrNotifyAppliedLeave(supervisorOfficeDetail[0]['officeEmail'], data);
                                                            data = {
                                                                fullName: employeee.fullName,
                                                                appliedBy: appliedByDetails.fullName,
                                                                leaveType: leaveType.type,
                                                                appliedDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                fromDate: minFromDate,
                                                                toDate: maxToDate,
                                                                action_link: linktoSend
                                                            }
                                                            SendEmail.sendEmailToEmployeeNotifyAppliedLeave(officeDetails['officeEmail'], data);
                                                        })

                                                    })
                                                } else {
                                                    let appliedLeaveId = leaveData._id;
                                                    let linktoSend = req.body.link + '/' + appliedLeaveId;
                                                    let data = {
                                                        fullName: supervisor.fullName,
                                                        empName: employeee.fullName,
                                                        appliedBy: employeee.fullName,
                                                        leaveType: leaveType.type,
                                                        appliedDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                        fromDate: minFromDate,
                                                        toDate: maxToDate,
                                                        action_link: linktoSend
                                                    }


                                                    SendEmail.sendEmailToSuprsvrNotifyAppliedLeave(supervisorOfficeDetail[0]['officeEmail'], data);

                                                }
                                            });
                                        }
                                    })
                                }
                            });
                        });
                        return done(err, leaveData);
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

function createLeave(req, leaveData) {
    return new Promise((resolve, reject) => {
        async.waterfall([
            (done) => {
                let leaveMaster = new LeaveMaster(req.body);
                leaveMaster.emp_id = req.body.emp_id || req.query.emp_id;
                leaveMaster.status = req.body.status;
                leaveMaster.applyTo = req.body.supervisor_id;
                leaveMaster.createdBy = parseInt(req.body.apply_by_id);
                leaveMaster.fromDate = leaveData.fromDateBody //moment(req.body.fromDate).format('MM/DD/YYYY');//new Date(req.body.fromDate).setUTCHours(0,0,0,0);
                leaveMaster.toDate = leaveData.toDateBody //(new Date(req.body.toDate).setUTCHours(0,0,0,0));
                leaveMaster.updatedBy = parseInt(req.body.updatedBy);

                let days = parseInt(req.body.days);
                req.body.additionalLeaves.forEach(addLeave => days += parseInt(addLeave.days));
                leaveMaster.days = days;
                leaveMaster.leaveBalanceId = req.body.leaveBalanceId;
                leaveMaster.paid = req.body.paid;
                leaveMaster.unpaid = req.body.unpaid;

                leaveMaster.save((err, doc) => {
                    done(err, doc);
                });
            },
            (data, done) => {
                LeaveApply.find({},
                    {
                        _id: 1
                    }, {
                        sort: {
                            _id: -1
                        },
                        limit: 1
                    }).exec((err, leave) => {
                        let leaveId = leave[0] ? leave[0]._id + 1 : 1;
                        let leaveDetailsArray = [];
                        let leaveDetails = new LeaveApply();
                        leaveDetails._id = leaveId;
                        leaveDetails.leaveMasterId = data._id;
                        leaveDetails.leave_type = data.leave_type;
                        leaveDetails.emp_id = req.body.emp_id || req.query.emp_id;
                        leaveDetails.status = req.body.status;
                        leaveDetails.applyTo = req.body.supervisor_id;
                        leaveDetails.createdBy = parseInt(req.body.apply_by_id);
                        leaveDetails.fromDate = moment(req.body.fromDate + ' UTC').utc().format();
                        leaveDetails.toDate = moment(req.body.toDate + ' UTC').utc().format();
                        leaveDetails.updatedBy = parseInt(req.body.updatedBy);
                        leaveDetails.days = req.body.days;
                        leaveDetails.fiscalYearId = req.body.fiscalYearId;
                        leaveDetails.paid = req.body.paid;
                        leaveDetails.unpaid = req.body.unpaid;
                        leaveDetailsArray.push(leaveDetails);

                        if (req.body.additionalLeaves && req.body.additionalLeaves.length > 0) {
                            req.body.additionalLeaves.forEach((leave, i) => {
                                let leaveDetails = new LeaveApply();
                                leaveDetails._id = leaveId + i + 1;
                                leaveDetails.leaveMasterId = data._id;
                                leaveDetails.leave_type = leave.leaveType;
                                leaveDetails.emp_id = req.body.emp_id || req.query.emp_id;
                                leaveDetails.status = req.body.status;
                                leaveDetails.applyTo = req.body.supervisor_id;
                                leaveDetails.createdBy = parseInt(req.body.apply_by_id);
                                leaveDetails.fromDate = moment(leave.fromDate + ' UTC').utc().format();
                                leaveDetails.toDate = moment(leave.toDate + ' UTC').utc().format();
                                leaveDetails.updatedBy = parseInt(req.body.updatedBy);
                                leaveDetails.days = leave.days;
                                leaveDetails.fiscalYearId = req.body.fiscalYearId;
                                leaveDetailsArray.push(leaveDetails);
                            })
                        }

                        LeaveApply.insertMany(leaveDetailsArray, (err, docs) => {
                            data.leaveDetails = docs;
                            done(err, data);
                        });
                    });
            }
        ], (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
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
            if (err) { }
        });
    } catch (e) { }

}

function cancelLeave(req, res, done) {
    let cancelLeaveDetals = {
        $set: {
            cancelLeaveApplyTo: parseInt(req.body.cancelLeaveApplyTo),
            updatedBy: parseInt(req.body.updatedBy),
            cancelReason: req.body.cancelReason,
            reason: req.body.reason,
            status: "Pending Cancellation"
        }
    };
    var query = {
        _id: parseInt(req.body.id),
        isDeleted: false
    }


    LeaveApply.findOneAndUpdate(query, cancelLeaveDetals, {
        new: true
    }, function (err, _leaveDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: _leaveDetails
                }
            });
        }
        leaveWorkflowDetails(_leaveDetails, req.body.updatedBy, 'cancelled');
        if (req.body.ccTo && req.body.ccTo != "") {
            var ccToList = req.body.ccTo.split(',');

            ccToList.forEach((x) => {
                try {
                    var emailWithName = x.split('~');
                    EmailDetails.sendToCCEmail(emailWithName[1], emailWithName[0]);
                } catch (e) { }
            })
        }
        return done(err, _leaveDetails);
    })

}

function updateSickLeaveDocumentDetails(req, res, done) {

    let _id = req.body._id;
    var query = {
        _id: parseInt(req.body._id),
        isDeleted: false
    }
    let updateQuery = {
        $set: {
            attachment: req.body.sickLeaveDocument
        }
    }

    LeaveMaster.findOneAndUpdate(query, updateQuery, {
        new: true
    }, function (err, leaveApplyDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: leaveApplyDetails
                }
            });
        }
        // AuditTrail.auditTrailEntry(employeeExternalDocumentDetailsData.emp_id, "employeeExternalDocumentDetails", employeeExternalDocumentDetailsData._id, employeeExternalDocumentDetailsData, "updateEmployeeExternalDocumentInfoDetails", "UPDATED");
        return done(err, req);
    });
}

function getEmployeeForQuotaProvideMaternity(req, res, done) {
    async.waterfall([
        (innerDone) => {
            LeaveBalance.find({
                leave_type: 3
            }).exec((err, data) => {
                innerDone(err, data);
            });
        },
        (data, innerDone) => {
            let empIds = data.map(e => e.emp_id);
            Employee.aggregate([{
                $match: {
                    _id: {
                        $nin: empIds
                    }
                }
            },
            {
                $lookup: {
                    'from': 'employeepersonaldetails',
                    'localField': '_id',
                    'foreignField': 'emp_id',
                    'as': 'personal'
                },
            },
            {
                $unwind: {
                    'path': '$personal'
                },
            },
            {
                $match: {
                    'personal.gender': {
                        $eq: 'Female'
                    }
                }
            },
            {
                $lookup: {
                    'from': 'employeeofficedetails',
                    'localField': '_id',
                    'foreignField': 'emp_id',
                    'as': 'employeeofficedetails'
                },
            },
            {
                $unwind: {
                    'path': '$employeeofficedetails'
                },
            },
            {
                $match: {
                    'employeeofficedetails.dateOfJoining': {
                        $ne: null
                    }
                }
            }
            ]).exec((err, res) => {
                if (err) {
                    innerDone(err, res);
                } else {
                    let employees = res.filter(emp => {
                        if (emp.employeeofficedetails.dateOfJoining) {
                            var diffInYears = dateFn.differenceInCalendarYears(
                                new Date(),
                                emp.employeeofficedetails.dateOfJoining
                            );
                            if (diffInYears > 0) {
                                return true;
                            }
                        }
                        return false;
                    });
                    innerDone(err, employees);
                }
            });
        }
    ], (err, data) => {
        done(err, data);
    });
}

function getEmployeeForQuotaProvideSpecial(req, res, done) {
    async.waterfall([
        (innerDone) => {
            LeaveBalance.find({
                leave_type: 4,
                isAvailed: false
            }).exec((err, data) => {
                innerDone(err, data);
            });
        },
        (data, innerDone) => {
            let empIds = data.map(e => e.emp_id);
            Employee.aggregate([{
                $match: {
                    _id: {
                        $nin: empIds
                    }
                }
            },
            {
                $lookup: {
                    'from': 'employeeofficedetails',
                    'localField': '_id',
                    'foreignField': 'emp_id',
                    'as': 'office'
                }
            },
            {
                $unwind: {
                    'path': '$office'
                }
            },
            {
                $lookup: {
                    'from': 'designations',
                    'localField': 'designation_id',
                    'foreignField': '_id',
                    'as': 'designation'
                }
            },
            {
                $unwind: {
                    'path': '$designation'
                }
            }
            ]).exec((err, res) => {
                innerDone(err, res);
            });
        }
    ], (err, data) => {
        done(err, data);
    });
}

async function addLeaveBalanceMigration(req, res) {
    var q = async.queue(function (item, callback) {
        inserLeaveBalance(item, res, callback);
    }, 1);

    // assign a callback
    q.drain = function () {
        console.log('All items have been processed');
        return res.status(200).json({
            title: 'Done'
        });
    };
    req.body.forEach(f => {
        q.push(f);
    })
}

function inserLeaveBalance(req, res, callback) {
    let empUserName = req.employeeUserName;
    Employee.findOne({ userName : empUserName }, function (err, details){
        if (err) {
            console.log("empUserName: " + empUserName);
            callback();
        } else {
            if (details != undefined) {
                let empId = Number(details._id);
                let leaveBalance = new LeaveBalance();
                leaveBalance.createdAt = new Date();
                leaveBalance.emp_id = empId;
                leaveBalance.fiscalYearId = 3;
                leaveBalance.leave_type = 2; //annual leave
                leaveBalance.isDeleted = false;
                leaveBalance.startDate = new Date('2019-07-01');
                leaveBalance.createdBy = 1;
                leaveBalance.carryForwardLeave = req.carry_forward_data;
                leaveBalance.balance = Number(req.sickleave);
                leaveBalance.save((err, resp) => {
                    if (err) {
                        console.log("empId" + empId + " err: " + err);
                        callback();

                    } else {
                        callback();
                    }
                })
            } else {
                console.log("undefined empUserName: " + empUserName);
                callback();
            }
        }
    })
}
let functions = {
    uploadSickLeaveDocument: (req, res) => {
        async.waterfall([
            function (done) {
                uploadClass.pdfDocuments(req, res, (err) => {
                    if (err) {
                        return res.status(403).json({
                            title: 'Error',
                            error: {
                                message: err
                            }

                        });
                    } else if (req.file !== undefined) {
                        req.body.sickLeaveDocument = req.file.key;
                        done(err, true)
                    }
                });
            },
            function (data, done) {
                updateSickLeaveDocumentDetails(req, res, done);
            },
            function (req, done) {
                return res.status(200).json({
                    message: 'Document uploaded successfully!',
                    key: req.file.key
                });
            }
        ]);
    },
    getLeaveBalance: (req, res) => {
        singleEmployeeLeaveBalance(req.query.empId, req.query.fiscalYearId, req.query.fromDate, req.query.toDate, res);
    },
    getAllLeaveBalance: (req, res) => {
        getAllLeaveBalance(req, res);
    },
    postApplyLeave: (req, res) => {
        async.waterfall([
            function (done) {
                if (req.body.leave_type == 3 || req.body.leave_type == 4) {
                    applyLeaveMaternitySpecial(req, res, done);
                } else {
                    applyLeave(req, res, done);
                }
            },
            function (_applyLeaveDetails, done) {
                return res.status(200).json(_applyLeaveDetails);
            }
        ])
    },
    HrPostApplyLeave: (req, res) => {
        async.waterfall([
            function (done) {
                applyLeave(req, res, done);
            },
            function (_applyLeaveDetails, done) {
                return res.status(200).json(_applyLeaveDetails);
            }
        ])
    },

    downloadLeaveAttachment: (req, res) => {
        let query = {
            _id: req.query.id,
            isDeleted: false
        }
        LeaveApply.findOne(query, function (err, leaveApplyResult) {
            if (err) {
                return res.status(403).json({
                    title: "ERROR",
                    error: {
                        message: err
                    },
                });
            }
            if (leaveApplyResult != null && leaveApplyResult.attachment != null) {
                uploadController.downloadLeaveAttachment(leaveApplyResult.attachment, res);
            } else {
                return res.status(200).json({
                    message: "Attachment not found."
                });
            }
        })
    },

    getHolidays: (req, res) => {
        let queryYear = req.query.year;
        let queryMonth = req.query.month;
        let upcoming = req.query.upcoming;
        let queryObj = {};
        let toDate = new Date(req.query.toDate);
        toDate.setDate(toDate.getDate() + 1)
        if (req.query.fromDate && req.query.toDate) {
            queryObj = {
                $and: [{
                    "date": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "date": {
                        $lte: toDate
                    }
                }
                ]
            };
        }
        LeaveHoliday.find(queryObj, function (err, LeaveHolidaysData) {
            if (LeaveHolidaysData) {
                let respdata = [];
                if (queryYear) {
                    LeaveHolidaysData.forEach((holiday) => {
                        const holidayDate = new Date(holiday.date);
                        if (holidayDate.getFullYear() == queryYear) {
                            respdata.push(holiday);
                        }
                    });
                }
                if (queryMonth) {
                    LeaveHolidaysData.forEach((holiday) => {
                        const holidayDate = new Date(holiday.date);
                        if (holidayDate.getMonth() == queryMonth) {
                            respdata.push(holiday);
                        }
                    });
                }
                if (upcoming) {
                    LeaveHolidaysData.forEach((holiday) => {
                        const holidayDate = new Date(holiday.date);
                        let queryDate = new Date();
                        if (holidayDate >= queryDate) {
                            respdata.push(holiday);
                        }
                    });
                }
                if (req.query.all) {
                    respdata = LeaveHolidaysData;
                }
                return res.status(200).json(respdata);
            }
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                // result: {
                //     message: result
                // }
            });

        })
    },
    getLeaveTransactionDetails: (req, res) => {
        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = []
        let projectQuery = {
            $project: {
                emp_id: 1,
                fiscalYearId: 1,
                leave_type: 1,
                fromDate: 1,
                toDate: 1,
                status: 1,
                reason: 1,
                days: 1,
                applyTo: 1,
                createdBy: 1,
                supervisorReason: 1,
                supervisorReason2: 1,
                paid: 1,
                unpaid: 1,
                monthStart: {
                    $month: '$fromDate'
                },
                yearStart: {
                    $year: '$fromDate'
                }
            }
        };
        let empId;
        if (req.query.empId) {
            empId = parseInt(req.query.empId);
            queryObj['$match']["$and"].push({
                emp_id: parseInt(req.query.empId)
            })
        }
        if (req.query.month) {
            queryObj['$match']["$and"].push({
                monthStart: parseInt(req.query.month)
            })
        }
        if (req.query.year) {
            queryObj['$match']["$and"].push({
                yearStart: parseInt(req.query.year)
            })
        }
        if (req.query.status) {
            queryObj['$match']["$and"].push({
                status: req.query.status
            })
        }
        let toDate = new Date(req.query.toDate);
        toDate.setDate(toDate.getDate() + 1)
        if (req.query.fromDate && req.query.toDate) {
            queryObj['$match']["$and"].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: toDate
                    }
                }
                ]
            })
        }

        LeaveMaster.aggregate([
            projectQuery,
            queryObj,
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leave_type",
                    "foreignField": "_id",
                    "as": "leaveTypeDetails"
                }
            },
            {
                "$unwind": {
                    path: "$leaveTypeDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "applyTo",
                    "foreignField": "_id",
                    "as": "applyToDetails"
                }
            },
            {
                "$unwind": {
                    path: "$applyToDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "createdBy",
                    "foreignField": "_id",
                    "as": "createdByDetails"
                }
            },
            {
                "$unwind": {
                    path: "$createdByDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveapplieddetails",
                    "localField": "_id",
                    "foreignField": "leaveMasterId",
                    "as": "leaveDetails"
                }
            },
            {
                $group: {
                    _id: "$_id",
                    leaveTypeName: {
                        $first: "$leaveTypeDetails.type"
                    },
                    leave_type: {
                        $first: "$leaveTypeDetails._id"
                    },
                    applyTo: {
                        $first: "$applyToDetails._id"
                    },
                    createdBy: {
                        $first: "$createdByDetails._id"
                    },
                    emp_id: {
                        $first: "$emp_id"
                    },
                    fromDate: {
                        $first: "$fromDate"
                    },
                    toDate: {
                        $first: "$toDate"
                    },
                    status: {
                        $first: "$status"
                    },
                    days: {
                        $first: "$days"
                    },
                    reason: {
                        $first: "$reason"
                    },
                    reason2: {
                        $first: "$reason2"
                    },
                    applyToFullName: {
                        $first: "$applyToDetails.fullName"
                    },
                    createdByFullName: {
                        $first: "$createdByDetails.fullName"
                    },
                    supervisorReason: {
                        $first: "$supervisorReason"
                    },
                    supervisorReason2: {
                        $first: "$supervisorReason2"
                    },
                    remark: {
                        $first: "$remark"
                    },
                    attachment: {
                        $first: "$attachment"
                    },
                    paid: {
                        $first: "$paid"
                    },
                    unpaid: {
                        $first: "$unpaid"
                    },
                    leaveDetails: { $push: "$leaveDetails" }
                }
            },

        ]).exec(function (err, LeaveTransactionDetails) {
            if (err) {
                return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    },
                    // result: {
                    //     message: result
                    // }
                });
            }

            return res.status(200).json(LeaveTransactionDetails);
        })
    },
    getAllEmployeeLeaveDetails: (req, res) => {
        let matchQuery = {
            "$match": {
                "isDeleted": false
            }
        }
        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = [{
            "isDeleted": false
        }]
        if (req.query.fromDate && req.query.toDate) {
            queryObj['$match']["$and"].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: new Date(req.query.toDate)
                    }
                }
                ]
            })
        }
        if (req.query.fiscalYearId) {
            matchQuery = {
                "$match": {
                    "isDeleted": false,
                    "fiscalYearId": parseInt(req.query.fiscalYearId)
                }
            }
        }
        LeaveApply.aggregate([{
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
        {
            "$lookup": {
                "from": "employeesupervisordetails",
                "localField": "emp_id",
                "foreignField": "emp_id",
                "as": "empsupervisor_name"
            }
        },
        {
            "$unwind": {
                path: "$empsupervisor_name",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "empsupervisor_name.leaveSupervisorEmp_id",
                "foreignField": "_id",
                "as": "empsupervisor_name.primarysupervisor_name"
            }
        },
        {
            "$unwind": {
                path: "$empsupervisor_name.primarysupervisor_name",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "forwardTo",
                "foreignField": "_id",
                "as": "forwardTo_name"
            }
        },
        {
            "$unwind": {
                path: "$forwardTo_name",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "applyTo",
                "foreignField": "_id",
                "as": "sup_name"
            }
        },
        {
            "$unwind": {
                path: "$sup_name",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "cancelLeaveApplyTo",
                "foreignField": "_id",
                "as": "cancelLeave_ApplyTo"
            }
        },
        {
            "$unwind": {
                path: "$cancelLeave_ApplyTo",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "leaveTypes",
                "localField": "leave_type",
                "foreignField": "_id",
                "as": "leaveTypes"
            }
        },
        {
            "$unwind": {
                path: "$leaveTypes",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "employeepersonaldetails",
                "localField": "emp_id",
                "foreignField": "emp_id",
                "as": "empPersonalDetails"
            }
        },
        {
            "$unwind": {
                path: "$empPersonalDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "employeeofficedetails",
                "localField": "emp_id",
                "foreignField": "emp_id",
                "as": "employeeOfficeDetails"
            }
        },
        {
            "$unwind": {
                path: "$employeeOfficeDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "departments",
                "localField": "employeeOfficeDetails.department_id",
                "foreignField": "_id",
                "as": "employeeOfficeDetails.departments"
            }
        },
        {
            "$unwind": {
                path: "$employeeOfficeDetails.departments",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "divisions",
                "localField": "employeeOfficeDetails.division_id",
                "foreignField": "_id",
                "as": "employeeOfficeDetails.divisions"
            }
        },
        {
            "$unwind": {
                path: "$employeeOfficeDetails.divisions",
                "preserveNullAndEmptyArrays": true
            }
        },
            matchQuery,
            queryObj,
        {
            "$project": {
                "_id": "$_id",
                "emp_id": "$emp_id",
                "emp_name": "$emp_name.fullName",
                "leave_type": "$leave_type",
                "leave_type_name": "$leaveTypes.type",
                "forwardTo": "$forwardTo",
                "forwardTo_FullName": "$forwardTo_name.fullName",
                "remark": "$remark",
                "cancelLeaveApplyTo": "$cancelLeaveApplyTo",
                "cancelLeaveApplyTo_name": "$cancelLeave_ApplyTo.fullName",
                "cancelReason": "$cancelReason",
                "isCancelled": "$isCancelled",
                "isApproved": "$isApproved",
                "ccTo": "$ccTo",
                "contactDetails": "$contactDetails",
                "applyTo": "$applyTo",
                "applyTo_name": "$sup_name.fullName",
                "userName": "$emp_name.userName",
                "profileImage": "$emp_name.profileImage",
                "gender": "$empPersonalDetails.gender",
                "primarysupervisor_fullname": "$empsupervisor_name.primarysupervisor_name.fullName",
                "primarysupervisor_username": "$empsupervisor_name.primarysupervisor_name.userName",
                "toDate": "$toDate",
                "fromDate": "$fromDate",
                "days": "$days",
                "reason": "$reason",
                "status": "$status",
                "attachment": "$attachment",
                "department": "$employeeOfficeDetails.departments.departmentName",
                "division": "$employeeOfficeDetails.divisions.divisionName",
                "paid": "$paid",
                "unpaid": "$unpaid"
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
            return res.status(200).json({
                "data": results
            });
        });
    },
    getAllEmployee: (req, res) => {
        EmployeeInfo.aggregate([{
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
                "from": "employeepersonaldetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "employeePersonalDetails"
            }
        },
        {
            "$unwind": "$employeePersonalDetails"
        },
        {
            "$match": {
                "isDeleted": false,
                "designations.isActive": true,
                "officeDetails.isDeleted": false
            }
        },
        {
            "$project": {
                "_id": "$_id",
                "fullName": "$fullName",
                "userName": "$userName",
                "isAccountActive": "$isAccountActive",
                "profileImage": "$profileImage",
                "officeEmail": "$officeDetails.officeEmail",
                "designation": "$designations.designationName",
                "supervisor": "$employees.fullName",
                "hrScope_id": '$officeDetails.hrspoc_id',
                "supervisor_id": "$employees._id",
                "profileProcessDetails": "$employeeprofileProcessDetails",
                "department_id": "$officeDetails.department_id",
                "grade_id": "$grade_id",
                "gender": "$employeePersonalDetails.gender"
            }
        }
        ]).exec(function (err, results) {
            if (err) {
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
            return res.status(200).json({
                "data": results
            });
        });
    },
    getUpcomingHoliday: (req, res) => {
        let queryDate = req.query.date;
        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = [{
            "isActive": true
        }]
        if (req.query.fromDate && req.query.toDate) {
            queryObj['$match']["$and"].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: new Date(req.query.toDate)
                    }
                }
                ]
            })
        }
        LeaveHoliday.find(queryObj, function (err, LeaveHolidaysData) {
            if (LeaveHolidaysData) {
                let respdata = [];
                LeaveHolidaysData.forEach((holiday) => {
                    const holidayDate = new Date(holiday.date);
                    if (holidayDate.getFullYear() == queryDate) {
                        respdata.push(holiday);
                    }
                });
                return res.status(200).json(respdata);
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
    getSupervisorLeaveDetails: (req, res) => {
        let primaryEmpId = req.query.empId;
        let month = req.query.month;
        let year = req.query.year;
        let status = req.query.status;
        let projectQuery = {
            $project: {
                days: 1,
                leave_type: 1,
                fromDate: 1,
                status: 1,
                emp_id: 1,
                leaveTypeName: {
                    _id: 1,
                    type: 1
                }
            }
        };
        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = [{
            'applyTo': parseInt(primaryEmpId)
        }];

        let filterQuery;
        if (month) {
            queryObj['$match']["$and"].push({
                monthStart: parseInt(month)
            })
        }
        if (year) {
            queryObj['$match']["$and"].push({
                yearStart: parseInt(year)
            })
        }
        if (status) {
            queryObj['$match']["$and"].push({
                'status': status
            })
        }
        if (req.query.fromDate && req.query.toDate) {
            queryObj['$match']["$and"].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: new Date(req.query.toDate)
                    }
                }
                ]
            })
        }

        LeaveApply.aggregate([
            queryObj,
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leave_type",
                    "foreignField": "_id",
                    "as": "leaveTypeName"
                }
            },
            {
                "$unwind": {
                    path: "$leaveTypeName",
                    "preserveNullAndEmptyArrays": true
                }
            },
            projectQuery,
            {
                $group: {
                    _id: "$leaveTypeName._id",
                    leaveTypeName: {
                        $first: "$leaveTypeName.type"
                    },
                    totalAppliedLeaves: {
                        $sum: "$days"
                    }
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
            let response = [];
            let leaveType = ["Annual Leave", "Sick Leave", "Maternity Leave", "Special Leave"]
            results.forEach(x => response.push(x))
            leaveType.forEach((x, index) => {
                const balLeaveObj = results.find((p) => p.leaveTypeName === x);
                if (balLeaveObj == undefined) {
                    response.push({
                        _id: index + 1,
                        leaveTypeName: x,
                        totalAppliedLeaves: 0
                    })
                }
            })

            return res.status(200).json({
                "data": response
            });
        });
    },
    getSupervisorTeamMember: (req, res) => {
        let primaryEmpId = req.query.empId;

        let matchQuery = {
            '$match': {
                "isActive": true
            }
        };

        if (primaryEmpId) {
            matchQuery = {
                '$match': {
                    "isActive": true,
                    "primarySupervisorEmp_id": parseInt(primaryEmpId)
                }
            };
        }

        SupervisorInfo.aggregate([
            matchQuery,
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employeeDetails"
                }
            },
            {
                "$unwind": {
                    path: "$employeeDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    _id: 1,
                    isActive: 1,
                    employeeDetails: {
                        "_id": 1,
                        "userName": 1,
                        "grade_id": 1,
                        "company_id": 1,
                        "designation_id": 1,
                        "employmentType_id": 1,
                        "fullName": 1,
                        "isAccountActive": 1,
                        "isDeleted": 1,
                        "profileImage": 1
                    }
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
            return res.status(200).json({
                "data": results
            });
        });
    },
    getTeamOnLeave: (req, res) => {
        let primaryEmpId = req.query.empId;
        let month = req.query.month;
        let year = req.query.year;
        let status = req.query.status;

        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = [];
        if (month) {
            queryObj['$match']['$and'].push({
                month: parseInt(month)
            })
        }
        if (year) {
            queryObj['$match']['$and'].push({
                year: parseInt(year)
            })
        }
        if (status) {
            queryObj['$match']['$and'].push({
                status: status
            })
        }
        if (primaryEmpId) {
            queryObj['$match']['$and'].push({
                applyTo: parseInt(primaryEmpId)
            })
        }
        if (req.query.fromDate && req.query.toDate) {
            queryObj['$match']["$and"].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: new Date(req.query.toDate)
                    }
                }
                ]
            })
        }

        LeaveApply.aggregate([
            queryObj,
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employeeDetails"
                }
            },
            {
                "$unwind": {
                    path: "$employeeDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    _id: 1,
                    // "month" :{$month:"$leavedetails.fromDate"},
                    // "year" :{$year:"$leavedetails.fromDate"},
                    // "status" :"$leavedetails.status",
                    employeeDetails: {
                        "_id": 1,
                        "userName": 1,
                        "grade_id": 1,
                        "company_id": 1,
                        "designation_id": 1,
                        "employmentType_id": 1,
                        "fullName": 1,
                        "isAccountActive": 1,
                        "isDeleted": 1,
                        "profileImage": 1
                    },
                    leavedetails: {
                        "fromDate": "$fromDate",
                        "toDate": "$toDate",
                        "days": "$days",
                        "leave_type": "$leave_type",
                        "status": "$status",
                    }
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
            return res.status(200).json({
                "data": results
            });
        });

    },
    getLeaveDetailsByFilter: (req, res) => {
        let primaryEmpId, empId;

        let month, year, leave_type;
        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = []
        if (req.query.empId) {
            empId = req.query.empId;
            queryObj['$match']['$and'].push({
                emp_id: parseInt(empId)
            })
        } else {
            primaryEmpId = req.query.supervisorId
            queryObj['$match']['$and'].push({
                applyTo: parseInt(primaryEmpId)
            })
        }
        if (req.query.month) {
            month = req.query.month;
            queryObj['$match']['$and'].push({
                month: parseInt(month)
            })
        }
        if (req.query.year) {
            year = req.query.year;
            queryObj['$match']['$and'].push({
                year: parseInt(year)
            })
        }
        if (req.query.leave_type) {
            leave_type = req.query.leave_type;
            queryObj['$match']['$and'].push({
                leave_type: parseInt(leave_type)
            })
        }
        if (req.query.status) {
            queryObj['$match']['$and'].push({
                status: req.query.status
            })
        }
        if (req.query.fromDate && req.query.fromDate != 'null' && req.query.toDate && req.query.toDate != 'null') {
            queryObj['$match']["$and"].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: new Date(req.query.toDate)
                    }
                }
                ]
            })
        }

        LeaveMaster.aggregate([
            queryObj,
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employeeDetails"
                }
            },
            {
                "$unwind": {
                    path: "$employeeDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "createdBy",
                    "foreignField": "_id",
                    "as": "createdByName"
                }
            },
            {
                "$unwind": {
                    path: "$createdByName",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "updatedBy",
                    "foreignField": "_id",
                    "as": "updatedByName"
                }
            },
            {
                "$unwind": {
                    path: "$updatedByName",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "applyTo",
                    "foreignField": "_id",
                    "as": "supervisorDetails"
                }
            },
            {
                "$unwind": {
                    path: "$supervisorDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leave_type",
                    "foreignField": "_id",
                    "as": "leaveTypeName"
                }
            },
            {
                "$unwind": {
                    path: "$leaveTypeName",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveapplieddetails",
                    "localField": "_id",
                    "foreignField": "leaveMasterId",
                    "as": "leaveDetails"
                }
            },
            {
                "$project": {
                    _id: 1,
                    isActive: 1,
                    "month": {
                        $month: "$fromDate"
                    },
                    "year": {
                        $year: "$fromDate"
                    },
                    "leave_type": "$leaveTypeName._id",
                    "leaveTypeName": "$leaveTypeName.type",
                    "leaveStatus": "$status",
                    employeeDetails: {
                        "_id": 1,
                        "userName": 1,
                        "fullName": 1,
                    },
                    leavedetails: {
                        "_id": "$_id",
                        "fromDate": "$fromDate",
                        "toDate": "$toDate",
                        "days": "$days",
                        "leave_type": "$leave_type",
                        "createdAt": "$createdAt",
                        "updatedAt": "$updatedAt",
                        "attachment": "$attachment",
                        "createdByName": {
                            "_id": "$createdByName._id",
                            "fullName": "$createdByName.fullName"
                        },
                        "updatedByName": {
                            "_id": "$updatedByName._id",
                            "fullName": "$updatedByName.fullName"
                        },
                        "updatedBy": "$updatedBy",
                        "createdBy": "$createdBy",
                        "status": "$status",
                        "reason": "$reason",
                        "paid": "$paid",
                        "unpaid": "$unpaid",
                        "supervisorDetails": {
                            "_id": "$supervisorDetails._id",
                            "fullName": "$supervisorDetails.fullName"
                        },
                        "leaveAppliedDetails": "$leaveDetails"
                    }
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
            return res.status(200).json({
                "data": results
            });
        });
    },
    createLeaveTransactionReport: (req, res) => {
        let primaryEmpId, empId, matchQuery;
        // if (req.query.supervisorId) {
        //     primaryEmpId = req.query.supervisorId
        //     matchQuery = {'$match':{ "primarySupervisorEmp_id":  parseInt(primaryEmpId)}};
        // } else {
        //     empId = req.query.empId;
        //     matchQuery = {'$match':{ "emp_id":  parseInt(empId)}};

        // }
        let month, year, leave_type;
        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = [{
            "isActive": true
        }]
        if (req.query.month) {
            month = req.query.month;
            queryObj['$match']['$and'].push({
                month: parseInt(month)
            })
        }
        if (req.query.year) {
            year = req.query.year;
            queryObj['$match']['$and'].push({
                year: parseInt(year)
            })
        }
        if (req.query.leave_type) {
            leave_type = req.query.leave_type;
            queryObj['$match']['$and'].push({
                leave_type: parseInt(leave_type)
            })
        }
        if (req.query.status) {
            queryObj['$match']['$and'].push({
                leaveStatus: req.query.status
            })
        }
        if (req.query.departmentName) {
            queryObj['$match']['$and'].push({
                "employeeOfficeDetails.departments.departmentName": req.query.departmentName
            })
        }
        if (req.query.divisionName) {
            queryObj['$match']['$and'].push({
                "employeeOfficeDetails.divisions.divisionName": req.query.divisionName
            })
        }
        if (req.query.leaveType) {
            queryObj['$match']['$and'].push({
                "leavedetails.leave_type": parseInt(req.query.leaveType)
            })
        }
        if (req.query.userName) {
            queryObj['$match']['$and'].push({
                "employeeDetails.userName": req.query.userName
            })
        }


        if (req.query.fromDate && req.query.toDate) {
            queryObj['$match']["$and"].push({
                $and: [{
                    "leavedetails.fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "leavedetails.fromDate": {
                        $lte: new Date(req.query.toDate)
                    }
                }
                ]
            })
        }
        SupervisorInfo.aggregate([
            // matchQuery,
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employeeDetails"
                }
            },
            {
                "$unwind": {
                    path: "$employeeDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "companies",
                    "localField": "employeeDetails.company_id",
                    "foreignField": "_id",
                    "as": "employeeDetails.companyDetails"
                }
            },
            {
                "$unwind": {
                    path: "$employeeDetails.companyDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveapplieddetails",
                    "localField": "emp_id",
                    "foreignField": "emp_id",
                    "as": "leavedetails"
                }
            },
            {
                "$unwind": {
                    path: "$leavedetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "leavedetails.createdBy",
                    "foreignField": "_id",
                    "as": "leavedetails.createdByName"
                }
            },
            {
                "$unwind": {
                    path: "$leavedetails.createdByName",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "leavedetails.updatedBy",
                    "foreignField": "_id",
                    "as": "leavedetails.updatedByName"
                }
            },
            {
                "$unwind": {
                    path: "$leavedetails.updatedByName",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "leavedetails.applyTo",
                    "foreignField": "_id",
                    "as": "leavedetails.supervisorDetails"
                }
            },
            {
                "$unwind": {
                    path: "$leavedetails.supervisorDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leavedetails.leave_type",
                    "foreignField": "_id",
                    "as": "leavedetails.leaveTypeName"
                }
            },
            {
                "$unwind": {
                    path: "$leavedetails.leaveTypeName",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeeofficedetails",
                    "localField": "emp_id",
                    "foreignField": "emp_id",
                    "as": "employeeOfficeDetails"
                }
            },
            {
                "$unwind": {
                    path: "$employeeOfficeDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "departments",
                    "localField": "employeeOfficeDetails.department_id",
                    "foreignField": "_id",
                    "as": "employeeOfficeDetails.departments"
                }
            },
            {
                "$unwind": {
                    path: "$employeeOfficeDetails.departments",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "divisions",
                    "localField": "employeeOfficeDetails.division_id",
                    "foreignField": "_id",
                    "as": "employeeOfficeDetails.divisions"
                }
            },
            {
                "$unwind": {
                    path: "$employeeOfficeDetails.divisions",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    _id: 1,
                    isActive: 1,
                    // "month" :{$month:"$leavedetails.fromDate"},
                    // "year" :{$year:"$leavedetails.fromDate"},
                    "compayName": "$employeeDetails.companyDetails.companyName",
                    "employeeName": "$employeeDetails.fullName",
                    "division": "$employeeOfficeDetails.divisions.divisionName",
                    "department": "$employeeOfficeDetails.departments.departmentName",
                    "supervisorName": "$leavedetails.supervisorDetails.fullName",
                    "fiscalYearId": "$leavedetails.fiscalYearId",
                    "leave_type": "$leavedetails.leaveTypeName._id",
                    "leaveTypeName": "$leavedetails.leaveTypeName.type",
                    "leaveStatus": "$leavedetails.status",
                    employeeDetails: {
                        "_id": 1,
                        "userName": 1,
                        "fullName": 1,
                        companyDetails: {
                            "_id": 1,
                            "companyName": 1
                        }
                    },
                    leavedetails: {
                        "_id": 1,
                        "fromDate": 1,
                        "toDate": 1,
                        "days": 1,
                        "leave_type": 1,
                        "createdAt": 1,
                        "updatedAt": 1,
                        "attachment": 1,
                        "fiscalYearId": 1,
                        createdByName: {
                            "_id": 1,
                            "fullName": 1
                        },
                        updatedByName: {
                            "_id": 1,
                            "fullName": 1
                        },
                        "updatedBy": 1,
                        "createdBy": 1,
                        "status": 1,
                        "reason": 1,
                        "paid": 1,
                        "unpaid": 1,
                        supervisorDetails: {
                            "_id": 1,
                            "fullName": 1
                        }
                    },
                    employeeOfficeDetails: {
                        "_id": 1,
                        "emp_id": 1,
                        divisions: {
                            "_id": 1,
                            "divisionName": 1
                        },
                        departments: {
                            "_id": 1,
                            "departmentName": 1
                        }
                    }
                }
            },
            queryObj,
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
            let json = results

            // let xls = json2xls(json);
            // fs.writeFileSync('data.xlsx', xls, 'binary');
            // return res.status(200).download('data.xlsx');
            return res.status(200).json(results);
        });
    },
    postCancelLeave: (req, res) => {
        async.waterfall([
            function (done) {
                cancelLeave(req, res, done);
            },
            function (_cancelLeaveDetails, done) {
                return res.status(200).json(_cancelLeaveDetails);
            }
        ])
    },
    withdrawLeave: (req, res) => {
        var query = {
            _id: req.body._id,
            isDeleted: false
            // fromDate: { $gt: new Date() } 
        }
        let withdrawStatus;
        LeaveMaster.findOne(query, function (err, leaveapplydetails) {
            let updateQuery;
            if ((new Date(leaveapplydetails.fromDate) > new Date()) && leaveapplydetails.status == "Applied") {
                withdrawStatus = "Withdrawn;"
                updateQuery = {
                    $set: {
                        updatedDate: new Date(),
                        updatedBy: parseInt(leaveapplydetails.emp_id),
                        remarks: (req.body.remarks == undefined || req.body.remarks) ? leaveapplydetails.remarks : req.body.remarks,
                        status: "Withdrawn",
                        reason2: req.body.reason2
                    }
                };

            } else if (leaveapplydetails.status == "Applied") {
                withdrawStatus = "Cancellation;"
                updateQuery = {
                    $set: {
                        updatedDate: new Date(),
                        updatedBy: parseInt(leaveapplydetails.emp_id),
                        remarks: (req.body.remarks == undefined || req.body.remarks) ? leaveapplydetails.remarks : req.body.remarks,
                        status: "Pending Cancellation",
                        reason2: req.body.reason2
                    }
                };

            } else if (new Date(leaveapplydetails.fromDate) > new Date() && (leaveapplydetails.status == "Approved")) {
                withdrawStatus = "Cancellation;"
                updateQuery = {
                    $set: {
                        updatedDate: new Date(),
                        updatedBy: parseInt(leaveapplydetails.emp_id),
                        remarks: (req.body.remarks == undefined || req.body.remarks) ? leaveapplydetails.remarks : req.body.remarks,
                        status: "Pending Cancellation",
                        reason2: req.body.reason2
                    }
                };
            } else if (leaveapplydetails.status == "Approved") {
                withdrawStatus = "Cancellation;"
                updateQuery = {
                    $set: {
                        updatedDate: new Date(),
                        updatedBy: parseInt(leaveapplydetails.emp_id),
                        remarks: (req.body.remarks == undefined || req.body.remarks) ? leaveapplydetails.remarks : req.body.remarks,
                        status: "Pending Cancellation",
                        reason2: req.body.reason2
                    }
                };
            }

            LeaveMaster.update(query, updateQuery, function (err, _leaveDetails) {
                if (err) {
                    return res.status(403).json({
                        title: 'There was a problem',
                        error: {
                            message: err
                        },
                        result: {
                            message: _leaveDetails
                        }
                    });
                } else {
                    LeaveApply.updateMany({
                        leaveMasterId: req.body._id
                    }, updateQuery, function (err, _leaveDetails) {
                        if (err) {
                            return res.status(403).json({
                                title: 'There was a problem',
                                error: {
                                    message: err
                                },
                                result: {
                                    message: _leaveDetails
                                }
                            });
                        }
                    });

                    let x = req;
                    let y = leaveapplydetails;
                    let queryForFindSupervisor = {
                        emp_id: leaveapplydetails.emp_id
                    }
                    //fetching supervisor info from emp_id
                    SupervisorInfo.findOne(queryForFindSupervisor, function (err, supervisor) {
                        if (err) {
                            return res.status(403).json({
                                title: 'There was a problem',
                                error: {
                                    message: err
                                },
                                result: {
                                    message: _leaveDetails
                                }
                            });
                        }
                        if (supervisor != null) {
                            //fetching supervisor details
                            EmployeeInfo.findOne({
                                _id: supervisor.primarySupervisorEmp_id
                            }, function (err, supervisorDetails) {
                                if (err) {
                                    return res.status(403).json({
                                        title: 'There was a problem',
                                        error: {
                                            message: err
                                        },
                                        result: {
                                            message: _leaveDetails
                                        }
                                    });
                                }
                                if (supervisorDetails != null) {
                                    let supervisorName = supervisorDetails.fullName;
                                    //fetching supervisor personal info for mail id
                                    OfficeDetails.findOne({
                                        emp_id: supervisorDetails._id
                                    }, function (err, supervisorEmailDetails) {
                                        if (err) {
                                            return res.status(403).json({
                                                title: 'There was a problem',
                                                error: {
                                                    message: err
                                                },
                                                result: {
                                                    message: _leaveDetails
                                                }
                                            });
                                        }
                                        if (supervisorEmailDetails != null) {
                                            //fetching emp details
                                            EmployeeInfo.findOne({
                                                _id: leaveapplydetails.emp_id
                                            }, function (err, empDetails) {
                                                if (err) {
                                                    return res.status(403).json({
                                                        title: 'There was a problem',
                                                        error: {
                                                            message: err
                                                        },
                                                        result: {
                                                            message: _leaveDetails
                                                        }
                                                    });
                                                }
                                                if (empDetails != null) {
                                                    let queryForFindLeaveType = {
                                                        _id: leaveapplydetails.leave_type,
                                                        isDeleted: false
                                                    }
                                                    LeaveTypes.findOne(queryForFindLeaveType, function (err, leaveType) {
                                                        let appliedLeaveId = req.body._id;
                                                        let linktoSend = req.body.link + '/' + appliedLeaveId;
                                                        if ((new Date(leaveapplydetails.fromDate) > new Date()) && leaveapplydetails.status == "Applied") {
                                                            let data = {
                                                                fullName: supervisorName,
                                                                empName: empDetails.fullName,
                                                                leaveType: leaveType.type,
                                                                appliedDate: leaveapplydetails.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                fromDate: leaveapplydetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                toDate: leaveapplydetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                action_link: linktoSend
                                                            }
                                                            SendEmail.sendEmailToSuprsvrNotifyWithdrawnLeave(supervisorEmailDetails.officeEmail, data);
                                                            if (leaveapplydetails.emp_id != leaveapplydetails.createdBy) {
                                                                let queryForFindCreatedBy = {
                                                                    _id: leaveapplydetails.createdBy,
                                                                    isDeleted: false
                                                                }
                                                                OfficeDetails.findOne(queryForFindCreatedBy, function (err, officeDetails) {
                                                                    if (err) {

                                                                    }
                                                                    EmployeeInfo.findOne(queryForFindCreatedBy, function (err, CreatedByInfo) {
                                                                        let dataCreatedBy = {
                                                                            fullName: CreatedByInfo.fullName,
                                                                            empName: empDetails.fullName,
                                                                            leaveType: leaveType.type,
                                                                            appliedDate: leaveapplydetails.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                            fromDate: leaveapplydetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                            toDate: leaveapplydetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                            action_link: linktoSend
                                                                        }
                                                                        SendEmail.sendEmailToSuprsvrNotifyWithdrawnLeave(officeDetails.officeEmail, dataCreatedBy);
                                                                    });

                                                                })
                                                            }
                                                        } else {
                                                            let data = {
                                                                fullName: supervisorName,
                                                                empName: empDetails.fullName,
                                                                leaveType: leaveType.type,
                                                                appliedDate: leaveapplydetails.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                fromDate: leaveapplydetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                toDate: leaveapplydetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                action_link: linktoSend
                                                            }
                                                            SendEmail.sendEmailToSuprsvrNotifyCancelLeave(supervisorEmailDetails.officeEmail, data);
                                                            if (leaveapplydetails.emp_id != leaveapplydetails.createdBy) {
                                                                let queryForFindCreatedBy = {
                                                                    _id: leaveapplydetails.createdBy,
                                                                    isDeleted: false
                                                                }
                                                                OfficeDetails.findOne(queryForFindCreatedBy, function (err, officeDetails) {
                                                                    if (err) {

                                                                    }
                                                                    EmployeeInfo.findOne(queryForFindCreatedBy, function (err, CreatedByInfo) {
                                                                        let dataCreatedBy = {
                                                                            fullName: CreatedByInfo.fullName,
                                                                            empName: empDetails.fullName,
                                                                            empId: empDetails.userName,
                                                                            leaveType: leaveType.type,
                                                                            appliedDate: leaveapplydetails.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                            fromDate: leaveapplydetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                            toDate: leaveapplydetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                            action_link: linktoSend
                                                                        }
                                                                        // SendEmail.sendEmailToHRNotifyCancelLeave(officeDetails.officeEmail, dataCreatedBy);
                                                                    });
                                                                })
                                                            }
                                                        }

                                                    });

                                                    return res.status(200).json(_leaveDetails);
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })

                    // leaveWorkflowDetails(_leaveDetails, req.body.updatedBy, 'cancelled');
                    // return res.status(200).json(_leaveDetails);
                }
            })
        })


    },
    getEmpMaternityLeaveDetails: (req, res) => {
        let query = {
            'isDeleted': false,
            'emp_id': parseInt(req.query.id),
            'leave_type': 3
        };
        LeaveBalance.find(query, function (err, maternityLeaveDetails) {
            if (maternityLeaveDetails) {
                return res.status(200).json({
                    "result": maternityLeaveDetails
                });
            }
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                }
            });
        })
    },
    getLeaveDetailsById: (req, res) => {

        let queryObj = {
            '$match': {}
        };
        queryObj['$match']['$and'] = [{
            "isDeleted": false
        }]
        if (req.query.fromDate && req.query.toDate) {
            queryObj['$match']["$and"].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(req.query.fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: new Date(req.query.toDate)
                    }
                }
                ]
            })
        }
        LeaveMaster.aggregate([
            queryObj,
            {
                "$match": {
                    "isDeleted": false,
                    "_id": parseInt(req.query.id)
                }
            },

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
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "forwardTo",
                    "foreignField": "_id",
                    "as": "forwardTo_name"
                }
            },
            {
                "$unwind": {
                    path: "$forwardTo_name",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "applyTo",
                    "foreignField": "_id",
                    "as": "sup_name"
                }
            },
            {
                "$unwind": {
                    path: "$sup_name",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "cancelLeaveApplyTo",
                    "foreignField": "_id",
                    "as": "cancelLeave_ApplyTo"
                }
            },
            {
                "$unwind": {
                    path: "$cancelLeave_ApplyTo",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leave_type",
                    "foreignField": "_id",
                    "as": "leaveTypes"
                }
            },
            {
                "$unwind": {
                    path: "$leaveTypes",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeeofficedetails",
                    "localField": "emp_id",
                    "foreignField": "emp_id",
                    "as": "employeeofficedetails"
                }
            },
            {
                "$unwind": {
                    path: "$employeeofficedetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employmentstatuses",
                    "localField": "employeeofficedetails.employmentStatus_id",
                    "foreignField": "_id",
                    "as": "employeeofficedetails.employmentstatus"
                }
            },
            {
                "$unwind": {
                    path: "$employeeofficedetails.employmentstatus",
                    "preserveNullAndEmptyArrays": true
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
                "$unwind": "$supervisor"
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "supervisor.primarySupervisorEmp_id",
                    "foreignField": "_id",
                    "as": "primarySupervisor"
                }
            },
            {
                "$unwind": "$primarySupervisor"
            },
            {
                "$lookup": {
                    "from": "leaveapplieddetails",
                    "localField": "_id",
                    "foreignField": "leaveMasterId",
                    "as": "leaveDetails"
                }
            },
            {
                "$unwind": {
                    path: "$leaveDetails",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leaveDetails.leave_type",
                    "foreignField": "_id",
                    "as": "leaveDetails_leaveTypes"
                }
            },
            {
                "$unwind": {
                    path: "$leaveDetails_leaveTypes",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "leave_type": 1,
                    "emp_id": 1,
                    "cancelReason": 1,
                    "supervisorReason2": 1,
                    "supervisorReason": 1,
                    "attachment": 1,
                    "remark": 1,
                    "systemApproved": 1,
                    "toDate": 1,
                    "fromDate": 1,
                    "updatedAt": 1,
                    "updatedBy": 1,
                    "status": 1,
                    "reason2": 1,
                    "reason": 1,
                    "paid": 1,
                    "unpaid": 1,
                    "isDeleted": 1,
                    "fiscalYearId": 1,
                    "days": 1,
                    "createdAt": 1,
                    "createdBy": 1,
                    "cancelLeaveApplyTo": 1,
                    "applyTo": 1,
                    "emp_name": 1,
                    "sup_name": 1,
                    "leaveTypes": 1,
                    "employeeofficedetails": 1,
                    "supervisor": 1,
                    "primarySupervisor": 1,
                    "leaveDetails": {
                        "_id": 1,
                        "updatedAt": 1,
                        "createdAt": 1,
                        "leaveMasterId": 1,
                        "emp_id": 1,
                        "systemApproved": 1,
                        "fiscalYearId": 1,
                        "isDeleted": 1,
                        "createdBy": 1,
                        "updatedBy": 1,
                        "forwardTo": 1,
                        "remark": 1,
                        "cancelLeaveApplyTo": 1,
                        "cancelReason": 1,
                        "supervisorReason2": 1,
                        "supervisorReason": 1,
                        "attachment": 1,
                        "contactDetails": 1,
                        "status": 1,
                        "reason2": 1,
                        "reason": 1,
                        "paid": 1,
                        "unpaid": 1,
                        "applyTo": 1,
                        "days": 1,
                        "toDate": 1,
                        "fromDate": 1,
                        "leaveType": "$leaveDetails_leaveTypes"
                    }
                }
            },
            {
                "$group": {
                    _id: "$_id",
                    "leave_type": { $first: "$leave_type" },
                    "emp_id": { $first: "$emp_id" },
                    "cancelReason": { $first: "$cancelReason" },
                    "supervisorReason2": { $first: "$supervisorReason2" },
                    "supervisorReason": { $first: "$supervisorReason" },
                    "attachment": { $first: "$attachment" },
                    "remark": { $first: "$remark" },
                    "systemApproved": { $first: "$systemApproved" },
                    "toDate": { $first: "$toDate" },
                    "fromDate": { $first: "$fromDate" },
                    "updatedAt": { $first: "$updatedAt" },
                    "updatedBy": { $first: "$updatedBy" },
                    "status": { $first: "$status" },
                    "reason2": { $first: "$reason2" },
                    "reason": { $first: "$reason" },
                    "paid": { $first: "$paid" },
                    "unpaid": { $first: "$unpaid" },
                    "isDeleted": { $first: "$isDeleted" },
                    "fiscalYearId": { $first: "$fiscalYearId" },
                    "days": { $first: "$days" },
                    "createdAt": { $first: "$createdAt" },
                    "createdBy": { $first: "$createdBy" },
                    "cancelLeaveApplyTo": { $first: "$cancelLeaveApplyTo" },
                    "applyTo": { $first: "$applyTo" },
                    "emp_name": { $first: "$emp_name" },
                    "sup_name": { $first: "$sup_name" },
                    "leaveTypes": { $first: "$leaveTypes" },
                    "employeeofficedetails": { $first: "$employeeofficedetails" },
                    "supervisor": { $first: "$supervisor" },
                    "primarySupervisor": { $first: "$primarySupervisor" },
                    "leaveDetails": { $push: "$leaveDetails" }
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
            return res.status(200).json({
                "data": results
            });
        });

    },
    cancelApproveLeave: (req, res) => {
        var query = {
            _id: parseInt(req.body.id),
        }
        let updateQuery;
        if (req.body.status == 'Applied' && req.body.approved) {
            updateQuery = {
                $set: {
                    status: "Approved",
                    supervisorReason: req.body.supervisorReason,
                    updatedBy: req.body.updatedBy,
                    updatedAt: new Date()
                }
            };
        } else if (req.body.status == 'Applied' && req.body.rejected) {
            updateQuery = {
                $set: {
                    status: "Rejected",
                    supervisorReason: req.body.supervisorReason,
                    updatedBy: req.body.updatedBy,
                    updatedAt: new Date()
                }
            };
        } else if (req.body.status == 'Pending Withdrawal' && req.body.withdrawn) {
            updateQuery = {
                $set: {
                    status: "Withdrawn",
                    supervisorReason2: req.body.supervisorReason2,
                    updatedBy: req.body.updatedBy,
                    updatedAt: new Date()
                }
            };
        } else if (req.body.status == 'Pending Cancellation' && req.body.cancelled) {
            updateQuery = {
                $set: {
                    status: "Cancelled",
                    supervisorReason2: req.body.supervisorReason2,
                    updatedBy: req.body.updatedBy,
                    updatedAt: new Date()
                }
            };
        } else if (req.body.status == 'Pending Withdrawal' && !req.body.withdrawn && (req.body.withdrawn != undefined)) {
            updateQuery = {
                $set: {
                    status: "Approved",
                    supervisorReason2: req.body.supervisorReason2,
                    updatedBy: req.body.updatedBy,
                    updatedAt: new Date()
                }
            };
        } else if (req.body.status == 'Pending Cancellation' && !req.body.cancelled && (req.body.cancelled != undefined)) {
            updateQuery = {
                $set: {
                    status: "Approved",
                    supervisorReason2: req.body.supervisorReason2,
                    updatedBy: req.body.updatedBy,
                    updatedAt: new Date()
                }
            };
        }
        LeaveMaster.findOneAndUpdate(query, updateQuery, {
            new: true
        }, function (err, _leaveDetails) {
            if (err) {
                return res.status(403).json({
                    title: 'There was a problem',
                    error: {
                        message: err
                    },
                    result: {
                        message: _leaveDetails
                    }
                });
            }

            LeaveApply.updateMany({
                leaveMasterId: parseInt(req.body.id)
            }, updateQuery,
                function (err, _leaveDetails) {
                    if (err) {
                        return res.status(403).json({
                            title: 'There was a problem',
                            error: {
                                message: err
                            },
                            result: {
                                message: _leaveDetails
                            }
                        });
                    }
                });

            if (req.body.status == 'Applied' && req.body.approved) {
                LeaveApply.find({
                    leaveMasterId: parseInt(req.body.id)
                }).exec((err, leave) => {
                    let leavBalanceMatchQuery = {
                        leave_type: leave[0].leave_type,
                        emp_id: parseInt(leave[0].emp_id),
                        isAvailed: false
                    };

                    let leavBalanceUpdateQuery = {
                        isAvailed: true,
                        updatedBy: req.body.updatedBy,
                        updatedAt: new Date(),
                        leaveId: parseInt(req.body.id)
                    };

                    LeaveBalance.findOneAndUpdate(leavBalanceMatchQuery, leavBalanceUpdateQuery).exec((err, result) => {
                        if (err) {
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
                });
            } else if ((req.body.status == 'Pending Withdrawal' && req.body.withdrawn) || (req.body.status == 'Pending Cancellation' && req.body.cancelled)) {
                LeaveApply.find({
                    leaveMasterId: parseInt(req.body.id)
                }).exec((err, leave) => {
                    let leavBalanceMatchQuery = {
                        leave_type: leave[0].leave_type,
                        emp_id: parseInt(leave[0].emp_id),
                        isAvailed: true,
                        leaveId: parseInt(req.body.id)
                    };

                    let leavBalanceUpdateQuery = {
                        isAvailed: false,
                        updatedBy: req.body.updatedBy,
                        updatedAt: new Date(),
                        leaveId: null
                    };

                    LeaveBalance.findOneAndUpdate(leavBalanceMatchQuery, leavBalanceUpdateQuery).exec((err, result) => {
                        if (err) {
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
                });
            }

            let queryForFindEmployeeDetail = {
                _id: _leaveDetails.emp_id,
                isDeleted: false
            }

            EmployeeInfo.findOne(queryForFindEmployeeDetail, function (err, employeeDetail) {
                if (err) {
                    // Do nothing
                }
                if (employeeDetail != null) {

                    let queryForFindEmployeeOfficeDetail = {
                        emp_id: employeeDetail._id,
                        isDeleted: false
                    }
                    OfficeDetails.find(queryForFindEmployeeOfficeDetail, function (err, employeeOfficeDetails) {
                        if (err) {
                            // Do nothing
                        }
                        if (employeeOfficeDetails.length > 0 && employeeOfficeDetails[0]['officeEmail'] != null) {

                            let queryForFindLeaveType = {
                                _id: _leaveDetails.leave_type,
                                isDeleted: false
                            }
                            LeaveTypes.findOne(queryForFindLeaveType, function (err, leaveType) {
                                if (err) {
                                    // Do nothing
                                }
                                let appliedLeaveId = req.body.id;
                                let linktoSend = req.body.link + '/' + appliedLeaveId;
                                let data = {
                                    fullName: employeeDetail.fullName,
                                    leaveType: leaveType.type,
                                    fromDate: _leaveDetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                    toDate: _leaveDetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                    action_link: linktoSend
                                }
                                if (req.body.status == 'Applied' && req.body.approved) {
                                    if (_leaveDetails.emp_id != _leaveDetails.createdBy) {
                                        let queryForCreatedBy = {
                                            _id: _leaveDetails.createdBy,
                                            isDeleted: false
                                        }
                                        OfficeDetails.findOne(queryForCreatedBy, function (err, createdByOfficeDetails) {
                                            if (err) {

                                            }
                                            EmployeeInfo.findOne(queryForCreatedBy, function (err, createdByDetails) {
                                                if (err) {

                                                }
                                                let CrteatedBydata = {
                                                    fullName: employeeDetail.fullName,
                                                    empId: employeeDetail.userName,
                                                    leaveType: leaveType.type,
                                                    appliedBy: createdByDetails.fullName,
                                                    fromDate: _leaveDetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    toDate: _leaveDetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    action_link: linktoSend
                                                }
                                                data.appliedBy = createdByDetails.fullName;
                                                SendEmail.sendEmailToEmployeeForLeaveRequestApprovedOnBehalf(employeeOfficeDetails[0]['officeEmail'], data);
                                                SendEmail.sendEmailToAppliedByForLeaveRequestApproved(createdByOfficeDetails.officeEmail, CrteatedBydata);

                                            });
                                        });
                                    } else {
                                        SendEmail.sendEmailToEmployeeForLeaveRequestApproved(employeeOfficeDetails[0]['officeEmail'], data);
                                    }
                                } else if (req.body.status == 'Applied' && req.body.rejected) {
                                    //rohan

                                    if (_leaveDetails.emp_id != _leaveDetails.createdBy) {
                                        let queryForCreatedBy = {
                                            _id: _leaveDetails.createdBy,
                                            isDeleted: false
                                        }
                                        OfficeDetails.findOne(queryForCreatedBy, function (err, createdByOfficeDetails) {
                                            if (err) {

                                            }
                                            EmployeeInfo.findOne(queryForCreatedBy, function (err, createdByDetails) {
                                                if (err) {

                                                }
                                                let queryForSupervsr = {
                                                    _id: _leaveDetails.applyTo,
                                                    isDeleted: false
                                                }
                                                EmployeeInfo.findOne(queryForSupervsr, function (err, supervisorDetails) {
                                                    if (err) { }
                                                    let CrteatedBydata = {
                                                        fullName: employeeDetail.fullName,
                                                        empId: employeeDetail.userName,
                                                        supervisorName: supervisorDetails.fullName,
                                                        appliedBy: createdByDetails.fullName,
                                                        leaveType: leaveType.type,
                                                        fromDate: _leaveDetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                        toDate: _leaveDetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                        action_link: linktoSend
                                                    }
                                                    data.appliedBy = createdByDetails.fullName;
                                                    SendEmail.sendEmailToEmployeeForLeaveRequestRejectedOnBehalf(employeeOfficeDetails[0]['officeEmail'], data);
                                                    SendEmail.sendEmailToAppliedByForLeaveRequestRejected(createdByOfficeDetails.officeEmail, CrteatedBydata);
                                                })


                                            });
                                        });
                                    } else {
                                        SendEmail.sendEmailToEmployeeForLeaveRequestRejected(employeeOfficeDetails[0]['officeEmail'], data)
                                    }
                                } else if (req.body.status == 'Pending Cancellation' && !req.body.cancelled && (req.body.cancelled != undefined)) {
                                    SendEmail.sendEmailToEmployeeForLeaveCancellationRejected(employeeOfficeDetails[0]['officeEmail'], data);
                                    if (_leaveDetails.emp_id != _leaveDetails.createdBy) {
                                        let queryForFindCreatedBy = {
                                            _id: _leaveDetails.createdBy,
                                            isDeleted: false
                                        }
                                        OfficeDetails.findOne(queryForFindCreatedBy, function (err, officeDetails) {
                                            if (err) {

                                            }
                                            EmployeeInfo.findOne(queryForFindCreatedBy, function (err, CreatedByInfo) {
                                                let dataCreatedBy = {
                                                    fullName: CreatedByInfo.fullName,
                                                    empName: employeeDetail.fullName,
                                                    empId: employeeDetail.userName,
                                                    leaveType: leaveType.type,
                                                    appliedDate: _leaveDetails.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    fromDate: _leaveDetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    toDate: _leaveDetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    action_link: linktoSend
                                                }
                                                SendEmail.sendEmailToHRNotifyCancelLeaveRejected(officeDetails.officeEmail, dataCreatedBy);
                                            });
                                        })
                                    }


                                } else if (req.body.status == 'Pending Cancellation' && req.body.cancelled) {
                                    SendEmail.sendEmailToEmployeeForLeaveCancellationApprove(employeeOfficeDetails[0]['officeEmail'], data);
                                    if (_leaveDetails.emp_id != _leaveDetails.createdBy) {
                                        let queryForFindCreatedBy = {
                                            _id: _leaveDetails.createdBy,
                                            isDeleted: false
                                        }
                                        OfficeDetails.findOne(queryForFindCreatedBy, function (err, officeDetails) {
                                            if (err) {

                                            }
                                            EmployeeInfo.findOne(queryForFindCreatedBy, function (err, CreatedByInfo) {
                                                let dataCreatedBy = {
                                                    fullName: CreatedByInfo.fullName,
                                                    empName: employeeDetail.fullName,
                                                    empId: employeeDetail.userName,
                                                    leaveType: leaveType.type,
                                                    appliedDate: _leaveDetails.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    fromDate: _leaveDetails.fromDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    toDate: _leaveDetails.toDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                    action_link: linktoSend
                                                }
                                                SendEmail.sendEmailToHRNotifyCancelLeave(officeDetails.officeEmail, dataCreatedBy);
                                            });
                                        })
                                    }
                                }
                            })
                        }
                    })
                }
            });

            // leaveWorkflowDetails(_leaveDetails, req.body.updatedBy, 'cancelled');
            return res.status(200).json(_leaveDetails);
        })

    },
    autoApproveLeave: (req, res) => {
        let toDate;
        if (req.query.date) {
            toDate = new Date(req.query.date);
        } else {
            toDate = new Date();
        }
        toDate.setDate(toDate.getDate() - 3)
        var query = {
            status: 'Applied',
            "updatedAt": {
                $lte: toDate
            },
        }
        //     let toDate = new Date(endDate);
        //     toDate.setDate(toDate.getDate() + 1)
        // let queryForDate = {'$match':{}};
        // queryForDate['$match']['$and']=[{"emp_id": empId}]
        // if (fromDate && endDate) { 
        //     queryForDate['$match']['$and'].push({
        //         $and:
        //             [{"fromDate": {$gte: new Date(fromDate)}},
        //             {"fromDate": {$lte: toDate}}]
        //     });
        // }
        //     let updateQuery;
        updateQuery = {
            $set: {
                status: "System Approved",
                updatedAt: new Date()
            }
        };

        LeaveApply.update(query, updateQuery, {
            new: true,
            multi: true
        }, function (err, _leaveDetails) {
            if (err) {
                return res.status(403).json({
                    title: 'There was a problem',
                    error: {
                        message: err
                    },
                    result: {
                        message: _leaveDetails
                    }
                });
            }
            // leaveWorkflowDetails(_leaveDetails, req.body.updatedBy, 'cancelled');
            return res.status(200).json(_leaveDetails);
        })

    },
    calculateLeave: (req, res) => {
        let fromDateBody = moment(req.body.fromDate + ' UTC').utc().format();
        let toDateBody = moment(req.body.toDate + ' UTC').utc().format();
        let startd = new Date(new Date(req.body.fromDate).getTime() + 86400000),
            endd = new Date(new Date(req.body.toDate).getTime() + 86400000);
        let flag = true;
        let message;
        let minusDayStart = new Date(startd.getTime() - 86400000);
        let minusDayEnd = new Date(endd.getTime() - 86400000);
        LeaveHoliday.find({
            $or: [{
                $and: [{
                    "date": {
                        $gt: minusDayStart
                    }
                },
                {
                    "date": {
                        $lte: startd
                    }
                }
                ]
            }, {
                $and: [{
                    "date": {
                        $gt: minusDayEnd
                    }
                },
                {
                    "date": {
                        $lte: endd
                    }
                }
                ]
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

            }
        })
    },
    uploadCarryForward: (req, res) => {
        let workbook = XLSX.readFile('/Volumes/Webrex/Client Project/fluidonomics/adn-hris-api/Carry_Forward.xlsx');
        let sheet_name_list = workbook.SheetNames;
        let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
        let response = [];
        for (let i = 1; i < data.length; i++) {
            Employee.find({
                userName: parseInt(data[i]['ID #'])
            }, function (err, users) {
                let temp = {};
                if (users[0]) {
                    temp = {
                        'CARRY FORWARD': data[i]['CARRY FORWARD'],
                        'id': users[0]._id
                    }
                    response.push(temp)

                    LeaveBalance.find({
                        emp_id: parseInt(users[0]._id),
                        leave_type: 1
                    }, function (err, users) {
                        LeaveBalance.findOneAndUpdate({
                            emp_id: parseInt(users[0]._id),
                            leave_type: 1
                        }, {
                                $set: {
                                    balance: parseInt(users[0].balance) + parseInt(data[i]['CARRY FORWARD']),
                                    carryForwardLeave: parseInt(data[i]['CARRY FORWARD']),
                                }
                            }, function (err, _leaveDetails) {

                            })
                    })
                }
            })
        }
    },
    getEmployeeProbationDetails: (req, res) => {
        let query = {
            'isDeleted': false,
            'emp_id': parseInt(req.query.id)
        };
        OfficeDetails.find(query, function (err, OfficeDetailsData) {
            if (OfficeDetailsData) {
                var employementStatusId = OfficeDetailsData[0].employmentStatus_id;
                if (employementStatusId == 2 || employementStatusId == 3)
                    return res.status(200).json({
                        "result": true
                    });
                else
                    return res.status(200).json({
                        "result": false
                    });
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
    getEmployeeForQuotaProvide: (req, res) => {
        async.waterfall([
            function (done) {
                if (req.query.type == 'maternity') {
                    getEmployeeForQuotaProvideMaternity(req, res, done);
                } else {
                    getEmployeeForQuotaProvideSpecial(req, res, done);
                }
            }
        ], (err, data) => {
            if (err) {
                return res.status(400).json(err);
            } else {
                return res.status(200).json(data);
            }
        });
    },
    provideLeaveQuota: (req, res) => {
        async.waterfall([
            function (done) {
                if (req.body.leave_type == 3) {
                    let leaveBalance = new LeaveBalance(req.body);
                    leaveBalance.save(function (err, leaveBalanceInfo) {
                        done(err, leaveBalanceInfo);
                    });
                } else {
                    LeaveBalance.find({}, {
                        _id: 1
                    }, {
                            sort: {
                                _id: -1
                            },
                            limit: 1
                        }).exec((err, balances) => {
                            let leaveBalances = [];
                            let id = balances[0]._id + 1;
                            req.body.emp_id.forEach((empId, i) => {
                                leaveBalances.push({
                                    _id: id + i,
                                    emp_id: empId,
                                    balance: req.body.balance,
                                    createdAt: req.body.createdAt,
                                    createdBy: req.body.createdBy,
                                    fiscalYearId: req.body.fiscalYearId,
                                    leave_type: req.body.leave_type,
                                    paid: req.body.paid,
                                    unpaid: req.body.unpaid,
                                    remarks: req.body.remarks
                                })
                            })
                            LeaveBalance.insertMany(leaveBalances, function (err, res) {
                                done(err, res);
                            });
                        })
                }
            },
            (data, innerDone) => {
                let empId = [];
                let leave_type = '';
                if (req.body.leave_type == 3) {
                    empId.push(req.body.emp_id);
                    leave_type = 'Maternity Leave';
                } else {
                    empId = req.body.emp_id;
                    leave_type = 'Special Leave';
                }
                EmployeeInfo.aggregate([
                    {
                        '$match': {
                            _id: { $in: empId }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'employeeofficedetails',
                            'localField': '_id',
                            'foreignField': 'emp_id',
                            'as': 'employeeofficedetails'
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$employeeofficedetails'
                        }
                    }
                ]).exec((err, employees) => {
                    employees.forEach(emp => {
                        let data = {};
                        // data.supervisor = f.supervisor;
                        data.emp_email = emp.employeeofficedetails.officeEmail;
                        data.emp_name = emp.fullName;
                        data.action_link = req.body.action_link;
                        data.days = req.body.balance;
                        data.leave_type = leave_type;
                        data.employee = emp;
                        SendEmail.sendEmailToEmployeeForLeaveQuota(data);
                    });
                    innerDone(err, employees);
                });
            }
        ], (err, data) => {
            if (err) {
                return res.status(400).json(err);
            } else {
                return res.status(200).json(data);
            }
        });
    },
    addLeaveBalance: (req, res) => {
        async.waterfall([
            function (done) {
                let leaveBalance = new LeaveBalance(req.body);
                leaveBalance.save(function (err, leaveBalanceInfo) {
                    done(err, leaveBalanceInfo);
                });
            }
        ], (err, data) => {
            if (err) {
                return res.status(400).json(err);
            } else {
                return res.status(200).json(data);
            }
        });
    },
    addLeaveBalanceMigration: (req, res) => {
        addLeaveBalanceMigration(req, res);
    },
    migrateLeaveMergeToProd: (req, res) => {
        async.waterfall([
            function (done) {
                let leaveMaster = new LeaveMaster(req.body.leaveMaster);
                leaveMaster.save(function (err, leaveMasterInfo) {
                    done(err, leaveMasterInfo);
                });
            },
            function (leaveMaster, done) {
                let leaveApply = new LeaveApply(req.body.leaveDetails);
                leaveApply.leaveMasterId = leaveMaster._id;
                leaveApply.save(function (err, leaveApplyInfo) {
                    done(err, leaveApplyInfo);
                });
            }
        ], (err, data) => {
            if (err) {
                return res.status(400).json(err);
            } else {
                return res.status(200).json(data);
            }
        });
    },
    getAllLeaveBalances: (req, res) => {
        async.waterfall([
            function (done) {
                LeaveBalance.find({
                    emp_id: req.query.emp_id,
                    isAvailed: false
                }).sort({
                    _id: -1
                }).exec((err, leaveBalances) => {
                    done(err, leaveBalances);
                })
            }
        ], (err, data) => {
            if (err) {
                return res.status(400).json(err);
            } else {
                return res.status(200).json(data);
            }
        });
    },
    getOverviewChartData: (req, res) => {
        currentEmpId = req.query.empId;
        fiscalYearId = req.query.fiscalYearId;
        fromDate = req.query.fromDate;
        endDate = req.query.toDate;

        let empId = parseInt(currentEmpId);
        let _fiscalYearId = parseInt(fiscalYearId);
        let projectQuery = {
            $project: {
                emp_id: 1,
                fiscalYearId: 1,
                leave_type: 1,
                balance: 1,
                startDate: 1,
                endDate: 1,
                monthStart: {
                    $month: '$startDate'
                },
                yearStart: {
                    $year: '$startDate'
                },
                paid: 1,
                unpaid: 1,
                isAvailed: 1
            }
        };

        let toDate = new Date(endDate);
        toDate.setDate(toDate.getDate() + 1)
        let queryForDate = {
            '$match': {}
        };
        queryForDate['$match']['$and'] = [{
            "emp_id": empId
        }]
        if (fromDate && endDate) {
            queryForDate['$match']['$and'].push({
                $and: [{
                    "fromDate": {
                        $gte: new Date(fromDate)
                    }
                },
                {
                    "fromDate": {
                        $lte: toDate
                    }
                }
                ]
            });
        }

        async.waterfall([
            (done) => {
                LeaveApply.aggregate( // Pipeline
                    [{
                        $match: {
                            "emp_id": empId,
                        }
                    },
                    {
                        "$match": {
                            $or: [{
                                $and: [{
                                    "leave_type": { $in: [1, 2, 3, 4] }
                                },
                                {
                                    "status": { $in: ["Applied", "Approved", "Pending Withdrawal", "Pending Cancellation", "System Approved"] }
                                },
                                {
                                    "fiscalYearId": _fiscalYearId
                                }]
                            }]
                        }
                    },
                        queryForDate,
                    {
                        "$lookup": {
                            "from": "leaveTypes",
                            "localField": "leave_type",
                            "foreignField": "_id",
                            "as": "leaveTypeName"
                        }
                    },
                    {
                        "$unwind": {
                            path: "$leaveTypeName",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        $project: {
                            emp_id: 1,
                            leave_type: 1,
                            status: 1,
                            toDate: 1,
                            fromDate: 1,
                            days: 1,
                            attachment: 1,
                            monthStart: {
                                $month: '$fromDate'
                            },
                            yearStart: {
                                $year: '$fromDate'
                            },
                            fiscalYearId: 1,
                            leaveTypeName: 1
                        }
                    },
                    // Stage 4
                    {
                        $group: {
                            _id: "$leave_type",
                            totalAppliedLeaves: {
                                $sum: "$days"
                            },
                            leaveTypeName: { $first: '$leaveTypeName' },
                            leaveTypeId: { $first: '$leave_type' }
                        }
                    }
                    ]).exec(function (err, appliedLeaves) {
                        done(err, appliedLeaves);
                    });
            }
        ], (err, response) => {
            if (err) {
                return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    },
                    result: {
                        message: response
                    }
                });
            }
            return res.status(200).json(response);
        })
    }
}


module.exports = functions;