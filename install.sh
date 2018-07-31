#!/bin/bash

# Install erlang
wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb && sudo dpkg -i erlang-solutions_1.0_all.deb
sudo apt-get update
sudo apt-get install esl-erlang -y
sudo apt-get install elixir -y 

# Install java
sudo apt install default-jre -y 
sudo apt install default-jdk -y

#Ant
sudo apt install ant -y

# Create folder structure 
mkdir master
mkdir master/abs
cd ~/ABS-visualizations/master/abs

# Clone abs
git clone https://github.com/abstools/abstools.git
cd abstools/frontend

# Build
ant dist

# Install hyvar
cd ~/ABS-visualizations/master/abs
git clone https://github.com/HyVar/abs_optimizer.git

# Install meteor 
curl https://install.meteor.com/ | sh

# Install node 
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Meteor Up for easy deployment 
sudo npm install --global mup

cd ~/ABS-visualizations/meteor/master
sudo npm install
sudo npm update