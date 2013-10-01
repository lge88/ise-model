
var ISEComposite = require( './ISEComposite' );
var ISEObjectSet = require( './ISEObjectSet' );
var protos = require( './protos' );

var ISEModel = ISEComposite
  .use( {
    instanceMembers: {
      initialize: function( json ) {
        ISEComposite.prototype.initialize.call( this, json );
        this.__objects = new ISEObjectSet();
        return this;
      },
      __addObject: function( obj ) {
        this.__objects.add( obj );
        this.trigger( 'objectAdded', obj.toJSON() );
      },
      __updateObject: function( obj ) {
        this.trigger( 'objectUpdated', obj.toJSON() );
      },
      __removeObject: function( obj ) {
        this.__objects.remove( obj );
        this.trigger( 'objectRemoved', obj.toJSON() );
      }
    },
    classMembers: {
      type: 'Model'
    }
  } )
  .use( protos )
  .getComposed();

module.exports = exports = ISEModel;
