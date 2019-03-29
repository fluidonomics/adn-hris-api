let async = require('async'),
    MidTermMaster = require('../models/midterm/midtermmaster'),
    MidTermDetail = require('../models/midterm/midtermdetails'),
    AuditTrail = require('../class/auditTrail'),
    PapBatchDetails = require('../models/pap/papBatch.model'),
    PapMasterDetails = require('../models/pap/papMaster.model'),
    EmployeeSupervisorDetails = require('../models/employee/employeeSupervisorDetails.model'),
    EmployeeDetails = require('../models/employee/employeeDetails.model'),
    SendEmail = require('../class/sendEmail'),
    PapDetails = require('../models/pap/papDetails.model');

require('dotenv').load();

function getEmployeesForPapInitiate(req, res) {
    MidTermMaster.aggregate([{
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
        $lookup: {
            'from': 'papmasters',
            'localField': 'emp_id',
            'foreignField': 'emp_id',
            'as': 'pap_master'
        }
    },
    {
        $unwind: {
            'path': '$pap_master',
            'preserveNullAndEmptyArrays': true
        }
    },
    {
        $lookup: {
            'from': 'departments',
            'localField': 'employee_office_details.department_id',
            'foreignField': '_id',
            'as': 'department'
        }
    },
    {
        $unwind: {
            'path': '$department',
            'preserveNullAndEmptyArrays': true
        }
    },
    {
        $lookup: {
            'from': 'grades',
            'localField': 'employee_details.grade_id',
            'foreignField': '_id',
            'as': 'grade'
        }
    },
    {
        $unwind: {
            'path': '$grade',
            'preserveNullAndEmptyArrays': true
        }
    },
    {
        $project: {
            mtr_master_id: '$_id',
            emp_id: '$emp_id',
            userName: '$employee_details.userName',
            fullName: '$employee_details.fullName',
            grade_id: '$employee_details.grade_id',
            grade: '$grade',
            profileImage: '$employee_details.profileImage',
            designation_id: '$employee_details.designation_id',
            designationName: '$designations.designationName',
            department: '$department',
            department_id: '$employee_office_details.department_id',
            supervisor_id: '$employee_superviosr_details.primarySupervisorEmp_id',
            supervisorName: '$supervisor_details.fullName',
            emp_emailId: '$employee_office_details.officeEmail',
            pap_master_id: '$pap_master._id',
            hrspoc_id: '$employee_office_details.hrspoc_id'
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
    let action_link = req.body.action_link;
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
                    "PAP",
                    "initiatePapProcess",
                    "ADDED"
                );
                done(err, response);
            });
        },
        (papMasterCount, done) => {
            PapMasterDetails.aggregate([{
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
                    "PAP",
                    "initiatePapProcess",
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
            PapDetails.aggregate([{
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
            let empIds = papMasterData.map(pap => pap.emp_id);
            EmployeeDetails.aggregate([
                {
                    $match: {
                        _id: {
                            $in: empIds
                        }
                    }
                },
                {
                    $lookup: {
                        from: "employeesupervisordetails",
                        localField: "_id",
                        foreignField: "emp_id",
                        as: "employeesupervisordetails"
                    }
                },
                {
                    $unwind: {
                        path: '$employeesupervisordetails'
                    }
                }
            ]).exec((err, employees) => {
                papMasterData.forEach((data, index) => {
                    let papDetails = new PapDetails();
                    papDetails._id = papMasterData.pap_details_max_id + (index + 1);
                    papDetails.pap_master_id = data.pap_master_id;
                    papDetails.empId = data.emp_id;
                    papDetails.supervisor_id = employees.find(emp => emp._id == data.emp_id).employeesupervisordetails.primarySupervisorEmp_id;
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
                        "PAP",
                        "initiatePapProcess",
                        "ADDED"
                    );
                    done(err, papDetailsResponse);
                });
            });
        },
        (papMasterData, done) => {
            let onlyEmpIds = [];
            let papMasterIds = papMasterData.map(pap => pap.pap_master_id);
            PapMasterDetails.aggregate([
                {
                    $match: {
                        _id: {
                            $in: papMasterIds
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'employeedetails',
                        localField: 'emp_id',
                        foreignField: '_id',
                        as: 'employeedetails'
                    }
                },
                {
                    $unwind: {
                        path: '$employeedetails'
                    }
                },
                {
                    $lookup: {
                        from: 'employeeofficedetails',
                        localField: 'employeedetails._id',
                        foreignField: 'emp_id',
                        as: 'employeeofficedetails'
                    }
                },
                {
                    $unwind: {
                        path: '$employeeofficedetails'
                    }
                },
                {
                    $lookup: {
                        from: 'employeedetails',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                {
                    $unwind: {
                        path: '$createdBy'
                    }
                }
            ]).exec((err, response) => {
                response.forEach(f => {
                    let data = {};
                    data.emp_email = f.employeeofficedetails.officeEmail;
                    data.emp_name = f.employeedetails.fullName;
                    data.action_link = action_link;
                    data.createdBy = f.createdBy;
                    SendEmail.sendEmailToEmployeeForPapInitiate(data);
                });
                done(err, papMasterData);
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

function getPapBatches(req, res) {
    let currentUserId = parseInt(req.query.currentUserId);
    PapBatchDetails.aggregate([{
        $match: {
            createdBy: currentUserId
        }
    },
    {
        $lookup: {
            from: "papmasters",
            localField: "_id",
            foreignField: "batch_id",
            as: "pap_master"
        }
    },
    {
        $unwind: {
            path: "$pap_master"
        }
    },
    {
        $lookup: {
            from: "employeedetails",
            localField: "pap_master.emp_id",
            foreignField: "_id",
            as: "emp_details"
        }
    },
    {
        $unwind: {
            path: "$emp_details",
        }
    },
    {
        $project: {
            _id: 1,
            updatedAt: 1,
            createdAt: 1,
            createdBy: 1,
            isDeleted: 1,
            updatedBy: 1,
            status: 1,
            batchEndDate: 1,
            batchName: 1,
            pap_master: {
                _id: 1,
                updatedAt: 1,
                createdAt: 1,
                createdBy: 1,
                emp_id: 1,
                batch_id: 1,
                mtr_master_id: 1,
                isDeleted: 1,
                updatedBy: 1,
                isRatingCommunicated: 1,
                status: 1,
                reviewerStatus: 1,
                grievanceStatus: 1,
                overallRating: 1,
                emp_details: "$emp_details"
            }
        }
    },
    {
        $group: {
            _id: "$_id",
            updatedAt: {
                $first: "$updatedAt"
            },
            createdAt: {
                $first: "$createdAt"
            },
            createdBy: {
                $first: "$createdBy"
            },
            isDeleted: {
                $first: "$isDeleted"
            },
            updatedBy: {
                $first: "$updatedBy"
            },
            status: {
                $first: "$status"
            },
            batchEndDate: {
                $first: "$batchEndDate"
            },
            batchName: {
                $first: "$batchName"
            },
            pap_master: {
                $push: "$pap_master"
            }
        }
    }
    ]).exec((err, response) => {
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

function getPapDetailsSingleEmployee(req, res) {
    let empId = parseInt(req.query.emp_id);
    PapMasterDetails.aggregate([{
        "$match": {
            "emp_id": empId
        }
    },
    {
        '$lookup': {
            'from': 'papbatches',
            'localField': 'batch_id',
            'foreignField': '_id',
            'as': 'papbatches'
        }
    },
    {
        '$unwind': {
            'path': '$papbatches'
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
            'from': 'employeedetails',
            'localField': 'papbatches.createdBy',
            'foreignField': '_id',
            'as': 'createdBy_empDetails'
        }
    },
    {
        '$unwind': {
            'path': '$createdBy_empDetails'
        }
    },
    {
        '$lookup': {
            'from': 'employeedetails',
            'localField': 'papdetails.supervisor_id',
            'foreignField': '_id',
            'as': 'pap_supervisorDetails'
        }
    },
    {
        '$unwind': {
            'path': '$pap_supervisorDetails'
        }
    },
    {
        "$project": {
            "_id": 1,
            "updatedAt": 1,
            "createdAt": 1,
            "createdBy": 1,
            "emp_id": 1,
            "batch_id": 1,
            "mtr_master_id": 1,
            "isDeleted": 1,
            "updatedBy": 1,
            "isRatingCommunicated": 1,
            "status": 1,
            "reviewerStatus": 1,
            "grievanceStatus": 1,
            "overallRating": 1,
            "papbatches": {
                "_id": 1,
                "updatedAt": 1,
                "createdAt": 1,
                "createdBy": 1,
                "isDeleted": 1,
                "updatedBy": 1,
                "status": 1,
                "batchEndDate": 1,
                "batchName": 1,
                "createdBy_empDetails": "$createdBy_empDetails"
            },
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
                "pap_supervisorDetails": "$pap_supervisorDetails"
            }
        }
    },
    {
        '$group': {
            "_id": "$_id",
            "updatedAt": {
                $first: "$updatedAt"
            },
            "createdAt": {
                $first: "$createdAt"
            },
            "createdBy": {
                $first: "$createdBy"
            },
            "createdBy_empDetails": {
                $first: "$createdBy_empDetails"
            },
            "emp_id": {
                $first: "$emp_id"
            },
            "batch_id": {
                $first: "$batch_id"
            },
            "mtr_master_id": {
                $first: "$mtr_master_id"
            },
            "isDeleted": {
                $first: "$isDeleted"
            },
            "updatedBy": {
                $first: "$updatedBy"
            },
            "isRatingCommunicated": {
                $first: "$isRatingCommunicated"
            },
            "status": {
                $first: "$status"
            },
            "reviewerStatus": {
                $first: "$reviewerStatus"
            },
            "grievanceStatus": {
                $first: "$grievanceStatus"
            },
            "overallRating": {
                $first: "$overallRating"
            },
            "papbatches": {
                $first: "$papbatches"
            },
            "papdetails": {
                $push: "$papdetails"
            }
        }
    }
    ]).exec((err, result) => {
        sendResponse(res, err, result, 'Data fetched successfully');
    });
}


function getPapBySupervisor(req, res) {
    let supervisorId = parseInt(req.query.empId);
    PapDetails.aggregate([
        {
            '$match': {
                'status': {
                    $in: ["Submitted", "Pending Reviewer", "Approved", "SendBack"]
                },
                'supervisor_id': supervisorId
            }
        },
        {
            '$lookup': {
                'from': 'midtermdetails',
                'localField': 'mtr_details_id',
                'foreignField': '_id',
                'as': 'mtr_details'
            }
        },
        {
            '$unwind': {
                'path': '$mtr_details'
            }
        },
        {
            '$lookup': {
                'from': 'papmasters',
                'localField': 'pap_master_id',
                'foreignField': '_id',
                'as': 'papmasters'
            }
        },
        {
            '$unwind': {
                'path': '$papmasters'
            }
        },
        {
            '$lookup': {
                'from': 'employeedetails',
                'localField': 'empId',
                'foreignField': '_id',
                'as': 'emp_details'
            }
        },
        {
            '$unwind': {
                'path': '$emp_details'
            }
        },
        {
            '$project': {
                'emp_id': '$empId',
                'emp_details': '$emp_details',
                'papmasters': '$papmasters',
                'updatedAt': '$updatedAt',
                'group_obj': {
                    'grievanceSupRemark': '$grievanceSupRemark',
                    'grievanceRevRemark': '$grievanceRevRemark',
                    'grievance_ratingScaleId': '$grievance_ratingScaleId',
                    'status': '$status',
                    'reviewerRemark': '$reviewerRemark',
                    'supRemark': '$supRemark',
                    'sup_ratingScaleId': '$sup_ratingScaleId',
                    'empRemark': '$empRemark',
                    'emp_ratingScaleId': '$emp_ratingScaleId',
                    'kra': '$mtr_details.mtr_kra',
                    'measureOfSuccess': '$mtr_details.measureOfSuccess',
                    'unitOfSuccess': '$mtr_details.unitOfSuccess',
                    'category_id': '$mtr_details.category_id',
                    'weightage_id': '$mtr_details.weightage_id'
                }
            }
        },
        {
            '$group': {
                '_id': '$emp_id',
                'emp_details': {
                    '$first': '$emp_details'
                },
                'papmasters': {
                    '$first': '$papmasters'
                },
                'updatedAt': {
                    '$first': '$updatedAt'
                },
                'kra_details': {
                    '$push': '$group_obj'
                }
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
    })
}

// When employee fills & saves/updates individual pap.
function papUpdate(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "status": "Pending",
                "empRemark": req.body.empRemark,
                "emp_ratingScaleId": req.body.emp_ratingScaleId
            }
            PapDetails.findOneAndUpdate({
                _id: req.body.papDetailsId
            }, updateQuery, (err, res) => {
                done(err, res);
            })
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papUpdate",
                "UPDATED"
            );
            done(null, papDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Pap details updated successfully');
    })
}

// Employee submits the pap to supervisor for reviewing.
function papSubmit(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "status": "Submitted"
            };
            PapDetails.updateMany({
                pap_master_id: req.body.pap_master_id
            }, updateQuery, (err, papDetails) => {
                done(err, papDetails);
            });
        },
        (papDetails, done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "status": "Submitted"
            };
            PapMasterDetails.findOneAndUpdate({ _id: req.body.pap_master_id }, updateQuery, (err, papMaster) => {
                done(err, papDetails);
            })
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papSubmit",
                "UPDATED"
            );
            done(null, papDetails);
        },
        (papDetails, done) => {

            PapDetails.aggregate([{
                '$match': {
                    'pap_master_id': parseInt(req.body.pap_master_id)
                }
            },
            {
                '$lookup': {
                    'from': 'employeeofficedetails',
                    'localField': 'supervisor_id',
                    'foreignField': 'emp_id',
                    'as': 'employeeofficedetails'
                }
            },
            {
                '$unwind': {
                    'path': '$employeeofficedetails'
                }
            }
            ]).exec(function (err, response) {
                // EmployeeDetails.findById(createdBy, (err, emp) => {
                //     response.forEach(f => {
                //         let data = {};
                //         data.emp_email = f.officeEmail;
                //         data.emp_name = f.fullName;
                //         data.action_link = action_link;
                //         data.createdBy = emp;
                //         SendEmail.sendEmailToEmployeeForPapInitiate(data);
                //     })
                done(err, papDetails);
            });
            //})

        }
    ], (err, results) => {
        sendResponse(res, err, results, 'Pap details updated successfully');
    });
}

function updateBatch(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "batchEndDate": req.body.batchEndDate
            }
            PapBatchDetails.update({
                _id: parseInt(req.body.batchId)
            }, updateQuery, (err, papBatchDetails) => {
                done(err, papBatchDetails);
            })
        },
        (papBatchDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papBatchDetails",
                papBatchDetails,
                "PAP",
                "updateBatch",
                "UPDATED"
            );
            done(null, papBatchDetails);
        }
    ], (err, results) => {
        sendResponse(res, err, results, 'Pap Batch updated successfully');
    })
}

// Supervisor fills rating and sends it to reviewer for further process.
function papUpdateSupervisor(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
            }
            if (req.body.grievanceStatus && req.body.grievanceStatus == 'Initiated') {
                updateQuery.grievance_ratingScaleId = req.body.grievance_ratingScaleId;
                updateQuery.grievanceSupRemark = req.body.grievanceSupRemark;
            } else {
                updateQuery.supRemark = req.body.supRemark;
                updateQuery.sup_ratingScaleId = req.body.sup_ratingScaleId;
            }
            PapDetails.findOneAndUpdate({
                _id: req.body.papDetailsId
            }, updateQuery, (err, res) => {
                done(err, res);
            })
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papUpdateSupervisor",
                "UPDATED"
            );
            done(null, papDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Pap details updated successfully');
    })
}

