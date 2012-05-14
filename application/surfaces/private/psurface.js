// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM DEBUG_PSURFACES sc_assert */

sc_require('surfaces/private/ptransition_animation');

SC.ENABLE_CSS_TRANSITIONS = true;
SC.ENABLE_3D_TRANSFORMS = false;

SC.psurfaces = {};
SC.psurfaceTransitions = {};
SC.surfaceCallbacks = [];

/** @private
  A presentation surface (Psurface) is a lightweight representation of the 
  surface tree used to manage the rendering tree and apply animations and 
  transitions to it.

  A Psurface's corresponding rendering surface is *always* in the rendering 
  tree at the beginning of an event loop if it exists in the `SC.psurfaces` 
  hash.  (The rendering tree is the DOM tree when Blossom is running in the 
  browser.)

  A Psurface's only purpose in life is to quickly sync up with the surface 
  tree during a display loop, updating the rendering tree to match during the 
  process of syncing.  For this reason, only those operations needed to 
  support syncing are provided.

  Traversal of a presentation tree is well-defined: always starting with the 
  root (a Psurface where `this.parent === null`). From there, the Psurface 
  receives a well-defined series of commands:

  - SC.Psurface.begin(surface)
  - SC.Psurface#push(surface)
  - SC.Psurface#next(surface)
  - SC.Psurface#pop()
  - SC.Psurface.end(surface)

  These operations correspond to a top-down traversal of the Psurface _from 
  the point of view of the surface tree_.  A Psurface handles these commands 
  by determining if its _own_ traversal matches.  When it does not, it makes 
  adjustments to bring its own tree into compliance, based on the state of 
  the surfaces themselves.

  Four global hashes are used to maintain state during this process.  In the 
  `SC.surfaces` hash, each surface that is in the surface tree has an entry. 
  In the `SC.psurfaces` hash, each Psurface whose corresponding rendering 
  surface is in the render tree is represented.

  While bringing a presentation tree in sync with a surface tree, the 
  `SC._sc_psurfacesBeingMoved` hash can be used to remember Psurfaces that are 
  temporarily detached from the currently syncing Psurface tree, but are 
  known to become attached in the end.

  Beyond managing the rendering tree, a major responsibility of a Psurface is 
  to retrieve and apply animations and transitions to surface properties, as 
  well as handling order-in and order-out transitions.

  Property animations and transitions should be done after a Psurface's 
  rendering surface has been added to the rendering tree, but before moving 
  on to the next Psurface.  This happens in three situations:

  - SC.Psurface#next(surface)
  - SC.Psurface#pop(surface)
  - SC.Psurface.end(surface)

  In all three situations, the current psurfaces will never be visited again, 
  and its rendering surface (e.g. DOM node) is guaranteed to be in the 
  rendering tree at that point.

  The DOM tree itself needs to be built immediatly during the sync algorithm, 
  because child DOM nodes need to be able to append to their parent DOM nodes.
*/
SC.Psurface = function(surface) {
  if (DEBUG_PSURFACES) {
    sc_assert(surface);
    sc_assert(surface.kindOf(SC.Surface));
  }

  var surfaceId = surface.__id__,
      tagName = surface.__tagName__,
      useContentSize = surface.__useContentSize__;

  if (DEBUG_PSURFACES) {
    sc_assert(surfaceId);
    sc_assert(typeof surfaceId === 'string', "new SC.Psurface(): you must provide a `surfaceId`, and it must be a string.");
    sc_assert(SC.surfaces[surfaceId], "new SC.Psurface(): Invalid `surfaceId`: surface is not in the `SC.surfaces` hash.");
  }

  // Set all these properties up front so we get the "same" internal class in 
  // browsers like Google Chrome.
  this.id = surfaceId;

  var element = document.createElement(tagName || 'div'),
      style = element.style;

  element.id = surfaceId;
  if (DEBUG_PSURFACES) sc_assert(element, "Failed to create element with tagName"+(tagName || 'div'));
  this.__element__ = element;
  this.animate = !surface.__neverAnimate__;
  style.position = 'absolute';

  // Prevent user-resizing of text areas.
  if (tagName === 'textarea') {
    style.resize = 'none';

    // HACK: Let the surface know our textarea was created so it can set up 
    // event handlers.
    // 
    // IMPORTANT: Don't invoke callback until after the DOM node has been 
    // added to the document.  It's safe to do this in SC.Psurface.end().
    SC.surfaceCallbacks.push({
      surface: surface,
      element: element
    });
  }

  if (useContentSize) {
    sc_assert(!isNaN(surface.__contentWidth__), "A surface has a __contentWidth__ that is NaN, which is not allowed. Please update its 'frame' property.");
    sc_assert(!isNaN(surface.__contentHeight__), "A surface has a __contentHeight__ that is NaN, which is not allowed. Please update its 'frame' property.");
    sc_assert(surface.__contentWidth__ !== 0, "A surface has a __contentWidth__ of zero, which is not allowed. Please update its 'frame' property.");
    sc_assert(surface.__contentHeight__ !== 0, "A surface has a __contentHeight__ of zero, which is not allowed. Please update its 'frame' property.");
    element.width = surface.__contentWidth__;
    element.height = surface.__contentHeight__;
    surface.__contentSizeNeedsUpdate__ = false;
  }

  // FIXME: This gives a drop shadow to all root surfaces other than the #ui
  // div.  What we need is an API for drop shadows on SC.Surface itself.
  if (surfaceId !== 'ui' && !SC.surfaces[surfaceId].get('supersurface')) {
    element.style.webkitBoxShadow = "0px 5px 15px rgba(1,1,1,0.5)";
  }

  var frame = surface.get('frame');
  style.left   = frame[0]/*x*/      + 'px';
  style.top    = frame[1]/*y*/      + 'px';
  style.width  = frame[2]/*width*/  + 'px';
  style.height = frame[3]/*height*/ + 'px';

  surface.didCreateElement(element);

  this.parent = null;
  this.firstChild = null;
  this.nextSibling = null;
  this.prevSibling = null;
  this.useContentSize = useContentSize;
  this.transitionsRuleIndex = -1; // No rule at first.
  this.animationsRuleIndex = -1; // No rule at first.

  return this;
};

