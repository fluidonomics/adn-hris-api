let LearningBatch = require("../models/learning/learningbatch"),
LearningMaster = require("../models/learning/learningmaster"),
LearningDetails = require("../models/learning/learningdetails");


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
        createdDate: "$learning_master_details.createdAt",
        batchEndDate: "$learning_master_details.batchEndDate",
        status: "$status"

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
        supportRequired: "$supportRequired"

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

  let supervisor_id = parseInt(req.query.supervisor_id);

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
    }
};

module.exports = functions;