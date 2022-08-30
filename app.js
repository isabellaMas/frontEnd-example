const db = require('./db');
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const stream = require('stream');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
var flash = require('connect-flash');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');



const User = mongoose.model('User');
const Class = mongoose.model('Class');
const Note = mongoose.model('Note');


var port = process.env.PORT || 3000;
//var port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({extended:false}));
//process.env.SECRET
app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: true}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());



passport.use('local-log', new LocalStrategy({
	username: 'username',
	password: 'password',
	passReqToCallback : true
},
	function(req, username, password, done){
		User.findOne({username: username}, function(err, user){
			if(err){return done(err)}

			if (!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}

			if (bcrypt.compareSync(user.password, password)) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		});
	}
));


passport.use('local-reg', new LocalStrategy({
	userN : 'username',
	passW: 'password',
	passReqToCallback : true
},
  function(req, username, password, done) {
    User.findOne({ username: username }, function(err, user) {
    	//return error if there is one 
      if (err) { return done(err); }
      if (user){
      	//username already exists
      	return done(null,false,{message: 'That username already exists.'})
      }
      	else{
      		//create new user 
        	const newU = new User();
        	newU.username = username;
        	newU.password = bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
        	//save new user
        	newU.save(function(err) {
        		if(err){
        		}
        		//return the new user
        		return done(null,newU);
        	});


      }//else
      
    });//findOne
  }//function
));//.use

passport.serializeUser(function(user, done) {
    done(null, user._id);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

User.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

app.get('/', (req, res) => {
	if(req.user == undefined){
		res.render('home',{user: req.user});
	}
	else{
		res.render('home',{user: req.user});
	}
});



app.get('/classes', (req, res) => {
	if(req.user == undefined){
		res.render('notLog',{user: req.user});
	}
	else{
		res.render('classes',{c: req.user.classes});
	}
});
app.get('/addClass', (req, res) => {
	if(!req.user){
		res.render('notLog',{user: req.user});
	}
	else{
		res.render('addClass');
	}
});

//adding a class
app.post('/addClass',(req, res) => {
	let body = Object.keys(req.body);
	body.splice(0,2);

	const newC = new Class({
		name : req.body.name,
		time : req.body.cTime,
		days : body
	});
	newC.save((err, saved) => {
		if(err){
			console.log(err);
		}
	});
	req.user.classes.push(newC);
	req.user.save();
	res.redirect('/classes');
});


app.get('/addNote', (req, res) => {
	if(!req.user){
		res.render('notLog',{user: req.user});
	}
	else{
		res.render('addNote',{c: req.user.classes});
	}
});

//adding a notes
app.post('/addNote',(req, res) => {
	let body = Object.keys(req.body);
	body.splice(1,2);

	const newN = new Note({
		noteT : req.body.noteT,
		noteC : body[0],
		bodyOfNotes : req.body.note
	});
	newN.save((err, saved) => {
		if(err){
			console.log(err);
		}
	});
	req.user.notes.push(newN);
	req.user.save();
	res.redirect('/notes');
});

app.get('/notes', (req, res) => {
	if(req.user == undefined){
		res.render('notLog',{user: req.user});
	}
	else{
		let data = "";
			req.user.notes.forEach(element =>{
				data+= element.noteT +"\n";
				data+= element.noteC +"\n";
				data+= element.bodyOfNotes +"\n\n";
			});
		res.render('notes',{n: req.user.notes, dat: data});
	}
});

app.get('/study',(req,res)=>{
	if(req.user == undefined){
		res.render('notLog',{user: req.user});
	}
	else{
		let data = "";
			req.user.study.forEach(element =>{
				data+= element.noteT +"\n";
				data+= element.noteC +"\n";
				data+= element.bodyOfNotes +"\n\n";
			});
		res.render('study',{n: req.user.study, dat:data});
	}
});

app.post('/study',(req,res)=>{
	let inpu = Object.entries(req.body);
	if(inpu.length === 0){
		res.redirect('/study');
	}
	else{
		if(inpu[0][0] === "download"){
			let data = "";
			req.user.study.forEach(element =>{
				data+= element.noteT +"\n";
				data+= element.noteC +"\n";
				data+= element.bodyOfNotes +"\n\n";
			});
			//fs.writeFileSync("study.txt", data);
			download("study.txt", data);
		}
		else{
		  let nameREMMany = Object.keys(req.body);
		  nameREMMany = nameREMMany.map(element => element.substring(0, element.length-1));
			for(let sty = 0; sty < nameREMMany.length; sty++){
				let nameREM = nameREMMany[sty];
				req.user.study = req.user.study.filter(element =>{
					return element.noteT != nameREM;
				})
				req.user.save();
			}
		}
		res.redirect('/study');
	}
});

app.post('/notes',(req,res)=>{
	let inp = Object.entries(req.body);
	if(inp.length === 0){
		res.redirect('/notes');
	}
	else{
		if(inp[0][1] === 'Delete'){
		// 	console.log(req.user);
		// 	 req.user.notes = req.user.notes.filter(function(value, index, arr){ 
	 //        return value.noteT !== inp;
	 //    });
		// 		req.user.notes.findOneAndDelete({noteT: inp[0][0]}, function (err, docs) {
		//     if (err){
		//         console.log(err)
		//     }
		//     else{
		//         console.log("Deleted note : ", docs);
		//     }
		// });
		//console.log(inp[0][0]);
		//console.log(req.user.notes);
			req.user.update(
			  { $pull: {notes: { noteT: inp[0][0] } } }
			);
			req.user.save();
			//console.log(req.user.notes);
				//req.user.notes.deleteOne({noteT:inp[0][0]});
				res.redirect('/notes');
		}
		else if(inp[0][0] === "download"){
			let data = "";
			req.user.notes.forEach(element =>{
				data+= element.noteT +"\n";
				data+= element.noteC +"\n";
				data+= element.bodyOfNotes +"\n\n";
			});
			//fs.writeFileSync("notes.txt", data);
			res.redirect('/notes');
		}
		else{
			let nameMany = Object.keys(req.body);
			nameMany = nameMany.map(element => element.substring(0,element.length-1));
			for(let st = 0; st < nameMany.length; st++){
				let name = nameMany[st];
				for(let s = 0; s < req.user.notes.length; s++){
					if(req.user.notes[s].noteT === name){
						req.user.study.push(req.user.notes[s]);
					}
				}
				req.user.save();
			}
			res.redirect('/study');
		}
	}
});

app.get('/login', (req, res) => {
	const errors = req.flash().error || [];
	res.render('log',{errors});
});
app.post('/login',passport.authenticate('local-log', 
	{ 
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true
	}));

app.get('/reg', (req, res) => {
	const errors = req.flash().error || [];
	res.render('reg',{errors});
});

app.post('/reg',passport.authenticate('local-reg', 
	{ 
		successRedirect: '/',
		failureRedirect: '/reg',
		failureFlash: true
	}));

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});



app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});