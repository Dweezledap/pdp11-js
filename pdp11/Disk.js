/**
 * Disk
 */

__jsimport( "pdp11/Register.js" ) ;

/**
 *
 */
function Disk( pdp11 ) {
  this.pdp11 = pdp11 ;
  this.rkds = new Register( ) ;
  this.rker = new Register( ) ;
  this.rkcs = new Register( ) ;
  this.rkwc = new Register( ) ;
  this.rkba = new Register( ) ;
  this.rkda = new Register( ) ;
  this.rkdb = new Register( ) ;
  this.rkcs.writeWord( 0x80 ) ;

  var buffer = new ArrayBuffer( Disk._CAPACITY ) ;
  this.uint8  = new Uint8Array( buffer ) ;
  this.uint16 = new Uint16Array( buffer ) ;
  this.int16  = new Int16Array( buffer ) ;

  this.run( ) ;
}

Disk._CAPACITY = 512 * 4800 * 8 ; // 512bytes x 4800records x 8drives
Disk._INTERVAL = 10000 ;
Disk._INTERRUPT_LEVEL = 5 ;
Disk._INTERRUPT_VECTOR = 0220 ;

Disk._COMMAND_READ  = 02 ;
Disk._COMMAND_WRITE = 01 ;

Disk._RKDA_DRIVE_BIT    = 13 ;
Disk._RKDA_CYLINDER_BIT = 5 ;
Disk._RKDA_SIDE_BIT     = 4 ;
Disk._RKDA_SECTOR_BIT   = 0 ;

Disk._RKDA_DRIVE_MASK    = 0x7 ;
Disk._RKDA_CYLINDER_MASK = 0xff ;
Disk._RKDA_SIDE_MASK     = 0x1 ;
Disk._RKDA_SECTOR_MASK   = 0xf ;

Disk._RKCS_COMMAND_BIT  = 1 ;
Disk._RKCS_COMMAND_MASK = 0x7 ;

Disk.prototype.run = function( ) {
  var self = this ;  var func = function( ) { // TODO: not implemented yet.
    if( self._go( ) ) {
      switch( self._getCommand( ) ) {
        case Disk._COMMAND_READ:
          self._runLoad( ) ;
          break ;
        case Disk._COMMAND_WRITE:
          self._runStore( ) ;
          break ;
        default:
          throw new Error( "not implemented yet." ) ;
          break ;
      }
      self.rkcs.writeWord( 0x80 ) ; // TODO: error check?
      self.pdp11.interrupt( Disk._INTERRUPT_LEVEL, Disk._INTERRUPT_VECTOR ) ;
    }
    setTimeout( func, Disk._INTERVAL ) ;
  } ;
  func( ) ;
} ;

Disk.prototype._getCommand = function( ) {
  return this.rkcs.readPartial( Disk._RKCS_COMMAND_BIT, Disk._RKCS_COMMAND_MASK ) ;
} ;

Disk.prototype._go = function( ) {
  return this.rkcs.readWord( ) & 1 ;
} ;

Disk.prototype._calculateDiskAddress = function( ) {
  var driveNum = this.rkda.readPartial( Disk._RKDA_DRIVE_BIT, Disk._RKDA_DRIVE_MASK ) ;
  var cylinderNum = this.rkda.readPartial( Disk._RKDA_CYLINDER_BIT, Disk._RKDA_CYLINDER_MASK ) ;
  var side = this.rkda.readPartial( Disk._RKDA_SIDE_BIT, Disk._RKDA_SIDE_MASK ) ;
  var sectorNum = this.rkda.readPartial( Disk._RKDA_SECTOR_BIT, Disk._RKDA_SECTOR_MASK ) ;

  return ( driveNum * 4800 + cylinderNum * 24 + side * 12 + sectorNum ) * 512 ;
} ;

Disk.prototype._calculateMemoryAddress = function( ) {
  return this.rkba.readWord( ) ;
} ;

Disk.prototype._getWordCount = function( ) {
  return to_int16( this.rkwc.readWord( ) * -1 ) ;
} ;

Disk.prototype._runLoad = function( ) {
  __logger.log( this._dump( ) ) ;
  for( var i = 0; i < this._getWordCount( ); i++ ) {
    __logger.log( "disk:" + format( this._calculateDiskAddress( ) + i * 2 ) +
                  " -> " + format( this._loadWord( this._calculateDiskAddress( ) + i * 2 ) ) + " -> " +
                  "memory:" + format( this._calculateMemoryAddress( ) + i * 2 ) ) ;
    this.pdp11.mmu.storeWordByPhysicalAddress(
      this._calculateMemoryAddress( ) + i * 2,
      this._loadWord( this._calculateDiskAddress( ) + i * 2 ) ) ;
  }
} ;

Disk.prototype._runStore = function( ) {
  __logger.log( this._dump( ) ) ;
  for( var i = 0; i < this._getWordCount( ); i++ ) {
    __logger.log( "disk:" + format( this._calculateDiskAddress( ) + i * 2 ) +
                  " <- " + format( this.pdp11.mmu.loadWordByPhysicalAddress( this._calculateMemoryAddress( ) + i * 2 ) ) + " <- " +
                  "memory:" + format( this._calculateMemoryAddress( ) + i * 2 ) ) ;
    this._storeWord(
      this._calculateDiskAddress( ) + i * 2,
      this.pdp11.mmu.loadWordByPhysicalAddress( this._calculateMemoryAddress( ) + i * 2 ) ) ;
  }
} ;

Disk.prototype.storeBuffer = function( buffer ) {
  var array = new Uint8Array( buffer ) ;
  for( var i = 0; i < array.byteLength; i++ ) {
    this.uint8[ i ] = array[ i ] ;
  }
} ;

Disk.prototype._loadWord = function( address ) {
  return this.uint16[ address >> 1 ] ;
} ;

Disk.prototype._storeWord = function( address, value ) {
  this.uint16[ address >> 1 ] = value ;
} ;

Disk.prototype._dump = function( ) {
  buffer = '' ;
  buffer +=   "rkds:" + format( this.rkds.readWord( ) ) ;
  buffer += ", rker:" + format( this.rker.readWord( ) ) ;
  buffer += ", rkcs:" + format( this.rkcs.readWord( ) ) ;
  buffer += ", rkwc:" + format( this.rkwc.readWord( ) ) + "(" + this._getWordCount( ) + ")" ;
  buffer += ", rkba:" + format( this.rkba.readWord( ) ) ;
  buffer += ", rkda:" + format( this.rkda.readWord( ) ) + "(" + this._calculateDiskAddress( ) + ")" ;
  buffer += ", rkdb:" + format( this.rkdb.readWord( ) ) ;
  return buffer ;
}

