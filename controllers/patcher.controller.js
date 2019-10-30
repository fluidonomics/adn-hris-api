let async = require('async'),
    MidTermBatch = require("../models/midterm/midtermbatch"),
    MidTermMaster = require('../models/midterm/midtermmaster'),
    MidTermDetail = require('../models/midterm/midtermdetails'),
    AuditTrail = require('../class/auditTrail'),
    PapBatchDetails = require('../models/pap/papBatch.model'),
    PapMasterDetails = require('../models/pap/papMaster.model'),
    EmployeeSupervisorDetails = require('../models/employee/employeeSupervisorDetails.model'),
    EmployeeDetails = require('../models/employee/employeeDetails.model'),
    EmployeeOfficeDetails = require('../models/employee/employeeOfficeDetails.model'),
    SendEmail = require('../class/sendEmail'),
    PapDetails = require('../models/pap/papDetails.model'),
    KraMaster = require('../models/kra/kraWorkFlowDetails.model'),
    KraDetail = require('../models/kra/kraDetails.model'),
    EmployeeLeaveBalance = require('../models/leave/EmployeeLeaveBalance.model'),
    moment = require('moment');

require('dotenv').load();

// KRA Patches
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

function fixFiscalYearIdOfCollections(req, res) {
    async.waterfall([
        (done) => {
            KraMaster.aggregate([
                {
                    $lookup: {
                        'from': 'kradetails',
                        'localField': '_id',
                        'foreignField': 'kraWorkflow_id',
                        'as': 'kraDetails'
                    }
                },
                {
                    $unwind: {
                        'path': '$kraDetails',
                        'preserveNullAndEmptyArrays': true
                    }
                }
            ]).exec((err, result) => {
                done(err, result);
            })
        },
        (kras, innerDone) => {
            kras.forEach(kra => {
                MidTermDetail.aggregate([
                    {
                        $match: {

                        }
                    },
                    {
                        $lookup: {
                            'from': 'kradetails',
                            'localField': '_id',
                            'foreignField': 'kraWorkflow_id',
                            'as': 'kraDetails'
                        }
                    },
                    {
                        $unwind: {
                            'path': '$kraDetails',
                            'preserveNullAndEmptyArrays': true
                        }
                    }
                ]).exec((err, result) => {

                });
            });
        }

    ], (error, result) => {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        } else {
            return res.status(200).json({
                title: 'Success',
                result: {
                    message: result
                }
            });
        }
    });
}

function fixKraWorkflowIdForMTRCollections(req, res) {
    async.waterfall([
        (done) => {
            MidTermDetail.aggregate([
                {
                    $match: {
                        kraWorkflow_id: null
                    }
                },
                {
                    $lookup: {
                        'from': 'midtermmasters',
                        'localField': 'mtr_master_id',
                        'foreignField': '_id',
                        'as': 'midtermmasters'
                    }
                },
                {
                    $unwind: {
                        'path': '$midtermmasters',
                        'preserveNullAndEmptyArrays': true
                    }
                }
            ]).exec((err, result) => {
                done(err, result);
            })
        },
        (mtrData, done) => {
            mtrData.forEach(mtr => {
                if (mtr.midtermmasters) {
                    KraMaster.find({ emp_id: mtr.midtermmasters.emp_id, status: { $neq: 'Terminated' } })
                        .sort(
                            {
                                "_id": 1.0
                            }
                        ).exec((err, result) => {
                            if (result.length <= 2) {
                                done(err, mtr, result);
                            } else {
                                console.log("Employee has more than 2 kra's | ", mtr.midtermmasters.emp_id);
                            }
                        });
                }
            });
        },
        (mtrData, kraData, done) => {
            let updateCondition = {
                mtr_master_id: mtrData.mtr_master_id
            };
            let updateData = {
                kraWorkflow_id: kraData[0]._id
            }
            MidTermDetail.updateMany(updateCondition, updateData).exec((err, result) => {
                // done(err, result);
            })
        }
    ], (err, result) => {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        } else {
            return res.status(200).json({
                title: 'Success',
                result: {
                    message: result
                }
            });
        }
    });
}

