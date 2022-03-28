// Execute script when window is loaded
window.onload = function(){
    //SVG dimension variables
    var w = 900, h = 500;
    //Example 1.2 line 1... Container Block
    var container = d3.select("body") //get the <body> element from the DOM
        .append("svg") //put a new svg in the body 
        .attr("width", w) //assign the width
        .attr("height", h) //assign the height 
        .attr("class", "container") //Always assign a class (as the block name) for styling and future selection
        .style("background-color", "rgba(0,0,0,0.2)"); //Only put a semicolon at the end of the block 

    var innerRect = container.append("rect") //put a new rect in the svg
        .datum(400)
        .attr("width", function(d){ // rectangle width
            return d * 2; //400 * 2 = 800
        }) 
        .attr("height", function(d){
            return d; //400 rectangle height
        })
        .attr("class", "innerRect")//class name 
        .attr("x", 50) //Position from left on the x (horizontal) axis
        .attr("y", 50) //Position from top on the y (vertical) axis
        .style("fill", "#FFFFFF"); //fill color 
        
    //var dataArray = [10, 20, 30, 40, 50]
    var cityPop = [
        {
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];

    var x = d3.scaleLinear() //create the scale
        .range([90, 750]) //output the min and max
        .domain([0, 3]); //input min and max

        //console.log(x)

    //find the minimum value of the array 
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    //find the maximum value of the array 
    var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });

    //scale for circles center y coordinate
    var y = d3.scaleLinear()
        .range([450, 50]) //was 440, 95])
        .domain([0, 700000]); //was minPop, MaxPop
            //minPop,
            //maxPop
        

    //color scale generator
    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop,
            maxPop
        ]);

    var circles = container.selectAll(".circles") //No circles yet
        .data(cityPop) //here we feed in an array
        .enter() //mysterious 
        .append("circle") //add a circle for each datum
        .attr("class", "circles") //apply a class name to all circles
        .attr("id", function(d){ //circle radius
            //console.log("d:", d, "i:", i); //lets look
            return d.city;    
        })
        .attr("r", function(d){
            //calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){//x coordinate
            //use the index to place each circle horizontally  
            return x(i);//90 + (i *180);
        })
        .attr("cy", function(d){ //y coordinate
            //Subtract value from 450 to "grow" circles up from the bottom instead of down from the top 
            return y(d.population);//450 - (d.population * 0.0005);
        })
        .style("fill", function(d, i){//add a fill color based on the stroke generator 
            return color(d.population);
        })
        .style("stroke", "#000"); //Black circle stroke
        //add axis
        var yAxis = d3.axisLeft(y);

        //create axis g element and add axis 
        var axis = container.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(50, 0)")
            .call(yAxis);

        //yAxis(axis);
        //Create a text element and add the title 
        var title = container.append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", 450)
            .attr("y", 30)
            .text("City Populations");

        //create circle labels
        var labels = container.selectAll(".labels")
            .data(cityPop)
            .enter()
            .append("text")
            .attr("class", "labels")
            .attr("text-anchor", "left")
            .attr("y", function(d){
                //vertical position centered on each circle
                return y(d.population) - 2;
            });

        //first line of label
        var nameLine = labels.append("tspan")
            .attr("class", "nameLine")
            .attr("x", function(d, i){
                //horizontal position to the right of each circle 
                return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
            })
            .text(function(d){
                return d.city;
            });

        //create a format generator
        var format = d3.format(",");

        //second line of lable 
        var popLine = labels.append("tspan")
            .attr("class", "popLine")
            .attr("x", function(d, i){
                //vertical position centered on each circle 
                return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) +5;
            })
            .attr("dy", "15") //vertical offset
            .text(function(d){
                return "Pop. " + format(d.population); //use format generator to format numbers
            });



   
        console.log(container);
        console.log(innerRect);
};

