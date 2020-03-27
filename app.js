var express = require('express');
var path = require('path');
require('dotenv').config();
const PORT = process.env.PORT || 3000

var flash = require('connect-flash');

var passport = require("passport");
var request = require('request');

var session = require("express-session");

var app = express();

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));


app.use(passport.initialize());
app.use(passport.session());

var bodyParser = require('body-parser')

var path = require('path');

app.use('/public', express.static(__dirname + '/public'));

app.use(flash());
app.use(session({secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}))
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.set('view engine', 'pug');
app.set('view options', { layout: false });


require('./routes/routes.js')(app);




// function listen(port) {
//     app.portNumber = port;
//     app.listen(port, () => {
//         console.log("server is running on port :" + app.portNumber);
//     }).on('error', function (err) {
//         if(err.errno === 'EADDRINUSE') {
//             console.log(`----- Port ${port} is busy, trying with port ${port + 1} -----`);
//             listen(port + 1)
//         } else {
//             console.log(err);
//         }
//     });
// }

// listen(PORT);

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}.`)
  })


module.exports = app;