// import File
// import Util

var ExeHeader = {

  file: null,
  num_type: 16,

  create: function( file ) {
    this.file = file ;
    return this ;
  },

  magic_number: function( ) {
    return this.file.word_data( 0 ) ;
  },

  text_size: function( ) {
    return this.file.word_data( 2 ) ;
  },

  data_size: function( ) {
    return this.file.word_data( 4 ) ;
  },

  bss_size: function( ) {
    return this.file.word_data( 6 ) ;
  },

  symbol_size: function( ) {
    return this.file.word_data( 8 ) ;
  },

  entry_location: function( ) {
    return this.file.word_data( 10 ) ;
  },

  unused: function( ) {
    return this.file.word_data( 12 ) ;
  },

  flag: function( ) {
    return this.file.word_data( 14 ) ;
  },

  string: function( ) {

    var buffer = '' ;

    buffer += 'magic_number   : ' + sprintf( this.num_type, this.magic_number( ), 4 )   + "\n"
           +  'text_size      : ' + sprintf( this.num_type, this.text_size( ), 4 )      + "\n"
           +  'data_size      : ' + sprintf( this.num_type, this.data_size( ), 4 )      + "\n"
           +  'bss_size       : ' + sprintf( this.num_type, this.bss_size( ), 4 )       + "\n"
           +  'symbol_size    : ' + sprintf( this.num_type, this.symbol_size( ), 4 )    + "\n"
           +  'entry_location : ' + sprintf( this.num_type, this.entry_location( ), 4 ) + "\n"
           +  'unused         : ' + sprintf( this.num_type, this.unused( ), 4 )         + "\n"
           +  'flag           : ' + sprintf( this.num_type, this.flag( ), 4 )           + "\n" ;

    return buffer ;

  }

} ;
