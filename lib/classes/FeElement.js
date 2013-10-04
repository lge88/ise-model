
var ISEObject = require( '../ISEObject' );
module.exports = exports = ISEObject.extend( {
  getElementType: function() {
    return this.constructor.elementType;
  }
}, {
  type: 'FeElement',
  path: 'elements',
  elementType: 'unknown',
} );
