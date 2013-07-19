// import Inode

var ProcFile = {

  offsetr: 0,
  offsetw: 0,
  inode: null,

  create: function( inode ) {
    this.inode = inode ;
    this.offsetr = 0 ;
    this.offsetw = 0 ;
    return this ;
  }

} ;
