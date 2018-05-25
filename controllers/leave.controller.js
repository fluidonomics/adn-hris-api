let express = require('express'),

    LeaveWorkflowHistory = require('../models/leave/leaveWorkflowHistory.model'),
    LeaveApply = require('../models/leave/leaveApply.model'),
    LeaveHoliday = require('../models/leave/leaveholiday.model'),    
    LeaveTransactionType = require('../models/leave/leaveTransactioType.model'),
    PersonalInfo = require('../models/employee/employeePersonalDetails.model'),
    LeaveTypes = require('../models/leave/leaveTypes.model'),
    Department = require('../models/master/department.model'),
    OfficeDetails = require('../models/employee/employeeOfficeDetails.model'),
    LeaveBalance = require('../models/leave/EmployeeLeaveBalance.model'),
    EmployeeRoles    = require('../models/master/role.model'),
    Employee = require('../models/employee/employeeDetails.model');
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
        emp_id: req.body.emp_id
    };
    LeaveApply.find(query,function(err, details){
        const sd = new Date(req.body.fromDate),
        ed = new Date(req.body.toDate);
        let flag = true;
        for(let i=0; i<details.length; i++){
            if( (sd >= details[i].fromDate && ed <= details[i].toDate) ||
             (sd <= details[i].fromDate && ed >= details[i].fromDate) ||
              (sd <= details[i].toDate && ed >= details[i].toDate)) {
               flag = false;
            }
        }

        if(flag) {
            let leavedetails = new LeaveApply(req.body);
            leavedetails.emp_id = req.body.emp_id || req.query.emp_id;
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
                return done(err, leavesInfoData);
            });
        }else {
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
function getAllEmployeeEmails(req, res) {
    let query = {
        isDeleted: false
    };
    var personalInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
        emergencyContactNumber: false,
        emergencyContactPerson: false,
        maritialStatus: false,
        fatherName: false,
        motherName: false,
        homePhone: false,
        nationality: false,
        religion: false,
        bloodGroup: false,
        dob: false,
        personalMobileNumber: false,
        isCompleted: false
    };
    PersonalInfo.find(query, personalInfoProjection, function (err, personalEmpDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        // var finalResponse;
        // finalResponse._id = personalEmpDetails._id;
        // finalResponse.emp_id = personalEmpDetails.emp_id;
        // finalResponse.personalEmail = personalEmpDetails.personalEmail;
        return res.status(200).json(personalEmpDetails);
    });
}
function cancelLeave(req, res, done) {
    let cancelLeaveDetals = new LeaveApply(req.body);
    // LeaveApply._id = req.body.id;
    cancelLeaveDetals.updatedBy = req.body.emp_id;
    cancelLeaveDetals.cancelReason = req.body.reason;
    cancelLeaveDetals.ccTo = req.body.CCto;
    var query = {
        _id: parseInt(req.body.id),
        isDeleted: false
    }

    var leaveProjection = {
        createdAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    LeaveApply.findOneAndUpdate(query, cancelLeaveDetals, {
        new: true,
        projection: leaveProjection
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
    let _leaveBalance = new LeaveBalance(req.body);
    _leaveBalance.emp_id = parseInt(req.body.emp_id);
    _leaveBalance.leave_type = parseInt(req.body.leave_type);
    _leaveBalance.lapseDate = new Date(req.body.lapseDate);
    _leaveBalance.createdDate = new Date(req.body.createdDate);
    _leaveBalance.updatedDate = new Date(req.body.updatedDate);
    _leaveBalance.balance = parseInt(req.body.balance);
    _leaveBalance.updatedBy = parseInt(req.body.updatedBy);
    _leaveBalance.createdBy = parseInt(req.body.emp_id);
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

    let saveEmployeeLeaveBalance = function (i) {
        if (i < empIdCollection.length) {
            new LeaveBalance({
                emp_id: appliedFor === "employee" ? empIdCollection[i].id : empIdCollection[i].emp_id,
                leave_type: parseInt(req.body.leave_type),
                lapseDate: new Date(req.body.lapseDate),
                createdDate: new Date(req.body.createdDate),
                updatedDate: new Date(req.body.updatedDate),
                balance: parseInt(req.body.balance),
                updatedBy: parseInt(req.body.updatedBy),
                createdBy: parseInt(req.body.createdBy)
            }).save((x, err) => {
                saveEmployeeLeaveBalance(i + 1);
            })
        } else {
            res.status(200).send();
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
function updateHoliday(req, res, done) {
    let holidayDetails = new LeaveHoliday(req.body);
    let query = {
        _id: parseInt(req.body._id)
    }
    LeaveHoliday.findOneAndUpdate(query, holidayDetails, function(err, leaveHolidayDetails){
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
    LeaveHoliday.findOneAndRemove(query, holidayDetails, function(err, leaveHolidayDetails){
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
    let leavedetails = new LeaveApply(req.body);
    var query = {
        _id: parseInt(req.body._id),
        isDeleted: false
    }
    var leaveProjection = {
        createdAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    leavedetails.updatedDate = new Date();
    leavedetails.updatedBy = parseInt(req.body.emp_id);
    leavedetails.isApproved = req.body.isApproved;
    LeaveApply.findOneAndUpdate(query, leavedetails, {
        new: true,
        projection: leaveProjection
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
            { "$match": { "isDeleted": false, "emp_id": parseInt(req.query.emp_id) } },
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
                    "fromDate": "$fromDate"

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
                            $or: [{ "isCancelled": null },
                            { "isCancelled": false }],

                        },
                        {
                            //skip records where isRejected is true
                            $or: [{ "isRejected": null },
                            { "isRejected": false }]
                        }
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
                    "status": '',
                    "ccTo": "$ccTo",
                    "contactDetails": "$contactDetails",
                    "applyTo": "$applyTo",
                    "applyTo_name": "$sup_name.fullName",
                    "toDate": "$toDate",
                    "fromDate": "$fromDate"

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
            results.forEach((x) => {
                if ((x.isForwarded === null || x.isForwarded === undefined) && (x.isCancelled === null || x.isCancelled === undefined) && (x.isApproved === null || x.isApproved === undefined)) {
                    x.status = "pending"
                }
                else if (x.isForwarded === true && (x.isCancelled === null || x.isCancelled === undefined) && (x.isApproved === null || x.isApproved === undefined)) {
                    x.status = "forwarded"
                }
                else if ((x.isForwarded === null || x.isForwarded === undefined) && (x.isCancelled === null || x.isCancelled === undefined) && x.isApproved === true) {
                    x.status = "approved"
                }
            })
            return res.status(200).json({ "data": results });
        });
    },
    getAllEmployeeEmails: (req, res) => {
        getAllEmployeeEmails(req, res);
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
                    "fromDate": "$fromDate"

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
                    "fromDate": "$fromDate"

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
                if(roleDetails[0].roleName == 'HR'){
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
                                "fromDate": "$fromDate"
            
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
                        return res.status(200).json(results);
                    });
                }
                else if(roleDetails[0].roleName == 'Supervisor'){
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
                                "fromDate": "$fromDate"
            
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
                else{
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
    getHolidays: (req, res) => {
        let queryDate =  req.query.date;
        LeaveHoliday.find({}, function (err, LeaveHolidaysData) {
            if (LeaveHolidaysData) {
                let respdata = [];
                LeaveHolidaysData.forEach( (holiday) => {
                    const holidayDate = new Date(holiday.date);
                    if (holidayDate.getFullYear() == queryDate){
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
    postAcceptRejectLeave: (req, res) =>{
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
        let empId = parseInt(req.query.empId);
        LeaveBalance.aggregate(
            // Pipeline
            [
                // Stage 1
                {
                    $match: {
                        "emp_id": empId
                    }
                },

                // Stage 2
                {
                    $project: {
                        leave_type : 1,
                        balance: 1
                    }
                },

            ]
        ).exec(function(err, results1){
            if(err){
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
                            "isApproved": true
                        }
                    },
            
                    // Stage 2
                    {
                        $addFields: {
                            "diffDate": {$subtract: [ "$toDate", "$fromDate" ]}
                        }
                    },
            
                    // Stage 3
                    {
                        $addFields: {
                            "intDate": {$divide: ["$diffDate", 86400000]}
                        }
                    },
            
                    // Stage 4
                    {
                        $group: {
                            _id: "$leave_type",
                            totalAppliedLeaves: {$sum: "$intDate" }
                        }
                    },
            
                ]).exec(function(err1, results2){
                    if(err1){
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
                    results2.forEach( (result) => {
                        const balLeaveObj = results1.find(x => x.leave_type===result._id),
                        obj = {
                            'leaveType': result._id,
                            'leaveBalance': (balLeaveObj.balance - result.totalAppliedLeaves)
                        };
                        response.push(obj);    
                    });
                    return res.status(200).json(response);
                })
        });
    }
}

module.exports = functions;