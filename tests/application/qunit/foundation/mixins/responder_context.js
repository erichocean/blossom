// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2010 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*global module test equals context ok same */
var S, A, a, B, Manager;
suite("ResponderContext", {
  setup: function() {
    Manager = SC.Object.create(SC.Responder, SC.ResponderContext, {  });
    var TestResponder = SC.Object.extend(SC.Responder, {
      didBecomeFirstResponder: function() {
        this.didBecome = true;
        this.hasFirst = true;
      },
      willLoseFirstResponder: function() {
        this.didLose = true;
        this.hasFirst = false;
      }
    });
    
    A = TestResponder.create();
    a = TestResponder.create({nextResponder: A});
    B = TestResponder.create();
  }
});

test("Can enter and exit states.", function() {
  Manager.makeFirstResponder(A);
  ok(A.didBecome, "A did become first responder.");
  ok(A.hasFirst, "A has first responder.");
  
  Manager.makeFirstResponder(B);
  ok(A.didLose, "A did lose first responder.");
  ok(!A.hasFirst, "A does not have first responder.");
});

test("Can enter and exit chained states.", function() {
  Manager.makeFirstResponder(A);
  ok(A.didBecome, "A did become first responder.");
  ok(A.hasFirst, "A has first responder.");
  
  Manager.makeFirstResponder(a);
  ok(!A.didLose, "A did not lose first responder.");
  ok(A.hasFirst, "A has first responder.");
  ok(A.didBecome, "a did become first responder.");
  ok(A.hasFirst, "a has first responder.");
  
  Manager.makeFirstResponder(B);
  ok(a.didLose, "a did lose first responder.");
  ok(!a.hasFirst, "a does not have first responder.");
  ok(A.didLose, "A did lose first responder.");
  ok(!A.hasFirst, "A does not have first responder.");
});

test("Setting responder to the current responder does not reenter.", function() {
  Manager.makeFirstResponder(A);
  ok(A.didBecome, "A did become first responder.");
  ok(A.hasFirst, "A has first responder.");

  A.didBecome = false;
  Manager.makeFirstResponder(A);
  ok(!A.didBecome, "A did become first responder.");
});

test("Calling 'resetFirstResponder' reenters the first responder.", function() {
  Manager.makeFirstResponder(A);
  ok(A.didBecome, "A did become first responder.");
  ok(A.hasFirst, "A has first responder.");

  A.didBecome = false;
  Manager.resetFirstResponder();
  ok(A.didLose, "A did leave.");
  ok(A.didBecome, "A did reenter.");
});
