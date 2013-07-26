function TextAreaView( id ) {
  this.view = window.document.getElementById( id ) ;
  this.clear( ) ;
}

TextAreaView.prototype.output = function( str ) {
  this.view.firstChild.appendData( str ) ;
  this.view.scrollTop = this.view.scrollHeight ;
} ;

TextAreaView.prototype.outputLine = function( str ) {
  this.output( str + '\n' ) ;
} ;

TextAreaView.prototype.clear = function( ) {
  this.view.firstChild.deleteData( 0, this.view.firstChild.nodeValue.length ) ;
} ;

TextAreaView.prototype.focus = function( ) {
  this.view.focus( ) ;
} ;
