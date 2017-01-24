
var w = 1200;
var h = 800;
var svgPadding = 25;
var iconDim = 60;
var targetYPosition = 2*svgPadding + iconDim;
var targetTextHeight = 25;
var spacing = 5;



d3.csv("GoalList.csv", function(data) {

    //create the svg element
    var svg = d3.select("body")
        .append("svg")
        .attr({
            width: w,
            height: h
        });

    var xScale = d3.scale.ordinal()
                    .domain(d3.range(data.length))  
                    .rangeRoundBands([svgPadding, w - svgPadding], 0.1);

    //generate icons for goals.
    var imgs = svg.selectAll("image")
        .data(data)
        .enter()
        .append("image")
        .attr({
            href: function(d){ return "img/" + d.GoalID + ".svg"; },
            id: function(d){ return d.GoalID; },
            x: function(d, i) { return xScale(i); },
            y: svgPadding,
            width: iconDim,
            height: iconDim
        });
        
    //generate placeholder rect to make the image clickable
    var rects = svg.selectAll("rect")
                    .data(data)
                    .enter()
                    .append("rect")
                    .attr({
                        x: iconDim,
                        y: iconDim,
                        x: function(d, i) { return xScale(i); },
                        y: svgPadding
                    })  
                    .on("click", function(d) { renderTargetList(d.GoalID); })
                    .classed("goals", true);

});

var countMyGroup = function(groupToCount) {

        var cleanCount = 0;

        for(var i=0 ; i<groupToCount.length; i++)
            {
                if(groupToCount[i].value > 0)
                {   
                    cleanCount++;
                }
            }
        return cleanCount;   

    }

var renderTargetList = function(goalID) {
    
    d3.select("svg").selectAll(".toRemove").remove();

    d3.csv("TargetList.csv", function(data) {

        var targetList = crossfilter(data);
        var TLGoalFilterDimension = targetList.dimension(function(d) { return d.GoalID; });

        TLGoalFilterDimension.filter(goalID);

        var targetCount = 1;//countMyGroup(targetGrouping);

        /*
        if(targetCount > 0)
        {

            graphYPos = targetYPosition + targetTextHeight * targetCount;

            var yScale = d3.scale.ordinal()
                        .domain(d3.range(targetCount))
                        .rangeRoundBands([targetYPosition, graphYPos], 0.1);

            svg.selectAll("text")
                .data(targetList)
                .enter()
                .append("text")
                .filter(function(d) { return d.value > 0; })
                .text(function(targ){ return d.key; })
                .attr("x", svgPadding)
                .attr("y", function(d, i){ return yScale(i); })
                .classed("targets", true);

            //Give the rects a CSS class to style it according to the Goal's corresponding color
            var rectCSSClasses = "targets goal" + goalID;                                        

            var rects = svg.selectAll("rect")
                            .data(targetList)
                            .enter()
                            .append("rect")
                            .classed("toRemove", true)
                            .filter(function(d) { return d.value > 0; })
                            .attr({
                                x: svgPadding,
                                y: function(d, i) { return yScale(i); },
                                height: targetTextHeight,
                                width: 200
                            })
                            .on("click", function(d) { renderDataAvailability(d.key); })
                            .classed(rectCSSClasses, true)
                            .classed("toRemove", false);


                            

        }
        */

    });

};





d3.csv("IndicatorProfiles.csv", function(data) {
    /*
        
    var profiles = crossfilter(data);
    var goalDimension = profiles.dimension(function(d) { return d.GoalID; });
    var targetDimension = profiles.dimension(function(d) { return d.TargetID + " - " + d.TargetDesc; });
    var indicatorDimension = profiles.dimension(function(d) { return d.IndicatorID + " - " + d.IndicatorDesc; });
    var natureDimension = profiles.dimension(function(d) { return d.NatureDesc; });
    var regionDimension = profiles.dimension(function(d) { return d.Region; });

    //create a grouping based on Goal
    var goalGroup = goalDimension.group().all();

    

    

    

    

    var renderDataAvailability = function(targetID) {

        svg.selectAll("g").remove();

        targetDimension.filter(targetID);

        var indicatorGrouping = indicatorDimension.group().all();

        //for(i=0, i< indicatorGrouping.length, i++)


        svg.selectAll("g")
            .data(indicatorGrouping)
            .enter()
            .append("g")
            .filter(function(ind) { return ind.value > 0; })
            .classed("indicators")


    };
*/
   // var renderDataAvailability = function(goalID)

});



