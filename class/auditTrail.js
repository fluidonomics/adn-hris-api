let express       = require('express'),
AuditTrail        = require('../models/common/auditTrail.model')

let functions =
{
    auditTrailEntry: (emp_id, collectionName,collectionDocument,controllerName,action,comments) => {
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
}

module.exports = functions;