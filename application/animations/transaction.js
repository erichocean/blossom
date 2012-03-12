// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

SC.animationTransactions = [];

SC.AnimationTransaction = SC.Object.extend({

  isAnimationTransaction: true, // Walk like a duck.

  duration: null, // in milliseconds

  delay: null,    // in milliseconds

  init: function() {
    arguments.callee.base.apply(this, arguments);
    sc_assert(typeof this.get('duration') === "number" || this.get('duration') === null);
    sc_assert(this.get('duration') !== null? this.get('duration') === Math.floor(this.get('duration')) : true); // Integral
    sc_assert(this.get('duration') !== null? this.get('duration') >= 0 : true);
    sc_assert(typeof this.get('delay') === "number" || this.get('delay') === null);
    sc_assert(this.get('delay') !== null? this.get('delay') === Math.floor(this.get('delay')) : true); // Integral
  }

});

SC.AnimationTransaction.begin = function() {
  var transaction = SC.AnimationTransaction.create.apply(SC.AnimationTransaction, arguments);
  SC.animationTransactions.push(transaction);
};

SC.AnimationTransaction.end = function() {
  sc_assert(SC.animationTransactions.length > 0);
  SC.animationTransactions.pop();
};

SC.AnimationTransaction.top = function() {
  var animationTransactions = SC.animationTransactions,
      length = animationTransactions.length;

  if (length > 0) return animationTransactions[length-1];
  else return null;
};
