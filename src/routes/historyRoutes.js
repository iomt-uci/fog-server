const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");

const Day = mongoose.model("Day");

const router = express.Router();

router.use(requireAuth);

router.get("/bpm-history", async (req, res) => {
  const patientId = req.query.pid;
  const day = req.query.day;

  const patientHistory = await Day.findOne({ patientId, today: parseInt(day) });

  const bpmList = patientHistory.bpm;
  res.send({bpmList});
});

module.exports = router;