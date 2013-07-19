// import Inode
// import Util
// import object

var Directory = {

  inode: null,
  num_type: 16,

  create: function( inode ) {
    this.inode = inode ;
    return this ;
  },

  size: function( ) {
    return parseInt( this.inode.size( ) / 16 ) ;
  },

  entry: function( index ) {

    var i_number = this.inode.word_data( index * 16 ) ;

    var name = '' ;
    for( var i = 0; i < 14; i++ ) {
      var tmp = this.inode.byte_data( index * 16 + 2 + i ) ;
      if( tmp == 0 ) {
        break ;
      }
      var str = String.fromCharCode( tmp ) ;
      name += str ;
    }

    var is_dir = false ;
    if( i_number > 0 && get_inode( i_number ).is_IFDIR( ) )
      is_dir = true ;

    var entry = object( DirectoryEntry ).create( i_number, name, is_dir ) ;
    return entry ;

  },

  add_entry: function( i_number ) {
    
    var index = 0 ;
    for( var i = 0; i < this.size( ); i++ ) {
      var e = this.entry( i ) ;
      if( ! e.i_number ) {
        index = i ;
        break ;
      }
    }
    if( ! index ) {
      index = this.size( ) ;
      this.inode.set_size( this.inode.size( ) + 16 ) ;
    }
    this.inode.set_word_data( index * 16, i_number ) ;
    for( var i = 0; i < 14; i++ ) {
      // u.name is global. set at namei( )
      if( i < u_name.length )
        this.inode.set_byte_data( index * 16 + 2 + i, u_name.charCodeAt( i ) ) ;
      else
        this.inode.set_byte_data( index * 16 + 2 + i, 0 ) ;
    }

  },

  remove_entry: function( index ) {

    this.inode.set_word_data( index * 16, 0 ) ;
    if( index == this.size( ) ) {
      this.inode.set_size( this.inode.size( ) - 16 ) ;
    }

  },

  string: function( ) {
    var buffer = '' ;
    for( var i = 0; i < this.size( ); i++ ) {
      var entry = this.entry( i ) ;
      if( entry.empty( ) )
        continue ;

      buffer += sprintf( this.num_type, entry.i_number, 4 ) + ' : ' + entry.name + "\n" ;
    }
    return buffer ;
  }

} ;