/** @private These properties are used during tree traversal. */
SC._sc_currentPsurface     = null;
SC._sc_psurfaceColor       = null;
SC._sc_psurfacesBeingMoved = null;

/*
  How this works
  ==============

  Initially, each psurface is 'white' (represented by undefined):

      SC._sc_psurfaceColor[psurface.id] === undefined;

  When a psurface is initially discovered, it's color it set to 'grey' (1).  
  Initially discovery happens during three commands:
  - `SC.Psurface.begin()` -- discovers the root psurface
  - `SC.Psurface#push()`  -- discovers the "pushed" surface
  - `SC.Psurface#next()`  -- discovers the "next" surface

  When a `push()`, `next()`, or `pop()` call is made on a surface, it can be 
  either 'grey' (1) or 'black' (2).  _The color is important!_  In order to 
  match the calling tree exactly, it is necessary to base the behavior of a 
  node based on it's current color for these commands.

  If a _grey_ psurface has `push()` called on it, that means the calling tree 
  has a child node here.

  If a _grey_ psurface has `next()` called on it, that means the calling tree 
  _does not have any child nodes here_.  However, the psurface might, so they 
  will need to be removed. In addition, the current psurface has at least one 
  more sibling.

  If a _grey_ psurface has `pop()` called on it, that means the calling tree 
  has just this current node as a child. Any children and/or future siblings 
  of the psurface should be removed.

  If a _black_ psurface has `push()` called on it, that's an error.  `push()` 
  can only be called on a psurface that is 'grey'.

  If a _black_ psurface has `next()` called on it, that means the calling 
  tree does have child nodes of the current psurface (which were handled by a 
  previous `push()` call), and it also means the current psurface has at 
  least one more sibling.

  If a _black_ psurface has `pop()` called on it, that means the calling tree 
  does have child nodes of the current psurface (which were handled by a 
  previous `push()` call), and it also means the current psurface has no more 
  siblings.
*/
SC._sc_psurfaceColor = null;

SC.Psurface.start = function() {
  if (DEBUG_PSURFACES) sc_assert(SC._sc_psurfaceColor === null);
  if (DEBUG_PSURFACES) sc_assert(SC._sc_psurfacesBeingMoved === null);

  SC._sc_psurfaceColor = {};

  var key, psurfaces = SC.psurfaces;
  for (key in psurfaces) {
    if (!psurfaces.hasOwnProperty(key)) continue;
    SC._sc_psurfaceColor[key] = 0; // white
  }

  SC._sc_psurfacesBeingMoved = {};
};

