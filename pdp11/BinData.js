var BinData = {

  uint8_array: null,
  uint16_array: null,
  int16_array: null,

  /**
   * constructor
   *
   * @param {ArrayBuffer} buffer
   */
  create: function( buffer ) {
    this.uint8_array = new Uint8Array( buffer ) ;
    this.uint16_array = new Uint16Array( buffer ) ;
    this.int16_array = new Int16Array( buffer ) ;
    return this ;
  },

  byte: function( pos ) {
    return this.uint8_array[ pos ] ;
  },

  set_byte: function( pos, value ) {
    this.uint8_array[ pos ] = value ;
  },

  word: function( pos ) {
    return this.uint16_array[ pos >> 1 ] ;
  },

  set_word: function( pos, value ) {
    this.uint16_array[ pos >> 1 ] = value ;
  },

  wordAsInt: function( pos ) {
    return this.int16_array[ pos >> 1 ] ;
  },

  set_wordAsInt: function( pos, value ) {
    this.int16_array[ pos >> 1 ] = value ;
  }

} ;
