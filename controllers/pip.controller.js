let pipbatch = require("../models/pip/pipbatch"),
  pipMaster = require("../models/pip/pipmaster"),
  pipdetails = require("../models/pip/pipdetails"),
  AuditTrail = require("../class/auditTrail"),
  EmployeeSupervisorDetails = require("../models/employee/employeeSupervisorDetails.model");
SendEmail = require('../class/sendEmail'),
  EmployeeDetails = require("../models/employee/employeeDetails.model");



function InitiatePip(req, res) {
  let createdby = parseInt(req.body.createdBy);
  let pipBatchDetails = new pipbatch();
  pipBatchDetails.batchName = req.body.batchName;
  pipBatchDetails.batchEndDate = new Date(
    new Date(req.body.batchEndDate).getTime());
  pipBatchDetails.status = req.body.status;
  pipBatchDetails.isDeleted = false;
  pipBatchDetails.createdby = createdby;
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
            emp_id: element,
            status: "Initiated",
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
      $project: {

        pip_batch_name: "pip_master_details.batchName",
        createdBy: "pip_master_details.createdBy",
        createdAt: "pip_master_details.createdAt",
        batchEndDate: "pip_master_details.batchEndDate",
        status: "$status",
        batchId: "pip_master_details._id"

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
        master_id: "pipdetails._id",
        status: "$status",
        supervisor_id: "$supervisor_id",
        areaofImprovement: "$areaofImprovement",
        actionPlan: "$actionPlan",
        finalReview: "$finalReview",
        finalRating: "$finalRating",
        timelines: "$timelines",
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
        supComment_month6: "$supComment_month6"
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
  let status = "Submitted";
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
  let updateCondition = { master_id: Pip_master_id};
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
        _id: "$pipMasterId",
        emp_details: { $first: "$emp_details" },
        learning_master_details: { $first: "$pip_master_details" }
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
        title: "Learning Data by Reviewer",
        result: {
          message: data
        }
      });
    }
  });

}


let functions = {
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