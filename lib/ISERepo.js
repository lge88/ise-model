
// var ISEComposite = require( './ISEComposite' );
var ISEObjectSet = require( './ISEObjectSet' );
var ISEObject = require( './ISEObject' );
var Backbone = require( 'backbone' );
var uuid = require( 'uuid' );

var ISERepo = Backbone.Model.extend( {
  initialize: function() {
    this.root = undefined;
    this.__objects = new ISEObjectSet;
    this.__historyStack = new ISEObjectSet;
  },

  init: function( obj ) {
    var db = this.__objects;
    var _this = this;

    db.forEach( function( o ) {
      _this.stopListening( o );
    } );

    db.reset();

    if ( typeof obj.traverse === 'function' ) {
      obj.traverse( function( o ) {
        db.add( o );
      } );
    } else {
      db.add( obj );
    }

    this.root = obj;
  },

  commit: function() {

  },

  resolveReferences: function( id ) {
    return this.__objects.get( id );
  },

  applyDeltas: function() {

  },
} );

function getUndo( delta ) {

}

function Mark() {
  this.id = uuid();
  this.committed = false;
  this.deltas = new ISEObjectSet;
}

function Delta( method, params ) {

}

Delta.CREATE = 0;
Delta.REMOVE = 1;
Delta.UPDATE = 2;
