/*
v6 copy
added functionality for when there is just one row/year of data
NOTE: Could add fixed x scale too with hashed out line 72, but need to make sure there is no
data out of the domain bounds, and if there is ignore or get rid of it, perhaps d3.filter
when drawing or something
*/

window.linegraph = (function() {
  var chart = function() {

    var margin = {top: 20, right: 20, bottom: 30, left: 40};
    var innerLeftMargin = 15;
    var outerWidth = 450;
    var outerHeight = 200;
    var innerWidth;
    var innerHeight;
    var yAxisLabel = "Passing Yards";
    var yScaleDomain;
    var x = d3.scale.ordinal();
    var y = d3.scale.linear();
    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");
    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(Math.min(Math.round((outerHeight / 20)), 8));
    var line = d3.svg.line();
    var area = d3.svg.area();
    var timeoutTime = 0;
    var transitionTime = 500;
    var paths;
    var areas;

    var fixScale = false;
    var fixScaleMinMax = [0, 5500];
    var shortXAxis = true;
    var everyOtherXAxis = true;

    var my = function(selection) {
      //set inner width and height
      innerWidth  = outerWidth  - margin.left - margin.right;
      innerHeight = outerHeight - margin.top  - margin.bottom;

      //set x and y scales
      //x.rangeRoundBands([0, innerWidth]);
      x.rangePoints([innerLeftMargin, innerWidth]);
      //x.range([0, innerWidth]);
      y.range([innerHeight, 0]);

      //d is data, 'this' is dom element
      selection.each(function(e, i) {
        //do initial out transition if there is already a graph drawn
        if (paths) {
          timeoutTime = transitionTime;
          paths.transition()
            .duration(transitionTime)
            .ease("back")
            .attr("d", function(d) { return averageLine(d, line); })
            //.attr("d", function(d) { return bottomLine(d, line); })
            .style("opacity", 0.5);

          areas.transition()
                .duration(transitionTime)
                .ease("back")
              .attr("d", function(d) { return averageLine(d, area); })
              //.attr("d", function(d) { return bottomLine(d, area); })
              .style("opacity", 0.5);
        }

        //set scales
        x.domain(e.map(function(d) { return d[0]; }));
        if (fixScale || e.length < 2) {
          yScaleDomain = fixScaleMinMax;
          //x.domain([1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015]);
        } else {
          yScaleDomain = d3.extent(e, function(d) { return d[1]; });
        }
        y.domain(yScaleDomain);
        var domainRange = (yScaleDomain[1] - yScaleDomain[0]);
        if (domainRange < 1) {
          yAxis.tickFormat(d3.format(".2f"));
        } else if (domainRange < 10) {
          yAxis.tickFormat(d3.format(".1f"));
        } else {
          yAxis.tickFormat(d3.format(".0"));
        }
        line.x(function(d) { return x(d[0]); })
            .y(function(d) { return y(d[1]); });
        area.x(function(d) { return x(d[0]); })
            .y0(innerHeight)
            .y1(function(d) { return y(d[1]); });

        //data bind
        var svg = d3.select(this).selectAll("svg").data([e]);
        var gEnter = svg.enter().append("svg").append("g")
          .attr("class", "groupbarg")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var g = svg.select("g");

        //define svg dimensions
        svg.attr("width", outerWidth)
          .attr("height", outerHeight);

        //x axis append
        gEnter.append("g")
            .attr("class", "x axis");

        //y axis append
        gEnter.append("g")
            .attr("class", "y axis")
            .append("text")
            .attr("class", "label")
            .style("text-anchor", "middle");
        //set x axis
        g.select(".x.axis")
            .attr("transform", "translate(0," + innerHeight + ")")
            .transition()
            .duration(((2 * 1000) / 3))
            .call(xAxis);

        if (shortXAxis) {
          g.selectAll(".x.axis text")
            .text(function(d) {
              return "'" + d.toString().slice(-2);
            })
            .style("opacity", 1);
        } else {
          g.selectAll(".x.axis text")
            .text(function(d) {
              return d;
            })
            .style("opacity", 1);
        }

        if (everyOtherXAxis) {
          g.selectAll(".x.axis text")
            .style("opacity", function(d, i) {
              if (i % 2 != 0) {
                return 0;
              } else {
                return 1;
              }
            });
        }

        //set y axis
        g.select(".y.axis")
            .transition()
            .duration(1000)
            .call(yAxis)
            .select("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("" + yAxisLabel);

        setTimeout(function() {

          paths = g.selectAll(".line")
            .data([e], function(d, i) {
              return d;
            });

          paths.exit()
            //   .transition()
            //   .duration(transitionTime)
            // .style("opacity", 0)
            .remove();

          paths.enter().append("path")
            .attr("class", "line")
            //.attr("d", function(d) { return bottomLine(d, line) })
            .attr("d", function(d) { 
              return averageLine(d, line) 
            })
            .style("opacity", 0);

            paths.transition()
              .duration(transitionTime * 3)
              .ease("elastic")
              .attr("d", function(d) { 
                //If there is only one row of data
                if (d.length == 1) {
                  var g = [];
                  g.push(d[0]);
                  //Add temp fake year
                  var tempYear = g[0];
                  var addedYear = [tempYear[0] + 1, tempYear[1]];
                  g.push(addedYear);

                  //Create new fake x scale
                  var x1 = d3.scale.ordinal();
                  x1.rangePoints([innerLeftMargin, innerWidth]);
                  x1.domain(g.map(function(f) { return f[0]; }));
                  //Create new fake line drawer
                  var line1 = d3.svg.line();
                  line1.x(function(f) { return x1(f[0]); })
                      .y(function(f) { return y(f[1]); });

                  return line1(g);
                }
                return line(d); 
              })
              .style("opacity", 1);


            areas = g.selectAll(".area")
              .data([e]);

            areas.exit()
              //   .transition()
              //   .duration(transitionTime)
              // .style("opacity", 0)
              .remove();

            areas.enter().append("path")
              .attr("class", "area")
              //.attr("d", function(d) { return bottomLine(d, area); })
              .attr("d", function(d) { return averageLine(d, area); })
              .style("opacity", 0);

            areas.transition()
                .duration(transitionTime * 3)
                .ease("elastic")
              .attr("d", function(d) {
                if (d.length < 2) {
                  var g = [];
                  g.push(d[0]);
                  //Add temp fake year
                  var tempYear = g[0];
                  var addedYear = [tempYear[0] + 1, tempYear[1]];
                  g.push(addedYear);

                  //Create new fake x scale
                  var x1 = d3.scale.ordinal();
                  x1.rangePoints([innerLeftMargin, innerWidth]);
                  x1.domain(g.map(function(f) { return f[0]; }));
                  //Create new fake line drawer
                  var area1 = d3.svg.area();
                  area1.x(function(f) { return x1(f[0]); })
                    .y0(innerHeight)
                    .y1(function(f) { return y(f[1]); });

                  return area1(g);
                }
                return area(d); 
              })
              .style("opacity", 0.7);

            var focus = gEnter.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("circle")
                .attr("r", 4.5);

            focus.append("text")
                .attr("y", -11)
                .attr("dy", ".35em");

            var overlay = g.selectAll(".overlay")
              .data([e]);

            overlay.exit().remove();

            overlay.enter().append("rect")
                .attr("class", "overlay")
                .attr("width", innerWidth)
                .attr("height", innerHeight)
                .on("mouseover", function() { focus.style("display", null); })
                .on("mouseout", function() { focus.style("display", "none"); })
                .on("mousemove", function(d) {
                  var x0 = d3.mouse(this)[0];
                  var rangePointsArray = x.range();
                  var rangeBandValue = (rangePointsArray[1] - rangePointsArray[0]) / 2;

                  for (var i = 0; i < rangePointsArray.length; i++) {
                    if (d.length > 1) {
                      if (x0 > (rangePointsArray[i] - rangeBandValue) && x0 < (rangePointsArray[i] + rangeBandValue)) {
                        focus.attr("transform", "translate(" + x(d[i][0]) + "," + y(d[i][1]) + ")");
                        focus.select("text")
                          .text(function() {
                            if (isInteger(d[i][1])) {
                              return d[i][1];
                            } else {
                              return d[i][1].toFixed(2);
                            }
                          })
                          .attr("x", function() {
                            if (isInteger(d[i][1])) {
                              if (d[i][1] < 10) {
                                return -3;
                              } else if (d[i][1] < 100) {
                                return -6;
                              } else if (d[i][1] < 1000) {
                                return -9;
                              } else {
                                return -12;
                              }
                            } else {
                              //it has decimal places
                              if (d[i][1] < 10) {
                                return -10;
                              } else if (d[i][1] < 100) {
                                return -13;
                              } else if (d[i][1] < 1000) {
                                return -15;
                              } else {
                                return -19;
                              }
                            }
                          });
                      }
                    } else {
                      focus.attr("transform", "translate(" + x(d[0][0]) + "," + y(d[0][1]) + ")");
                      focus.select("text")
                          .text(function() {
                            if (isInteger(d[0][1])) {
                              return d[0][1];
                            } else {
                              return d[0][1].toFixed(2);
                            }
                          })
                          .attr("x", function() {
                            if (isInteger(d[0][1])) {
                              if (d[0][1] < 10) {
                                return -3;
                              } else if (d[0][1] < 100) {
                                return -6;
                              } else if (d[0][1] < 1000) {
                                return -9;
                              } else {
                                return -12;
                              }
                            } else {
                              //it has decimal places
                              if (d[0][1] < 10) {
                                return -10;
                              } else if (d[0][1] < 100) {
                                return -13;
                              } else if (d[0][1] < 1000) {
                                return -15;
                              } else {
                                return -19;
                              }
                            }
                          });
                    }
                  }
                });
          }, timeoutTime);
      });
    };

    function averageLine(d, draw) {
      var averageLine = [];
      var averageValue = (yScaleDomain[0] + yScaleDomain[1]) / 2;
      for (var i = 0; i < d.length; i++) {
        averageLine.push([d[i][0], averageValue]);
      }
      return draw(averageLine); 
    }

    function bottomLine(d, draw) {
      var bottomLine = [];
      var bottomValue = yScaleDomain[0];
      for (var i = 0; i < d.length; i++) {
        bottomLine.push([d[i][0], bottomValue]);
      }
      return draw(bottomLine); 
    }

    function isInteger(num) {
      return (num ^ 0) === num;
    }


    //sets margin
    my.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return my;
    };

    //sets width
    my.width = function(value) {
        if (!arguments.length) return outerWidth;
        outerWidth = value;
        return my;
    };

    //sets height
    my.height = function(value) {
        if (!arguments.length) return outerHeight;
        outerHeight = value;
        return my;
    };

    //sets fixed scale or not
    my.fixScale = function(value) {
        if (!arguments.length) return fixScale;
        fixScale = value;
        return my;
    };

    //sets fixed scale or not
    my.fixScaleMinMax = function(value) {
        if (!arguments.length) return fixScaleMinMax;
        fixScaleMinMax = value;
        return my;
    };

    //sets fixed scale or not
    my.yAxisLabel = function(value) {
        if (!arguments.length) return yAxisLabel;
        yAxisLabel = value;
        return my;
    };


    return my;
  };

  return chart;
})();