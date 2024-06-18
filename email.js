var nodemailer = require('nodemailer');
let code = "" 

function sendVerificationMail(mail){
  return new Promise((resolve) =>{

    let uuid = crypto.randomUUID();
    uuid = uuid.split("-");
    code = uuid[0];
  
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'noreply.wolfgame@gmail.com',
          pass: 'bgme glno wwqp syzp'
        }
      });
      
      var mailOptions = {
        from: 'noreply.wolfgame@gmail.com',
        to: mail,
        subject: 'Verify email',
        text: `Your code to log in to the wolf game : ${uuid[0]} \nIf you are not trying to log in just ignore this mail, It's safe :)`
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      resolve(code)
  })
    
}

function verifyCode(cod){
    if(cod == code){
        return true;
    }else{
        return false;
    }
    
}

module.exports = {sendVerificationMail, verifyCode}