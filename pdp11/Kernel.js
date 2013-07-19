// procs must be global.

// import Directory
// import Util
// import ProcFile
// import object

var Kernel = {

  namei: function( path ) {

    // current_dir_i_number and u_dir are global.
    var dir_i_number = path[ 0 ] == '/' ? 1 : current_dir_i_number ;
    u_dir = object( Directory ).create( get_inode( dir_i_number ) ) ;

    var array = path.split( '/' ) ;
    for( var i = 0; i < array.length; i++ ) {

      if( array[ i ] == '' )
        continue ;

      var inode = get_inode( dir_i_number ) ;
      var dir = object( Directory ).create( inode ) ;
      u_dir = dir ;
      u_name = array[ i ] ;
      var match = false ;
      for( var j = 0; j < dir.size( ); j++ ) {
        var e = dir.entry( j ) ;
        if( ! e.i_number )
          continue ;
        var name = e.name ;
        if( name[ name.length - 1 ] == '/' )
          name = name.substr( 0, name.length - 1 ) ;
        if( name == array[ i ] ) {
          dir_i_number = e.i_number ;
          match = true ;
          u_index = j ;
          break ;
        }
      }

      if( ! match )
        return null ;

    }

    return get_inode( dir_i_number ) ;

  },

  falloc: function( proc, inode ) {
    for( var i = 0; i < proc.files.length; i++ ) {
      if( ! proc.files[ i ] ) {
        proc.files[ i ] = object( ProcFile ).create( inode ) ;
        return i ;
      }
    }

    proc.files.push( object( ProcFile ).create( inode ) ) ;
    return proc.files.length - 1 ;
  },

  alloc: function( ) {
    var block_number = superblock.pop_free( ) ;
    superblock.set_fmod( 1 ) ;
    return block_number ;
  },

  free: function( block_number ) {
    superblock.push_free( block_number ) ;
    superblock.set_fmod( 1 ) ;
    // not implemented yet collect block numbers
  },

  ialloc: function( ) {
    if( superblock.ninode( ) > 0 ) {
      superblock.set_fmod( 1 ) ;
      var i_number = superblock.pop_inode( ) ;
      return get_inode( i_number ) ;
    }
    // not implemented yet collect i_numbers
  },

  ifree: function( i_number ) {
    if( superblock.ninode( ) >= 100 )
      return ;
    superblock.push_inode( i_number ) ;
    superblock.set_fmod( 1 ) ;
  },

  maknod: function( mode ) {
    var inode = this.ialloc( ) ;
    this.wdir( inode ) ;
    return inode ;
  },

  makdir: function( mode ) {
    var inode = this.ialloc( ) ;
    inode.set_mode( inode.mode( ) | mode ) ;
    this.wdir( inode ) ;
    return inode ;
  },

  // not implemented yet
  wdir: function( inode ) {
    u_dir.add_entry( inode.i_number ) ;
  },

  // proc is a process that will sleep
  swtch: function( proc ) {

    var regs = regs_queue.shift( ) ;
    var ps   = ps_queue.shift( ) ;
    var p    = proc_queue.shift( ) ;

    if( ! proc.exit_flag ) {
      pdp11.regs[ 1 ].set( 0 ) ;
      pdp11.regs[ 0 ].set( 1 ) ;
      proc_queue.unshift( proc.copy( ) ) ;
      regs_queue.unshift( pdp11.getRegsAsArray( ) ) ;
      ps_queue.unshift( pdp11.getPSAsHashArray( ) ) ;
    }

    proc.read( p ) ;
    pdp11.loadRegs( regs ) ;
    pdp11.loadPS( ps ) ;

  },

  // proc is a parent process.
  newproc: function( proc ) {
    var p    = proc.copy( ) ;
    var regs = pdp11.getRegsAsArray( ) ;
    var ps   = pdp11.getPSAsHashArray( ) ;

    regs[ 0 ] = 0 ;

    proc_queue.unshift( p ) ;
    regs_queue.unshift( regs ) ;
    ps_queue.unshift( ps ) ;
  }

} ;
