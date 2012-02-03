// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2010 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals global require CoreTest */

var fs = require('fs');

/** @namespace

  CoreTest is the unit testing library for SproutCore.  It includes a test 
  runner based on QUnit with some useful extensions for testing SproutCore-
  based applications.
  
  You can use CoreTest just like you would use QUnit in your tests directory.
*/
CoreTest = {
  
  /** 
    Empty function.  Useful for some operations. 
  */
  K: function() { return this; },

  /**
    Copied from SproutCore Runtime Core.  Included here to avoid dependencies.

    @param obj {Object} the object to beget
    @returns {Object} the new object.
  */
  beget: function(obj) {
    if (!obj) return null ;
    var K = CoreTest.K; K.prototype = obj ;
    var ret = new K();
    K.prototype = null ; // avoid leaks
    return ret ;
  },
  
  /**
    Copied from SproutCore Runtime Core.  Included here to avoid dependencies.

    @param target {Object} the target object to extend
    @param properties {Object} one or more objects with properties to copy.
    @returns {Object} the target object.
    @static
  */
  mixin: function() {
    // copy reference to target object
    var target = arguments[0] || {};
    var idx = 1;
    var length = arguments.length ;
    var options ;

    // Handle case where we have only one item...extend CoreTest
    if (length === 1) {
      target = this || {};
      idx=0;
    }

    for ( ; idx < length; idx++ ) {
      if (!(options = arguments[idx])) continue ;
      for(var key in options) {
        if (!options.hasOwnProperty(key)) continue ;
        var src = target[key];
        var copy = options[key] ;
        if (target===copy) continue ; // prevent never-ending loop
        if (copy !== undefined) target[key] = copy ;
      }
    }

    return target;
  },
  
  
  /** Borrowed from SproutCore Runtime Core */
  fmt: function(str) {
    // first, replace any ORDERED replacements.
    var args = arguments;
    var idx  = 1; // the current index for non-numerical replacements
    return str.replace(/%@([0-9]+)?/g, function(s, argIndex) {
      argIndex = (argIndex) ? parseInt(argIndex,0) : idx++ ;
      s =args[argIndex];
      return ((s===null) ? '(null)' : (s===undefined) ? '' : s).toString(); 
    }) ;
  },
  
  /**
    Returns a stub function that records any passed arguments and a call
    count.  You can pass no parameters, a single function or a hash.  
    
    If you pass no parameters, then this simply returns a function that does 
    nothing but record being called.  
    
    If you pass a function, then the function will execute when the method is
    called, allowing you to stub in some fake behavior.
    
    If you pass a hash, you can supply any properties you want attached to the
    stub function.  The two most useful are "action", which is the function 
    that will execute when the stub runs (as if you just passed a function), 
    and "expect" which should evaluate the stub results.
    
    In your unit test you can verify the stub by calling stub.expect(X), 
    where X is the number of times you expect the function to be called.  If
    you implement your own test function, you can actually pass whatever you
    want.
    
    Calling stub.reset() will reset the record on the stub for further 
    testing.

    @param {String} name the name of the stub to use for logging
    @param {Function|Hash} func the function or hash
    @returns {Function} stub function
  */
  stub: function(name, func) {  

    // normalize param
    var attrs = {};
    if (typeof func === "function") {
      attrs.action = func;
    } else if (typeof func === "object") {
      attrs = func ;
    }

    // create basic stub
    var ret = function() {
      ret.callCount++;
      
      // get arguments into independent array and save in history
      var args = [], loc = arguments.length;
      while(--loc >= 0) args[loc] = arguments[loc];
      args.unshift(this); // save context
      ret.history.push(args);
      
      return ret.action.apply(this, arguments);
    };
    ret.callCount = 0 ;
    ret.history = [];
    ret.stubName = name ;

    // copy attrs
    var key;
    for(key in attrs) {
      if (!attrs.hasOwnProperty(key)) continue ;
      ret[key] = attrs[key];
    }

    // add on defaults
    if (!ret.reset) {
      ret.reset = function() {
        this.callCount = 0;
        this.history = [];
      };
    }
    
    if (!ret.action) {
      ret.action = function() { return this; };
    }
    
    if (!ret.expect) {
      ret.expect = function(callCount) {
        if (callCount === YES) {
          ok(this.callCount > 0, CoreTest.fmt("%@ should be called at least once", this.stubName));
        } else {
          if (callCount === NO) callCount = 0;
          equals(this.callCount, callCount, CoreTest.fmt("%@ should be called X times", this.stubName));
        }
      };
    }
    
    return ret ;
  },
  

  /** Test is OK */
  OK: 'passed',
  
  /** Test failed */
  FAIL: 'failed',
  
  /** Test raised exception */
  ERROR: 'errors',
  
  /** Test raised warning */
  WARN: 'warnings',
  
  showUI : false

};

