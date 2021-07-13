# TEAMSCLONE

This repository houses code for the **Microsoft Teams Clone web app** created as a part of the **Microsoft Engage 2021 Mentorship Program**.

## What the app does

This code demonstrates a client/server architecture running on `Node.js`, that enables two users to setup up a video conference. The app makes use of `Socket.IO` and `WebRTC`.

When a user visits http://localhost:8080/, he/she is prompted to enter the name of the room. If a room with that name exists, the user joins; or else the user creates a new room.

## How to run the code

* Clone the repository 
  ~~~~
  $ git clone https://github.com/dhritigarg02/MTClone
  ~~~~
* ~~~~
  $ cd MTClone
  ~~~~
* Install all the required dependencies
  ~~~~
  $ npm install
  ~~~~
* Start the server
  ~~~~
  node index.js
  ~~~~
* Access the app from a WebRTC capable browser through http://localhost:8080/

### Link to the Video Demo

https://youtu.be/BfFZvONiCTg

