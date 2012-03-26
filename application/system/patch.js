
// first pass needs docs badly
SC.Patch = SC.Object.extend(
  /** @lends SC.Patch.prototype */ {

  target: null,

  body: null,

  commit: function() {
    var target = this.target;
    var body = this.body;
    var key;
    var patchedSomething = false;

    if(this.isCommitted) return false;

    if(!target || !body) return false;

    if(SC.typeOf(target) === SC.T_STRING)
      target = SC.objectForPropertyPath(target);

    if(!target) return false;

    if(SC.typeOf(body) !== SC.T_HASH) return false;

    target = target.__proto__ ? target.__proto__ : target.prototype;

    if(!target) return false;

    for(key in body) {
      if(!body.hasOwnProperty(key)) continue;
      target[key] = body[key];
      patchedSomething = true;
    }

    if(patchedSomething) this.isCommitted = true;

    return patchedSomething;
  },

  isCommitted: false,

  autoCommit: true,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    if(this.autoCommit) this.commit();
  }

});
