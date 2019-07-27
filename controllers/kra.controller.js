let express = require('express'),
    KraInfo = require('../models/kra/kraDetails.model'),
    KraWorkFlowInfo = require('../models/kra/kraWorkFlowDetails.model'),
    KraWeightageInfo = require('../models/kra/kraWeightage.model'),
    KraCategoryInfo = require('../models/kra/kraCategory.model'),
    EmployeeInfo = require('../models/employee/employeeDetails.model'),
    EmployeeSupervisors = require('../models/employee/employeeSupervisorDetails.model'),
    BatchInfo = require('../models/workflow/batch.model'),
    Department = require('../models/master/department.model'),
    LeaveTypes = require('../models/leave/leaveTypes.model'),
    LeaveApply = require('../models/leave/leaveApply.model'),
    async = require('async'),
    csvWriter = require('csv-write-stream'),
    Json2csvParser = require('json2csv').Parser;
path = require('path');
mime = require('mime');
fs = require('fs');
BatchCtrl = require('./batch.controller'),
    TimeLineCtrl = require('./timeline.controller'),
    AuditTrail = require('../class/auditTrail');

require('dotenv').load();

function updateKraWorkFlowInfoDetails(req, res, done) {
    let batch_id = req.query.batch_id;
    let query = { _id: parseInt(req.body._id), isDeleted: false }
    if (batch_id) {
        query = { batch_id: parseInt(req.query.batch_id), isDeleted: false }
    }
    let queryUpdate = { $set: { "status": req.body.status, "updatedBy": parseInt(req.headers.uid) } };

    async.waterfall([
        (innerDone) => {
            KraWorkFlowInfo.update(query, queryUpdate, { new: true }, function (err, kraWorkFlowInfoData) {
                if (err) {
                    return res.status(403).json({
                        title: 'There was a problem',
                        error: {
                            message: err
                        },
                        result: {
                            message: kraWorkFlowInfoData
                        }
                    });
                }
                AuditTrail.auditTrailEntry(kraWorkFlowInfoData.emp_id, "kraWorkFlowDetails", kraWorkFlowInfoData, "Kra", "kraWorkFlowDetails", "UPDATED");
                innerDone(err, kraWorkFlowInfoData);
            });
        },
        (kraWorkFlowInfoData, innerDone) => {
            KraWorkFlowInfo.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'employeedetails_view',
                        localField: 'emp_id',
                        foreignField: '_id',
                        as: 'employeedetails_view'
                    }
                },
                {
                    $unwind: {
                        path: '$employeedetails_view'
                    }
                },
                {
                    $lookup: {
                        from: 'employeedetails_view',
                        localField: 'employeedetails_view.supervisor._id',
                        foreignField: '_id',
                        as: 'supervisordetails_view'
                    }
                },
                {
                    $unwind: {
                        path: '$supervisordetails_view'
                    }
                }
            ]).exec((err, kra) => {
                let data = {
                    employee: kra[0].employeedetails_view,
                    supervisor: kra[0].supervisordetails_view
                }
                SendEmail.sendEmailToSupervisorForKraSubmitted(data);
            });
        }
    ], (err, result) => {
        done(err, result);
    });
}

