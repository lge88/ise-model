
var Backbone = require( 'backbone' );
var uuid = require( 'uuid' );
var composable = require( 'composable' );
var _ = require( 'underscore' );
var ISEObjectSet = Backbone.Collection.extend();
var ISERepo = require( './ISERepo' );

var ISEObject = composable( [
  // uuid, type, path and ISEModel;
  Backbone.Model.extend( {
    initialize: function( json ) {
      this.children = new ISEObjectSet;
      this.name = this.get( 'name' );
      this.parent = undefined;
      this.repo = undefined;
      this._batched = false;
      this._batchedOperations = [];
      return this;
    },

    resolveReferences: function( ref ) {
      if ( this.repo ) {
        return this.repo.resolveReferences( ref );
      }
      return undefined;
    },



    silent: function( flag ) {
      if ( typeof flag !== 'undefined' ) {
        this._silent = flag;
      } else {
        return this.__silent;
      }
    },

    // set: function() {
    //   var args =  Array.prototype.slice.call( arguments );
    //   var options = null;
    //   if ( this.__silent === true ) {
    //     options = { silent: true };
    //   }
    //   options && ( args.push( options ) );
    //   return Backbone.Model.prototype.set.apply( this, args );
    // },

    setRepo: function( repo ) {
      repo || ( repo = new ISERepo );
      repo.init( this );
      this.repo = repo;
      return repo;
    },

    add: function( object ) {
 	  if ( object === this ) {
	    console.warn( 'ISEObject.add: An object can\'t be added as a child of itself.' );
	    return null;
	  }

	  if ( object instanceof ISEObject ) {
	    if ( object.parent !== undefined ) {
		  object.parent.remove( object );
	    }

	    object.parent = this;
	    this.children.add( object );

	    var repo = this.getRepo();

	    if ( root !== undefined && typeof root.__addObject === 'function' )  {
		  root.__addObject( object );
	    }
        return object;
	  }

      return null;
    },

    startBatch: function() {
      this._batched = true;
      return this;
    },

    execBatch: function( arr, cb ) {
      var operations = this._batchedOperations
        .concat( ensureArray( arr ) );
      this.trigger( 'batch', operations );

    },

    command: function( json, cb ) {
      switch( json.method ) {
      case 'create':

        break;
      case 'update':

        break;
      case 'remove':

        break;
      default:
        return {
          error: 'Can not find command ' + json.method
        };
      }
    },

    remove: function( object ) {
      if ( typeof object === 'string' ) {
        object = this.children.get( object );
      } else {
        object = this.children.get( object.id );
      }

	  if ( object ) {
	    object.parent = undefined;
        this.children.remove( object );

        this.trigger( 'remove', {
          id: object.id
        } );

	    var root = this.getRoot();

	    if ( root !== undefined && typeof root.__removeObject === 'function' ) {
		  root.__removeObject( object );
	    }
        return object;
	  }
      return null;
    },

    refresh: function() {
      // do nothing, override;
    },

    update: function() {
      var from = this.__lastState;
      var to = this.toJSON();
      this.trigger( 'update', {
        from: from,
        to: to
      } );
      this.__lastState = this.toJSON();
    },

    traverse: function ( callback ) {
	  callback( this );
      this.children.forEach( function( c ) {
        if ( typeof c.traverse === 'function' ) {
          c.traverse( callback );
        } else {
          callback( c );
        }
      } );
    },

    toJSON: function( options ) {
      options || ( options = {} );
      var json = Backbone.Model.prototype.toJSON.call( this, options );
      if ( options.recursive === true ) {
        if ( this.children.length > 0 ) {
          json.children = this.children.toJSON();
        }
      }
      return json;
    },

    url: function() {
      if ( this.root ) {
        return this.root.getObjectUrl( this );
      } else {
        return undefined;
      }
    },

    getType: function() {
      return this.constructor.type;
    },

    getPath: function() {
      return this.constructor.path;
    },

    getRepo: function() {
	  var repo = this;

      if ( repo instanceof ISERepo ) { return repo; }

	  while ( repo.parent !== undefined ) {
	    root = root.parent;
        if ( repo instanceof ISERepo ) { return repo; }
	  }

      return undefined;
    },

    factory: {},

    getObjectType: function( obj ) {
      return this.constructor.getObjectType( obj );
    },

    createObject: function( obj ) {
      obj =  this.constructor.createObject( obj );
      this.add( obj );
      return obj;
    },

  }, {

    create: function( json ) {
      json || ( json = {} );
      if ( !json || typeof json !== 'object' ) {
        throw new Error( 'ISEObject.createFromJSON: json must be a object' );
      }

      if ( json instanceof ISEObject ) {
        json = json.toJSON();
      } else {
        json = _.clone( json );
      }

      var metaFields = Object.keys( json ).filter( function( k ) {
        return /^_/.test( k );
      } );

      var obj = new ISEObject( _.omit( json, metaFields ) );

      // handle meta fields:
      obj.id = json._id || this.generateId();
      obj.parent_id = json._parent_id;

      return obj;
    },

    registerClass: function( type, ctor ) {
      var _this = this;
      if ( arguments.length === 1 ) {
        if ( Array.isArray( type ) ) {
          _.chain( type )
            .flatten()
            .compact()
            .forEach( function( t ) {
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
      return this;
    },

    getObjectType: function( obj ) {
      if ( !obj ) { return undefined; }
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
      var metaFields = Object.keys( json ).filter( function( k ) {
        return /^_/.test( k );
      } );
      var withOutMeta = _.omit( obj, metaFields );

      if ( !( obj instanceof ISEObject ) ) {
        var ctor = this.findConstructor( obj );
        if ( typeof ctor === 'function' ) {
          if ( typeof ctor.create === 'function' ) {
            return ctor.create( obj );
          } else {
            return new ctor( withOutMeta );
          }
        }
      }
      return this.create( obj );
    },

    uuid: uuid,
    generateId: uuid,
    type: 'ISEObject',
    path: '_objects',
    getType: function() { return this.type; },
    getPath: function() { return this.path; }
  } ),
  { classMembers: composable.classMembers }
] );
module.exports = exports = ISEObject;

function ensureArray( x ) {
  return Array.isArray( x ) ? x : [ x ];
}
