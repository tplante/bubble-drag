/* 
 * This chart uses the dragit library to directly manipulate
 * a d3 bubble chart's svg, such that longitudinal data can
 * be analyzed on three axes in an interactive fashion
 */

// mock data structure for the chart
const bubbleData = [{
	location: 'Stockholm',
	years: [{
		year: 2013,
		val: 24,
		audience: 250
	}, {
		year: 2014,
		val: 18,
		audience: 200
	}, {
		year: 2015,
		val: 90,
		audience: 381
	}, {
		year: 2016,
		val: 14,
		audience: 849
	}, {
		year: 2017,
		val: 104,
		audience: 681
	}]
}, {
	location: 'Oslo',
	years: [{
		year: 2013,
		val: 54,
		audience: 380
	}, {
		year: 2014,
		val: 58,
		audience: 405
	}, {
		year: 2015,
		val: 50,
		audience: 381
	}, {
		year: 2016,
		val: 54,
		audience: 306
	}, {
		year: 2017,
		val: 24,
		audience: 910
	}]
}, {
	location: 'Los Angeles',
	years: [{
		year: 2013,
		val: 4,
		audience: 250
	}, {
		year: 2014,
		val: 0,
		audience: 211
	}, {
		year: 2015,
		val: 64,
		audience: 381
	}, {
		year: 2016,
		val: 128,
		audience: 266
	}, {
		year: 2017,
		val: 64,
		audience: 904
	}]
}];

// color bank
const colors = ['steelblue', 'tomato', 'purple', 'red', 'pink', 'green', 'gray', 'wheat', 'yellow'];

// iterate over data
for (let i=0; i<bubbleData.length; i++) {
	// add color from color bank to each location
	bubbleData[i].color = colors[i];
}

// initialize bubble chart
initBubble(bubbleData);

