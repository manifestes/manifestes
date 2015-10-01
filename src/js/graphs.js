var linksGraph = null;
var tagsGraph = null;

var invisibleGray = "rgba(0,0,0,0)";
var lightGray = "#C5C5C5";
var yellowColor = "#8D7C0D";
var redColor = "#883E3E";


////////////////////////////////////////// LINKS GRAPH
var updateGraphSize = function() {
  linksGraph.renderers[0].resize();
  linksGraph.refresh();
  //console.log("graph size refreshed");
};

// to highlight nodes based on tags
var filterLinksNodesFromTags = function(tags) {
  g = linksGraph.graph;
  if(tags.length) {
    g.nodes().forEach(function(n) {
      var highl = _.intersection(n.attributes.Tags,tags).length;
      upsetLinkNode(n, highl, redColor, lightGray);
    });
  } else {
    resetLinkNodes();
  }
  linksGraph.refresh();
};

// to highlight nodes based on searched term
var filterLinksNodes = function(term) {
  g = linksGraph.graph;
  if(term) {
    var rgx = new RegExp(term,"gi");
    g.nodes().forEach(function(n) {
      upsetLinkNode(n, rgx.test(n.savedLabel), yellowColor, lightGray);
    });
    g.edges().forEach(function(e) {
      e.color = invisibleGray;
    });
  } else {
    resetLinkNodes();
  }
  linksGraph.refresh();
};

// update a node color/label (if color is null, set to original color)
var upsetLinkNode = function(n,flag,incolor,outcolor) {
  if(flag) {
    n.color = incolor;
    n.label = n.savedLabel;
  } else {
    n.color = outcolor;
    delete n.label;
  }
};


// back to original colors
var resetLinkNodes = function() {
  linksGraph.graph.nodes().forEach(function(n) {
    n.color = n.originalColor;
    n.label = n.savedLabel;
  });
  linksGraph.graph.edges().forEach(function(e) {
    e.color = "#EEEEEE";
  });
};

var loadLinksGraph = function(scope) {

  scope.state.graphstatus = "LOADING";
  
  try {
    sigma.classes.graph.addMethod('neighbors', function(nodeId) {
      var k,
          neighbors = {},
          //nedges = [];
          index = this.allNeighborsIndex[nodeId] || {};
      for (k in index) {
        neighbors[k] = this.nodesIndex[k];
        //nedges.push(this.allNeighborsIndex[nodeId][k]);
      }
      //console.log("edges",nedges);
      return neighbors;
    });
  } catch(err) {}


  var g = sigma.parsers.gexf(
    scope.settings.datapath + "links_"+scope.state.lang+".gexf",
    {
      container: 'sigma-links',
      renderer: {
        container: document.getElementById('sigma-links'),
        type: 'canvas'
      },
      settings: {
        labelThreshold: 6,
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
        //n.color = "#9C9C9C";
        //n.originalColor = "#9C9C9C";
        n.originalColor = n.color;
        n.attributes.Tags = n.attributes.Tags ? n.attributes.Tags.split(" ") : null;
        n.savedLabel = n.label;
        //delete n.label;
      });
      s.graph.edges().forEach(function(e) {
        e.color = "#EEEEEE";
      });

      // doubleclick to open link
      s.bind('doubleClickNode', function(event) {
        console.log("doubleclicked node:",event.data.node);
        var url = event.data.node.attributes.Url || scope.meta.url;
        var win = window.open(url, '_blank');
        win.focus();
      });
      
      // simple click shows neighbors
      s.bind('clickNode', function(event) {
        if(!event.data.captor.isDragging) {
          var nodeId = event.data.node.id,
              toKeep = s.graph.neighbors(nodeId);
          toKeep[nodeId] = event.data.node;

          console.log(event.data.node);

          s.graph.nodes().forEach(function(n) {
            upsetLinkNode(n, toKeep[n.id], n.originalColor, invisibleGray);
          });
          event.data.node.color = redColor;

          s.graph.edges().forEach(function(e) {
            if (toKeep[e.source] && toKeep[e.target]) 
              e.color = "#EEEEEE";
            else {
              e.color = invisibleGray;
            }
          });
          s.refresh();
        }
      });

      s.bind('clickStage', function(event) {
        if(!event.data.captor.isDragging) {
          resetLinkNodes();
          s.refresh();
        }
      });

      if(scope.settings.verbose)
        console.log("links graph loaded");

      s.refresh();

      scope.state.graphstatus = "OK";

      scope.$apply();
    });
}






////////////////////////////////////////// TAG GRAPH
var updateTagNodesSizesForLayout = function(scope,layout) {
  g = tagsGraph.graph;

  var orphans = [];
  g.nodes().forEach(function(n) {
    var t = n.tag;

    // get Q: nb of items per tag
    var Q = (layout=='links') ?
      (scope.linksByTag[t] ? scope.linksByTag[t].length : false) :
      scope.sectionNbByTag[t] ;
    
    if(Q) {
      n.size = 15 + Q;
    } else {
      orphans.push(t);
      n.size = 0.2;
    }
  });
  
  if(scope.settings.verbose)
    console.log("!! layout="+layout+" : tag nodes unused:",orphans);

  tagsGraph.refresh();
};
var updateTagNodes = function(tags) {
  g = tagsGraph.graph;

  g.nodes().forEach(function(n) {
    //console.log(n);
    if(tags.length) {
      upsetTagNode(n, tags.indexOf(n.tag)!=-1);
    } else {
      upsetTagNode(n, true, true);
    }
  });

  tagsGraph.refresh();
};
var upsetTagNode = function(n,flag,reset) {
  if(reset) {
    n.color = n.originalColor;
  } else if(flag) {
    n.color = "rgb(130,20,20)";
  } else {
    n.color = '#A7A7A7';
  }
};

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
        defaultLabelSize: 10,
        //arrowSizeRatio: 50,
      }
    },
    function(s) {

      tagsGraph = s;

      s.bind('clickNode', function(event) {
        if(!event.data.captor.isDragging) {
          console.log("clickedTag:",event.data.node);
          scope.toggleTag(event.data.node.tag);
          scope.overTag(event.data.node.tag, true);
        }
      });
      s.bind('clickStage', function(event) {
        if(!event.data.captor.isDragging) {
          scope.toggleTag();
          scope.overTag(null, true);
        }
      });
      s.bind('overNode', function(event) {
        scope.overTag(event.data.node.tag, true);
      });
      s.bind('outNode', function(event) {
        scope.overTag(null, true);
      });

      // remember sigma node ids by tag ?
      //var ids = {} ;

      // init things on the graph
      s.graph.nodes().forEach(function(n) {
        n.originalColor = n.color;
      });

      // update sizes and labels
      _.each(s.graph.nodes(), function(n) {
        //console.log(n);
        var t = n.label;
        
        //ids[t] = n.id;
        n.tag = t;
        try {
          n.label = scope.tagsContents[t].label;
        } catch(err) {
          console.log("no tag content for:",t);
        }
      });

      _.each(s.graph.edges(), function(e) {
        //console.log(e);
        //s.graph.dropEdge(e.id);
        //e.label = "noix";
        //e.size = 20;
        //e.weight = 20;
        e.color = "rgb(200,200,210)";
        e.type = 'curve'; //['line', 'curve', 'arrow', 'curvedArrow'][Math.random() * 4 | 0];
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

      if(scope.settings.verbose)
        console.log("tag graph made",s.graph);

      // init size with current scope.layout
      updateTagNodesSizesForLayout(scope, scope.state.layout);
    }
  );
}