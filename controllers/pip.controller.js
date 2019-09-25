let pipbatch = require("../models/pip/pipbatch"),
  pipMaster = require("../models/pip/pipmaster"),
  pipdetails = require("../models/pip/pipdetails"),
  AuditTrail = require("../class/auditTrail"),
  EmployeeSupervisorDetails = require("../models/employee/employeeSupervisorDetails.model");
SendEmail = require('../class/sendEmail'),
  EmployeeDetails = require("../models/employee/employeeDetails.model");

function getEligiablePipEmployee(req, res) {
  let fiscalYearId = parseInt(req.query.fiscalYearId);
  async.waterfall([
    (done) => {
      EmployeeDetails.aggregate([
        {
          "$lookup": {
            "from": "designations",
            "localField": "designation_id",
            "foreignField": "_id",
            "as": "designations"
          }
        },
        {
          "$unwind": {
            "path": "$designations"
          }
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
          "$unwind": {
            "path": "$officeDetails"
          }
        },
        {
          "$lookup": {
            "from": "pipmasters",
            "localField": "_id",
            "foreignField": "emp_id",
            "as": "pip_master_details"
          }
        },
        {
          "$unwind": {
            "path": "$pip_master_details",
            "preserveNullAndEmptyArrays": true
          }
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
          "$unwind": {
            "path": "$supervisor"
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
            "path": "$employees",
            "preserveNullAndEmptyArrays": true
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
            "path": "$employeeSecondary",
            "preserveNullAndEmptyArrays": true
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
          "$unwind": {
            "path": "$employeeprofileProcessDetails"
          }
        },
        {
          "$lookup": {
            "from": "papmasters",
            "localField": "_id",
            "foreignField": "emp_id",
            "as": "papdetails"
          }
        },
        {
          "$lookup": {
            "from": "papmasters",
            "localField": "_id",
            "foreignField": "emp_id",
            "as": "pipMasterdetails"
          }
        },
        {
          "$unwind": {
            "path": "$pipMasterdetails"
          }
        },
        // {
        //   "$match": {
        //     "isDeleted": false,
        //     "designations.isActive": true,
        //     "pipMasterdetails.fiscalYearId": fiscalYearId,
        //     "officeDetails.isDeleted": false,
        //     "papdetails.overallRating": {
        //       "$gt": 1.0
        //     }
        //   }
        // },
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
            "hrScope_id": "$officeDetails.hrspoc_id",
            "groupHrHead_id": "$officeDetails.groupHrHead_id",
            "businessHrHead_id": "$officeDetails.businessHrHead_id",
            "supervisor_id": "$employees._id",
            "secondarySupervisor": "$employeeSecondary.fullName",
            "secondarySupervisor_id": "$employeeSecondary._id",
            "profileProcessDetails": "$employeeprofileProcessDetails",
            "department_id": "$officeDetails.department_id",
            "grade_id": "$grade_id",
            "overallRating": "$papdetails.overallRating",
            "pip_status": "$pip_master_details.status",
            "pip_batch_id": "$pip_master_details.batch_id",
            "company_id": "$company_id"

          }
        }
      ]).exec(function (err, results) {
        done(err, results);
      });
    },
    (empData, data2) => {
      pipMaster.find({ fiscalYearId: fiscalYearId }).exec((err, response) => {
        if (err) {
          return res.status(403).json({
            title: 'There was a problem',
            error: {
              message: err
            },
            result: {
              message: response
            }
          });
        }
        response.forEach(f => {
          let index = empData.findIndex(i => i._id == f.emp_id);
          if (index > -1)
            empData.splice(index, 1);
        });
        return res.status(200).json({ "data": empData });

      });
    }
  ]);
}
function InitiatePip(req, res) {
  let createdby = parseInt(req.body.createdBy);
  let timelines = parseInt(req.body.timelines);
  let fiscalYearId = parseInt(req.body.fiscalYearId);
  let pipBatchDetails = new pipbatch();
  pipBatchDetails.batchName = req.body.batchName;
  pipBatchDetails.timelines = 3;
  pipBatchDetails.batchEndDate = new Date(
    new Date(req.body.batchEndDate).getTime());
  pipBatchDetails.status = req.body.status;
  pipBatchDetails.isDeleted = false;
  pipBatchDetails.createdBy = createdby;
  pipBatchDetails.fiscalYearId = fiscalYearId;
  let emp_id_array = req.body.emp_id_array;
  let email_details = {
    emp_email: '',
    emp_name: '',
    hr_name: req.body.createdByName,
    action_link: req.body.action_link
  };
  pipBatchDetails.save(function (err, pipBatchresp) {

    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: pipBatchresp
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "pipBatchDetails",
        pipBatchresp,
        "user",
        "pipBatchDetails",
        "ADDED"
      );
      let batch_id = pipBatchresp.id;
      Promise.all([
        pipMaster.aggregate([{
          $sort: {
            _id: -1.0
          }
        },
        {
          $project: {
            _id: "$_id"
          }
        },
        {
          $limit: 1.0
        }
        ]).exec()
      ]).then(function (counts) {
        let insertData = [];
        let pipMaster_id =
          counts[0][0] === undefined ? 0 : counts[0][0]._id;
        emp_id_array.forEach(function (element, index) {
          insertData.push({
            batch_id: batch_id,
            emp_id: element.emp_id,
            status: "Initiated",
            timelines: timelines,
            _id: pipMaster_id + (index + 1),
            createdBy: createdby,
            fiscalYearId: fiscalYearId
          });
        });
        pipMaster.insertMany(insertData, function (
          err,
          pipMasterResult
        ) {
          if (err) {
            return res.status(403).json({
              title: "There was a problem",
              error: {
                message: err
              },
              result: {
                message: pipMasterResult
              }
            });
          } else {
            AuditTrail.auditTrailEntry(
              0,
              "pipMaster",
              insertData,
              "user",
              "pipMaster",
              "ADDED"
            );
            sendEmailToEmployee(emp_id_array, res, email_details);
          }
        });
      });
    }
  });
}
function sendEmailToEmployee(emp_id_array, res, email_details) {
  EmployeeDetails.aggregate([
    {
      "$lookup": {
        "from": "employeeofficedetails",
        "localField": "_id",
        "foreignField": "emp_id",
        "as": "office_details"
      }
    },
    {
      "$unwind": {
        "path": "$office_details"
      }
    },
    {
      "$match": {
        "_id": { "$in": emp_id_array.map(emp => { return emp.emp_id }) },
      }
    },
    {
      "$project": {
        "_id": "$_id",
        "user_name": "$fullName",
        "officeEmail": "$office_details.officeEmail"
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      data.forEach(f => {
        email_details.emp_name = f.user_name;
        email_details.emp_email = f.officeEmail;
        SendEmail.sendEmailToEmployeeForInitiatePIP(email_details, (email_err, email_result) => {
          if (email_err) {
            return res.status(301).json({
              title: "PIP initiated, failed sending email to employee",
              error: {
                message: email_err
              },
              result: {
                message: email_result
              }
            });
          } else {
            return res.status(200).json({
              title: "PIP initiated, and email sent to employee",
              result: {
                message: email_result
              }
            });
          }
        });
      });
    }
  });
}
function sendEmailToSupervisor(emp_id, res, email_details) {
  EmployeeDetails.aggregate([
    {
      "$lookup": {
        "from": "employeeofficedetails",
        "localField": "_id",
        "foreignField": "emp_id",
        "as": "office_details"
      }
    },
    {
      "$unwind": {
        "path": "$office_details"
      }
    },
    {
      "$lookup": {
        "from": "employeesupervisordetails",
        "localField": "_id",
        "foreignField": "emp_id",
        "as": "emp_supDetails"
      }
    },
    {
      "$unwind": {
        "path": "$emp_supDetails"
      }
    },
    {
      "$lookup": {
        "from": "employeedetails",
        "localField": "emp_supDetails.primarySupervisorEmp_id",
        "foreignField": "_id",
        "as": "emp_supDetails_name"
      }
    },
    {
      "$unwind": {
        "path": "$emp_supDetails_name"
      }
    },
    {
      "$lookup": {
        "from": "employeeofficedetails",
        "localField": "emp_supDetails.primarySupervisorEmp_id",
        "foreignField": "emp_id",
        "as": "sup_office_details"
      }
    },
    {
      "$unwind": {
        "path": "$sup_office_details"
      }
    },
    {
      "$match": {
        "_id": emp_id,
      }
    },
    {
      "$project": {
        "_id": "$_id",
        "user_name": "$fullName",
        "officeEmail": "$office_details.officeEmail",
        "sup_name": "$emp_supDetails_name.fullName",
        "supEmail": "$sup_office_details.officeEmail"
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      email_details.emp_name = data[0].user_name;
      email_details.emp_email = data[0].supEmail;
      email_details.supervisor_name = data[0].sup_name;
      SendEmail.sendEmailToSupervisorForMonthlyCommentPIP(email_details, (email_err, email_result) => {
        if (email_err) {
          return res.status(301).json({
            title: "PIP Comment Submitted, failed sending email to supervisor",
            error: {
              message: email_err
            },
            result: {
              message: email_result
            }
          });
        } else {
          return res.status(200).json({
            title: "PIP Comment Submitted, and email sent to supervisor",
            result: {
              message: email_result
            }
          });
        }
      });
    }
  });
}
function getpipDetails(req, res) {
  let empId = parseInt(req.query.emp_id);
  let fiscalYearId = parseInt(req.query.fiscalYearId);
  pipMaster.aggregate([{
    $match: {
      emp_id: empId,
      fiscalYearId: fiscalYearId
    }
  },
  {
    $lookup: {
      from: "pipbatches",
      localField: "batch_id",
      foreignField: "_id",
      as: "pip_master_details"
    }
  },
  {
    $unwind: {
      path: "$pip_master_details"
    }
  },
  {
    $lookup: {
      from: "employeedetails",
      localField: "pip_master_details.createdBy",
      foreignField: "_id",
      as: "createdByName"
    }
  },
  {
    $unwind: {
      path: "$createdByName"
    }
  },

  {
    $project: {

      pip_batch_name: "$pip_master_details.batchName",
      createdBy: "$pip_master_details.createdBy",
      createdAt: "$pip_master_details.createdAt",
      updatedAt: "$pip_master_details.updatedAt",
      createdByName: "$createdByName.fullName",
      batchEndDate: "$pip_master_details.batchEndDate",
      timelines: "$timelines",
      sup_final_com: "$sup_final_com",
      emp_final_com: "$emp_final_com",
      rev_final_com: "$rev_final_com",
      hr_final_com: "$hr_final_com",
      final_status: "$final_status",
      final_recommendation: "$final_recommendation",
      final_remarks: "$final_remarks",
      status: "$status",
      batchId: "$pip_master_details._id",
      extended_by: "$extended_by"

    }
  },
  { $sort: { createdAt: -1 } }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a Problem",
        error: {
          message: err
        },
        result: {
          message: data
        }

      });
    } else {
      return res.status(200).json({
        title: "PIP master Details",
        result: {
          message: data
        }
      });
    }

  });
}
function insertPip(req, res) {
  let master_id = parseInt(req.body.master_id);
  let supervisor_id = parseInt(req.body.supervisor_id);
  let cretedBy = req.body.createdBy;
  let updatedBy = req.body.updatedBy;
  let pipDetails = new pipdetails();
  let action_link = req.body.action_link;
  let emp_id = parseInt(req.body.empId);
  let shouldSendEmail = Boolean(req.body.shouldSendEmail);
  let email_details = {
    emp_name: '',
    emp_email: '',
    action_link: action_link
  }
  pipDetails.master_id = master_id;
  pipDetails.supervisor_id = supervisor_id;
  pipDetails.status = req.body.status;
  pipDetails.isDeleted = req.body.isDeleted;
  pipDetails.createdBy = cretedBy;
  pipDetails.updatedBy = updatedBy;
  pipDetails.areaofImprovement = req.body.areaofImprovement;
  pipDetails.actionPlan = req.body.actionPlan;
  pipDetails.timelines = req.body.timelines;
  pipDetails.measureOfSuccess = req.body.measureOfSuccess;
  pipDetails.employeeInitialComment = req.body.employeeInitialComment;

  if (req.body._id != null) {
    let updateQuery = {
      supervisor_id: supervisor_id,
      employeeInitialComment: req.body.employeeInitialComment,
      areaofImprovement: req.body.areaofImprovement,
      actionPlan: req.body.actionPlan,
      measureOfSuccess: req.body.measureOfSuccess,
      progressStatus: req.body.progressStatus,
      employeeComment: req.body.employeeComment,
      status: req.body.status,
      developmentArea: req.body.developmentArea,
      supportRequired: req.body.supportRequired,
      developmentPlan: req.body.developmentPlan,
      timelines: req.body.timelines,
      updatedBy: parseInt(req.body.updatedBy),
      updatedAt: new Date(),
      completionDate: req.body.completionDate,
      empComment_month1: req.body.empComment_month1,
      empComment_month2: req.body.empComment_month2,
      empComment_month3: req.body.empComment_month3,
      empComment_month4: req.body.empComment_month4,
      empComment_month5: req.body.empComment_month5,
      empComment_month6: req.body.empComment_month6,
    };
    pipdetails.findOneAndUpdate(
      { _id: parseInt(req.body._id) },
      updateQuery,
      (err, response) => {
        if (err) {
          return res.status(403).json({
            title: "There is a problem",
            error: {
              message: err
            },
            result: {
              message: response
            }
          });
        } else {
          AuditTrail.auditTrailEntry(
            0,
            "pipdetails",
            response,
            "user",
            "pipdetails",
            "UPDATED"
          );
          if (shouldSendEmail)
            sendEmailToSupervisor(emp_id, res, email_details);
          else {
            return res.status(200).json({
              title: "PIP Comment Submitted",
              result: {
                message: response
              }
            });
          }
        }
      }
    );
  } else {
    pipDetails.save(function (err, response) {
      if (err) {
        return res.status(403).json({
          title: "There is a problem",
          error: {
            message: err
          },
          result: {
            message: response
          }
        });
      } else {
        AuditTrail.auditTrailEntry(
          0,
          "pipDetails",
          response,
          "user",
          "pipDetails",
          "ADDED"
        );
        return res.status(200).json({
          title: "New Topic Added",
          result: {
            message: response
          }
        });
      }
    });
  }
}

