let express = require('express'),
    KraInfo = require('../models/kra/kraDetails.model'),
    KraWorkFlowInfo = require('../models/kra/kraWorkFlowDetails.model'),
    KraWeightageInfo = require('../models/kra/kraWeightage.model'),
    KraCategoryInfo = require('../models/kra/kraCategory.model'),
    async = require('async'),

    BatchCtrl = require('./batch.controller'),
    TimeLineCtrl = require('./timeline.controller'),
    AuditTrail = require('../class/auditTrail'),
    EmployeeSupervisors = require('../models/employee/employeeSupervisorDetails.model');

require('dotenv').load();


// function addKraWorkFlowInfoDetails(req, res, done) {
//     let kraWorkFlowDetails = new KraWorkFlowInfo(req.body);
//     kraWorkFlowDetails.emp_id = req.body.emp_id || req.query.emp_id;
//     kraWorkFlowDetails.timeline_id = 1;
//     kraWorkFlowDetails.batch_id = 1;
//     kraWorkFlowDetails.createdBy = parseInt(req.headers.uid);

//     kraWorkFlowDetails.save(function (err, kraWorkFlowInfoData) {
//         if (err) {
//             return res.status(403).json({
//                 title: 'There was a problem',
//                 error: {
//                     message: err
//                 },
//                 result: {
//                     message: kraWorkFlowInfoData
//                 }
//             });
//         }
//         AuditTrail.auditTrailEntry(kraWorkFlowDetails.emp_id, "kraWorkFlowDetails", kraWorkFlowDetails, "user", "kraWorkFlowDetails", "ADDED");
//         return done(err, kraWorkFlowInfoData);
//     });
// }

function updateKraWorkFlowInfoDetails(req, res, done) {
    let batch_id = req.query.batch_id;
    let query = { _id: parseInt(req.body._id), isDeleted: false }
    if (batch_id) {
        query = { batch_id: parseInt(req.query.batch_id), isDeleted: false }
    }
    let queryUpdate = { $set: { "status": req.body.status, "updatedBy": parseInt(req.headers.uid) } };

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
        return done(err, kraWorkFlowInfoData);
    });
}

function addBulkKraInfoDetails(req, res, done) {
    let arr_emp_id = req.body.emp_id;
    var insertData = [];
    Promise.all([
        KraWorkFlowInfo.find({}).count().exec(),
    ]).then(function (counts) {
        arr_emp_id.forEach(function (element, index) {
            insertData.push({ batch_id: req.body.batch_id, emp_id: element, status: 'Initiated', _id: counts[0] + (index + 1), createdBy: parseInt(req.headers.uid) });
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
            return res.status(200).json(true);
        })
    });
}

function getEmployeeKraWorkFlowInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
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
        { "$match": { "emp_id": parseInt(emp_id), "isDeleted": false, "employeedetails.isDeleted": false, "batchdetails.isDeleted": false } },
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

// function deleteAllKraDetailsByEmpId(req,res,done)
// {
//     KraInfo.remove({kraWorkflow_id:parseInt(req.body.kraWorkflow_id)},function(err,data)
//     {
//         if (err) {
//             return res.status(403).json({
//                 title: 'There was a problem',
//                 error: {
//                     message: err
//                 },
//                 result: {
//                     message: data
//                 }
//             });
//         }
//         return done(err,true);
//     })
// }


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
    var kraProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    KraInfo.find(query, kraProjection, function (err, kraInfoData) {
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
    KraWorkFlowInfo.findOne(query, kraWorkflowProjection, function (err, kraWorkflowInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(kraWorkflowInfoData);
    });
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

// function updateBatchStatus(req, res)
// {
//     let _id=parseInt(req.body._id);
//     let batchType=req.body.batchType;
//     if(batchType=='KRA')
//     {
//         let queryUpdate={ $set: {"status":req.body.status, "updatedBy":parseInt(req.headers.uid) }};
//         KraWorkFlowInfo.update({"batch_id":_id,isDeleted:false},queryUpdate,{ new: true },function(err,batchStatusData)
//         {
//             if (err) {
//                 return res.status(403).json({
//                   title: 'There was an error',
//                   error: err
//                 });
//               }
//             return res.status(200).json(batchStatusData);
//         });
//     }
// }


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
}
module.exports = { functions, updateKraWorkFlowInfoDetails };