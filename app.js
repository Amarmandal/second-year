// require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://localhost:27017/hospital', { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
const patientSchema = new Schema({
    name: String,
    address: String,
    contact: Number,
    gender: String,
    email: String,
    password: String,
})

// const secret = process.env.SECRET;
// patientSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password']});

const Patient = mongoose.model('Patient', patientSchema);


app.get("/", (req, res) => {
    res.render("index");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newPatient = new Patient({
            name: req.body.name,
            address: req.body.address,
            contact: req.body.contact,
            gender: req.body.gender,
            email: req.body.username,
            password: hash,
        })

        newPatient.save((err) => {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets");
            }
        })
    })
});

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    Patient.findOne({ email: username }, (err, foundUser) => {
        // console.log(foundUser.password);
        if(err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password , function (err, result) {
                    if ( result === true) {
                        res.render("secrets"); //If both Username and password is corret
                    }
                    else {
                        res.send("Incorrect Username or Password"); //if user is found but Password in incorrect
                    }
                });
            } else {
                res.send("User not found"); //if no user email is matched in the database
            }
        }
    })
});


app.listen(3000, () => {
    console.log("Server Started Listening on port 3000");
})
