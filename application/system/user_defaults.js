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
/*globals BLOSSOM ie7userdata openDatabase*/

sc_require('system/browser');

if (BLOSSOM) {

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

  ready: NO,

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

} // BLOSSOM

if (! BLOSSOM) {

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
SC.UserDefaults = SC.Object.extend(/** @scope SC.UserDefaults.prototype */ {
  
  ready: NO,
  
  /** 
    the default domain for the user.  This will be used to store keys in
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
  _defaults: null,
  
  _safari3DB: null,
  
  /**
    Invoke this method to set the builtin defaults.  This will cause all
    properties to change.
  */
  defaults: function(newDefaults) {
    this._defaults = newDefaults ;
    this.allPropertiesDidChange();
  },
  
  /**
    Attempts to read a user default from local storage.  If not found on 
    localStorage, use the the local defaults, if defined.  If the key passed
    does not include a slash, then add the appDomain or use "app/".
    
    @param {String} keyName
    @returns {Object} read value
  */
  readDefault: function(keyName) {
    var ret= undefined, userKeyName, localStorage, key, del, storageSafari3;
    // namespace keyname
    keyName = this._normalizeKeyName(keyName);
    userKeyName = this._userKeyName(keyName);

    // look into recently written values
    if (this._written) ret = this._written[userKeyName];
    
    // attempt to read from localStorage
    
    if(SC.browser.msie=="7.0"){
      localStorage=document.body;
      try{
        localStorage.load("SC.UserDefaults");
      }catch(e){
        console.err("Couldn't load userDefaults in IE7: "+e.description);
      }
    }else if(this.HTML5DB_noLocalStorage){
      storageSafari3 = this._safari3DB;
    }else{
      localStorage = window.localStorage ;
      if (!localStorage && window.globalStorage) {
        localStorage = window.globalStorage[window.location.hostname];
      }
    }
    if (localStorage || storageSafari3) {
      key=["SC.UserDefaults",userKeyName].join('-at-');
      if(SC.browser.msie=="7.0"){
        ret=localStorage.getAttribute(key.replace(/\W/gi, ''));        
      }else if(storageSafari3){
        ret = this.dataHash[key];
        
      }else{
        ret = localStorage[key];
      }
      if (!SC.none(ret)) {
        try {
          ret = SC.json.decode(ret);
        } 
        catch(ex) {
          ret = undefined;
        }
      } else ret = undefined;
    }
    
    // if not found in localStorage, try to notify delegate
    del =this.delegate ;
    if (del && del.userDefaultsNeedsDefault) {
      ret = del.userDefaultsNeedsDefault(this, keyName, userKeyName);
    }
    
    // if not found in localStorage or delegate, try to find in defaults
    if ((ret===undefined) && this._defaults) {
      ret = this._defaults[userKeyName] || this._defaults[keyName];
    }
    
    return ret ;
  },
  
  /**
    Attempts to write the user default to local storage or at least saves them
    for now.  Also notifies that the value has changed.
    
    @param {String} keyName
    @param {Object} value
    @returns {SC.UserDefault} receiver
  */
  writeDefault: function(keyName, value) {
    var userKeyName, written, localStorage, key, del, storageSafari3;
    
    keyName = this._normalizeKeyName(keyName);
    userKeyName = this._userKeyName(keyName);
    
    // save to local hash
    written = this._written ;
    if (!written) written = this._written = {};
    written[userKeyName] = value ;
    
    // save to local storage
    
    if(SC.browser.msie=="7.0"){
      localStorage=document.body;
    }else if(this.HTML5DB_noLocalStorage){
      storageSafari3 = this._safari3DB;
    }else{
       localStorage = window.localStorage ;
       if (!localStorage && window.globalStorage) {
         localStorage = window.globalStorage[window.location.hostname];
       }
    }
    key=["SC.UserDefaults",userKeyName].join('-at-');
    if (localStorage || storageSafari3) {
      var encodedValue = SC.json.encode(value);
      if(SC.browser.msie=="7.0"){
        localStorage.setAttribute(key.replace(/\W/gi, ''), encodedValue);
        localStorage.save("SC.UserDefaults");
      }else if(storageSafari3){
        var obj = this;
        storageSafari3.transaction(
          function (t) {
            t.executeSql("delete from SCLocalStorage where key = ?", [key], 
              function (){
                t.executeSql("insert into SCLocalStorage(key, value)"+
                            " VALUES ('"+key+"', '"+encodedValue+"');", 
                            [], obj._nullDataHandler, obj.killTransaction
                );
              }
            );
          }
        );
        this.dataHash[key] = encodedValue;
      }else{
        try{
          localStorage[key] = encodedValue;
        }catch(e){
          console.error("Failed using localStorage. "+e);
        }
      }
    }
    
    // also notify delegate
    del = this.delegate;
    if (del && del.userDefaultsDidChange) {
      del.userDefaultsDidChange(this, keyName, value, userKeyName);
    }
    
    return this ;
  },
  
  /**
    Removed the passed keyName from the written hash and local storage.
    
    @param {String} keyName
    @returns {SC.UserDefaults} receiver
  */
  resetDefault: function(keyName) {  
    var fullKeyName, userKeyName, written, localStorage, key, storageSafari3;
    fullKeyName = this._normalizeKeyName(keyName);
    userKeyName = this._userKeyName(fullKeyName);
    
    this.propertyWillChange(keyName);
    this.propertyWillChange(fullKeyName);
    
    written = this._written;
    if (written) delete written[userKeyName];
    
    if(SC.browser.msie=="7.0"){
       localStorage=document.body;
    }else if(this.HTML5DB_noLocalStorage){
         storageSafari3 = this._safari3DB;
    }else{
       localStorage = window.localStorage ;
       if (!localStorage && window.globalStorage) {
         localStorage = window.globalStorage[window.location.hostname];
       }
    }

    key=["SC.UserDefaults",userKeyName].join('-at-');

    if (localStorage) {
      if(SC.browser.msie=="7.0"){
        localStorage.setAttribute(key.replace(/\W/gi, ''), null);
        localStorage.save("SC.UserDefaults");
      } else if(storageSafari3){
        var obj = this;
        storageSafari3.transaction(
          function (t) {
            t.executeSql("delete from SCLocalStorage where key = ?", [key], null);
          }
        );
        delete this.dataHash[key];
      }else{
        delete localStorage[key];
      }
    }
    

    this.propertyDidChange(keyName);
    this.propertyDidChange(fullKeyName);
    return this ;
  },
  
  /**
    Is called whenever you .get() or .set() values on this object
    
    @param {Object} key
    @param {Object} value
    @returns {Object}
  */
  unknownProperty: function(key, value) {
    if (value === undefined) {
      return this.readDefault(key) ;
    } else {
      this.writeDefault(key, value);
      return value ;
    }
  },
  
  /**
    Normalize the passed key name.  Used by all accessors to automatically 
    insert an appName if needed.
  */
  _normalizeKeyName: function(keyName) {
    if (keyName.indexOf(':')<0) {
      var domain = this.get('appDomain') || 'app';
      keyName = [domain, keyName].join(':');
    } 
    return keyName;
  },
  
  /** 
    Builds a user key name from the passed key name
  */
  _userKeyName: function(keyName) {
    var user = this.get('userDomain') || '(anonymous)' ;
    return [user,keyName].join('-at-');
  },
  
  _domainDidChange: function() {
    var didChange = NO;
    if (this.get("userDomain") !== this._scud_userDomain) {
      this._scud_userDomain = this.get('userDomain');
      didChange = true;
    }
    
    if (this.get('appDomain') !== this._scud_appDomain) {
      this._scud_appDomain = this.get('appDomain');
      didChange = true;
    }
    
    if (didChange) this.allPropertiesDidChange();
  }.observes('userDomain', 'appDomain'),
  
  init: function() {
    arguments.callee.base.apply(this, arguments);
    if(SC.userDefaults && SC.userDefaults.get('dataHash')){
      var dh = SC.userDefaults.get('dataHash');
      if (dh) this.dataHash=SC.userDefaults.get('dataHash')
    }
    this._scud_userDomain = this.get('userDomain');
    this._scud_appDomain  = this.get('appDomain');
    if(SC.browser.msie=="7.0"){
      //Add user behavior userData. This works in all versions of IE.
      //Adding to the body as is the only element never removed.
      document.body.addBehavior('#default#userData');
    }
    this.HTML5DB_noLocalStorage = ((parseInt(SC.browser.safari, 0)>523) && (parseInt(SC.browser.safari, 0)<528));
    if(this.HTML5DB_noLocalStorage){
      var myDB;
      try {
        if (!window.openDatabase) {
          console.error("Trying to load a database with safari version 3.1 "+
                  "to get SC.UserDefaults to work. You are either in a"+
                  " previous version or there is a problem with your browser.");
          return;
        } else {
          var shortName = 'scdb',
              version = '1.0',
              displayName = 'SproutCore database',
              maxSize = 65536; // in bytes,
          myDB = openDatabase(shortName, version, displayName, maxSize);
    
          // You should have a database instance in myDB.
    
        }
      } catch(e) {
        console.error("Trying to load a database with safari version 3.1 "+
                "to get SC.UserDefaults to work. You are either in a"+
                " previous version or there is a problem with your browser.");
        return;
      }
    
      if(myDB){
        var obj = this;
        myDB.transaction(
          function (transaction) {
            transaction.executeSql('CREATE TABLE IF NOT EXISTS SCLocalStorage'+
              '(key TEXT NOT NULL PRIMARY KEY, value TEXT NOT NULL);', 
              [], obj._nullDataHandler, obj.killTransaction);
          }
        );
        myDB.transaction(
          function (transaction) {
            
            transaction.parent = obj;
            transaction.executeSql('SELECT * from SCLocalStorage;', 
                [], function(transaction, results){
                  var hash={}, row;
                  for(var i=0, iLen=results.rows.length; i<iLen; i++){
                    row=results.rows.item(i);
                    hash[row['key']]=row['value'];
                  }
                  transaction.parent.dataHash = hash;
                  SC.run(function() { SC.userDefaults.set('ready', true); });
                }, obj.killTransaction);
          }
        );
        this._safari3DB=myDB;
      }
    }else{
      this.set('ready', true);
    }
  },


  //Private methods to use if user defaults uses the database in safari 3
  _killTransaction: function(transaction, error){
    return true; // fatal transaction error
  },

  _nullDataHandler: function(transaction, results){},
        
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

} // ! BLOSSOM

/** global user defaults. */
SC.userDefaults = SC.UserDefaults.create();
