////////////////////////////////////////// LINKS GRAPH
var loadLinksGraph = function(scope) {
  sigma.classes.graph.addMethod('neighbors', function(nodeId) {
    var k,
        neighbors = {},
        index = this.outNeighborsIndex[nodeId] || {};
    for (k in index)
      neighbors[k] = this.nodesIndex[k];
    return neighbors;
  });

  var g = sigma.parsers.gexf(
    scope.settings.datapath + "links_"+scope.state.lang+".gexf",
    {
      container: 'sigma-links',
      settings: {
        labelThreshold: 7,
        //defaultLabelColor: "rgb(200,200,200)",
        zoomingRatio: 1.5,
        doubleClickZoomingRatio: 1.7,
        defaultLabelSize: 12,
        hideEdgesOnMove: true,
        drawEdges: false,
        //labelColor: "node",
      }
    },
    function(s) {
      s.graph.nodes().forEach(function(n) {
        n.originalColor = n.color;
      });
      // s.graph.edges().forEach(function(e) {
      //   e.originalColor = e.color;
      // });

      console.log("links graph loaded");

      s.bind('clickNode', function(event) {
        var nodeId = event.data.node.id,
            toKeep = s.graph.neighbors(nodeId);
        toKeep[nodeId] = event.data.node;

        s.graph.nodes().forEach(function(n) {
          if (toKeep[n.id])
            n.color = n.originalColor;
          else
            n.color = '#eee';
        });
        // s.graph.edges().forEach(function(e) {
        //   if (toKeep[e.source] && toKeep[e.target]) 
        //     e.color = e.originalColor;
        //   else {
        //     e.color = 'rgba(200,200,200,0)';
        //   }
        // });
        s.refresh();
      });
      s.bind('clickStage', function(e) {
        s.graph.nodes().forEach(function(n) {
          n.color = n.originalColor;
        });
        // s.graph.edges().forEach(function(e) {
        //   e.color = e.originalColor;
        // });

        // Same as in the previous event:
        s.refresh();
      });

    });
}

////////////////////////////////////////// TAG GRAPH
var loadTagGraph = function(scope) {
  var g = sigma.parsers.gexf(
    scope.settings.datapath + "tags.gexf",
    {
      container: 'sigma-tags',
      settings: {
        labelThreshold: 0,
        //defaultLabelColor: "rgb(200,200,200)",
        zoomingRatio: 1.4,
        doubleClickZoomingRatio: 1.7,
        defaultLabelSize: 12,
      }
    },
    function(s) {
      //console.log(s.graph);
      
      s.bind('clickNode', function(event) {
        console.log("clickedTag:",event.data.node.label);
      });


      var ids = {} ;
      var orphans = [];

      _.each(s.graph.nodes(), function(n) {
        //console.log(n);
        var t = n.label;
        
        n.label = scope.tagsContents[t].label;
            
        ids[n.label] = n.id;

        if(scope.tags[t] && scope.linksByTag[t]) {
          n.size = 15 + scope.linksByTag[t].length;
        } else {
          orphans.push(t);
          n.size = 1;
          //n.label = t;
        }
      });

      console.log("!! graph nodes unused:",orphans);

      _.each(s.graph.edges(), function(e) {
        //console.log(e);
        //s.graph.dropEdge(e.id);
        e.color = "rgb(200,200,200)";
      });

      _.each(scope.templinks4graph, function(l,i) {
        s.graph.addEdge({
          id: "new_"+i,
          source: ids[l[0]],
          target: ids[l[1]],
          color: "rgb(200,50,50)"
        });
      });

      s.refresh();
    }
  );
}