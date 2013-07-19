var DirectoryEntry = {

  i_number: 0,
  name: '',
  is_dir: false,

  create: function( i_number, name, is_dir ) {
    this.i_number = i_number ;
    this.name = name ;
    this.is_dir = is_dir ;
    return this ;
  },

  empty: function( ) {
    return ( ! this.i_number ) ? true : false ;
  },

  is_relative: function( ) {
    return ( this.name == '.' || this.name == '..' ) ? true : false ;
  },

  get_displayed_name: function( ) {
    if( this.is_dir )
      return this.name + '/' ;
    return this.name ;
  }

} ;
