let async = require('async'),
    MidTermMaster = require('../models/midterm/midtermmaster'),
    MidTermDetail = require('../models/midterm/midtermdetails'),
    AuditTrail = require('../class/auditTrail');
PapBatchDetails = require('../models/pap/papBatch.model'),
    PapMasterDetails = require('../models/pap/papMaster.model'),
    PapDetails = require('../models/pap/papDetails.model');

require('dotenv').load();


function getEmployeesForPapInitiate(req, res) {
    MidTermMaster.aggregate([
        {
            $match: {
                status: 'Approved',
                isDeleted: false
            }
        },
        {
            $lookup: {
                from: 'employeedetails',
                localField: 'emp_id',
                foreignField: '_id',
                as: 'employee_details'
            }
        },
        {
            $unwind: {
                path: '$employee_details'
            }
        },
        {
            $lookup: {
                from: 'employeesupervisordetails',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'employee_superviosr_details'
            }
        },
        {
            $unwind: {
                path: '$employee_superviosr_details'
            }
        },
        {
            $lookup: {
                from: 'employeeofficedetails',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'employee_office_details'
            }
        },
        {
            $unwind: {
                path: '$employee_office_details'
            }
        },
        {
            $lookup: {
                from: 'designations',
                localField: 'employee_details.designation_id',
                foreignField: '_id',
                as: 'designations'
            }
        },
        {
            $unwind: {
                path: '$designations'
            }
        },
        {
            $lookup: {
                from: 'employeedetails',
                localField: 'employee_superviosr_details.primarySupervisorEmp_id',
                foreignField: '_id',
                as: 'supervisor_details'
            }
        },
        {
            $unwind: {
                path: '$supervisor_details'
            }
        },
        {
            $project: {
                mtr_master_id: '$_id',
                emp_id: '$emp_id',
                userName: '$employee_details.userName',
                fullName: '$employee_details.fullName',
                grade_id: '$employee_details.grade_id',
                profileImage: '$employee_details.profileImage',
                designation_id: '$employee_details.designation_id',
                designationName: '$designations.designationName',
                department_id: '$employee_office_details.department_id',
                supervisor_id: '$employee_superviosr_details.primarySupervisorEmp_id',
                supervisorName: '$supervisor_details.fullName',
                emp_emailId: '$employee_office_details.officeEmail'
            }
        }
    ]).exec(function (err, response) {
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
                title: 'Data fetched successfully',
                result: {
                    message: response
                }
            });
        }
    });
}
function initiatePapProcess(req, res) {
    let createdBy = parseInt(req.body.createdBy);
    let emp_id_array = req.body.emp_id_array;
    let papBatchDetails = new PapBatchDetails();
    papBatchDetails.batchEndDate = new Date(
        new Date(req.body.batchEndDate).getTime()
    );
    papBatchDetails.createdBy = createdBy;
    papBatchDetails.batchName = req.body.batchName;
    async.waterfall([
        done => {
            papBatchDetails.save(function (err, response) {
                AuditTrail.auditTrailEntry(
                    0,
                    "papBatchDetails",
                    papBatchDetails,
                    "user",
                    "papBatchDetails",
                    "ADDED"
                );
                done(err, response._doc);
            });
        },
        (papMasterCount, done) => {
            PapMasterDetails.aggregate([
                {
                    $sort: {
                        _id: -1.0
                    }
                },
                {
                    $project: {
                        _id: '$_id'
                    }
                },
                {
                    $limit: 1.0
                }
            ]).exec(function (err, data) {
                papMasterCount.pap_master_max_id =
                    data.length === 0 ? 0 : data[0]._id;
                done(err, papMasterCount);
            });
        },
        (papMasterCount, done) => {
            let dataToInsert = [];
            emp_id_array.forEach(function (element, index) {
                dataToInsert.push({
                    _id: papMasterCount.pap_master_max_id + (index + 1),
                    createdBy: createdBy,
                    emp_id: parseInt(element.emp_id),
                    batch_id: papMasterCount._id,
                    mtr_master_id: parseInt(element.mtr_master_id)
                });
            });
            PapMasterDetails.insertMany(dataToInsert, function (err, response) {
                AuditTrail.auditTrailEntry(
                    0,
                    "papMaster",
                    dataToInsert,
                    "user",
                    "papMaster",
                    "ADDED"
                );
                done(err, response);
            });
        },
        (papMasterReponse, done) => {
            let query = [];
            papMasterReponse.forEach(function (element) {
                query.push(element.mtr_master_id);
            });
            MidTermDetail.aggregate([{
                '$match': {
                    'progressStatus': {
                        '$ne': 'Dropped'
                    },
                    'mtr_master_id': {
                        '$in': query
                    }
                }
            },
                // {
                //     '$project': {
                //         'mtr_detail_id': '$_id',
                //         'mtr_master_id': '$mtr_master_id'
                //     }
                // }
            ]).exec(function (err, data) {
                papMasterReponse.forEach(f => {
                    data.filter(fi => fi.mtr_master_id === f.mtr_master_id)
                        .map(m => {
                            m.pap_master_id = f._id
                            m.emp_id = f.emp_id
                        });
                })
                done(err, data);
            })
        },
        (papMasterData, done) => {
            PapDetails.aggregate([
                {
                    $sort: {
                        _id: -1.0
                    }
                },
                {
                    $project: {
                        _id: '$_id'
                    }
                },
                {
                    $limit: 1.0
                }
            ]).exec(function (err, data) {
                papMasterData.pap_details_max_id =
                    data.length === 0 ? 0 : data[0]._id;
                done(err, papMasterData);
            });
        },
        (papMasterData, done) => {
            let papDetailsToInsert = [];
            papMasterData.forEach((data, index) => {
                let papDetails = new PapDetails();
                papDetails._id = papMasterData.pap_details_max_id + (index + 1);
                papDetails.pap_master_id = data.pap_master_id;
                papDetails.empId = data.emp_id;
                papDetails.mtr_details_id = data._id;
                papDetails.status = "Initiated";
                papDetails.updatedBy = createdBy;
                papDetails.createdBy = createdBy;
                papDetails.createdAt = new Date();
                papDetailsToInsert.push(papDetails);
            });
            PapDetails.insertMany(papDetailsToInsert, function (err, papDetailsResponse) {
                AuditTrail.auditTrailEntry(
                    0,
                    "papDetails",
                    papDetailsToInsert,
                    "user",
                    "papDetails",
                    "ADDED"
                );
                done(err, papDetailsResponse);
            });
        }
    ], (err, result) => {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem while initiating batch',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        } else {
            return res.status(200).json({
                title: 'Batch initiated successfully',
                result: {
                    message: result
                }
            });
        }
    });
}

let functions = {
    getEmployeesForPapInitiate: (req, res) => {
        getEmployeesForPapInitiate(req, res);
    },
    initiatePapProcess: (req, res) => {
        initiatePapProcess(req, res);
    }
}

module.exports = functions;