// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================

SC.PropertyAnimation = SC.Object.extend(
/** @scope SC.Cursor.prototype */ {
  
  isPropertyAnimation: true,

  // /** @private */
  // init: function() {
  //   arguments.callee.base.apply(this, arguments); ;
  //   
  //   // create a unique style rule and add it to the shared cursor style sheet
  //   var property = this.get('property') || 'none' ,
  //       duration = this.get('duration'),
  //       timingFunction = this.get('timingFunction'),
  //       delay = this.get('delay'),
  //       ss = SC.PropertyAnimation.sharedStyleSheet(),
  //       guid = SC.guidFor(this);
  //   
  //   var rule = '-webkit-transition: '+[property, duration, timingFunction, delay].join(' ');
  //   console.log(rule);
  //   if (ss.insertRule) { // WC3
  //     console.log('WC3: adding rule');
  //     ss.insertRule(
  //       '.'+guid+' { '+rule+'; }',
  //       ss.cssRules ? ss.cssRules.length : 0
  //     ) ;
  //   } else if (ss.addRule) { // IE
  //     console.log('IE: adding rule');
  //     ss.addRule('.'+guid, rule) ;
  //   }
  //   
  //   this.set('className', guid) ; // used by cursor clients...
  //   return this ;
  // },

  duration: '300ms',
  timingFunction: 'ease-in-out',
  delay: 0

  // /**
  //   This property is the connection between cursors and views. The default
  //   SC.View behavior is to add this className to a view's layer if it has
  //   its cursor property defined.
  //   
  //   @readOnly
  //   @property {String} the css class name updated by this cursor
  // */
  // className: null
});

/** @private */
SC.PropertyAnimation.sharedStyleSheet = function() {
  var head, ss = this._styleSheet ;
  if (!ss) {
    // create the stylesheet object the hard way (works everywhere)
    ss = document.createElement('style') ;
    ss.type = 'text/css' ;
    head = document.getElementsByTagName('head')[0] ;
    if (!head) head = document.documentElement ; // fix for Opera
    head.appendChild(ss) ;
    
    // get the actual stylesheet object, not the DOM element
    ss = document.styleSheets[document.styleSheets.length-1] ;
    this._styleSheet = ss ;
  }
  return ss ;
};
