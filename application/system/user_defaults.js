// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
//            Code within if (BLOSSOM) {} sections is ©2012 Fohr Motion 
//            Picture Studios. All rights reserved.
// License:   Most code licensed under MIT license (see SPROUTCORE-LICENSE).
//            Code within if (BLOSSOM) {} sections is under GPLv3 license
//            (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals ie7userdata openDatabase*/

sc_require('system/browser');

/**
  @class
  
  The UserDefaults object provides an easy way to store user preferences in
  your application on the local machine.  You use this by providing built-in
  defaults using the SC.userDefaults.defaults() method.  You can also
  implement the UserDefaultsDelegate interface to be notified whenever a
  default is required.  
  
  You should also set the userDomain property on the defaults on page load.
  This will allow the UserDefaults application to store/fetch keys from 
  localStorage for the correct user.
  
  You can also set an appDomain property if you want.  This will be 
  automatically prepended to key names with no slashes in them.
  
  SC.userDefaults.getPath("global:contactInfo.userName");
  
  @extends SC.Object
  @since SproutCore 1.0
*/
SC.UserDefaults = SC.Object.extend(
  /** @scope SC.UserDefaults.prototype */ {

  ready: false,

  /** 
    The default domain for the user.  This will be used to store keys in
    local storage.  If you do not set this property, the wrong values may be
    returned.
  */
  userDomain: null,

  /**
    The default app domain for the user.  Any keys that do not include a 
    slash will be prefixed with this app domain key when getting/setting.
  */
  appDomain: null,

  /** @private
    Defaults.  These will be used if not defined on localStorage.
  */
  _sc_defaults: null,

  /**
    Invoke this method to set the builtin defaults.  This will cause all
    properties to change.
  */
  defaults: function(newDefaults) {
    this._sc_defaults = newDefaults;
    this.allPropertiesDidChange();
  },
  
  /**
    Attempts to read a user default from local storage.  If not found on 
    localStorage, use the the local defaults, if defined.  If the key passed
    does not include a slash, then add the appDomain or use "app/".

    @param {String} keyName
  */
  readDefault: function(keyName) {
    var ret= undefined, userKeyName, localStorage, key, del;

    // Namespace keynames.
    keyName = this._sc_normalizeKeyName(keyName);
    userKeyName = this._sc_userKeyName(keyName);

    // Look into recently written values.
    if (this._sc_written) ret = this._sc_written[userKeyName];
    
    // Attempt to read from localStorage
    localStorage = window.localStorage ;
    if (!localStorage && window.globalStorage) {
      localStorage = window.globalStorage[window.location.hostname];
    }

    if (localStorage) {
      key = ["SC.UserDefaults",userKeyName].join('-at-');
      ret = localStorage[key];
    }

    // Deserialize strings as JSON.
    if (typeof ret === 'string') {
      try { ret = SC.json.decode(ret); } 
      catch (e) { ret = undefined; }
    } else ret = undefined; // Allows default to shine through below.

    // If not found in localStorage, ask our delegate.
    del = this.delegate;
    if (del && del.userDefaultsNeedsDefault) {
      ret = del.userDefaultsNeedsDefault(this, keyName, userKeyName);
    }

    // If not found in localStorage or delegate, try to find in defaults.
    if ((ret===undefined) && this._sc_defaults) {
      ret = this._sc_defaults[userKeyName] || this._sc_defaults[keyName];
    }

    return ret ;
  },

  /**
    Attempts to write the user default to local storage or at least saves them
    for now.  Also notifies that the value has changed.

    @param {String} keyName
    @param {Object} value
  */
  writeDefault: function(keyName, value) {
    var userKeyName, written, localStorage, key, del;

    keyName = this._sc_normalizeKeyName(keyName);
    userKeyName = this._sc_userKeyName(keyName);

    // Save to local hash.
    written = this._sc_written;
    if (!written) written = this._sc_written = {};
    written[userKeyName] = value;

    // Save to local storage.
    localStorage = window.localStorage ;
    if (!localStorage && window.globalStorage) {
     localStorage = window.globalStorage[window.location.hostname];
    }

    if (localStorage) {
      try {
        key = ["SC.UserDefaults", userKeyName].join('-at-');
        localStorage[key] = SC.json.encode(value);
      } catch(e) {
        console.error("localStorage failure:", e);
      }
    }

    // Also notify delegate.
    del = this.delegate;
    if (del && del.userDefaultsDidChange) {
      del.userDefaultsDidChange(this, keyName, value, userKeyName);
    }
  },

  /**
    Removed the passed keyName from the written hash and local storage.
    
    @param {String} keyName
    @returns {SC.UserDefaults} receiver
  */
  resetDefault: function(keyName) {  
    var fullKeyName, userKeyName, written, localStorage, key;
    fullKeyName = this._sc_normalizeKeyName(keyName);
    userKeyName = this._sc_userKeyName(fullKeyName);

    this.propertyWillChange(keyName);
    this.propertyWillChange(fullKeyName);

    written = this._written;
    if (written) delete written[userKeyName];

    localStorage = window.localStorage ;
    if (!localStorage && window.globalStorage) {
     localStorage = window.globalStorage[window.location.hostname];
    }

    key = ["SC.UserDefaults", userKeyName].join('-at-');
    if (localStorage) delete localStorage[key];

    this.propertyDidChange(keyName);
    this.propertyDidChange(fullKeyName);
    return this ;
  },

  /** @private
    Is called whenever you .get() or .set() values on this object

    @param {Object} key
    @param {Object} value
    @returns {Object}
  */
  unknownProperty: function(key, value) {
    if (value === undefined) {
      return this.readDefault(key);
    } else {
      this.writeDefault(key, value);
      return value;
    }
  },

  /** @private
    Normalize the passed key name.  Used by all accessors to automatically 
    insert an appName if needed.
  */
  _sc_normalizeKeyName: function(keyName) {
    if (keyName.indexOf(':') < 0) {
      var domain = this.get('appDomain') || 'app';
      keyName = [domain, keyName].join(':');
    }
    return keyName;
  },

  /**  @private
    Builds a user key name from the passed key name
  */
  _sc_userKeyName: function(keyName) {
    var user = this.get('userDomain') || '(anonymous)';
    return [user, keyName].join('-at-');
  },

  /** @private */
  _sc_domainDidChange: function() {
    var didChange = false;
    if (this.get("userDomain") !== this._sc_userDomain) {
      this._sc_userDomain = this.get('userDomain');
      didChange = true;
    }

    if (this.get('appDomain') !== this._sc_appDomain) {
      this._sc_appDomain = this.get('appDomain');
      didChange = true;
    }

    if (didChange) this.allPropertiesDidChange();
  }.observes('userDomain', 'appDomain'),

  init: function() {
    arguments.callee.base.apply(this, arguments);

    if (SC.userDefaults && SC.userDefaults.get('dataHash')) {
      var dh = SC.userDefaults.get('dataHash');
      if (dh) this.dataHash = SC.userDefaults.get('dataHash')
    }

    this._sc_userDomain = this.get('userDomain');
    this._sc_appDomain  = this.get('appDomain');
    this.set('ready', true);
  },

  readyCallback: function(ob, func){
    this.func = func;
    this.ob = ob;
  },

  readyChanged: function(){
    if(this.ready===true){
      var f = this.func;
      if(f) f.apply(this.ob);
    }
  }.observes('ready')

});

/** global user defaults. */
SC.userDefaults = SC.UserDefaults.create();