function addBulkKraInfoDetails(req, res, done) {
    let fiscalYearId = req.body.fiscalYearId;
    let arr_emp_id = req.body.emp_id;
    var insertData = [];
    Promise.all([
        KraWorkFlowInfo.find({}).exec(),
    ]).then(function (kraData) {
        let maxId = Math.max.apply(Math, kraData[0].map(k => { return parseInt(k._id); }))
        arr_emp_id.forEach(function (element, index) {
            insertData.push({ batch_id: req.body.batch_id, emp_id: element, status: 'Initiated', _id: maxId + (index + 1), createdBy: parseInt(req.headers.uid), fiscalYearId: parseInt(fiscalYearId) });
        });
        KraWorkFlowInfo.insertMany(insertData, function (err, results) {
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
            AuditTrail.auditTrailEntry(0, "kraWorkFlowDetails", insertData, "user", "kraWorkFlowDetails", "ADDED");
            arr_emp_id.forEach(empId => {
                let data = {};
                data.action_link = req.body.link;
                EmployeeInfo.aggregate([
                    {
                        $match: {
                            _id: empId
                        }
                    },
                    {
                        $lookup: {
                            from: 'employeeofficedetails',
                            localField: '_id',
                            foreignField: 'emp_id',
                            as: 'employeeofficedetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$employeeofficedetails'
                        }
                    }
                ]).exec((err, resEmployee) => {
                    data.emp_email = resEmployee[0].employeeofficedetails.officeEmail;
                    data.emp_name = resEmployee[0].fullName;

                    EmployeeInfo.find({ _id: parseInt(req.headers.uid) }).exec((err, resCreatedBy) => {
                        data.createdBy = resCreatedBy[0];
                        SendEmail.sendEmailToEmployeeForKraInitiate(data);
                    })
                });
            });
            return res.status(200).json(true);
        })
    });
}

function getEmployeeKraWorkFlowInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    let fiscalYearId = Number(req.query.fiscalYearId);
    KraWorkFlowInfo.aggregate([
        {
            "$lookup": {
                "from": "batchdetails",
                "localField": "batch_id",
                "foreignField": "_id",
                "as": "batchdetails"
            }
        },
        {
            "$unwind": "$batchdetails"
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "createdBy",
                "foreignField": "_id",
                "as": "employeedetails"
            }
        },
        {
            "$unwind": "$employeedetails"
        },
        { "$match": { "emp_id": parseInt(emp_id), "isDeleted": false, "employeedetails.isDeleted": false, "batchdetails.isDeleted": false, "batchdetails.fiscalYearId": fiscalYearId } },
        { "$sort": { "createdAt": -1, "updatedAt": -1 } },
        {
            "$project": {
                "_id": "$_id",
                "status": "$status",
                "createdAt": "$createdAt",
                "updatedAt": "$updatedAt",
                "createdBy": "$employeedetails.fullName",
                "batchEndDate": "$batchdetails.batchEndDate",
                "batchName": "$batchdetails.batchName",
            }
        }
    ]).exec(function (err, kraEmployeeWorkflowInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(kraEmployeeWorkflowInfoData);
    })
}

function addKraWeightageInfoDetails(req, res, done) {
    let kraWeightageDetails = new KraWeightageInfo(req.body);
    kraWeightageDetails.emp_id = req.body.emp_id || req.query.emp_id;
    kraWeightageDetails.timeline_id = 1;
    kraWeightageDetails.batch_id = 1;
    kraWeightageDetails.createdBy = parseInt(req.headers.uid);;

    kraWeightageDetails.save(function (err, kraWeightageInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: kraWeightageInfoData
                }
            });
        }
        AuditTrail.auditTrailEntry(kraWeightageDetails.emp_id, "kraWeightageDetails", kraWeightageDetails, "user", "kraWeightageDetails", "ADDED");
        return done(err, kraWeightageInfoData);
    });
}

function addKraCategoryInfoDetails(req, res, done) {
    let kraCategoryDetails = new KraCategoryInfo(req.body);
    kraCategoryDetails.emp_id = req.body.emp_id || req.query.emp_id;
    kraCategoryDetails.timeline_id = 1;
    kraCategoryDetails.batch_id = 1;
    kraCategoryDetails.createdBy = 1;

    kraCategoryDetails.save(function (err, kraCategoryInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: kraCategoryInfoData
                }
            });
        }
        AuditTrail.auditTrailEntry(kraCategoryDetails.emp_id, "kraCategoryDetails", kraCategoryDetails, "user", "kraCategoryDetails", "ADDED");
        return done(err, kraCategoryInfoData);
    });
}

function addKraInfoDetails(req, res, done) {
    let kraDetails = new KraInfo(req.body);
    kraDetails.createdBy = parseInt(req.headers.uid);
    kraDetails.save(function (err, kraData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: kraData
                }
            });
        }
        AuditTrail.auditTrailEntry(0, "kraDetails", kraDetails, "kra", "kraDetails", "ADDED");
        return done(null, kraData)
    });
}

