const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  isConnected: {
    type: Number,
    required: true
  },
  connectedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  manufacturer: {
    type: String,
    default: "Sparkfun"
  }
});

mongoose.model("Device", deviceSchema);
