//Wrap everything is immediately invoked anonymous function so nothing is in global scope
(function (){
    
    var attrArray = ["NWR_acres", "BLM_acres", "USFS_acres", "NPS_acres", "USFS_acres"]; //List of attributes 
    var expressed = attrArray[0]; //initial attribute
    
    // Begin script when window is loaded
    window.onload = setMap();

    //Set up choropleth map 
    function setMap(){
        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 460;//Set up choropleth map
    

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
            d3.json("data/CanadaCountries.topojson"),
            d3.json("data/States.topojson")
            ];

        Promise.all(promises).then(callback);

        function callback(data) {
            var csvData = data[0],
                canada = data[1],
                unitedStates = data[2];
            //console.log(csvData)
            //console.log(unitedStates)

            setGraticule(map,path);


            //Translate topoJson
            var canadaCountries = topojson.feature(canada, canada.objects.canada),
                states = topojson.feature(unitedStates, unitedStates.objects.States).features;    
            //console.log(states)
            //Variables for data join

            //add Canada countries to map 
            var countries = map.append("path")
                .datum(canadaCountries)
                .attr("class", "countries")
                .attr("d", path);

            states = joinData(states, csvData);

            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(states,map,path,colorScale);

            //add coordinated visualization to the map
        	setChart(csvData, colorScale);

        };

    };

    function setGraticule(map,path){
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //Bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        //create graticule lines
        var gratLines = map
            .selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
    }

    function joinData(states,csvData){
        //loop through the csv to assign each set of csv attribute values to geojson region
        for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.STATE_FIPS; //the CSV primary key
        
        //loop through csv to assign each set of csv attribute values to geojson region
            for (var a = 0; a < states.length; a++) {
                var geojsonProps = states[a].properties; //the current region geojson properties 
                var geojsonKey = geojsonProps.STATE_FIPS; //the topojson primary key

            //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey) {
                //assign all attributes and values 
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties 
                    });
                };
            };
        };
        console.log(states)
        return states;

    }

    function makeColorScale(data){
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        //create color scale generator 
        var colorScale = d3.scaleQuantile()//d3.scaleThreshold()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i < data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //cluster data using ckmean clustering algorithm to create natural breaks
        //var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums 
        //domainArray = clusters.map(function(d){
            //return d3.min(d);
        //});
        //remove first value from domain array to create class breakpoints 
        //domainArray.shift();

        //assign array of last 4 cluster minimums as domain 
        colorScale.domain(domainArray);

        return colorScale;
    };

    function setEnumerationUnits(states,map,path,colorScale){
        //add states to map 
        //add US regions to the map 
        var regions = map.selectAll(".regions")
            .data(states)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.STATE_FIPS;
            })
            .attr("d", path)
            .style("fill", function(d){
                var value = d.properties[expressed];
                if(value){
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
                //return colorScale(d.properties[expressed]);
            });
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale){
        //chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 460;

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        var yScale = d3.scaleLinear()
            .range([0, chartHeight])
            .domain([0, 105]);
        
        //set bars for each province
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "bars " + d.STATE_FIPS;
            })
            .attr("width", chartWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartWidth / csvData.length);
            })
            .attr("height", function(d){
                return yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed]));
            }).style("fill", function(d){
                return colorScale(d[expressed]);
            });

        //annotate bars with attribute value text
        var numbers = chart.selectAll(".numbers")
            .data(csvData)
            .enter()
            .append("text")
            .sort(function(a, b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "numbers " + d.STATE_FIPS;
            })
            .attr("text-anchor", "middle")
            .attr("x", function(d, i){
                var fraction = chartWidth / csvData.length;
                return i * fraction + (fraction - 1) / 2;
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed])) + 15;
            })
            .text(function(d){
                return d[expressed];
            });

            //below Example 2.8...create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 20)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Number of " + attrArray[0] + " in each region");
    };
})();
/*            var attrArray = ["BLM_acres", "NPS_acres", "NWR_acres", "State_acres", "USFS_acres"];
            
            //loop through the csv to assign each set of csv attribute values to geojson region
            for (var i = 0; i < csvData.length; i++) {
                var csvRegion = csvData[i]; //the current region
                var csvKey = csvRegion.STATE_FIPS; //the CSV primary key
            
            //loop through csv to assign each set of csv attribute values to geojson region
                for (var a = 0; a < states.length; a++) {
                    var geojsonProps = states[a].properties; //the current region geojson properties 
                    var geojsonKey = geojsonProps.STATE_FIPS; //the topojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                    if (geojsonKey == csvKey) {
                    //assign all attributes and values 
                        attrArray.forEach(function (attr) {
                            var val = parseFloat(csvRegion[attr]); //get csv attribute value
                            geojsonProps[attr] = val; //assign attribute and value to geojson properties 
                        });
                    };
                };
            };    
            console.log(states)
            //translate United States topoJson
            //var states = topojson.feature(unitedStates, unitedStates.objects.States);
            var canadaCountries = topojson.feature(canada, canada.objects.canada),
                states = topojson.feature(unitedStates, unitedStates.objects.States).features;
            
            var graticule = d3.geoGraticule().step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

            //create graticule background
            var gratBackground = map
                .append("path")
                .datum(graticule.outline()) //bind graticule background
                .attr("class", "gratBackground") //assign class for styling
                .attr("d", path); //project graticule

            //create graticule lines
            var gratLines = map
                .selectAll(".gratLines") //select graticule elements that will be created
                .data(graticule.lines()) //bind graticule lines to each element to be created
                .enter() //create an element for each datum
                .append("path") //append each element to the svg as a path element
                .attr("class", "gratLines") //assign class for styling
                .attr("d", path); //project graticule lines


            //add canada countries countries to map
            var countries = map
                .append("path")
                .datum(canadaCountries)
                .attr("class", "countries")
                .attr("d", path);

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
            //console.log(states)
        };
    };*/
