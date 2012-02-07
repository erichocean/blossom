// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/surface');
sc_require('surfaces/transitions/surface_transition');

if (BLOSSOM) {

/** @class
  `SC.ContainerSurface` implements a swappable surface container.  You can 
  set the container's `surface` property to a surface, and the surface will 
  be sized and positioned according to the container's size and position.

  In addition, the surface will be animated into place using one of three 
  hardware-accellerated 3D transitions:

  - order in (defaults to SC.ENTER_LEFT)
  - replace (defaults to SC.SLIDE_FLIP_LEFT)
  - order out (defaults to SC.EXIT_RIGHT)

  You can change the transition to use, or set them to `null` to use no 
  transition at all.

  @extends SC.Surface
  @since Blossom 1.0
*/
SC.ContainerSurface = SC.Surface.extend({

  /** @property
    The surface displayed by this container.

    The surface's parent layout is relative to the container, and sized 
    based on its bounds.

    Animated, hardware-accelerated 3D transitions are available when changing 
    the surface.  There are three possible transitions:

    - order in (defaults to SC.ENTER_LEFT)
    - replace (defaults to SC.SLIDE_FLIP_LEFT)
    - order out (defaults to SC.EXIT_RIGHT)

    You can change the type of transition for each of these situations, and 
    that transition will be used whenever the `surface` property is changed.

    @type SC.Surface or null
  */
  surface: null,

  orderInTransition:  SC.ENTER_LEFT,
  replaceTransition:  SC.SLIDE_FLIP_LEFT,
  orderOutTransition: SC.EXIT_RIGHT,

  _sc_surface: null, // Note: Required, we're strict about null checking.
  _sc_surfaceDidChange: function() {
    var old = this._sc_surface,
        cur = this.get('surface'),
        element = this.__sc_element__,
        transition, container, style;

    sc_assert(element);
    sc_assert(old === null || old.kindOf(SC.Surface), "Blossom internal error: SC.Application^_sc_surface is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Surface), "SC.ContainerSurface@surface must either be null or an SC.Surface instance.");

    if (old === cur) return; // Nothing to do.

    this._sc_surface = cur;
    if (cur) {
      cur.setIfChanged('isPresentInViewport', this.get('isPresentInViewport'));
      cur.setIfChanged('applicationHasFocus', this.get('applicationHasFocus'));
    }

    if (!old && cur)      transition = this.get('orderInTransition');
    else if (old && cur)  transition = this.get('replaceTransition');
    else if (old && !cur) transition = this.get('orderOutTransition');
    else sc_assert(false);

    // transition = null; // force no transition
    if (old) transition = null;
    if (transition) {
      
      // order in
      if (!old && cur) {
        container = cur.get('container');
        sc_assert(container);
        sc_assert(!document.getElementById(container.id));

        style = container.style;
        style.display  = 'block';
        style.position = 'absolute';
        style.top      = '0px';
        style.left     = '0px';
        style.width    = '100%';
        style.height   = '100%';
        style.webkitBackfaceVisibility = 'hidden';
        style.webkitTransform = 'rotateY(180deg)';

        // The order is important here, otherwise the layers won't have the 
        // correct size.
        element.insertBefore(container, null); // add to DOM
        element.style.opacity = '1';
        element.style.webkitTransform = 'translateX(-100%) rotateY(-180deg)';
        cur.didAttach();
      }

    // Update the UI without any 3D transition.
    } else {

      // order in
      if (!old && cur) {
        container = cur.get('container');
        sc_assert(container);
        sc_assert(!document.getElementById(container.id));

        style = container.style;
        style.position = 'absolute';
        style.top      = '0px';
        style.left     = '0px';
        style.width    = '100%';
        style.height   = '100%';

        // The order is important here, otherwise the layers won't have the 
        // correct size.
        element.insertBefore(container, null); // add to DOM
        cur.didAttach();

      // replace
      } else if (old && cur) {
        container = cur.get('container');
        sc_assert(container);
        sc_assert(!document.getElementById(container.id));
        sc_assert(document.getElementById(old.get('container').id));

        style = container.style;
        style.position = 'absolute';
        style.top      = '0px';
        style.left     = '0px';
        style.width    = '100%';
        style.height   = '100%';

        // The order is important here, otherwise the layers won't have the 
        // correct size.
        element.replaceChild(container, old.get('container'));
        cur.didAttach();
        old.didDetach();

      // order out
      } else if (old && !cur) {
        sc_assert(document.getElementById(old.get('container').id));

        element.removeChild(old.get('container'));
        old.didDetach();
      }
    }
  }.observes('surface'),

  viewportSizeDidChange: function(size) {
    console.log('SC.ContainerSurface#viewportSizeDidChange()');
  }

});

} // BLOSSOM
