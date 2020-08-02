const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Staff = mongoose.model('Staff');
const Patient = mongoose.model('Patient');

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  // authorization === 'Bearer laksjdflaksdjasdfklj'

  if (!authorization) {
    return res.status(401).send({ error: 'You must be logged in.' });
  }

  const token = authorization.replace('Bearer ', '');
  jwt.verify(token, 'MY_SECRET_KEY', async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: 'You must be logged in.' });
    }

    const { userId } = payload;

    // if not found in Staff, try Patient
    try {
      const user = await Staff.findById(userId);
      req.user = user;
      next();
    } catch (err) {
      const user = await Patient.findById(userId);
      req.user = user;
      next();
    }
  });
};
