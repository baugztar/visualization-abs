import { Template } from 'meteor/templating';
import { FullSimulations } from '../../imports/api/simulations.js';
import { Mongo } from 'meteor/mongo'
import { ReactiveVar } from 'meteor/reactive-var'
import './graphs.html'
import { Tracker } from 'meteor/tracker'
import Plotly from '../../imports/api/plotly-latest.min.js'
import jquery from 'jquery'


// Define instance reactive variables
Template.sims.created = function() {
	this.methods = new ReactiveVar([])
    this.dataset = new ReactiveVar([])
    this.plottype = new ReactiveVar("scattergl")
    this.type = new ReactiveVar("lines")
    this.selectedmethod = new ReactiveVar(["default"])
    this.initiated = new ReactiveVar(false)
    this.selecteddataset = new ReactiveVar([])
    this.methodnames = new ReactiveVar([])
    this.methodselected = new ReactiveVar(false)
    this.datasetselected = new ReactiveVar(false)
    this.filter = new ReactiveVar(false)
    this.filterOperator = new ReactiveVar([])
    this.filterRange = new ReactiveVar([])
    this.coordinates = new ReactiveVar("")
    this.statistics = new ReactiveVar("")
    this.clicked = new ReactiveVar(false)
    this.placeholder = new ReactiveVar(true)
    this.instanciated = new ReactiveVar(false)
    this.attachedWindowListener = new ReactiveVar(false)
}

Template.subplotTemplate.created = function() {
    this.simulations = new ReactiveVar([])
    this.dataset = new ReactiveVar([])
    this.fulldataset = new ReactiveVar([])
    this.placeholder = new ReactiveVar(true)
    this.attachedWindowListener = new ReactiveVar(false)
    this.instanciated = new ReactiveVar(false)
}

