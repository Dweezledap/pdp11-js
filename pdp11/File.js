// import Inode
// import Util

var File = {

  inode: null,
  type_num: 16,

  create: function( inode ) {
    this.inode = inode ;
    return this ;
  },

  size: function( ) {
    return this.inode.size( ) ;
  },

  byte_data: function( pos ) {
    return this.inode.byte_data( pos ) ;
  },

  set_byte_data: function( pos, value ) {
    this.inode.set_byte_data( pos, value ) ;
  },

  word_data: function( pos ) {
    return this.inode.word_data( pos ) ;
  },

  binary_data: function( ) {
    var buffer = '' ;
    for( var i = 0; i < this.size( ); i++ ) {
      if( i % 16 == 0 )
        buffer += sprintf( this.type_num, i, 5 ) ;
      buffer += ' ' + sprintf( this.type_num, this.byte_data( i ), 2 ).substr( -2 ) ;
      if( i % 16 == 15 )
        buffer += "\n" ;
    }
    if( i % 16 != 0 )
      buffer += "\n" ;
    return buffer ;
  },

  isExe: function( ) {

    if( this.inode.is_IFDIR( ) )
      return false ;

    var exe = object( Exe ).create( this ) ;
    switch( exe.header.magic_number( ) ) {

      case 0407:
      case 0410:
      case 0411:
        return true ;

      default:
        return false ;

    }

  },

  string: function( ) {
    var buffer = '' ;
    for( var i = 0; i < this.size( ); i++ ) {
      buffer += String.fromCharCode( this.byte_data( i ) ) ;
    }
    return buffer ;
  },

  buffer: function( ) {
    var buffer = new ArrayBuffer( this.size( ) - 0x10 ) ;
    var array = new Uint8Array( buffer ) ;
    for( var i = 0; i < this.size( ) - 0x10; i++ ) {
      array[ i ] = this.byte_data( i + 0x10 ) ;
    }
    return array.buffer ;
  }

} ;
