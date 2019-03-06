let pipbatch = require("../models/pip/pipbatch"),
  pipMaster = require("../models/pip/pipmaster"),
  pipdetails = require("../models/pip/pipdetails"),
  AuditTrail = require("../class/auditTrail"),
  EmployeeSupervisorDetails = require("../models/employee/employeeSupervisorDetails.model");
SendEmail = require('../class/sendEmail'),
  EmployeeDetails = require("../models/employee/employeeDetails.model");

function getEligiablePipEmployee(req, res) {

}
  
function InitiatePip(req, res) {
  let createdby = parseInt(req.body.createdBy);
  let timelines = parseInt(req.body.timelines);
  let pipBatchDetails = new pipbatch();
  pipBatchDetails.batchName = req.body.batchName;
  pipBatchDetails.timelines = req.body.timelines;
  pipBatchDetails.batchEndDate = new Date(
    new Date(req.body.batchEndDate).getTime());
  pipBatchDetails.status = req.body.status;
  pipBatchDetails.isDeleted = false;
  pipBatchDetails.createdBy = createdby;
  let emp_id_array = req.body.emp_id_array;
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
            createdBy: createdby
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

            return res.status(200).json({
              result: pipMasterResult
            });
          }
        });
      });
    }
  });
}


function getpipDetails(req, res) {
  let empId = parseInt(req.query.emp_id);
  pipMaster.aggregate([{
      $match: {
        emp_id: empId
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
        batchId: "$pip_master_details._id"

      }
    }
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
  pipDetails.master_id = master_id;
  pipDetails.supervisor_id = supervisor_id;
  pipDetails.status = req.body.status;
  pipDetails.isDeleted = req.body.isDeleted;
  pipDetails.createdBy = cretedBy;
  pipDetails.updatedBy = updatedBy;
  pipDetails.areaofImprovement = req.body.areaofImprovement;
  pipDetails.actionPlan = req.body.actionPlan;
  pipDetails.finalReview = req.body.finalReview;
  pipDetails.finalRating = req.body.finalRating;
  pipDetails.timelines = req.body.timelines;
  pipDetails.measureOfSuccess = req.body.measureOfSuccess;
  pipDetails.employeeInitialComment = req.body.employeeInitialComment;
  pipDetails.superviserInitialComment = req.body.superviserInitialComment;
  pipDetails.empComment_month1 = req.body.empComment_month1 === undefined ? null : req.body.empComment_month1;
  pipDetails.supComment_month1 = req.body.supComment_month1;
  pipDetails.empComment_month2 = req.body.empComment_month2;
  pipDetails.supComment_month2 = req.body.supComment_month2;
  pipDetails.empComment_month3 = req.body.empComment_month3;
  pipDetails.supComment_month3 = req.body.suspComment_month3;
  pipDetails.empComment_month4 = req.body.empComment_month4;
  pipDetails.supComment_month4 = req.body.supComment_month4;
  pipDetails.empComment_month5 = req.body.empComment_month5;
  pipDetails.supComment_month5 = req.body.supComment_month5;
  pipDetails.empComment_month6 = req.body.empComment_month6;
  pipDetails.supComment_month6 = req.body.supComment_month6;
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
      $project: {

        id: "$_id",
        createdby: "$createdBy",
        createdAt: "createdAt",
        updatedBy: "$updatedBy",
        updatedAt: "$updatedAt",
        master_id: "$pipdetails._id",
        master_timelines: "$pipdetails.timelines",
        status: "$status",
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
        dateDifference: {$divide: [{$subtract: [ new Date(), "$approvedAt" ]}, 3600000*24*2]}
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
        status: "$pip_master_details.status"
      }
    },
    { $match: { status: status } },
    {
      $group: {
        _id: "$pipMasterId",
        emp_details: { $first: "$emp_details" },
        pip_master_details: { $first: "$pip_master_details" }
      }
    }
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
          {_id: Pip_master_id },
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
        SendEmail.sendEmailToSupervisorToApproveMtr(email_details, (email_err, email_result) => {
          if (email_err) {
            return res.status(300).json({
              title: "Pip submitted, failed sending email to supervisor",
              error: {
                message: email_err
              },
              result: {
                message: result
              }
            });
          } else {
            return res.status(200).json({
              title: "pip review submitted, and email sent to supervisor",
              result: {
                message: result
              }
            });
          }
        });
      }
    }
  );
}
function getpipByReviewer(req, res){
  let reviewerId = parseInt(req.query.reviewerId);

  EmployeeSupervisorDetails.aggregate([
    {
      $match: {primarySupervisorEmp_id: reviewerId }
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
        status: "$pip_master_details.status"
      }
    },
    // { $match: { status: status } },
    {
      $group: {
        _id: "$pip_master_details._id",
        emp_details: { $first: "$emp_details" },
        pip_master_details: { $first: "$pip_master_details" }
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
  let email_details = {
    user_email: '',
    supervisor_name: req.body.supervisor_name,
    user_name: '',
    action_link: req.body.action_link,
    isApproved: req.body.isApproved ? "Approved" : "SendBack"
  };
  let isPipApproved = false;
  async.waterfall(
    [
      done => {
        let masterUpdateQuery = {
          updatedBy: supervisorId,
          updatedAt: new Date(),
          status: req.body.isApproved ? "Approved" : "SendBack"
        };
        pipdetails.find({ master_id: pipMasterId }, (err, res) => {
          if (err)
            done(err, null);
          let pendingPip = res.filter(pip => {
            return (!pip.status || pip.status == "Submitted");
          });
          if (pendingPip.length <= 1 && pendingPip[0]._id == pipDetailId) {
            isPipApproved = true;
            let sendbackPip = res.filter(pip => {
              return (pip.status == "SendBack");
            });
            if (sendbackPip && sendbackPip.length > 0) {
              masterUpdateQuery.status = "SendBack";
              isPipApproved = false;
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
        if(req.body.isApproved) {

          pipDetailUpdateQuery.approvedAt = new Date();
        }
        pipdetails.findOneAndUpdate({ _id: pipDetailId }, pipDetailUpdateQuery, (err, res) => {
          done(err, res);
        });
      },
      // (resp, done) => {
      //   if (req.body.isApproved != true) {
      //     let mtrDetailUpdateQuery = {
      //       updatedBy: parseInt(req.body.supervisorId),
      //       updatedAt: new Date(),
      //       status: "SendBack"
      //     };
      //     MidTermDetails.updateMany({ mtr_master_id: mtrMasterId }, mtrDetailUpdateQuery, (err, res) => {
      //       done(err, res);
      //     });
      //   } else {
      //     done(null, null);
      //   }
      // },
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
        if (isPipApproved === "Approved") {
          email_details.user_name = result.emp[0].user_name;
          email_details.user_email = result.emp[0].officeEmail;
          if (email_details.user_email) {
            SendEmail.sendEmailToUserAboutMtrStatus(email_details, (email_err, email_result) => {
              if (email_err) {
                return res.status(300).json({
                  title: "Pip review approved, failed sending email to employee",
                  error: {
                    message: "Pip review approved, failed sending email to employee"
                  },
                  result: {
                    message: result
                  }
                });
              } else {
                return res.status(200).json({
                  title: "Pip review approved, and email sent to employee",
                  result: {
                    message: result
                  }
                });
              }
            });
          } else {
            return res.status(300).json({
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
  pipbatch.aggregate([
    {
      $match: {
        createdBy: currentUserId
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
  //let supervisor_id = parseInt(req.body.supervisor_id);
  //let cretedBy = req.body.createdBy;
  let updateQuery = {
    "updatedAt": new Date(),
    "updatedBy": parseInt(req.body.updatedBy),
    "supComment_month1": req.body.supComment_month1,
    "supComment_month2": req.body.supComment_month2,
    "supComment_month3": req.body.supComment_month3,
    "supComment_month4": req.body.supComment_month4,
    "supComment_month5": req.body.supComment_month5,
    "supComment_month6": req.body.supComment_month6,
    //"timelines": parseInt(req.body.timelines),
    "finalRating": parseInt(req.body.supervisorPerformanceRating),
    "finalReview": req.body.superviserFinalReview
    
  };

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

function getPipByHr(req, res) {

  let hrId = parseInt(req.query.hrId);

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
        batch_name: "$batchName"
      }
    }
  ]).exec(function (err, data) {
    if(err) {
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
    "updatedAt": new Date(),
    "updatedBy": parseInt(req.body.updatedBy),
    "hr_final_com": req.body.hrFinalCom,
    "emp_final_com": req.body.empFinalCom,
    "rev_final_com": req.body.revFinalCom,
    "sup_final_com": req.body.supFinalCom
  }

  pipMaster.findOneAndUpdate({_id:master_id}, updateQuery, (err, result) => {

    if(err) {
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


  supervisorgetpip:(req, res) => {
  
    getpipBySupervisor(req, res);
 
  },

  submitpip:(req, res) => {
  
    submitpip(req, res);
  },

  pipByReviewer:(req, res) => {
  
    getpipByReviewer(req, res);
  },

  pipApproval:(req, res) => {

    getPipApproval(req, res);
  },

  getPipBatch:(req, res) => {

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
  }
  // getLearningForSuperviser: (req, res) => {
  //   getLearningBySupervisor(req, res);                  
  // },

  // submitLearning: (req, res) => {
  //   submitEmployeeLearning(req, res);
  // },

  // learningByReviewer: (req, res) => {
  //   getLearningByReviewer(req, res);
  // },

  // learningApproval: (req, res) => {
  //   getLearningApproval(req, res);
  // },

  // updateBatch: (req, res) => {
  //   updateBatch(req, res);
  // },

  // getLearningBatch: (req, res) => {
  //   getLearningBatch(req, res);
  // }

};

module.exports = functions;