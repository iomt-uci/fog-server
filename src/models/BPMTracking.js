const mongoose = require('mongoose');

const BPMTrackingSchema = new mongoose.Schema({
  time: {
    type: Number,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  BPM: {
    type: String,
    required: true
  }
});

BPMTrackingSchema.index({'patientId': 1, 'time': 1}, {unique: true});

mongoose.model("BPMTracking", BPMTrackingSchema);