// When reviewer updates individual pap and approves or sends it back to supervisor.
function papUpdateReviewer(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
            }
            if (req.body.grievanceStatus == 'Initiated') {
                updateQuery.grievanceRevRemark = req.body.grievanceRevRemark;
                updateQuery.grievanceStatus = req.body.isApproved ? "Approved" : "SendBack";
            } else {
                updateQuery.reviewerRemark = req.body.reviewerRemark;
                updateQuery.status = req.body.isApproved ? "Approved" : "SendBack";
            }
            PapDetails.findOneAndUpdate({
                _id: req.body.papDetailsId
            }, updateQuery, (err, res) => {
                done(err, res);
            });
        },
        (papDetail, innerDone) => {
            if (req.body.grievanceStatus == 'Initiated') {
                PapDetails.aggregate([
                    {
                        $match: {
                            pap_master_id: papDetail.pap_master_id
                        }
                    },
                    {
                        $lookup: {
                            from: 'midtermdetails',
                            localField: 'mtr_details_id',
                            foreignField: '_id',
                            as: 'midtermdetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$midtermdetails'
                        }
                    },
                    {
                        $lookup: {
                            from: 'kradetails',
                            localField: 'midtermdetails.kraDetailId',
                            foreignField: '_id',
                            as: 'kradetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$kradetails'
                        }
                    },
                    {
                        $lookup: {
                            from: 'kraweightagedetails',
                            localField: 'kradetails.weightage_id',
                            foreignField: '_id',
                            as: 'kraweightagedetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$kraweightagedetails'
                        }
                    },
                    {
                        $lookup: {
                            from: 'papratingscales',
                            localField: 'grievance_ratingScaleId',
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
                ]).exec((err, papDetails) => {
                    innerDone(err, { papDetail, papDetails });
                });
            } else {
                PapDetails.aggregate([
                    {
                        $match: {
                            pap_master_id: papDetail.pap_master_id
                        }
                    },
                    {
                        $lookup: {
                            from: 'midtermdetails',
                            localField: 'mtr_details_id',
                            foreignField: '_id',
                            as: 'midtermdetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$midtermdetails'
                        }
                    },
                    {
                        $lookup: {
                            from: 'kradetails',
                            localField: 'midtermdetails.kraDetailId',
                            foreignField: '_id',
                            as: 'kradetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$kradetails'
                        }
                    },
                    {
                        $lookup: {
                            from: 'kraweightagedetails',
                            localField: 'kradetails.weightage_id',
                            foreignField: '_id',
                            as: 'kraweightagedetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$kraweightagedetails'
                        }
                    },
                    {
                        $lookup: {
                            from: 'papratingscales',
                            localField: 'sup_ratingScaleId',
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
                ]).exec((err, papDetails) => {
                    innerDone(err, { papDetail, papDetails });
                });
            }

        },
        (data, innerDone) => {
            let approvedCount = 0;
            let sendBackCount = 0;

            if (req.body.grievanceStatus == 'Initiated') {
                approvedCount = data.papDetails.filter(pap => pap.grievanceStatus == 'Approved').length || 0;
                sendBackCount = data.papDetails.filter(pap => pap.grievanceStatus == 'SendBack').length || 0;
            } else {
                approvedCount = data.papDetails.filter(pap => pap.status == 'Approved').length || 0;
                sendBackCount = data.papDetails.filter(pap => pap.status == 'SendBack').length || 0;
            }

            if (approvedCount == data.papDetails.length) {
                let overallRating = 0;
                data.papDetails.forEach(pap => {
                    let rating = (parseFloat(pap.papratingscales.ratingScale) * parseFloat(pap.kraweightagedetails.kraWeightageName)) / 100;
                    overallRating = overallRating + rating;
                });
                overallRating = overallRating.toFixed(2);
                let updateQuery = {
                    "updatedAt": new Date(),
                    "updatedBy": parseInt(req.body.updatedBy),
                    "reviewerStatus": "Approved",
                    "overallRating": overallRating
                }

                PapMasterDetails.updateOne({ _id: data.papDetail.pap_master_id }, updateQuery, (err, papMaster) => {
                    if (err) {
                        innerDone(err, papMaster);
                    };
                    innerDone(err, data.papDetail);
                });
            } else if (sendBackCount > 0) {
                let updateQuery = {
                    "updatedAt": new Date(),
                    "updatedBy": parseInt(req.body.updatedBy),
                    "reviewerStatus": "SendBack"
                }
                PapMasterDetails.updateOne({ _id: data.papDetail.pap_master_id }, updateQuery, (err, papMaster) => {
                    if (err) {
                        innerDone(err, papMaster);
                    };
                    innerDone(err, data.papDetail);
                });
            }
            else {
                innerDone(null, data.papDetail);
            }
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papUpdateReviewer",
                "UPDATED"
            );
            done(null, papDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Pap details updated successfully');
    });
}

function getPapByReviewer(req, res) {
    let reviewerId = parseInt(req.query.empId);
    async.waterfall([
        done => {
            EmployeeSupervisorDetails.find({
                primarySupervisorEmp_id: reviewerId
            }, {
                    emp_id: true
                }, function (err, response) {
                    let supervisorIdArray = [];
                    response.forEach(f => {
                        supervisorIdArray.push(f._doc.emp_id);
                    });
                    done(err, supervisorIdArray);
                });
        },
        (papDetails, done) => {
            console.log(papDetails);
            PapDetails.aggregate([
                {
                    '$match': {
                        'supervisor_id': {
                            '$in': papDetails
                        }
                    }
                },
                {
                    '$lookup': {
                        'from': 'midtermdetails',
                        'localField': 'mtr_details_id',
                        'foreignField': '_id',
                        'as': 'mtr_details'
                    }
                },
                {
                    '$unwind': {
                        'path': '$mtr_details'
                    }
                },
                {
                    '$lookup': {
                        'from': 'employeedetails',
                        'localField': 'empId',
                        'foreignField': '_id',
                        'as': 'emp_details'
                    }
                },
                {
                    '$unwind': {
                        'path': '$emp_details'
                    }
                },

                {
                    '$project': {
                        'emp_id': '$empId',
                        'userName': '$emp_details.userName',
                        'fullName': '$emp_details.fullName',
                        'supervisor_id': '$supervisor_id',
                        'updatedAt': '$updatedAt',
                        'profileImage': '$emp_details.profileImage',
                        'pap_master_id': '$pap_master_id',
                        'group_obj': {
                            'grievanceSupRemark': '$grievanceSupRemark',
                            'grievanceRevRemark': '$grievanceRevRemark',
                            'grievance_ratingScaleId': '$grievance_ratingScaleId',
                            'status': '$status',
                            'reviewerRemark': '$reviewerRemark',
                            'supRemark': '$supRemark',
                            'sup_ratingScaleId': '$sup_ratingScaleId',
                            'empRemark': '$empRemark',
                            'emp_ratingScaleId': '$emp_ratingScaleId',
                            'kra': '$mtr_details.mtr_kra',
                            'measureOfSuccess': '$mtr_details.measureOfSuccess',
                            'unitOfSuccess': '$mtr_details.unitOfSuccess',
                            'category_id': '$mtr_details.category_id',
                            'weightage_id': '$mtr_details.weightage_id',
                            'grievanceStatus': '$grievanceStatus'
                        }
                    }
                },
                {
                    '$group': {
                        '_id': '$emp_id',
                        'userName': {
                            '$first': '$userName'
                        },
                        'fullName': {
                            '$first': '$fullName'
                        },
                        'supervisor_id': {
                            '$first': '$supervisor_id'
                        },
                        'updatedAt': {
                            '$first': '$updatedAt'
                        },
                        'profileImage': {
                            '$first': '$profileImage'
                        },
                        'pap_master_id': {
                            '$first': '$pap_master_id'
                        },
                        'kra_details': {
                            '$push': '$group_obj'
                        }
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
    ])
}

function papSubmitToReviewer(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy)
            };
            let matchQuery = {
                pap_master_id: req.body.papMasterId
            };
            if (req.body.grievanceStatus == 'Initiated') {
                updateQuery.grievanceStatus = "Pending Reviewer";
                matchQuery.grievanceStatus = {
                    $in: [null, "SendBack"]
                };
            } else {
                updateQuery.status = "Pending Reviewer";
                matchQuery.status = {
                    $in: ["Submitted", "SendBack"]
                };
            }

            PapDetails.updateMany(matchQuery, updateQuery, (err, res) => {
                done(err, res);
            });
        },
        (papDetails, innerDone) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "reviewerStatus": 'Pending'
            }
            PapMasterDetails.updateOne({ _id: parseInt(req.body.papMasterId) }, updateQuery, (err, papMaster) => {
                if (err) {
                    innerDone(err, papMaster);
                };
                innerDone(err, papDetails);
            });
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papSubmitToReviewer",
                "UPDATED"
            );
            done(null, papDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Pap details updated successfully');
    })
}

function initiateFeedback(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "isRatingCommunicated": true,
                'status': "Approved"
            }
            let updateCondition = {
                'emp_id': {
                    '$in': req.body.empIds
                }
            };

            PapMasterDetails.update(updateCondition, updateQuery, (err, res) => {
                done(err, res);
            });
        },
        (PapMasterDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "PapMasterDetails",
                PapMasterDetails,
                "PAP",
                "initiateFeedback",
                "UPDATED"
            );
            done(null, PapMasterDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Feedback Initiated successfully');
    });
}

