
var svgPadding = 50;

var svgFixedWidth = 750;
var graphFixedWidth = 500;
var graphFixedHeight = 250;

var goalColors = [
        ["#DA1B3D","#F4967F"],
        ["#D5A73F","#E7CA8D"],
        ["#54A249","#F4967F"],
        ["#BD1B2F","#E7CA8D"],
        ["#E23C2E","#F4967F"],
        ["#55BFE5","#E7CA8D"],
        ["#F2C424","#F4967F"],
        ["#9B1844","#E7CA8D"],
        ["#E76930","#F4967F"],
        ["#D40667","#E7CA8D"],
        ["#EE9D30","#F4967F"],
        ["#B88D31","#E7CA8D"],
        ["#468048","#F4967F"],
        ["#4897D3","#E7CA8D"],
        ["#62BB4C","#F4967F"],
        ["#326A9E","#E7CA8D"],
        ["#24496A","#F4967F"]
    ];

var targetData, profileData, targetDimension, indicatorDimension;

d3.queue().defer(d3.csv, "TargetList.csv")
    .defer(d3.csv, "IndicatorProfiles.csv")
    .await(instantiatePageDefaults);

function instantiatePageDefaults(error, targets, profiles)
{
    if(error) {
        d3.select("div.container").append("p").text("Error loading data: " + error);
    }
    else {
        targetData = targets;
        profileData = crossfilter(profiles);
        goalDimension = profileData.dimension(function(d) { return d.GoalID; });
        targetDimension = profileData.dimension(function(d) { return String(d.TargetID); });
        indicatorDimension = profileData.dimension(function(d) { return d.Indicator; });

        clearAllFilters();

        renderTargetList(1);
    }

};

function clearAllFilters() {

    goalDimension.filterAll();
    targetDimension.filterAll();
    indicatorDimension.filterAll();

}

function addRemoveClass(id, className, operation) {
    
    var elem = document.getElementById(id);

    if(operation == "add")
    {   
        elem.classList.add(className);
    }
    else
    {
        elem.classList.remove(className);
    }

}

function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.2,
        x = text.attr("x"),
        y = text.attr("y"),
        dy = text.attr("dy") ? text.attr("dy") : 0;
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}


function renderTargetList(goalID) {

    //Clear styles of goal images
    d3.selectAll(".img").classed("selected", false);

    //Add styles to selected goal image
    var thisDiv = "goal" + String(goalID);
    addRemoveClass(thisDiv, "selected", "add");
    
    //Remove all visual elements from previous selections
    d3.select("body").selectAll(".targets").remove();
    d3.select("body").selectAll(".indicators").remove();

    //Create para elements to display targets under selected goal
    var targetsDiv = d3.select("div.container").append("div").classed("targets", true).classed("row", true);

    targetsDiv.selectAll("p")
        .data(targetData)
        .enter()
        .append("p")
        .classed("toRemove", true)
        .filter(function(d) { return d.GoalID == goalID; })
        .text(function(d) { return d.TargetID + " - " + d.TargetDesc; })
        .attr("onclick", function(d) { return "renderDataAvailability('" + String(d.TargetID) + "')"; })
        .attr("id", function(d) { return "target" + String(d.TargetID); })
        .classed("goal" + goalID, true)
        .classed("targets", true)
        .classed("toRemove", false);     

    //Remove unwanted para elements
    d3.selectAll("p.toRemove").remove();

    //Clear Crossfilter filters for profileData, then apply filter for selected goal
    clearAllFilters();
    goalDimension.filter(String(goalID));

    //Find the first target under selected goal with data
    var targetIDs = targetDimension.group().all();
    for(var i = 0; i<targetIDs.length; i++)
    {
        if(targetIDs[i].value > 0)
            break;
    }

    //Auto-render charts for first target under selected goal
    renderDataAvailability(String(targetIDs[i].key));

};

