//Wrap everything is immediately invoked anonymous function so nothing is in global scope
(function (){
    
    //Pseudo-global variables
    var attrArray = ["Nat'l Wildlife Refuge", "Bureau of Land Mgmt", "Forest Service", "National Park Service", "State owned"]; //List of attributes 
    var expressed = attrArray[0]; //initial attribute
    var numericClasses; 
    
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,//0.425,
        chartHeight = 550,
        leftPadding = 50, 
        rightPadding = 2,
        topBottomPadding = 1,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
    //color classes as global variable
    var colorClasses = [
        "#fef0d9",
        "#fdcc8a",
        "#fc8d59",
        "#e34a33",
        "#b30000"
        ];

    //create a scale to size bars proportionally to frame for axis
    var yScale = d3.scaleLinear().range([chartHeight, 0]).domain([-2000, 75000]);
    
    // Begin script when window is loaded
    window.onload = setMap();

    //Set up choropleth map 
    function setMap(){
        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 550;//Set up choropleth map
    

        //create a new svg container for the map
        var map = d3
            .select("#map") //was body
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area (choropleth needs equal area) centered on United States
        var projection = d3
            .geoAlbersUsa()
            .scale(850)
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


            //Translate topoJson
            var canadaCountries = topojson.feature(canada, canada.objects.canada),
                states = topojson.feature(unitedStates, unitedStates.objects.States).features;    
 

            //add Canada countries to map****Do I want to keep?
            /*var countries = map
                .append("path")
                .datum(canadaCountries)
                .attr("class", "countries")
                .attr("d", path);*/

            states = joinData(states, csvData);

            var colorScale = makeColorScale(csvData);

            //call function
            setEnumerationUnits(states,map,path,colorScale);

            //add coordinated visualization to the map
            setChart(csvData, colorScale);
            
            //add dropdown box
            createDropdown(csvData);

            //add legend
            createLegend(csvData, expressed, colorScale); 

             

        };

    };
    //leave out graticules 
    /*function setGraticule(map,path){
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
    }*/

    //function to join topojson(geojson) and csv 
    function joinData(states,csvData){
        //loop through the csv to assign each set of csv attribute values to geojson region
        for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.STATE_NAME; //the CSV primary key
        
        //loop through csv to assign each set of csv attribute values to geojson region
            for (var a = 0; a < states.length; a++) {
                var geojsonProps = states[a].properties; //the current region geojson properties 
                var geojsonKey = geojsonProps.STATE_NAME; //the topojson primary key

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
        
        return states;

    }
    //function to create color scale generator 
    function makeColorScale(data){
        
        //set color classes as psuedo-global variable
        /*var colorClasses = [
            "#fef0d9",
            "#fdcc8a",
            "#fc8d59",
            "#e34a33",
            "#b30000"
            ];*/
        
        //create color scale generator 
        var colorScale = d3
            .scaleQuantile() //for quantile breaks 
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i < data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };
        
        //Tried using natural breaks, opted for quantile 
        /*//cluster data using ckmean clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums 
        domainArray = clusters.map(function(d){
            return d3.min(d);
        });

        numericClasses = clusters.map(function(d){
            return d3.max(d);
        });*/
        colorScale.domain(domainArray); //was domain array
        
        numericClasses = colorScale.quantiles()


        //remove first value from domain array to create class breakpoints 
        domainArray.shift();

        //assign array of last 4 cluster minimums as domain 
        //colorScale.domain(domainArray);

        return colorScale;
    };

    function setEnumerationUnits(states,map,path,colorScale){
        //add states to map 
        //add US regions to the map 
        var regions = map
            .selectAll(".regions")
            .data(states)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.STATE_NAME;
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
            })
            .on("mouseover", function (event, d) {
                highlight(d.properties);
            })
            .on("mouseout", function (event, d) {
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);

        var desc = regions.append("desc").text('{"stroke": "#000", "stroke-width": "0.5px"}');
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale){

        //create a second svg element to hold the bar chart
        var chart = d3
            .select("#chart") //was body
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        //create a rectangle for chart background fill
        var chartBackground = chart
            .append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);


        var yAxis = d3.axisLeft(yScale);

        var axis1 = chart.append("g")
            .attr("class", "axis1")
            .attr("transform", "translate(50,0)")
            .call(yAxis)
        
        
        //set bars for each state
        var bars = chart
            .selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed];
            })
            .attr("class", function(d){
                return "bar " + d.STATE_NAME;
            })
            .attr("width", chartInnerWidth / csvData.length-2)
            .on("mouseover", function (event, d){
                highlight(d);
            })
            .on("mouseout", function (event,d){
                dehighlight(d)
            })
            .on("mousemove", moveLabel);
            
            

        //create a text element for the chart title
        var chartTitle = chart
            .append("text")
            .attr("x", 120)
            .attr("y", 40)
            .attr("class", "chartTitle");
            //.text("Number of " + expressed[0] + " in each region");
        
        updateChart(bars, csvData.length, colorScale);
       //create vertical axis generator
        //var yAxis = d3.axisLeft().scale(yScale);

        //place axis
        //var axis = chart.append("g").attr("class", "axis").attr("transform", translate).call(yAxis);

        //create frame for chart border
        var chartFrame = chart
            .append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate); 

        var desc = bars.append("desc").text('{"stroke": "none", "stroke-width": "0px"}');
    };

    //function to create a dropdown menu for attribute selection 
    function createDropdown(csvData) {
        //add select element
        var dropdown = d3
            .select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData);
            });

        //add initial option
        var titleOption = dropdown
            .append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute")

        var attrOptions = dropdown  
            .selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){
                return d;
            })
            .text(function(d){
                return d;
            });
        
    }

    //dropdown change listener handler
    function changeAttribute(attribute,csvData){
        //change the expressed attribute
        expressed = attribute;

        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var regions = d3.selectAll(".regions")
            .transition()
            .duration(1000)
            .style("fill", function(d){
                var value = d.properties[expressed];
                if (value) {
                    return colorScale(value);
                } else {
                    return "#ccc";
                }
        });
        
        var array = [];
        csvData.forEach(data => {
            if (data[expressed]){
                array.push(data[expressed])    
            
        }});

        var max = Math.max(...array);
        var min = Math.min(...array);

        yScale = d3.scaleLinear()
            .range([chartHeight, 0])
            .domain([-2000, max]);

        var yAxis = d3.axisLeft(yScale);

        var axis2 = d3.select(".axis1")
            .attr("transform", "translate(50,0)")
            .call(yAxis)
        

        //re-sort, resize, and recolor bars
        var bars = d3   
            .selectAll(".bar")
            //re-sort bars
            .sort(function(a, b){
                return b[expressed] - a[expressed];
            })
            .transition() //add animation 
            .delay(function(d, i){
                return i * 20;
            })
            .duration(500);

        updateChart(bars, csvData.length, colorScale);

        createLegend(csvData, expressed, colorScale);

    }

    //function to update bars with data 
    function updateChart(bars, n, colorScale){
        //position bars 
        bars.attr("x", function (d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
            //size/resize bars
            .attr("height", function (d, i){
                return 550 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            //color/recolor bars
            .style("fill", function (d){
                var value = parseFloat(d[expressed]);
                if (value) {
                    return colorScale(value);
                } else {
                    return "#ccc";
                }
            });
        
        //at the bottom of updateChart()...add text to chart title
        var chartTitle = d3
            .select(".chartTitle")
            .text(expressed + " acres (000's) per State");
    }

    //function to highlight enumeration units and bars
    function highlight(props){
        //change the stroke
        var selected = d3
            .selectAll("." + props.STATE_NAME)
            .style("stroke", "blue")
            .style("stroke-width", "3");
        setLabel(props);
    }

    //function to reset the element style on mouseout
    function dehighlight(props){
        var selected = d3   
            .selectAll("." + props.STATE_NAME)
            .style("stroke", function(){
                return getStyle(this, "stroke");
            })
            .style("stroke-width", function(){
                return getStyle(this, "stroke-width");
            });

        function getStyle(element, styleName){
            var styleText = d3
                .select(element)
                .select("desc")
                .text();

            var styleObject = JSON.parse(styleText);

            return styleObject[styleName];
        }
        //remove info label
        d3.select(".infolabel")
            .remove();
    }

    //add legend that changes with attribute/classification scheme
    function createLegend(csvData, expressed, colorScale){ //domainArray, min, max) {
        console.log(legend)
        var scale = d3.scaleQuantile()
            .domain(numericClasses)
            .range(colorClasses);

        d3.select("#legend").append("svg").attr("class", "legendBox");

        var legend = d3.select("svg.legendBox");

        legend.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(10,15)");

        var colorLegend = d3.legendColor() 
            .shapeWidth(40)
            .orient("vertical")
            .ascending(true)
            .scale(colorScale)
            .title(expressed + " acres (000's)")
            .labels(d3.legendHelpers.thresholdLabels)

        legend.select(".legend")
            .call(colorLegend);
    };

    //function to create dynamic label
    function setLabel(props){
        console.log("here!");
        //label content
        var labelAttribute = "<h1>" + props[expressed] + "</h1><b>" + expressed + " (000's acres)" + "</b>";

        //create info label div
        var infolabel = d3  
            .select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.STATE_NAME + "_label")
            .html(labelAttribute);

        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.STATE_NAME);
    };

    //function to move info label with mouse
    function moveLabel() {
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = event.clientX + 10,
            y1 = event.clientY - 75;
            x2 = event.clientX - labelWidth - 10,
            y2 = event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;

        //vertical label coordinate, testing for overflow
        var y = event.clientY < 75 ? y2 : y1;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");


    }

})();
