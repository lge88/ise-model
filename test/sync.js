
var ISEModel = require( 'ise-model' );
var expect = require( 'expect.js' );

describe( 'ise-model sync', function() {

  it( '#sync', function() {
    var m1 = new ISEModel();
    m1.enableHistory();
    var m2 = new ISEModel();

    m2.listenTo( m1, 'deltas', function( deltas ) {
      m2.applyDeltas( JSON.stringify( deltas ) );
    } );

    var c2 = m1.createGroup();
    c2.set( { x: 2, y:2, z: 3 } );
    var c3 = c2.createGroup();
    var c4 = c2.createGroup();
    c3.set( { x: 12, y:2, z: 43 } );
    c4.set( { x: 32, y:42, z: 3 } );
    var c5 = c3.createGroup();
    var c6 = c5.createObject();
    c6.set( { nn: 30 } );
    var c7 = c5.createFeNode();

    // expect( m1.toJSON( { flatten: true } ) ).to.eql( m2.toJSON( { flatten: true } ) );



  } );

  it( '#import/export', function() {
    var m1 = new ISEModel( { ndm: 2, ndf: 2 } );



  } );

} );
