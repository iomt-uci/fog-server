require("./models/User");
require("./models/Track");
require("./models/Day");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const connectRoutes = require("./routes/connectRoutes");
const trackRoutes = require("./routes/trackRoutes");
const requireAuth = require("./middlewares/requireAuth");

// get the day model
const Day = mongoose.model("Day");


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(authRoutes);
app.use(connectRoutes);
app.use(trackRoutes);


// http server for socket.io
const server = require('http').createServer(app);


// ========================== socket.io ==========================
const io = require('socket.io').listen(server);

// connect socket.io
io.on("connection", socket => {
    console.log("a user has connected");
});


// ========================== Mongo ==========================
// tweak MongoDB URL as needed
// const mongoUri =
//   "mongodb+srv://jay:,,mnz114@cluster0.jnkql.mongodb.net/<dbname>?retryWrites=true&w=majority";
const mongoUri =
    "mongodb+srv://xhl:wait4it@cluster0.njtgk.mongodb.net/fog?retryWrites=true&w=majority";
if (!mongoUri) {    
    throw new Error(
        `MongoURI was not supplied. Make sure you watch the video on setting up Mongo DB!`
    );
}

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

mongoose.connection.on("connected", () => {
    console.log("Connected to mongo instance");
});
mongoose.connection.on("error", (err) => {
    console.error("Error connecting to mongo", err);
});

// ========================== Redis ==========================

// redis config
const redisPort = 6379;
const host = "127.0.0.1";

// redis client
const redis = require('redis');
const client = redis.createClient(redisPort, host);


let dataStream = {};
// dataSteam = { 1 : {bpm: 123, location: Room A, alarm: 1.....} }

let bpmBuffer = {};
// bpmBuffer = { 1: [80, 90, 93, 87, 89....]}


// client listening messages
client.on('message', function(channel, message) {
    console.log('from channel ' + channel + ": " + message);

    //////// REAL TIME DATA ///////////

    let list = message.split('|');
    // list === "1|RoomA" OR "1|1|Taiting Lu|92"


    // if patientId is not in dataStream, create an empty object
    // set hallway as default location
    if (!(list[0] in dataStream)) {
        dataStream[list[0]] = {}
        dataStream[list[0]].location = 'Hallway';
        dataStream[list[0]].startTime = Date.now();
    }

    // if length = 2, it is location
    if (list.length === 2) {
        const location_temp = dataStream[list[0]].location;

        // a new room has been detected, update wait time for the old room
        // Note: only update when none of fields are missing
        if (Object.keys(dataStream[list[0]]).length === 6) {
            const filter = {
                patientId: list[0], 
                patientName: dataStream[list[0]].patientName,
                today: getToday()
            }; 
            const update = {
                "$push": { 
                    "locations": {
                        "Room": dataStream[list[0]].location,
                        "duration": Date.now() - dataStream[list[0]].startTime,
                        "startTime": dataStream[list[0]].startTime
                    } 
                }
            };    
            updateDB(filter, update);
        }


        if (location_temp === list[1]) {
            // if the old location (in local dataStream variable) is equal to incoming location,
            // location is read the 2nd time; assign "Hallway" as location
            dataStream[list[0]].location = 'Hallway';
            dataStream[list[0]].startTime = Date.now();
        } else {
            // if incoming location is not equal to old location,
            // assign the incoming location and set the start time
            dataStream[list[0]].location = list[1];
            dataStream[list[0]].startTime = Date.now();  
        }

    } 
    // if length === 4, it is bpm
    else {

        // here to process bpm strings
        dataStream[list[0]].deviceId = list[1];
        dataStream[list[0]].patientName = list[2];
        dataStream[list[0]].bpm = list[3];

        // if bpm is meets a threshold, assign alarm value accordingly.
        if (list[3] >= 120) {
            dataStream[list[0]].alarm = 1;
        } else {
            dataStream[list[0]].alarm = 0;
        }
      
        // if patientId is not in bpmBuffer, create an empty object
        if (!(list[0] in bpmBuffer)) {
            bpmBuffer[list[0]] = [];
        }
        bpmBuffer[list[0]].push(list[3]);


        ////////////////////////////// TO DATABASE /////////////////////////////
        if (bpmBuffer[list[0]].length === 10) {

            // after collected 10 bpms, compute bpm avg
            const avg = arr => arr.reduce((a,b) => parseInt(a)+parseInt(b), 0) / arr.length;
            const bpmAvg = Math.floor(avg(bpmBuffer[list[0]]));

            // clear list once getting the avg for bpm
            bpmBuffer[list[0]] = [];

            // insert/update MongoDB 
            const filter = { 
                patientId: list[0], 
                patientName: dataStream[list[0]].patientName,
                today: getToday()
            };
            const update = {
                "$push": { "bpm": bpmAvg }
            };

            updateDB(filter, update);
        }

        /////// model prediction in future ////////
    }

    // socket.io to send message (preferably in json format)
    if (Object.keys(dataStream[list[0]]).length === 6) {
        const json_str = { patientId: list[0], ...dataStream[list[0]] };
        console.log(json_str);

        io.send(json_str);
    }

});

client.subscribe('heart-rate');


// feel free to disable login for testing purposes

// app.get("/", requireAuth, (req, res) => {
//     res.send(`Your email: ${req.user.email}`);
// });

// start server on port 8000
server.listen(8000, () => console.log("server running on port 8000"));


async function updateDB(filter, update) {
    await Day.findOneAndUpdate(filter, update, {
        upsert: true
    });
}

function getToday() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timestamp = startOfDay / 1000;

    return timestamp;
}
