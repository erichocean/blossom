// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

if (BLOSSOM) {

SC.animationTransactions = [];

SC.AnimationTransaction = SC.Object.extend({

  isAnimationTransaction: true, // Walk like a duck.

  duration: 250, // in milliseconds

  delay: 0       // in milliseconds

});

SC.AnimationTransaction.begin = function() {
  var transaction = SC.AnimationTransaction.create.apply(SC.AnimationTransaction, arguments);
  SC.animationTransactions.push(transaction);
};

SC.AnimationTransaction.end = function() {
  sc_assert(SC.animationTransactions.length > 0);
  SC.animationTransactions.pop();
};

} // BLOSSOM
