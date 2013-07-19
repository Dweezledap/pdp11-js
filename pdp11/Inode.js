// import BinData
// import Util

var Inode = {

  i_number: 0,
  bin_data: null,
  num_type: 16,

  /**
   * constructor
   * @param {integer} i_number
   * @param {BinData} bin_data
   */
  create: function( i_number, bin_data ) {
    this.i_number = i_number ;
    this.bin_data = bin_data ;
    return this ;
  },

  block_no: function( ) {
    return parseInt( ( this.i_number + 31 ) / 16 ) ;
  },

  offset: function( ) {
    return 32 * ( ( this.i_number + 31 ) % 16 ) ;
  },

  address: function( pos ) {
    return ( this.block_no( ) * 512 ) + this.offset( ) + pos ;
  },

  mode: function( ) {
    return this.bin_data.word( this.address( 0 ) ) ;
  },

  set_mode: function( value ) {
    this.bin_data.set_word( this.address( 0 ), value ) ;
  },

  nlink: function( ) {
    return this.bin_data.byte( this.address( 2 ) ) ;
  },

  uid: function( ) {
    return this.bin_data.byte( this.address( 3 ) ) ;
  },

  gid: function( ) {
    return this.bin_data.byte( this.address( 4 ) ) ;
  },

  size0: function( ) {
    return this.bin_data.byte( this.address( 5 ) ) ;
  },

  size1: function( ) {
    return this.bin_data.word( this.address( 6 ) ) ;
  },

  size: function( ) {
    return ( this.size0( ) << 16 ) + this.size1( ) ;
  },

  set_size: function( size ) {
    this.bin_data.set_byte( this.address( 5 ), ( size & 0xff0000 ) >> 16 ) ;
    this.bin_data.set_word( this.address( 6 ), size & 0xffff ) ;
  },

  addr: function( index ) {
    return this.bin_data.wordAsInt( this.address( 8 + index * 2 ) ) ;
  },

  set_addr: function( index, value ) {
    this.bin_data.set_wordAsInt( this.address( 8 + index * 2 ), value ) ;
  },

  atime: function( index ) {
    return this.bin_data.wordAsInt( this.address( 24 + index * 2 ) ) ;
  },

  atimeString: function( ) {
    var d = new Date( ) ;
    d.setTime( ( ( this.atime( 0 ) << 16 ) + this.atime( 1 ) ) * 1000 ) ;
    return d.getMonth( ) + '/' + d.getDate( )    + '/' + d.getFullYear( ) + ' ' +
           d.getHours( ) + ':' + d.getMinutes( ) + ':' + d.getSeconds( ) ;
  },

  mtime: function( index ) {
    return this.bin_data.wordAsInt( this.address( 28 + index * 2 ) ) ;
  },

  mtimeString: function( ) {
    var d = new Date( ) ;
    d.setTime( ( ( this.mtime( 0 ) << 16 ) + this.mtime( 1 ) ) * 1000 ) ;
    return d.getMonth( ) + '/' + d.getDate( )    + '/' + d.getFullYear( ) + ' ' +
           d.getHours( ) + ':' + d.getMinutes( ) + ':' + d.getSeconds( ) ;
  },

  is_IALLOC: function( ) {
    return this.mode( ) & 32768 ;
  },

/*
  is_IFMT: function( ) {
    return this.mode( ) & 24576 ;
  },

  is_IFBLK: function( ) {
    return this.mode( ) & 24576 ;
  },
*/
  is_IFDIR: function( ) {
    return this.mode( ) & 16384 ;
  },

  is_IFCHR: function( ) {
    return this.mode( ) & 8192 ;
  },

  is_ILARG: function( ) {
    return this.mode( ) & 4096 ;
  },

  is_ISUID: function( ) {
    return this.mode( ) & 2048 ;
  },

  is_ISGID: function( ) {
    return this.mode( ) & 1024 ;
  },

  is_ISVTX: function( ) {
    return this.mode( ) & 512 ;
  },

  is_IREAD: function( ) {
    return this.mode( ) & 256 ;
  },

  is_IWRITE: function( ) {
    return this.mode( ) & 128 ;
  },

  is_IEXEC: function( ) {
    return this.mode( ) & 64 ;
  },

  // TODO : validate pos
  data_addr: function( pos ) {

    var block_no = 0 ;

    if( ! this.is_ILARG( ) ) {
      block_no = this.addr( parseInt( pos / 512 ) ) ;
    } else {
      if( pos < 512 * 256 * 7 ) {
        block_no = this.addr( parseInt( pos / ( 512 * 256 ) ) ) ;
      } else {
        block_no = this.addr( 7 ) ;
        block_no = this.bin_data.word( block_no * 512 + parseInt( ( pos % ( 512 * 256 * 256 ) ) / ( 512 * 256 ) ) * 2 ) ;
      }
      block_no = this.bin_data.word( block_no * 512 + parseInt( ( pos % ( 512 * 256 ) ) / 512 ) * 2 ) ;
    }

    return block_no * 512 + pos % 512 ;

  },

  byte_data: function( pos ) {
    return this.bin_data.byte( this.data_addr( pos ) ) ;
  },

  set_byte_data: function( pos, value ) {
    this.bin_data.set_byte( this.data_addr( pos ), value ) ;
  },

  word_data: function( pos ) {
    return this.bin_data.word( this.data_addr( pos ) ) ;
  },

  set_word_data: function( pos, value ) {
    this.bin_data.set_word( this.data_addr( pos ), value ) ;
  },

  string: function( ) {

    var buffer = '' ;

    buffer += 'inode No : ' + sprintf( this.num_type, this.i_number, 4 ) + "\n" ;
    buffer += 'i_mode  : '  + sprintf( this.num_type, this.mode( ), 4 ) + " -" ;
    if( this.is_IALLOC( ) )
      buffer += ' IALLOC' ;
//  if( this.is_IFMT( ) )
//    buffer += ' IFMT' ;
//  if( this.is_IFBLK( ) )
//    buffer += ' IFBLK' ;
    if( this.is_IFDIR( ) )
      buffer += ' IFDIR' ;
    if( this.is_IFCHR( ) )
      buffer += ' IFCHR' ;
    if( this.is_ILARG( ) )
      buffer += ' ILARG' ;
    if( this.is_ISUID( ) )
      buffer += ' ISUID' ;
    if( this.is_ISGID( ) )
      buffer += ' ISGID' ;
    if( this.is_ISVTX( ) )
      buffer += ' ISVTX' ;
    if( this.is_IREAD( ) )
      buffer += ' IREAD' ;
    if( this.is_IWRITE( ) )
      buffer += ' IWRITE' ;
    if( this.is_IEXEC( ) )
      buffer += ' IEXEC' ;
    buffer += "\n" ;

    buffer += 'i_nlink : ' + sprintf( this.num_type, this.nlink( ), 2 ) + "\n" ;
    buffer += 'i_uid   : ' + sprintf( this.num_type, this.uid( ), 2 ) + "\n" ;
    buffer += 'i_gid   : ' + sprintf( this.num_type, this.gid( ), 2 ) + "\n" ;
    buffer += 'i_size0 : ' + sprintf( this.num_type, this.size0( ), 2 ) + "\n" ;
    buffer += 'i_size1 : ' + sprintf( this.num_type, this.size1( ), 4 ) + "\n" ;
    buffer += 'i_size  : ' + sprintf( this.num_type, this.size( ), 6 ) + "\n" ;
    for( var i = 0; i < 8; i++ )
      buffer += 'i_addr[' + i + '] : ' + sprintf( this.num_type, this.addr( i ), 4 ) + "\n" ;
    for( var i = 0; i < 2; i++ )
      buffer += 'i_atime[' + i + '] : ' + sprintf( this.num_type, this.atime( i ), 4 ) + "\n" ;
    buffer += 'i_atime : ' + this.atimeString( ) + "\n" ;
    for( var i = 0; i < 2; i++ )
      buffer += 'i_mtime[' + i + '] : ' + sprintf( this.num_type, this.mtime( i ), 4 ) + "\n" ;
    buffer += 'i_mtime : ' + this.mtimeString( ) + "\n" ;

    return buffer ;

  }

} ;

