const mongoose = require('mongoose');

const OxygenSaturationTrackingSchema = new mongoose.Schema({
  time: {
    type: Number,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  OxygenSaturation: {
    type: String,
    required: true
  }
});

OxygenSaturationTrackingSchema.index({'patientId': 1, 'time': 1}, {unique: true});

mongoose.model("OxygenSaturationTracking", OxygenSaturationTrackingSchema);
