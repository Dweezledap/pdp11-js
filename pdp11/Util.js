// import BinData
// import Inode
// import object

function format( num ) {
  return sprintf( __num_format, num, __num_digit ) ;
}

/**
 * @param {Integer} type bin->2, oct->8, degit->10, hex->16
 * @param {Integer} num
 * @param {Integer} figures
 */
function sprintf( type, num, figure ) {

  var base = '' ;
  var prefix = ''
  var minus = '' ;

  if( type == 8 )
    prefix = '0' ;
  else if( type == 16 )
    prefix = '0x' ;

  for( var i = 0; i < figure; i++ )
    base += '0' ;

  return prefix + ( base + num.toString( type ) ).substr( -1 * figure ) ;

}

/**
 * get Inode
 * @param {Integer} i_number
 */
function get_inode( i_number ) {
  // bin_data must be global.
  return object( Inode ).create( i_number, bin_data ) ;
}

function to_int16( uint16 ) {
  var buffer = new ArrayBuffer( 2 ) ;
  var int16 = new Int16Array( buffer ) ;
  int16[ 0 ] = uint16 ;
  return int16[ 0 ] ;
}

function to_int8( uint8 ) {
  var buffer = new ArrayBuffer( 1 ) ;
  var int8 = new Int8Array( buffer ) ;
  int8[ 0 ] = uint8 ;
  return int8[ 0 ] ;
}

function to_uint16( int16 ) {
  var buffer = new ArrayBuffer( 2 ) ;
  var uint16 = new Uint16Array( buffer ) ;
  uint16[ 0 ] = int16 ;
  return uint16[ 0 ] ;
}

function to_uint8( int8 ) {
  var buffer = new ArrayBuffer( 1 ) ;
  var uint8 = new Uint8Array( buffer ) ;
  uint8[ 0 ] = int8 ;
  return uint8[ 0 ] ;
}

function clone( obj ) {
  var o = new Object( ) ;
  for( var prop in obj ) {
    o[ prop ] = obj[ prop ] ;
  }
  return o ;
}

