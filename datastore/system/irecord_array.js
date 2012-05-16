// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

SC.IRecordArray = SC.Object.extend(SC.Enumerable, SC.Array, {

  isIRecordArray: true,

  // Valid options are: NEW, LOADING, READY, ERROR, EMPTY, FULL
  status: 'NEW',

  // You must set this on create to a remote query.
  query: null,

  // The keys that are set on the SC.Query instances before calling find().
  offsetKey: 'offset',
  limitKey: 'limit',

  // The default amount of records to fetch each time loadRecords() is called.
  fetchAmount: 200,

  autofetchFirstTime: true,

  /** @private */
  _sc_offset: 0,
  _sc_limit: 0,
  _sc_recordArrays: null, // Must be set to an array before entering READY.
  _sc_recordCount: 0,

  goState: function(name) {
    // MUST update state first.
    this.set('status', name);

    switch (name) {
      case 'LOADING':
        console.log('Entering LOADING state.');
      return;

      case 'READY':
        console.log('Entering READY state.');

        // Handle any deferred method calls.
        var deferred = this.deferred, fun;
        if (deferred && deferred.length > 0) {
          fun = deferred.shift();
          fun.call(this);
        }
      return;

      case 'ERROR':
        console.log('Entering ERROR state.');
      return;

      case 'EMPTY':
        console.log('Entering EMPTY state.');
      return;

      case 'FULL':
        console.log('Entering FULL state.');
      return;
    }
  },

  fetchRecords: function(amt) {
    if (amt === undefined) amt = this.get('fetchAmount');

    switch (this.status) {

      case 'NEW':
        this._sc_recordArrays = []; // only happens once
        this._sc_offset = 0;
        this._sc_limit = amt;
        this._sc_loadRecords(amt);
        this.goState('LOADING');
      return;

      case 'LOADING':
        SC.Logger.info('Ignoring request to fetch records since we are already loading.');
      return;

      case 'READY':
        this._sc_loadRecords(amt);
        this.goState('LOADING');
      return;

      case 'ERROR':
        SC.Logger.info('Cannot fetch records, SC.IRecordArray is in the ERROR state.');
      return;

      case 'EMPTY':
        SC.Logger.info('Cannot fetch records, SC.IRecordArray is in the EMPTY state.');
      return;

      case 'FULL':
        SC.Logger.info('Cannot fetch records, SC.IRecordArray is in the FULL state.');
      return;

    }
  },

  refresh: function(amt) {
    var that = this;

    if (!amt) amt = this.get('fetchAmount');

    function reset() {
      that._sc_offset = 0;
      that._sc_limit = amt;
      that._sc_recordCount = 0;
      that._sc_recordArrays = [];
      that._sc_loadRecords(amt);
      that.goState('LOADING');
      that.enumerableContentDidChange();
    }

    switch (this.status) {
      case 'NEW':
      case 'ERROR':
      case 'READY':
      case 'EMPTY':
      case 'FULL':
        reset();
      return;

      case 'LOADING':
        var deferred = this.deferred;
        if (!deferred) deferred = this.deferred = [];
        deferred.push(reset);
      return;
    }
  },

  // ..........................................................
  // ARRAY PRIMITIVES
  //

  length: function() {
    switch (this.status) {
      case 'NEW':
      case 'EMPTY':
        return 1;
      case 'LOADING':
      case 'READY':
      case 'FULL':
      case 'ERROR':
        return this._sc_recordCount + 1;
    }
  }.property().cacheable(),

  objectAt: function(index) {
    switch (this.status) {
      case 'NEW':
        if (index === 0) {
          if (this.get('autofetchFirstTime')) this.fetchRecords();
          return this;
        } else {
          return undefined;
        }
      break;

      case 'EMPTY':
        return index===0 ? this : undefined;

      case 'LOADING':
      case 'READY':
      case 'ERROR':
      case 'FULL':
        if (index > this._sc_recordCount) {
          // We haven't even tried to load this record yet. Shouldn't happen.
          return undefined;
        } else if (index === this._sc_recordCount) {
          // We're the last+1 record, so return ourself.
          // Note: our length === this._sc_recordCount+1!
          return this;
        } else {
          sc_assert(index >= 0);
          sc_assert(index <= this._sc_recordCount);

          // Find the record in our record arrays, and return it.
          var offsetKey = this.get('offsetKey'),
              limitKey = this.get('limitKey'),
              recordArrays = this._sc_recordArrays;

          for (var idx=0, len=recordArrays.length; idx<len; ++idx) {
            // debugger;
            var recAry = recordArrays[idx],
                query = recAry.get('query'),
                offset = query.get(offsetKey),
                length = recAry.get('length');

            if (offset <= index && (offset + query.get(limitKey) > index)) {
              // This is the record array that could have the index.  See if 
              // we actually do yet.
              if (recAry.get('status') === SC.Record.READY_CLEAN) {
                // We need to deal with the situation where an index is 
                // requested that would have been handled by an already 
                // fetched record array, but in fact, the record array 
                // did not load all of the records it was allowed to.  In 
                // this case, we load what we can, and make sure we also 
                // return `this` as the last+1 "record".
                if (index < offset+length) {
                  return recAry.objectAt(index-offset);
                } else if (length+offset+1 === index) {
                  return this;
                } else {
                  return undefined;
                }
              } else {
                 // We found the right record array, but it hasn't received 
                 // its results yet.
                return undefined;
              }
            }
          }
          sc_assert(false, "Failed to find a record we supposedly should have.");
          return undefined;
        }
      break;
    }
  },

  replace: function(idx, amt, recs) {
    throw "SC.IRecordArray#replace() failed; array is not editable.";
  },

  // ..........................................................
  // INTERNAL STUFF
  //

  _sc_loadRecords: function(amt) {
     var query = this.get('query'),
         store = query.get('store'),
         offsetKey = this.get('offsetKey'),
         limitKey = this.get('limitKey'),
         that = this;

    sc_assert(query);
    sc_assert(store);
    sc_assert(typeof offsetKey === 'string');
    sc_assert(typeof limitKey === 'string');
    sc_assert(this._sc_recordArrays);

    var newQuery = query.copy();
    newQuery.set(offsetKey, this._sc_recordCount);
    newQuery.set(limitKey, amt);

    var ary = store.find(newQuery);
    this._sc_recordArrays.push(ary);

    ary.addObserver('status', function observer() {
      var status = ary.get('status');

      if (status === SC.Record.READY_CLEAN) {
        ary.removeObserver('status', ary, observer);
        var length = ary.get('length');

        if (length === 0) {
          // We got no results.
          if (that._sc_recordCount === 0) {
            that.goState('EMPTY');
          } else {
            that.goState('FULL');
          }

        }  else if (length < amt) {
          // We got less than we asked for.
          that._sc_recordCount += length;
          sc_assert(that._sc_recordCount > 0);
          that.goState('FULL');
          that.enumerableContentDidChange();

        } else {
          // We got the full results we asked for.  Live to fetch another day.
          sc_assert(length === amt);
          that._sc_recordCount += length;
          that.goState('READY');
          that.enumerableContentDidChange();
        }
        
      } else if (status === SC.Record.ERROR) {
        ary.removeObserver('status', ary, observer);
        that.goState('ERROR');
      }
    });
  }

});