function getEmployeesForFeedbackInit(req, res) {
    async.waterfall([
        (done) => {
            PapMasterDetails.aggregate([{
                '$match': {
                    'isRatingCommunicated': false,
                    'status': 'Submitted',
                    'reviewerStatus': 'Approved'
                }
            },
            {
                '$lookup': {
                    'from': 'employeedetails',
                    'localField': 'emp_id',
                    'foreignField': '_id',
                    'as': 'employeedetails'
                }
            },
            {
                '$unwind': {
                    'path': '$employeedetails'
                }
            },
            {
                '$lookup': {
                    'from': 'employeeofficedetails',
                    'localField': 'emp_id',
                    'foreignField': '_id',
                    'as': 'employeeofficedetails'
                }
            },
            {
                '$unwind': {
                    'path': '$employeeofficedetails'
                }
            },
            {
                '$lookup': {
                    'from': 'designations',
                    'localField': 'employeedetails.designation_id',
                    'foreignField': '_id',
                    'as': 'designations'
                }
            },
            {
                '$unwind': {
                    'path': '$designations'
                }
            }
            ]).exec((err, result) => {
                done(err, result);
            })
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Employees for Feedback Initiate');
    });
}

function initiateGrievance(req, res) {
    let empId = parseInt(req.body.empId);
    let papMasterId = parseInt(req.body.papMasterId);
    async.waterfall([
        (done) => {
            let condition = {
                "_id": papMasterId,
                "emp_id": empId
            };
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy)
            };
            if (req.body.raiseGreivance) {
                updateQuery.grievanceStatus = "Initiated";
                updateQuery.reviewerStatus = null;
            } else {
                updateQuery.grievanceStatus = "Satisfied";
            }

            PapMasterDetails.update(condition, updateQuery, (err, res) => {
                done(err, res);
            })
        },
        (PapMasterDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "PapMasterDetails",
                PapMasterDetails,
                "PAP",
                "initiateGrievance",
                "UPDATED"
            );
            done(null, PapMasterDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Grievance Initiated');
    });
}

