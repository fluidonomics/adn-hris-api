let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    Notification      = require('../models/common/notification.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    KraInfo           = require('../models/kra/kraDetails.model'),
    KraWorkFlowInfo   = require('../models/kra/kraWorkFlowDetails.model'),
    KraWeightageInfo   = require('../models/kra/kraWeightage.model'),
    KraCategoryInfo   = require('../models/kra/kraCategory.model'),
    config            = require('../config/config'),
    crypto            = require('crypto'),
    async             = require('async'),
    nodemailer        = require('nodemailer'),
    hbs               = require('nodemailer-express-handlebars'),
    sgTransport       = require('nodemailer-sendgrid-transport'),
    uuidV1            = require('uuid/v1');

    BatchCtrl= require('./batch.controller'),
    TimeLineCtrl= require('./timeline.controller'),

    require('dotenv').load()


    function auditTrailEntry(emp_id, collectionName, collectionDocument, controllerName, action, comments) {
      let auditTrail = new AuditTrail();
      auditTrail.emp_id = emp_id;
      auditTrail.collectionName = collectionName;
      auditTrail.document_id = collectionDocument._id;
      auditTrail.document_values = JSON.stringify(collectionDocument);
      auditTrail.controllerName = controllerName;
      auditTrail.action = action;
      auditTrail.comments = comments;
      auditTrail.save();
  }
  

function addKraWorkFlowInfoDetails(req, res, done) {
    let kraWorkFlowDetails = new KraWorkFlowInfo(req.body);
    kraWorkFlowDetails.emp_id = req.body.emp_id || req.query.emp_id;
    kraWorkFlowDetails.timeline_id=1;
    kraWorkFlowDetails.batch_id=1;
    kraWorkFlowDetails.createdBy = 1;

    kraWorkFlowDetails.save(function(err, kraWorkFlowInfoData) {
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
        auditTrailEntry(kraWorkFlowDetails.emp_id, "kraWorkFlowDetails", kraWorkFlowDetails, "user", "kraWorkFlowDetails", "ADDED");
        return done(err, kraWorkFlowInfoData);   
    });
}

function addBulkKraInfoDetails(req, res, done) {
    let arr_emp_id=req.body.emp_id;
    var insertData=[];
    Promise.all([
        KraWorkFlowInfo.find({}).count().exec(),   
      ]).then(function(counts) {
        arr_emp_id.forEach(function (element, index) {
            insertData.push({batch_id:req.body.batch_id,emp_id:element,status:'Initiated',_id:counts[0]+(index + 1),createdBy:parseInt(req.headers.uid)});
        });
        KraWorkFlowInfo.insertMany(insertData,function(err,results)
        {
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
            auditTrailEntry(0, "kraWorkFlowDetails", insertData, "user", "kraWorkFlowDetails", "ADDED");
            return res.status(200).json(true);
        })
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
    var kraWorkflowProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    KraWorkFlowInfo.findOne(query, kraWorkflowProjection, function(err, kraWorkflowInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(kraWorkflowInfoData);
    });
  }





function getEmployeeKraWorkFlowInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    // let query = {
    //     isDeleted: false
    // };
    // if (emp_id) {
    //     query = {
    //         emp_id: emp_id,
    //         isDeleted: false
    //     };
    // }
    // var kraWorkflowProjection = {
    //     createdAt: false,
    //     updatedAt: false,
    //     isDeleted: false,
    //     updatedBy: false,
    //     createdBy: false,
    // };

    // KraWorkFlowInfo.findOne(query, kraWorkflowProjection, function(err, employeeKraWorkFlowInfoData) {
    //     if (err) {
    //         return res.status(403).json({
    //             title: 'There was an error, please try again later',
    //             error: err
    //         });
    //     }
    //     return res.status(200).json(employeeKraWorkFlowInfoData);
    // });

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
        { "$match": { "emp_id":parseInt(emp_id),"isDeleted":false,"employeedetails.isDeleted":false,"batchdetails.isDeleted":false} },
        {"$project":{
            "_id":"$_id",
            "status":"$status",
            "createdAt":"$createdAt",
            "updatedAt":"$updatedAt",
            "createdBy":"$employeedetails.fullName",
            "endDate":"$batchdetails.endDate"
        }}
      ]).exec(function(err, kraEmployeeWorkflowInfoData){
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
    kraWeightageDetails.timeline_id=1;
    kraWeightageDetails.batch_id=1;
    kraWeightageDetails.createdBy = 1;

    kraWeightageDetails.save(function(err, kraWeightageInfoData) {
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
        auditTrailEntry(kraWeightageDetails.emp_id, "kraWeightageDetails", kraWeightageDetails, "user", "kraWeightageDetails", "ADDED");
        return done(err, kraWeightageInfoData);   
    });
}

function getKraWeightageInfoDetails(req, res) {
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
    var kraWeightageProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    KraWeightageInfo.find(query, kraWeightageProjection, function(err, kraWeightageInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(kraWeightageInfoData);
    });
  }


  
  function addKraCategoryInfoDetails(req, res, done) {
    let kraCategoryDetails = new KraCategoryInfo(req.body);
    kraCategoryDetails.emp_id = req.body.emp_id || req.query.emp_id;
    kraCategoryDetails.timeline_id=1;
    kraCategoryDetails.batch_id=1;
    kraCategoryDetails.createdBy = 1;

    kraCategoryDetails.save(function(err, kraCategoryInfoData) {
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
        auditTrailEntry(kraCategoryDetails.emp_id, "kraCategoryDetails", kraCategoryDetails, "user", "kraCategoryDetails", "ADDED");
        return done(err, kraCategoryInfoData);   
    });
}

function getKraCategoryInfoDetails(req, res) {
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
    var kraCategoryProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    KraCategoryInfo.find(query, kraCategoryProjection, function(err, kraCategoryInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(kraCategoryInfoData);
    });
  }



function addKraInfoDetails(i,req, res, done) {
    let kraDetails = new KraInfo(req.body[i]);
    kraDetails.save(function(err, krasData) {
        auditTrailEntry(kraDetails.emp_id, "kraDetails", kraDetails, "user", "kraDetails", "ADDED");
        if ((i + 1) < req.body.length) {
            addKraInfoDetails(i + 1, req, res, done);
        }
        else{
            return done(null,true)   
        }
    });
}

function getKraInfoDetailsData(req, res) {
    let emp_id=req.query.emp_id;
    KraWorkFlowInfo.aggregate([
        {
            "$lookup": {
                "from": "kradetails",
                "localField": "_id",
                "foreignField": "kraWorkflow_id",
                "as": "kradetails"
            }
        },
        {"$match": {"isDeleted":false,"emp_id":parseInt(emp_id)} },
        {"$project":{
            "_id":"$_id",
            "batch_id":"$batch_id",
            "timeline_id":"$timeline_id",
            "emp_id":"$emp_id",
            "status":"$status",
            "kraDetails":"$kradetails"
            }}
        ]).exec(function(err, results){
        if(err)
        {
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
        return res.status(200).json({"data":results});
     });
}

function getKraInfoDetails(req, res) {
  let kraworkflow_id = req.query.kraworkflow_id;
  let query = {
      isDeleted: false
  };
  if (kraworkflow_id) {
      query = {
        kraWorkflow_id: kraworkflow_id,
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
  KraInfo.find(query, kraProjection, function(err, kraInfoData) {
      if (err) {
          return res.status(403).json({
              title: 'There was an error, please try again later',
              error: err
          });
      }
      return res.status(200).json({
          'data': kraInfoData
      });
  });
}

let functions = {
    addKraWorkFlowInfo:(req,res )=> {
        async.waterfall([
          function(done) {
            addKraWorkFlowInfoDetails(req,res,done);
          },
          function(kraWorkFlowInfoData,done) {
            return res.status(200).json(kraWorkFlowInfoData);
          }
        ]);
    },

    getKraWorkFlowInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getKraWorkFlowInfoDetails(req, res, done);
            },
            function(kraWorkflowDetailsData, done) {
                return res.status(200).json({
                    "data": kraWorkflowDetailsData
                });
            }
        ]);
    },


    getEmployeeKraWorkFlowInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getEmployeeKraWorkFlowInfoDetails(req, res, done);
            },
            function(employeeKraWorkFlowDetailsData, done) {
                return res.status(200).json({
                    "data": employeeKraWorkFlowDetailsData
                });
            }
        ]);
    },


    addKraWeightageInfo:(req,res )=> {
        async.waterfall([
          function(done) {
            addKraWeightageInfoDetails(req,res,done);
          },
          function(kraWeightageInfoData,done) {
            return res.status(200).json(kraWeightageInfoData);
          }
        ]);
    },


    
    getKraWeightageInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getKraWeightageInfoDetails(req, res, done);
            },
            function(kraWeightageDetailsData, done) {
                return res.status(200).json({
                    "data": kraWeightageDetailsData
                });
            }
        ]);
    },

    
    addKraCategoryInfo:(req,res )=> {
        async.waterfall([
          function(done) {
            addKraCategoryInfoDetails(req,res,done);
          },
          function(kraCategoryInfoData,done) {
            return res.status(200).json(kraCategoryInfoData);
          }
        ]);
    },


    getKraCategoryInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getKraCategoryInfoDetails(req, res, done);
            },
            function(kraCategoryDetailsData, done) {
                return res.status(200).json({
                    "data": kraCategoryDetailsData
                });
            }
        ]);
    },


    addKraInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          addKraInfoDetails(0,req,res,done);
        },
        function(kraInfoData,done) {
          return res.status(200).json(kraInfoData);
        }
      ]);
    },
    updateKraInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          updateKraInfoDetails(req,res,done);
        },
        function(kraInfoData,done) {
          return res.status(200).json(kraInfoData);
        }
      ]);
    },
    getKraInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getKraInfoDetails(req, res, done);
            },
            function(kraDetailsData, done) {
                return res.status(200).json({
                    "data": kraDetailsData
                });
            }
        ]);
    },


    getKraDetailsData: (req, res) => {
        async.waterfall([
            function(done) {
                getKraInfoDetailsData(req, res, done);
            },
            function(kraDetailsData, done) {
                return res.status(200).json({
                    "data": kraDetailsData
                });
            }
        ]);
    },

    addBulkKra:(req,res )=> {
        async.waterfall([
          function(done) {
            BatchCtrl.addBatchInfoDetails(req,res,done)
          },
          function(batchData,done) {
             req.body.batch_id=batchData._id;
             addBulkKraInfoDetails(req,res,done);
          }
        ]);
    }

}
module.exports = functions;