
var ISEObject = require( './ISEObject' );
var Backbone = require( 'backbone' );
var ISEObjectSet = Backbone.Collection.extend();

var ISEComposite = ISEObject.extend( {
  initialize: function( json ) {
    ISEObject.prototype.initialize.call( this, json );
    this.children = new ISEObjectSet();
    return this;
  },

  createObject: function( obj ) {
    obj = this.constructor.createObject( obj );
    return this.add( obj );
  },

  add: function( object ) {
 	if ( object === this ) {
	  console.warn( 'ISEComposite.add: An object can\'t be added as a child of itself.' );
	  return null;
	}

	if ( object instanceof ISEComposite ) {
	  if ( object.parent !== undefined ) {
		object.parent.remove( object );
	  }

	  object.parent = this;
      object.trigger( 'added', object );
	  this.children.add( object );

	  var root = this.findRoot();

	  if ( root !== undefined && typeof root.__addObject === 'function' )  {
		root.__addObject( object );
	  }
      return object;
	}

    return null;
  },

  remove: function( object ) {
    if ( typeof object === 'string' ) {
      object = this.children.get( object );
    } else {
      object = this.children.get( object.id );
    }

	if ( object ) {
	  object.parent = undefined;
      object.trigger( 'removed', object );
      this.children.remove( object );
	  var root = this;
	  while ( root.parent !== undefined ) {
		root = root.parent;
	  }

	  if ( root !== undefined && typeof root.__removeObject === 'function' ) {
		root.__removeObject( object );
	  }
      return object;
	}
    return null;
  },

  traverse: function ( callback ) {
	callback( this );
    this.children.forEach( function( c ) {
      c.traverse( callback );
    } );
  },

  toJSON: function( options ) {
    var json = ISEObject.prototype.toJSON.call( this, options );
    if ( this.children.length > 0 ) {
      json.children = this.children.toJSON();
    }
    return json;
  }

}, {
  type: 'Group'
} );

module.exports = exports = ISEComposite;
