/**
 *
 */

/**
 *
 */
function Memory( ) {
  var buffer = new ArrayBuffer( Memory._CAPACITY ) ;
  this.uint8  = new Uint8Array( buffer ) ;
  this.uint16 = new Uint16Array( buffer ) ;
  this.int16  = new Int16Array( buffer ) ;
}

Memory._CAPACITY = 1024 * 18 * 8 ; // 18KBytes

/**
 * @param address
 * @return 
 */
Memory.prototype.loadWord = function( address ) {
  return this.uint16[ address >> 1 ] ;
} ;

/**
 * @param address
 * @return 
 */
Memory.prototype.loadByte = function( address ) {
  return this.uint8[ address ] ;
} ;


Memory.prototype.storeWord = function( address, value ) {
  this.uint16[ address >> 1 ] = value ;
} ;

Memory.prototype.storeByte = function( address, value ) {
  this.uint8[ address ] = value ;
} ;

Memory.prototype.storeBuffer = function( buffer ) {
  var array = new Uint8Array( buffer ) ;
  for( var i = 0; i < array.byteLength; i++ ) {
    this.uint8[ i ] = array[ i ] ;
  }
} ;
