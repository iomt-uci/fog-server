const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");

const Patient = mongoose.model("Patient");
const Staff = mongoose.model("Staff");
const Device = mongoose.model("Device");


const router = express.Router();

router.use(requireAuth);


/////////// testing purpose //////////////
// router.post('/register-device', async (req, res) => {
//   const device = await Device.create({
//     _id: "3",
//     isConnected: 0,
//     connectedTo: null,
//     manufacturer: "Sparkfun"
//   });

//   res.send(device);
// });

router.get('/staff-name', async (req,res) => {
  try {
    const staff = await Staff.findById(req.user._id);
    return res.send({ staffName: staff.firstName + " " + staff.lastName });    
  } catch (err) {
    return res.send({ error: "Sorry, you are not authenticated." });
  }
}); 


// get all patients belong to that staff
router.get("/active-patients", async (req, res) => {

  // populate/expand patients; replace patient object ids with actual patient documents
  const staffDocExpanded = await Staff.findOne({_id: req.user._id}).populate('patients');

  const activePatients = staffDocExpanded.patients.filter(patient => patient.deviceId !== "0");

  res.send(activePatients);
});

router.get("/patient-connect", async (req, res) => {
  
  const deviceId = req.query.edgeId;

  try {
    const patient = await Patient.findOne({ deviceId: deviceIdInput });

    const patient_id = patient._id;
    const patient_name = patient.firstName + " " + patient.lastName;
    const isCalling = patient.isCalling;

    const patient_display = patient.firstName.length > 8 
       ? patient.firstName.substring(0, 8).toUpperCase() + " " + patient.lastName.substring(0, 1).toUpperCase()
       : patient.firstName.toUpperCase() + " " + patient.lastName.substring(0, 1).toUpperCase();

    res.send({ patient_id, patient_name, patient_display, isCalling, deviceId, isConnected: 1 });   
  } catch (err) {
    return res.send({ isConnected: 0 });
  }
});

router.post("/patient-connect", async (req, res) => {
  const { phoneNumInput, deviceIdInput } = req.body;

  if (!phoneNumInput || !deviceIdInput) {
    return res.status(422).send({ error: "Please fill in missing fields." });
  }

  try {
    const device = await Device.findById(deviceIdInput);

    // does device exist?
    if (device) {
      // if it is, check if it's connected
      if (device.isConnected === 1) {
        return res.status(422).send({ error: `Device ${deviceIdInput} is already in use...` });
      }    
    } else {
      // if not, return 'device not found'
      return res.status(422).send({ error: `Device ${deviceIdInput} is not found.` });
    }

    // device exists, but does patient exist?
    const patient = await Patient.findOne({ phoneNum: phoneNumInput });
    if (patient) {
      if (patient.deviceId !== "0") {
        return res.status(422).send({ error: `Patient ${patient.firstName} has been connected to device ${patient.deviceId}` });
      }
      // it if is, set device id in patients collection
      patient.deviceId = device._id;

      // set connectedTo attr to patient id in devices collection
      // set isConnected attr to 1 in devices collection
      device.connectedTo = patient._id;
      device.isConnected = 1;

      await device.save();
      await patient.save();

      return res.status(200).send({ 
        message: `Successfully connected ${patient.firstName} with device ${deviceIdInput}.` 
      });

    } else {
      // if not
      return res.status(422).send({ error: `Patient whose phone number is ${phoneNumInput} is not found.` });
    }
  } catch(err) {
    return res.status(422).send({ error: err.message });
  }
});

router.post("/patient-disconnect", async (req, res) => {
  const { deviceIdInput } = req.body;

  if (!deviceIdInput) {
    return res.status(422).send({ error: "Please fill in the missing deviceId" });
  }

  try {
    const device = await Device.findById(deviceIdInput);

    // does device exist?
    if (!device) {
      return res.status(422).send({ error: `Device ${deviceIdInput} is not found.` });
    }

    if (device.isConnected === 1) {
      const patient = await Patient.findById(device.connectedTo);

      patient.deviceId = "0";
      patient.isCalling = 0;

      device.isConnected = 0;
      device.connectedTo = null;

      await patient.save();
      await device.save();

      return res.status(200).send({ 
        message: `Successfully disconnected ${patient.firstName} with device ${deviceIdInput}.` 
      });
    } else {
      return res.status(422).send({ error: `Device ${deviceIdInput} is not connected to any patient.` });
    }
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

router.post("/patient-call", async (req, res) => {
  const { deviceIdInput } = req.body;

  if (!deviceIdInput) {
    return res.status(422).send({ error: "Failed to initiate the call to patient" });
  }

  try {
    const patient = await Patient.findOne({ deviceId: deviceIdInput });

    if (patient.isCalling === 1) {
      return res.status(422).send({ error: `Patient ${patient.firstName} has been called!!` });
    }

    patient.isCalling = 1;
    await patient.save();      

    return res.status(200).send({ 
      message: `Patient ${patient.firstName} will hear ringings from device ${deviceIdInput} shortly.` 
    });

  } catch (err) {
    return res.status(422).send({ error: `Failed to initiate the call to patient` });
  }
});

router.post("/patient-cancel-call", async (req, res) => {
  const { deviceIdInput } = req.body;

  if (!deviceIdInput) {
    return res.status(422).send({ error: "Failed to disable the call to patient" });
  }

  try {
    const patient = await Patient.findOne({ deviceId: deviceIdInput });

    patient.isCalling = 0;
    await patient.save();

    return res.status(200).send({ 
      message: `Patient ${patient.firstName} will stop receiving ringings from device ${deviceIdInput} shortly.` 
    });

  } catch (err) {
    return res.status(422).send({ error: `Failed to disbale the call to patient.` });
  }
});

module.exports = router;