function getpipdetailspostinsertion(req, res) {
  let master_id = parseInt(req.query.master_id);
  pipdetails.aggregate([{
    $match: {
      master_id: master_id
    }
  },
  {
    $lookup: {
      from: "pipmasters",
      localField: "master_id",
      foreignField: "_id",
      as: "pipdetails"
    }
  },
  {
    $unwind: {
      path: "$pipdetails"
    }
  },
  {
    $lookup: {
      from: "employeesupervisordetails",
      localField: "pipdetails.emp_id",
      foreignField: "emp_id",
      as: "empsupdetails"
    }
  },
  {
    $unwind: {
      path: "$empsupdetails"
    }
  },
  {
    $lookup: {
      from: "employeedetails",
      localField: "supervisor_id",
      foreignField: "_id",
      as: "empdetails"
    }
  },
  {
    $unwind: {
      path: "$empdetails"
    }
  },
  {
    $project: {

      id: "$_id",
      createdby: "$createdBy",
      createdAt: "createdAt",
      updatedBy: "$updatedBy",
      updatedAt: "$updatedAt",
      master_id: "$pipdetails._id",
      master_timelines: "$pipdetails.timelines",
      emp_final_com: "$pipdetails.emp_final_com",
      sup_final_com: "$pipdetails.sup_final_com",
      rev_final_com: "$pipdetails.rev_final_com",
      hr_final_com: "$pipdetails.hr_final_com",
      final_recommendation: "$pipdetails.final_recommendation",
      status: "$status",
      master_status: "$pipdetails.status",
      supervisor_id: "$supervisor_id",
      areaofImprovement: "$areaofImprovement",
      actionPlan: "$actionPlan",
      superviserFinalReview: "$finalReview",
      supervisorPerformanceRating: "$finalRating",
      timelines: "$timelines",
      measureOfSuccess: "$measureOfSuccess",
      employeeInitialComment: "$employeeInitialComment",
      superviserInitialComment: "$superviserInitialComment",
      empComment_month1: "$empComment_month1",
      supComment_month1: "$supComment_month1",
      empComment_month2: "$empComment_month2",
      supComment_month2: "$supComment_month2",
      empComment_month3: "$empComment_month3",
      supComment_month3: "$supComment_month3",
      empComment_month4: "$empComment_month4",
      supComment_month4: "$supComment_month4",
      empComment_month5: "$empComment_month5",
      supComment_month5: "$supComment_month5",
      empComment_month6: "$empComment_month6",
      supComment_month6: "$supComment_month6",
      primary_supervisor: "$empsupdetails.primarySupervisorEmp_id",
      secondary_supervisor: "$empsupdetails.secondarySupervisorEmp_id",
      supervisor_name: "$empdetails.fullName",
      extended_by: "$pipdetails.extended_by",
      isExtended: "$pipdetails.isExtended",
      dateDifference: { $divide: [{ $subtract: [new Date(), "$approvedAt"] }, 3600000 * 24 * 30] }
      //dateDifference: { $literal: 5 }
    }
  }
  ]).exec(function (err, data) {

    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {

      return res.status(200).json({
        title: "pip details",
        result: {
          message: data
        }
      });
    }
  });
}
function getpipBySupervisor(req, res) {
  let supervisorId = parseInt(req.query.supervisor_id);
  let fiscalYearId = parseInt(req.query.fiscalYearId);
  let status = req.query.status;
  pipdetails.aggregate([
    {
      $match: {
        supervisor_id: supervisorId
      }
    },
    {
      $lookup: {
        from: "pipmasters",
        localField: "master_id",
        foreignField: "_id",
        as: "pip_master_details"
      }
    },
    {
      $unwind: {
        path: "$pip_master_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "pip_master_details.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details"
      }
    },
    {
      $project: {
        pipMasterId: "$master_id",
        emp_details: "$emp_details",
        pip_master_details: "$pip_master_details",
        status: "$pip_master_details.status",
        updatedAt: "$pip_master_details.updatedAt"
      }
    },
    { $match: { $or: [{ status: status }, { status: "Completed" }], "pip_master_details.fiscalYearId": fiscalYearId } },
    {
      $group: {
        _id: "$pipMasterId",
        emp_details: { $first: "$emp_details" },
        pip_master_details: { $first: "$pip_master_details" },
        updatedAt: { $first: "$updatedAt" }
      }
    },
    { $sort: { updatedAt: 1 } }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem in pip",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "pip master data",
        result: {
          message: data
        }
      });
    }
  });
}
function submitpip(req, res) {
  let Pip_master_id = parseInt(req.body.master_id);
  let emp_id = parseInt(req.body.empId);
  let supervisor_id = parseInt(req.body.supervisor_id);
  let email_details = {
    supervisor_email: '',
    supervisor_name: '',
    user_name: req.body.emp_name,
    action_link: req.body.action_link
  };
  let updateCondition = { master_id: Pip_master_id, status: ["Initiated", "SendBack"] };
  let updateQuery = {
    status: "Submitted",
    updatedBy: emp_id,
    updatedAt: new Date()
  };
  async.waterfall(
    [
      done => {
        pipdetails.updateMany(updateCondition, updateQuery, function (
          err,
          response
        ) {
          done(err, response);
        });
      },
      (response1, done) => {
        pipMaster.findOneAndUpdate(
          { _id: Pip_master_id },
          updateQuery,
          (err, doc) => {
            done(err, doc);
          }
        );
      },
      (response2, done) => {
        EmployeeDetails.aggregate(
          [
            {
              "$lookup": {
                "from": "employeeofficedetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "office_details"
              }
            },
            {
              "$unwind": {
                "path": "$office_details"
              }
            },
            {
              "$match": {
                "_id": supervisor_id
              }
            },
            {
              "$project": {
                "_id": "$_id",
                "user_name": "$fullName",
                "officeEmail": "$office_details.officeEmail"
              }
            }
          ]).then((doc, err) => {
            let finalData = { pipmaster: response2, emp: doc }
            done(err, finalData);
          });
      }
    ],
    (err, result) => {
      if (err) {
        return res.status(403).json({
          title: "There is a problem",
          error: {
            message: err
          },
          result: {
            message: result
          }
        });
      } else {
        email_details.supervisor_name = result.emp[0].user_name;
        email_details.supervisor_email = result.emp[0].officeEmail;
        SendEmail.sendEmailToSupervisorToApprovePip(email_details, (email_err, email_result) => {
          if (email_err) {
            return res.status(301).json({
              title: "Pip submitted, failed sending email to supervisor",
              error: {
                message: email_err
              },
              result: {
                message: email_result
              }
            });
          } else {
            return res.status(200).json({
              title: "pip review submitted, and email sent to supervisor",
              result: {
                message: email_result
              }
            });
          }
        });
      }
    }
  );
}
function getpipByReviewer(req, res) {
  let reviewerId = parseInt(req.query.reviewerId);
  let fiscalYearId = parseInt(req.query.fiscalYearId);
  EmployeeSupervisorDetails.aggregate([
    {
      $match: { primarySupervisorEmp_id: reviewerId }
    },
    {
      $lookup: {
        from: "pipdetails",
        localField: "emp_id",
        foreignField: "supervisor_id",
        as: "pip_details"
      }
    },
    {
      $unwind: {
        path: "$pip_details"
      }
    },
    {
      $lookup: {
        from: "pipmasters",
        localField: "pip_details.master_id",
        foreignField: "_id",
        as: "pip_master_details"
      }
    },
    {
      $unwind: {
        path: "$pip_master_details"
      }
    },
    { $match: { "pip_master_details.fiscalYearId": fiscalYearId } },
    {
      $lookup: {
        from: "employeedetails",
        localField: "pip_master_details.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details"
      }
    },
    {
      $project: {
        PipMasterId: "$master_id",
        emp_details: "$emp_details",
        pip_master_details: "$pip_master_details",
        status: "$pip_master_details.status",
        updatedAt: "$pip_master_details.updatedAt"
      }
    },
    {
      $group: {
        _id: "$pip_master_details._id",
        emp_details: { $first: "$emp_details" },
        pip_master_details: { $first: "$pip_master_details" },
        updatedAt: { $first: "$updatedAt" }
      }
    },
    { $sort: { updatedAt: 1 } }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "Pip Data by Reviewer",
        result: {
          message: data
        }
      });
    }
  });

}
function getPipApproval(req, res) {
  let pipMasterId = parseInt(req.body.pipMasterId);
  let pipDetailId = parseInt(req.body.pipDetailId);
  let empId = parseInt(req.body.empId);
  let supervisorId = parseInt(req.body.supervisorId);
  let eligibleForEmail = false;
  let email_details = {
    user_email: '',
    supervisor_name: req.body.supervisor_name,
    user_name: '',
    action_link: req.body.action_link,
    status: req.body.isApproved ? "Approved" : "SendBack"
  };
  let isPipApproved = false;
  let contain = function (element) {
    return element._id === pipDetailId;
  }
  async.waterfall(
    [
      done => {
        let masterUpdateQuery = {
          updatedBy: supervisorId,
          updatedAt: new Date(),
          status: "Submitted"
        };
        pipdetails.find({ master_id: pipMasterId }, (err, res) => {
          if (err)
            done(err, null);
          let pendingPip = res.filter(pip => {
            return (!pip.status || pip.status == "Submitted");
          });
          if (pendingPip.some(contain)) {

            let sendbackPip = res.filter(pip => {
              return (pip.status == "SendBack");
            });

            if (pendingPip.length <= 1 && sendbackPip.length < 1 && req.body.isApproved) {

              masterUpdateQuery.status = "Approved";
              eligibleForEmail = true;
            }

            if (sendbackPip.length > 0 || !req.body.isApproved) {
              masterUpdateQuery.status = "SendBack";
              eligibleForEmail = true;
            }
            pipMaster.findByIdAndUpdate({ _id: pipMasterId }, masterUpdateQuery, (err, res) => {
              done(err, res);
            });
          } else {
            done(null, null);
          }
        });
      },
      (pipMasterResponse, done) => {

        let pipDetailUpdateQuery = {
          superviserInitialComment: req.body.superviserInitialComment,
          updatedBy: parseInt(req.body.supervisorId),
          updatedAt: new Date(),
          status: req.body.isApproved ? "Approved" : "SendBack"
        };
        if (req.body.isApproved && req.body.progressStatus == "Dropped") {
          pipDetailUpdateQuery.status = "Dropped";
        }
        if (req.body.isApproved) {

          pipDetailUpdateQuery.approvedAt = new Date();
        }
        pipdetails.findOneAndUpdate({ _id: pipDetailId }, pipDetailUpdateQuery, (err, res) => {
          done(err, res);
        });
      },
      (response2, done) => {
        // for email details
        EmployeeDetails.aggregate(
          [
            {
              "$lookup": {
                "from": "employeeofficedetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "office_details"
              }
            },
            {
              "$unwind": {
                "path": "$office_details"
              }
            },
            {
              "$match": {
                "_id": empId
              }
            },
            {
              "$project": {
                "_id": "$_id",
                "user_name": "$fullName",
                "officeEmail": "$office_details.officeEmail"
              }
            }
          ]).then((doc, err) => {
            let finalData = { pipmaster: response2, emp: doc }
            done(err, finalData);
          });
      }
    ],
    (err, result) => {
      if (err) {
        return res.status(403).json({
          title: "There is a problem",
          error: {
            message: err
          },
          result: {
            message: result
          }
        });
      } else {
        // #70 fix, email fix
        if (eligibleForEmail) {
          email_details.user_name = result.emp[0].user_name;
          email_details.user_email = result.emp[0].officeEmail;
          if (email_details.user_email) {
            SendEmail.sendEmailToEmployeeForApprovedPIP(email_details, (email_err, email_result) => {
              if (email_err) {
                return res.status(301).json({
                  title: "Pip review approved, failed sending email to employee",
                  error: {
                    message: "Pip review approved, failed sending email to employee"
                  },
                  result: {
                    message: email_result
                  }
                });
              } else {
                return res.status(200).json({
                  title: "Pip review approved, and email sent to employee",
                  result: {
                    message: email_result
                  }
                });
              }
            });
          } else {
            return res.status(301).json({
              title: "Pip review approved, failed sending email to employee",
              error: {
                message: "pip review approved, failed sending email to employee"
              },
              result: {
                message: result
              }
            });
          }
        } else {
          return res.status(200).json({
            title: "Pip review submitted",
            result: {
              message: result
            }
          });
        }
      }
    }
  );
}
function getBatch(req, res) {
  let currentUserId = parseInt(req.query.empId);
  let fiscalYearId = parseInt(req.query.fiscalYearId);
  pipbatch.aggregate([
    {
      $match: {
        createdBy: currentUserId,
        fiscalYearId: fiscalYearId
      }
    },
    {
      $lookup: {
        from: "pipmasters",
        localField: "_id",
        foreignField: "batch_id",
        as: "pip_master"
      }
    },
    {
      $unwind: {
        path: "$pip_master",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "pip_master.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "grades",
        localField: "emp_details.grade_id",
        foreignField: "_id",
        as: "emp_grade_details"
      }
    },
    {
      $unwind: {
        path: "$emp_grade_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "employeeofficedetails",
        localField: "emp_details._id",
        foreignField: "emp_id",
        as: "emp_office_details"
      }
    },
    {
      $unwind: {
        path: "$emp_office_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "departments",
        localField: "emp_office_details.department_id",
        foreignField: "_id",
        as: "emp_dept_details"
      }
    },
    {
      $unwind: {
        path: "$emp_dept_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        updatedAt: 1,
        createdAt: 1,
        isDeleted: 1,
        status: 1,
        updatedBy: 1,
        createdBy: 1,
        batchEndDate: 1,
        batchName: 1,
        pip_master: {
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
          batch_id: 1,
          emp_id: 1,
          isDeleted: 1,
          createdBy: 1,
          updatedBy: 1,
          status: 1,
          emp_details: "$emp_details",
          emp_grade_details: "$emp_grade_details",
          emp_dept_details: "$emp_dept_details"
        }
      }
    },
    {
      $group: {
        _id: "$_id",
        updatedAt: { $first: "$updatedAt" },
        createdAt: { $first: "$createdAt" },
        isDeleted: { $first: "$isDeleted" },
        status: { $first: "$status" },
        updatedBy: { $first: "$updatedBy" },
        createdBy: { $first: "$createdBy" },
        batchEndDate: { $first: "$batchEndDate" },
        batchName: { $first: "$batchName" },
        pip_master: { $push: "$pip_master" }
      }
    },
    { $sort: { createdAt: 1 } }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "Pip master data",
        result: {
          message: data
        }
      });
    }
  });
}
function updatePipBatch(req, res) {
  let batchId = parseInt(req.body.batchId);
  let updateQuery = {
    "updatedAt": new Date(),
    "updatedBy": parseInt(req.body.updatedBy),
    "batchEndDate": req.body.batchEndDate
  };

  pipbatch.findOneAndUpdate({ _id: batchId }, updateQuery, (err, result) => {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: result
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "pipbatch",
        result,
        "pip",
        "updateBatch",
        "UPDATED"
      );
      return res.status(200).json({
        title: "Pip batch updated",
        result: {
          message: result
        }
      });
    }
  });
}
function updatepipdetails(req, res) {
  let details_id = parseInt(req.body.pipDetailId);
  let masterId = req.body.pipMasterId;

  async.waterfall([
    done => {
      let masterUpdateQuery = {
        updatedAt: new Date(),
        updatedBy: parseInt(req.body.updatedBy),
        status: "Completed"
      }
      pipdetails.find({ master_id: masterId }, (err, res) => {

        if (err)
          done(err, null);

        let finalReviewLength = res.filter(pip => {
          return (pip.finalRating == null || typeof pip.finalRating == 'undefined');
        });

        if (finalReviewLength.length <= 1 && req.body.supervisorPerformanceRating && req.body.superviserFinalReview) {

          pipMaster.findByIdAndUpdate({ _id: masterId }, masterUpdateQuery, (err, res) => {
            done(err, res);
          });
        } else {
          done(null, null);
        }

      });
    },
    done => {
      let updateQuery = {
        updatedAt: new Date(),
        updatedBy: parseInt(req.body.updatedBy),
        supComment_month1: req.body.supComment_month1,
        supComment_month2: req.body.supComment_month2,
        supComment_month3: req.body.supComment_month3,
        supComment_month4: req.body.supComment_month4,
        supComment_month5: req.body.supComment_month5,
        supComment_month6: req.body.supComment_month6,
        //"timelines": parseInt(req.body.timelines),
        finalRating: req.body.supervisorPerformanceRating === undefined ? null : req.body.supervisorPerformanceRating,
        finalReview: req.body.superviserFinalReview

      };

      if (req.body.supervisorPerformanceRating && req.body.superviserFinalReview) {
        updateQuery.status = "Completed";
      }
      pipdetails.findOneAndUpdate({ _id: details_id }, updateQuery, (err, result) => {
        if (err) {
          return res.status(403).json({
            title: "There was a problem",
            error: {
              message: err
            },
            result: {
              message: result
            }
          });
        } else {
          AuditTrail.auditTrailEntry(
            0,
            "pipdetails",
            result,
            "pip",
            "updateDetails",
            "UPDATED"
          );
          return res.status(200).json({
            title: "Pip detail updated",
            result: {
              message: result
            }
          });
        }
      });
    }
  ]);
}
function getPipByHr(req, res) {
  let hrId = parseInt(req.query.hrId);
  let fiscalYearId = parseInt(req.query.fiscalYearId);
  pipbatch.aggregate([
    {
      $match: {
        createdBy: hrId
      }
    },
    {
      $lookup: {
        from: "pipmasters",
        localField: "_id",
        foreignField: "batch_id",
        as: "pip_master"
      }
    },
    {
      $unwind: {
        path: "$pip_master"
      }
    },
    {
      $match: {
        "pip_master.fiscalYearId": fiscalYearId
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "pip_master.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details"
      }
    },
    {
      $lookup: {
        from: "pipdetails",
        localField: "pip_master._id",
        foreignField: "master_id",
        as: "pip_details"
      }
    },
    {
      $unwind: {
        path: "$pip_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {

        pip_details: "$pip_details",
        pip_master: "$pip_master",
        batch_name: "$batchName",
        emp_details: "$emp_details"
      }
    },
    {
      $group: {
        _id: "$pip_master._id",
        emp_details: { $first: "$emp_details" },
        pip_master: { $first: "$pip_master" },
        pip_details: { $first: "$pip_details" }
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {

      return res.status(200).json({
        title: "PIP data by HR",
        result: {
          message: data
        }
      });
    }
  });
}
function updatepipMaster(req, res) {
  let master_id = req.body.masterId;

  let updateQuery = {
    updatedAt: new Date(),
    updatedBy: parseInt(req.body.updatedBy),
    hr_final_com: req.body.hrFinalCom,
    emp_final_com: req.body.empFinalCom,
    rev_final_com: req.body.revFinalCom,
    sup_final_com: req.body.supFinalCom,
  }
  pipMaster.findOneAndUpdate({ _id: master_id }, updateQuery, (err, result) => {
    if (err) {
      return res.status(403).json({

        title: "There was a problem",
        error: {
          message: err
        },
        message: {
          message: result
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "pipmaster",
        result,
        "pip",
        "updateDetails",
        "UPDATED"
      );
      return res.status(200).json({
        title: "Pip master updated",
        result: {
          message: result
        }
      });
    }
  });

}
function updatepipMasterHR(req, res) {

  let master_id = req.body.masterId;
  let final_recommendation = req.body.finalRecommendation;

  let updateCondition = { master_id: master_id };
  let pipMasterUpdateQuery = {
    updatedAt: new Date(),
    updatedBy: parseInt(req.body.updatedBy),
    hr_final_com: req.body.hrFinalCom,
    emp_final_com: req.body.empFinalCom,
    rev_final_com: req.body.revFinalCom,
    sup_final_com: req.body.supFinalCom,
    final_recommendation: req.body.finalRecommendation === undefined ? null : req.body.finalRecommendation,
    status: "PIP Completed",
  }
  let pipDetailUpdateQuery = {
    updatedAt: new Date(),
    updatedBy: parseInt(req.body.updatedBy),
    status: "PIP Completed"
  }

  if (final_recommendation === 4) {
    pipDetailUpdateQuery.status = "Extended";
    pipMasterUpdateQuery.status = "Extended";
    pipMasterUpdateQuery.isExtended = true;
    pipMasterUpdateQuery.extended_by = req.body.extendedBy === undefined ? null : req.body.extendedBy;
    pipMasterUpdateQuery.timelines = req.body.timelines;
    pipDetailUpdateQuery.timelines = req.body.timelines;
    pipDetailUpdateQuery.finalReview = null;
    pipDetailUpdateQuery.finalRating = null;
  }
  async.waterfall(
    [
      done => {
        pipdetails.updateMany(updateCondition, pipDetailUpdateQuery, function (
          err,
          response
        ) {
          if (err) {

            return res.status(403).json({

              title: "There was a problem",
              error: {
                message: err
              },
              message: {
                message: result
              }
            });
          }
          done(err, response);
        });
      },
      (response1, done) => {
        pipMaster.findOneAndUpdate(
          { _id: master_id },
          pipMasterUpdateQuery,
          (err, result) => {
            //done(err, result);
            if (err) {

              return res.status(403).json({

                title: "There was a problem",
                error: {
                  message: err
                },
                message: {
                  message: result
                }
              });
            } else {
              return res.status(200).json({
                title: "Pip master updated",
                result: {
                  message: result
                }
              });
            }
          }
        );
      }
    ])
}
let functions = {
  getPipEmployee: (req, res) => {
    getEligiablePipEmployee(req, res);
  },
  initiatePipProcess: (req, res) => {
    InitiatePip(req, res);
  },
  getpipdetailsforsingalemployee: (req, res) => {
    getpipDetails(req, res);
  },
  postNewPip: (req, res) => {
    insertPip(req, res);
  },
  getpipdetails: (req, res) => {
    getpipdetailspostinsertion(req, res);
  },
  supervisorgetpip: (req, res) => {
    getpipBySupervisor(req, res);
  },
  submitpip: (req, res) => {
    submitpip(req, res);
  },
  pipByReviewer: (req, res) => {
    getpipByReviewer(req, res);
  },
  pipApproval: (req, res) => {
    getPipApproval(req, res);
  },
  getPipBatch: (req, res) => {
    getBatch(req, res);
  },
  updateBatch: (req, res) => {
    updatePipBatch(req, res);
  },
  updatepipdetails: (req, res) => {
    updatepipdetails(req, res);
  },
  getPipByHR: (req, res) => {
    getPipByHr(req, res);
  },
  updatePipMaster: (req, res) => {
    updatepipMaster(req, res);
  },
  updatePipMasterHr: (req, res) => {

    updatepipMasterHR(req, res);
  }
};

module.exports = functions;