SC.Psurface.begin = function(surface) {
  // console.log('SC.Psurface#begin()');
  var id = surface.__id__,
      psurface = SC.psurfaces[id];

  if (DEBUG_PSURFACES) {
    sc_assert(SC._sc_currentPsurface === null);

    // Sanity check the surface.
    sc_assert(surface);
    sc_assert(surface.kindOf(SC.Surface));
    sc_assert(surface.get('supersurface') === null);
    sc_assert(surface === SC.surfaces[surface.__id__]);

    sc_assert(SC.surfaceCallbacks);
    sc_assert(SC.surfaceCallbacks.length === 0);
  }

  // If the psurface already exists, it is in the DOM, and should not have a 
  // parent (we verify this below).

  if (!psurface) {
    // We need to create a Psurface for this surface.
    if (DEBUG_PSURFACES) sc_assert(!document.getElementById(id));

    psurface = new SC.Psurface(surface);
    document.body.appendChild(psurface.__element__, null);

    // The psurface is now current and present in the rendering tree (DOM).
    SC.psurfaces[id] = psurface;
  }

  if (DEBUG_PSURFACES) {
    // Sanity check the psurface for all code paths.
    sc_assert(psurface);
    sc_assert(psurface instanceof SC.Psurface);
    sc_assert(psurface === SC.psurfaces[id]);
    sc_assert(psurface.parent === null);
    sc_assert(psurface.__element__);
    sc_assert(psurface.__element__ === document.getElementById(id));
    sc_assert(psurface.__element__.parentElement === document.body);
  }

  // We've discovered this psurface.
  psurface.discover(surface);

  return (SC._sc_currentPsurface = psurface);
};