function updateKraInfoDetails(req, res, done) {
    let kraDetails = new KraInfo(req.body);
    kraDetails.updatedBy = parseInt(req.headers.uid);

    KraInfo.findOneAndUpdate({ _id: parseInt(req.body._id) }, kraDetails, { new: true }, function (err, kraData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: kraData
                }
            });
        }
        AuditTrail.auditTrailEntry(0, "kraDetails", kraDetails, "user", "kraDetails", "UPDATE");
        return done(err, kraData);
    });
}

function deleteKraInfoDetails(req, res, done) {
    KraInfo.remove({ _id: parseInt(req.query._id) }, function (err, data) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: data
                }
            });
        }
        return done(err, data);
    })
}

function getKraInfoDetails(req, res) {
    let kraWorkflow_id = req.query.kraWorkflow_id;
    let query = {
        isDeleted: false
    };
    if (kraWorkflow_id) {
        query = {
            kraWorkflow_id: parseInt(kraWorkflow_id),
            isDeleted: false
        };
    }

    KraInfo.find(query, function (err, kraInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        else {
            KraWorkFlowInfo.findOne({ _id: parseInt(kraWorkflow_id), isDeleted: false }).select('status').exec(function (err, kraWorkFlow) {
                if (err) {
                    return res.status(403).json({
                        title: 'There was an error, please try again later',
                        error: err
                    });
                }
                return res.status(200).json({
                    'data': kraInfoData, 'status': kraWorkFlow.status
                });

            })
        }
    });
}

function getKraWorkFlowInfoDetails(req, res) {
    let _id = req.query._id;
    let query = {
        isDeleted: false
    };
    if (_id) {
        query = {
            _id: _id,
            isDeleted: false
        };
    }

}

function getKraWorkFlowInfoDetailsByBatch(req, res) {
    let batch_id = req.query.batch_id;
    KraWorkFlowInfo.aggregate([
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "createdBy",
                "foreignField": "_id",
                "as": "employeedetails"
            }
        },
        {
            "$unwind": "$employeedetails"
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "emp_id",
                "foreignField": "_id",
                "as": "employeeUserDetails"
            }
        },
        {
            "$unwind": "$employeeUserDetails"
        },
        { "$match": { "batch_id": parseInt(batch_id), "isDeleted": false, "employeedetails.isDeleted": false, "employeeUserDetails.isDeleted": false } },
        { "$sort": { "createdAt": -1, "updatedAt": -1 } },
        {
            "$project": {
                "_id": "$_id",
                "status": "$status",
                "createdAt": "$createdAt",
                "updatedAt": "$updatedAt",
                "createdBy": "$employeedetails.fullName",
                "userName": "$employeeUserDetails.fullName",
                "timeline_id": "$timeline_id"
            }
        }
    ]).exec(function (err, kraflowInfoDataByBatch) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json({ data: kraflowInfoDataByBatch });
    })
}

function getKraForApproval(req, res) {
    let supervisorId = parseInt(req.query.supervisorId);
    let fiscalYearId = parseInt(req.query.fiscalYearId);
    KraInfo.aggregate([
        { "$match": { "isDeleted": false, "supervisor_id": supervisorId } },
        {
            "$lookup": {
                "from": "kraworkflowdetails",
                "localField": "kraWorkflow_id",
                "foreignField": "_id",
                "as": "kraWorkflow"
            }
        },
        {
            "$unwind": {
                path: "$kraWorkflow",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$match": {
                "kraWorkflow.fiscalYearId": fiscalYearId
            }
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "kraWorkflow.emp_id",
                "foreignField": "_id",
                "as": "employeedetails"
            }
        },
        {
            "$unwind": {
                path: "$employeedetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": "$kraWorkflow._id",
                "emp_id": "$kraWorkflow.emp_id",
                "updatedAt": "$kraWorkflow.updatedAt",
                "status": "$kraWorkflow.status",
                "emp_name": "$employeedetails.fullName",
                "userName": "$employeedetails.userName",
                "profileImage": "$employeedetails.profileImage",
            }
        },
        {
            $group: {
                _id: "$_id",
                emp_id: { $first: "$emp_id" },
                updatedAt: { $first: "$updatedAt" },
                status: { $first: "$status" },
                emp_name: { $first: "$emp_name" },
                userName: { $first: "$userName" },
                profileImage: { $first: "$profileImage" },
            }
        }
    ]).exec((err, kraDetails) => {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json({ data: kraDetails });
    });
}

