
var ISEObject = require( '../ISEObject' );
module.exports = exports = ISEObject.extend( {
  defaults: {
    position: { x: 0, y: 0, z: 0 }
  }
}, {
  type: 'FeNode',
  path: 'nodes'
} );
