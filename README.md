# screen-recorder
A small MERN web app that records your browser tab or window along with microphone audio.
Users can start/stop recording,preview that result, download the video, and upload it to a backend with SQL storage. Here The Maximum recording Length is 3 minutes.
**FEATURES**
**FRONTEND(React)**
*Record Screen 
*mic audio
*Preview recording before saving
*Download as .Webm
*Upload recording to backend
**BACKEND(Node,Express,SQL)**
*POST/api/Recordings
*GET/api/Recordings
*GET/api/recordings/:id 
*store metadata in SQL
**TECK STACK**
*FrontEnd:React(Vite)
*Backend:Node.js+Express
*DataBase:SQL
styling:CSS
**APIs Used**
*navigator.mediaDevices.getDisplayMedia()
*navigator.mediaDevices.getUserMedia()
MediaRecorder
