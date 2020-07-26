const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");

const User = mongoose.model("User");

const router = express.Router();

router.use(requireAuth);

router.get("/patient-connect", async (req, res) => {
  const edgeId = req.query.edgeId;

  const patient = await User.findOne({ deviceId: edgeId });

  res.send({ 
    patient_id: patient._id, 
    patient_name: patient.firstName.toUpperCase() + " " + patient.lastName.toUpperCase()
  });

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