/**
 * jsDump
 * Copyright (c) 2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Licensed under BSD (http://www.opensource.org/licenses/bsd-license.php)
 * Date: 5/15/2008
 * @projectDescription Advanced and extensible data dumping for Javascript.
 * @version 1.0.0
 * @author Ariel Flesler
 * @link {http://flesler.blogspot.com/2008/05/jsdump-pretty-dump-of-any-javascript.html}
 */
(function(){
  var reName, jsDump;
  
  function quote( str ){
    return '"' + str.toString().replace(/"/g, '\\"') + '"';
  }
  
  function literal( o ){
    return o + '';  
  }
  
  function join( pre, arr, post ){
    var s     = jsDump.separator(),
        base  = jsDump.indent(),
        inner = jsDump.indent(1);
        
    if( arr.join )  arr = arr.join( ',' + s + inner );
    if( !arr ) return pre + post;
    
    return [ pre, inner + arr, base + post ].join(s);
  }
  
  function array( arr ){
    var i = arr.length, ret = new Array(i);         
    this.up();
    while( i-- ) ret[i] = this._parse( arr[i] );        
    this.down();
    return join( '[', ret, ']' );
  }
  
  reName = /^function (\w+)/;
  
  jsDump = CoreTest.jsDump = {

    parse: function(obj, type) {
      if (obj && obj.toString) {
        var toString = obj.toString;
        if ((toString !== Object.prototype.toString) && (toString !== Array.toString)) return obj.toString();
      }
      if (obj && obj.inspect) return obj.inspect();
      
      this.seen = [];
      var ret = this._parse(obj, type);
      this.seen = null;
      return ret ;
    },
    
    //type is used mostly internally, you can fix a (custom)type in advance
    _parse: function( obj, type ) {
      
      
      var parser = this.parsers[ type || this.typeOf(obj) ];
      type = typeof parser;     

      // avoid recursive loops
      if ((parser === this.parsers.object) && (this.seen.indexOf(obj)>=0)) {
        return '(recursive)';
      }
      this.seen.push(obj);
      
      return type == 'function' ? parser.call( this, obj ) :
           type == 'string' ? parser :
           this.parsers.error;
    },
    typeOf:function( obj ){
      var type = typeof obj,
        f = 'function';//we'll use it 3 times, save it
        
      if (obj && (obj.isObject || obj.isClass)) return 'scobj';
      return type != 'object' && type != f ? type :
        !obj ? 'null' :
        obj.exec ? 'regexp' :// some browsers (FF) consider regexps functions
        obj.getHours ? 'date' :
        obj.scrollBy ?  'window' :
        obj.nodeName == '#document' ? 'document' :
        obj.nodeName ? 'node' :
        obj.item ? 'nodelist' : // Safari reports nodelists as functions
        obj.callee ? 'arguments' :
        obj.call || obj.constructor != Array && //an array would also fall on this hack
          (obj+'').indexOf(f) != -1 ? f : //IE reports functions like alert, as objects
        'length' in obj ? 'array' :
        type;
    },
    separator:function(){
      return this.multiline ? this.HTML ? '<br />' : '\n' : this.HTML ? '&nbsp;' : ' ';
    },
    indent:function( extra ){// extra can be a number, shortcut for increasing-calling-decreasing
      if( !this.multiline ) return '';
      
      var chr = this.indentChar;
      if( this.HTML ) chr = chr.replace(/\t/g,'   ').replace(/ /g,'&nbsp;');
      return (new Array( this._depth_ + (extra||0) )).join(chr);
    },
    up:function( a ){
      this._depth_ += a || 1;
    },
    down:function( a ){
      this._depth_ -= a || 1;
    },
    setParser:function( name, parser ){
      this.parsers[name] = parser;
    },
    // The next 3 are exposed so you can use them
    quote:quote, 
    literal:literal,
    join:join,
    //
    _depth_: 1,
    // This is the list of parsers, to modify them, use jsDump.setParser
    parsers:{
      window: '[Window]',
      document: '[Document]',
      error:'[ERROR]', //when no parser is found, shouldn't happen
      unknown: '[Unknown]',
      'null':'null',
      'undefined':'undefined',
      'function':function( fn ){
        var ret = 'function',
          name = 'name' in fn ? fn.name : (reName.exec(fn)||[])[1];//functions never have name in IE
        if( name ) ret += ' ' + name;
        ret += '(';
        
        ret = [ ret, this._parse( fn, 'functionArgs' ), '){'].join('');
        return join( ret, this._parse(fn,'functionCode'), '}' );
      },
      array: array,
      nodelist: array,
      'arguments': array,
      scobj: function(obj) { return obj.toString(); },
      object:function( map ){
        
        var ret = [ ];
        this.up();
        for( var key in map ) {
          ret.push( this._parse(key,'key') + ': ' + this._parse(map[key]) );
        }
        this.down();
        return join( '{', ret, '}' );
      },
      node:function( node ){
        var open = this.HTML ? '&lt;' : '<',
          close = this.HTML ? '&gt;' : '>';
          
        var tag = node.nodeName.toLowerCase(),
          ret = open + tag;
          
        for( var a in this.DOMAttrs ){
          var val = node[this.DOMAttrs[a]];
          if( val ) {
            ret += ' ' + a + '=' + this._parse( val, 'attribute' );
          }
        }
        return ret + close + open + '/' + tag + close;
      },
      functionArgs:function( fn ){//function calls it internally, it's the arguments part of the function
        var l = fn.length;
        if( !l ) return '';       
        
        var args = new Array(l);
        while( l-- ) args[l] = String.fromCharCode(97+l);//97 is 'a'
        return ' ' + args.join(', ') + ' ';
      },
      key:quote, //object calls it internally, the key part of an item in a map
      functionCode:'[code]', //function calls it internally, it's the content of the function
      attribute:quote, //node calls it internally, it's an html attribute value
      string:quote,
      date:quote,
      regexp:literal, //regex
      number:literal,
      'boolean':literal
    },
    DOMAttrs:{//attributes to dump from nodes, name=>realName
      id:'id',
      name:'name',
      'class':'className'
    },
    HTML:true,//if true, entities are escaped ( <, >, \t, space and \n )
    indentChar:'   ',//indentation unit
    multiline:true //if true, items in a collection, are separated by a \n, else just a space.
  };
  
  CoreTest.dump = function dump(obj,type) {
    return CoreTest.jsDump.parse(obj, type);
  };

})();

/**
  Tests for equality any JavaScript type and structure without unexpected 
  results.

  Discussions and reference: http://philrathe.com/articles/equiv
  Test suites: http://philrathe.com/tests/equiv
  Author: Philippe Rathé <prathe@gmail.com>
*/
CoreTest.equiv = function () {

    var innerEquiv; // the real equiv function
    var callers = []; // stack to decide between skip/abort functions

    // Determine what is o.
    function hoozit(o) {
        if (typeof o === "string") {
            return "string";

        } else if (typeof o === "boolean") {
            return "boolean";

        } else if (typeof o === "number") {

            if (isNaN(o)) {
                return "nan";
            } else {
                return "number";
            }

        } else if (typeof o === "undefined") {
            return "undefined";

        // consider: typeof null === object
        } else if (o === null) {
            return "null";

        // consider: typeof [] === object
        } else if (o instanceof Array) {
            return "array";
        
        // consider: typeof new Date() === object
        } else if (o instanceof Date) {
            return "date";

        // consider: /./ instanceof Object;
        //           /./ instanceof RegExp;
        //          typeof /./ === "function"; // => false in IE and Opera,
        //                                          true in FF and Safari
        } else if (o instanceof RegExp) {
            return "regexp";

        } else if (typeof o === "object") {
            return "object";

        } else if (o instanceof Function) {
            return "function";
        }
    }

    // Call the o related callback with the given arguments.
    function bindCallbacks(o, callbacks, args) {
        var prop = hoozit(o);
        if (prop) {
            if (hoozit(callbacks[prop]) === "function") {
                return callbacks[prop].apply(callbacks, args);
            } else {
                return callbacks[prop]; // or undefined
            }
        }
    }

    var callbacks = function () {

        // for string, boolean, number and null
        function useStrictEquality(b, a) {
            return a === b;
        }

        return {
            "string": useStrictEquality,
            "boolean": useStrictEquality,
            "number": useStrictEquality,
            "null": useStrictEquality,
            "undefined": useStrictEquality,

            "nan": function (b) {
                return isNaN(b);
            },

            "date": function (b, a) {
                return hoozit(b) === "date" && a.valueOf() === b.valueOf();
            },

            "regexp": function (b, a) {
                return hoozit(b) === "regexp" &&
                    a.source === b.source && // the regex itself
                    a.global === b.global && // and its modifers (gmi) ...
                    a.ignoreCase === b.ignoreCase &&
                    a.multiline === b.multiline;
            },

            // - skip when the property is a method of an instance (OOP)
            // - abort otherwise,
            //   initial === would have catch identical references anyway
            "function": function () {
                var caller = callers[callers.length - 1];
                return caller !== Object &&
                        typeof caller !== "undefined";
            },

            "array": function (b, a) {
                var i;
                var len;

                // b could be an object literal here
                if ( ! (hoozit(b) === "array")) {
                    return false;
                }

                len = a.length;
                if (len !== b.length) { // safe and faster
                    return false;
                }
                for (i = 0; i < len; i++) {
                    if( ! innerEquiv(a[i], b[i])) {
                        return false;
                    }
                }
                return true;
            },

            "object": function (b, a) {
                var i;
                var eq = true; // unless we can proove it
                var aProperties = [], bProperties = []; // collection of strings
                if (b===a) return true;
                
                // comparing constructors is more strict than using instanceof
                if ( a.constructor !== b.constructor) {
                    return false;
                }

                // stack constructor before traversing properties
                callers.push(a.constructor);

                for (i in a) { // be strict: don't ensures hasOwnProperty and go deep

                    aProperties.push(i); // collect a's properties

                    if ( ! innerEquiv(a[i], b[i])) {
                        eq = false;
                    }
                }

                callers.pop(); // unstack, we are done

                for (i in b) {
                    bProperties.push(i); // collect b's properties
                }

                // Ensures identical properties name
                return eq && innerEquiv(aProperties.sort(), bProperties.sort());
            }
        };
    }();

    innerEquiv = function () { // can take multiple arguments
        var args = Array.prototype.slice.apply(arguments);
        if (args.length < 2) {
            return true; // end transition
        }

        return (function (a, b) {
            if (a === b) {
                return true; // catch the most you can

            } else if (typeof a !== typeof b || a === null || b === null || typeof a === "undefined" || typeof b === "undefined") {
                return false; // don't lose time with error prone cases

            } else if (b && b.isEqual && b.isEqual instanceof Function) {
              return b.isEqual(a);
              
            } else {
                return bindCallbacks(a, callbacks, [b, a]);
            }

        // apply transition with (1..n) arguments
        })(args[0], args[1]) && arguments.callee.apply(this, args.splice(1, args.length -1));
    };

    return innerEquiv;
}(); // equiv

/** @class

  A test Suite defines a group of reusable unit tests that can be added to a 
  test plan at any time by calling the generate() method.  Suites are most
  useful for defining groups of tests that validate compliance with a mixin.
  You can then generate customized versions of the test suite for different
  types of objects to ensure that both the mixin and the object implementing
  the mixin use the API properly.
  
  h1. Using a Suite
  
  To use a Suite, call the generate() method on the suite inside on of your
  unit test files.  This will generate new modules and tests in the suite
  and add them to your test plan.
  
  Usually you will need to customize the suite to apply to a specific object.
  You can supply these customizations through an attribute hash passed to the
  generate() method.  See the documentation on the specific test suite for
  information on the kind of customizations you may need to provide.
  
  h2. Example
  
  {{{
    // generates the SC.ArrayTestSuite tests for a built-in array.
    SC.ArrayTests.generate('Array', {
      newObject: function() { return []; }
    });
  }}}
  
  h1. Defining a Suite
  
  To define a test suite, simply call the extend() method, passing any 
  attributs you want to define on the stuie along with this method.  You can
  then add functions that will define the test suite with the define() method.
  
  Functions you pass to define will have an instance of the test suite passed
  as their first parameter when invoked.

  h2. Example 
  
  {{{
    SC.ArrayTests = CoreTest.Suite.create("Verify SC.Array compliance", {
      
      // override to generate a new object that implements SC.Array
      newObject: function() { return null; }
    });
    
    SC.ArrayTests.define(function(T) {
      T.module("length tests");
      
      test("new length", function() {
        equals(T.object.get('length'), 0, 'array length');
      });
      
    });
  }}}
  
  @since SproutCore 1.0
  
*/
CoreTest.Suite = /** @scope CoreTest.Suite.prototype */ {

  /**
    Call this method to define a new test suite.  Pass one or more hashes of
    properties you want added to the new suite.  
    
    @param {Hash} attrs one or more attribute hashes
    @returns {CoreTest.Suite} subclass of suite.
  */
  create: function(desc, attrs) {
    var len = arguments.length,
        ret = CoreTest.beget(this),
        idx;
        
    // copy any attributes
    for(idx=1;idx<len;idx++) CoreTest.mixin(ret, arguments[idx]);
    
    if (desc) ret.basedesc = desc;
    
    // clone so that new definitions will be kept separate
    ret.definitions = ret.definitions.slice();
    
    return ret ;
  },

  /**
    Generate a new test suite instance, adding the suite definitions to the 
    current test plan.  Pass a description of the test suite as well as one or
    more attribute hashes to apply to the test plan.
    
    The description you add will be prefixed in front of the 'desc' property
    on the test plan itself.
    
    @param {String} desc suite description
    @param {Hash} attrs one or more attribute hashes
    @returns {CoreTest.Suite} suite instance
  */
  generate: function(desc, attrs) {
    var len = arguments.length,
        ret = CoreTest.beget(this),
        idx, defs;
        
    // apply attributes - skip first argument b/c it is a string
    for(idx=1;idx<len;idx++) CoreTest.mixin(ret, arguments[idx]);    
    ret.subdesc = desc ;
    
    // invoke definitions
    defs = ret.definitions ;
    len = defs.length;
    for(idx=0;idx<len;idx++) defs[idx].call(ret, ret);
    
    return ret ;
  },
  
  /**
    Adds the passed function to the array of definitions that will be invoked
    when the suite is generated.
    
    The passed function should expect to have the TestSuite instance passed
    as the first and only parameter.  The function should actually define 
    a module and tests, which will be added to the test suite.
    
    @param {Function} func definition function
    @returns {CoreTest.Suite} receiver
  */
  define: function(func) {
    this.definitions.push(func);
    return this ;
  },
  
  /** 
    Definition functions.  These are invoked in order when  you generate a 
    suite to add unit tests and modules to the test plan.
  */
  definitions: [],
  
  /**
    Generates a module description by merging the based description, sub 
    description and the passed description.  This is usually used inside of 
    a suite definition function.
    
    @param {String} str detailed description for this module
    @returns {String} generated description
  */
  desc: function(str) {
    return this.basedesc.fmt(this.subdesc, str);
  },
  
  /**
    The base description string.  This should accept two formatting options,
    a sub description and a detailed description.  This is the description
    set when you call extend()
  */
  basedesc: "%@ > %@",
  
  /**
    Default setup method for use with modules.  This method will call the
    newObject() method and set its return value on the object property of 
    the receiver.
  */
  setup: function() {
    this.object = this.newObject();
  },
  
  /**
    Default teardown method for use with modules.  This method will call the
    destroyObejct() method, passing the current object property on the 
    receiver.  It will also clear the object property.
  */
  teardown: function() {
    if (this.object) this.destroyObject(this.object);
    this.object = null;
  },
  
  /**
    Default method to create a new object instance.  You will probably want
    to override this method when you generate() a suite with a function that
    can generate the type of object you want to test.
    
    @returns {Object} generated object
  */
  newObject: function() { return null; },
  
  /**
    Default method to destroy a generated object instance after a test has 
    completed.  If you override newObject() you can also overried this method
    to cleanup the object you just created.
    
    Default method does nothing.
  */
  destroyObject: function(obj) { 
    // do nothing.
  },
  
  /**
    Generates a default module with the description you provide.  This is 
    a convenience function for use inside of a definition function.  You could
    do the same thing by calling:
    
    {{{
      var T = this ;
      module(T.desc(description), {
        setup: function() { T.setup(); },
        teardown: function() { T.teardown(); }
      }
    }}}
    
    @param {String} desc detailed descrition
    @returns {CoreTest.Suite} receiver
  */
  suite: function(desc) {
    var T = this ;
    suite(T.desc(desc), {
      setup: function() { T.setup(); },
      teardown: function() { T.teardown(); }
    });
  }
  
};

global.CoreTest = CoreTest;

// Bring in the actual array tests.
fs.readdirSync('./tests/test_suites/array/').forEach(function(filename) {
  require('./tests/test_suites/array/'+filename);
});
