//this is the test branch

const express = require('express');
const ejs = require('ejs');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const multer = require('multer');
const date = new Date();
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'reportFiles');
    },
    filename: (req, file, cb) => {
        cb(null, date.toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/wps-office.pdf') {
        cb(null, true);
    } else {
        cb(null, false);
    }

};


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
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('pReport'));

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
});

const appointmentSchema = new Schema({
    "pName": String,
    "pAddress": String,
    "pNumber": Number,
    "pEmail": String,
    "pGender": String,
    "dob": Date,
    "department": String,
    "doctor": String,
    "appointmentDate": Date,
    "preferredTime": String,
});

const reportSchema = new Schema({
    _id: Number,
    rName: String,
    rEmail: String,
    reportPath: String,
});

patientSchema.plugin(passportLocalMongoose);

const Patient = new mongoose.model('Patient', patientSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Report = new mongoose.model('Report', reportSchema);

passport.use(Patient.createStrategy());
passport.serializeUser(Patient.serializeUser());
passport.deserializeUser(Patient.deserializeUser());

//All get Request made

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/login", (req, res) => {
    res.render("login", { 'loginText': "User ", 'permission': '/login' });
})

app.get("/admin", (req, res) => {
    res.render("login", { 'loginText': "Employee ", 'permission': '/admin' });
})

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        userEmail = req.user.username;
        Appointment.findOne({ pEmail: userEmail }, (err, docs) => {
            if (err) {
                console.log(err);
            } else {
                if (docs === null) {
                    res.render("secrets", { 'foo': 0 });
                } else {
                    var d = new Date(docs.appointmentDate);
                    res.render("secrets", { 'foo': d.toDateString() });
                }
            }
        })
    } else {
        res.redirect("/");
    }
});

app.get("/appoint", (req, res) => {
    if (req.isAuthenticated()) {
        userEmail = req.user.username;
        Appointment.findOne({ pEmail: userEmail }, (err, docs) => {
            if (err) {
                console.log(err);
            } else {
                if (docs === null) {
                    res.render("appoint");
                } else {
                    res.send("<h1>Please complete the pending appointment before making new request</h1>")
                }
            }
        })
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
});

app.get("/getReport", (req, res) => {
    if (req.isAuthenticated()) {
        userEmail = req.user.username;
        name = "bob";
        Report.findOne({ "_id": 123456 }, (err, docs) => {
            if (err) {
                console.log(err);
            }
            else {
                reportPath = path.join(__dirname + docs.reportPath)
                fs.readFile(reportPath, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.render('customError', { 'error': 'No Report Found' });
                    } else {
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `inline; filename=${name}.pdf`);
                        res.send(data);
                    }
                })
            }
        })

    } else {
        res.redirect("/");
    }
})

//All Post Request.

app.post("/appoint", (req, res) => {
    if (req.isAuthenticated()) {
        const newAppointment = new Appointment({
            "pName": req.body.name,
            "pAddress": req.body.address,
            "pNumber": req.body.contact,
            "pEmail": req.body.email,
            "pGender": req.body.gender,
            "dob": req.body.dob,
            "department": req.body.depart,
            "doctor": req.body.doctor,
            "appointmentDate": req.body.sDate,
            "preferredTime": req.body.sTime,
        });
        newAppointment.save((err, newAppointment) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/secrets");
            }
        });

    } else {
        res.redirect("/");
    }

})

app.post("/register", (req, res) => {
    Patient.register({
        name: req.body.name,
        address: req.body.address,
        contact: req.body.contact,
        gender: req.body.gender,
        username: req.body.username
    }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            })
        }
    });
});

app.post("/login", function (req, res) {

    const patient = new Patient({
        username: req.body.username,
        password: req.body.password
    });

    req.login(patient, function (err) {
        if (err) {
            console.log(err);
            // res.render("customError", {'error' : "Incorrect Username or Password"})
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/admin", (req, res) => {
    const patient = new Patient({
        username: req.body.username,
        password: req.body.password,
    });

    if (
        patient.username === 'amarmandal2073@gmail.com' || patient.username === 'doctor2@mail.com' ||
        patient.username === 'doctor3@mail.com' || patient.username === 'doctor4@mail.com' ||
        patient.username === 'doctor5@mail.com' || patient.username === 'doctor6@mail.com' ||
        patient.username === 'doctor7@mail.com' || patient.username === 'doctor8@mail.com' ||
        patient.username === 'doctor9@mail.com' || patient.username === 'doctor10@mail.com'
    ) {
        req.login(patient, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.render('admin');
                });
            }
        });
    } else {
        res.send("You are not employee!");
    }

});

app.post('/upload', (req, res) => {
    const pReport = req.file;
    const newReport = new Report({
        _id: req.body.patientId,
        rName: req.body.rName,
        rEmail: req.body.rEmail,
        reportPath: "/" + pReport.path,
    })

    newReport.save((err, newReport) => {
        if (err) {
            console.log(err);
        } else {
            res.send("Report Uploaded successfully!");
        }
    })
})


app.listen(3000, () => {
    console.log("Server Started Listening on port 3000");
})
