// this class is static.
var Processor = {

  WORD : 0x01,
  BYTE : 0x02,

  /**
   * @param
   * @return
   */
  // return 16bits value because it's address
  getAddr: function( num, pdp11, ahead, width ) {

    var reg_num = num & 07 ;
    var reg     = pdp11.get_reg( reg_num ) ;
    var type    = ( num & 070 ) >> 3 ;

    switch( type ) {

      case 0: // illegal?
        return reg_num ;

      case 1:
        if( reg_num == 7 )
          return reg.get_word( ) + 2 ;
        return reg.get_word( ) ;

      case 2:
        if( reg_num == 7 ) {
          pdp11.nextStep( ) ;
          var val = ahead.shift( ) ;
          return val ;
        }
        var value = reg.get_word( ) ;
        if( reg_num == 7 )
          value += 2 ;
        if( width == Processor.WORD || reg_num == 6 ) {
          reg.increment( ) ;
        } else {
          reg.set( reg.get( ) + 1 ) ;
        }
        return value ;

      case 3:
        if( reg_num == 7 ) {
          pdp11.nextStep( ) ;
//          var val = ahead.shift( ) - 2 ;
          var val = ahead.shift( ) ;
          return val ;
        }
        var value = pdp11.mmu.load_word( reg.get_word( ) ) ;
        if( reg_num == 7 )
          value += 2 ;
        if( width == Processor.WORD || reg_num == 6 ) {
          reg.increment( ) ;
        } else {
          reg.set( reg.get( ) + 1 ) ;
        }
        return value ;

      // is this logic right if width != Processor.WORD ?
      case 4:
        if( width == Processor.WORD || reg_num == 6 )
          reg.decrement( ) ;
        else
          reg.set( reg.get( ) - 1 ) ;
        return reg.get_word( ) ;

      // is this logic right if width != Processor.WORD ?
      case 5:
        if( width == Processor.WORD || reg_num == 6 )
          reg.decrement( ) ;
        else
          reg.set( reg.get( ) - 1 ) ;
        var val = pdp11.mmu.load_word( reg.get_word( ) ) ;
        return val ;

      case 6:
        pdp11.nextStep( ) ;
        if( reg_num == 7 ) {
          var val = pdp11.get_reg( 7 ).get_word( ) + ahead.shift( ) + 2 ;
          return val ;
        }
        var val = ahead.shift( ) ;
        return reg.get_word( ) + val ;

      case 7:
        pdp11.nextStep( ) ;
        if( reg_num == 7 ) {
          var val = pdp11.get_reg( 7 ).get_word( ) + ahead.shift( ) + 2 ;
          return pdp11.mmu.load_word( val ) ;
        }
        var val = pdp11.mmu.load_word( reg.get_word( ) + ahead.shift( ) ) ;
        return val ;

      default:
        break ;

    }

  },

  getReg: function( num, pdp11, ahead, width ) {

    var reg_num = num & 07 ;
    var reg     = pdp11.get_reg( reg_num ) ;
    var type    = ( num & 070 ) >> 3 ;

    switch( type ) {

      case 0:
        var addr = this.getAddr( num, pdp11, ahead, width ) ;
        if( width == Processor.WORD )
          return reg.get_word( ) ;
        return reg.get_byte( ) ;

      case 2:
      case 3:
        if( reg_num == 7 ) {
          return this.getAddr( num, pdp11, ahead, width ) ;
        }

      case 1:
      case 4:
      case 5:
      case 6:
      case 7:
        var addr = this.getAddr( num, pdp11, ahead, width ) ;
        if( width == Processor.WORD )
          return pdp11.mmu.load_word( addr ) ;
        return pdp11.mmu.load_byte( addr ) ;

      default:
        break ;

    }

  },

  setReg: function( num, pdp11, ahead, width, value ) {

    var reg_num = num & 07 ;
    var reg     = pdp11.get_reg( reg_num ) ;
    var type    = ( num & 070 ) >> 3 ;

    switch( type ) {

      case 0:
        var addr = this.getAddr( num, pdp11, ahead, width ) ;
        if( width == Processor.WORD )
          reg.set_word( value ) ;
        else
          reg.set_byte( value ) ;
        break ;

      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        var addr = this.getAddr( num, pdp11, ahead, width ) ;
        if( width == Processor.WORD )
          pdp11.mmu.store_word( addr, value ) ;
        else
          pdp11.mmu.store_byte( addr, value ) ;
        break ;

      default:
        break ;

    }

  },

  // return result
  setRel: function( num, pdp11, ahead, width, value, func ) {
    var addr = this.getAddr( num, pdp11, ahead, width ) ;
    var val ;
    if( ( num & 070 ) == 000 ) {
      val = pdp11.get_reg( num ).get_word( ) ;
      val = func( val, value ) ;
      pdp11.get_reg( num ).set( val ) ;
    } else {
      if( width == Processor.WORD ) {
        val = func( pdp11.mmu.load_word( addr ), value ) ;
        pdp11.mmu.store_word( addr, val ) ;
      } else {
        val = func( pdp11.mmu.load_byte( addr ), value ) ;
        pdp11.mmu.store_byte( addr, val ) ;
      }
    }
    return val ;
  },

  isNegative: function( val, width ) {
    if( width == Processor.WORD && ( val & 0x8000 ) )
      return true ;
    if( width == Processor.BYTE && ( val & 0x80 ) )
      return true ;
    return false ;
  },

  isZero: function( val, width ) {
    return val == 0 ? true : false ;
  },

  to_int: function( val, width ) {
    if( width == Processor.WORD )
      return to_int16( val ) ;
    else
      return to_int8( val ) ;
  },

  load: function( ) {

  }



} ;
