# Fog API Documentation

## Introduction
Fog server serves as a middleware for controlling information flow at UCI Department of Radiation Oncology and aims to provide a layer of abstraction for the frontend mobile apps with API calls.

## Allowed HTTPs requests:
* GET
* POST

## Authentication
* `POST /staff-signup`
  * **body**: email, password, firstName, lastName, phoneNum
  * **Usage Frequency**: low

* `POST /staff-signin`
  * **body**: email, password
  * **returns**: auth token
  * **fallback cases**: "invalid email or password"
  * **Usage Frequency**: high
  ```javascript
  const response = await axios.post("https://iomt-uci.ngrok.io/staff-signin", { 
      email: "staff@test.com",
      password: "123"
  });
  ```

* `POST /patient-signup`
  * **body**: email, password, firstName, lastName, phoneNum
  * **Usage Frequency**: low
  * **Note**: only staff will signup an account for patients; patients will automatically link to the doctor that he/she belongs to.

* `POST /patient-signin`
  * **body**: email, password
  * **Usage Frequency**: N/A
  * **Note**: patient can sign in (a patient app in future)

* `GET /staff-name`
  * **query parameter**: N/A, will make use of auth token stored in AsyncStorage
  * **returns**: staff's full name
  * **fallback case**: staff <id> is not authenticated
  * **Usage Frequency**: medium
  * **Note**: The Account Screen calls this API so that it can display staff's name
  ```javascript
  const response = await axios.get("https://iomt-uci.ngrok.io/staff-name");
  ```

## Connect
* `GET /patient-connect`
  * **query parameter**: edgeId
  * **returns**: patient_id, patient_name, patient_display, isCalling, deviceId, isConnected: 1
  * **fallback case**: `{ isConnected: 0 }`, meaning the device is not connected to anyone
  * **Usage Frequency**: very high
  * **Note**: edge device can attach its edgeId to ask the url which patient it's currently connecting to
  ```javascript
  const response = await axios.get("https://iomt-uci.ngrok.io/patient-connect?edgeId=1");
  ```

* `POST /patient-connect`
  * **body**: phoneNumInput, deviceIdInput
  * **returns**: message indicating the success of the connection
  * **fallback cases**:
    * device <id> is not found.
    * device <id> is currently in use.
    * phone number is not found.
    * patient <name> is currently connected another device <id>.
  * **Usage Frequency**: high
  * **Note**: enter patient's phone number and edge device id that the patient is about to connect to
  ```javascript
  const response = await axios.post("https://iomt-uci.ngrok.io/patient-connect", { 
      phoneNumInput: "2003",
      deviceIdInput: "3"
  });
  ```

* `POST /patient-disconnect`
  * **body**: deviceIdInput
  * **returns**: message indicating the success of the disconnection
  * **fallback cases**:
    * device <id> not found.
    * device <id> is currently not connected to any patient.
  * **Usage Frequency**: high
  * **Note**: enter the patient's current device's id to disconnect patient from the device, fog server will therefore disregard any incoming information related to the patient
  ```javascript
  const response = await axios.post("https://iomt-uci.ngrok.io/patient-disconnect", { 
      deviceIdInput: "3"
  });
  ```  

* `GET /active-patients`
  * **query parameter**: N/A, will make use of auth token stored in AsyncStorage
  * **returns**: an array of patients that are assigned to the logged in staff
  * **fallback case**: staff <id> is not authenticated
  * **Usage Frequency**: medium
  * **Note**: The patient list screen will call this api to fetch a list of patients who are currently connected to a device (it has filtered the "inactive" patients who are not connected to any device).
  ```javascript
  // returns an array of patients
  const response = await axios.get("https://iomt-uci.ngrok.io/active-patients");
  ```

## Calling
* `POST /patient-call`
  * **body**: deviceIdInput
  * **returns**: message indicating that the patient will hear ringings shortly
  * **fallback cases**:
    * failed to initiate the call
    * patient has already been called
  * **Usage Frequency**: high
  * **Note**: the call will trigger the buzzer of the heart rate detector
  ```javascript
  const response = await axios.post("https://iomt-uci.ngrok.io/patient-call", { 
      deviceIdInput: "3"
  });
  ``` 

* `POST /patient-cancel-call`
  * **body**: deviceIdInput
  * **returns**: message indicating that the patient will stop receiving ringings shortly
  * **fallback cases**: failed to disable the call
  * **Usage Frequency**: high
  * **Note**: the cancel call will silence the buzzer of the heart rate detector
  ```javascript
  const response = await axios.post("https://iomt-uci.ngrok.io/patient-cancel-call", { 
      deviceIdInput: "3"
  });
  ``` 

## History
* `GET /bpm-history`
  * **query param**: patientId, day
  * **Note**: day is the unix timestamp of the start of today (e.g. 08/02/2020 00:00:00). This API is currently under development.
