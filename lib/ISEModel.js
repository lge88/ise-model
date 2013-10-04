
var ISEComposite = require( './ISEComposite' );
var ISEObjectSet = require( './ISEObjectSet' );
var ISEObject = require( './ISEObject' );
var protos = require( './protos' );
var flatten = require( 'underscore' ).flatten;

var ISEModel = ISEComposite
  .use( {
    instanceMembers: {
      routes: {},
      initialize: function( json ) {
        ISEComposite.prototype.initialize.call( this, json );
        this.__objects = new ISEObjectSet();
        this.__deltas = new ISEObjectSet();

        // initRoutes:
        this.__initRoutes();

        var _this = this;

        this.listenTo( this.__objects, 'add', function( obj ) {
          // _this.trigger( 'objectAdded', obj );
          _this.listenTo( obj, 'change', function( o ) {
            _this.trigger( 'objectUpdated', o );
          } ) ;
          var col = _this.__findObjectCollection( obj );
          col && col.add( obj );
        } );

        this.listenTo( this.__objects, 'remove', function( obj ) {
          // _this.trigger( 'objectRemoved', obj );
          _this.stopListening( obj );
          var col = _this.__findObjectCollection( obj );
          col && col.remove( obj );
        } );

        return this;
      },
      query: function( json, cb ) {
        return this.__objects;
      },
      __findObjectCollection: function( o ) {
        var typeMap = this.__typePathMap;
        var t = this.getObjectType( o );
        var path = typeMap[ t ];
        if ( path && this[ '__' + path ] ) {
          return this[ '__' + path ];
        }
        return null;
      },
      __initRoutes: function() {
        var _this = this, routes = this.routes;
        var typeMap = this.__typePathMap = {};
        Object
          .keys( routes )
          .forEach( function( k ) {
            _this[ '__' + k ] = new ISEObjectSet();
            // query interface
            _this[ k ] = function( json, cb ) {
              return _this[ '__' + k ];
            }
            var types = routes[ k ];
            types.forEach( function( t ) {
              typeMap[ t ] = k;
            } );
          } );
      },
      __addOneObject: function( obj ) {
        var _this = this;
        obj.root = this;
        this.__objects.add( obj );
      },
      __removeOneObject: function( obj ) {
        delete obj.root;
        this.__objects.remove( obj );
      },
      __compileDeltas: function( deltas ) {
        return deltas;
      },
      __addObject: function( obj ) {
        var _this = this, store = this.__objects;

        if ( typeof obj.traverse === 'function' ) {
          obj.traverse( function( o ) {
            _this.__addOneObject( o );
          } );
        } else {
          this.__addOneObject( obj );
        }
        this.trigger( 'objectAdded', obj );
      },
      __removeObject: function( obj ) {
        var _this = this, store = this.__objects;
        if ( typeof obj.traverse === 'function' ) {
          obj.traverse( function( o ) {
            delete o.root;
            store.remove( o );
          } );
        } else {
          store.remove( obj );
          delete obj.root;
        }
        this.trigger( 'objectRemoved', obj );
      },

      applyDeltas: function( deltas, cb ) {
        console.log( deltas );

      },

      toJSON: function( options ) {
        options || ( options = {} );
        var json;
        if ( options.flatten ) {
          json = ISEObject.prototype.toJSON.call( this, options );
          json._objects = this.__objects.map( function( o ) {
            return o.toJSON();
          } );
        } else {
          json = ISEComposite.prototype.toJSON.call( this, options );
        }
        return json;
      }
    },
    classMembers: {
      type: 'Model',
      registerRoute: function( path, types ) {
        var _this = this;
        if ( arguments.length === 1 ) {
          flatten( ensureArray( path ) )
            .filter( function( p ) {
              return typeof p.path !== 'undefined';
            } )
            .forEach( function( p ) {
              var path = p.path, type = p.type;
              _this.registerRoute( path, type );
            } );
        } else if ( arguments.length === 2 ) {
          types = ensureArray( types );
          if ( !this.prototype.routes[ path ] ) {
            this.prototype.routes[ path ] = [];
          }
          this.prototype.routes[ path ] =
            this.prototype.routes[ path ].concat( types );
        }
      }
    }
  } )
  .use( protos )
  .getComposed();

function ensureArray( x ) {
  return Array.isArray( x ) ? x : [x];
}

module.exports = exports = ISEModel;
