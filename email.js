var nodemailer = require('nodemailer');
var crypto = require('crypto'); // Asegúrate de requerir el módulo 'crypto'
let code = "";

function sendVerificationMail(mail, url) {
  return new Promise((resolve) => {

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
      html: `
        <html>
          <body>
            <p>Your code to log in to the wolf game: <b>${uuid[0]}</b></p>
            <p><a href="http://${url}/pages/copy.html?code=${uuid[0]}&mail=${mail}&name=">Go to Verify</a></p>
            <p>If you are not trying to log in just ignore this mail, It's safe :)</p>
          </body>
        </html>
      `
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    resolve(code);
  });

}

function sendVerificationMailRegisteredUser(mail, name, url) {
  return new Promise((resolve) => {

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
      html: `
        <html>
          <body>
            <p>Your code to log in to the wolf game: <b>${uuid[0]}</b></p>
            <p><a href="http://${url}/pages/copy.html?code=${uuid[0]}&mail=${mail}&name=${name}">Go to Verify</a></p>
            <p>If you are not trying to log in just ignore this mail, It's safe :)</p>
          </body>
        </html>
      `
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    resolve(code);
  });

}

function verifyCode(cod) {
  if (cod == code) {
    return true;
  } else {
    return false;
  }
}

module.exports = { sendVerificationMail, sendVerificationMailRegisteredUser, verifyCode };