SC.Psurface.prototype = {

  sharedStyleSheet: null, // Delay creating this until the document is ready.

  discover: function(surface) {
    var id = this.id, idx, len,
        cssTransitionsAreEnabled = SC.ENABLE_CSS_TRANSITIONS,
        enable3DTransforms = SC.ENABLE_3D_TRANSFORMS;

    SC._sc_psurfaceColor[id] = 1; // grey

    var el = this.__element__,
        style = el.style;

    if (this.useContentSize && surface.__contentSizeNeedsUpdate__) {
      el.width  = surface.__contentWidth__;
      el.height = surface.__contentHeight__;
      surface.__contentSizeNeedsUpdate__ = false;
    }

    // HACK:
    if (id === 'ui' && SC.ENABLE_3D_TRANSFORMS) el.style.webkitTransformStyle = 'preserve-3d';

    // Handle property transitions.
    var transitions = SC.surfaceTransitions[id] || false,
        currentHash = SC.psurfaceTransitions[id];
    if (transitions) {
      var properties = [],
          durations = [],
          timingFunctions = [],
          delays = [],
          value,
          ss = this.sharedStyleSheet || SC.Psurface.sharedStyleSheet();

      if (!currentHash) currentHash = SC.psurfaceTransitions[id] = transitions;
      else SC._baseMixin(true, currentHash, transitions);

      for (var key in currentHash) {
        var transition = currentHash[key];
        if (transition) {
          if (key === 'frame') {
            if (this.animate) {
              properties.push('left', 'top', 'width', 'height');
              for (idx=0, len=4; idx<len; ++idx) {
                durations.push(transition.duration+'ms');
                timingFunctions.push(transition.timingFunction);
                delays.push(transition.delay+'ms');
              }
            }
            value =  transition.value;
            style.left   = value[0]/*x*/      + 'px';
            style.top    = value[1]/*y*/      + 'px';
            style.width  = value[2]/*width*/  + 'px';
            style.height = value[3]/*height*/ + 'px';

            // var borderWidth = currentHash['borderWidth'];
            // if (borderWidth) {
            //   borderWidth = borderWidth.value;
            //   // top, right, bottom, and left (in that order)
            //   var clip = 'rect('+[borderWidth, value[2]/*width*/ - borderWidth*2, value[3]/*height*/ - borderWidth*2, borderWidth].join('px ')+'px)';
            //   console.log('clip:', clip);
            //   style.clip = clip;
            // }

          } else {
            // Update element.style
            if (cssTransitionsAreEnabled) {
              if (key === 'perspectiveOrigin') {
                if (enable3DTransforms) {
                  properties.push(transition.cssKey);
                  durations.push(transition.duration+'ms');
                  timingFunctions.push(transition.timingFunction);
                  delays.push(transition.delay+'ms');

                  value =  transition.value;
                  style[transition.cssKey+'-x'] = Math.floor(value[0]/*x*/ * 100)+'%';
                  style[transition.cssKey+'-y'] = Math.floor(value[1]/*y*/ * 100)+'%';
                }
            
              } else if (key === 'transformOrigin') {
                if (enable3DTransforms) {
                  properties.push(transition.cssKey);
                  durations.push(transition.duration+'ms');
                  timingFunctions.push(transition.timingFunction);
                  delays.push(transition.delay+'ms');

                  value =  transition.value;
                  style[transition.cssKey+'-x'] = Math.floor(value[0]/*x*/ * 100)+'%';
                  style[transition.cssKey+'-y'] = Math.floor(value[1]/*y*/ * 100)+'%';
                  style[transition.cssKey+'-z'] = Math.floor(value[2]/*z*/)+'px';
                }
            
              } else if (key === 'transform') {
                if (enable3DTransforms) {
                  properties.push(transition.cssKey);
                  durations.push(transition.duration+'ms');
                  timingFunctions.push(transition.timingFunction);
                  delays.push(transition.delay+'ms');

                  value =  transition.value;
                  style[transition.cssKey] = 'matrix3d('+[
                    value[0] .toFixed(10) , value[1] .toFixed(10) , value[2] .toFixed(10) , value[3] .toFixed(10) ,
                    value[4] .toFixed(10) , value[5] .toFixed(10) , value[6] .toFixed(10) , value[7] .toFixed(10) ,
                    value[8] .toFixed(10) , value[9] .toFixed(10) , value[10].toFixed(10) , value[11].toFixed(10) ,
                    value[12].toFixed(10) , value[13].toFixed(10) , value[14].toFixed(10) , value[15].toFixed(10)

                    // Quick check to see if scale(2) is working:
                    // 2         , value[1]  , value[2]  , value[3]  ,
                    // value[4]  , 2         , value[6]  , value[7]  ,
                    // value[8]  , value[9]  , 2         , value[11] ,
                    // value[12] , value[13] , value[14] , value[15]
                  ].join(', ')+')';
                }

              } else { // The remaining properties are set directly.
                if (this.animate) {
                  properties.push(transition.cssKey);
                  durations.push(transition.duration+'ms');
                  timingFunctions.push(transition.timingFunction);
                  delays.push(transition.delay+'ms');
                }

                style[transition.cssKey] = transition.value;
              }
            } else if (key !== 'perspectiveOrigin' || key !== 'transformOrigin' || key !== 'transform') {
              style[transition.cssKey] = transition.value;
            }
          }
        }
      }

      // FIXME: WebKit-only.
      if (cssTransitionsAreEnabled) {
        var propertyRule = '-webkit-transition-property: '+properties.join(', '),
            durationRule = '-webkit-transition-duration: '+durations.join(', '),
            timingFunctionRule = '-webkit-transition-timing-function: '+timingFunctions.join(', '),
            delayRule = '-webkit-transition-delay: '+delays.join(', '),
            rule = [propertyRule, durationRule, timingFunctionRule, delayRule].join(';\n'),
            transitionsRuleIndex = this.transitionsRuleIndex,
            cssRule = '#'+id+' { '+rule+'; }';

        // console.log(cssRule);

        if (transitionsRuleIndex >= 0) {
          ss.deleteRule(transitionsRuleIndex);
        } else {
          transitionsRuleIndex = ss.cssRules? ss.cssRules.length : 0;
        }

        this.transitionsRuleIndex = ss.insertRule(cssRule, transitionsRuleIndex);
        if (DEBUG_PSURFACES) sc_assert(this.transitionsRuleIndex === transitionsRuleIndex, "Must be the same to retain indexing across psurface instances.");
      }
    }

    // Handle property animations.
    // var animations = SC.surfaceAnimations[id] || false;
    // if (animations) {
    //   properties = [];
    //   durations = [];
    //   timingFunctions = [];
    //   delays = [];
    //   ss = this.sharedStyleSheet || SC.Psurface.sharedStyleSheet();
    // 
    //   for (key in transitions) {
    //     var animation = animations[key];
    //     if (animation && animation.isPropertyAnimation) {
    //       properties.push(key);
    //       durations.push(animation.__duration__);
    //       timingFunctions.push(animation.__timingFunction__);
    //       delays.push(animation.__delay__);
    //     }
    //   }
    // 
    //   // FIXME: WebKit-only.
    //   propertyRule = '-webkit-transition-property: '+properties.join(', ');
    //   durationRule = '-webkit-transition-duration: '+durations.join(', ');
    //   timingFunctionRule = '-webkit-transition-timing-function: '+timingFunctions.join(', ');
    //   delayRule = '-webkit-transition-delay: '+delays.join(', ');
    //   rule = [propertyRule, durationRule, timingFunctionRule, delayRule].join(';\n');
    // 
    //   // console.log(rule);
    //   ss.insertRule( '#'+id+' { '+rule+'; }', ss.cssRules? ss.cssRules.length : 0 );
    // }
  },

  push: function(surface) {
    // console.log('SC.Psurface#push()');
    var el = this.__element__,
        firstChild = this.firstChild,
        id = surface.__id__,
        myId = this.id,
        myColor = SC._sc_psurfaceColor[myId],
        psurfaces = SC.psurfaces,
        surfacesBeingMoved = SC._sc_psurfacesBeingMoved,
        child, nextChild, childElement, prev, next;

    if (DEBUG_PSURFACES) {
      // This psurface should have already been discovered, and push() should 
      // never have been called on this node before (otherwise, we'd be black).
      sc_assert(myColor === 1); // grey

      sc_assert(this === SC._sc_currentPsurface);
      sc_assert(el);
      sc_assert(el === document.getElementById(this.id));

      // Sanity check the surface.
      sc_assert(surface);
      sc_assert(surface.kindOf(SC.Surface));
      sc_assert(surface === SC.surfaces[surface.__id__]);
    }

    if (firstChild) {
      if (firstChild.id !== id) {
        child = psurfaces[id];
        if (child) {
          nextChild = firstChild;
          firstChild = child;

          // We need to remove firstChild from wherever it is now.
          prev = firstChild.prevSibling;
          next = firstChild.nextSibling;

          childElement = firstChild.__element__;

          if (prev && next) {
            // Splice.
            prev.nextSibling = next;
            next.prevSibling = prev;
          } else if (prev) {
            prev.nextSibling = null;
          } else if (next) {
            // Move to first.
            next.prevSibling = null;
            next.parent.firstChild = next;
          } else {
            // We're the only child.
            firstChild.parent.firstChild = null;
          }

          firstChild.prevSibling = null;

          // The DOM handles the list management for us.
          if (DEBUG_PSURFACES) {
            sc_assert(childElement);
            sc_assert(childElement.parentNode);
          }
          childElement.parentNode.removeChild(childElement);

        } else {
          // We need to create a new Psurface.
          if (DEBUG_PSURFACES) sc_assert(!document.getElementById(id));

          nextChild = firstChild;
          firstChild = SC.psurfaces[id] = new SC.Psurface(surface);
          childElement = firstChild.__element__;
        }

        // These are the same regardless of whether or not the child node 
        // already exits, or was created on demand.
        firstChild.parent = this;
        this.firstChild = firstChild;
        firstChild.nextSibling = nextChild;
        nextChild.prevSibling = firstChild;

        // Place firstChild before nextChild.
        el.insertBefore(childElement, nextChild.__element__);

      }

    } else {
      child = psurfaces[id];
      if (child) {
        firstChild = child;

        // We need to remove firstChild from wherever it is now.
        prev = firstChild.prevSibling;
        next = firstChild.nextSibling;

        childElement = firstChild.__element__;

        if (prev && next) {
          // Splice.
          prev.nextSibling = next;
          next.prevSibling = prev;
        } else if (prev) {
          prev.nextSibling = null;
        } else if (next) {
          // Move to first.
          next.prevSibling = null;
          next.parent.firstChild = next;
        } else {
          // We're the only child.
          firstChild.parent.firstChild = null;
        }

        firstChild.prevSibling = null;

        // The DOM handles the list management for us.
        if (DEBUG_PSURFACES) {
          sc_assert(childElement);
          sc_assert(childElement.parentNode);
        }
        childElement.parentNode.removeChild(childElement);

        firstChild.parent = this;
        this.firstChild = firstChild;
        firstChild.nextSibling = null;

        el.appendChild(childElement);

      } else {
        // Need to create a new Psurface.
        if (DEBUG_PSURFACES) sc_assert(!document.getElementById(id));

        firstChild = this.firstChild = new SC.Psurface(surface);
        firstChild.parent = this;
        SC.psurfaces[id] = firstChild;

        el.appendChild(firstChild.__element__);
      }
    }

    if (DEBUG_PSURFACES) {
      // Sanity check firstChild for all code paths.
      sc_assert(firstChild);
      sc_assert(firstChild instanceof SC.Psurface);
      sc_assert(firstChild === SC.psurfaces[id]);
      sc_assert(firstChild === this.firstChild);
      sc_assert(firstChild.parent === this);
      sc_assert(firstChild.prevSibling === null);
      sc_assert(firstChild.__element__);
      sc_assert(firstChild.__element__ === document.getElementById(id));
      sc_assert(firstChild.__element__.parentElement === this.__element__);
    }

    // We've discovered firstChild.
    firstChild.discover(surface);

    // We've been visited.
    SC._sc_psurfaceColor[myId] = 2; // black

    return (SC._sc_currentPsurface = firstChild);
  },

  next: function(surface) {
    // console.log('SC.Psurface#next()');
    var el = this.__element__,
        nextSibling = this.nextSibling,
        id = surface.__id__,
        myId = this.id,
        myColor = SC._sc_psurfaceColor[myId],
        psurfaces = SC.psurfaces,
        surfacesBeingMoved = SC._sc_psurfacesBeingMoved,
        next, prev, child, childId, childElement, nextChild;

    if (DEBUG_PSURFACES) {
      sc_assert(myColor === 1 || myColor === 2); // grey or black

      sc_assert(this === SC._sc_currentPsurface);
      sc_assert(el);
      sc_assert(el === document.getElementById(this.id));

      // Sanity check the surface.
      sc_assert(surface);
      sc_assert(surface.kindOf(SC.Surface));
      sc_assert(surface === SC.surfaces[surface.__id__]);
    }

    function moveChildren(psurface) {
      var next = psurface.firstChild, child, id;
      while (next) {
        child = next;
        next = child.nextSibling;
        id = child.id;
        if (DEBUG_PSURFACES) sc_assert(psurfaces[id]);
        delete psurfaces[id];
        surfacesBeingMoved[child.id] = child;
        if (child.firstChild) moveChildren(child);
      }
    }

    if (myColor === 1) { // grey
      // This case happens when this psurface should have no children.
      if (this.firstChild) {
        // We need to remove our children.  This is somewhat complicated, the 
        // children we are removing could exist somewhere else in the tree, 
        // so the children (and their children) need to be accessible.  In 
        // addition, we don't want to tear down the whole tree, as this would 
        // involve a lot of DOM manipulation.
        next = this.firstChild;
        while (next) {
          child = next;
          next = child.nextSibling;
          child.parent = null;
          child.prevSibling = null;
          child.nextSibling = null;
          el.removeChild(child.__element__);
          childId = child.id;

          // Need to move detached surfaces from active to "being moved".
          if (DEBUG_PSURFACES) {
            sc_assert(psurfaces[childId]);
            sc_assert(!surfacesBeingMoved[childId]);
          }
          delete psurfaces[childId];
          surfacesBeingMoved[childId] = child;
          moveChildren(child);
        }
        this.firstChild = null;
      }

      // We've been visited.
      SC._sc_psurfaceColor[myId] = 2; // black

    }

    if (DEBUG_PSURFACES) sc_assert(SC._sc_psurfaceColor[myId] === 2); // black

    if (nextSibling) {
      if (nextSibling.id !== id) {
        child = psurfaces[id];
        if (child) {
          nextChild = nextSibling;
          nextSibling = child;

          // We need to remove nextSibling from wherever it is now.
          prev = nextSibling.prevSibling;
          next = nextSibling.nextSibling;

          childElement = nextSibling.__element__;

          if (prev && next) {
            // Splice.
            prev.nextSibling = next;
            next.prevSibling = prev;
          } else if (prev) {
            prev.nextSibling = null;
          } else if (next) {
            // Move to first.
            next.prevSibling = null;
            next.parent.firstChild = next;
          } else {
            // We're the only child.
            nextSibling.parent.firstChild = null;
          }

          nextSibling.prevSibling = this;

          // The DOM handles the list management for us.
          if (DEBUG_PSURFACES) {
            sc_assert(childElement);
            sc_assert(childElement.parentNode);
          }
          childElement.parentNode.removeChild(childElement);

        } else {
          // We need to create a new Psurface.
          if (DEBUG_PSURFACES) sc_assert(!document.getElementById(id));

          nextChild = nextSibling;
          nextSibling = SC.psurfaces[id] =  new SC.Psurface(surface);
          childElement = nextSibling.__element__;
        }

        // These are the same regardless of whether or not the child node 
        // already exits, or was created on demand.
        nextSibling.parent = this.parent;
        this.nextSibling = nextSibling;
        nextSibling.prevSibling = this;
        nextSibling.nextSibling = nextChild;
        nextChild.prevSibling = nextSibling;

        // Place nextSibling before nextChild.
        el.parentElement.insertBefore(childElement, nextChild.__element__);
      }

    } else {
      child = psurfaces[id];
      if (child) {
        nextSibling = this.nextSibling = child;

        // We need to remove nextSibling from wherever it is now.
        prev = nextSibling.prevSibling;
        next = nextSibling.nextSibling;

        childElement = nextSibling.__element__;

        if (prev && next) {
          // Splice.
          prev.nextSibling = next;
          next.prevSibling = prev;
        } else if (prev) {
          prev.nextSibling = null;
        } else if (next) {
          // Move to first.
          next.prevSibling = null;
          next.parent.firstChild = next;
        } else {
          // We're the only child.
          nextSibling.parent.firstChild = null;
        }

        nextSibling.prevSibling = null;

        // The DOM handles the list management for us.
        if (DEBUG_PSURFACES) {
          sc_assert(childElement);
          sc_assert(childElement.parentNode);
        }
        childElement.parentNode.removeChild(childElement);

        nextSibling.parent = this.parent;
        nextSibling.prevSibling = this;
        nextSibling.nextSibling = null;

        el.parentElement.appendChild(childElement);

      } else {
        // Need to create a new Psurface.
        if (DEBUG_PSURFACES) sc_assert(!document.getElementById(id));

        nextSibling = this.nextSibling = new SC.Psurface(surface);
        nextSibling.parent = this.parent;
        nextSibling.prevSibling = this;
        psurfaces[id] = nextSibling;

        el.parentElement.appendChild(nextSibling.__element__);
      }
    }

    if (DEBUG_PSURFACES) {
      // Sanity check nextSibling for all code paths.
      sc_assert(nextSibling);
      sc_assert(nextSibling instanceof SC.Psurface);
      sc_assert(nextSibling === psurfaces[id]);
      sc_assert(nextSibling === this.nextSibling);
      sc_assert(nextSibling.parent === this.parent);
      sc_assert(nextSibling.prevSibling === this);
      sc_assert(nextSibling.__element__);
      sc_assert(nextSibling.__element__ === document.getElementById(id));
      sc_assert(nextSibling.__element__.parentElement === this.__element__.parentElement);
    }

    // We've discovered nextSibling.
    nextSibling.discover(surface);

    return (SC._sc_currentPsurface = nextSibling);
  },

  pop: function() {
    // console.log('SC.Psurface#pop()');
    var el = this.__element__,
        nextSibling = this.nextSibling,
        myId = this.id,
        psurfaces = SC.psurfaces,
        surfacesBeingMoved = SC._sc_psurfacesBeingMoved,
        next;

    function moveChildren(psurface) {
      var child, id,
          next = psurface.firstChild;
      while (next) {
        child = next;
        next = child.nextSibling;
        id = child.id;
        if (DEBUG_PSURFACES) sc_assert(psurfaces[id]);
        delete psurfaces[id];
        surfacesBeingMoved[child.id] = child;
        if (child.firstChild) moveChildren(child);
      }
    }

    if (SC._sc_psurfaceColor[myId] === 1) { // grey
      // We should not have any children.
      if (this.firstChild) {
        // We need to remove our children.  This is somewhat complicated, the 
        // children we are removing could exist somewhere else in the tree, 
        // so the children (and their children) need to be accessible.  In 
        // addition, we don't want to tear down the whole tree, as this would 
        // involve a lot of DOM manipulation.
        var child, childId;
        next = this.firstChild;
        while (next) {
          child = next;
          next = child.nextSibling;
          child.parent = null;
          child.prevSibling = null;
          child.nextSibling = null;
          el.removeChild(child.__element__);
          childId = child.id;

          // Need to move detached surfaces from active to "being moved".
          if (DEBUG_PSURFACES) sc_assert(psurfaces[childId]);
          delete psurfaces[childId];
          surfacesBeingMoved[childId] = child;
          moveChildren(child);
        }
        this.firstChild = null;
      }

      // We've been visited.
      SC._sc_psurfaceColor[myId] = 2; // black
    }

    if (DEBUG_PSURFACES) {
      sc_assert(SC._sc_psurfaceColor[myId] === 2); // black

      sc_assert(this === SC._sc_currentPsurface);
      sc_assert(this.__element__);
      sc_assert(this.__element__ === document.getElementById(this.id));
    }

    if (nextSibling) {
      // We need to remove any futher siblings and store them in 
      // `surfacesBeingMoved`.
      var nextSiblingId;
      next = nextSibling;
      while (next) {
        nextSibling = next;
        next = nextSibling.nextSibling;
        nextSibling.parent = null;
        nextSibling.prevSibling = null;
        nextSibling.nextSibling = null;
        el.parentNode.removeChild(nextSibling.__element__);
        nextSiblingId = nextSibling.id;

        // Need to move detached surfaces from active to "being moved".
        if (DEBUG_PSURFACES) {
          sc_assert(psurfaces[nextSiblingId]);
          sc_assert(!surfacesBeingMoved[nextSiblingId]);
        }
        delete psurfaces[nextSiblingId];
        surfacesBeingMoved[nextSiblingId] = nextSibling;
        moveChildren(nextSibling);
      }
      this.nextSibling = null;
    }

    if (DEBUG_PSURFACES) {
      // Sanity check this for all code paths.
      sc_assert(this.nextSibling === null);

      // Normally, there shouldn't be a next element, but the field editor *could* be inserted. Allow that.
      sc_assert(this.__element__.nextElementSibling === null || this.__element__.nextElementSibling.nodeName === 'INPUT');
    }

    SC._sc_currentPsurface = this.parent;
  }

};

