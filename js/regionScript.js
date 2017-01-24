


var indicatorDataLink = "http://unstats.un.org/sdgs/indicators/database/?indicator="
var defaultRegionCode = "CAU_CEN_ASIA";
var regionData, countryData, seriesData, mapSVG, root;
var duration = 250;
var treeData = [];
var nodeHeight = 18,
       iconDim = 60,
       nodeWidthbyDepth = [70, 30, 50, 100];
       verticalPadding = 5,
       horizontalPadding = 18,
       negative = -1,
       treeFactor = 0.5,
       tagWidth = 20;
       toggleTriggered = false;

var currentCountryCode;

var SVGFile="world.svg"
var loadXML = new XMLHttpRequest;
function handler()
{
    if(loadXML.readyState == 4)
    {
        if (loadXML.status == 200) //---loaded ok---
        {
            //---responseText---
            var mySVGDiv = document.getElementById("svgDiv");
            var xmlString=loadXML.responseText;
            mySVGDiv.innerHTML=xmlString;
            //console.log("map is done");

            d3.queue().defer(d3.csv, "RefAreaGrid.csv")
               .defer(d3.csv, "CountryProfiles.csv")
               .defer(d3.json, "SeriesTree.json")
               .await(instantiatePageDefaults);
        }
    }
}
if (loadXML != null)
{
    loadXML.open("GET", SVGFile, true);
    loadXML.onreadystatechange = handler;
    loadXML.send();
}


function instantiatePageDefaults(error, RegionGrid, CountryProfiles, SeriesTree) {
    if(error) {
        d3.select("div.container").append("p").text("Error loading data: " + error);
    }
    else {
        seriesData = SeriesTree;
        regionData = RegionGrid;
        countryData = crossfilter(CountryProfiles);
        
        areaCodeDimension = countryData.dimension(function(d) { return d.AreaCode; });
        typeDimension = countryData.dimension(function(d) { return d.Type; });
        
        mapSVG = d3.select("#world");

        //modify the series data to create a tree structure
        var dataMap = seriesData.reduce(function(map, node) {
            map[node.name] = node;
            return map;
        }, {});

        seriesData.forEach(function(node) {
            // add to parent
            var parent = dataMap[node.parent];
            if (parent) {
            // create child array if it doesn't exist
                (parent.children || (parent.children = []))
                // add node to child array
                    .push(node);
            } 
            else {
                // parent is null or missing
                treeData.push(node);
            }
        });

        //Add an event listener to the Expand all toggle button
        d3.select("input")[0][0].onclick = function () {
          renderSeriesTrees();
          renderCountryList(defaultRegionCode);
        }

        //Render the tree structures
        renderSeriesTrees();

        //Render the list of countries for the default region
        renderCountryList(defaultRegionCode);
    }
}

function renderCountryList(regionName) {

  //clear map of all selections
   mapSVG.selectAll("g").classed("selected", false);

   //Set the goal images back to their default state
   d3.selectAll("g.node image").attr("xlink:href",function(d){ return "img/Inverted_" + d.name + ".svg"; });

   //Set the selected region on the map
   mapSVG.select("g#" + regionName).classed("selected", true);

   //Remove the area marker
   d3.selectAll("text.country").remove();
   d3.select("rect.country").remove();

   //Set the marker back to its original position
   d3.select("#marker").attr("transform", "translate(-100,-100)");

   var countryListDiv = d3.select("#countryListDiv");
   //Remove all the existing country names on the list
   d3.selectAll(".countryLink").remove();

   //Create the new list of countries
   countryListDiv.selectAll("a")
      .data(regionData)
      .enter().append("a")
      .classed("toRemove", true)
      .filter(function(d) { return d.ParentCode == regionName; })
      .classed("countryLink btn btn-sm", true)
      .classed("toRemove", false)
      .text(function(d) { return d.AreaName; })
      .attr("href", function(d){ return "javascript:renderDataAvailability('" + d.AreaCode + "')" })
      .attr("role", "button")
      .attr("name", function(d) { return d.AreaCode; });

   //Remove all unused links
   d3.selectAll(".toRemove").remove();

   //Render the data availability for the selected region
   renderDataAvailability(regionName);

}