Template.sims.rendered = function() {
    this.autorun(() => {
        var type = document.getElementById('typeselect')
        var plot = document.getElementById('plotselect')
        var selectedmethod = document.getElementById('method')
        var selecteddataset = document.getElementById('dataset')

        var instance = Template.instance()
        let methodnames = []
        let methods = []

        let simulations = FullSimulations.find().fetch();
        for(i=0; i<simulations.length; i++){
            for(j=0; j<simulations[i].data.length; j++){
                if(simulations[i].data[j].namo && !methodnames.includes(simulations[i].data[j].namo)){
                        methods.push(simulations[i].data[j])
                        methodnames.push(simulations[i].data[j].namo)
                }
            }
        }
        instance.methods.set(methods)
        instance.methodnames.set(methodnames)

        // Initial render variable set
        if(!instance.initiated.get()){
            instance.initiated.set(true)
        }

        type.onchange = function() {
            instance.type.set(type.options[type.selectedIndex].value)
            if(instance.methodselected.get() && instance.datasetselected.get()){
                if(instance.plottype.get() != "filter"){
                    renderplot("simList", instance.plottype.get(), instance.type.get(), instance.selectedmethod.get(), instance.selecteddataset.get(), instance.filterRange.get(), instance.filterOperator.get(), instance)
                }
            }  
        }
        plot.onchange = function() {
            instance.plottype.set(plot.options[plot.selectedIndex].value)
            if(instance.methodselected.get() && instance.datasetselected.get()){
                if(instance.plottype.get() == "filter"){
                    instance.filter.set(true)
                    var obj = getMinMax(instance.selectedmethod.get(), instance.selecteddataset.get())
                    Tracker.flush()
                    var filterRange = document.getElementById('filterRange')
                    var filterOperator = document.getElementById('radioform')
                    if(obj.found){
                        filterRange.min = obj.min
                        filterRange.max = obj.max
                        filterRange.value = Math.ceil((filterRange.min + filterRange.max)/2)
                    }
                    instance.filterRange.set(filterRange.value)
                    instance.filterOperator.set(document.querySelector('input[name="filterType"]:checked').value)

                    filterRange.onchange = function(){
                        instance.filterRange.set(filterRange.value)
                        instance.filterOperator.set(document.querySelector('input[name="filterType"]:checked').value)
                        renderplot("simList", instance.plottype.get(), instance.type.get(), instance.selectedmethod.get(), instance.selecteddataset.get(), instance.filterRange.get(), instance.filterOperator.get(), instance)
                    }

                    filterOperator.onchange = function(){
                        instance.filterRange.set(filterRange.value)
                        instance.filterOperator.set(document.querySelector('input[name="filterType"]:checked').value)
                        renderplot("simList", instance.plottype.get(), instance.type.get(), instance.selectedmethod.get(), instance.selecteddataset.get(), instance.filterRange.get(), instance.filterOperator.get(), instance)

                    }
                }
                else
                {
                    instance.filter.set(false)
                }
                renderplot("simList", instance.plottype.get(), instance.type.get(), instance.selectedmethod.get(), instance.selecteddataset.get(), instance.filterRange.get(), instance.filterOperator.get(), instance)
                }
            else {
                if(instance.plottype.get() == "filter"){
                    instance.filter.set(true)
                }
            }
        }

        selectedmethod.onchange = function() {
            // Makes sure our user can select disabled dropdown for dataset once component is selected.
            selecteddataset.disabled=false
            instance.methodselected.set(true)

            let getD = {}
            instance.selectedmethod.set(selectedmethod.options[selectedmethod.selectedIndex].value)
            data = instance.methods.get()
            let fulldataset = { d: [] }

            // Makes sure our users can select disabled dropdown menus if dataset is selected
            if (instance.methodselected.get() && instance.datasetselected.get()){
                plot.disabled=false;
                type.disabled=false;
            }
            for (i = 0; i < data.length; i++) {
                if (data[i].namo == selectedmethod.options[selectedmethod.selectedIndex].value){
                    getD = data[i]
                }
            }
            Object.keys(getD).forEach(function(key) {
                if (Array.isArray(getD[key])) {
                    if (getD[key].length > 0) {
                        obj = { key: key }
                        fulldataset.d.push(obj);
                    }
                }
            });
            instance.dataset.set(fulldataset)

            // Forces re-render of DOM to ensure no computations are pending.
            // Removing this will cause wrong data being passed when switching between differing datasets (which have different methods).
            Tracker.flush()

            if (instance.selectedmethod.get() && instance.selecteddataset.get().length >0) {
                instance.selecteddataset.set(selecteddataset.options[selecteddataset.selectedIndex].value)
                if(instance.filter.get()){
                    var filterRange = document.getElementById('filterRange')
                    var obj = getMinMax(instance.selectedmethod.get(), instance.selecteddataset.get())
                    if(obj.found){
                        filterRange.min = obj.min
                        filterRange.max = obj.max
                        filterRange.value = Math.ceil((filterRange.max / 2))
                    }
                instance.filterRange.set(filterRange.value)
                instance.filterOperator.set(document.querySelector('input[name="filterType"]:checked').value)
                }
                renderplot("simList", instance.plottype.get(), instance.type.get(), instance.selectedmethod.get(), instance.selecteddataset.get(), instance.filterRange.get(), instance.filterOperator.get(), instance)
            }
        },

        selecteddataset.onchange = function() {
            instance.datasetselected.set(true)
            currentDataSet = selecteddataset.options[selecteddataset.selectedIndex].value

            instance.selecteddataset.set(currentDataSet)
            Tracker.flush()
            // Again makes sure our users can select disabled dropdown menus if dataset is selected
            if (instance.methodselected.get() && instance.datasetselected.get()){
                plot.disabled=false;
                type.disabled=false;
                if(instance.filter.get()){
                    var filterRange = document.getElementById('filterRange')
                    var obj = getMinMax(instance.selectedmethod.get(), instance.selecteddataset.get())
                    if(obj.found){
                        filterRange.min = obj.min
                        filterRange.max = obj.max
                        // Set default range slider value. Will be defaulted to the median of values.
                        filterRange.value = Math.ceil((filterRange.min + filterRange.max)/2)
                    }
                instance.filterRange.set(filterRange.value)
                instance.filterOperator.set(document.querySelector('input[name="filterType"]:checked').value)
                }
                renderplot("simList", instance.plottype.get(), instance.type.get(), instance.selectedmethod.get(), instance.selecteddataset.get(), instance.filterRange.get(), instance.filterOperator.get(), instance)
            }
           
        }
    });
}

Template.subplotTemplate.rendered = function(){
    this.autorun(() => {
        var instance = Template.instance()
        var select = document.getElementById("subplotsimulations")
        var subplotdataset = document.getElementById("subplotdataset")
        var el = document.getElementById("subplot")

        select.onchange = function() {
            var obj = fetchData(select.options[select.selectedIndex].value)
            ddd = []
            arr = []
            getD = {}
            datasetName = ""
            for (i = 0; i < obj.data.length; i++) {
                ddd.push(obj.data[i].namo)
            }
            instance.dataset.set(ddd)
            instance.fulldataset.set(obj)

            dataset = instance.fulldataset.get().data

            Tracker.flush()
        }

        subplotdataset.onchange = function(){
            getD = {}
            dataset = instance.fulldataset.get().data
            arr = []
            datasetName = ""

            for (i = 0; i < dataset.length; i++) {
                if (dataset[i].namo == subplotdataset.options[subplotdataset.selectedIndex].value){
                    getD = dataset[i]
                    datasetName = dataset[i].namo
                }
            }

            Object.keys(getD).forEach(function(key) {
                if (Array.isArray(getD[key])) {
                    if (getD[key].length > 0 && typeof getD[key][0] != "string") {
                        arr.push({key: key, value: getD[key]});
                    }
                }
            });

            // Remove placeholder initially
            if(instance.placeholder.get() == true){
                instance.placeholder.set(false)
            }
            renderSubplot(arr, el, datasetName, instance)
        }
    });
}

