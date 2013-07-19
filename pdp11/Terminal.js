/**
 * Terminal
 */

__jsimport( "pdp11/Register.js" ) ;

/**
 *
 */
function Terminal( pdp11 ) {
  this.rsr = new Register( ) ;
  this.rbr = new Register( ) ;
  this.xsr = new Register( ) ;
  this.xbr = new Register( ) ;
  this.xsr.writeBit( Terminal._XSR_DONE_BIT, true ) ;
  this.pdp11 = pdp11 ;
  this.display = __displayview ;
  this.run( ) ;
}

Terminal._INTERVAL = 0 ;

Terminal._RSR_BUSY_BIT = 11 ;
Terminal._RSR_DONE_BIT = 7 ;
Terminal._RSR_ENABLE_INTERRUPT_BIT = 6 ;
Terminal._RSR_READY_BIT = 0 ;
Terminal._INPUT_INTERRUPT_VECTOR = 060 ;
Terminal._INPUT_INTERRUPT_LEVEL = 4 ;

Terminal._XSR_DONE_BIT = 7 ;
Terminal._XSR_ENABLE_INTERRUPT_BIT = 6 ;
Terminal._OUTPUT_INTERRUPT_VECTOR = 064 ;
Terminal._OUTPUT_INTERRUPT_LEVEL = 4 ;

Terminal.prototype.run = function( ) {
  var self = this ;
  var func = function( ) {
    if( self.xbr.readWord( ) /* && ! self.xsr.readBit( Terminal._XSR_DONE_BIT ) */ ) {
      console.log( 'term:' + format( self.xbr.readWord( ) & 0x7f ) + ':' + 
                   String.fromCharCode( self.xbr.readWord( ) & 0x7f ) ) ;
      if( self.xbr.readWord( ) != 0177 && self.xbr.readWord( ) != 0xd ) // temporal
        self.display.innerHTML += String.fromCharCode( self.xbr.readWord( ) & 0x7f ) ;
      self.xsr.writeBit( Terminal._XSR_DONE_BIT, true ) ;
      self.xbr.writeWord( 0 ) ;
      if( self.xsr.readBit( Terminal._XSR_ENABLE_INTERRUPT_BIT ) ) {
        self.pdp11.interrupt( Terminal._OUTPUT_INTERRUPT_LEVEL, Terminal._OUTPUT_INTERRUPT_VECTOR ) ;
      }
    }
    setTimeout( func, Terminal._INTERVAL ) ;
  } ;
  func( ) ;
} ;

Terminal.prototype.input = function( ascii ) {
  this.rbr.writeWord( ascii & 0x7f ) ;
  if( this.rsr.readBit( Terminal._RSR_ENABLE_INTERRUPT_BIT ) ) {
    this.pdp11.interrupt( Terminal._INPUT_INTERRUPT_LEVEL, Terminal._INPUT_INTERRUPT_VECTOR ) ;
  }
//  if( this.rsr.readBit( Terminal._RSR_READY_BIT ) ) {
//    this.rsr.writeBit( Terminal._RSR_DONE_BIT, false ) ;
//  }
//  if( this.rsr.readBit( Terminal._RSR_DONE_BIT ) &&
//      this.rsr.readBit( Terminal._RSR_ENABLE_INTERRUPT_BIT ) ) {
//    this.pdp11.interrupt( Terminal._INPUT_INTERRUPT_LEVEL, Terminal._INPUT_INTERRUPT_VECTOR ) ;
//  }
} ;
