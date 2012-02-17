// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2010 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var view ;
suite("SC.CollectionView#displayProperties", {
  setup: function() {
    view = SC.CollectionView.create({
        isVisibleInWindow: true
    }).createLayer();
  },

  teardown: function() {
    view.destroy();
  }
});

test("should gain active class if isActive", function() {
  SC.RunLoop.begin();
  view.set('isActive', true);
  SC.RunLoop.end();
  ok(view.$().hasClass('active'), 'should have active class');

  SC.RunLoop.begin();
  view.set('isActive', false);
  SC.RunLoop.end();
  ok(!view.$().hasClass('active'), 'should remove active class');
});
