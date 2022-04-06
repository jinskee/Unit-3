// Execute script when window is loaded
window.onload = setMap();

//Set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 960,
        height = 460;

    //create a new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area (choropleth needs equal area) centered on United States
    var projection = d3
        .geoAlbers()
        .center([0, 51])
        .rotate([99, 0, 0])
        .parallels([18, 47])
        .scale(500)
        .translate([width / 2, height /2]);

    //create a path generator         
    var path = d3.geoPath().projection(projection); 

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
        //var states = topojson.feature(unitedStates, unitedStates.objects.States);
        var states = topojson.feature(unitedStates, unitedStates.objects.States).features;

        
        var graticule = d3.geoGraticule().step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule lines
        var gratLines = map
            .selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

        //add US regions to the map 
        var regions = map.selectAll(".regions")
            .data(states)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.adm1_code;
            })
            .attr("d", path);

        //examine the results 
        console.log(states)
    }
}
