// import BinData
// import Util

var Filsys = {

  bin_data: null,
  num_type: 16,

  /**
   * constructor
   *
   * @param {BinData} bin_data
   */
  create: function( bin_data ) {
    this.bin_data = bin_data ;
    return this ;
  },

  isize: function( ) {
    return this.bin_data.wordAsInt( 512 ) ;
  },

  fsize: function( ) {
    return this.bin_data.wordAsInt( 514 ) ;
  },

  nfree: function( ) {
    return this.bin_data.wordAsInt( 516 ) ;
  },

  increment_nfree: function( ) {
    this.bin_data.set_wordAsInt( 516, this.nfree( ) + 1 ) ;
  },

  decrement_nfree: function( ) {
    this.bin_data.set_wordAsInt( 516, this.nfree( ) - 1 ) ;
  },

  free: function( i ) {
    return this.bin_data.wordAsInt( 518 + i * 2 ) ;
  },

  set_free: function( i, block_number ) {
    this.bin_data.set_wordAsInt( 518 + i * 2, block_number ) ;
  },

  push_free: function( block_number ) {
    this.set_free( this.nfree( ), block_number ) ;
    this.increment_nfree( ) ;
  },

  pop_free: function( ) {
    this.decrement_nfree( ) ;
    return this.free( this.nfree( ) ) ;
  },

  ninode: function( ) {
    return this.bin_data.wordAsInt( 718 ) ;
  },

  increment_ninode: function( ) {
    this.bin_data.set_wordAsInt( 718, this.ninode( ) + 1 ) ;
  },

  decrement_ninode: function( ) {
    this.bin_data.set_wordAsInt( 718, this.ninode( ) - 1 ) ;
  },

  inode: function( i ) {
    return this.bin_data.wordAsInt( 720 + i * 2 ) ;
  },

  set_inode: function( i, i_number ) {
    this.bin_data.set_wordAsInt( 720 + i * 2, i_number ) ;
  },

  push_inode: function( i_number ) {
    this.set_inode( this.ninode( ), i_number ) ;
    this.increment_ninode( ) ;
  },

  pop_inode: function( ) {
    this.decrement_ninode( ) ;
    return this.inode( this.ninode( ) ) ;
  },

  flock: function( ) {
    return this.bin_data.byte( 920 ) ;
  },

  ilock: function( ) {
    return this.bin_data.byte( 921 ) ;
  },

  fmod: function( ) {
    return this.bin_data.byte( 922 ) ;
  },

  set_fmod: function( val ) {
    return this.bin_data.set_byte( 922, val ) ;
  },

  ronly: function( ) {
    return this.bin_data.byte( 923 ) ;
  },

  time: function( i ) {
    return this.bin_data.wordAsInt( 924 + i * 2 ) ;
  },

  timeString: function( ) {
    var d = new Date( ) ;
    d.setTime( ( ( this.time( 0 ) << 16 ) + this.time( 1 ) ) * 1000 ) ;
    return d.getMonth( ) + '/' + d.getDate( )    + '/' + d.getFullYear( ) + ' ' +
           d.getHours( ) + ':' + d.getMinutes( ) + ':' + d.getSeconds( ) ;
  },

  string: function( ) {

    var buffer = '' ;
    buffer += "s_isize : " + sprintf( this.num_type, this.isize( ), 4 ) + "\n" ;
    buffer += "s_fsize : " + sprintf( this.num_type, this.fsize( ), 4 ) + "\n" ;
    buffer += "s_nfree : " + sprintf( this.num_type, this.nfree( ), 4 ) + "\n" ;
    for( var i = 0; i < 100; i++ )
      buffer += "s_free[" + i + "] : " + sprintf( this.num_type, this.free( i ), 4 ) + "\n" ;
    buffer += "s_ninode   : " + sprintf( this.num_type, this.ninode( ), 4 ) + "\n" ;
    for( var i = 0; i < 100; i++ )
      buffer += "s_inode[" + i + "] : " + sprintf( this.num_type, this.inode( i ), 4 ) + "\n" ;
    buffer += "s_flock : " + sprintf( this.num_type, this.flock( ), 2 ) + "\n" ;
    buffer += "s_ilock : " + sprintf( this.num_type, this.ilock( ), 2 ) + "\n" ;
    buffer += "s_fmod  : " + sprintf( this.num_type, this.fmod( ), 2 ) + "\n" ;
    buffer += "s_ronly : " + sprintf( this.num_type, this.ronly( ), 2 ) + "\n" ;
    for( var i = 0; i < 2; i++ )
      buffer += "s_time[" + i + "] : " + sprintf( this.num_type, this.time( i ), 4 ) + "\n" ;
    buffer += "s_time  : " + this.timeString( ) + "\n" ;

    return buffer ;

  }

} ;
