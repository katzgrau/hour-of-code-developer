var express = require('express');
var webrequest = require('request');
var app = express();
var gmail = require('gmail-send');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var atob = require('atob');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var users = [];
var submissions = {};

app.get('/', function(request, response) {
  var userId = request.cookies.userId;
  if (!userId) {
    users.push(users.length + 1);
    userId = users[users.length - 1];
    response.cookie('userId', userId, { maxAge: 900000, httpOnly: true });
  }
  response.locals.userId = userId;
  response.render('pages/index');
});

app.get('/proxy', function (request, response) {
  if (request.query.url) {
    webrequest(request.query.url, function (error, res, body) {
      if (!error && response.statusCode == 200) {
        response.json({data: body});
      } else {
        response.status(400).json({error: error});
      }
    })
  } else {
    response.status(400).json({error: 'A url must be supplied'});
  }
});

app.get('/email', function (request, response) {
  gmail ({
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
    to: request.query.to,
    subject: request.query.subject,
    text: request.query.message
  })();
  response.json({message: 'email sent'});
});

app.post('/submissions', function (request, response) {
  if (request.body.code) {
    var userId = request.cookies.userId;
    var date = new Date();
    var timestamp = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    submissions[userId] = {
      time: timestamp,
      code:  request.body.code
    };
    response.json({message: 'code accepted'});
  } else {
    response.status(400).json({error: 'Code must be supplied'});
  }
});

app.get('/submissions', function (request, response) {
    response.json({submissions: submissions});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


