var Trace = {

  bb: null,

  create: function( ) {
    this.bb = new WebKitBlobBuilder( ) ;
    return this ;
  },

  append: function( str ) {
    this.bb.append( str ) ;
  },

  getLink: function( ) {
    return window.webkitURL.createObjectURL( this.bb.getBlob( ) ) ;
  }

} ;


var DummyTrace = {

  create: function( ) {
    return this ;
  },

  append: function( str ) {
  },

  getLink: function( ) {
    return '' ;
  }

} ;
