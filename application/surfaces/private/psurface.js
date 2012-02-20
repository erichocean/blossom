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
  surface is in the render tree is reperesent, _with the exception_ of those 
  Psurfaces that are in the process of being removed.  These Psurfaces are 
  held in the `SC.psurfacesBeingRemoved` hash.

  While bringing a presentation tree in sync with a surface tree, the 
  `SC.psurfacesBeingMoved` hash can be used to remember Psurfaces that are 
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
SC.Psurface = function(surfaceId) {
  sc_assert(surfaceId);
  sc_assert(typeof surfaceId === 'string', "new SC.Psurface(): you must provide a `surfaceId`, and it must be a string.");
  sc_assert(SC.surfaces[surfaceId], "new SC.Psurface(): Invalid `surfaceId`: surface is not in the `SC.surfaces` hash.");

  // Set all these properties up front so we get the "same" internal class in 
  // browsers like Google Chrome.
  this.__id__ = surfaceId;
  this.__element__ = null;

  this.parent = null;
  this.firstChild = null;
  this.nextSibling = null;
  this.prevSibling = null;

  return this;
};

SC.Psurface.prototype = {

  push: function(surface) {
    console.log('SC.Psurface#push()');
    var el = this.__element__,
        firstChild = this.firstChild,
        id = surface.__id__;

    sc_assert(this === SC.currentPsurface);
    sc_assert(el);
    sc_assert(el === document.getElementById(this.__id__));

    // Sanity check the surface.
    sc_assert(surface);
    sc_assert(surface.kindOf(SC.Surface));
    sc_assert(surface === SC.surfaces[surface.__id__]);

    if (firstChild) {
      console.log('unhandled');

    } else {
      // Need to create a new Psurface.
      sc_assert(!document.getElementById(id));

      firstChild = new SC.Psurface(id);
      firstChild.parent = this;
      SC.psurfaces[id] = firstChild;

      surface.initPsurfaceElement(firstChild);
      sc_assert(firstChild.__element__);
      el.appendChild(firstChild.__element__);
    }

    // Sanity check firstChild for all code paths.
    sc_assert(firstChild);
    sc_assert(firstChild instanceof SC.Psurface);
    sc_assert(firstChild === SC.psurfaces[id]);
    sc_assert(firstChild.parent === this);
    sc_assert(firstChild.prevSibling === null);
    sc_assert(firstChild.__element__);
    sc_assert(firstChild.__element__ === document.getElementById(id));
    sc_assert(firstChild.__element__.parentElement === this.__element__);

    return (SC.currentPsurface = firstChild);
  },

  next: function(surface) {
    console.log('SC.Psurface#next()');
    var el = this.__element__,
        nextSibling = this.nextSibling,
        id = surface.__id__;

    sc_assert(this === SC.currentPsurface);
    sc_assert(el);
    sc_assert(el === document.getElementById(this.__id__));

    // Sanity check the surface.
    sc_assert(surface);
    sc_assert(surface.kindOf(SC.Surface));
    sc_assert(surface === SC.surfaces[surface.__id__]);

    if (nextSibling) {
      console.log('unhandled');

    } else {
      // Need to create a new Psurface.
      sc_assert(!document.getElementById(id));

      nextSibling = new SC.Psurface(id);
      nextSibling.parent = this.parent;
      nextSibling.prevSibling = this;
      SC.psurfaces[id] = nextSibling;

      surface.initPsurfaceElement(nextSibling);
      sc_assert(nextSibling.__element__);
      el.parentElement.appendChild(nextSibling.__element__);
    }

    // Sanity check nextSibling for all code paths.
    sc_assert(nextSibling);
    sc_assert(nextSibling instanceof SC.Psurface);
    sc_assert(nextSibling === SC.psurfaces[id]);
    sc_assert(nextSibling.parent === this.parent);
    sc_assert(nextSibling.prevSibling === this);
    sc_assert(nextSibling.__element__);
    sc_assert(nextSibling.__element__ === document.getElementById(id));
    sc_assert(nextSibling.__element__.parentElement === this.__element__.parentElement);

    return (SC.currentPsurface = nextSibling);
  },

  pop: function() {
    console.log('SC.Psurface#pop()');
    var el = this.__element__,
        nextSibling = this.nextSibling;

    sc_assert(this === SC.currentPsurface);
    sc_assert(el);
    sc_assert(el === document.getElementById(this.__id__));

    if (nextSibling) {
      console.log('unhandled');
    }

    // Sanity check this for all code paths.
    sc_assert(this.nextSibling === null);

    SC.currentPsurface = this.parent;
  }

};

/** @private */
SC.currentPsurface = null; // Mostly a safety check to make sure our callers
                           // use our API correctly.

SC.Psurface.begin = function(surface) {
  console.log('SC.Psurface#begin()');

  sc_assert(SC.currentPsurface === null);
  sc_assert(SC.psurfacesBeingMoved === null);

  // Sanity check the surface.
  sc_assert(surface);
  sc_assert(surface.kindOf(SC.Surface));
  sc_assert(surface.get('supersurface') === null);
  sc_assert(surface === SC.surfaces[surface.__id__]);

  SC.psurfacesBeingMoved = {};

  var id = surface.__id__,
      psurface = SC.psurfaces[id];

  // If the psurface already exists, it is in the DOM, and should not have a 
  // parent (we verify this below).

  if (!psurface) {
    if (psurface = SC.psurfacesBeingRemoved[id]) {
      // The psurface has an element, and may have a parent. If the psurface 
      // has a parent, we need to remove it from it's parent. The psurface 
      // is in the DOM already.

      delete SC.psurfacesBeingRemoved[id];

    } else {
      // We need to create a Psurface for this surface.
      sc_assert(!document.getElementById(id));

      psurface = new SC.Psurface(id);
      surface.initPsurfaceElement(psurface);
      sc_assert(psurface.__element__);
      document.body.appendChild(psurface.__element__, null);
    }

    // The psurface is now current and present in the rendering tree (DOM).
    SC.psurfaces[id] = psurface;
  }

  // Sanity check the psurface for all code paths.
  sc_assert(psurface);
  sc_assert(psurface instanceof SC.Psurface);
  sc_assert(psurface === SC.psurfaces[id]);
  sc_assert(psurface.parent === null);
  sc_assert(psurface.__element__);
  sc_assert(psurface.__element__ === document.getElementById(id));
  sc_assert(psurface.__element__.parentElement === document.body);

  return (SC.currentPsurface = psurface);
};

SC.Psurface.end = function(surface) {
  console.log('SC.Psurface#end()');

  // Sanity check the surface.
  sc_assert(surface);
  sc_assert(surface.kindOf(SC.Surface));
  sc_assert(surface.get('supersurface') === null);
  sc_assert(surface === SC.surfaces[surface.__id__]);

  var psurface = SC.psurfaces[surface.__id__];

  sc_assert(psurface);
  sc_assert(psurface === SC.currentPsurface);
  sc_assert(psurface.parent === null);

  SC.currentPsurface = null;
  SC.psurfacesBeingMoved = null;
};

} // BLOSSOM
