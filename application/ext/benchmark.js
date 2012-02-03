// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================

SC.mixin(SC.Benchmark, {

  /**
    Generate a human readable benchmark chart. Pass in appName if you desire.
  */
  timelineChart: function(appName) {
    var i=0;
    // Hide the chart if there is an existing one.
    this.hideChart();
    
    // Compile the data.
    var chart = this._compileChartData(false);
    var chartLen = chart.length;
    
    // Return if there is nothing to draw.
    if(chartLen === 0) return;
    
    // Get the global start of the graph.
    var gStart = this.globalStartTime ? this.globalStartTime : chart[0][1];
    var maxDur = chart[chartLen-1][2]-gStart;
    var maxHeight = 50+chartLen*30;
    var incr = Math.ceil(maxDur/200)+1;
    var maxWidth = incr*50;
    
    // Create the basic graph element.
    var graph = document.createElement('div');
    graph.className = 'sc-benchmark-graph';
    document.body.appendChild(graph);

    // Set the title.
    var title = document.createElement('div');
    title.innerHTML = ((appName) ? appName : 'SproutCore Application') + (' - Total Captured Time: ' + maxDur +' ms - Points Captured: ' + chartLen) + ' [<a href="javascript:SC.Benchmark.hideChart();">Hide Chart</a>]';
    title.className = 'sc-benchmark-title'; 
    graph.appendChild(title);


    var topBox = document.createElement('div');
    topBox.className = 'sc-benchmark-top'; 
    topBox.style.width = maxWidth + 'px';
    graph.appendChild(topBox);

    // Draw the tick marks.
    for (i=0;i<incr; i++) {
      var tick = document.createElement('div');
      tick.className = 'sc-benchmark-tick';
      tick.style.left = (i*50)+'px';
      tick.style.height = maxHeight+'px';
      var tickLabel = document.createElement('div');
      tickLabel.className = 'sc-benchmark-tick-label';
      tickLabel.style.left = (i*50)+'px';
      tickLabel.innerHTML = i*200+" ms";
      graph.appendChild(tick);
      graph.appendChild(tickLabel);
    }
    
    // For each item in the chart, print it out on the screen.
    for (i=0;i<chartLen; i++) {
      var row = document.createElement('div');
      row.style.top = (75+(i*30))+'px';
      row.style.width = maxWidth+'px';
      row.className = (i%2===0) ? 'sc-benchmark-row even' : 'sc-benchmark-row';
      graph.appendChild(row);

      var div = document.createElement('div');
      var start = chart[i][1];
      var end = chart[i][2];
      var duration = chart[i][3];
      
      div.innerHTML = '&nbsp;' + (chart[i][0] + " <span class='sc-benchmark-emphasis'>" + duration + 'ms</span>');
      
      div.className = 'sc-benchmark-bar';
      div.style.cssText = 'left:'+ (((start-gStart)/4))+'px; width: '+((duration/4))+
                          'px; top: '+(53+(i*30))+'px;';
      div.title = "start: " + (start-gStart) + " ms, end: " + (end-gStart) + ' ms, duration: ' + duration + ' ms';
      graph.appendChild(div);
    }

    // Save the graph.
    this._graph = graph;
  },
  
  /*
    Hide chart.
    
  */
  hideChart: function() {
    if (this._graph) {
      try {  document.body.removeChild(this._graph); } catch(e) {}
    }
  }

});
