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
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),

    config = require('../config/config'),
    crypto = require('crypto'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    uuidV1 = require('uuid/v1');
require('dotenv').load()
function singleEmployeeLeaveBalance(currentEmpId, fiscalYearId, month, year, res) {
    let empId = parseInt(currentEmpId);
    let _fiscalYearId = parseInt(fiscalYearId);
    let projectQuery = {$project: {emp_id: 1,fiscalYearId:1,leave_type:1,balance:1, monthStart: {$month: '$startDate'}, yearStart: {$year: '$startDate'}}};
    let matchQuery = {$match: {"emp_id": empId}}
    let queryObj = {'$match':{}};
        queryObj['$match']['$and']=[{"emp_id": empId}]
    let query = {};
    if (month != null && month != undefined) {
        queryObj['$match']['$and'].push({"monthStart": parseInt(month)})
    }
    if (year != null && year != undefined) {
        queryObj['$match']['$and'].push({"yearStart": parseInt(year)})
    }
    if (year != null && year != undefined) {
        // matchQuery = {$match: {"yearStart": parseInt(year)}};
        query =  {
            $match: {
                $or: [{ "emp_id": empId, "yearStart": parseInt(year), "leave_type": 1 },
                { "emp_id": empId, "yearStart": parseInt(year), "leave_type": 2 },
                { "emp_id": empId, "leave_type": 3 },
                { "emp_id": empId, "leave_type": 4 }]
    
            }
        }
    } else {
        query =  {
            $match: {
                $or: [{ "emp_id": empId, "fiscalYearId": _fiscalYearId, "leave_type": 1 },
                { "emp_id": empId, "fiscalYearId": _fiscalYearId, "leave_type": 2 },
                { "emp_id": empId, "leave_type": 3 },
                { "emp_id": empId, "leave_type": 4 }]
    
            }
        }
    }
    LeaveBalance.aggregate(
        // Pipeline
        [   projectQuery,
            query,
            matchQuery,
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
                {
                    $project: {
                        emp_id: 1,
                        leave_type:1,
                        status:1,
                        toDate:1,
                        fromDate:1,
                        days:1,
                        monthStart: {$month: '$fromDate'}, 
                        yearStart: {$year: '$fromDate'}
                    }
                },
                // Stage 1
                {
                    $match: {
                        "emp_id": empId,

                        // "isApproved": true
                    }
                },
                queryObj,
                // Stage 2
                {
                    $addFields: {
                        "diffDate": { $subtract: ["$toDate", "$fromDate"] }
                    }
                },

                // Stage 3
                {
                    $addFields: {
                        "intDate": { $add: [{ $divide: ["$diffDate", 86400000] },1] }
                    }
                },

                {
                    "$match": {
                        $or: [
                            { "status": "Applied" }, //leave approved
                            { "status": "Applied (Pending)" }, //leave approved and pending to approve cancellation
                            // { "status": null} //when leave applied
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
                        totalAppliedLeaves: { $sum: "$days" }
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
                        'leaveTypeId': x.leave_type,
                        'leaveType': leaveType[x.leave_type-1],
                        'appliedLeave': Math.round( (balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)),
                        'allotedLeave': Math.round(x.balance),
                        'leaveBalance': Math.round(x.balance) - (Math.round( (balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)))
                    };
                    response.push(obj);

                })
                results2.forEach((x) => {
                    const balLeaveObj = results1.find(p => p.leave_type === x._id);
                     if (balLeaveObj === undefined) {
                        obj = {
                            'leaveTypeId': x._id,
                            'leaveType': leaveType[x._id-1],
                            'appliedLeave': Math.round(x.totalAppliedLeaves),
                            'allotedLeave': (x.balance == null || x.balance == undefined) ? 0 : Math.round(x.balance),
                            'leaveBalance': (x.balance == null || x.balance == undefined) ? 0 : Math.round(x.balance) - Math.round(x.totalAppliedLeaves)
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
                            'leaveTypeId': parseInt(index)+1,
                            'leaveType': x,
                            'appliedLeave': 0,
                            'allotedLeave': 0,
                            'leaveBalance': 0
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
                const sd = new Date(new Date(req.body.fromDate).getTime() + 86400000),
                      ed = new Date(new Date(req.body.toDate).getTime() + 86400000);
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
function cancelLeave(req, res, done) {
    let cancelLeaveDetals = {
        $set: {
            cancelLeaveApplyTo: parseInt(req.body.cancelLeaveApplyTo),
            updatedBy: parseInt(req.body.updatedBy),
            cancelReason: req.body.cancelReason,
            reason: req.body.reason,
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
        return done(err, _leaveDetails);
    })

}
let functions = {
    getLeaveBalance: (req, res) => {
        singleEmployeeLeaveBalance(req.query.empId, req.query.fiscalYearId, req.query.month, req.query.year, res);
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
    
    getHolidays: (req, res) => {
        let queryYear = req.query.year;
        let queryMonth = req.query.month;
        let upcoming = req.query.upcoming;
        LeaveHoliday.find({}, function (err, LeaveHolidaysData) {
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
        let queryObj = {'$match':{}};
        queryObj['$match']['$and']=[]
        let projectQuery = {$project: {emp_id: 1, fiscalYearId:1, leave_type:1, fromDate:1, toDate:1, status:1, days:1, monthStart: {$month: '$fromDate'}, yearStart: {$year: '$fromDate'}}};
        let empId;
        if (req.query.empId) {
            empId = parseInt(req.query.empId);
            queryObj['$match']["$and"].push({emp_id:parseInt(req.query.empId)})
        }
        if (req.query.month) {
            queryObj['$match']["$and"].push({monthStart:parseInt(req.query.month)})
        } 
        if (req.query.year) {
            queryObj['$match']["$and"].push({yearStart:parseInt(req.query.year)})
        } 
        if (req.query.status) {
            queryObj['$match']["$and"].push({status:req.query.status})
        }
        LeaveApply.aggregate([
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
                $group: {
                    _id:"$_id",
                    leaveTypeName:{$first:"$leaveTypeDetails.type"},
                    leave_type:{$first:"$leaveTypeDetails._id"},
                    emp_id:{$first:"$emp_id"},
                    fromDate:{$first:"$fromDate"},
                    toDate:{$first:"$toDate"},
                    status:{$first:"$status"},
                    days:{$first:"$days"},
                    reason:{$first:"$reason"},
                }
            },

        ]).exec(function(err, LeaveTransactionDetails){
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
    getUpcomingHoliday: (req, res) => {
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
        let projectQuery = {$project: {isActive: 1, primarySupervisorEmp_id:1, emp_id:1,leaveTypeName:{
            _id:1, type:1
        }, leavedetails:{days:1, leave_type:1, fromDate:1}, monthStart: {$month: '$leavedetails.fromDate'}, yearStart: {$year: '$leavedetails.fromDate'}}};
        let queryObj = {'$match':{}};
        queryObj['$match']['$and']=[{ "isActive": true}]
        
        
        if (month) {
            queryObj['$match']["$and"].push({monthStart:parseInt(month)})
        } 
        if (year) {
            queryObj['$match']["$and"].push({yearStart:parseInt(year)})
        } 
        SupervisorInfo.aggregate([
            { "$match": { "isActive": true, "primarySupervisorEmp_id": parseInt(primaryEmpId) } },

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
                    "from": "leaveTypes",
                    "localField": "leavedetails.leave_type",
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
                    _id:"$leaveTypeName._id",
                    leaveTypeName:{$first:"$leaveTypeName.type"},
                    yearStart:{$first:"$yearStart"},
                    monthStart:{$first:"$monthStart"},
                    isActive:{$first:"$isActive"},
                    totalAppliedLeaves: { $sum: "$leavedetails.days" },
                }
            },
            queryObj

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
    getSupervisorTeamMember: (req, res) => {
        let primaryEmpId = req.query.empId;
        let month = req.query.month;
        let year = req.query.year;
        
        let queryObj = {'$match':{}};
        queryObj['$match']['$and']=[{ "isActive": true}]
        if (month) {
            queryObj['$match']['$and'].push({month:parseInt(month)})
        } 
        if (year){
            queryObj['$match']['$and'].push({year:parseInt(year)})
        }
        SupervisorInfo.aggregate([
            { "$match": { "isActive": true, "primarySupervisorEmp_id": parseInt(primaryEmpId) } },
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
                "$project": {
                    _id:1,
                    isActive:1,
                    "month" :{$month:"$leavedetails.fromDate"},
                    "year" :{$year:"$leavedetails.fromDate"},
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
                        "fromDate": 1,
                        "toDate": 1,
                        "days": 1,
                        "leave_type":1
                        
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
            return res.status(200).json({ "data": results });
        });
    },
    getLeaveDetailsByFilter: (req, res) => {
        let primaryEmpId, empId, matchQuery;
        if (req.query.supervisorId) {
            primaryEmpId = req.query.supervisorId
            matchQuery = {'$match':{ "primarySupervisorEmp_id":  parseInt(primaryEmpId)}};
        } else {
            empId = req.query.empId;
            matchQuery = {'$match':{ "emp_id":  parseInt(empId)}};

        }
        let month ,year, leave_type;
        let queryObj = {'$match':{}};
        queryObj['$match']['$and']=[{ "isActive": true}]
        if (req.query.month) {
            month = req.query.month;
            queryObj['$match']['$and'].push({month:parseInt(month)})
        } 
        if (req.query.year) {
            year = req.query.year;
            queryObj['$match']['$and'].push({year:parseInt(year)})
        } 
        if (req.query.leave_type) {
            leave_type = req.query.leave_type;
            queryObj['$match']['$and'].push({leave_type:parseInt(leave_type)})
        }
        if (req.query.status) {
            queryObj['$match']['$and'].push({leaveStatus:req.query.status})
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
                "$project": {
                    _id:1,
                    isActive:1,
                    "month" :{$month:"$leavedetails.fromDate"},
                    "year" :{$year:"$leavedetails.fromDate"},
                    "leave_type":"$leavedetails.leaveTypeName._id",
                    "leaveTypeName":"$leavedetails.leaveTypeName.type",
                    "leaveStatus":"$leavedetails.status",
                    employeeDetails: {
                        "_id": 1,
                        "userName": 1,
                        "fullName": 1,
                    },
                    leavedetails: {
                        "_id": 1,
                        "fromDate": 1,
                        "toDate": 1,
                        "days": 1,
                        "leave_type":1,
                        "createdAt":1,
                        "updatedAt":1,

                        "createdByName":{
                            "_id":1,
                            "fullName":1
                        },
                        "updatedByName":{
                            "_id":1,
                            "fullName":1
                        },
                        "updatedBy":1,
                        "createdBy":1,
                        "status":1
                        
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
    withdrawLeave: (req, res) => {
        var query = {
            _id: req.body._id,
            isDeleted: false,
            fromDate: { $gt: new Date() } 
        }
        
        LeaveApply.findOne(query, function(err, leaveapplydetails){
            let updateQuery;
            if (leaveapplydetails.status == 'Approved') {
                updateQuery = {
                    $set: {
                        updatedDate: new Date(),
                        updatedBy: parseInt(leaveapplydetails.emp_id),
                        remarks: (req.body.remarks == undefined || req.body.reason)?leaveapplydetails.reason:req.body.reason,
                        status: "Withdraw (Pending)",
                        reason: (req.body.reason == undefined || req.body.reason)?leaveapplydetails.reason:req.body.reason,
                    }
                };
            } else {
                updateQuery = {
                    $set: {
                        updatedDate: new Date(),
                        updatedBy: parseInt(leaveapplydetails.emp_id),
                        status: "Withdrawn",
                        reason: (req.body.reason == undefined || req.body.reason)?leaveapplydetails.reason:req.body.reason,
                    }
                };
            }
            LeaveApply.update(query, updateQuery, {
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
                return res.status(200).json( _leaveDetails);
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
                return res.status(200).json({ "result": maternityLeaveDetails });
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
        LeaveApply.aggregate([
            { "$match": { "isDeleted": false, "_id": parseInt(req.query.id) } },
            
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
            // {
            //     "$project": {
            //         "_id": "$_id",
            //         "emp_id": "$emp_id",
            //         "emp_name": "$emp_name.fullName",
            //         "leave_type": "$leave_type",
            //         "leave_type_name": "$leaveTypes.type",
            //         "forwardTo": "$forwardTo",
            //         "forwardTo_FullName": "$forwardTo_name.fullName",
            //         "remark": "$remark",
            //         "cancelLeaveApplyTo": "$cancelLeaveApplyTo",
            //         "cancelLeaveApplyTo_name": "$cancelLeave_ApplyTo.fullName",
            //         "cancelReason": "$cancelReason",
            //         "isCancelled": "$isCancelled",
            //         "isApproved": "$isApproved",
            //         "ccTo": "$ccTo",
            //         "contactDetails": "$contactDetails",
            //         "applyTo": "$applyTo",
            //         "applyTo_name": "$sup_name.fullName",
            //         "toDate": "$toDate",
            //         "fromDate": "$fromDate",
            //         "reason": "$reason",
            //         "status": '$status',
            //         "employmentStatus": "$employeeofficedetails.employmentStatus_id"
            //     }
            // }

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
    cancelApproveLeave: (req, res) => {
        var query = {
            _id: parseInt(req.body.id),

        }
        if (req.body.status == 'Approved') {
            updateQuery = {
                $set: {
                    status: "Approved",
                    supervisorReason: req.body.reason,
                }
            };
        } else {
            updateQuery = {
                $set: {
                    status: "Rejected",
                    supervisorReason: req.body.reason,
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
            // leaveWorkflowDetails(_leaveDetails, req.body.updatedBy, 'cancelled');
            return res.status(200).json( _leaveDetails);
        })
        
    },

}


module.exports = functions;