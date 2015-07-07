var linksGraph = null;

var fiterLinksNodes = function(term) {
  g = linksGraph.graph;

  var rgx = new RegExp(term,"gi");
  g.nodes().forEach(function(n) {
    //console.log(n);
    upsetNode(n,rgx.test(n.savedLabel));
  });

  linksGraph.refresh();
};

////////////////////////////////////////// LINKS GRAPH
var upsetNode = function(n,flag) {
  if(flag) {
    n.color = n.originalColor;
    n.label = n.savedLabel;
    n.active = true;
  } else {
    n.color = '#eee';
    n.active = false;
    delete n.label;
  }
};

var loadLinksGraph = function(scope) {
  sigma.classes.graph.addMethod('neighbors', function(nodeId) {
    var k,
        neighbors = {},
        //nedges = [];
        index = this.outNeighborsIndex[nodeId] || {};
    for (k in index) {
      neighbors[k] = this.nodesIndex[k];
      //nedges.push(this.outNeighborsIndex[nodeId][k]);
    }
    //console.log("edges",nedges);
    return neighbors;
  });

  var g = sigma.parsers.gexf(
    scope.settings.datapath + "links_"+scope.state.lang+".gexf",
    {
      container: 'sigma-links',
      settings: {
        labelThreshold: 0,
        //defaultLabelColor: "rgb(200,200,200)",
        zoomingRatio: 1.5,
        doubleClickZoomingRatio: 1.7,
        defaultLabelSize: 12,
        hideEdgesOnMove: true,
        drawEdges: false,
        doubleClickEnabled: false,
        //labelColor: "node",
      }
    },
    function(s) {
      
      linksGraph = s;

      // init things on the graph
      s.graph.nodes().forEach(function(n) {
        n.originalColor = n.color;
        n.savedLabel = n.label;
        n.active = false;
        delete n.label;
      });
      // s.graph.edges().forEach(function(e) {
      //   e.originalColor = e.color;
      // });

      console.log("links graph loaded");

      // doubleclick to open link
      s.bind('doubleClickNode', function(event) {
        console.log("doubleclicked node:",event.data.node);
        var url = event.data.node.url || "http://manifest.es";
        var win = window.open(url, '_blank');
        win.focus();
      });
      
      // simple click shows neighbors
      s.bind('clickNode', function(event) {
        var nodeId = event.data.node.id,
            toKeep = s.graph.neighbors(nodeId);
        toKeep[nodeId] = event.data.node;

        console.log(event.data.node);

        s.graph.nodes().forEach(function(n) {
          upsetNode(n,toKeep[n.id]);
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

      s.bind('overNode', function(event) {
        event.data.node.label = event.data.node.savedLabel;
        s.refresh();
      });
      s.bind('outNode', function(event) {
        var n = event.data.node;
        if(!n.active) delete n.label;
        //s.refresh();
      });

      s.bind('clickStage', function(e) {
        s.graph.nodes().forEach(function(n) {
          n.color = n.originalColor;
          n.active = false;
          delete n.label;
        });
        // s.graph.edges().forEach(function(e) {
        //   e.color = e.originalColor;
        // });

        // Same as in the previous event:
        s.refresh();
      });

      s.refresh();

    });
}

////////////////////////////////////////// TAG GRAPH
var loadTagGraph = function(scope) {
  var g = sigma.parsers.gexf(
    scope.settings.datapath + "tags.gexf",
    {
      container: 'sigma-tags',
      renderer: {
        container: document.getElementById('sigma-tags'),
        type: 'canvas'
      },
      settings: {
        labelThreshold: 0,
        //defaultLabelColor: "rgb(200,200,200)",
        zoomingRatio: 1.4,
        doubleClickZoomingRatio: 1.7,
        defaultLabelSize: 12,
        //arrowSizeRatio: 50,
      }
    },
    function(s) {
      //console.log(s.graph);

      s.bind('clickNode', function(event) {
        console.log("clickedTag:",event.data.node);
        scope.clickOnTag(event.data.node.tag);
      });
      s.bind('clickStage', function(e) {
        scope.clickOnTag(null);
      });

      var ids = {} ;
      var orphans = [];

      _.each(s.graph.nodes(), function(n) {
        //console.log(n);
        var t = n.label;
        
        ids[t] = n.id;
        n.tag = t;
        n.label = scope.tagsContents[t].label;

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
        //e.label = "noix";
        //e.size = 20;
        //e.weight = 20;
        e.color = "rgb(200,200,210)";
        e.type = 'curvedArrow'; //['line', 'curve', 'arrow', 'curvedArrow'][Math.random() * 4 | 0];
        //console.log(e);
      });


      // _.each(scope.templinks4graph, function(l,i) {
      //   s.graph.addEdge({
      //     id: "new_"+i,
      //     source: ids[l[0]],
      //     target: ids[l[1]],
      //     color: "rgb(200,50,50)"
      //   });
      // });

      s.refresh();
    }
  );
}