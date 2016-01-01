var async = require("async");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test');

var RoomSchema = new Schema({
    title: { type: String, required: true },
    names: { type: [String], required: true }
}, { timestamps: true });

var VoteSchema = new Schema({
    roomId: { type: Schema.Types.ObjectId, required: true },
    target: { type: String, required: true }
}, { timestamps: true });

var Room = mongoose.model('Room', RoomSchema);
var Vote = mongoose.model('Vote', VoteSchema);

var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(express.static("public"));
app.set("view engine", "jade");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function(req, res){
    Room.find({}, function(err, rooms){
        res.render("index", { rooms: rooms });
    });
});

app.post("/", function(req, res){
    var r = req.body.room;
    r.names = r.names.replace(/\s/g, '').split(",");
    
    Room.create(r, function(err, room){
        if(err) res.render("form", { message: "Failed create room" });
        else res.redirect("/");
    });
});

app.get("/rooms/new", function(req, res){
    res.render("form");
});

app.get("/rooms/:id", function(req, res){
    Room.findById(req.params.id, function(err, room){
        if(err) console.log(err);
        else{
            var ns = room.names.map(function(name){ return { roomId: room.id, target: name } });
            var counts = {};
            async.each(room.names, function(name, cb){
                Vote.count({ roomId: room.id, target: name }, function(err, count) {
                    if(err) return cb(err);
                    counts[name] = count;
                    cb();
                });
            }, function(err){
                res.render("room", { room: room, counts: counts });
            });
        }
    });
});


var server = app.listen(process.env.PORT);

var io = require("socket.io")(server);
io.on('connection', function(socket) {
    socket.on('login', function(d) {
        if(!d.roomId) return;
        socket.join(d.roomId);
        socket.roomId = d.roomId;
        socket.on('vote', function(data) {
            data.roomId = socket.roomId;
            Vote.create(data, function(err, vote) {
                if (err) console.log(err);
                else {
                    Vote.count(data, function(err, count) {
                        if (err) console.log(err);
                        else {
                            io.to(socket.roomId).emit('vote', { target: vote.target, count: count });
                        }
                    });
                }
            });
        });
        socket.on('aori', function(data){
            io.to(socket.roomId).emit('aori', data);
        });
    });
});