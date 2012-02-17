// ==========================================================================
// Project:   SC.DataSource Unit Test
// Copyright: ©2011 Junction Networks and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals JN module test ok equals same stop start */

var MyApp, wasCalled, resetWasCalled;
suite("SC.DataSource", {
  setup: function () {
    MyApp = window.MyApp = {};
    MyApp.store = SC.Store.create();
    MyApp.Foo = SC.Record.extend();

    MyApp.DataSource = SC.DataSource.extend({
      fetch: function (store, query) {
        wasCalled = true;
        equals(arguments.length, 2);
        return true;
      },

      createRecord: function (store, storeKey, params) {
        wasCalled = true;
        equals(arguments.length, 3);
        return true;
      },

      updateRecord: function (store, storeKey, params) {
        wasCalled = true;
        equals(arguments.length, 3);
        return true;
      },

      retrieveRecord: function (store, storeKey, params) {
        wasCalled = true;
        equals(arguments.length, 3);
        return true;
      },

      destroyRecord: function (store, storeKey, params) {
        wasCalled = true;
        equals(arguments.length, 3);
        return true;
      },

      reset: function() {
        resetWasCalled = true;
        return this;
      }
    });
    SC.RunLoop.begin();
  },

  teardown: function () {
    SC.RunLoop.end();
  }
});

test("The dataSource will forward calls to the appropriate methods", function () {
  var ds = MyApp.DataSource.create();
  MyApp.store.set('dataSource', ds);
  ok(MyApp.store.find(SC.Query.remote(MyApp.Foo)),
     "the fetch should return a record array");
  ok(wasCalled, "`fetch` should have been called");
  wasCalled = NO;

  ok(MyApp.store.find(MyApp.Foo, "testing retrieve"),
     "retrieve should return a new record (because the dataSource handled the request true)");
  ok(wasCalled, "`retrieve` should have been called");
  wasCalled = NO;

  var rec = MyApp.store.createRecord(MyApp.Foo, {});

  equals(MyApp.store.commitRecord(MyApp.Foo, 'foo', rec.get('storeKey')), true,
         "commiting a new record should return true");
  ok(wasCalled, "`createRecord` should have been called");
  wasCalled = NO;

  MyApp.store.writeStatus(rec.get('storeKey'), SC.Record.READY_CLEAN);

  rec.set('zero', 0);
  equals(MyApp.store.commitRecord(MyApp.Foo, 'foo', rec.get('storeKey')), true,
         "updating a record should return true");
  ok(wasCalled, "`updateRecord` should have been called");
  wasCalled = NO;

  MyApp.store.writeStatus(rec.get('storeKey'), SC.Record.READY_CLEAN);

  rec.destroy();
  // broken in SC.Store
  equals(MyApp.store.commitRecord(MyApp.Foo, 'foo', rec.get('storeKey')), true,
     "destroying the record should return true");
  ok(wasCalled, "`destroyRecord` should have been called");
});

test("The dataSource will return true when all records committed return true", function () {
  var ds = MyApp.DataSource.create({
    createRecord: function () { return true; },
    updateRecord: function () { return true; },
    destroyRecord: function () { return true; }
  });

  MyApp.store.set('dataSource', ds);

  var rec1 = MyApp.store.createRecord(MyApp.Foo, {}),
      rec2, rec3;

  equals(MyApp.store.commitRecords(), true,
         "commiting a single new record should return true");

  MyApp.store.writeStatus(rec1.get('storeKey'), SC.Record.READY_CLEAN);

  rec1.set('zero', 0);
  rec2 = MyApp.store.createRecord(MyApp.Foo, {});

  equals(MyApp.store.commitRecords(), true,
         "commiting records for an 'update' and 'create' should return true");

  MyApp.store.writeStatus(rec1.get('storeKey'), SC.Record.READY_CLEAN);
  MyApp.store.writeStatus(rec2.get('storeKey'), SC.Record.READY_CLEAN);

  rec1.destroy();
  rec2.set('one', 1);
  rec3 = MyApp.store.createRecord(MyApp.Foo, {});

  equals(MyApp.store.commitRecords(), true,
         "commiting records for an 'update', 'create', and 'destroy' should return true");
});

test("The dataSource will return SC.MIXED_STATE when all records committed return true and NO", function () {
  var ds = MyApp.DataSource.create({
    createRecord: function () { return NO; },
    updateRecord: function () { return true; },
    destroyRecord: function () { return NO; }
  });

  MyApp.store.set('dataSource', ds);

  var rec1 = MyApp.store.createRecord(MyApp.Foo, {}),
      rec2, rec3;

  equals(MyApp.store.commitRecords(), NO,
         "commiting a single new record should return NO");

  MyApp.store.writeStatus(rec1.get('storeKey'), SC.Record.READY_CLEAN);

  rec1.set('zero', 0);
  rec2 = MyApp.store.createRecord(MyApp.Foo, {});

  equals(MyApp.store.commitRecords(), SC.MIXED_STATE,
         "commiting records for an 'update' and 'create' should return %@".fmt(SC.MIXED_STATE));

  MyApp.store.writeStatus(rec1.get('storeKey'), SC.Record.READY_CLEAN);
  MyApp.store.writeStatus(rec2.get('storeKey'), SC.Record.READY_CLEAN);

  rec1.destroy();
  rec2.set('one', 1);
  rec3 = MyApp.store.createRecord(MyApp.Foo, {});

  equals(MyApp.store.commitRecords(), SC.MIXED_STATE,
         "commiting records for an 'update', 'create', and 'destroy' should return %@".fmt(SC.MIXED_STATE));
});

test("The dataSource will return NO when all records committed return NO", function () {
  var ds = MyApp.DataSource.create({
    createRecord: function () { return NO; },
    updateRecord: function () { return NO; },
    destroyRecord: function () { return NO; }
  });
  MyApp.store.set('dataSource', ds);

  var rec1 = MyApp.store.createRecord(MyApp.Foo, {}),
      rec2, rec3;

  equals(MyApp.store.commitRecords(), NO,
         "commiting a single new record should return NO");

  MyApp.store.writeStatus(rec1.get('storeKey'), SC.Record.READY_CLEAN);

  rec1.set('zero', 0);
  rec2 = MyApp.store.createRecord(MyApp.Foo, {});

  equals(MyApp.store.commitRecords(), NO,
         "commiting records for an 'update' and 'create' should return NO");

  MyApp.store.writeStatus(rec1.get('storeKey'), SC.Record.READY_CLEAN);
  MyApp.store.writeStatus(rec2.get('storeKey'), SC.Record.READY_CLEAN);

  rec1.destroy();
  rec2.set('one', 1);
  rec3 = MyApp.store.createRecord(MyApp.Foo, {});

  equals(MyApp.store.commitRecords(), NO,
         "commiting records for an 'update', 'create', and 'destroy' should return NO");
});

test("The store calls reset on the dataSource when reset", function(){
  MyApp.store.set('dataSource', MyApp.DataSource.create());
  resetWasCalled = NO; // Just to be sure

  MyApp.store.reset();
  ok(resetWasCalled, "should have called reset");
});