function initBubble(data) {
	// define constants
	const margin = {
		     top: 10,
		     right: 50,
		     bottom: 30,
		     left: 80
		  },
		  legendWidth = 110,
		  legendHeight = (data.length * 20) + 10,
		  legendPadding = 40,
		  width = 1200 - margin.left - margin.right - legendWidth - legendPadding,
		  height = 380 - margin.top - margin.bottom;

	// set domain as min and max values for each axis
	const xDomain = d3.max(data, function(d) { return d3.extent(d.years, function(e) { return e.year; })}),
		  yDomain = [0, d3.max(data, function(d) { return d3.max(d.years, function(e) { return e.val; })})],
		  // use d3 to create linear scales, mapping
		  // the data values to pixels on the page
		  xScale = d3.scale.linear()
		  			 .domain(xDomain)
		  			 .range([0, width]),
		  yScale = d3.scale.linear()
		  			 .domain(yDomain).nice()
		  			 .range([height, 0]),
		  // use d3 to create axes with scales I defined
		  xAxis = d3.svg.axis()
		  			.scale(xScale)
		  			.ticks(data[0].years.length) // one tick per year
		  			.tickSize(-height, 4) // inner ticks are full height of plot
		  			.tickPadding(15)
		  			.tickFormat(d3.format(".0f")) // remove commas from years
		  			.orient("bottom"),
		  yAxis = d3.svg.axis()
		  			.scale(yScale)
		  			.tickSize(-width, 4)
		  			.tickPadding(15)
		  			.orient("left");

	// append main svg to document
	const svg = d3.select("#viz")
				  .append("svg")
				  	 .attr("width", width + margin.left + margin.right + legendWidth)
				  	 .attr("height", height + margin.top + margin.bottom),
		  // primary group element
		  g = svg.append("g")
		  		 .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
		  // append axes to group
		  x = g.append("g")
		  	   .attr("transform", "translate(0," + height + ")")
		  	   .call(xAxis),
		  y = g.append("g")
		  	   .call(yAxis),
		  // append legend to group and position
		  legend = svg.append("g")
		  			  .attr("transform", "translate(" + (width + margin.left + legendPadding) + "," + margin.top + ")"),
		  // append tooltip outer div to body
		  tooltip = d3.select("body")
		  			  .append("div")
		  			      .attr("class", "tooltip");

	// define sliding scale using dragit time parameters
	dragit.time = {
		min: 0, // index of lowest value
		max: data[0].years.length - 1, // index of highest value
		current: data[0].years.length - 1 // default value is this year (highest index)
	}

	// bind data to main group element, creating another nested group element for each location
	const points = g.selectAll(".bubble")
				    .data(data)
				    .enter() // binds a placeholder element for each data point
				    .append("g") // replaces with group element
				        .attr("class", "bubble")
				        .attr("transform", function(d) {
				       	    // position based on current slider year
				      		return "translate(" + xScale(d.years[dragit.time.current].year) + "," + yScale(d.years[dragit.time.current].val) + ")";
				        })
				      	// darken full trajectory of this bubble on click
				      	.on("click", dragit.trajectory.display)
				      	// make each bubble a dragit object
				      	.call(dragit.object.activate),
		  // append and style circle elements to points
		  circle = points.append("circle")
					     .attr("r", function(d) {
					 		 // appropriate data for radius in pixels, uses arbitrary integer multiplier
					 		 return Math.sqrt(d.years[dragit.time.current].audience);
					 	 })
					 	 .attr("fill", function(d) { return d.color; })
					 	 .attr("stroke", "#F3F3F4")
					 	 .attr("stroke-width", 2),
		  // append and style bubble labels
		  label = points.append("text")
		  			    .text(function(d) {
		  			   	   return d.years[dragit.time.current].audience;
		  			    })
		  			    .attr("text-anchor", "middle")
		  			    .attr("dy", "0.35em")
		  			    .attr("font-size", 11)
		  			    .style("fill", "#F3F3F4"),
		  // bind data to legend, creating one group element for each location
		  legendLabel = legend.selectAll(".legend-label")
		  					  .data(data)
		  					  .enter()
		  					  .append("g")
		  					     .attr("class", "legend-label")
		  					     .attr("transform", function(d, i) {
		  					     	return "translate(10," + ((i*20) + 10) + ")";
		  					     });

    // append y-axis label
    y.append("text")
     .text("# of Master's Degrees")
     .attr("transform", "translate(" + (-margin.left + 15) + "," + (height/2) + ") rotate(-90)")
     .attr("text-anchor", "middle")
     .style("font-size", "16px")
     .style("fill", "#333");
	// append legend bounding rectangle
	legend.append("rect")
	      .attr("width", legendWidth)
	      .attr("height", legendHeight)
	      .attr("fill", "transparent")
	      .attr("stroke", "#D8D8D8")
	      .attr("stroke-width", 1);
	// append legend key rectangles
	legendLabel.append("rect")
			   .attr("width", 10)
			   .attr("height", 10)
			   .attr("fill", function(d) { return d.color; });
	// append legend key labels
	legendLabel.append("text")
			   .text(function(d) { return d.location; })
			   .attr("font-size", 11)
			   .attr("x", 15)
			   .attr("y", 10);

	// tooltip mouse events
	points.on("mouseover", mouseOver)
		  .on("mousemove", mouseMove)
		  .on("mouseout", mouseOut);

	// tooltip visibility, positioning, and content
	function mouseOver() {
		tooltip.style("display", "block")
			   .style("visibility", "visible");
	}
	function mouseMove(d) {
		tooltip.style("display", "block")
			   .style("visibility", "visible")
			   .style("left", d3.event.pageX + 10 + "px")
			   .style("top", d3.event.pageY + 10 + "px")
			   .html(tooltipHtml(d));
	}
	function mouseOut() {
		tooltip.style("display", "none")
			   .style("visibility", "hidden");
	}

	function tooltipHtml(d) {
		let html = `
			<table>
				<thead>
					<tr>
						<!-- // ES2015 template literals -->
						<th colspan="2">${d.location}</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Year</td>
						<td>${d.years[dragit.time.current].year}</td>
					</tr>
					<tr>
						<td>Audience Size</td>
						<td>${d.years[dragit.time.current].audience}</td>
					</tr>
					<tr>
						<td># Degrees</td>
						<td>${d.years[dragit.time.current].val}</td>
					</tr>
				</tbody>
			</table>
		`;

		return html;
	}

	// run functions for positioning, transitions, etc. inside the update function to
    // have them controlled by slider
    function update() {
    	// update bubbles
    	points.transition()
    		  .duration(200)
        	  .attr("transform", function(d) {
        	 	  return "translate("+xScale(d.years[dragit.time.current].year)+", "+yScale(d.years[dragit.time.current].val)+")";
      		  });
      	circle.transition()
      		  .duration(200)
      		  .attr("r", function(d) {
      		      return Math.sqrt(d.years[dragit.time.current].audience);
      		  });
      	label.text(function(d) {
      		    return d.years[dragit.time.current].audience;
      		 });
  	}

	// initialize dragit on svg
	dragit.init("svg");
	// tell dragit which data to work with
	dragit.data = data.map(function(d) { 
	    return d.years.map(function(e) { 
	    	return [xScale(e.year) + margin.left, yScale(e.val) + margin.top]; 
	    });
	});
	  
	// run update function when range input is moved
	dragit.evt.register("update", update);
	// initialize range input
	dragit.utils.slider("#slider");
}


