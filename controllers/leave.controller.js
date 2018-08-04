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
    let query = {};
    if (month != null && month != undefined) {
        matchQuery = {$match: {"monthStart": parseInt(month)}}
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
            // Stage 1
//            {
//                $match: {
//                    $or: [{ "emp_id": empId, "fiscalYearId": _fiscalYearId, "leave_type": 1 },
//                    { "emp_id": empId, "fiscalYearId": _fiscalYearId, "leave_type": 2 },
//                    { "emp_id": empId, "leave_type": 3 },
//                    { "emp_id": empId, "leave_type": 4 }]
//
//                }
//            },

            // Stage 2
//            {
//                $project: {
//                    leave_type: 1,
//                    balance: 1,
//                    monthStart:1,
//                }
//            },

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
                    console.log(x)
                    const balLeaveObj = results2.find(p => p._id === x.leave_type);
                    obj = {

                        'leaveType': leaveType[x.leave_type-1],
                        'appliedLeave': Math.round( (balLeaveObj === undefined ? 0 : balLeaveObj.totalAppliedLeaves)),
                        'allotedLeave': Math.round(x.balance)
                    };
                    response.push(obj);

                })
                console.log("1",results2)
                results2.forEach((x) => {
                    const balLeaveObj = results1.find(p => p.leave_type === x._id);
                     if (balLeaveObj === undefined) {
                        obj = {
                            'leaveType': leaveType[x._id-1],
                            'appliedLeave': Math.round(x.totalAppliedLeaves),
                            'allotedLeave': (x.balance == null || x.balance == undefined) ? 0 : Math.round(x.balance)
                        };
                        response.push(obj);
                     }
                })
                console.log("2",response)

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
        let projectQuery = {$project: {emp_id: 1, fiscalYearId:1, leave_type:1, fromDate:1, toDate:1, status:1, monthStart: {$month: '$fromDate'}}};
        
        if (req.query.empId) {
            queryObj['$match']["$and"].push({emp_id:parseInt(req.query.empId)})
        }
        if (req.query.month) {
            queryObj['$match']["$and"].push({monthStart:parseInt(req.query.month)})

        } 
        if (req.query.status) {
            queryObj['$match']["$and"].push({status:req.query.status})
        }
        console.log(queryObj['$match'])
        LeaveApply.aggregate([
            projectQuery,
            queryObj
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
        }, leavedetails:{days:1, leave_type:1}, monthStart: {$month: '$leavedetails.fromDate'}, yearStart: {$year: '$leavedetails.fromDate'}}};
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
                    totalAppliedLeaves: { $sum: "$leavedetails.days" }
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



}


module.exports = functions;