SC.Psurface.end = function(surface) {
  // console.log('SC.Psurface#end()');
  var id = surface.__id__,
      psurface = SC.psurfaces[id],
      psurfaces = SC.psurfaces,
      el = psurface.__element__;

  function removeChildren(psurface) {
    var child, id,
        next = psurface.firstChild;
    while (next) {
      child = next;
      next = child.nextSibling;
      id = child.id;
      if (DEBUG_PSURFACES) sc_assert(psurfaces[id]);
      delete psurfaces[id];
      if (child.firstChild) removeChildren(child);
    }
  }

  if (SC._sc_psurfaceColor[id] === 1) { // grey
    // We should not have any children.
    if (psurface.firstChild) {
      // We do not need to move our children -- the tree is empty except for
      // the root node.
      var child, childId,
          next = psurface.firstChild;
      while (next) {
        child = next;
        next = child.nextSibling;
        child.parent = null;
        child.prevSibling = null;
        child.nextSibling = null;
        el.removeChild(child.__element__);
        childId = child.id;

        // Need to move detached surfaces from active to "being moved".
        if (DEBUG_PSURFACES) sc_assert(psurfaces[childId]);
        delete psurfaces[childId];
        removeChildren(child);
      }
      psurface.firstChild = null;
    }

    // We've been visited.
    SC._sc_psurfaceColor[id] = 2; // black
  }

  if (DEBUG_PSURFACES) {
    sc_assert(SC._sc_psurfaceColor[id] === 2); // black

    // Sanity check the surface.
    sc_assert(surface);
    sc_assert(surface.kindOf(SC.Surface));
    sc_assert(surface.get('supersurface') === null);
    sc_assert(surface === SC.surfaces[surface.__id__]);

    sc_assert(psurface);
    sc_assert(psurface === SC._sc_currentPsurface);
    sc_assert(psurface.parent === null);
  }

  // We've been visited.
  SC._sc_psurfaceColor[id] = 2; // black

  // console.log(SC._sc_psurfaceColor);

  // Invoke any surface callbacks.
  var ary = SC.surfaceCallbacks, idx, len, hash,
      element;

  for (idx=0, len=ary.length; idx<len; ++idx) {
    hash = ary[idx];

    if (DEBUG_PSURFACES) {
      sc_assert(hash);
      sc_assert(typeof hash === 'object');
      sc_assert(hash.surface.kindOf(SC.Surface));
      sc_assert(document.getElementById(hash.element.id));
    }

    surface = hash.surface;
    if (surface.didAppendElement) surface.didAppendElement(hash.element);
  }
  SC.surfaceCallbacks = []; // Reset

  SC._sc_currentPsurface     = null;
};