function getKraForReviewer(req, res) {
    let supervisorId = parseInt(req.query.supervisorId);

    EmployeeSupervisors.aggregate([
        { "$match": { "isActive": true, "primarySupervisorEmp_id": supervisorId } },
        {
            "$lookup": {
                "from": "kradetails",
                "localField": "supervisor_id",
                "foreignField": "emp_id",
                "as": "kradetails"
            }
        },
        {
            "$unwind": {
                path: "$kradetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "kraworkflowdetails",
                "localField": "kradetails.kraWorkflow_id",
                "foreignField": "_id",
                "as": "kraWorkflow"
            }
        },
        {
            "$unwind": {
                path: "$kraWorkflow",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "kraWorkflow.emp_id",
                "foreignField": "_id",
                "as": "employeedetails"
            }
        },
        {
            "$unwind": {
                path: "$employeedetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": "$kraWorkflow._id",
                "emp_id": "$kraWorkflow.emp_id",
                "updatedAt": "$kraWorkflow.updatedAt",
                "status": "$kraWorkflow.status",
                "emp_name": "$employeedetails.fullName",
                "userName": "$employeedetails.userName",
                "profileImage": "$employeedetails.profileImage",
            }
        },
        {
            $group: {
                _id: "$_id",
                emp_id: { $first: "$emp_id" },
                updatedAt: { $first: "$updatedAt" },
                status: { $first: "$status" },
                emp_name: { $first: "$emp_name" },
                userName: { $first: "$userName" },
                profileImage: { $first: "$profileImage" },
            }
        }
    ]).exec((err, kraDetails) => {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json({ data: kraDetails });
    });

    // KraInfo.aggregate([
    //     { "$match": { "isDeleted": false, "supervisor_id": supervisorId } },
    //     {
    //         "$lookup": {
    //             "from": "kraworkflowdetails",
    //             "localField": "kraWorkflow_id",
    //             "foreignField": "_id",
    //             "as": "kraWorkflow"
    //         }
    //     },
    //     {
    //         "$unwind": {
    //             path: "$kraWorkflow",
    //             "preserveNullAndEmptyArrays": true
    //         }
    //     },
    //     {
    //         "$lookup": {
    //             "from": "employeedetails",
    //             "localField": "kraWorkflow.emp_id",
    //             "foreignField": "_id",
    //             "as": "employeedetails"
    //         }
    //     },
    //     {
    //         "$unwind": {
    //             path: "$employeedetails",
    //             "preserveNullAndEmptyArrays": true
    //         }
    //     },
    //     {
    //         "$project": {
    //             "_id": "$kraWorkflow._id",
    //             "emp_id": "$kraWorkflow.emp_id",
    //             "updatedAt": "$kraWorkflow.updatedAt",
    //             "status": "$kraWorkflow.status",
    //             "emp_name": "$employeedetails.fullName",
    //             "userName": "$employeedetails.userName",
    //             "profileImage": "$employeedetails.profileImage",
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: "$_id",
    //             emp_id: { $first: "$emp_id" },
    //             updatedAt: { $first: "$updatedAt" },
    //             status: { $first: "$status" },
    //             emp_name: { $first: "$emp_name" },
    //             userName: { $first: "$userName" },
    //             profileImage: { $first: "$profileImage" },
    //         }
    //     }
    // ]).exec((err, kraDetails) => {
    //     debugger;
    //     if (err) {
    //         return res.status(403).json({
    //             title: 'There was an error, please try again later',
    //             error: err
    //         });
    //     }
    //     return res.status(200).json({ data: kraDetails });
    // });
}

