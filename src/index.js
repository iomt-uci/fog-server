require("./models/User");
require("./models/Track");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const connectRoutes = require("./routes/connectRoutes");
const trackRoutes = require("./routes/trackRoutes");
const requireAuth = require("./middlewares/requireAuth");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(authRoutes);
app.use(connectRoutes);
app.use(trackRoutes);

// http server for socket.io
const server = require('http').createServer(app);


// ========================== socket.io ==========================
// const io = require('socket.io').listen(server);

// // connect socket.io
// io.on("connection", socket => {
//   console.log("a user has connected");
// });


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
});

mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance");
});
mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo", err);
});

// ========================== Redis ==========================

// redis config
// const redisPort = 6379;
// const host = "127.0.0.1";

// // redis client
// const redis = require('redis');
// const client = redis.createClient(redisPort, host);

// // client listening messages
// client.on('message', function(channel, message) {
//     console.log('from channel ' + channel + ": " + message);
//     const msg = JSON.parse(message);
//     io.send(msg);
// });

// client.subscribe('heart-rate');

app.get("/", requireAuth, (req, res) => {
  res.send(`Your email: ${req.user.email}`);
});

// start server on port 8000
server.listen(8000, () => console.log("server running on port 8000"));


