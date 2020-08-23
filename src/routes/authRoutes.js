const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Staff = mongoose.model('Staff');
const Patient = mongoose.model('Patient');
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.post('/staff-signup', async (req, res) => {
  const { email, password, firstName, lastName, phoneNum } = req.body;

  try {
    const staff = new Staff({ email, password, firstName, lastName, phoneNum });
    await staff.save();

    const token = jwt.sign({ userId: staff._id }, 'MY_SECRET_KEY');
    res.send({ token });
  } catch (err) {
    return res.status(422).send(err.message);
  }
});

router.post('/staff-signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).send({ error: 'Must provide email and password' });
  }

  const staff = await Staff.findOne({ email });
  if (!staff) {
    return res.status(422).send({ error: 'Invalid password or email' });
  }

  try {
    await staff.comparePassword(password);
    const token = jwt.sign({ userId: staff._id }, 'MY_SECRET_KEY');
    res.send({ token });
  } catch (err) {
    return res.status(422).send({ error: 'Invalid password or email' });
  }
});

// for patient client applications
router.post('/patient-signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).send({ error: 'Must provide email and password' });
  }

  const patient = await Patient.findOne({ email });
  if (!patient) {
    return res.status(422).send({ error: 'Invalid password or email' });
  }

  try {
    await patient.comparePassword(password);
    const token = jwt.sign({ userId: patient._id }, 'MY_SECRET_KEY');
    res.send({ token });
  } catch (err) {
    return res.status(422).send({ error: 'Invalid password or email' });
  }
});

// used in staff client app; we don't let patients to sign up an account
// router.use(requireAuth);

router.post('/patient-signup', async (req, res) => {
  const { email, password, firstName, lastName, phoneNum } = req.body;
  const deviceId = "0";
  const isCalling = 0;

  try {
    const patient = new Patient({ email, password, firstName, lastName, phoneNum, deviceId, isCalling, doctor: req.user._id});
    await patient.save();

    const token = jwt.sign({ userId: patient._id }, 'MY_SECRET_KEY');
    res.send({ token });
  } catch (err) {
    return res.status(422).send(err.message);
  }
});

module.exports = router;
