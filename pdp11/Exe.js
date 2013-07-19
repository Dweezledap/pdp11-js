// import File
// import ExeHeader
// import Executor
// import Disassembler
// import object

var Exe = {

  file: null,
  header: null,

  create: function( file ) {
    this.file = file ;
    this.header = object( ExeHeader ).create( file ) ;
    return this ;
  },

  disassemble: function( ) {
    var dis = object( Disassembler ).create( this ) ;
    return this.header.string( )
             + "\n"
             + ".text\n"
             + dis.run( ) ;
  },

  text_address: function( ) {
    return 0x10 ;
  },

  data_address: function( ) {
    return this.text_address( ) + this.header.text_size( ) ;
  },

  // when no relocations
  symbol_address: function( ) {
    return this.data_address( ) + this.header.data_size( ) ;
  },

  end_address: function( ) {
    return this.symbol_address( ) + this.header.symbol_size( ) ;
  },

  symbols: function( ) {
    var array = [ ] ;
    var symbols = { } ;

    for( var i = this.symbol_address( ); i < this.end_address( ); i += 12 ) {

      var name = '' ;
      for( var j = 0; j < 12; j++ ) {
        var tmp = this.file.byte_data( i + j ) ;
        if( tmp == 0 )
          break ;
        name += String.fromCharCode( tmp ) ;
      }

      var type = this.file.word_data( i + 8 ) ;
      var address = this.file.word_data( i + 10 ) ;
      symbols[ name ] = address ;

    }

    return symbols ;
  },

  // TODO: confirm
  buffer: function( ) {
    var size = this.data_address( ) - this.text_address( ) ;
    size += this.symbol_address( ) - this.data_address( ) ;

    var buffer = new ArrayBuffer( size ) ;
    var array = new Uint8Array( buffer ) ;
    var pos = 0 ;
    for( var i = this.text_address( ); i < this.data_address( ); i++ ) {
      array[ pos ] = this.file.byte_data( i ) ;
      pos++ ;
    }
    for( var i = this.data_address( ); i < this.symbol_address( ); i++ ) {
      array[ pos ] = this.file.byte_data( i ) ;
      pos++ ;
    }
    return array.buffer ;
  }

} ;