// PAP Patches
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// #114-Fix PAP Overall Rating
function fixPapOverallRating(req, res) {
    async.waterfall([
        (done) => {
            PapMasterDetails.aggregate([{
                '$match': {
                    "status": "Submitted",
                    "reviewerStatus": "Approved",
                    "grievanceRaiseEndDate": null,
                    "grievanceStatus": null,
                }
            },
            {
                '$lookup': {
                    'from': 'papdetails',
                    'localField': '_id',
                    'foreignField': 'pap_master_id',
                    'as': 'papdetails'
                }
            },
            {
                '$unwind': {
                    'path': '$papdetails'
                }
            },
            {
                '$lookup': {
                    'from': 'midtermdetails',
                    'localField': 'papdetails.mtr_details_id',
                    'foreignField': '_id',
                    'as': 'midtermdetails'
                }
            },
            {
                '$unwind': {
                    'path': '$midtermdetails'
                }
            },
            {
                '$lookup': {
                    'from': 'kraweightagedetails',
                    'localField': 'midtermdetails.weightage_id',
                    'foreignField': '_id',
                    'as': 'kraweightagedetails'
                }
            },
            {
                '$unwind': {
                    'path': '$kraweightagedetails'
                }
            },
            {
                '$lookup': {
                    'from': 'kraweightagedetails',
                    'localField': 'midtermdetails.weightage_id',
                    'foreignField': '_id',
                    'as': 'kraweightagedetails'
                }
            },
            {
                '$unwind': {
                    'path': '$kraweightagedetails'
                }
            },
            {
                $lookup: {
                    from: 'papratingscales',
                    localField: 'papdetails.sup_ratingScaleId',
                    foreignField: '_id',
                    as: 'papratingscales'
                }
            },
            {
                $unwind: {
                    path: '$papratingscales',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                '$project': {
                    '_id': "$_id",
                    "updatedAt": "$updatedAt",
                    "createdAt": "$createdAt",
                    "createdBy": "$createdBy",
                    "emp_id": "$emp_id",
                    "batch_id": "$batch_id",
                    "mtr_master_id": "$mtr_master_id",
                    "isGrievanceFeedbackReleased": "$isGrievanceFeedbackReleased",
                    "grievanceFeedbackReleaseEndDate": "$grievanceFeedbackReleaseEndDate",
                    "isGrievanceFeedbackSentToSupervisor": "$isGrievanceFeedbackSentToSupervisor",
                    "overallRating": "$overallRating",
                    "reviewerStatus": "$reviewerStatus",
                    "grievanceRaiseEndDate": "$grievanceRaiseEndDate",
                    "grievanceStatus": "$grievanceStatus",
                    "isDeleted": "$isDeleted",
                    "updatedBy": "$updatedBy",
                    "feedbackReleaseEndDate": "$feedbackReleaseEndDate",
                    "isSentToSupervisor": "$isSentToSupervisor",
                    "isRatingCommunicated": "$isRatingCommunicated",
                    "status": "$status",
                    "fiscalYearId": "$fiscalYearId",
                    "papdetails": {
                        "_id": 1,
                        "updatedAt": 1,
                        "pap_master_id": 1,
                        "empId": 1,
                        "mtr_details_id": 1,
                        "createdBy": 1,
                        "createdAt": 1,
                        "isDeleted": 1,
                        "updatedBy": 1,
                        "grievanceStatus": 1,
                        "grievanceSupRemark": 1,
                        "grievanceRevRemark": 1,
                        "grievance_ratingScaleId": 1,
                        "status": 1,
                        "reviewerRemark": 1,
                        "supRemark": 1,
                        "sup_ratingScaleId": 1,
                        "empRemark": 1,
                        "emp_ratingScaleId": 1,
                        "midtermdetails": "$midtermdetails",
                        "weightage": "$kraweightagedetails",
                        "papratingscales": "$papratingscales"
                    }
                }
            },
            {
                '$group': {
                    '_id': '$_id',
                    "updatedAt": { $first: '$updatedAt' },
                    "createdAt": { $first: '$createdAt' },
                    "createdBy": { $first: '$createdBy' },
                    "emp_id": { $first: '$emp_id' },
                    "batch_id": { $first: '$batch_id' },
                    "mtr_master_id": { $first: '$mtr_master_id' },
                    "isGrievanceFeedbackReleased": { $first: '$isGrievanceFeedbackReleased' },
                    "grievanceFeedbackReleaseEndDate": { $first: '$grievanceFeedbackReleaseEndDate' },
                    "isGrievanceFeedbackSentToSupervisor": { $first: '$isGrievanceFeedbackSentToSupervisor' },
                    "overallRating": { $first: '$overallRating' },
                    "reviewerStatus": { $first: '$reviewerStatus' },
                    "grievanceRaiseEndDate": { $first: '$grievanceRaiseEndDate' },
                    "grievanceStatus": { $first: '$grievanceStatus' },
                    "isDeleted": { $first: '$isDeleted' },
                    "updatedBy": { $first: '$updatedBy' },
                    "feedbackReleaseEndDate": { $first: '$feedbackReleaseEndDate' },
                    "isSentToSupervisor": { $first: '$isSentToSupervisor' },
                    "isRatingCommunicated": { $first: '$isRatingCommunicated' },
                    "status": { $first: '$status' },
                    "fiscalYearId": { $first: '$fiscalYearId' },
                    "papdetails": { $push: '$papdetails' }
                }
            }
            ]).exec((err, result) => {
                done(err, result);
            })
        },
        (papData, innerdone) => {
            let papToFix = [];
            papData.forEach(papMaster => {
                let currentRating = papMaster.overallRating;

                let overallRating = 0;
                papMaster.papdetails.forEach(pap => {
                    let rating = (parseFloat(pap.papratingscales.ratingScale) * parseFloat(pap.weightage.kraWeightageName)) / 100;
                    overallRating = overallRating + rating;
                });
                overallRating = overallRating.toFixed(2);
                if (currentRating != overallRating) {
                    papMaster.newRating = overallRating;
                    papToFix.push(papMaster);
                }
            });
            innerdone(null, papData, papToFix);
        },
        (papData, papToFix, innerdone) => {
            var q = async.queue(function (task, callback) {
                console.log('Fixing Pap | PapMasterId: ' + task.pap._id + ' previousRating: ' + task.pap.overallRating + ' newRating: ' + task.pap.newRating);
                PapMasterDetails.updateOne({ _id: task.pap._id }, task.updateQuery, (err, papMaster) => {
                    if (err) {
                        console.log('Error in Fixing Pap | PapMasterId: ' + task.pap._id);
                    };
                    console.log('Success in Fixing Pap | PapMasterId: ' + task.pap._id);
                    callback();
                });
            }, 1);

            // assign a callback
            q.drain = function () {
                console.log('All items have been processed');
                innerdone(null);
            };

            papToFix.forEach(pap => {
                let updateQuery = {
                    "updatedAt": new Date(),
                    "overallRating": pap.newRating
                }

                q.push({ pap: pap, updateQuery: updateQuery });
            })
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Pap Ratings Fixed');
    });
}


// User Patches
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// #116-Resend resetPassword mail to new employees on officeEmail
function resendEmail(req, res) {
    async.waterfall([
        (done) => {
            EmployeeDetails.find({ _id: { $gte: 620 }, isAccountActive: false }, (err, employees) => {
                employees.forEach((emp, index) => {
                    let expiryDate = new Date(2019, 10, 28);
                    EmployeeDetails.findOneAndUpdate({ _id: emp._id }, { resetPasswordExpires: expiryDate }, (err, doc) => {
                        if (err) {
                            console.log("Employee update error - " + emp.userName);
                        } else {
                            console.log("Employee updated - " + emp.userName);
                        }
                    })
                    EmployeeOfficeDetails.findOne({ emp_id: emp._id }, (err, empOfficeDetail) => {
                        if (err) {
                            console.log("EmployeeOfficeDetails find error - " + emp.userName);
                        } else {
                            if (empOfficeDetail.officeEmail) {
                                setTimeout(() => {
                                    console.log("Sending Mail | Employee Office Email - " + emp.userName + " | " + empOfficeDetail.officeEmail);
                                    SendEmail.sendEmailWelcomeUser(empOfficeDetail.officeEmail, emp);
                                }, 2000 * index);
                            } else {
                                console.log("Employee Office Email Null - " + emp.userName);
                            }
                        }
                    })
                });
            })

        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Email Sent');
    });
}



// #116-Resend resetPassword mail to new employees on officeEmail
function updateHrSpocOfAllEmployees(req, res) {
    let companyHrMap = [
        // {
        //     companyId: 1,
        //     hrSpocUserName: "1010676"
        // },
        {
            companyId: 2,
            hrSpocUserName: "1010576"
        },
        {
            companyId: 3,
            hrSpocUserName: "3010230"
        },
        {
            companyId: 4,
            hrSpocUserName: "4010127"
        },
        {
            companyId: 5,
            hrSpocUserName: "1010576"
        },
        {
            companyId: 6,
            hrSpocUserName: "1010576"
        }
    ]
    async.waterfall([
        (done) => {
            var q = async.queue(function (company, callback) {
                console.log("Processing items for company - " + company.companyId, "| HrSpoc -", company.hrSpocUserName);
                EmployeeDetails.findOne({ userName: company.hrSpocUserName }, (err, hrSpoc) => {
                    console.log("HrSpoc | Id - " + hrSpoc._id);
                    EmployeeDetails.find({ company_id: company.companyId, isDeleted: false }, (err, employees) => {
                        console.log("Total Employees | " + employees.length);
                        let empIds = employees.map(e => e._id);
                        EmployeeOfficeDetails.updateMany({ emp_id: { $in: empIds } }, { hrspoc_id: hrSpoc._id, updatedAt: new Date() }, (err, employeeUpdateDoc) => {
                            if (err) {
                                console.log("Error in updating employees | ", err);
                            } else {
                                console.log("Success in updating employees");
                            }
                            callback();
                        });
                    })
                })
            })

            q.drain = function () {
                console.log('All companies processed');
                done(null);
            };

            companyHrMap.forEach(company => {
                q.push(company);
            });
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'All Employees Updated');
    });
}

// #116-Update group & business hrHeads as per mail table
function updateGroupBusinessHrHeadsAllEmployees(req, res) {
    let companyHrMap = [
        {
            companyId: 1,
            hrSpocUserName: "1010676",
            businessHrHead_userName: "1010022",
            groupHrHead_userName: "3010269",
            businessHrHead_id: 11,
            groupHrHead_id: 509
        },
        {
            companyId: 2,
            hrSpocUserName: "1010576",
            businessHrHead_userName: "1010022",
            groupHrHead_userName: "3010269",
            businessHrHead_id: 11,
            groupHrHead_id: 509
        },
        {
            companyId: 3,
            hrSpocUserName: "3010230",
            businessHrHead_userName: "3010372",
            groupHrHead_userName: "3010269",
            businessHrHead_id: 510,
            groupHrHead_id: 509
        },
        {
            companyId: 4,
            hrSpocUserName: "4010127",
            businessHrHead_userName: "3010269",
            groupHrHead_userName: "3010269",
            businessHrHead_id: 509,
            groupHrHead_id: 509
        },
        {
            companyId: 5,
            hrSpocUserName: "1010576",
            businessHrHead_userName: "1010022",
            groupHrHead_userName: "3010269",
            businessHrHead_id: 11,
            groupHrHead_id: 509
        },
        {
            companyId: 6,
            hrSpocUserName: "1010576",
            businessHrHead_userName: "1010022",
            groupHrHead_userName: "3010269",
            businessHrHead_id: 11,
            groupHrHead_id: 509
        }
    ]
    async.waterfall([
        (done) => {
            var q = async.queue(function (company, callback) {
                console.log("Processing items for company | " + JSON.stringify(company));
                EmployeeDetails.find({ company_id: company.companyId, isDeleted: false }, (err, employees) => {
                    console.log("Total Employees | " + employees.length);
                    let empIds = employees.map(e => e._id);
                    let updateQuery = {
                        businessHrHead_id: company.businessHrHead_id,
                        groupHrHead_id: company.groupHrHead_id,
                        updatedAt: new Date()
                    };
                    EmployeeOfficeDetails.updateMany({ emp_id: { $in: empIds } }, updateQuery, (err, employeeUpdateDoc) => {
                        if (err) {
                            console.log("Error in updating employees | ", err);
                        } else {
                            console.log("Success in updating employees");
                        }
                        callback();
                    });
                })
            })

            q.drain = function () {
                console.log('All companies processed');
                done(null);
            };

            companyHrMap.forEach(company => {
                q.push(company);
            });
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'All Employees Updated');
    });
}


// #121-Fwd: Leave Quota for Newly joined Employees
function provideLeaveQuota(req, res) {
    async.waterfall([
        (done) => {
            var q = async.queue(function (employee, callback) {
                console.log("Processing employee | " + JSON.stringify(employee.userName));
                EmployeeDetails.findOne({ userName: employee.userName }, (err, empDetail) => {
                    console.log("Employee Id | " + empDetail._id, "Annual Leave |", employee.annualLeave, "Sick Leave |", employee.sickLeave);

                    // Adding Annual Leave Quota
                    let annualLeaveBalance = new EmployeeLeaveBalance();
                    annualLeaveBalance.emp_id = empDetail._id;
                    annualLeaveBalance.fiscalYearId = 3;
                    annualLeaveBalance.leave_type = 1;
                    annualLeaveBalance.isDeleted = false;
                    annualLeaveBalance.startDate = new Date(2019, 07, 01);
                    annualLeaveBalance.createdBy = 1;
                    annualLeaveBalance.updatedBy = 1;
                    annualLeaveBalance.balance = employee.annualLeave;
                    annualLeaveBalance.save(
                        function (err, leaveData) {
                            if (err) {
                                console.log("Error in annual Leave");
                            }

                            // Adding Sick Leave Quota
                            let sickLeaveBalance = new EmployeeLeaveBalance();
                            sickLeaveBalance.emp_id = empDetail._id;
                            sickLeaveBalance.fiscalYearId = 3;
                            sickLeaveBalance.leave_type = 2;
                            sickLeaveBalance.isDeleted = false;
                            sickLeaveBalance.startDate = new Date(2019, 07, 01);
                            sickLeaveBalance.createdBy = 1;
                            sickLeaveBalance.updatedBy = 1;
                            sickLeaveBalance.balance = employee.sickLeave;
                            sickLeaveBalance.save(
                                function (err, leaveData) {
                                    if (err) {
                                        console.log("Error in sick Leave");
                                    }

                                    callback();
                                }
                            );
                        }
                    );



                })
            })

            q.drain = function () {
                console.log('All employees processed');
                done(null);
            };

            req.body.forEach(emp => {
                q.push(emp);
            });
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Leave Quota Provided');
    });
}

let functions = {
    // KRA Patches
    kra: {
        fixFiscalYearIdOfCollections: (req, res) => {
            fixFiscalYearIdOfCollections(req, res);
        },
        fixKraWorkflowIdForMTRCollections: (req, res) => {
            fixKraWorkflowIdForMTRCollections(req, res);
        }
    },
    // PAP Patches
    pap: {
        // #114-Fix PAP Overall Rating
        fixPapOverallRating: (req, res) => {
            fixPapOverallRating(req, res);
        }
    },
    // USER Patches
    user: {
        // #116-Resend resetPassword mail to new employees on officeEmail
        resendEmail: (req, res) => {
            resendEmail(req, res);
        },
        // #116-Mail from Harpreet | HR SPOC and HR Employees for the Group Companies
        updateHrSpocOfAllEmployees: (req, res) => {
            updateHrSpocOfAllEmployees(req, res);
        },
        // #116
        updateGroupBusinessHrHeadsAllEmployees: (req, res) => {
            updateGroupBusinessHrHeadsAllEmployees(req, res);
        }
    },
    // Leave Patches
    leave: {
        // #121-Fwd: Leave Quota for Newly joined Employees
        provideLeaveQuota: (req, res) => {
            provideLeaveQuota(req, res);
        },
    }
}


function sendResponse(res, err, response, title) {
    if (err) {
        return res.status(403).json({
            title: 'There is a problem while fetching data',
            error: {
                message: err
            },
            result: {
                message: response
            }
        });
    } else {
        return res.status(200).json({
            title: title,
            result: {
                message: response
            }
        });
    }
}

module.exports = functions;




// function functionName(req, res) {
//     async.waterfall([
//     ], (error, result) => {
//         if (err) {
//             return res.status(403).json({
//                 title: 'There is a problem',
//                 error: {
//                     message: err
//                 },
//                 result: {
//                     message: result
//                 }
//             });
//         } else {
//             return res.status(200).json({
//                 title: 'Success',
//                 result: {
//                     message: result
//                 }
//             });
//         }
//     });
// }