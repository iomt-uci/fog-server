require("./models/Staff");
require("./models/Patient");
require("./models/Device");
require("./models/Track");
require("./models/Day");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dataDict = require('./utils/dataDict.js');

const authRoutes = require("./routes/authRoutes");
const connectRoutes = require("./routes/connectRoutes");
const trackRoutes = require("./routes/trackRoutes");
const historyRoutes = require('./routes/historyRoutes');
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
app.use(historyRoutes);

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
    "mongodb+srv://heart_rate:heart@cluster0.hpfhg.mongodb.net/fog?retryWrites=true&w=majority";
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
// replace ip if needed
const host = "127.0.0.1";

// redis client
const redis = require('redis');
const client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});

// client listening messages
client.on('message', function(channel, message) {
    console.log('from channel ' + channel + ": " + message);

    //////// REAL TIME DATA ///////////

    let list = message.split('|');
    // "1|RoomA"  ==> <device id>|<room name>
    // OR "1|N|P" ==> <device id>|<prediction label>|<char>
    // OR "1|1|Taiting Lu|92" ==> <patient id>|<device id>|<patient name>|<bpm>

    // if length = 2, it is location
    if (list.length === 2) {
        const deviceId = list[0];
        const roomName = list[1];

        if (Object.keys(dataDict.getPatientData(deviceId)).length !== 0) {
            dataDict.updateLocation(deviceId, roomName);
            const jsonStr = dataDict.parseData(deviceId);
            io.send(jsonStr);
        }
    }
    // if length = 3, it is prediction label
    else if (list.length === 3) {
        const deviceId = list[0];
        const prediction = list[1];

        if (Object.keys(dataDict.getPatientData(deviceId)).length !== 0) {
            dataDict.updatePrediction(deviceId, prediction);
            const jsonStr = dataDict.parseData(deviceId);
            io.send(jsonStr);
        }
    } 
    // if length === 4, it is bpm
    else if (list.length === 4) {
        const deviceId = list[1];
        const bpm = list[3];

        if (Object.keys(dataDict.getPatientData(deviceId)).length !== 0) {
            dataDict.updateBPM(deviceId, bpm);
            const jsonStr = dataDict.parseData(deviceId);
            io.send(jsonStr);
        }
    }

});

client.subscribe('heart-rate');

// constantly check if patient has left the device
setInterval(() => {
    let dataStream = dataDict.getDataStream();
    for (let deviceId in dataStream) {
        if (Object.keys(dataDict.getPatientData(deviceId)).length !== 0 && 
            Date.now() - dataStream[deviceId].lastUpdated >= 5000) {
            dataDict.updateBPM(deviceId, 0);
            const jsonStr = dataDict.parseData(deviceId);
            io.send(jsonStr);                    
        }
    }
}, 7000);


// feel free to disable login for testing purposes

app.get("/", requireAuth, (req, res) => {
    res.send(`Your email: ${req.user.email}`);
});

// start server on port 8000
// server.listen(8000, () => console.log("server running on port 8000"));
// server.listen();
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));



