# Fog API Documentation

## Introduction
APIs for two mobile apps in UCI Department of Radiation Oncology.

## Allowed HTTPs requests:
* GET
* POST

## Authentication
* `POST /staff-signup`
  * body: email, password, firstName, lastName, phoneNum

* `POST /staff-signin`
  * body: email, password

* `POST /patient-signup`
  * body: email, password, firstName, lastName, phoneNum
  * only staff will signup an account for patients; patients will automatically link to the doctor that he/she belongs to.

* `POST /patient-signin`
  * body: email, password
  * patient can sign in (a patient app in future)

## Connect
* `GET /patient-connect`
  * query param: edgeId
  * edge device can attach its edgeId to ask the url which patient it's connecting to

* `POST /patient-connect`
  * body: phone number, deviceId
  * enter patient's phone number and edge device id that the patient is about to connect to

* `POST /patient-disconnect`
  * body: device id
  * enter the patient's current device's id to disconnect from the patient

## History
* `GET /bpm-history`
  * query param: patientId, day
  * day is the unix timestamp of the start of today (e.g. 08/02/2020 00:00:00)



 

