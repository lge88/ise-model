var _ = require( 'underscore' );
var Backbone = require( 'backbone' );
var uuid = require( 'uuid' );

function HistoryController( model ) {
  if ( !( this instanceof HistoryController ) ) {
    return new HistoryController( model );
  }

  var scope = this;
  _.extend( scope, Backbone.Events );
  scope.init = init;
  scope.commit = commit;
  scope.isDirty = isDirty;
  scope.start = start;
  scope.stop = stop;
  scope.onObjectAdded = onObjectAdded;
  scope.onObjectRemoved = onObjectRemoved;

  var db = model.__objects;
  var createObject = model.constructor.createObject;

  var initialMark = createMark( null );
  var editting = true;
  var history = {
    first: initialMark,
    last: initialMark,
    HEAD: initialMark,
    byId: {},
    byLabel: {}
  };
  history.byId[ initialMark.id ] = initialMark;
  history.byLabel[ 'initial_commit' ] = initialMark;

  function addMark( mark ) {
    history.byId[ mark.id ] = mark;
    if ( mark.label ) {
      history.byLabel[ mark.label ] = mark;
    }
  }

  function findMark( id ) {
    if ( typeof id === 'object' ) { return id; }
    return history.byId[ id ] || history.byLabel[ id ];
  }

  function setLabel( mark, label ) {
    mark.label = label;
    addMark( mark );
  }

  function setHEAD( head ) {
    history.HEAD = head;
  }

  function getLastMark() {
    var mark = history.HEAD;
    while ( mark.next !== null ) {
      mark = mark.next;
    }
    return mark;
  }

  function getFirstMark( mark ) {
    mark  || ( mark = history.HEAD );
    while ( mark.prev !== null ) {
      mark = mark.prev;
    }
    return mark;
  }

  // Return the difference between a state and b state
  // return deltas
  function getDiff( a, b ) {
    a = findMark( a );
    b = findMark( b );
    if ( !a || !b ) {
      throw new Error( 'Can not find a or b ' );
    }

    var len = b.position - a.position;
    var deltas = [], mark = a, nextKey, deltaKey, i;
    if ( len === 0 ) {
      return [];
    } else if ( len > 0 ) {
      nextKey = 'next';
      deltaKey = 'exec';
    } else {
      nextKey = 'prev';
      deltaKey = 'undo';
      len = -len;
    }

    for ( i = 0; i < len; ++i ) {
      mark = mark[ nextKey ];
      deltas.push( mark.operations[ deltaKey ] );
    }
    return {
      from: a.id,
      to: b.id,
      operations: deltas
    };
  }

  // Start editting from here, remove history after this point.
  function startEditing( mark ) {
    mark = findMark( mark );
    if ( !mark ) { throw new Error( 'Can not find mark' );  }

    if ( mark.committed === true ) {
      var newMark = createMark( mark );
      history.HEAD = newMark;
      history.last = newMark;
    }
  }

  function createMark( prev ) {
    var mark =  {
      id: uuid(),
      prev: prev,
      next: null,
      committed: false,

      toBeAdded: {},
      toBeRemoved: {},
      toBeUpdated: {},

      // each operation has exec and undo object
      // exec and undo is a JSON rpc request object
      operations: [],

      doDeltas: [],
      undoDeltas: []
    };

    if ( prev ) {
      prev.next = mark;
      mark.position = prev.position + 1;
    } else {
      mark.position = 0;
    }
    return mark;
  }

  function isDirty() {
    if ( editting ) {  }
    var diff = history.last();
    return diff.committed === false;
  }

  function getLastCommit() {}

  function revertToLastCommit() {
    // var diff = getDiff();

  }

  function compileDeltas( deltas ) {

    return deltas;
  }

  function resolveDeltas( deltas ) {
    return deltas;
  }

  function applyDeltas( deltas ) {
    var unresolved = new Backbone.Collection;
    var methods = {
      create: function( json ) {
        var data = json.data;
        var obj = createObject( data );
        var parent = getObjectById( obj.parent_id );
        if ( parent ) {
          parent.add( obj );
        } else {
          unresolved.push( obj );
        }
      },
      remove: function( json ) {
        var obj = getObjectById( json.id );
        obj && obj.parent && obj.parent.remove( obj );
      },
      update: function( json ) {
        var obj = getObjectById( json.id );
        obj && obj.set( json.data );
      }
    };

    deltas.forEach( function( d ) {
      var fn = methods[ d.method ];
      fn( d.params );
    } );

    unresolved.forEach( function( o ) {
      var parent = getObjectById( o.parent_id );
      parent && parent.add( o );
    } );

    function getObjectById( id ) {
      return db.get( id ) || unresolved.get( id );
    }

  }

  function onObjectAdded( obj ) {
    var head = history.HEAD;
    startEditing( history.HEAD );

    if ( typeof obj.traverse === 'function' ) {
      obj.traverse( addOneObject );
    } else {
      addOneObject( obj );
    }

    function addOneObject( o ) {
      var operation;
      if ( !history.toBeAdded[ o.id ] ) {
        operation = getDeltaForAddingObject( o );
        operation.position = head.operations.length;
        head.operations.push( operation );
        // head.doDeltas.push( d.exec );
        // head.undoDeltas.push( d.undo );
        head.toBeAdded[ o.id ] = operation;
      } else {
        var pos = head.toBeUpdated[ o.id ].position;
        operation = getDeltaForUpdatingObject( o );
        operation.position = pos;
        head.operations[ pos ] = operation;
      }
      // var operation = getDeltaForAddingObject( o );
      // head.doDeltas.push( operation.exec );
      // head.undoDeltas.push( operation.undo );
      // history.toBeAdded[ o.id ] = o;
    }
  }

  function getDeltaForAddingObject( o, reverse ) {
    var delta = {};
    var doKey = 'exec', undoKey = 'undo';

    if ( reverse === true ) {
      doKey = 'undo';
      undoKey = 'exec';
    }

    delta[ doKey ] = {};
    delta[ undoKey ] = {};

    delta[ doKey ].method = 'create';
    delta[ doKey ].params = o.toJSON();
    delta[ doKey ].params.id = o.id;
    delta[ doKey ].params._parent_id = o.parent.id;
    delta[ doKey ].params._type = o.getType();

    delta[ undoKey ].method = 'remove';
    delta[ undoKey ].params = { id: o.id };

    return delta;
  }

  function getDeltaForUpdatingObject( o ) {
    var delta = { exec: {}, undo: {} };

    delta.exec.method = 'update';
    delta.exec.params = {
      id: o.id,
      data: o.toJSON()
    };

    delta.undo.method = 'update';
    delta.undo.params = {
      id: o.id,
      data: o.previousAttributes()
    };

    return delta;
  }

  function onObjectRemoved( obj ) {

    var head = history.HEAD;
    startEditing( history.HEAD );

    if ( typeof obj.traverse === 'function' ) {
      obj.traverse( removeOneObject );
    } else {
      removeOneObject( obj );
    }

    function removeOneObject( o ) {
      var d = getDeltaForAddingObject( o, true );
      head.doDeltas.push( d.exec );
      head.undoDeltas.push( d.undo );
    }
  }

  function onObjectUpdated( obj ) {
    var head = history.HEAD;
    startEditing( history.HEAD );

    if ( typeof obj.traverse === 'function' ) {
      obj.traverse( updateOneObject );
    } else {
      updateOneObject( obj );
    }

    function updateOneObject( o ) {
      var d = getDeltaForAddingObject( o, true );
      head.doDeltas.push( d.exec );
      head.undoDeltas.push( d.undo );
    }
  }

  function init() {

  }

  function commit() {

  }

  function start() {
    scope.listenTo( model, 'objectAdded', onObjectAdded );
    scope.listenTo( model, 'objectRemoved', onObjectRemoved );
  }

  function stop() {
    scope.stopListening( model );
  }

  return scope;
}

module.exports = exports = {
  instanceMembers: {
    enableHistory: function() {
      if ( !this.__historyController ) {
        this.__historyController = HistoryController( this );
        this.__historyController.init();
        this.commit = this.__historyController.commit;
      }
      this.__historyController.start();
    },

    disableHistory: function() {
      if ( this.__historyController ) {
        delete this.commit;
        this.__historyController.stop();
      }
    }
  }
};