SC.Psurface.finish = function() {
  // console.log('SC.Psurface.finish()');
  SC._sc_psurfacesBeingMoved = null; // GC these

  // Any psurfaces that are white need to be removed.
  var key, psurfaces = SC.psurfaces,
      colors = SC._sc_psurfaceColor,
      psurface, el, body = document.body;

  for (key in colors) {
    if (!colors.hasOwnProperty(key)) continue;
    if (colors[key] !== 0) continue;

    // The color is white –– HOWEVER –– that doesn't mean we haven't dealt 
    // with the Psurface already, it could have been a child of some other 
    // Psurface, and thus dealt with during the traverasal.
    psurface = psurfaces[key];
    if (psurface) {
      delete psurfaces[key]; // GC

      // We only remove DOM nodes on "root" surfaces -- those added directly to 
      // the body.  Any child DOM nodes will be GCd along with it.
      el = psurface.__element__;
      if (body === el.parentNode) {
        // console.log('removing an element');
        body.removeChild(el);
      }
    }
  }

  SC._sc_psurfaceColor = null;
};

/** @private */
SC.Psurface.sharedStyleSheet = function() {
  var head, element, ss;

  if (DEBUG_PSURFACES) sc_assert(!this.prototype.sharedStyleSheet);

  // Create the stylesheet object the hard way (works everywhere).
  element = document.createElement('style');
  element.type = 'text/css';
  element.id = 'sharedStyleSheet';
  head = document.getElementsByTagName('head')[0];
  head.appendChild(element);
  
  // Get the actual stylesheet object, not the DOM element.
  ss = this.prototype.sharedStyleSheet = document.styleSheets[document.styleSheets.length-1];
  return ss;
};
