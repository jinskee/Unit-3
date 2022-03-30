// Execute script when window is loaded
window.onload = setMap();

//Set up choropleth map
function setMap(){

    //use Promise.all to parallelize asynchronous data loading

    var promises =[
        d3.csv("data/publiclandOwnership.csv"),
        d3.json("data/States.topojson"),
    ];

    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            unitedStates = data[1];
        //console.log(csvData)
        //console.log(unitedStates)

        //translate United States topoJson
        var states = topojson.feature(unitedStates, unitedStates.objects.States);
        //var states = topojson.feature(unitedStates, unitedStates.objects.States).features;

        //examine the results 
        console.log(states)
    }
}