function getEmployeesForGrievance(req, res) {
    async.waterfall([
        (done) => {
            PapMasterDetails.aggregate([{
                '$match': {
                    'grievanceStatus': 'Initiated'
                }
            },
            {
                '$lookup': {
                    'from': 'employeedetails',
                    'localField': 'emp_id',
                    'foreignField': '_id',
                    'as': 'employeedetails'
                }
            },
            {
                '$unwind': {
                    'path': '$employeedetails'
                }
            },
            {
                '$lookup': {
                    'from': 'employeeofficedetails',
                    'localField': 'emp_id',
                    'foreignField': '_id',
                    'as': 'employeeofficedetails'
                }
            },
            {
                '$unwind': {
                    'path': '$employeeofficedetails'
                }
            },
            {
                '$lookup': {
                    'from': 'designations',
                    'localField': 'employeedetails.designation_id',
                    'foreignField': '_id',
                    'as': 'designations'
                }
            },
            {
                '$unwind': {
                    'path': '$designations',
                    'preserveNullAndEmptyArrays': true
                }
            }
            ]).exec((err, result) => {
                done(err, result);
            })
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Employees for Grievance Initiate');
    });
}

let functions = {
    getEmployeesForPapInitiate: (req, res) => {
        getEmployeesForPapInitiate(req, res);
    },
    initiatePapProcess: (req, res) => {
        initiatePapProcess(req, res);
    },
    getPapBatches: (req, res) => {
        getPapBatches(req, res);
    },
    getPapDetailsSingleEmployee: (req, res) => {
        getPapDetailsSingleEmployee(req, res);
    },
    getPapBySupervisor: (req, res) => {
        getPapBySupervisor(req, res);
    },
    papUpdate: (req, res) => {
        papUpdate(req, res);
    },
    papSubmit: (req, res) => {
        papSubmit(req, res);
    },
    updateBatch: (req, res) => {
        updateBatch(req, res);
    },
    papUpdateSupervisor: (req, res) => {
        papUpdateSupervisor(req, res);
    },
    papUpdateReviewer: (req, res) => {
        papUpdateReviewer(req, res);
    },
    getPapByReviewer: (req, res) => {
        getPapByReviewer(req, res);
    },
    papSubmitToReviewer: (req, res) => {
        papSubmitToReviewer(req, res);
    },
    initiateFeedback: (req, res) => {
        initiateFeedback(req, res);
    },
    getEmployeesForFeedbackInit: (req, res) => {
        getEmployeesForFeedbackInit(req, res);
    },
    initiateGrievance: (req, res) => {
        initiateGrievance(req, res);
    },
    getEmployeesForGrievance: (req, res) => {
        getEmployeesForGrievance(req, res);
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