function getBoundingBox(selection) {
   var element = selection.node();
        // use the native SVG interface to get the bounding box
        return element.getBBox();
}

function renderDataAvailability(countryCode) {
  //save the selected country/region code so that availability can be reproduced when user interacts with the tree
   currentCountryCode = countryCode;

   //Remove previous selection visual elements - Country map marker
   d3.select("text.country").remove();
   d3.select("rect.country").remove();
   d3.selectAll("g.node image").attr("xlink:href",function(d){ return "img/Inverted_" + d.name + ".svg"; });


   //Get elements for marker and country.
   var pathSelection = d3.select("#" + countryCode);
   var markerSelection = d3.select("#marker");

   //Get country data
   var countryDetails = regionData.filter(function(d) { return d.AreaCode == countryCode })[0];

   d3.select("#selectedRegion").text(countryDetails.AreaName);

   //Get bounding boxes for marker and country from the elements to calculate locations to place the rest of the map marker.
   var countryBBox = getBoundingBox(pathSelection);
   var markerBBox = getBoundingBox(markerSelection);

   //Set location of marker
   var markerX = countryBBox.x + countryBBox.width/2 - markerBBox.width/2;
   var markerY = countryBBox.y + countryBBox.height/2 - markerBBox.height;
   markerSelection.attr("transform", "translate(" + markerX + "," + markerY + ")");

   //Set location of text and enclosing rect element.
   var textX = markerX;
   var textY = countryBBox.y + countryBBox.height/2 + markerBBox.height;
   var countryText = d3.select("#world").append("text")
      .attr("x", textX)
      .attr("y", textY)
      .text(countryDetails.AreaName)
      .classed("country", true);

   var countryTextBBox = getBoundingBox(countryText);
   d3.select("#world").insert("rect", "text")
      .attr({
         x: countryTextBBox.x - markerBBox.width/2,
         y: countryTextBBox.y - 5,
         width: countryTextBBox.width + 30,
         height: countryTextBBox.height + 10,
         fill: "#fff",
         "fill-opacity": 0.8,
         rx: 10,
         ry: 10
      })
      .classed("country", true);


   //Remove existing data availability styles
   d3.selectAll("g.node").classed("full", false);
   d3.selectAll("g.node").classed("partial", false);
   d3.selectAll("g.node").classed("none", false);

   //Reset Country button styles
   d3.selectAll("a.countryLink").classed("active", false);

   //Set active Country link for appropriate styling
   d3.select("[name=" + countryCode + "]").classed("active", true);


   //End visual element generation
   //Begin applying data availability
   var classAssignments = ["none", "partial", "full"]

   areaCodeDimension.filter(String(countryCode));
   //var seriesFilter = typeDimension.filter("Series");
   var thisAreaData = areaCodeDimension.top(Infinity);

   for(var i = 0; i < thisAreaData.length; i++) {
      var thisNode = d3.select("[name = '" + thisAreaData[i].Type + thisAreaData[i].Name + replaceIfNullOrEmpty(thisAreaData[i].ParentType) + replaceIfNullOrEmpty(thisAreaData[i].ParentName) + "']");
      var classToBeAssigned = classAssignments[thisAreaData[i].NumDataPoints];
      thisNode.classed(classToBeAssigned, true);
   }

   //Apply appropriate image to Goal node.
   d3.selectAll("g.full image").attr("xlink:href",function(d){ return "img/" + d.name + ".svg"; });
   d3.selectAll("g.node:not(.full):not(.partial) image").attr("xlink:href", function(d) { return "img/Grey_" + d.name + ".svg"; });

}

function renderSeriesTrees() {
    for(var i = 0; i < treeData.length; i++) {
         drawSeriesTree(treeData[i]);
    } 
}

