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
function applyLeave(req, res, done) {
    const query = {
        $or: [{
            emp_id: req.body.emp_id,
            leave_type: req.body.leave_type,
            isApproved: null
        },
        {
            emp_id: req.body.emp_id,
            leave_type: req.body.leave_type,
            isApproved: null

        }]
    };
    LeaveApply.find(query, function (err, details) {
        const sd = new Date(req.body.fromDate),
            ed = new Date(req.body.toDate);
        let flag = true;
        for (let i = 0; i < details.length; i++) {
            if (details[i].isCancelled == false || details[i].isCancelled == null || details[i].isCancelled == undefined) {
                if ((sd >= details[i].fromDate && ed <= details[i].toDate) ||
                    (sd <= details[i].fromDate && ed >= details[i].fromDate) ||
                    (sd <= details[i].toDate && ed >= details[i].toDate)) {
                    flag = false;
                }
            }
        }

        if (flag) {
            let leavedetails = new LeaveApply(req.body);
            leavedetails.emp_id = req.body.emp_id || req.query.emp_id;
            leavedetails.status = req.body.status;
            leavedetails.createdBy = parseInt(req.body.emp_id);
            leavedetails.fromDate = new Date(req.body.fromDate);
            leavedetails.toDate = new Date(req.body.toDate);
            leavedetails.updatedBy = parseInt(req.body.updatedBy);
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
                if (req.body.ccTo && req.body.ccTo != "") {
                    var ccToList = req.body.ccTo.split(',');
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
                    message: 'Already applied'
                },
                result: {
                    message: 'Already applied'
                }
            });
        }

    });
}
function cancelLeave(req, res, done) {
    let cancelLeaveDetals = {
        $set: {
            cancelLeaveApplyTo: req.body.cancelLeaveApplyTo,
            updatedBy: req.body.updatedBy,
            cancelReason: req.body.cancelReason,
            reason: req.body.reason,
            ccTo: req.body.ccTo,
            isCancelled: req.body.isCancelled,
            status: req.body.status
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
        return done(err, _leaveDetails);
    })

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
                console.log(err);
            }
        });
    } catch (e) {
        console.log(e);
    }

}
function grantLeaveEmployee(req, res, done) {
    let leaveAlreadyExists = false,
        _leaveBalance = new LeaveBalance(req.body);
    _leaveBalance.emp_id = parseInt(req.body.emp_id);
    _leaveBalance.leave_type = parseInt(req.body.leave_type);
    // _leaveBalance.lapseDate = new Date(req.body.lapseDate);
    // _leaveBalance.createdDate = new Date();
    // _leaveBalance.updatedDate = new Date();
    _leaveBalance.balance = parseInt(req.body.balance);
    // _leaveBalance.updatedBy = parseInt(req.body.updatedBy);
    // _leaveBalance.createdBy = parseInt(req.body.emp_id);
    var query = {
        isDeleted: false,
        leave_type: parseInt(req.body.leave_type),
        emp_id: parseInt(req.body.emp_id)
    };
    var leaveGrantProjection = {
        createdAt: false
    };
    LeaveBalance.find(query, leaveGrantProjection, {
        sort: {
            _id: 1
        }
    }, function (err, leaveData) {
        if (leaveData) {
            let validationFailed = false;
            leaveData.forEach((x) => {
                if (x.leave_type == 1 || x.leave_type == 2) {
                    validationFailed = true;
                }
                if (x.leave_type == 3 || x.leave_type == 4) {
                    leaveAlreadyExists = true;
                    _leaveBalance.balance = _leaveBalance.balance + x.balance;
                }
            })
            if (validationFailed) {
                return res.status(500).json({
                    title: leaveData.leave_type == 1 ? 'Annual leave can be granted only once in a year' : 'Annual leave can be granted only once in a year',
                    error: {
                        message: leaveData.leave_type == 1 ? 'Annual leave can be granted only once in a year' : 'Annual leave can be granted only once in a year'
                    },
                    result: {
                        message: leaveData.leave_type == 1 ? 'Annual leave can be granted only once in a year' : 'Annual leave can be granted only once in a year'
                    }
                })
            }

        }
        if (leaveAlreadyExists) {
            LeaveBalance.findOneAndUpdate(query, _leaveBalance, function (err, _leaveBalanceResponse) {
                if (err) {
                    return res.status(403).json({
                        title: 'There is a problem',
                        error: {
                            message: err
                        },
                        result: {
                            message: _leaveBalanceResponse
                        }
                    });
                }
                return done(err, _leaveBalanceResponse);
            });
        } else {
            _leaveBalance.save(function (err, _leaveBalanceResponse) {
                if (err) {
                    return res.status(403).json({
                        title: 'There is a problem',
                        error: {
                            message: err
                        },
                        result: {
                            message: _leaveBalanceResponse
                        }
                    });
                }
                return done(err, _leaveBalanceResponse);
            });
        }

    });

}
function grantLeaveDepartment(req, res, done) {
    let departmentId = parseInt(req.body.department_id);
    var query = {
        isDeleted: false,
        department_id: departmentId
    }
    var departmentProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false
    };
    OfficeDetails.find(query, departmentProjection, {
        sort: {
            _id: 1
        }
    }, function (err, departmentData) {
        if (departmentData) {
            addLeaveBlance(departmentData, req, res, "department");
            // return done(err, departmentData);
        }
    });
}
function addLeaveBlance(empIdCollection, req, res, appliedFor) {
    let isDetailskipped = false;
    let saveEmployeeLeaveBalance = function (i) {
        let balance = parseInt(req.body.balance);
        if (i < empIdCollection.length) {
            var query = {
                isDeleted: false,
                leave_type: parseInt(req.body.leave_type),
                emp_id: parseInt(appliedFor === "employee" ? empIdCollection[i].id : empIdCollection[i].emp_id)
            };
            var leaveGrantProjection = {
                createdAt: false
            };
            LeaveBalance.find(query, leaveGrantProjection, {
                sort: {
                    _id: 1
                }
            }, function (err, leaveData) {
                let alreadyExists = false,
                    validationFailed = false;
                if (leaveData) {
                    leaveData.forEach((x) => {
                        if (x.leave_type == 1 || x.leave_type == 2) {
                            validationFailed = true;
                        }
                        if (x.leave_type == 3 || x.leave_type == 4) {
                            alreadyExists = true;
                            balance = parseInt(req.body.balance) + x.balance;
                        }
                    })
                }


                let _leaveBalance = new LeaveBalance({
                    emp_id: appliedFor === "employee" ? empIdCollection[i].id : empIdCollection[i].emp_id,
                    leave_type: parseInt(req.body.leave_type),
                    // lapseDate: new Date(req.body.lapseDate),
                    // createdDate: new Date(req.body.createdDate),
                    // updatedDate: new Date(req.body.updatedDate),
                    balance: balance,
                    updatedBy: parseInt(req.body.updatedBy),
                    createdBy: parseInt(req.body.createdBy),
                    fiscalYearId: parseInt(req.body.fiscalYearId),
                    isDeleted: false
                });

                if (alreadyExists) {
                    LeaveBalance.findOneAndUpdate(query, _leaveBalance, function (err, data) {
                        if (err) {
                            return res.status(403).json({
                                title: 'There is a problem',
                                error: {
                                    message: err
                                },
                                result: {
                                    message: data
                                }
                            });
                        }
                        saveEmployeeLeaveBalance(i + 1);
                    })
                } else if (!validationFailed) {

                    _leaveBalance.save((err, data) => {
                        if (err) {
                            return res.status(403).json({
                                title: 'There is a problem',
                                error: {
                                    message: err
                                },
                                result: {
                                    message: data
                                }
                            });
                        }
                        saveEmployeeLeaveBalance(i + 1);
                    });
                } else {
                    isDetailskipped = true;
                    saveEmployeeLeaveBalance(i + 1);
                }
            });
        } else {
            if (isDetailskipped) {
                res.status(300).send();
            }
            else {
                res.status(200).send();
            }
        }
    }
    saveEmployeeLeaveBalance(0);

}
function grantLeaveAll(req, res, done) {
    var query = {
        isDeleted: false,
    }
    var allEmployeeProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false
    };
    Employee.find(query, allEmployeeProjection, {
        sort: {
            _id: 1
        }
    }, function (err, employeeData) {
        if (employeeData) {
            addLeaveBlance(employeeData, req, res, "employee");
            // return done(err, departmentData);
        }
    });
}
function addHoliday(req, res, done) {
    let holidaydetails = new LeaveHoliday(req.body);
    holidaydetails.save(function (err, leaveHolidayData) {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: leaveHolidayData
                }
            });
        }
        return done(err, leaveHolidayData);
    });
}
function addleaveCarryForward(req, res, done) {
    let leaveCarryForward = new LeaveDetailsCarryForward(req.body);
    leaveCarryForward.save(function (err, leaveCarryForwardData) {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: leaveCarryForwardData
                }
            });
        }
        return done(err, leaveCarryForwardData);
    });
}
function updateHoliday(req, res, done) {
    let holidayDetails = new LeaveHoliday(req.body);
    let query = {
        _id: parseInt(req.body._id)
    }
    LeaveHoliday.findOneAndUpdate(query, holidayDetails, function (err, leaveHolidayDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: leaveHolidayDetails
                }
            });
        }
        return done(err, leaveHolidayDetails);
    })
}
function removeHoliday(req, res, done) {
    let holidayDetails = new LeaveHoliday(req.body);
    let query = {
        _id: parseInt(req.body._id)
    }
    LeaveHoliday.findOneAndRemove(query, holidayDetails, function (err, leaveHolidayDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: leaveHolidayDetails
                }
            });
        }
        return done(err, leaveHolidayDetails);
    })
}
function applyLeaveSupervisor(req, res, done) {
    // let leavedetails = new LeaveApply(req.body);
    var query = {
        _id: parseInt(req.body._id),
        isDeleted: false
    }
    let updateQuery;
    if (req.body.isApproved) {
        updateQuery = {
            $set: {
                updatedDate: new Date(),
                updatedBy: parseInt(req.body.emp_id),
                isApproved: req.body.isApproved,
                isCancelled: req.body.isCancelled,
                remark: req.body.remarks,
                status: req.body.status,
                reason: req.body.reason
            }
        };
    } else {
        updateQuery = {
            $set: {
                updatedDate: new Date(),
                updatedBy: parseInt(req.body.emp_id),
                isApproved: req.body.isApproved,
                isCancelled: req.body.isCancelled,
                cancelReason: req.body.remarks,
                status: req.body.status,
                reason: req.body.reason
            }
        };
    }

    LeaveApply.findOneAndUpdate(query, updateQuery, {
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
        return done(err, _leaveDetails);
    })
}
function getApprovedLeavesByMonth(appliedLeaves, res) {
    let monthlyLeaves = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    appliedLeaves.forEach((leave) => {
        //      const fromDtMonth =  commonService.getMonthFromDate(leave.fromDate),
        //     toDtMonth = commonService.getMonthFromDate(leave.toDate);
        let _fromDate = new Date(leave.fromDate);
        let _toDate = new Date(leave.toDate);
        const fromDtMonth = _fromDate.getUTCMonth() + 1;
        toDtMonth = _toDate.getUTCMonth() + 1;
        if (fromDtMonth === toDtMonth) {
            // let noOfLeaves = (commonService.getDayFromDate(leave.toDate) - commonService.getDayFromDate(leave.fromDate)) + 1,
            let noOfLeaves = ((new Date(leave.toDate)).getUTCDate() - (new Date(leave.fromDate)).getUTCDate()) + 1,
                d = new Date(leave.fromDate);
            monthlyLeaves[d.getUTCMonth()] += noOfLeaves;
        } else {
            const monthDiff = toDtMonth - fromDtMonth;
            const d = new Date(leave.fromDate),
                lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            // monthlyLeaves[d.getUTCMonth()] += (lastDay.getDate() - commonService.getDayFromDate(leave.fromDate) + 1);
            // monthlyLeaves[new Date(leave.toDate).getUTCMonth()] += commonService.getDayFromDate(leave.toDate);
            monthlyLeaves[d.getUTCMonth()] += (lastDay.getDate() - (new Date(leave.fromDate)).getUTCDate() + 1);
            monthlyLeaves[new Date(leave.toDate).getUTCMonth()] += (new Date(leave.toDate)).getUTCDate();

            for (let i = 1; i < monthDiff; i++) {
                const str = fromDtMonth + i + '/01/' + d.getFullYear(),
                    dt = new Date(str),
                    lstDy = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
                monthlyLeaves[new Date(leave.fromDate).getUTCMonth() + i] += lstDy.getDate();
            }
        }
    });
    return res.status(200).json(monthlyLeaves);
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
                            { "isApproved": true, "isCancelled": null }, //leave approved
                            { "isApproved": true, "isCancelled": false }, //leave approved and pending to approve cancellation
                            { "isApproved": null, "isCancelled": null } //when leave applied
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
                results1.forEach((x) => {
                    const balLeaveObj = results2.find(p => p._id === x.leave_type);
                    obj = {
                        'leaveType': x.leave_type,
                        'leaveBalance': Math.round((x.balance - (balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)))
                    };
                    response.push(obj);
                })

                return res.status(200).json(response);
            })
    });
}
async function processLeaveTransaction(req, res) {
    let newFinancialYearId = req.body.NewFinancialYearId;
    let PreviousFinancialYearId = req.body.PreviousFinancialYearId;
    let financialYearQuerySelector = {
        'isDeleted': false,
        'financialYearId': parseInt(req.body.NewFinancialYearId)
    }
    var financialYearProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        isYearActive: false
    };
    var financialYearResponse = await FinancialYear.find(financialYearQuerySelector, financialYearProjection, function (err, dataaa) {
        if (err) {
            return err;
        }
        else
            return dataaa;
    });
    let epmInfoQuerySelector = {
        'isDeleted': false,
    }
    var AllEmployeesDetails = await EmployeeInfo.find(epmInfoQuerySelector, function (err, empInfoDetails) {
        if (err) {
            return err;
        }
        else {
            return empInfoDetails;
        }
    });
    let AppliedLeaveBalanceQuerySelector = {
        $or: [{
            'isDeleted': false,
            // 'fiscalYearId': PreviousFinancialYearId,
            "leave_type": 1
        },
        {
            'isDeleted': false,
            // 'fiscalYearId': PreviousFinancialYearId,
            "leave_type": 2
        }]
    };
    var appliedLeaveDetails = await LeaveApply.find(AppliedLeaveBalanceQuerySelector, {}, function (err, leaveAppliedData) {
        if (err) {
            return err;
        }
        else {
            return leaveAppliedData;
        }
    });

    let empConsumedLeaveBalanceStatus = [];
    let tempObj = {};
    // calculating all employee current consumed leaves
    AllEmployeesDetails.forEach(emp => {
        tempObj = {};
        tempObj.emp_id = emp._id;
        //NEED TO CHANGE CONDITION TO CALCULATE BOTH LEAVE CONSUMED BALANCE
        tempObj.annualLeave = appliedLeaveDetails.filter(f => f.leave_type === 1 && f.isApproved === true && f.emp_id == emp._id).length;
        tempObj.sickLeave = appliedLeaveDetails.filter(f => f.leave_type === 2 && f.isApproved === true && f.emp_id == emp._id).length;
        empConsumedLeaveBalanceStatus.push(tempObj);
    });

    let LeaveBalanceQuerySelector = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
        isYearActive: false,
        // lapseDate: false, // need to remove this 
    }

    //get all employee leave balance from last financial year
    let LeaveBalanceDetails = await LeaveBalance.find({ $or: [{ 'isDeleted': false, "leave_type": 1 }, { 'isDeleted': false, "leave_type": 2 }] }, LeaveBalanceQuerySelector, function (err, leaveBalanceDetails) {
        return leaveBalanceDetails;
    });

    let finalCalculatedBalance = [];
    empConsumedLeaveBalanceStatus.forEach(element => {
        tempObj = {};
        let empAnnualLeaveDetails = LeaveBalanceDetails.filter(f => f.emp_id === element.emp_id && f.leave_type === 1)[0];
        let empSickLeaveDetails = LeaveBalanceDetails.filter(f => f.emp_id === element.emp_id && f.leave_type === 2)[0];
        let remainingAnnualLeave = 0;
        let remainingSickLeave = 0;
        if (empAnnualLeaveDetails !== undefined)
            remainingAnnualLeave = Number(empAnnualLeaveDetails.balance) - Number(element.annualLeave);
        if (empSickLeaveDetails !== undefined)
            remainingSickLeave = Number(empSickLeaveDetails.balance) - Number(element.sickLeave);

        let carryforwardLeave = 0;
        let encashedforwardLeave = 0;
        let lapsedforwardLeave = 0;
        let lapsedSickLeave = 0;

        if (empSickLeaveDetails !== undefined)
            lapsedSickLeave = remainingSickLeave
        if (empAnnualLeaveDetails !== undefined) {
            //lapsed annual leave
            if (remainingAnnualLeave > 10) {
                lapsedforwardLeave = remainingAnnualLeave - 10;
                remainingAnnualLeave -= lapsedforwardLeave;
            } else {
                lapsedforwardLeave = 0;
            }
            // encashed leaves
            if (remainingAnnualLeave > 5) {
                encashedforwardLeave = remainingAnnualLeave - 5;
                remainingAnnualLeave -= encashedforwardLeave;
            } else {
                encashedforwardLeave = 0;
            }
            //forward leave balance
            if (remainingAnnualLeave > 0) {
                carryforwardLeave = remainingAnnualLeave;
                remainingAnnualLeave = 0;
            } else {
                remainingAnnualLeave = 0;
            }
        }
        tempObj = {};
        tempObj.emp_id = element.emp_id;
        tempObj.annualLeaveCarryForward = carryforwardLeave;
        tempObj.annualLeavelapsed = lapsedforwardLeave;
        tempObj.annualLeaveencahsed = encashedforwardLeave;
        tempObj.sickLeavelapsed = lapsedSickLeave;
        finalCalculatedBalance.push(tempObj);
    });

    // #region--for Entry in leaveDetailsCarryForward
    await addLapsedLeave(finalCalculatedBalance);
    //#endregion --for Entry in leaveDetailsCarryForward
    await performOperationOnLeaveBalance(PreviousFinancialYearId, newFinancialYearId, finalCalculatedBalance);
}
async function addLapsedLeave(lappsedLeaveData) {
    let lappsedLeaveAdd = await (async function (i) {
        console.log(i);
        if (i < lappsedLeaveData.length) {
            let leaveCarryForwardDetails = new LeaveDetailsCarryForward(lappsedLeaveData[i]);
            leaveCarryForwardDetails.emp_id = lappsedLeaveData[i].emp_id;
            leaveCarryForwardDetails.sickLeavelapsed = lappsedLeaveData[i].sickLeavelapsed;
            leaveCarryForwardDetails.annualLeavelapsed = lappsedLeaveData[i].annualLeavelapsed;
            leaveCarryForwardDetails.annualLeaveencahsed = lappsedLeaveData[i].annualLeaveencahsed;
            leaveCarryForwardDetails.annualLeaveCarryForward = lappsedLeaveData[i].annualLeaveCarryForward;
            leaveCarryForwardDetails.fiscalYearId = 1;
            await leaveCarryForwardDetails.save(function (err, leaveCarryForwardData) {
                if (err) {
                    console.log(err);
                }
                else {
                    return leaveCarryForwardData;
                }
            });
            return await lappsedLeaveAdd(i + 1);
        } else {
            console.log('return');
            return;
        }
    })
    return await lappsedLeaveAdd(0);
}
async function performOperationOnLeaveBalance(oldId, newId, lappsedLeaveData) {
    let query = {
        $or:
            [{
                'isDeleted': false,
                'fiscalYearId': oldId,
                "leave_type": 1
            },
            {
                'isDeleted': false,
                'fiscalYearId': oldId,
                "leave_type": 2
            }]
    }
    await LeaveBalance.find(query, function (err, leaveBalanceData) {
        leaveBalanceData.forEach(element => {
            LeaveBalance.findOneAndUpdate({ "_id": element._id }, { "$set": { "isDeleted": true } }, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                else {
                    return doc;
                }
            });
        });
        return leaveBalanceData;
    });

    await addAnnualLeave(newId, lappsedLeaveData);
    await addSickLeave(newId, lappsedLeaveData);
}
async function addAnnualLeave(newId, lappsedLeaveData) {
    let addAnnualLeaveBalance = await (async function (i) {
        if (i < lappsedLeaveData.length) {
            let leaveBalance = new LeaveBalance();
            leaveBalance.emp_id = parseInt(lappsedLeaveData[i].emp_id);
            leaveBalance.leave_type = 1;
            leaveBalance.balance = 20 + parseInt(lappsedLeaveData[i].annualLeaveCarryForward);
            leaveBalance.fiscalYearId = newId;
            leaveBalance.isDeleted = false;
            await leaveBalance.save((err, data) => {
                if (err) {
                    console.log(err);
                }
                else {
                    return data;
                }
            });
            return await addAnnualLeaveBalance(i + 1);
        } else {
            return;
        }
    });
    return await addAnnualLeaveBalance(0);
}
async function addSickLeave(newId, lappsedLeaveData) {
    let addSickLeaveBalance = await (async function (i) {
        if (i < lappsedLeaveData.length) {
            let sickLeaveBalance = new LeaveBalance();
            sickLeaveBalance.emp_id = parseInt(lappsedLeaveData[i].emp_id);
            sickLeaveBalance.leave_type = 2;
            sickLeaveBalance.balance = 14;
            sickLeaveBalance.isDeleted = false;
            sickLeaveBalance.fiscalYearId = newId;
            await sickLeaveBalance.save((err, data) => {
                if (err) {
                    console.log(err);
                }
                else {
                    return data;
                }
            });
            return await addSickLeaveBalance(i + 1);
        } else {
            return;
        }
    });
    return await addSickLeaveBalance(0);
}
async function grantMaternityLeave(req, res) {
    let leaveBalanceResponse = await LeaveBalance.find({ "emp_id": req.body.emp_id, "leave_type": 3 }, function (err, leaveBalanceData) {
        if (err) {
            return err;
        }
        else {
            return leaveBalanceData;
        }
    });

    if (leaveBalanceResponse.length !== 0) {
        let maternityLeaveDetail = {
            $set: {
                isDeleted: false,
                startDate: new Date(req.body.fromDate),
                endDate: new Date(req.body.toDate),
                balance: parseInt(req.body.balance),
                leave_type: 3,
            }
        };
        var query = {
            _id: parseInt(leaveBalanceResponse[0]._id),
            isDeleted: false
        }
        LeaveBalance.findOneAndUpdate(query, maternityLeaveDetail, function (err, response) {
            if (err) {
                return res.status(403).json({
                    title: 'There is a problem',
                    error: {
                        message: err
                    },
                    result: {
                        message: response
                    }
                });
            }
            else {
                return res.status(200).json(response);
            }
        })
    }
    else {
        let _leaveBalance = new LeaveBalance(req.body);
        _leaveBalance.emp_id = parseInt(req.body.emp_id);
        _leaveBalance.leave_type = 3;
        _leaveBalance.isDeleted = false;
        _leaveBalance.balance = parseInt(req.body.balance);
        _leaveBalance.startDate = new Date(req.body.fromDate);
        _leaveBalance.endDate = new Date(req.body.toDate);
        _leaveBalance.save(function (err, response) {
            if (err) {
                return res.status(403).json({
                    title: 'There is a problem',
                    error: {
                        message: err
                    },
                    result: {
                        message: response
                    }
                });
            }
            else {
                return res.status(200).json(response);
            }
        })
    }
}

