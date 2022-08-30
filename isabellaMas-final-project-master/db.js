// Final project part 1 db.js
const mongoose = require('mongoose');
//User obj because site requires authentification 

const uri = process.env.MONGODB_URI;

//note obj for notes keeps track of title, notes, and if it needs to be studdied(checked)
const Note = new mongoose.Schema({
  noteT: {type: String, required: false},
  noteC: {type: String, required: false},
  bodyOfNotes: {type: String, required: false},
});


//class ojb to keep trreck of all classes notes, has date and time of class
const Class = new mongoose.Schema({
  name: {type: String, required: false},
  time: {type: String, required: false},
  days: {type: Array, required: false},
});

const User = new mongoose.Schema({
  username: {type: String, unique: true, required: true},
  password: {type: String, required: true},
  classes: [Class],
  notes:[Note],
  study:[Note]
});

mongoose.model('Note', Note);
mongoose.model('Class', Class);
mongoose.model('User', User);
mongoose.connect(uri || 'mongodb://localhost/finalproject');
//mongoose.connect('mongodb://localhost/finalproject');

