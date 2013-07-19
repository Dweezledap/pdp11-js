/**
 * Clock KW11-L
 */

__jsimport( "pdp11/Register.js" ) ;

/**
 *
 */
function Clock( pdp11 ) {
  this.register = new Register( ) ;
  this.pdp11 = pdp11 ;
  this.run( ) ;
}

Clock._INTERVAL = 30000 ; // what is the appropriate number?

Clock._INTERRUPT_VECTOR = 0100 ;
Clock._INTERRUPT_LEVEL = 6 ;

Clock._INTURRUPT_HAPPEN_BIT = 7 ; // unused here?
Clock._ENABLE_INTERRUPT_BIT = 6 ;

Clock.prototype.run = function( ) {
  var self = this ;
  var func = function( ) {
    if( self.register.readBit( Clock._ENABLE_INTERRUPT_BIT ) ) {
      self.pdp11.interrupt( Clock._INTERRUPT_LEVEL, Clock._INTERRUPT_VECTOR ) ;
    }
    setTimeout( func, Clock._INTERVAL ) ;
  } ;
  func( ) ;
} ;


