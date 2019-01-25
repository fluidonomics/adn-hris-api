let LearningBatch = require("../models/learning/learningbatch"),
LearningMaster = require("../models/learning/learningmaster"),
LearningDetails = require("../models/learning/learningdetails"),
EmployeeSupervisorDetails = require("../models/employee/employeeSupervisorDetails.model");


function InitiateLearning(req, res) {
    let createdBy = parseInt(req.body.createdBy);
    let LearningBatchDetails = new LearningBatch();
    LearningBatchDetails.batchName = req.body.batchName;
    LearningBatchDetails.batchEndDate = new Date(
      new Date(req.body.batchEndDate).getTime()
    );
    LearningBatchDetails.status = req.body.status;
    LearningBatchDetails.isDeleted = false;
    LearningBatchDetails.createdBy = createdBy;
    let emp_id_array = req.body.emp_id_array;
    LearningBatchDetails.transac;
    LearningBatchDetails.save(function (err, learningbatchresp) {
      if (err) {
        return res.status(403).json({
          title: "There was a problem",
          error: {
            message: err
          },
          result: {
            message: learningbatchresp
          }
        });
      } else {
        AuditTrail.auditTrailEntry(
          0,
          "LearningBatchDetails",
          learningbatchresp,
          "user",
          "LearningBatchDetails",
          "ADDED"
        );
        let batch_id = learningbatchresp.id;
        Promise.all([
            LearningMaster.aggregate([
            {
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
          let learningMaster_id =
            counts[0][0] === undefined ? 0 : counts[0][0]._id;
          emp_id_array.forEach(function (element, index) {
            insertData.push({
              batch_id: batch_id,
              emp_id: element.emp_id,
              status: "Initiated",
              _id: learningMaster_id + (index + 1),
              createdBy: createdBy
            });
          });
          LearningMaster.insertMany(insertData, function (
            err,
            learningMasterResult
          ) {
            if (err) {
              return res.status(403).json({
                title: "There was a problem",
                error: {
                  message: err
                },
                result: {
                  message: learningMasterResult
                }
              });
            } else {
              AuditTrail.auditTrailEntry(
                0,
                "LearningMaster",
                insertData,
                "user",
                "LearningMaster",
                "ADDED"
              );

              return res.status(200).json({ result: learningMasterResult });
            }
          });
        });
      }
    });
}

function GetLearningSingleEmployee(req, res) {

  let emp_id = parseInt(req.query.emp_id);
  LearningMaster.aggregate([
    {
      $match: {
        emp_id: emp_id
      }
    },
    {
      $lookup: {
        from: "learningbatches",
        localField: "batch_id",
        foreignField: "_id",
        as: "learning_master_details"
      }
      
    },
    {
      $unwind: {
        path: "$learning_master_details"
      }
    },
    {
      $project: {

        learning_batch_name: "$learning_master_details.batchName",
        createdby: "$learning_master_details.createdBy",
        createdAt: "$learning_master_details.createdAt",
        batchEndDate: "$learning_master_details.batchEndDate",
        status: "$status",
        batchName: "$learning_master_details._id"

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
        title: "learning master details",
        result: {
          message: data
        }
      });
    }
  });
}

function InsertLearning(req, res) {

  let learningDetails = new LearningDetails();
  learningDetails.master_id = parseInt(req.body.master_id);
  learningDetails.supervisor_id = parseInt(req.body.supervisor_id);
  learningDetails.status = req.body.status;
  learningDetails.measureOfSuccess = req.body.measureOfSuccess;
  learningDetails.isDeleted = req.body.isDeleted;
  learningDetails.createdBy = parseInt(req.body.createdBy);
  learningDetails.updatedBy = parseInt(req.body.updatedBy);
  learningDetails.progressStatus = req.body.progressStatus;
  learningDetails.developmentArea = req.body.developmentArea;
  learningDetails.developmentPlan = req.body.developmentPlan;
  learningDetails.timelines = req.body.timelines;
  learningDetails.supportRequired = req.body.supportRequired;
  learningDetails.supervisorComment = req.body.supervisorComment;

  learningDetails.save(function (err, response) {
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
        "LearningDetails",
        response,
        "user",
        "LearningDetails",
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

function GetLearningDetailsEmployee(req, res) {

  let master_id = parseInt(req.query.master_id);
  LearningDetails.aggregate([
    {
      $match: {
        master_id: master_id
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "master_id",
        foreignField: "_id",
        as: "learning_details"
      }
    },
    {
      $unwind: {
        path: "$learning_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "supervisor_id",
        foreignField: "_id",
        as: "emp_supervisor_details"
      }
    },
    {
      $unwind: {
        path: "$emp_supervisor_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {

        id: "$_id",
        createdby: "$createdBy",
        createdAt: "createdAt",
        updatedBy: "$updatedBy",
        updatedAt: "$updatedAt",
        masterId: "learning_details._id",
        status: "$status",
        progressStatus: "$progressStatus",
        supervisorId: "$supervisor_id",
        developmentArea: "$developmentArea",
        developmentPlan: "$developmentPlan",
        timelines: "$timelines",
        supportRequired: "$supportRequired",
        superviserComment: "$superviserComment",
        measureOfSuccess: "$measureOfSuccess",
        employeeComment: "$employeeComment",
        supervisor_full_name: "$emp_supervisor_details.fullName"

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
        title: "learning details",
        result: {
          message: data
        }
      });
    }
  });
}

function getLearningBySupervisor(req, res) {

  let supervisor_id = parseInt(req.query.supervisorId);
  let status = req.query.status;
  LearningDetails.aggregate([
    {
      $match: {
        supervisor_id: supervisor_id
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "master_id",
        foreignField: "_id",
        as: "learning_master_details"
      }
    },
    {
      $unwind: {
        path: "$learning_master_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "learning_master_details.emp_id",
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
        learningMasterId: "$master_id",
        emp_details: "$emp_details",
        learning_master_details: "$learning_master_details",
        status: "$learning_master_details.status"
      }
    },
    { $match: { status: status } },
    {
      $group: {
        _id: "$learningMasterId",
        emp_details: { $first: "$emp_details" },
        learning_master_details: { $first: "$learning_master_details" }
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
        title: "Learning master data",
        result: {
          message: data
        }
      });
    }
  });

}

function submitEmployeeLearning(req, res) {

  let learning_master_id = parseInt(req.body.masterId);
  let emp_id = parseInt(req.body.empId);
  let supervisor_id = parseInt(req.body.supervisor_id);
  let email_details = {
    supervisor_email: '',
    supervisor_name: '',
    user_name: req.body.emp_name,
    action_link: req.body.action_link
  };
  let updateCondition = { master_id: learning_master_id };
  let updateQuery = {
    status: "Submitted",
    updatedBy: emp_id,
    updatedAt: new Date()
  };

  async.waterfall(
    [
      done => {
        LearningDetails.updateMany(updateCondition, updateQuery, function (
          err,
          response
        ) {
          done(err, response);
        });
      },
      (response1, done) => {
        LearningMaster.findOneAndUpdate(
          { _id: learning_master_id },
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
            let finalData = { learningmaster: response2, emp: doc }
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
              title: "Learning submitted, failed sending email to supervisor",
              error: {
                message: email_err
              },
              result: {
                message: result
              }
            });
          } else {
            return res.status(200).json({
              title: "Learning submitted, and email sent to supervisor",
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

function getLearningByReviewer(req, res) {

  let reviewerId = parseInt(req.query.reviewerId);

  EmployeeSupervisorDetails.aggregate([
    {
      $match: { primarySupervisorEmp_id: reviewerId }
    },
    {
      $lookup: {
        from: "learningdetails",
        localField: "emp_id",
        foreignField: "supervisor_id",
        as: "learning_details"
      }
    },
    {
      $unwind: {
        path: "$learning_details"
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "learning_details.master_id",
        foreignField: "_id",
        as: "learning_master_details"
      }
    },
    {
      $unwind: {
        path: "$learning_master_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "learning_master_details.emp_id",
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
        learningMasterId: "$master_id",
        emp_details: "$emp_details",
        learning_master_details: "$learning_master_details",
        status: "$learning_master_details.status"
      }
    },
    // { $match: { status: status } },
    {
      $group: {
        _id: "$learningMasterId",
        emp_details: { $first: "$emp_details" },
        learning_master_details: { $first: "$learning_master_details" }
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

function getLearningApproval(req, res) {

  let learningMasterId = parseInt(req.body.learningMasterId);
  let learningDetailId = parseInt(req.body.learningDetailId);
  let empId = parseInt(req.body.empId);
  let supervisorId = parseInt(req.body.supervisorId);
  let email_details = {
    user_email: '',
    supervisor_name: req.body.supervisor_name,
    user_name: '',
    action_link: req.body.action_link,
    isApproved: req.body.isApproved ? "Approved" : "SendBack"
  };
  let isLearningApproved = false;
  async.waterfall(
    [
      done => {
        let masterUpdateQuery = {
          updatedBy: supervisorId,
          updatedAt: new Date(),
          status: req.body.isApproved ? "Approved" : "SendBack"
        };
        LearningDetails.find({ master_id: learningMasterId }, (err, res) => {
          if (err)
            done(err, null);
          let pendingLearning = res.filter(learning => {
            return (!learning.status || learning.status == "Submitted");
          });
          if (pendingLearning.length <= 1 && pendingLearning[0]._id == learningDetailId) {
            isLearningApproved = true;
            let sendbackLearning = res.filter(learning => {
              return (learning.status == "SendBack");
            });
            if (sendbackLearning && sendbackLearning.length > 0) {
              masterUpdateQuery.status = "SendBack";
              isLearningApproved = false;
            }
            LearningMaster.findByIdAndUpdate({ _id: learningMasterId }, masterUpdateQuery, (err, res) => {
              done(err, res);
            });
          } else {
            done(null, null);
          }
        });
      },
      (learningMasterResponse, done) => {
        let learningDetailUpdateQuery = {
          supervisorComment: req.body.supervisorComment,
          updatedBy: parseInt(req.body.supervisorId),
          updatedAt: new Date(),
          status: req.body.isApproved ? "Approved" : "SendBack"
        };
        if (req.body.isApproved && req.body.progressStatus == "Dropped") {
          learningDetailUpdateQuery.status = "Dropped";
        }
        LearningDetails.findOneAndUpdate({ _id: learningDetailId }, learningDetailUpdateQuery, (err, res) => {
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
            let finalData = { learningmaster: response2, emp: doc }
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
        if (isLearningApproved === "Approved") {
          email_details.user_name = result.emp[0].user_name;
          email_details.user_email = result.emp[0].officeEmail;
          if (email_details.user_email) {
            SendEmail.sendEmailToUserAboutMtrStatus(email_details, (email_err, email_result) => {
              if (email_err) {
                return res.status(300).json({
                  title: "Learning review approved, failed sending email to employee",
                  error: {
                    message: "Learning review approved, failed sending email to employee"
                  },
                  result: {
                    message: result
                  }
                });
              } else {
                return res.status(200).json({
                  title: "Learning review approved, and email sent to employee",
                  result: {
                    message: result
                  }
                });
              }
            });
          } else {
            return res.status(300).json({
              title: "Learning review approved, failed sending email to employee",
              error: {
                message: "Learning review approved, failed sending email to employee"
              },
              result: {
                message: result
              }
            });
          }
        } else {
          return res.status(200).json({
            title: "Learning review submitted",
            result: {
              message: result
            }
          });
        }
      }
    }
  );
}

function updateBatch(req, res) {

  let batchId = parseInt(req.body.batchId);

  let updateQuery = {
    "updatedAt": new Date(),
    "updatedBy": parseInt(req.body.updatedBy),
    "batchEndDate": req.body.batchEndDate
  };

  LearningBatch.findOneAndUpdate({ _id: batchId }, updateQuery, (err, result) => {
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
        "LearningBatch",
        result,
        "learning",
        "updateBatch",
        "UPDATED"
      );
      return res.status(200).json({
        title: "Learning batch updated",
        result: {
          message: result
        }
      });
    }
  });
}

function getLearningBatch(req, res) {

  let currentUserId = parseInt(req.query.empId);
  LearningBatch.aggregate([
    {
      $match: {
        createdBy: currentUserId
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "_id",
        foreignField: "batch_id",
        as: "learning_master"
      }
    },
    {
      $unwind: {
        path: "$learning_master",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "learning_master.emp_id",
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
        learning_master: {
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
          batch_id: 1,
          emp_id: 1,
          isDeleted: 1,
          createdBy: 1,
          updatedBy: 1,
          status: 1,
          emp_details: "$emp_details"
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
        learning_master: { $push: "$learning_master" }
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
        title: "Learning master data",
        result: {
          message: data
        }
      });
    }
  });
}

let functions = {
    initiateLearningProcess: (req, res) => {
    InitiateLearning(req, res);
    },

    getLearningForSingleEmployee: (req, res) => {
      GetLearningSingleEmployee(req, res);
    },

    postNewLearning: (req, res) => {
      InsertLearning(req, res);
    },

    getLearningDetailsSingleEmployee: (req, res) => {
      GetLearningDetailsEmployee(req, res);
    },

    getLearningForSuperviser: (req, res) => {
      getLearningBySupervisor(req, res);                  
    },

    submitLearning: (req, res) => {
      submitEmployeeLearning(req, res);
    },

    learningByReviewer: (req, res) => {
      getLearningByReviewer(req, res);
    },

    learningApproval: (req, res) => {
      getLearningApproval(req, res);
    },

    updateBatch: (req, res) => {
      updateBatch(req, res);
    },

    getLearningBatch: (req, res) => {
      getLearningBatch(req, res);
    }

};

module.exports = functions;