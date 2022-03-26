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
   
        console.log(container);
        console.log(innerRect);
};

