
var Backbone = require( 'backbone' );
var uuid = require( 'uuid' );
var composable = require( 'composable' );
var _ = require( 'underscore' );

var ISEObject = composable( [
  // uuid, type, path and ISEModel;
  Backbone.Model.extend( {
    initialize: function( json ) {
      json || ( json = {} );
      if ( !json || typeof json !== 'object' ) {
        throw new Error( 'ISEObject.initialize: json must be a object' );
      }

      if ( json instanceof ISEObject ) {
        json = json.toJSON();
      } else {
        json = _.clone( json );
      }

      if ( json._type ) {
        if ( json._type !== this.getType() ) {
          throw new Error( 'ISEObject.initialize: json._type do not match the type of constructor' );
        }
        delete json._type;
      }

      if ( json.id ) {
        this.id = json.id;
        delete json.id;
      } else {
        this.id = uuid();
      }

      this.parent = undefined;
      if ( json._parent_id ) {
        this.parent_id = json._parent_id;
        delete json._parent_id;
      }

      if ( json.name ) {
        this.name = json.name;
        delete json.name;
      } else {
        this.name = '';
      }

      return this;
    },
    getType: function() {
      return this.constructor.type;
    },
    getPath: function() {
      return this.constructor.path
    },

    update: function() {

    },

    findRoot: function() {
	  var root = this;
	  while ( root.parent !== undefined ) {
	    root = root.parent;
	  }
      return root;
    },

    toJSON: function( options ) {
      var json = Backbone.Model.prototype.toJSON.call( this );
      json.id = this.id;
      json._type = this.getType();
      if ( this.parent && this.parent instanceof ISEObject ) {
        json._parent_id = this.parent.id;
      }
      return json;
    },

    factory: {},

    getObjectType: function( obj ) {
      return this.constructor.getObjectType( obj );
    },

    createObject: function( obj ) {
      // if ( obj._parent_id && obj._parent_id !== this.id ) {
      //   throw new Error( 'ISEComposite.createObject: parent id does not match' );
      // }
      return this.constructor.createObject( obj );
      // obj = this.constructor.createObject( obj );
      // return this.add( obj );
    },

    // toJSON: function( options ) {
    //   var json = ISEObject.prototype.toJSON.call( this, options );
    //   if ( this.children.length > 0 ) {
    //     json.children = this.children.toJSON();
    //   }
    //   return json;
    // }

  }, {
    registerClass: function( type, ctor ) {
      var _this = this;
      if ( arguments.length === 1 ) {
        if ( Array.isArray( type ) ) {
          type.forEach( function( t ) {
            if ( Array.isArray( t ) ) {
              _this.registerClass.apply( t );
            } else {
              _this.registerClass( t );
            }
          } );
          return this;
        } else if ( typeof type === 'function' ) {
          ctor = type;
          if ( typeof type.getType === 'function' ) {
            type = type.getType();
          } else if ( typeof type.type === 'string' ) {
            type = type.type;
          } else {
            type = type.name;
          }
        }
      }

      if ( typeof type !== 'string' || type === '' ) {
        throw new Error( 'ISEComposite#registerClass: Invalid type ' + type );
      }

      if ( typeof ctor !== 'function' ) {
        throw new Error( 'ISEComposite#registerClass: Invalid constructor ' + ctor );
      }

      this.prototype.factory[ type ] = ctor;

      // ctor.parentFactory = this.prototype.factory;

      return this;
    },

    getObjectType: function( obj ) {
      if ( typeof obj.getType === 'function' ) {
        return obj.getType();
      } else if ( typeof obj.type === 'string' ) {
        return obj.type;
      } else if ( typeof obj._type === 'string' ) {
        return obj._type;
      } else if ( typeof obj.constructor.getType === 'function' ) {
        return obj.constructor.getType();
      } else if ( typeof obj.constructor.type === 'string' ) {
        return obj.constructor.type;
      } else {
        return undefined;
      }
    },

    findConstructor: function( json ) {
      var factory = this.prototype.factory;
      var type = ( typeof json === 'object' ) ? this.getObjectType( json ) : json;
      if ( !type ) { return ISEObject; }

      var sep = '.';
      var list = type.split( '.' );
      var thisLevel = list.shift();
      var nextLevel = list.join( sep );
      var ctor = factory[ thisLevel ];

      if ( nextLevel !== '' ) {
        if ( typeof ctor.findConstructor === 'function' ) {
          return ctor.findConstructor( nextLevel );
        } else {
          return null;
        }
      } else {
        return ctor;
      }
    },

    createObject: function( obj ) {
      if ( !( obj instanceof ISEObject ) ) {
        var ctor = this.findConstructor( obj );
        if ( typeof ctor === 'function' ) {
          obj = new ctor( obj );
        } else {
          obj = new this( obj );
        }
      }
      return obj;
    },

    path: null,
    getType: function() { return this.type; },
    getPath: function() { return this.path; }
  } ),
  { classMembers: composable.classMembers }
] );
module.exports = exports = ISEObject;
