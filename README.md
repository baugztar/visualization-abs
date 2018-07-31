# Visualization support for ABS
Running on the Meteor platform and bundled with ABS toolchain and HyVar project. 
Created as a part of my master thesis at the University of Oslo.

https://github.com/abstools/abstools

https://github.com/HyVar/abs_optimizer



## Steps to running the environment
1. Inside project folder set permissions to run install script `chmod +x install.sh`
2. Run install script: `sudo ./install.sh`
3. After finished installation set permissions on .meteor folder: `sudo chown -R $USER ~/.meteor`
4. To run meteor: `cd meteor/master/ && meteor`

Make sure the server is able to handle connections on port 3000.
