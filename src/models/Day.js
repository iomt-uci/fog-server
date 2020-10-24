const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true
  },
  today: {
    type: Number,
    required: true
  }
});

daySchema.index({'patientId': 1, 'today': 1}, {unique: true});

mongoose.model("Day", daySchema);
