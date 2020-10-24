const mongoose = require('mongoose');

const locationTrackingSchema = new mongoose.Schema({
  time: {
    type: Number,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  locationName: {
    type: String,
    required: true
  }
});

locationTrackingSchema.index({'patientId': 1, 'time': 1}, {unique: true});

mongoose.model("locationTracking", locationTrackingSchema);