renderSubplot = (data, element, name, instance) => {
    var plotdata = []
    numSubPlots = data.length 

    // Create responsive view. ref: https://plot.ly/javascript/responsive-fluid-layout/
    d3 = Plotly.d3;
        var WIDTH_IN_PERCENT_OF_PARENT = 100;
        var HEIGHT_IN_PERCENT_OF_PARENT = 100;
        var gd3 = d3.select("div[id='subplot']")
        .style({
            width: WIDTH_IN_PERCENT_OF_PARENT + '%',
            'margin-left': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 2 + '%',
            height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
            'margin-top': (100 - HEIGHT_IN_PERCENT_OF_PARENT) / 2 + 'vh'
        });
    var el = gd3.node();

    // Get ranges for the subplot domain.
    iter = 1
    ranges = getSubRanges(numSubPlots)
    data.forEach(function(k) {
        trace = {
            y : k.value,
            label : k.key,
            type: "scatter",
            name: k.key
        }
        if (iter >= 2){
            trace.xaxis = "x" + iter.toString();
            trace.yaxis = "y" + iter.toString();
        }
        plotdata.push(trace)
        iter += 1
    });
    
    layout = getSubRanges(numSubPlots)
    layout.autosize = true
    layout.title = 'Subplot diagram - showing ' + name
    
    if (!instance.instanciated.get()){
        Plotly.newPlot(el, plotdata, layout)
    }
    else {
        Plotly.react(el, plotdata, layout)
    }
    if (!instance.attachedWindowListener.get()){
        window.addEventListener('resize', function() {
             Plotly.Plots.resize(el);        
        });
        instance.attachedWindowListener.set(true)
    }
}

// Calculate ranges of subplots in the domain
getSubRanges = (num) => {
    obj = {}
    range = Math.floor((1/num) * 100)/100;
    buffer = Math.floor((1/(num+1)) * 100)/100;

    air = range - buffer
    arr = []
    counterLow = 0
    counterHigh = (0 + buffer)

    for(i = 0; i<num; i++){
      d = []
      d.push(counterLow)
      d.push(counterHigh)
      domain = {}
      domain.d = d
      arr.push(domain)
      counterLow += range
      counterHigh += range 
    }

    for(j = 0; j < arr.length; j++){
        if (j == 0) {
            y =  {domain: arr[j].d}
            obj['yaxis' + (j+1).toString()] = y
        }

        else {
          x =  {anchor: 'y'+(j+1).toString()}
          y =  {domain: arr[j].d}
          obj['xaxis' + (j+1).toString()] = x        
          obj['yaxis' + (j+1).toString()] = y
        }
    }
    return obj
}

// Gets the minimum and maximum values, used for filtering view
getMinMax = (instancemethod, instancedataset) => {
    var simul = FullSimulations.find().fetch();
    obj = {}
    obj.found = false
        while(obj.found == false){
            for (i = 0; i < simul.length; i++) {
                for(j = 0; j< simul[i].data.length; j++){
                    if (!obj.found){
                        if (simul[i].data[j].namo == instancemethod){
                            obj.min = Math.min(...simul[i].data[j][instancedataset])
                            obj.max = Math.max(...simul[i].data[j][instancedataset])
                            obj.found = true
                            break
                        }
                }
            }
        }
     }
     return obj
}

