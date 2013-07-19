// trace must be global.

var OpHandler = {

  mov: function( pdp11, code, width ) {
    var src = pdp11._load( ( code & 0007700 ) >> 6, width ) ;
    var result = src ;

    // temporal
    if( width == Pdp11._WIDTH_BYTE && ( src & 0x80 ) ) {
      result |= 0xff00 ;
    }

    pdp11._store( code & 0000077, width, result ) ;
    pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
    pdp11.psw.setZ( pdp11._isZero( result, width ) ) ;
    pdp11.psw.setV( false ) ;
  },

  cmp: function( pdp11, code, width ) {
    var src = pdp11._load( ( code & 0007700 ) >> 6, width ) ;
    var dst = pdp11._load( code & 0000077, width ) ;
    if( width == Pdp11._WIDTH_WORD ) {
      src = to_int16( src ) ;
      dst = to_int16( dst ) ;
    } else {
      src = to_int8( src ) ;
      dst = to_int8( dst ) ;
    }
    var result = src - dst ;
//    pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
    pdp11.psw.setN( result < 0 ) ;
    pdp11.psw.setZ( pdp11._isZero( result, width ) ) ;
    // copy & paste from toyoshim
    if( width == Pdp11._WIDTH_WORD )
      pdp11.psw.setV( ( ( ( src ^ dst ) & ( ~dst ^ result ) ) >> 15 ) & 1 ) ;
    else
      pdp11.psw.setV( ( ( ( src ^ dst ) & ( ~dst ^ result ) ) >> 7 ) & 1 ) ;

    pdp11.psw.setC( src < dst ) ;
  },

  bit: function( pdp11, code, width ) {
    var src = pdp11._load( ( code & 0007700 ) >> 6, width ) ;
    var dst = pdp11._load( code & 0000077, width ) ;
    var result = src & dst ;
    pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
    pdp11.psw.setZ( result == 0 ? true : false ) ;
    pdp11.psw.setV( false ) ;
  },

  bic: function( pdp11, code, width ) {
    var src = pdp11._load( ( code & 0007700 ) >> 6, width ) ;
    pdp11._loadAndStore( code & 0000077, width, src,
      function( arg1, arg2, pdp11 ) {
        var result = arg1 & ~arg2 ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ? true : false ) ;
        pdp11.psw.setZ( result == 0 ? true : false ) ;
        pdp11.psw.setV( false ) ;
        return result ;
      } ) ;
  },

  bis: function( pdp11, code, width ) {
    var src = pdp11._load( ( code & 0007700 ) >> 6, width ) ;
    pdp11._loadAndStore( code & 0000077, width, src,
      function( arg1, arg2, pdp11 ) {
        var result = arg1 | arg2 ;
        pdp11.psw.setN( pdp11._isNegative( result ) ) ;
        pdp11.psw.setZ( result == 0 ? true : false ) ;
        pdp11.psw.setV( false ) ;
        return result ;
      } ) ;
  },

  clr: function( pdp11, code, width ) {
    pdp11._store( code & 0000077, width, 0 ) ;
    pdp11.psw.setN( false ) ;
    pdp11.psw.setZ( true ) ;
    pdp11.psw.setV( false ) ;
    pdp11.psw.setC( false ) ;
  },

  com: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 0,
      function( arg1, arg2 ) { return ~arg1 ; } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = true ;
  },

  inc: function( pdp11, code, width ) {
    pdp11._loadAndStore( code & 0000077, width, 1,
      function( arg1, arg2, pdp11 ) {
        var result = arg1 + arg2 ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
        pdp11.psw.setZ( result == 0 ? true : false ) ;
        pdp11.psw.setV( false ) ;
        return result ;
      } ) ;
  },

  dec: function( pdp11, code, width ) {
    pdp11._loadAndStore( code & 0000077, width, 1,
      function( arg1, arg2, pdp11 ) {
        var result = arg1 - arg2 ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
        pdp11.psw.setZ( result == 0 ? true : false ) ;
        pdp11.psw.setV( false ) ;
        return result ;
      } ) ;
  },

  neg: function( pdp11, code, width ) {
    pdp11._loadAndStore( code & 0000077, width, -1,
      function( arg1, arg2, pdp11 ) {
        var result = arg1 * arg2 ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
        pdp11.psw.setZ( result == 0 ? true : false ) ;
        pdp11.psw.setV( false ) ;
        return result ;
      } ) ;
  },

  adc: function( pdp11, code, width ) {
    var c = pdp11.psw.getC( ) ? 1 : 0 ;
    pdp11._loadAndStore( code & 0000077, width, c,
      function( arg1, arg2, pdp11 ) {
        var result = arg1 + arg2 ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
        pdp11.psw.setZ( pdp11._isZero( result, width ) ) ;
        pdp11.psw.setV( result == 077777 && arg2 == 1 ) ;
        pdp11.psw.setC( result == 0177777 && arg2 == 1 ) ;
        return result ;
      } ) ;
  },

  sbc: function( pdp11, code, width ) {
    var c = pdp11.psw.getC( ) ? 1 : 0 ;
    pdp11._loadAndStore( code & 0000077, width, c,
      function( arg1, arg2, pdp11 ) {
        var result = arg1 - arg2 ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
        pdp11.psw.setZ( pdp11._isZero( result, width ) ) ;
        pdp11.psw.setV( result == 0100000 ) ;
        pdp11.psw.setC( arg2 == 1 && arg1 == 0 ) ;
        return result ;
      } ) ;
  },

  tst: function( pdp11, code, width ) {
    var result = pdp11._load( code & 0000077, width ) ;
    pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
    pdp11.psw.setZ( pdp11._isZero( result, width ) ) ;
    pdp11.psw.setV( false ) ;
    pdp11.psw.setC( false ) ;
  },

  br: function( pdp11, code ) {
    var des = code & 0377 ;
    pdp11._getPc( ).writeWord( pdp11._getPc( ).readWord( ) + ( to_int8( des ) * 2 ) ) ;
  },

  rol: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, -1,
      function( arg1, arg2 ) {
        return ( ( arg1 << 1 ) | ( ( arg1 & 0x8000 ) >> 15 ) ) & 0xffff ;
      } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = val & 1 ;
    pdp11.ps.v = pdp11.ps.n ^ pdp11.ps.c ;
  },

  ror: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, -1,
      function( arg1, arg2 ) {
        return ( ( arg1 >> 1 ) | ( ( arg1 & 1 ) << 15 ) ) & 0xffff ;
      } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = val & 0x8000 ;
    pdp11.ps.v = pdp11.ps.n ^ pdp11.ps.c ;
  },

  asr: function( pdp11, code, width ) {
    pdp11._loadAndStore( code & 0000077, width, 1,
      function( arg1, arg2, pdp11 ) {
        var result = ( arg1 >> arg2 ) ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
        pdp11.psw.setZ( result == 0 ? true : false ) ;
        pdp11.psw.setC( result & 1 ) ; // not right logic
        pdp11.psw.setV( pdp11.psw.getN( ) ^ pdp11.psw.getC( ) ) ;
        return result ;
      } ) ;
  },

  asl: function( pdp11, code, width ) {
    pdp11._loadAndStore( code & 0000077, width, 1,
      function( arg1, arg2, pdp11 ) {
        var result = ( arg1 << arg2 ) ;
        pdp11.psw.setN( pdp11._isNegative( result, width ) ) ;
        pdp11.psw.setZ( result == 0 ? true : false ) ;
        pdp11.psw.setC( result & 0x8000 ) ; // not right logic
        pdp11.psw.setV( pdp11.psw.getN( ) ^ pdp11.psw.getC( ) ) ;
        return result ;
      } ) ;
  }
} ;
