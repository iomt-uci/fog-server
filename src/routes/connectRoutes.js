const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");

const User = mongoose.model("User");

const router = express.Router();

// router.use(requireAuth);

router.get("/patient-connect", async (req, res) => {
  const edgeId = req.query.edgeId;

  try {
    const patient = await User.findOne({ deviceId: edgeId });
    const patient_id = patient._id;
    const patient_name = patient.firstName + " " + patient.lastName;
    const isCalling = patient.isCalling;

    const patient_display = patient.firstName.length > 8 
       ? patient.firstName.substring(0, 8).toUpperCase() + " " + patient.lastName.substring(0, 1).toUpperCase()
       : patient.firstName.toUpperCase() + " " + patient.lastName.substring(0, 1).toUpperCase();

    res.send({ patient_id, patient_name, patient_display, isCalling });   
  } catch (err) {
    res.send({ patient_display: '0' });
  }
});

router.post("/patient-connect", async (req, res) => {
  const { phoneNumInput, deviceIdInput } = req.body;

  if (!phoneNumInput || !deviceIdInput) {
    return res.status(422).send({ error: "Please fill in missing fields." });
  }

  try {
    const patient = await User.findOne({ phoneNum: phoneNumInput });

    patient.deviceId = deviceIdInput;

    await patient.save();

    res.status(200).send({ 
      message: `Successfully connected ${patient.firstName} with device ${patient.deviceId}.` });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

router.post("/patient-disconnect", async (req, res) => {
  const { deviceIdInput } = req.body;

  if (!deviceIdInput) {
    return res.status(422).send({ error: "Please fill in the missing deviceId" });
  }

  try {
    const patient = await User.findOne({ deviceId: deviceIdInput });

    patient.deviceId = "0";

    await patient.save();

    res.status(200).send({ 
      message: `Successfully disconnected ${patient.firstName} with device ${deviceIdInput}.` });
  } catch (err) {
    res.status(422).send({ error: `Device id ${deviceIdInput} does not seem to be connected.` });
  }
});

module.exports = router;
