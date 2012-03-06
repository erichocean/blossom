// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals suite test ok equals same AB notest */

var AB;

suite("Cyclical relationships", { 
  setup: function() {

    // define the application space
    AB = window.AB = SC.Object.create({
      store: SC.Store.create().from(SC.Record.fixtures)
    }); 

    // ..........................................................
    // MODEL
    // 
    
    // Describes a single contact
    AB.Contact = SC.Record.extend({
      name: SC.Record.attr(String),
      group: SC.Record.toOne('AB.Group'),
      isFavorite: SC.Record.attr(Boolean)
    });
    
    AB.Group = SC.Record.extend({
      name: SC.Record.attr(String),
      
      // dynamically discover contacts for a group using a foreign key
      contacts: function() {
        var q = SC.Query.local(AB.Contact, "group = {record}", {
          record: this
        });  
        return this.get('store').find(q);
      }.property().cacheable(),
      
      // discover favorite contacts only
      favoriteContacts: function() {
        return this.get('contacts').filterProperty('isFavorite', true);
      }.property('contacts').cacheable(),
      
      // we need to reset favoriteContacts whenever the contacts themselves
      // change
      contactsContentDidChange: function() {
        this.notifyPropertyChange('favoriteContacts');
      }.observes('.contacts*[]')
      
    });
    
    AB.Group.FIXTURES = [
      { guid: 100, name: "G1" },
      { guid: 101, name: "G2" }
    ];

    AB.Contact.FIXTURES = [
      { guid: 1,
        name: "G1-Fav1",
        group: 100,
        isFavorite: true },

      { guid: 2,
        name: "G1-Fav2",
        group: 100,
        isFavorite: true },

      { guid: 3,
        name: "G1-Norm1",
        group: 100,
        isFavorite: false },

      { guid: 4,
        name: "G2-Fav1",
        group: 101,
        isFavorite: true },

      { guid: 5,
        name: "G1-Norm1",
        group: 101,
        isFavorite: false }
    ];
    
    
    SC.RunLoop.begin();
    
  },
  
  teardown: function() {
    SC.RunLoop.end(); 
    AB = null;
  }
});

// FIXME: Not sure why these two tests are failing on Node.
notest("getting all contacts in a group", function() {
  var group  = AB.store.find(AB.Group, 100);
  var expected = AB.store.find(AB.Contact).filterProperty('group', group);
  same(group.get('contacts').toArray(), expected, 'contacts');
});

notest("finding favoriteContacts", function() {
  var group  = AB.store.find(AB.Group, 100);
  var expected = AB.store.find(AB.Contact)
    .filterProperty('group', group)
    .filterProperty('isFavorite', true);
    
  same(group.get('favoriteContacts'), expected, 'contacts');
  
  var c = AB.store.find(AB.Contact, 4) ;
  c.set('group', group); // move to group...
  SC.RunLoop.end();
  SC.RunLoop.begin();
  
  expected.push(c);
  same(group.get('favoriteContacts'), expected, 'favoriteContacts after adding extra');
  
});


