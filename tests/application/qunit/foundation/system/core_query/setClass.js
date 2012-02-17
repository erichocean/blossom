// ========================================================================
// CoreQuery Tests
// ========================================================================

suite("CoreQuery.setClass()");

test("setClass(existing, NO) should remove the class", function() {
  var cq = SC.$('<div class="existing"></div>') ;
  equals(cq.hasClass('existing'), true, "cq has existing");
  
  cq.setClass("existing", NO) ;
  equals(cq.hasClass('existing'), NO, 'cq should not have existing');
});

test("setClass(existing, true) should do nothing", function() {
  var cq = SC.$('<div class="existing"></div>') ;
  equals(cq.hasClass('existing'), true, "cq has existing");
  
  cq.setClass("existing", true) ;
  equals(cq.hasClass('existing'), true, 'cq should have existing');
});

test("setClass(new, true) should add the class", function() {
  var cq = SC.$('<div class="existing"></div>') ;
  equals(cq.hasClass('new'), NO, "cq does not have new");
  
  cq.setClass("new", true) ;
  equals(cq.hasClass('new'), true, 'cq should have new');
});

test("setClass(new, NO) should do nothing", function() {
  var cq = SC.$('<div class="existing"></div>') ;
  equals(cq.hasClass('new'), NO, "cq does not have new");
  
  cq.setClass("new", NO) ;
  equals(cq.hasClass('new'), NO, "cq does not have new");
});

test("setClass(mixed, true) should work across multiple", function() {
  var cq = SC.$('<div class="root">\
    <div class="mixed match"></div>\
    <div class="match"></div>\
  </div>').find('.match');
  equals(cq.length, 2, 'should have two items');
  equals(cq.hasClass("mixed"), NO, "should not all have mixed class");
  
  cq.setClass("mixed", true);
  equals(cq.hasClass("mixed"), true, "now all should have mixed class") ;
}) ;