function add(a, b) {
    return a + b;
}

function replaceIfNullOrEmpty(obj) {
  if(obj) {
    return obj;
  }
  else {
    return "";
  }
}

function drawSeriesTree(root) {

   //Modify tree according to toggle selection
   var tree = d3.layout.tree();
   var toggleSeriesOn = d3.select("input#treeToggle")[0][0].checked;
   var indicatorNodes = tree.nodes(root).filter(function(d) { return d.type == "Indicator";});
   if(!toggleSeriesOn) {
      toggleTriggered = true;
      indicatorNodes.forEach(function(d) {
          d._children = d.children;
          d.children = null;
      })
    
   }
   else {
    if(toggleTriggered) {
      indicatorNodes.forEach(function(d) {
          d.children = d._children;
          d._children = null;
      })
    }
   }
   update(root, root);

}

function update(root, source) {

   var margin = {top: 10, right: 17, bottom: 10, left: 5};
   
   var goalNum = "goal" + root.name;

   var svg;

   var tree = d3.layout.tree();

   var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);


   var numChildren = nodes.length - 1;

   //Calculate tree width and height according the number of nodes
   var treeWidth = nodeWidthbyDepth.reduce(add, 0) * treeFactor + tagWidth;
   var treeHeight = iconDim + numChildren * (nodeHeight + verticalPadding);

   tree.size([treeHeight, treeWidth]); 

   //If trees have already been generated, find the appropriate svg instead of creating a new one.
   if(d3.selectAll("#treeDiv svg")[0].length == 17) {

      d3.select("svg#" + goalNum)[0][0].setAttribute("height", treeHeight + margin.top + margin.bottom);
      svg = d3.select("g." + goalNum);

   }
   //Create new svg if this is the first run (on page load)
   else {
    svg = d3.select("#treeDiv")
        .append("svg")
        .attr("width", treeWidth + margin.right + margin.left)
        .attr("height", treeHeight + margin.top + margin.bottom)
        .attr("id",goalNum)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .classed(goalNum, true);
      }

   //Create SVG line to generate the node connectors
   var line = d3.svg.line()
                 .x( function(point) { return point.lx; })
                 .y( function(point) { return point.ly; })
                 .interpolate("step-before");

  function lineData(d){
       var points = [
           {lx: d.source.y, ly: d.source.x},
           {lx: d.target.y, ly: d.target.x}
       ];
       return line(points);
   }

   //Calculate the positions of each node based on position in hierarchy
   for(var i = 0; i < nodes.length; i++) { 

      thisNode = nodes[i];
      thisNodeID = i + 1;

      if(thisNode.type == "Goal") {
         thisNode.x = verticalPadding;
         thisNode.y = verticalPadding;
      }
      else {

         thisNode.x = iconDim + nodeHeight + verticalPadding + (numChildren - thisNodeID) * (verticalPadding + nodeHeight);
         thisNode.y = thisNode.depth * horizontalPadding + treeFactor * nodeWidthbyDepth[thisNode.depth];

      }
   }

   //Bind node data with g 
   var node = svg.selectAll("g")
          .data(nodes, function(d) { return d.name + d.parent.name;});

   //Enter nodes
   var nodeEnter = node.enter().append("g")
      .attr("name", function(d) { return d.type + d.name + replaceIfNullOrEmpty(d.parent.type) + replaceIfNullOrEmpty(d.parent.name); })
      .attr("class", "node")
      .attr("transform", function(d) { 
       return "translate(" + d.y + "," + d.x + ")"; });

   //Generate the images for the goal nodes
   nodeEnter.filter(function(d) { return d.type == "Goal";})
       .append("image")
       .attr({
         x: negative * verticalPadding,
         y: negative * verticalPadding,
         width: iconDim,
         height: iconDim,
         "xlink:href": function(d){ return "img/Inverted_" + d.name + ".svg"; }
       });

   //Generate the enclosing rect for the goal nodes
   nodeEnter.filter(function(d) { return d.type == "Goal"})
      .append("rect")
       .attr({
         x: negative * verticalPadding,
         y: negative * verticalPadding,
         width: iconDim,
         height: iconDim,
         "fill-opacity": 0
       })
   //Generate the rect for target nodes
   nodeEnter.filter(function(d) { return d.type == "Target";})
       .append("rect")
       .attr({
         x: function(d) { return negative * treeFactor * nodeWidthbyDepth[d.depth]; },
         y: negative * treeFactor * nodeHeight,
         width: function(d) { return nodeWidthbyDepth[d.depth]; },
         height: nodeHeight
       })
       .classed("target", true);

   //Generate the rect for indicator nodes
   nodeEnter.filter(function(d) { return d.type == "Indicator";})
       .on("click", click)
       .append("rect")
       .attr({
         x: function(d) { return negative * treeFactor * nodeWidthbyDepth[d.depth]; },
         y: negative * treeFactor * nodeHeight,
         width: function(d) { return nodeWidthbyDepth[d.depth]; },
         height: nodeHeight
       })
       .classed("indicator", true);

   //generate the rect for series nodes
   nodeEnter.filter(function(d) { return d.type == "Series";})
       .append("rect")
       .attr({
         x: function(d) { return negative * treeFactor * nodeWidthbyDepth[d.depth]; },
         y: negative * treeFactor * nodeHeight,
         width: function(d) { return nodeWidthbyDepth[d.depth]; },
         height: nodeHeight
       })
       .classed("series", true);

   //Generate the text for target and indicator nodes
   nodeEnter.filter(function(d) { return (d.type == "Target" || d.type == "Indicator") ;})
       .append("text")
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1);

   //Generate the text for Series nodes, set the link to SDG indicator data
   nodeEnter.filter(function(d) { return d.type == "Series" ;})
      .append("a")
      .attr("href", function(d) { return indicatorDataLink + d.parent.name; })
      .attr("target", "_blank")
      .append("text")
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1);

    //Generate the rect for Series isOfficial tag
    nodeEnter.filter(function(d) { return d.type == "Series"})
      .append("rect")
      .attr({
         x: function(d) { return treeFactor * nodeWidthbyDepth[d.depth] - tagWidth + 2*verticalPadding; },
         y: negative * treeFactor * nodeHeight + treeFactor * verticalPadding,
         width: tagWidth,
         height: nodeHeight - verticalPadding,
       })
      .style("fill", function(d) { if(d.isOfficial == "TRUE") {return "#337ab7";} else { return "#888"}})
      .style("stroke-width", 0);

     //Generate the text for Series isOfficial tag
     nodeEnter.filter(function(d) { return d.type == "Series"})
      .append("text")
      .attr({
         x: function(d) { return treeFactor * nodeWidthbyDepth[d.depth]; },
         y: 3,
         "text-anchor": "middle"
       })
      .text(function(d) { if(d.isOfficial == "TRUE") {return "SD"; } else {return " + ";}})
      .style("fill", "#fff")
      .style("fill-opacity", 1)
      .style("font-size", "8px");

    //Generate mouseover text for all nodes
    nodeEnter.append("title").text(function(d) { return d.type + " " + d.name + " - " + d.value;})

    //Transition on data update (when an indicator node is clicked and additional nodes are added for the series)
    var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

   // Declare the links
    var link = svg.selectAll("path.link")
       .data(links, function(d) { return d.target.name; });

   // Enter the links.
   link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", lineData);

   //Add links for the updated nodes.
   link.transition()
    .duration(duration)
    .attr("d", lineData);

   //Remove links and nodes that are not required anymore
   link.exit().remove();

   node.exit().remove();

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

// Toggle children on click.
function click(d) {
  if (d.children) {
  d._children = d.children;
  d.children = null;
  } else {
  d.children = d._children;
  d._children = null;
  }
  update(d.parent.parent, d);
  renderDataAvailability(currentCountryCode);
}





