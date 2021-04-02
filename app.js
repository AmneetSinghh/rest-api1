//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const datetime = require('node-datetime');
const cron = require('node-cron');
const ejs = require("ejs");
const _ = require("lodash");
const alert = require('alert');


const app = express();



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// Data-Base
mongoose.connect("mongodb+srv://harry:Rajman1234@cluster0.aoygq.mongodb.net/taskmanage", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}); // connection to mongo db server;


//Create a schema;
const task_schema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    creator: { type: String, required: true },
    duration: { type: Number, required: true },
    created_at: {
        type: Date,
        default: Date.now,
    },
    delete_at: Date,
});

// Object of the ;Schema
const Task_management = new mongoose.model("Task", task_schema);

var add_minutes = function(dt, minutes) {
        return new Date(dt.getTime() + minutes * 60000);
    }
    // Schedule tasks to be run on the server.
var i = 0;
cron.schedule("*/10 * * * * *", function() {
    console.log('running a task after every 10 seconds');

    // this thing is running every minute;
    console.log("****************************************************************************************", i);
    Task_management.find({}, function(err, list_of_tasks) {

        var list_of_delete = [];
        for (var i = 0; i < list_of_tasks.length; i++) {
            var that_date = list_of_tasks[i].created_at;
            var delete_date = add_minutes(that_date, list_of_tasks[i].duration);
            var current_time = new Date();

            if (current_time >= delete_date) {
                // Delete from data base.
                list_of_delete.push(list_of_tasks[i]);
            }

        }

        var flag = 0;

        if (list_of_delete.length > 0) {
            alert("Tasks Deleted Please Refresh the Page");
            flag = 1;

        }
        console.log("size of ", list_of_delete.length, flag);

        for (var i = 0; i < list_of_delete.length; i++) {
            var cur = list_of_delete[i];
            Task_management.remove({ _id: cur._id }, function(err) {
                if (!err) {
                    console.log("deleted-> check the size")
                } else {
                    console.log("Error");
                }
            });

        }
        if (flag == 1) {
            console.log("deleted-> ", flag);
        }





    });

    ++i;
});



app.get("/", function(req, res) {
    res.render("frontpage");
});

app.get("/list", function(req, res) {
    Task_management.find({}, function(err, list_of_tasks) {
        res.render("home", {
            tasks_list: list_of_tasks
        });
    });



});

app.get("/add", function(req, res) {
    res.render("compose");
});



app.post("/add", function(req, res) {
    var dt = new Date();
    const task = new Task_management({
        name: req.body.taskname,
        description: req.body.taskdes,
        creator: req.body.creator,
        duration: req.body.duration,
        delete_at: add_minutes(dt, req.body.duration)
    });

    task.save(function(err) {
        if (!err) res.redirect("/list");
        else console.log(err);
    });

});


// let port = process.env.PORT;
// if (port == null || port == "") port = 3005;
app.listen(process.env.PORT || 3007)