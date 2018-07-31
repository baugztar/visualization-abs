import { Meteor } from 'meteor/meteor';
import { FullSimulations } from '../imports/api/simulations.js'


Meteor.startup(() => {
  // code to run on server at startup
  global.Buffer = global.Buffer || require("buffer").Buffer
});

Meteor.publish('simulations', function(){
	return FullSimulations.find({});
});