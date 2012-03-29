
/**global SC */

/** 
  @class

  Patch an existing object class by a set of properties in
  a hash. Will modify all existing instances of the class
  by extending its prototype. 

  @author W. Cole Davis

  @extends SC.Object
*/
SC.Patch = SC.Object.extend(
  /** @lends SC.Patch.prototype */ {

  /**
    Walk like a duck.

    @type Boolean
    @default true
  */
  isPatch: true,

  /**
    The target class to extend with the properties
    of this patch. Can be a string or a class constructor
    but in most cases should be a string.

    @type String|Object
    @default null
  */
  target: null,

  /** 
    The hash of properties to apply as the patch to the
    target class.
    
    @type Object
    @default null
  */
  body: null,
  
  /**
    Whether the patch should be applied automatically on
    instance creation.

    @type Boolean
    @default true
  */
  autoCommit: true,

  //............................................
  // CALCULATED PROPERTIES
  //

  /**
    Returns if this patch has already been applied or not.

    @property
    @type Boolean
    @default false
  */
  isCommitted: function() {
    var target = this._findTarget();
    var scguid = SC.guidFor(this);
    var patched = target ? target.patchedBy : null;
    return patched ? patched.contains(scguid) : false;
  }.property('_patchTime').cacheable(),

  //............................................
  // PUBLIC METHODS
  //

  /**
    Applies the patch body to the target.

    @method
    @returns {Boolean} YES|NO whether it was able to
      patch the target or not.
  */
  commit: function() {
    var target = this._findTarget();
    var body = this.body;
    var key;
    var patchedSomething = false;

    // if we've already committed, don't do it again
    if (this.get('isCommitted')) return false;

    // if we don't have a target or body we can't
    // really do much
    if (!target || !body) return false;

    // the body has to be a format that we can do
    // something with
    if (SC.typeOf(body) !== SC.T_HASH) return false;

    // iterate over properties in the body hash and
    // try to apply those
    for (key in body) {
      if (!body.hasOwnProperty(key)) continue;

      // TODO: Interesting thought, is it possible to
      // track the previous values of keys that are being
      // overwritten and replace them if removed later?
      // Obviously some technical difficulties here because
      // of observers, possible memory leaks, etc...

      target[key] = body[key];
      patchedSomething = true;
    }

    if (patchedSomething) {

      // update our patch time
      this.set('_patchTime', Date.now());
      
      // if nothing else has patched this reference
      // go ahead and set it up
      if (!target.patchedBy) target.patchedBy = [];

      // make sure we're in the mix
      target.patchedBy.push(SC.guidFor(this));
    }
    return patchedSomething;
  },

  //............................................
  // PRIVATE PROPERTIES
  //

  /**
    The time the patch was committed. 

    @private
  */
  _patchTime: null,

  //............................................
  // PRIVATE METHODS
  //

  /**
    Finds the intended target object class from the
    string or reference provided (if any) and returns
    the prototype for it.

    @method
    @private
    @returns {Object} Returns the prototype for the object
      or null if none defined.
  */
  _findTarget: function() {
    var target = this.target;

    // if no target defined, we can't find anything else
    if (!target) return null;

    // if it is a string try and find the object/class it
    // references
    if (SC.typeOf(target) === SC.T_STRING) {
      target = SC.objectForPropertyPath(target);

      // couldn't find it
      if (!target) return null;
    }
  
    // try and find the prototype
    target = target.prototype;
    
    // target might be undefined for some reason
    if (!target) return null;
    return target;
  },

  /** @private */
  init: function() {
    arguments.callee.base.apply(this, arguments);
    if (this.autoCommit) this.commit();
  }

});