function renderDataAvailability(targetID) {

    var goalID = String(targetID).substring(0,targetID.indexOf("."));

    //Clear styles of target para elements
    d3.selectAll("p.targets").classed("selected", false);

    //Add styles to selected target para element
    var thisPara = "target" + String(targetID);
    addRemoveClass(thisPara, "selected", "add");

    //Remove all visual elements from previous target selections
    d3.selectAll(".indicators").remove();

    //Create div to display indicator data availability
    var indicatorDiv = d3.select("div.container").append("div").classed("indicators", true).classed("row",true);

    //Clear Crossfilter filters for profileData, then apply filter for selected target
    clearAllFilters();
    targetDimension.filter(String(targetID));

    //Create grouping for selected indicators
    var indicatorGrouping = indicatorDimension.group().all();

    //Collect all selected indicators in text array for easy access during drawing the chart
    var indicatorCount = 0;
    var indicatorTexts = [];

    for(var i = 0 ; i<indicatorGrouping.length; i++)
        {
            if(indicatorGrouping[i].value > 0)
            {                   
                indicatorTexts[indicatorCount] = indicatorGrouping[i].key;
                indicatorCount++;
            }
        }

    //Loop through each of the indicators within the selected target
    for(var i = 0; i < indicatorCount; i++)
    {
        //filter out data for only this indicator
        indicatorDimension.filterAll();
        var indicatorFilter = indicatorDimension.filter(indicatorTexts[i]);
        var graphData = indicatorFilter.top(Infinity);

        graphData.sort(function(x, y){
           return d3.descending(x.Ratio, y.Ratio);
        });

        //Create svg for this indicator
        var thisSvg = indicatorDiv.append("svg")
            .attr({
                width: svgFixedWidth,
                height: graphFixedHeight + 2*svgPadding
            });    

        /*Code for drawing chart with d3
        var regionCount = graphData.length;

        var barXScale = d3.scale.ordinal()
                        .domain(d3.range(regionCount))
                        .rangeRoundBands([svgPadding, graphFixedWidth], 0.1);

        var barYScale = d3.scale.linear()
                        .domain([0, 1])
                        .range([2*svgPadding, graphFixedHeight]);
        var bars = thisSvg.selectAll("rect")
            .data(thisIndicatorData)
            .enter()
            .append("rect")
            .attr({
                x: function(d, i) { return barXScale(i); },
                y: function(d) { return graphFixedHeight - barYScale(d.Ratio) + 2*svgPadding; },
                width: barXScale.rangeBand(),
                height: function(d) { return barYScale(d.Ratio); },
            })
            .classed("bars", true);
            */

        
        //draw graph with dimple.js
        //var barSvg = dimple.newSvg("#indGroup" + i, graphFixedWidth - svgPadding * 2.8, graphFixedHeight - svgPadding);
        //var graphData = indicatorFilter.top(Infinity);
        var chart = new dimple.chart(thisSvg, graphData);
        chart.setBounds(svgPadding,1.5*svgPadding, graphFixedWidth - svgPadding, graphFixedHeight - 1.5*svgPadding);
        var xAxis = chart.addCategoryAxis("x", ["Region","NumDataPoints"]);
        
        var yAxis = chart.addMeasureAxis("y", "Ratio");
        var yAxis2 = chart.addMeasureAxis("y", "WorldAvailability");
        yAxis.overrideMax = 1;
        yAxis2.overrideMax = 1;
        yAxis.ticks = 5;
        yAxis.tickFormat = "%";
        yAxis2.ticks = 5;
        yAxis2.tickFormat = "%";
        yAxis2.hidden = true;


        
        var barSeries = chart.addSeries("NumDataPoints", dimple.plot.bar, [xAxis, yAxis]);
        barSeries.aggregate = dimple.aggregateMethod.max; 
        xAxis.addOrderRule("Ratio", true);
        barSeries.addOrderRule("Ratio", true);

        var lineSeries = chart.addSeries("NumDataPoints", dimple.plot.line, [xAxis, yAxis2]);
        lineSeries.aggregate = dimple.aggregateMethod.max;

        chart.assignColor("At least 2 data points", goalColors[goalID - 1][0]);
        chart.assignColor("At least 1 data point", goalColors[goalID - 1][1]);

        var legend = chart.addLegend(svgPadding, svgPadding, graphFixedWidth, graphFixedHeight, "right", barSeries);

        chart.draw();
        legend.shapes.selectAll("rect").attr("height", "5px");
        //legend.shapes.selectAll("text").text("World average");

        xAxis.titleShape.remove();
        yAxis.titleShape.remove();

        xAxis.shapes.selectAll("text").attr("transform", 
            function(d) {
                return d3.select(this).attr("transform") + " translate(0, 20) rotate(-45)";
            });
        

        thisSvg.append("text")
            .attr({
                x: chart._xPixels(),
                y: chart._yPixels() - svgPadding,
                fill: "grey"
            })
            .text("Data Availability for " + indicatorTexts[i])
            .style("font-family", "Open Sans")
            .style("font-size", "11px")
            .call(wrap, svgFixedWidth - 2*svgPadding);
    
    }
};




