
var ISEObject = require( './ISEObject' );
var ISEModel = require( './ISEModel' );

ISEObject.registerClass( require( './ISEModel' ) );
ISEObject.registerClass( require( './ISEComposite' ) );
ISEObject.registerClass( require( './classes' ) );

var factory = ISEObject.prototype.factory;
Object
  .keys( factory )
  .forEach( function( k ) {
    var type = k, ctor = factory[ type ];
    var f = function( json ) {
      json || ( json = {} );
      json._type = type;
      return this.createObject( json );
    }
    ISEModel[ 'create' + type ] = f;
    ISEObject.prototype[ 'create' + type ] = f;
  } );

module.exports = exports = ISEModel;
