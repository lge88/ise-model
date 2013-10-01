
var ISEModel = require( 'ise-model' );
var expect = require( 'expect.js' );

describe( 'ise-model', function() {

  it( 'should return Hello World', function() {
    var m1 = new ISEModel( { x: 1, y: 2 } );
    var m2 = ISEModel.createModel( m1.toJSON() );

    m2.listenTo( m1, 'objectAdded', function( json ) {
      var parent_id = json._parent_id;
      var parent = m2.__objects.get( parent_id ) || m2;
      parent.createObject( json );
    } );

    m2.listenTo( m1, 'objectRemoved', function( json ) {
      var id = json.id, obj = m2.__objects.get( id );
      obj && obj.parent && obj.parent.remove( json );
    } );

    m2.listenTo( m1, 'objectUpdated', function( json ) {
      var id = json.id, obj = m2.__objects.get( id );
      if ( obj ) {
        obj.update( json );
      }
      // obj && obj.parent && obj.parent.remove( json );
    } );

    var c2 = m1.createGroup();
    var c3 = c2.createGroup();
    var c4 = c2.createGroup();
    var c5 = c3.createGroup();
    var c6 = c5.createObject();

    expect( m1.toJSON() ).to.eql( m2.toJSON() );
    console.log( JSON.stringify( m1.toJSON() ) );
    console.log( JSON.stringify( m2.toJSON() ) );

    c2.remove( c3 );
    c4.remove( c5 );
    expect( m1.toJSON() ).to.eql( m2.toJSON() );

    console.log( JSON.stringify( m1.toJSON() ) );
    console.log( JSON.stringify( m2.toJSON() ) );


  } );

} );