function getKraByEmployeeId(req, res) {
    let empId = parseInt(req.query.empId);
    let queryObj = { '$match': {} };
    queryObj['$match']['$or'] = []
    queryObj['$match']["$or"].push({ supervisorStatus: null })
    queryObj['$match']["$or"].push({ supervisorStatus: "SendBack" })
    KraInfo.aggregate([
        // queryObj,
        {
            "$lookup": {
                "from": "kraworkflowdetails",
                "localField": "kraWorkflow_id",
                "foreignField": "_id",
                "as": "kraWorkflow"
            }
        },
        {
            "$unwind": {
                path: "$kraWorkflow"
            }
        },
        {
            "$match": {
                "kraWorkflow.emp_id": empId
            }
        },
        {
            "$lookup": {
                "from": "employeedetails",
                "localField": "kraWorkflow.emp_id",
                "foreignField": "_id",
                "as": "employeedetails"
            }
        },
        {
            "$unwind": {
                path: "$employeedetails"
            }
        },
        {
            "$lookup": {
                "from": "kraweightagedetails",
                "localField": "kraWorkflow.weightage_id",
                "foreignField": "_id",
                "as": "kraweightagedetails"
            }
        },
        {
            "$unwind": {
                path: "$kraweightagedetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            "$project": {
                "_id": 1,
                "updatedAt": 1,
                "createdAt": 1,
                "supervisor_id": 1,
                "kraWorkflow_id": 1,
                "updatedBy": 1,
                "createdBy": 1,
                "isDeleted": 1,
                "sendBackComment": 1,
                "supervisorStatus": 1,
                "measureOfSuccess": 1,
                "unitOfSuccess": 1,
                "weightage_id": 1,
                "category_id": 1,
                "kra": 1,
                "empId": "$kraWorkflow.emp_id",
                "kraWorkflow": 1,
                "employeedetails": 1,
                "kraweightagedetails": 1
            }
        }
    ]).exec((err, kraDetails) => {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json({ data: kraDetails });
    });
}


