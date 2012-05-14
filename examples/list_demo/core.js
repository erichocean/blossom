// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global ListDemo sc_assert */

ListDemo = global.ListDemo = SC.Object.create({

});

ListDemo.store = SC.Store.create();

// Creat a list with some items in it.
ListDemo.arrayController = SC.ArrayController.create({
  content: function() {
    var ary = [];
    for (var idx=0, len=150; idx<len; ++idx) {
      ary.push(ListDemo.store.createRecord(SC.Record, {
        index: idx,
        checkbox: false,
        name: "hello world",
        color: 'red'
      }));
    }
    return ary;
  }()
});