let functions = {
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
    },
    getEmployeeLeaveDetails: (req, res) => {
        LeaveApply.aggregate([
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
            { "$match": { "isDeleted": false, "emp_id": parseInt(req.query.emp_id), "fiscalYearId": parseInt(req.query.fiscalYearId) } },
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
                    "toDate": "$toDate",
                    "fromDate": "$fromDate",
                    "reason": "$reason",
                    "status": "$status"

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
    },
    getCancelEmployeeLeaveDetails: (req, res) => {
        LeaveApply.aggregate([
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
                "$match": {
                    $and: [
                        { "isDeleted": false },
                        { "emp_id": parseInt(req.query.emp_id) },
                        {
                            //skip records where isCancelled is true
                            $or: [{ "isCancelled": null, "isApproved": true },
                            { "isCancelled": false, "isApproved": true },
                            { "isCancelled": null, "isApproved": null },],

                        }
                        // {
                        //     //skip records where isRejected is true
                        //     $or: [ { "isApproved": true }]
                        // }
                    ]
                }
            },
            // { "$match": { "isDeleted": false, "emp_id": parseInt(req.query.emp_id), "isCancelled" : null , "isCancelled" : false } },
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
                    "isForwarded": "$isForwarded",
                    "ccTo": "$ccTo",
                    "contactDetails": "$contactDetails",
                    "applyTo": "$applyTo",
                    "applyTo_name": "$sup_name.fullName",
                    "toDate": "$toDate",
                    "fromDate": "$fromDate",
                    "reason": "$reason",
                    "status": "$status"

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
            // results.forEach((x) => {
            //     if ((x.isForwarded === null || x.isForwarded === undefined) && (x.isCancelled === null || x.isCancelled === undefined) && (x.isApproved === null || x.isApproved === undefined)) {
            //         x.status = "pending"
            //     }
            //     else if (x.isForwarded === true && (x.isCancelled === null || x.isCancelled === undefined) && (x.isApproved === null || x.isApproved === undefined)) {
            //         x.status = "forwarded"
            //     }
            //     else if ((x.isForwarded === null || x.isForwarded === undefined) && (x.isCancelled === null || x.isCancelled === undefined) && x.isApproved === true) {
            //         x.status = "approved"
            //     }
            // })
            return res.status(200).json({ "data": results });
        });
    },
    postCancelLeave: (req, res) => {
        async.waterfall([
            function (done) {
                cancelLeave(req, res, done);
            }, function (_cancelLeaveDetails, done) {
                return res.status(200).json(_cancelLeaveDetails);
            }
        ])
    },
    postLeaveWorkflowDetails: (req, res) => {
        async.waterfall([
            function (done) {
                cancelLeave(req, res, done);
            }, function (_cancelLeaveDetails, done) {
                return res.status(200).json(_cancelLeaveDetails);
            }
        ])
    },
    getLeaveWorkflowDetails: (req, res) => {
        LeaveWorkflowHistory.aggregate([
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
                    "localField": "Owner",
                    "foreignField": "_id",
                    "as": "Owner_name"
                }
            },
            {
                "$unwind": {
                    path: "$Owner_name",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "appliedLeaveId",
                    "foreignField": "_id",
                    "as": "leavesDetail"
                }
            },
            {
                "$unwind": {
                    path: "$leavesDetail",
                    "preserveNullAndEmptyArrays": true
                }
            },
            { "$match": { "isDeleted": false, "appliedLeaveId": parseInt(req.query.id) } },
            {
                "$project": {
                    "_id": "$_id",
                    "emp_id": "$emp_id",
                    "emp_name": "$emp_name.fullName",
                    "leave_type": "$leave_type",
                    "leave_type_name": "$leavesDetail.type",
                    "Owner": "$Owner",
                    "Owner_name": "$Owner_name.fullName",
                    "updatedAt": "$updatedAt",
                    "Status": "$Status"
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
    },
    getSupervisorLeaveDetails: (req, res) => {
        LeaveApply.aggregate([
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
            { "$match": { "isDeleted": false, "applyTo": parseInt(req.query.emp_id) } },
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
                    "toDate": "$toDate",
                    "fromDate": "$fromDate",
                    "reason": "$reason",
                    "status": "$status"

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
    },
    getHRLeaveDetails: (req, res) => {
        LeaveApply.aggregate([
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
            { "$match": { "isDeleted": false } },
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
                    "toDate": "$toDate",
                    "fromDate": "$fromDate",
                    "reason": "$reason",
                    "status": "$status"

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
    },
    grantLeaveByEmployee: (req, res) => {
        async.waterfall([
            function (done) {
                grantLeaveEmployee(req, res, done);
            }, function (_leaveGrantedEmployee, done) {
                return res.status(200).json(_leaveGrantedEmployee);
            }
        ])
    },
    grantLeaveByDepartment: (req, res) => {
        async.waterfall([
            function (done) {
                grantLeaveDepartment(req, res, done);
            }, function (_leaveGrantedDepartment, done) {

                return res.status(200).json(_leaveGrantedDepartment);
            }
        ])
    },
    grantLeaveAllEmployee: (req, res) => {
        async.waterfall([
            function (done) {
                grantLeaveAll(req, res, done);
            }, function (_leaveGrantAll, done) {
                return res.status(200).json(_leaveGrantAll);
            }
        ])
    },
    //no use
    getEmployeeLeaveBalance: (req, res) => {
        let query = {
            'isDeleted': false,
            'emp_id': parseInt(req.query.id)
        };
        LeaveBalance.find(query, function (err, leaveBalanceData) {
            if (leaveBalanceData) {
                return res.status(200).json(leaveBalanceData);
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

    getLeaveDetailsByRole: (req, res) => {
        let query = {
            'roleName': req.query.role
        };

        EmployeeRoles.find(query, function (err, roleDetails) {
            if (roleDetails) {
                if (roleDetails[0].roleName == 'HR') {
                    LeaveApply.aggregate([
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
                                "toDate": "$toDate",
                                "fromDate": "$fromDate",
                                "reason": "$reason",
                                "status": "$status",
                                "employmentStatus": "$employeeofficedetails.employmentStatus_id"
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
                        return res.status(200).json(results.sort(function (a, b) {
                            return b._id - a._id;
                        }));
                    });
                }
                else if (roleDetails[0].roleName == 'Supervisor') {
                    LeaveApply.aggregate([
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
                        { "$match": { "isDeleted": false, "applyTo": parseInt(req.query.emp_id) } },
                        {
                            "$project": {
                                "_id": "$_id",
                                "emp_id": "$emp_id",
                                "emp_name": "$emp_name.fullName",
                                "url": "$emp_name.profileImage",
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
                                "toDate": "$toDate",
                                "fromDate": "$fromDate",
                                "reason": "$reason",
                                "status": "$status",
                                "employmentStatus": "$employeeofficedetails.employmentStatus_id"
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
                        return res.status(200).json(results.sort(function (a, b) {
                            return b._id - a._id;
                        }));
                    });
                }
                else {
                    return res.status(403).send('you are not authorised to perform this action');

                }
            }
        })
    },
    postLeaveHoliday: (req, res) => {
        async.waterfall([
            function (done) {
                addHoliday(req, res, done);
            },
            function (_holidayDetails, done) {
                return res.status(200).json(_holidayDetails);
            }
        ])
    },
    postLeaveCarry: (req, res) => {
        async.waterfall([
            function (done) {
                addleaveCarryForward(req, res, done);
            },
            function (_leaveCarryForward, done) {
                return res.status(200).json(_leaveCarryForward);
            }

        ])
    },
    getHolidays: (req, res) => {
        let queryDate = req.query.date;
        LeaveHoliday.find({}, function (err, LeaveHolidaysData) {
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
    updateHoliday: (req, res) => {
        async.waterfall([
            function (done) {
                updateHoliday(req, res, done);
            },
            function (_holidayDetails, done) {
                return res.status(200).json(_holidayDetails);
            }
        ])
    },
    removeHoliday: (req, res) => {
        async.waterfall([
            function (done) {
                removeHoliday(req, res, done);
            },
            function (_holidayDetails, done) {
                return res.status(200).json(_holidayDetails);
            }
        ])
    },
    postAcceptRejectLeave: (req, res) => {
        async.waterfall([
            function (done) {
                applyLeaveSupervisor(req, res, done);
            },
            function (_applyLeaveDetails, done) {
                return res.status(200).json(_applyLeaveDetails);
            }
        ])
    },
    getLeaveBalance: (req, res) => {
        singleEmployeeLeaveBalance(req.query.empId, req.query.fiscalYearId, res);
    },
    getLeaveDetailsById: (req, res) => {
        LeaveApply.aggregate([
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
            { "$match": { "isDeleted": false, "_id": parseInt(req.query.id) } },
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
                    "toDate": "$toDate",
                    "fromDate": "$fromDate",
                    "reason": "$reason",
                    "status": '$status',
                    "employmentStatus": "$employeeofficedetails.employmentStatus_id"
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

    },
    getLeavesByMonth: (req, res) => {
        const query = {
            $or:
                [{
                    "isDeleted": false,
                    "isApproved": true,
                    "isCancelled": false
                },
                {
                    "isDeleted": false,
                    "isApproved": true,
                    "isCancelled": null
                }]
        };
        LeaveApply.find(query, function (err, appliedLeaves) {
            if (err) {
                return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    },
                    result: {
                        message: appliedLeaves
                    }
                });
            }
            getApprovedLeavesByMonth(appliedLeaves, res);
        });
    },
    getLeavesByLeaveType: (req, res) => {
        let query = {
            'isDeleted': false,
        };
        LeaveTypes.find(query, function (err, leaveTypesData) {
            if (leaveTypesData) {
                const query = {
                    $or:
                        [{
                            "isDeleted": false,
                            "isApproved": true,
                            "isCancelled": false
                        },
                        {
                            "isDeleted": false,
                            "isApproved": true,
                            "isCancelled": null
                        }]
                };
                LeaveApply.find(query, function (err1, appliedLeaves) {
                    if (err1) {
                        return res.status(403).json({
                            title: 'Error',
                            error: {
                                message: err
                            },
                            result: {
                                message: appliedLeaves
                            }
                        });
                    }
                    getLeavesByType(leaveTypesData, appliedLeaves, res);
                });
            }
            if (err) {
                return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    },
                    result: {
                        message: leaveTypesData
                    }
                });
            }

        })
    },
    getAllEmployee: (req, res) => {
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
            { "$match": { "isDeleted": false, "designations.isActive": true, "officeDetails.isDeleted": false } },
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
            return res.status(200).json({ "data": results });
        });
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
                    return res.status(200).json({ "result": true });
                else
                    return res.status(200).json({ "result": false });
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
    postLeaveTransactionYear: (req, res) => {
        processLeaveTransaction(req, res);
    },
    grantMaternityLeave: (req, res) => {
        grantMaternityLeave(req, res);
    },
    getEmpMaternityLeaveDetails: (req, res) => {
        let query = {
            'isDeleted': false,
            'emp_id': parseInt(req.query.id),
            'leave_type': 3
        };
        LeaveBalance.find(query, function (err, maternityLeaveDetails) {
            if (maternityLeaveDetails) {
                return res.status(200).json({ "result": maternityLeaveDetails });
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


module.exports = functions;