let functions = {
    addKraWeightageInfo: (req, res) => {
        async.waterfall([
            function (done) {
                addKraWeightageInfoDetails(req, res, done);
            },
            function (kraWeightageInfoData, done) {
                return res.status(200).json(kraWeightageInfoData);
            }
        ]);
    },
    addKraCategoryInfo: (req, res) => {
        async.waterfall([
            function (done) {
                addKraCategoryInfoDetails(req, res, done);
            },
            function (kraCategoryInfoData, done) {
                return res.status(200).json(kraCategoryInfoData);
            }
        ]);
    },
    getKraWorkFlowInfo: (req, res) => {
        async.waterfall([
            function (done) {
                getKraWorkFlowInfoDetails(req, res, done);
            },
            function (kraWorkflowDetailsData, done) {
                return res.status(200).json({
                    "data": kraWorkflowDetailsData
                });
            }
        ]);
    },
    addKraWorkFlowInfo: (req, res) => {
        async.waterfall([
            function (done) {
                addKraWorkFlowInfoDetails(req, res, done);
            },
            function (kraWorkFlowInfoData, done) {
                return res.status(200).json(kraWorkFlowInfoData);
            }
        ]);
    },
    updateKraWorkFlowInfo: (req, res) => {
        async.waterfall([
            function (done) {
                updateKraWorkFlowInfoDetails(req, res, done);
            },
            function (kraWorkFlowInfoData, done) {
                return res.status(200).json(kraWorkFlowInfoData);
            }
        ]);
    },
    getEmployeeKraWorkFlowInfo: (req, res) => {
        async.waterfall([
            function (done) {
                getEmployeeKraWorkFlowInfoDetails(req, res, done);
            },
            function (employeeKraWorkFlowDetailsData, done) {
                return res.status(200).json({
                    "data": employeeKraWorkFlowDetailsData
                });
            }
        ]);
    },
    getKraWorkFlowInfoByBatch: (req, res) => {
        async.waterfall([
            function (done) {
                getKraWorkFlowInfoDetailsByBatch(req, res, done);
            },
            function (kraflowInfoDataByBatch, done) {
                return res.status(200).json({
                    "data": kraflowInfoDataByBatch
                });
            }
        ]);
    },
    addBulkKra: (req, res) => {
        async.waterfall([
            function (done) {
                BatchCtrl.addBatchInfoDetails(req, res, done)
            },
            function (batchData, done) {
                req.body.batch_id = batchData._id;
                addBulkKraInfoDetails(req, res, done);
            }
        ]);
    },
    getKraInfo: (req, res) => {
        async.waterfall([
            function (done) {
                getKraInfoDetails(req, res, done);
            },
            function (kraDetailsData, done) {
                return res.status(200).json({
                    "data": kraDetailsData
                });
            }
        ]);
    },
    addKraInfo: (req, res) => {
        async.waterfall([
            function (done) {
                addKraInfoDetails(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    },
    updateKraInfo: (req, res) => {
        async.waterfall([
            function (done) {
                updateKraInfoDetails(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    },
    deleteKraInfo: (req, res) => {
        async.waterfall([
            function (done) {
                deleteKraInfoDetails(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    },
    getKraForApproval: (req, res) => {
        async.waterfall([
            function (done) {
                getKraForApproval(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    },
    getKraForReviewer: (req, res) => {
        async.waterfall([
            function (done) {
                getKraForReviewer(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    },
    getKRA_Report_Supervisor: (req, res) => {

        const fields = ['_id', 'batchName', 'Employee_Name', 'Employee_Id', 'KRA_intiated_on', 'KRA_initiated_by', 'Number_of_KRA', 'KRA_status', 'Last_updated_on', 'Last_updated_by'];
        KraWorkFlowInfo.aggregate([
            {
                "$lookup": {
                    "from": "batchdetails",
                    "localField": "batch_id",
                    "foreignField": "_id",
                    "as": "batchdetails"
                }
            },
            {
                "$unwind": "$batchdetails"
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "createdBy",
                    "foreignField": "_id",
                    "as": "employeedetails"
                }
            },
            {
                "$unwind": "$employeedetails"
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employeedetailName"
                }
            },
            {
                "$unwind": "$employeedetailName"
            },
            /*  {
                  "$lookup": {
                      "from": "KraInfo",
                      "localField": "_id",
                      "foreignField": "kraWorkflow_id",
                      "as": "KraInfoDetails"
                  }
              },
                  {
                      "$unwind": {
                          path: "$KraInfoDetails",
                          "preserveNullAndEmptyArrays": true
                      }
                  },
                  {
                      $group: {
                          kraWorkflow_id: "$KraInfoDetails.kraWorkflow_id",
                          totalKra: { $sum: 1 },
                      }
                  },*/
            /* { "$match": { "emp_id":parseInt(emp_id),"isDeleted":false,"employeedetails.isDeleted":false,"batchdetails.isDeleted":false} },
             { "$sort": { "createdAt":-1,"updatedAt": -1 } },*/
            {
                "$project": {
                    "_id": "$_id",
                    "batchName": "$batchdetails.batchName",
                    "Employee_Name": "$employeedetailName.fullName",
                    "Employee_Id": "$employeedetailName.userName",
                    "KRA_intiated_on": "$batchdetails.batchEndDate",
                    "KRA_initiated_by": "$employeedetails.fullName",
                    // "Number_of_KRA":"$totalKra",
                    "KRA_status": "$status",
                    "Last_updated_on": "$createdAt",
                    "Last_updated_by": "$updatedAt",

                }
            }
        ]).exec(function (err, kraEmployeeWorkflowInfoData) {
            if (err) {
                return res.status(403).json({
                    title: 'There was an error, please try again later',
                    error: err
                });
            }
            // console.log(kraEmployeeWorkflowInfoData);
            const json2csvParser = new Json2csvParser({ fields });
            const csv = json2csvParser.parse(kraEmployeeWorkflowInfoData);
            // console.log('test new demo',csv);

            fs.writeFile('KRA_Report_Supervisor.csv', csv, function (err) { //currently saves file to app's root directory
                if (err) throw err;
                console.log('file saved');

                var file = 'KRA_Report_Supervisor.csv';
                res.download(file, 'KRA_Report_Supervisor.csv');

            });

        })

    },
    getKRA_Report: (req, res) => {

        const fields = ['_id', 'batchName', 'Employee_Name', 'Employee_Id', 'Primary_Supervisor', 'Secondary_Supervisor', 'KRA_intiated_on', 'KRA_initiated_by', 'Number_of_KRA', 'KRA_status', 'Last_updated_on', 'Last_updated_by'];
        KraWorkFlowInfo.aggregate([
            {
                "$lookup": {
                    "from": "batchdetails",
                    "localField": "batch_id",
                    "foreignField": "_id",
                    "as": "batchdetails"
                }
            },
            {
                "$unwind": "$batchdetails"
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "createdBy",
                    "foreignField": "_id",
                    "as": "employeedetails"
                }
            },
            {
                "$unwind": "$employeedetails"
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "employeedetailName"
                }
            },
            {
                "$unwind": "$employeedetailName"
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
                    "from": "employeedetails",
                    "localField": "supervisor.secondarySupervisorEmp_id",
                    "foreignField": "_id",
                    "as": "employeeSecondary"
                }
            },
            {
                "$unwind": {
                    "path": "$employeeSecondary", "preserveNullAndEmptyArrays": true
                }
            },
            /* {
                 "$lookup": {
                     "from": "KraInfo",
                     "localField": "_id",
                     "as": "KraInfoDetails"
                 }
                     "foreignField": "kraWorkflow_id",
             },
             {
                 "$unwind": {
                     path: "$KraInfoDetails",
                     "preserveNullAndEmptyArrays": true
                 }
             },*/
            /* {
                 $group: {
                     _id: "$kraDetails.kraWorkflow_id",
                     totalKra: { $sum: 1 },
                 }
             },  */
            /* { "$match": { "emp_id":parseInt(emp_id),"isDeleted":false,"employeedetails.isDeleted":false,"batchdetails.isDeleted":false} },
             { "$sort": { "createdAt":-1,"updatedAt": -1 } },*/
            {
                "$project": {
                    // "secondarySupervisorDetails": 0,
                    "_id": "$_id",
                    "batchName": "$batchdetails.batchName",
                    "Employee_Name": "$employeedetailName.fullName",
                    "Employee_Id": "$employeedetailName.userName",
                    "Primary_Supervisor": "$employees.fullName",
                    "Secondary_Supervisor": "$employeeSecondary.fullName",
                    "KRA_intiated_on": "$batchdetails.batchEndDate",
                    "KRA_initiated_by": "$employeedetails.fullName",
                    "Number_of_KRA": "$totalKra",
                    "KRA_status": "$status",
                    "Last_updated_on": "$createdAt",
                    "Last_updated_by": "$updatedAt",

                }
            }
        ]).exec(function (err, kraEmployeeWorkflowInfoData) {
            console.log('test new demo', kraEmployeeWorkflowInfoData);
            if (err) {
                return res.status(403).json({
                    title: 'There was an error, please try again later',
                    error: err
                });
            }
            // console.log(kraEmployeeWorkflowInfoData);
            const json2csvParser = new Json2csvParser({ fields });
            const csv = json2csvParser.parse(kraEmployeeWorkflowInfoData);
            // console.log('test new demo',csv);

            fs.writeFile('KRA_Report.csv', csv, function (err) { //currently saves file to app's root directory
                if (err) throw err;
                // console.log('file saved');

                var file = 'KRA_Report.csv';
                res.download(file, 'KRA_Report.csv');

            });

        })

    },
    getKraByEmployeeId: (req, res) => {
        async.waterfall([
            function (done) {
                getKraByEmployeeId(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    }
}
module.exports = { functions, updateKraWorkFlowInfoDetails };