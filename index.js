document.body.innerHTML = '<p> Loading data';
CKData.fetchData("MERGE Ponti").then((jsonData) => {
    document.body.innerHTML = '';

    let tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Bridge Name: </strong> <span style='color:#ffa900'>" + d.BridgeName + "</span>";
        });

    let data = getBridgeData(jsonData);

    let margin = {top: 10, right: 10, bottom: 100, left: 40},
        margin2 = {top: 430, right: 10, bottom: 20, left: 40},
        width = 750 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

    let x = d3.scale.ordinal().rangeBands([0, width], .1),
        x2 = d3.scale.ordinal().rangeBands([0, width], .1),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    let xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom").tickValues([]),
        yAxis = d3.svg.axis().scale(y).orient("left");

    x.domain(data.map(function(d){ return d.Bridge}));
    y.domain([0, d3.max(data, function(d) { return d.Height;})]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    let brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

    let svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    let focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    focus.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    enter(data);
    updateScale(data);

    let subBars = context.selectAll('.subBar')
        .data(data);

    subBars.enter().append("rect")
        .classed('subBar', true)
        .attr(
            {
                height: function (d)
                {
                    return height2 - y2(d.Height);
                },
                width: function(){
                    return x.rangeBand()
                },
                x: function(d) {

                    return x2(d.Bridge);
                },
                y: function(d)
                {
                    return y2(d.Height)
                }
            });

    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

    focus.call(tip);
    focus.selectAll(".bar")
        .attr('fill', (d) => {
            if (d.accessibility === 'FALSE') {
                return '#ff0000';
            } else {
                return '#48db52';
            }
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);


    function brushed() {
        let selected =  x2.domain()
            .filter(function(d){
                return (brush.extent()[0] <= x2(d)) && (x2(d) <= brush.extent()[1]);
            });

        let start;
        let end;

        if(brush.extent()[0] !== brush.extent()[1])
        {
            start = selected[0];
            end = selected[selected.length - 1] + 1;
        } else {
            start = 0;
            end = data.length;
        }

        let updatedData = data.slice(start, end);

        update(updatedData);
        enter(updatedData);
        exit(updatedData);
        updateScale(updatedData)
    }

    function updateScale(data) {
        let tickScale = d3.scale.pow().range([data.length / 10, 0]).domain([data.length, 0]).exponent(.5);

        let brushValue = brush.extent()[1] - brush.extent()[0];
        if(brushValue === 0){
            brushValue = width;
        }

        let tickValueMultiplier = Math.ceil(Math.abs(tickScale(brushValue)));
        let filteredTickValues = data.filter(function(d, i){return i % tickValueMultiplier === 0}).map(function(d){ return d.Bridge});

        focus.select(".x.axis").call(xAxis.tickValues(filteredTickValues));
        focus.select(".y.axis").call(yAxis);
    }

    function update(data) {
        x.domain(data.map(function(d){ return d.Bridge}));
        y.domain([0, d3.max(data, function(d) { return d.Height;})]);

        let bars =  focus.selectAll('.bar')
            .data(data);
        bars
            .attr(
                {
                    fill: (d) => {
                        if (d.accessibility === 'FALSE') {
                            return '#ff0000';
                        } else {
                            return '#48db52';
                        }
                    },
                    height: function (d)
                    {
                        return height - y(d.Height);
                    },
                    width: function(){
                        return x.rangeBand()
                    },
                    x: function(d) {

                        return x(d.Bridge);
                    },
                    y: function(d)
                    {
                        return y(d.Height)
                    }
                })
    }

    function exit(data) {
        let bars =  focus.selectAll('.bar').data(data);
        bars.exit().remove()
    }

    function enter(data) {
        x.domain(data.map(function(d){ return d.Bridge}));
        y.domain([0, d3.max(data, function(d) { return d.Height;})]);

        focus.call(tip);
        focus.selectAll(".bar")
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide);

        let bars =  focus.selectAll('.bar')
            .data(data);

        bars.enter().append("rect")
            .classed('bar', true)
            .attr(
                {
                    height: function (d)
                    {
                        return height - y(d.Height);
                    },
                    width: function() {
                        console.log();
                        return x.rangeBand()
                    },
                    x: function(d) {

                        return x(d.Bridge);
                    },
                    y: function(d)
                    {
                        return y(d.Height)
                    }
                });
    }

    /**
     * Parses thru jsonData to prepare the data array for processing
     * @param jsonData
     * @returns {*} An array of objects containing data neccececary to draw the graph
     */
    function getBridgeData(jsonData) {
        let data = [];
        for (let i = 0; i < jsonData.length; i++) {
            let datum = {};
            let height = parseFloat(jsonData[i]["Height Center (m)"]);
            // skip bridges with no height value and unreasonable heights
            if(height !== 0 && height < 50) {
                datum.Height = height;
                datum.BridgeName = jsonData[i]["Bridge Name"];
                datum.accessibility = jsonData[i]['Handicapped Accessible?'];
                datum.Data = jsonData[i];
                data.push(datum);
            }
        }

        // Sort them in ascending order by height
        data = data.sort((a, b) => a.Height - b.Height);

        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                data[i].Bridge = 0;
                continue;
            }
            const height = data[i].Height;
            data[i].Height = data[i-1].Height + height;
            data[i].Bridge = i;
        }

        return data;
    }

}, (reason) => {
    document.body.innerHTML = '<p> An Error Occurred';
    console.log(reason);
});
