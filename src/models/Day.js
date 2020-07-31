const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  today: {
    type: Number,
    required: true
  },
  bpm: {
    type: Array,
    default: []
  },
  locations: {
    type: Array,
    deafult: []
  }
});

daySchema.index({'patientId': 1, 'patientName': 1, 'today': 1}, {unique: true});

mongoose.model("Day", daySchema);
