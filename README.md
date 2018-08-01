# Visualization support for ABS
Running on the Meteor platform and bundled with ABS toolchain and HyVar project. 
Created as a part of my master thesis at the University of Oslo. The application utilizes Plotly.js to create visual representations of ABS data.

https://github.com/plotly/plotly.js

https://github.com/abstools/abstools

https://github.com/HyVar/abs_optimizer



## Steps for running the environment
1. Inside project folder set permissions to run install script `chmod +x install.sh`
2. Run install script: `sudo ./install.sh`
3. After finished installation set permissions on .meteor folder: `sudo chown -R $USER ~/.meteor`
4. To run meteor: `cd meteor/master/ && meteor`

Make sure the server is able to handle connections on port 3000. MongoDB utilizes port 27017/27018.

To make fetch requests against a running model-API, use a browser extension which enables CORS and adds to header response 'Allow-Control-Allow-Origin: *'. 