renderplot = (element, type, mode, datasetName, dataset, filterRange, filterOperator, instance) => {
    try {
        var el = document.getElementById(element);
        var simul = FullSimulations.find().fetch();
        var data = []
        var filter = {}

        if(instance.placeholder.get() == true){
            instance.placeholder.set(false)
        }

        for (i = 0; i < simul.length; i++) {
            for(j = 0; j< simul[i].data.length; j++){
                if (simul[i].data[j].namo == datasetName){
                    var stringData = ""
                    var stringArray = []
                    var traceA = {
                        mode: mode,
                        type: type,
                        name: simul[i].inserted.toGMTString(),
                        fullData: simul[i].data[j],
                    };
                if (type == "bar"){
                        traceA.y = simul[i].data[j][dataset];
                        traceA.type = 'bar';
                        }
                else if (type == "histogram"){
                        // Flip to trace.x for vertical histogram
                        traceA.autobinx = true
                        traceA.x = simul[i].data[j][dataset];
                }
                else if(type == "filter"){
                    traceA.type = "scatter",
                    traceA.y = simul[i].data[j][dataset],
                    traceA.mode = 'markers',

                    traceA.transforms = [{
                        type: 'filter',
                        target: 'y',
                        operation: filterOperator,
                        value: filterRange
                    }]
                    filter.value = traceA.transforms[0].value
                    filter.operation = traceA.transforms[0].operation
                }
                else {
                        traceA.y = simul[i].data[j][dataset];
                    }

                if(type == "filled"){
                    // Can also fill with "tozerox", "tonexty" | "tonextx". Check Plotly.js API for complete reference.
                    traceA.mode = "none"
                    if (j == 0){
                        traceA.fill = "tozeroy"
                    }
                    else{
                        traceA.fill ="tonexty"
                    }
                    traceA.type = "lines"
                }

                 Object.keys(traceA.fullData).forEach(function(key) {
                    if (!Array.isArray(traceA.fullData[key]) && typeof traceA.fullData[key] !==  "boolean" && typeof traceA.fullData[key] !== "object") {
                        stringData += (key + ": " + traceA.fullData[key] + "\n")
                        o = {}
                        o.key = key
                        o.val = traceA.fullData[key]
                        stringArray.push(o)
                    }
                });
                traceA.stringData = stringData
                traceA.stringArray = stringArray
                data.push(traceA)
                }
            }
        }
        if(type == "filter"){
            var layout = {
                title: 'Comparison diagram - showing ' + dataset + '<br> Filter values ' + filter.operation + ' ' + filter.value + ' [ ' + dataset + ']',
                hovermode: 'closest'
        };
        }
        else{
            var layout = {
                title: 'Comparison diagram - showing ' + dataset,
                hovermode: 'closest'
        };
    }   

        var myPlot = el,
        // Set dimensions of subplot view and make responsive
        d3 = Plotly.d3;
        var WIDTH_IN_PERCENT_OF_PARENT = 100;
        var HEIGHT_IN_PERCENT_OF_PARENT = 40;
        var gd3 = d3.select("div[id=simList]")
        .style({
            width: WIDTH_IN_PERCENT_OF_PARENT + '%',
            'margin-left': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 2 + '%',
            height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
        });

        var el = gd3.node();
        N = data.length,
        x = d3.range(N),
        y = d3.range(N).map(d3.random.normal())

        if(!instance.instanciated.get()){
            // Rendering new plot
            Plotly.newPlot(el, data, layout)

            // Listen for clicks on trace, will display extended data below plot
            myPlot.on('plotly_click', function(data){
                instance.clicked.set(true)
                var pts = '';
                var d = {}
                for(var i=0; i < data.points.length; i++){
                    pts = 'x = '+data.points[i].x +'\ny = '+
                    data.points[i].y.toPrecision(4) + '\n\n';
                }
                instance.coordinates.set(pts)
                instance.statistics.set(data.points[0].data.stringArray)
                });
        }
        else {
            // Restyling
            Plotly.react(el, data, layout)
        }

    // Makes sure we only attach listener to our window once
     if (!instance.attachedWindowListener.get()){
        window.addEventListener('resize', function() {
             Plotly.Plots.resize(el);        
        });
        instance.attachedWindowListener.set(true)
    }

    } catch (err){
        console.log(err)
    }
    if(!instance.instanciated.get()){
        instance.instanciated.set(true)
    }
}

fetchData = (query) => {
    let q = query.split("\"")[1]
    let t = new Mongo.ObjectID(q)
    let data = FullSimulations.findOne({ "_id": t })
    return data
}

Template.sims.helpers({
	getMethods(){
		return Template.instance().methods.get()
	},
    getDataset(){
        return Template.instance().dataset.get().d;
    },
    getMethodNames(){
        return Template.instance().methodnames.get().sort();
    },
    getFilter(){
        return Template.instance().filter.get();
    },
    getFilterRange(){
        return Template.instance().filterRange.get()
    },
    getCoordinates(){
        return Template.instance().coordinates.get();
    },
    getStatistics(){
        return Template.instance().statistics.get();
    },
    clicked(){
        return Template.instance().clicked.get();
    },
    placeholder(){
        return Template.instance().placeholder.get();
    }
})

Template.subplotTemplate.helpers({
    getSimulations(){
        return FullSimulations.find({});
    },
    getDataset(){
        let methods = Template.instance().dataset.get();
        return methods.sort();
    },
    placeholder(){
        return Template.instance().placeholder.get();
    }
})