// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

if (BLOSSOM) {

SC.psurfaces = {};
SC.psurfacesBeingRemoved = {};
SC.psurfacesBeingMoved = null;

/** @private
  A presentation surface (Psurface) is a lightweight representation of the 
  surface tree used to manage the rendering tree and apply animations and 
  transitions to it. 

  A Psurface's corresponding rendering surface is *always* in the rendering 
  tree at the beginning of an event loop if it exists in either the 
  `SC.psurfaces` or `SC.psurfacesBeingRemoved` hashes.  (The rendering tree 
  is the DOM tree when Blossom is running in the browser.)

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
  - SC.Psurface#pop(surface)
  - SC.Psurface.end(surface)

  These operations correspond to a top-down traversal of the Psurface _from 
  the point of view of the surface tree_.  A Psurface handles these commands 
  by determining if its _own_ traversal matches.  When it does not, it makes 
  adjustments to bring its own tree into compliance, based on the state of 
  the surfaces themselves.

  Four global hashes are used to maintain state during this process.  In the 
  `SC.surfaces` hash, each surface that is in the surface tree has an entry. 
  In the `SC.psurfaces` hash, each Psurface whose corresponding rendering 
  surface is in the render tree is reperesent, _with the exception_ of those 
  Psurfaces that are in the process of being removed.  These Psurfaces are 
  held in the `SC.psurfacesBeingRemoved` hash.

  While bringing a presentation tree in sync with a surface tree, the 
  `SC.psurfacesBeingMoved` hash can be used to remember Psurfaces that are 
  temporarily detached from the currently syncing Psurface tree, but are 
  known to become attached in the end.

  Beyond managing the rendering tree, a major responsibility of a Psurface is 
  to retrieve and apply animations and transitions to surface properties.

  Property animations and transitions should be done after a Psurface's 
  rendering surface has been added to the rendering tree, but before moving 
  on to the next Psurface.  This happens in three situations:

  - SC.Psurface#push(surface)
  - SC.Psurface#next(surface)
  - SC.Psurface#pop(surface)

  In all three commands, the current psurfaces will never be visited again, 
  and its rendering surface (e.g. DOM node) is guaranteed to be in the 
  rendering tree at that point.

  The DOM tree itself needs to be built immediatly during the sync algorithm, 
  beacuse child nodes need to be able to append to their parent nodes.
*/
SC.Psurface = function(surfaceId) {
  sc_assert(surfaceId && typeof surfaceId === 'string', "new SC.Psurface(): you must provide a `surfaceId`, and it must be a string.");
  sc_assert(SC.surfaces[surfaceId], "new SC.Psurface(): Invalid `surfaceId`: surface is not in the `SC.surfaces` hash.");

  // Set all these properties up front so we get the "same" internal class in 
  // browsers like Google Chrome.
  this.id = surfaceId;
  this.parent = null;
  this.firstChild = null;
  this.nextSibling = null;
  this.prevSibling = null;
  this.__element__ = null;

  return this;
};

SC.Psurface.prototype = {

  push: function(surface) {
    console.log('SC.Psurface#push()');
  },

  next: function(surface) {
    console.log('SC.Psurface#next()');
  },

  pop: function(surface) {
    console.log('SC.Psurface#pop()');
  }

};

/** @private */
SC.currentPsurface = null; // Mostly a safety check to make sure our callers
                           // use our API correctly.

SC.Psurface.begin = function(surface) {
  console.log('SC.Psurface#begin()');

  sc_assert(surface && surface.kindOf(SC.Surface));
  sc_assert(surface.get('supersurface') === null);
  sc_assert(SC.surfaces[surface.__id__] === surface);
  sc_assert(SC.currentPsurface === null);

  var id = surface.__id__,
      psurface = SC.psurfaces[id];

  if (!psurface) {
    if (psurface = SC.psurfacesBeingRemoved[id]) {
      // The psurface has an element, and may have a parent. If the psurface 
      // has a parent, we need to remove it from it's parent.  The psurface 
      // is in the DOM already.
      
    } else if (psurface = SC.psurfacesBeingMoved[id]) {
      // The psurface has an element, and may have a parent. If the psurface 
      // has a parent, we need to remove it from it's parent.  The psurface 
      // is NOT in the DOM.
      
    } else {
      // We need to create a Psurface for this surface.
      psurface = new SC.Psurface(id);
      // FIXME: We need to init the this.element somehow here, right?
      // Ask the surface? Hmm...
      surface.initPsurfaceElement(psurface);
    }
    SC.psurfaces[id] = psurface;
  }

  // Sanity check.
  sc_assert(psurface && psurface instanceof SC.Psurface && psurface.parent === null);
  sc_assert(SC.psurfaces[id] === psurface);
  sc_assert(psurface.__element__ && document.getElementById(id) === psurface.__element__);

  return (SC.currentPsurface = psurface);
};

SC.Psurface.end = function(surface) {
  console.log('SC.Psurface#end()');

  sc_assert(surface && surface.kindOf(SC.Surface));

  var psurface = SC.psurfaces[surface.__id__];

  sc_assert(psurface && psurface.parent === null);
  sc_assert(SC.currentPsurface === psurface);

  SC.currentPsurface = null;
  return psurface;
};

} // BLOSSOM
