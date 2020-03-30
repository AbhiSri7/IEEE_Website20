var util = require('util');
var express = require('express');
var app = express();
var path = require('path');
var passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const connectionString = process.env.DATABASE_URL;

var fs = require('fs');
var request = require('request');
const { Pool, Client } = require('pg')
const bcrypt= require('bcrypt')
const uuidv4 = require('uuid/v4');
//TODO
//Add forgot password functionality
//Add email confirmation functionality
//Add edit account page

var v = 0;

app.use(express.static('public'));

var currentAccountsData = [];

const config = {
	database: 'abhi',
	host: 'localhost',
	// this object will be passed to the TLSSocket constructor
	ssl: {
	  rejectUnauthorized: false,
	  ca: fs.readFileSync('bin/cert.csr').toString(),
	  key: fs.readFileSync('bin/private.key').toString(),
	  cert: fs.readFileSync('bin/certificate.pem').toString(),
	},
  }

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	ssl: false
});

module.exports = function (app) {
	
	app.get('/', function (req, res, next) {
		res.render('index', {title: "Home", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		
		console.log(req.user);
	});

	
	app.get('/join', function (req, res, next) {
		res.render('join', {title: "Join", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});
	
	
	app.post('/join', async function (req, res) {
		
		try{
			const client = await pool.connect()
			await client.query('BEGIN')
			var pwd = await bcrypt.hash(req.body.password, 5);
			await JSON.stringify(client.query('SELECT id FROM ieeesbm WHERE email=$1', [req.body.email], function(err, result) {
				if(result.rows[0]){
					req.flash('warning', "This email address is already registered. Please Log In");
					res.redirect('/login');
				}
				else{
					JSON.stringify(client.query('SELECT id from ieeesbm WHERE contact_no=$1', [req.body.contact_no], function(err, result) {
						if(result.rows[0]){
							req.flash('warning', "This Contact Number is already registered. Please Log In");
							res.redirect('/login');
						}
						else{
							client.query('INSERT INTO ieeesbm (id, "firstname", "lastname", "email", "contact_no", password) VALUES ($1, $2, $3, $4, $5, $6);', [uuidv4(), req.body.firstname, req.body.lastname, req.body.email, req.body.contact_no, pwd], function(err, result) {
								if(err){console.log(err);}
								else{
								
									client.query('COMMIT')
									console.log(result)
									req.flash('success','User created.')
									res.redirect('/login');
									return;
								}
						});
						}
					}));	
				}
				
			}));
			client.release();
		} 
		catch(e){throw(e)}
	});
	
	app.get('/account', function (req, res, next) {
		if(req.isAuthenticated()){
			console.log('s');
			res.render('account', {title: "Account", userData: req.user, userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
			v=0;
		}
		else{
			console.log('12');
			req.flash('warning', "You are not logged in.");
			res.redirect('/login');
		}
	});

	
	
	app.get('/login', function (req, res, next) {
		if (req.isAuthenticated()) {
			res.redirect('/account');
		}
		else{
			console.log('7');
			res.render('login', {title: "Log in", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		}
		
	});
	
	app.get('/logout', function(req, res){
		
		console.log(req.isAuthenticated());
		req.logout();
		console.log(req.isAuthenticated());
		req.flash('success', "Logged out. See you soon!");
		res.redirect('/');
	});
	
	app.post('/login',	passport.authenticate('local', {
		successRedirect: '/account',
		failureRedirect: '/login',
		failureFlash: true
		}), function(req, res) {
		if (req.body.remember) {
			req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
			} else {
				console.log('6');
			req.session.cookie.expires = false; // Cookie expires at end of session
		}
		res.redirect('/');
	});
	
	
	
}

passport.use('local', new  LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
	
	loginAttempt();
	async function loginAttempt() {
		
		console.log('HI');
		
		try{
			const client = await pool.connect()
			await client.query('BEGIN')
			var currentAccountsData = await JSON.stringify(client.query('SELECT id, firstname, email, password FROM ieeesbm WHERE email=$1', [username], function (err, result) {
				if (err) {
					console.log('1');
					return done(err);
				}
				if (result.rows[0] == null) {
					req.flash('danger', "Oops. Incorrect login details.");
					console.log('2');
					return done(null, false);
				}
				else {
					bcrypt.compare(password, result.rows[0].password, function (err, check) {
						if (err) {
							console.log('3');
							console.log('Error while checking password');
							return done();
						}
						else if (check) {
							console.log('4');
							v=1;
							console.log(result.rows[0]);
							return done(null, [{ email: result.rows[0].email, firstname: result.rows[0].firstname }]);
						}
						else {
							console.log('5');
							req.flash('danger', "Oops. Incorrect login details.");
							return done(null, false);
						}
					});
				}
			}));
			client.release();
		}
		
		catch(e){throw (e);}
	};
	
}
))




passport.serializeUser(function(user, done) {
	console.log('10');
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	console.log('11');
	done(null, user);
});		