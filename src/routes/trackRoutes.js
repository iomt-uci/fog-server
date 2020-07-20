const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");

const Track = mongoose.model("Track");

const router = express.Router();

router.use(requireAuth);

router.get("/tracks", async (req, res) => {
  const tracks = await Track.find({ userId: req.user._id });

  res.send(tracks);
});

router.post("/tracks", async (req, res) => {
  const { first_name, last_name, HRD_id, connected } = req.body;

  if (!first_name || !last_name || !HRD_id || !connected) {
    return res.status(422).send({ error: "There's something missing" });
  }

  try {
    const track = new Track({
      first_name,
      last_name,
      HRD_id,
      connected,
      userId: req.user._id,
    });
    await track.save();
    res.send(track);
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

module.exports = router;
