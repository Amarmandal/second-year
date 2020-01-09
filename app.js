const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: 'This is the secret key!',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/hospital', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

const Schema = mongoose.Schema;
const patientSchema = new Schema({
    name: String,
    address: String,
    contact: Number,
    gender: String,
    email: String,
    password: String,
})
patientSchema.plugin(passportLocalMongoose);

const Patient = mongoose.model('Patient', patientSchema);

passport.use(Patient.createStrategy());
passport.serializeUser(Patient.serializeUser());
passport.deserializeUser(Patient.deserializeUser());


app.get("/", (req, res) => {
    res.render("index");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/register", (req, res) => {
    Patient.register({
        name:
    }, req.body.password , () => {

    })
});

app.post("/login", (req, res) => {

});

app.listen(3000, () => {
    console.log("Server Started Listening on port 3000");
})
