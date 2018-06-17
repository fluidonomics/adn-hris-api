let express       = require('express'),
    Notify        = require('../models/common/notification.model');
    io = require('socket.io');

  function fnSendNotifications(notificationFlag,emp, title, message, senderEmp_id, recipientEmp_id, type_id, linkUrl,createdBy)
  {
    let notification = new Notify();
    notification.emp_id = emp._id;
    notification.title = title;
    notification.message = message;
    notification.linkUrl = linkUrl;
    notification.senderEmp_id = 1;
    notification.recipientEmp_id = recipientEmp_id;
    notification.type_id = type_id;
    notification.createdBy = createdBy;
    notification.save(function(err, result) {
        if (result) {
            //Send Bussiness Hr Head
            if (notificationFlag == 0) {
                sendNotifications(notificationFlag++,emp, title, message, senderEmp_id, emp.businessHrHead_id, type_id, linkUrl);
            } else if (notificationFlag == 1) {
                sendNotifications(notificationFlag++,emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
            } else if (notificationFlag == 2) {
                sendNotifications(notificationFlag++,emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
            } else {
                return res.status(200).json({
                    message: "Success"
                });
            }
        } else {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        }
    });
  }

  var userList={};

  let functions = {
  initialize: (server) =>
  {
    io = io.listen(server);
    io.on("connection", function(socket){
        socket.on('userData', function(data) {
            if(userList.hasOwnProperty(data))
            {
              userList[data].push(socket.id);
            }
            else{
                userList[data]=[socket.id];
            }
           //socket.emit('getData', 'Return form server');
        });
       
        socket.on('disconnect', () => {
            for (var user in userList) {
                if (userList[user].indexOf(socket.id)!==-1) {
                    userList[user].splice(userList[user].indexOf(socket.id),1);
                    if(userList[user].length==0)
                    {
                        delete userList[user];
                    }
                    break;
                }
            }
            //   for(let i=0; i < userList.length; i++){
            //     if(userList[i].indexOf(socket.id)!==-1){
            //       userList[i].splice(userList[i].indexOf(socket.id), 1,1); 
            //     }
            //   }
        });

        socket.on('setReadStatus',(data) => {
            Notify.updateMany({recipientEmp_id:data._id,createdAt:{$lte: data.currentDate}},{$set:{isRead:true,isReadDateTime:new Date()}}, { multi: true }, function(err, res) {
                if (err) { 
                } 
                else{
                  socket.emit('setReadStatusChanged',true);
                }
             });
        });

        socket.on('getNotificationByUserId',function(_id){
            Notify.find({recipientEmp_id:_id}).
            sort({ createdAt: -1 }).limit(10).exec(function(err,notifyData)
            {
                Promise.all([
                    Notify.find({recipientEmp_id:_id ,isRead:false}).count().exec()
                 ]).then(function(counts) {
                 socket.emit("sendBackNotificationByUserId",{'unReadCount':counts[0],'notifications':notifyData});
                });
                //    socket.emit("sendBackNotificationByUserId",notifyData);
                //    io.to(userList[4]).emit('pushNotification',1);
                //io.to(userList[4]).emit('pushNotification',1);
            });

        });





      });
  },

//   getNotificaton:(id)=>
//   {
//     io.sockets.in(userList[0]).emit("getNoticition","send notification");
//     io.sockets.in(userList[1]).emit("getNoticition","send notification");
//     // io.emit('sendBack',"send notification");
//     // Notify.find({recipientEmp_id:id})
//     // limit(10).
//     // sort({ createdAt: -1 }).exec();
//     // io.emit('getData', 'Return form server');
//   },

  sendNotifications:(emp_id, title, message, senderEmp_id, recipientEmp_id, type_id, linkUrl,createdBy)=>
  {
    //fnSendNotifications(0, emp, title, message, senderEmp_id, recipientEmp_id, type_id, linkUrl,createdBy)
    let notification = new Notify();
    notification.emp_id = emp_id;
    notification.title = title;
    notification.message = message;
    notification.linkUrl = linkUrl;
    notification.senderEmp_id = 1;
    notification.recipientEmp_id = recipientEmp_id;
    notification.type_id = type_id;
    notification.createdBy = createdBy;
    notification.save(function(err,retunData){
      if(err)
      {
      }
     // io.to(userList[4]).emit('pushNotification',1);
    });

    
  }
};

// initialize = function(server) {
// io = io.listen(server);
// io.sockets.on("connection", function(socket){
//   socket.on('initData', function(data) {
//     socket.emit('getData', ' Return form server');
//   }); 
// });
// }

// let functions={

// }

 module.exports = functions;