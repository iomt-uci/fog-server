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
	dataStream[deviceId].bpmHistory = [0,0,0,0,0];
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

    // here to process bpm strings; treat list like a queue of 5 elements
    dataStream[deviceId].bpm = bpm;
    // pop the front element; insert bpm at the end;
    dataStream[deviceId].bpmHistory.shift();
    dataStream[deviceId].bpmHistory.push(bpm);

    // red = high rate; green = normal; orange = lower; gray = none
    let counter_red = 0;
    let counter_orange = 0;
    let counter_gray = 0;

    // loop through each element in bpmHistory; counter the number of instances for each scenario
    for (let beat of dataStream[deviceId].bpmHistory) {
    	console.log(beat);
    	if (beat >= 90) {
    		counter_red += 1;
    	} else if (beat >= 80) {
    		continue;
    	} else if (beat >= 20) {
    		counter_orange += 1;
    	} else {
    		counter_gray += 1;
    	}
    }

    // counter = 5 means the heart beat has met the <condition> 5 times
    // if none of the counters = 5, heart beat is normal
    // e.g. 85, 90, 100, 92, 87
    // counter_gray = 0, counter_orange = 2, counter_red = 1, heart beat is still normal
    if (counter_gray === 5) {
    	dataStream[deviceId].alarm = 0;
    } else if (counter_orange === 5) {
        dataStream[deviceId].alarm = 1;
    } else if (counter_red === 5) {
        dataStream[deviceId].alarm = 3;
    } else {
    	dataStream[deviceId].alarm = 2;
    }

    // reset counters
    counter_red = 0;
    counter_orange = 0;
    counter_gray = 0;

  
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
