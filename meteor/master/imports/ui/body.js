import { Template } from 'meteor/templating';
import { FullSimulations } from '../api/simulations.js';
import { Images } from './graphs.js'
import { ReactiveVar } from 'meteor/reactive-var'
import Plotly from '../../imports/api/plotly-latest.min.js'


import './body.html';

Template.body.created = function(){
	this.subscribe("simulations")
	this.update = new ReactiveVar(false)
}

Template.delete.created = function() {
    this.simulations = new ReactiveVar([])
}

Template.body.events({
	'click #btnfetch'(event){
	var instance = Template.instance()
	var inputuri = prompt("Please enter running simulation url, example: 'http://158.39.77.55:8080'")	
	// SET uri to match running Model-API server, example: 'http://158.39.77.55:8080'.
	if (inputuri == null || inputuri == ""){
		console.log("Cancelled..")
	}
	else {
		try {
		if(confirm("This will insert current running simulation from " + inputuri + " to database. Are you sure?")){
			if (inputuri.endsWith("/")){
				var uri = inputuri + "o/"
			}
			else {
				var uri = inputuri + "/o/"
			}
			var data = {d: []}
			var endpoints = []
			var blobs = []

			// GET Api endpoints.
			fetch(uri).then(function(response){
				return response.json();
			}).then(function(myBlob){
				for (i = 0; i < myBlob.length; i++){
					endpoints.push(uri+myBlob[i])
					blobs.push(myBlob[i])
				}
			}).then(function(){
				Promise.all(endpoints.map((request, index) => {
				return fetch(request).then((response)=>{
					return response.json();
				}).then((data)=> {
					return data;
				}).then((values)=>{
					values.namo = blobs[index]
					/* Only insert objects that actually contain dataset(s) (In our case, arrays) */
					found = false
					Object.keys(values).forEach(function(key){
						if(values[key] && values[key].constructor === Array){
							found = true
						}
					})
					if(found){
						data.d.push(values)
					}
				}).catch(console.error.bind(console))	
				})).then(function(){
					for(i = 0; i< data.d.length; i++){
						if(data.d[i].instances){
							// Parse instance names that is containing "."
							str = JSON.stringify(data.d[i].instances)
							data.d[i].instances = str
						}
					}
				FullSimulations.insert({data: data.d, inserted: new Date()})
				alert("Current running model at " + uri + " inserted to db.")
				// Forces update of UI
				instance.update.set(true)
				instance.update.set(false)
				Tracker.flush()
				})
			});
			}
			}
			catch(err){
				console.log(err)
			}	
		}
	}	
});


Template.body.helpers({
  simulations(){
	return FullSimulations.find({});
}
});

Template.delete.helpers({
	simulations(){
		return FullSimulations.find({});
	},
	findSimulationById(id){
		return FullSimulations.findOne({_id: new Mongo.ObjectID(id)})
	},
	deleteSimulation(id){
		return FullSimulations.remove({_id: new Mongo.ObjectID(id)})
	}
})

Template.delete.events({
	'click #btndelete'(event){
		element = document.getElementById('deletesimulations')
		val = element.options[element.selectedIndex].value
   		var del = val.split("\"")[1]
		FullSimulations.remove({_id: new Mongo.ObjectID(del)})
		Tracker.flush()
		alert("Simulation deleted")
	}
})
