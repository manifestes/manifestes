'use strict';

/* Filters */

angular.module('manifest.filters', [])
  
  // .filter('highlight', function($sce) {
  //   return function(text,term) {
  //     if(!term)
  //         return text;
  //     return $sce.trustAsHtml(text.replace(new RegExp(term,'gi'), '<span class="highlightedText">$&</span>'));
  //   }
  // })

  .filter('allowvimeo', function($sce) {
    return function(url) {
      var vid = url.match(/[0-9]+/)[0];
      var options = "?title=0&portrait=0&badge=0&byline=0&color=ffffff";
      return $sce.trustAsResourceUrl("//player.vimeo.com/video/"+vid+options);
    }
  })

  .filter('allowurl', function($sce) {
    return function(url) {
      return $sce.trustAsResourceUrl(url);
    }
  })

  // makes list of tag css classes from array
  .filter('classitag', function() {
    return function(list) {
      if(list.length<1)
        return "";
      else
        return "tgc-"+list.join(" tgc-");
    }
  })

  .filter('adjoin', function() {
    return function(list,max) {
      return list.join(", ");
    }
  });