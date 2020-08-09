const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");

const Patient = mongoose.model("Patient");

const router = express.Router();

router.use(requireAuth);

router.get("/all_patients", async (req, res) => {

  const patients = await Patient.find({ doctor: req.user._id });

  res.send(patients);
});

router.get("/patient-connect", async (req, res) => {
  
  const deviceId = req.query.edgeId;
  

  try {
    const patient = await Patient.findOne({ deviceId });
    const patient_id = patient._id;
    const patient_name = patient.firstName + " " + patient.lastName;
    const isCalling = patient.isCalling;

    const patient_display = patient.firstName.length > 8 
       ? patient.firstName.substring(0, 8).toUpperCase() + " " + patient.lastName.substring(0, 1).toUpperCase()
       : patient.firstName.toUpperCase() + " " + patient.lastName.substring(0, 1).toUpperCase();

    res.send({ patient_id, patient_name, patient_display, isCalling, deviceId, isConnected: 1 });   
  } catch (err) {
    res.send({ isConnected: 0 });
  }
});

router.post("/patient-connect", async (req, res) => {
  const { phoneNumInput, deviceIdInput } = req.body;

  if (!phoneNumInput || !deviceIdInput) {
    return res.status(422).send({ error: "Please fill in missing fields." });
  }

  try {
    const patient = await Patient.findOne({ phoneNum: phoneNumInput });

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
    const patient = await Patient.findOne({ deviceId: deviceIdInput });

    patient.deviceId = "0";

    await patient.save();

    res.status(200).send({ 
      message: `Successfully disconnected ${patient.firstName} with device ${deviceIdInput}.` });
  } catch (err) {
    res.status(422).send({ error: `Device id ${deviceIdInput} does not seem to be connected.` });
  }
});

router.post("/patient-cancel-call", async (req, res) => {
  const { deviceIdInput } = req.body;

  if (!deviceIdInput) {
    return res.status(422).send({ error: "Please fill in the missing deviceId" });
  }

  try {
    const patient = await Patient.findOne({ deviceId: deviceIdInput });

    patient.isCalling = "0";

    await patient.save();

    res.status(200).send({ 
      message: `Successfully disconnected ${patient.firstName} with device ${deviceIdInput}.` });
  } catch (err) {
    res.status(422).send({ error: `Device id ${deviceIdInput} does not seem to be connected.` });
  }
});

router.post("/patient-call", async (req, res) => {
  const { deviceIdInput } = req.body;

  if (!deviceIdInput) {
    return res.status(422).send({ error: "Please fill in the missing deviceId" });
  }

  try {
    const patient = await Patient.findOne({ deviceId: deviceIdInput });

    patient.isCalling = "1";

    await patient.save();

    res.status(200).send({ 
      message: `Successfully disconnected ${patient.firstName} with device ${deviceIdInput}.` });
  } catch (err) {
    res.status(422).send({ error: `Device id ${deviceIdInput} does not seem to be connected.` });
  }
});

module.exports = router;
