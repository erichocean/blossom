// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            portions copyright @2009 Apple Inc.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*global module test htmlbody ok equals same stop start */

(function() {
	var pane = SC.ControlTestPane.design()
		.add("diclosure", SC.DisclosureView, {
	      value: false, isEnabled: true		
		})
		.add("selected", SC.DisclosureView, {
	      value: true	
		})
		.add("disabled", SC.DisclosureView, {
	      isEnabled: false
		})
		.add("selected - disabled", SC.DisclosureView, {
	      value: true, isEnabled: false
		});
	pane.show();
	
	suite("TODO: Test SC.DisclosureView UI", pane.standardSetup());
	
	test("basic", function() {
		var view = pane.view('diclosure');
		ok(!view.$().hasClass('disabled'), 'should not have disabled class');
	    ok(!view.$().hasClass('sel'), 'should not have sel class');
		ok(!view.get('value'), 'should not be opened');
	    // ok(!input.attr('checked'), 'input should not be opened');
	    // ok(!input.attr('disabled'), 'input should not be disabled');
	  });

	  test("selected", function() {
	    var view = pane.view('selected');
	    ok(!view.$().hasClass('disabled'), 'should not have disabled class');
	    ok(view.$().hasClass('sel'), 'should have sel class');
		ok(view.get('value'), 'should be opened');
	    // ok(input.attr('checked'), 'input should be opened');
	    // ok(!input.attr('disabled'), 'input should not be disabled');
	  });

	  test("disabled", function() {
	    var view = pane.view('disabled');
	    ok(view.$().hasClass('disabled'), 'should have disabled class');
	    ok(!view.$().hasClass('sel'), 'should not have sel class');
		ok(!view.get('value'), 'should not be opened');
	    // ok(!input.attr('checked'), 'input should not be opened');
	    // ok(input.attr('disabled'), 'input should be disabled');
	  });

	  test("disabled - selected", function() {
	    var view = pane.view('selected - disabled');
	    ok(view.$().hasClass('disabled'), 'should have disabled class');
	    ok(view.$().hasClass('sel'), 'should have sel class');
		ok(view.get('value'), 'should be opened');
	    // ok(input.attr('checked'), 'input should be opened');
	    // ok(input.attr('disabled'), 'input should be disabled');
	  });

})();
