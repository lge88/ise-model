
var ISEModel = require( 'ise-model' );
var expect = require( 'expect.js' );

describe( 'ise-model', function() {

  it( '#sync', function() {
    var m1 = new ISEModel( { ndm: 2, ndf: 2 } );
    var m2 = ISEModel.createModel( m1.toJSON() );
    var syncer = ISEModel.createObject();

    // encapsule these in a ISEModel.prototype.method
    m2.listenTo( m1, 'commit', function( deltas ) {
      m2.applyDelta( deltas );
    } );

    m2.listenTo( m1, 'objectAdded', function( obj ) {
      var json = obj.toJSON();
      var parent_id = json._parent_id;
      var parent = m2.__objects.get( parent_id ) || m2;
      var o = parent.createObject( json );
      // console.log( json );

      // o.on( 'change', function( o ) {
      //   console.log( 'objectUpdated:' + o.toJSON() );
      // } );
    } );

    m2.listenTo( m1, 'objectRemoved', function( obj ) {
      var json = obj.toJSON();
      var id = json.id, obj = m2.__objects.get( id );
      obj && obj.parent && obj.parent.remove( json );
    } );

    m2.listenTo( m1, 'objectUpdated', function( obj ) {
      var json = obj.toJSON();
      var id = json.id, obj = m2.__objects.get( id );
      if ( obj ) {
        obj.set( json );
      }
      // obj && obj.parent && obj.parent.remove( json );
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
    console.log( JSON.stringify( m1.nodes() ) )

    expect( m1.toJSON( { flatten: true } ) ).to.eql( m2.toJSON( { flatten: true } ) );
    console.log( JSON.stringify( m1.toJSON( { flatten: true } ) ) );
    console.log( JSON.stringify( m2.toJSON( { flatten: true } ) ) );

    var m3 = ISEModel.createModel( m1.toJSON() );

    c2.remove( c3 );
    c4.remove( c5 );
    expect( m1.toJSON() ).to.eql( m2.toJSON() );



    console.log( JSON.stringify( m1.toJSON() ) );
    console.log( JSON.stringify( m2.toJSON() ) );
    console.log( JSON.stringify( m1.nodes() ) )


  } );

} );
