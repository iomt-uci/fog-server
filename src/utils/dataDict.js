let dataStream = {
	"1": {}, 
	"2": {}, 
	"3": {}
};

function initializePatient(deviceId, patientId, patientName) {
	dataStream[deviceId].patientId = patientId;
	dataStream[deviceId].patientName = patientName;
	dataStream[deviceId].bpm = 0;
	dataStream[deviceId].alarm = 0;
	dataStream[deviceId].location = "Hallway";
	dataStream[deviceId].startTime = Date.now();
	dataStream[deviceId].prediction = 'I';
	dataStream[deviceId].lastUpdated = Date.now();
}

function reset(deviceId) {
	dataStream[deviceId] = {};
}

function updateLocation(deviceId, roomName) {
    const location_temp = dataStream[deviceId].location;

    // a new room has been detected, update wait time for the old room
    // Note: only update when none of fields are missing
    // 6 elements are: patientName, deviceId, bpm, alarm, location, startTime
    // if (Object.keys(dataStream[list[0]]).length === 6) {
    //     const filter = {
    //         patientId: list[0], 
    //         patientName: dataStream[list[0]].patientName,
    //         today: getToday()
    //     }; 
    //     const update = {
    //         "$push": { 
    //             "locations": {
    //                 "Room": dataStream[list[0]].location,
    //                 "duration": Date.now() - dataStream[list[0]].startTime,
    //                 "startTime": dataStream[list[0]].startTime
    //             } 
    //         }
    //     };    
    //     updateDB(filter, update);
    // }

    if (location_temp === roomName) {
        // if the old location (in local dataStream variable) is equal to incoming location,
        // location is read the 2nd time; assign "Hallway" as location
        dataStream[deviceId].location = 'Hallway';
        dataStream[deviceId].startTime = Date.now();
    } else {
        // if incoming location is not equal to old location,
        // assign the incoming location and set the start time
        dataStream[deviceId].location = roomName;
        dataStream[deviceId].startTime = Date.now();
    }
    dataStream[deviceId].lastUpdated = Date.now();
}

function updateBPM(deviceId, bpm) {

   // here to process bpm strings
    dataStream[deviceId].bpm = bpm;

    // if bpm is meets a threshold, assign alarm value accordingly.
    if (bpm >= 90) {
        dataStream[deviceId].alarm = 2;
    } else if (bpm >= 20) {
        dataStream[deviceId].alarm = 1;
    } else {
        dataStream[deviceId].alarm = 0;
    }
  
    // if patientId is not in bpmBuffer, create an empty object
    // dataStream[deviceId].bpmBuffer.push(bpm);


    ////////////////////////////// TO DATABASE /////////////////////////////
    // if (bpmBuffer[list[0]].length === 10) {

    //     // after collected 10 bpms, compute bpm avg
    //     const avg = arr => arr.reduce((a,b) => parseInt(a)+parseInt(b), 0) / arr.length;
    //     const bpmAvg = Math.floor(avg(bpmBuffer[list[0]]));

    //     // clear list once getting the avg for bpm
    //     bpmBuffer[list[0]] = [];

    //     // insert/update MongoDB 
    //     const filter = { 
    //         patientId: list[0], 
    //         patientName: dataStream[list[0]].patientName,
    //         today: getToday()
    //     };
    //     const update = {
    //         "$push": { "bpm": bpmAvg }
    //     };

    //     updateDB(filter, update);
    // }
    dataStream[deviceId].lastUpdated = Date.now();
}

function updatePrediction(deviceId, prediction) {
	dataStream[deviceId].prediction = prediction;
	dataStream[deviceId].lastUpdated = Date.now();
}

function getDataStream() {
	return dataStream;
}

function getPatientData(deviceId) {
	return dataStream[deviceId];
}

function parseData(deviceId) {
	const json_str = { 
		deviceId: deviceId,
	    patientId: dataStream[deviceId].patientId,
	    patientName: dataStream[deviceId].patientName,
	    location: dataStream[deviceId].location,
	    bpm: dataStream[deviceId].bpm,
	    alarm: dataStream[deviceId].alarm,
	    startTime: dataStream[deviceId].startTime,
	    prediction: dataStream[deviceId].prediction
	};
	console.log(json_str);
	return json_str;
}

///////////////// DEBUG //////////////////
function debugDataStream() {
	for (let key in dataStream) {
		console.log("deviceId: ", key);
		console.log("patientId: ", dataStream[key].patientId);
		console.log("patientName: ", dataStream[key].patientName);
		console.log("BPM: ", dataStream[key].bpm);
		console.log("alarm: ", dataStream[key].alarm);
		console.log("location: ", dataStream[key].location);
		console.log("startTime: ", dataStream[key].startTime);
		console.log("prediction: ", dataStream[key].prediction);
	}
}

async function updateDB(filter, update) {
    await Day.findOneAndUpdate(filter, update, {
        upsert: true
    });
}

function getToday() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timestamp = startOfDay / 1000;

    return timestamp;
}

module.exports = { 
	initializePatient, 
	reset,
	updateLocation,
	updateBPM,
	updatePrediction,
	debugDataStream,
	getPatientData,
	parseData,
	getDataStream
};
