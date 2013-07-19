// trace must be global.

__jsimport( "pdp11/OpHandler.js" ) ;
__jsimport( "pdp11/Pdp11.js" ) ;

var OpType = {
  I_DOUBLE:    0x01,
  I_SINGLE:    0x02,
  I_BRANCH:    0x04,
  I_CONDITION: 0x08,
  I_JSR:       0x10,
  I_RTS:       0x11,
  I_JMP:       0x12,
  I_OTHER:     0x14,
  I_SYSTEM:    0x18,
  I_ONEHALF:   0x20,
} ;

var OpCode = [

  { judge : 0177777, value : 0170011, op : 'setd',  type : OpType.I_OTHER,
    run : function( pdp11, proc, code, ahead ) { } },
  { judge : 0170000, value : 0010000, op : 'mov',   type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.mov( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0170000, value : 0110000, op : 'movb',  type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.mov( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0170000, value : 0020000, op : 'cmp',   type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.cmp( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0170000, value : 0120000, op : 'cmpb',  type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.cmp( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0170000, value : 0030000, op : 'bit',   type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.bit( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0170000, value : 0130000, op : 'bitb',  type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.bit( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0170000, value : 0040000, op : 'bic',   type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.bic( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0170000, value : 0140000, op : 'bicb',  type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.bic( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0170000, value : 0050000, op : 'bis',   type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.bis( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0170000, value : 0150000, op : 'bisb',  type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      OpHandler.bis( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  // TODO: confirm
  { judge : 0170000, value : 0060000, op : 'add',   type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      var src = pdp11._load( ( code & 0007700 ) >> 6, Pdp11._WIDTH_WORD ) ;
      pdp11._loadAndStore( code & 0000077, Pdp11._WIDTH_WORD, src,
        function( arg1, arg2, pdp11 ) { 
          var result = arg1 + arg2 ;
          pdp11.psw.setN( result < 0 ? true : false ) ;
          pdp11.psw.setZ( result == 0 ? true : false ) ;
          pdp11.psw.setV( result > 0xffff || result < -0x10000 ? true : false ) ;
          pdp11.psw.setC( false ) ;
          return result ;
        } ) ;
  } },
  // TODO: implement
  { judge : 0170000, value : 0160000, op : 'sub',   type : OpType.I_DOUBLE,
    run : function( pdp11, code ) {
      var src = pdp11._load( ( code & 0007700 ) >> 6, Pdp11._WIDTH_WORD ) ;
      pdp11._loadAndStore( code & 0000077, Pdp11._WIDTH_WORD, src,
        function( arg1, arg2, pdp11 ) {
          var result = arg1 - arg2 ;
          pdp11.psw.setN( result < 0  ? true : false ) ;
          pdp11.psw.setZ( result == 0 ? true : false ) ;
          pdp11.psw.setV( result > 0xffff || result < -0x10000 ? true : false ) ;
          if( arg1 >= 0 && arg2 < 0 ) {
            pdp11.psw.setC( arg2 > 0xffff ? false : true ) ;
          } else if( ( arg2 >= 0 && arg1 >= 0 ) || ( arg2 < 0 & arg1 < 0 ) ) {
            pdp11.psw.setC( arg2 >= 0 ? false : true ) ;
          } else {
            pdp11.psw.setC( false ) ;
          }
          return result ;
        } ) ;
  } },
  { judge : 0177000, value : 0070000, op : 'mul',   type : OpType.I_ONEHALF,
    run : function( pdp11, code ) {
      var reg = ( code & 0000700 ) >> 6 ;
      var src = pdp11._load( code & 0000077, Pdp11._WIDTH_WORD ) ;
      var num = pdp11._getReg( reg ).readWord( ) * src ;

      if( reg & 1 == 0 ) {
        pdp11._getReg( reg + 0 ).writeWord( ( num & 0xffff0000 ) >> 8 ) ;
        pdp11._getReg( reg + 1 ).writeWord( num & 0xffff ) ;
      } else {
        pdp11._getReg( reg + 0 ).writeWord( num & 0xffff ) ;
      }
      pdp11.psw.setN( pdp11._isNegative( num, Pdp11._WIDTH_WORD ) ) ;
      pdp11.psw.setV( pdp11._isZero( num, Pdp11._WIDTH_WORD ) ) ;
      pdp11.psw.setC( num > 0xffffffff | num < -0x100000000 ? true : false ) ;
  } },
  { judge : 0177000, value : 0071000, op : 'div',   type : OpType.I_ONEHALF,
    run : function( pdp11, code ) {
      var reg = ( code & 0000700 ) >> 6 ;
      var addr = pdp11._load( reg, Pdp11._WIDTH_WORD ) ;
      var src = pdp11._load( code & 0000077, Pdp11._WIDTH_WORD ) ;
      var num = ( ( pdp11._getReg( reg + 0 ).readWord( ) & 0xffff ) << 16 )
                  | ( pdp11._getReg( reg + 1 ).readWord( ) & 0xffff ) ;

      pdp11._getReg( reg ).writeWord( parseInt( num / src ) & 0xffff ) ;
      pdp11._getReg( reg + 1 ).writeWord( ( num % src ) & 0xffff ) ;
      pdp11.psw.setC( ! src ? true : false ) ;
      pdp11.psw.setV( ! src ? true : false ) ;
  } },
  { judge : 0177000, value : 0072000, op : 'ash',   type : OpType.I_ONEHALF,
    run : function( pdp11, code ) {
      var reg_num = ( code & 0000700 ) >> 6 ;
      var reg = pdp11._getReg( reg_num ) ;
      var src = to_int16( pdp11._load( code & 0000077, Pdp11._WIDTH_WORD ) ) ;

      if( src > 0 )
        reg.writeWord( reg.readWord( ) << src ) ;
      else
        reg.writeWord( reg.readWord( ) >> ( src * -1 ) ) ;

      pdp11.psw.setN( pdp11._isNegative( reg.readWord( ) ) ) ;
      pdp11.psw.setZ( reg.readWord( ) == 0 ? true : false ) ;
      pdp11.psw.setV( false ) ;
      pdp11.psw.setC( false ) ;
  } },
  { judge : 0177000, value : 0073000, op : 'ashc',  type : OpType.I_ONEHALF,
    run : function( pdp11, code ) {
      var reg = ( code & 0000700 ) >> 6 ;
      var addr = pdp11._calculateOperandAddress( ( code & 0000700 ) >> 6, Pdp11._WIDTH_WORD ) ;
      var src = pdp11._load( code & 0000077, Pdp11._WIDTH_WORD ) ;
      var val = ( pdp11._getReg( reg ).readWord( ) << 16 ) |
                ( pdp11._getReg( reg + 1 ).readWord( ) & 0xffff ) ;
      var c ;

      if( src & 040 ) {
        src = ~( src - 1 ) * - 1 ;
      }

      src = to_int16( src ) ;

      if( src == 0 ) {
        c = false ;
      } else if( src > 0 ) {
        c = val & 0x80000000 ? true : false ;
        val <<= src ;
      } else {
        c = val & 0x1 ? true : false ;
        val >>= ( src * -1 ) ;
      }
      pdp11._getReg( reg ).writeWord( ( val & 0xffff0000 ) >> 16 ) ;
      pdp11._getReg( reg + 1 ).writeWord( val & 0xffff ) ;

      pdp11.psw.setN( pdp11._isNegative( pdp11._getReg( reg ).readWord( ), Pdp11._WIDTH_WORD ) ) ;
      pdp11.psw.setZ( pdp11._isZero( pdp11._getReg( reg ).readWord( ), Pdp11._WIDTH_WORD ) ) ;
      if( val == 0 ) {
        pdp11.psw.setZ( true ) ;
      } else {
        pdp11.psw.setZ( false ) ;
      }
      pdp11.psw.setC( c ) ;
  } },
  { judge : 0177000, value : 0074000, op : 'xor',   type : OpType.I_ONEHALF,
    run : function( pdp11, proc, code, ahead ) {
      var reg = Processor.getAddr( ( code & 0000700 ) >> 6, pdp11, proc, ahead, Processor.WORD ) ;
      var addr = Processor.getAddr( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
      proc.set_word( addr, pdp11.regs[ reg ].get( ) ^ proc.get_word( addr ) ) ;
      pdp11.setFlag( proc.get_word( addr ) ) ;
  } },
  { judge : 0177000, value : 0075000, op : 'xxx',   type : OpType.I_ONEHALF },
  { judge : 0177000, value : 0076000, op : 'xxx',   type : OpType.I_ONEHALF },
  // TODO: confirm
  { judge : 0177000, value : 0077000, op : 'sob',   type : OpType.I_ONEHALF,
    run : function( pdp11, code ) {
      var reg_num = ( code & 0000700 ) >> 6 ;
      var addr = pdp11._load( reg_num, Pdp11._WIDTH_WORD ) ;
      var reg = pdp11._getReg( reg_num ) ;
      var pc  = pdp11._getPc( ) ;
      var dst = code & 0000077 ;
      reg.writeWord( reg.readWord( ) - 1 ) ;
      if( reg.readWord( ) ) {
        pc.writeWord( pc.readWord( ) - ( dst * 2 ) ) ;
      }
      pdp11.psw.setN( pdp11._isNegative( reg.readWord( ) ) ) ;
      pdp11.psw.setZ( reg.readWord( ) == 0 ? true : false ) ;
      pdp11.psw.setV( false ) ;
  } },
  { judge : 0177700, value : 0000300, op : 'swab',  type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      var des = code & 077 ;
      var val ;
      if( ! ( des & 070 ) ) {
        val = pdp11._getReg( des & 07 ).readWord( ) ;
        val = ( ( val & 0xff ) << 8 ) | ( ( val & 0xff00 ) >> 8 ) ;
        pdp11._getReg( des & 07 ).writeWord( val ) ;
      } else {
        var addr = pdp11._calculateOperandAddress( des, Pdp11._WIDTH_WORD ) ;
        val = pdp11.mmu.loadWord( addr ) ;
        val = ( ( val & 0xff ) << 8 ) | ( ( val & 0xff00 ) >> 8 ) ;
        pdp11.mmu.storeWord( addr, val ) ;
      }
      pdp11.psw.setN( val & 0x0100 ? true : false ) ;
      pdp11.psw.setZ( val ? false : true ) ;
      pdp11.psw.setV( false ) ;
      pdp11.psw.setC( false ) ;

  } },
//  { judge : 0177700, value : 0100300, op : 'bpl',   type : OpType.I_SINGLE },
  { judge : 0177700, value : 0005000, op : 'clr',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.clr( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0105000, op : 'clrb',  type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.clr( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0177700, value : 0005100, op : 'com',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.com( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105100, op : 'comb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.com( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005200, op : 'inc',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.inc( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0105200, op : 'incb',  type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.inc( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0177700, value : 0005300, op : 'dec',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.dec( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0105300, op : 'decb',  type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.dec( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0177700, value : 0005400, op : 'neg',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.neg( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0105400, op : 'negb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.neg( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005500, op : 'adc',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.adc( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0105500, op : 'adcb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.adc( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005600, op : 'sbc',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.sbc( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0105600, op : 'sbcb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.sbc( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005700, op : 'tst',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.tst( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0105700, op : 'tstb',  type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.tst( pdp11, code, Pdp11._WIDTH_BYTE ) ;
  } },
  { judge : 0177700, value : 0006000, op : 'ror',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.ror( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0106000, op : 'rorb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006100, op : 'rol',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.rol( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0106100, op : 'rolb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006200, op : 'asr',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.asr( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0106200, op : 'asrb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006300, op : 'asl',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      OpHandler.asl( pdp11, code, Pdp11._WIDTH_WORD ) ;
  } },
  { judge : 0177700, value : 0106300, op : 'aslb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006400, op : 'mark',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0106400, op : 'mtps',  type : OpType.I_SINGLE },
  // TODO: implement
  { judge : 0177700, value : 0006500, op : 'mfpi',  type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      try {
        var result ;
        if( ( code & 070 ) == 0 ) {
          var reg_num = code & 07 ;
          if( pdp11.psw.previousModeIsKernel( ) ) {
            result = pdp11.kernelRegs[ reg_num ].readWord( ) ;
          } else {
            result = pdp11.userRegs[ reg_num ].readWord( ) ;
          }
        } else {
          var src = pdp11._calculateOperandAddress( code & 0000077, Pdp11._WIDTH_WORD ) ;
          result = pdp11.mmu.loadWordFromPreviousUserSpace( src ) ;
        }
        pdp11._pushStack( result ) ;
        pdp11.psw.setN( pdp11._isNegative( result, Pdp11._WIDTH_WORD ) ) ;
        pdp11.psw.setZ( pdp11._isZero( result, Pdp11._WIDTH_WORD ) ) ;
        pdp11.psw.setV( false ) ;
      // TODO: check Exception type.
      } catch( e ) {
        __logger.log( e.stack ) ;
        pdp11.trap( 004 ) ;
      }
  } },
  { judge : 0177700, value : 0106500, op : 'mfpd',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006600, op : 'mtpi',  type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      var result ;
      if( ( code & 070 ) == 0 ) {
        var reg_num = code & 07 ;
        result = pdp11._popStack( ) ;
        if( pdp11.psw.previousModeIsKernel( ) ) {
          pdp11.kernelRegs[ reg_num ].writeWord( result ) ;
        } else {
          pdp11.userRegs[ reg_num ].writeWord( result ) ;
        }
      } else {
        var src = pdp11._calculateOperandAddress( code & 0000077, Pdp11._WIDTH_WORD ) ;
        result = pdp11._popStack( ) ;
        pdp11.mmu.storeWordIntoPreviousUserSpace( src, result ) ;
      }
      pdp11.psw.setN( pdp11._isNegative( result, Pdp11._WIDTH_WORD ) ) ;
      pdp11.psw.setZ( pdp11._isZero( result, Pdp11._WIDTH_WORD ) ) ;
      pdp11.psw.setV( false ) ;
  } },
  { judge : 0177700, value : 0106600, op : 'mtpd',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006700, op : 'sxt',   type : OpType.I_SINGLE,
    run : function( pdp11, code ) {
      var val = pdp11.psw.getN( ) ? 0xffff : 0x0000 ;
      pdp11._store( code & 0000077, Pdp11._WIDTH_WORD, val ) ;
      pdp11.psw.setZ( val ? false : true ) ;
  } },
  { judge : 0177700, value : 0106700, op : 'mfps',  type : OpType.I_SINGLE },
  { judge : 0177400, value : 0000400, op : 'br',    type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0001000, op : 'bne',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( ! pdp11.psw.getZ( ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0001400, op : 'beq',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( pdp11.psw.getZ( ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0002000, op : 'bge',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( ( pdp11.psw.getN( ) ^ pdp11.psw.getV( ) ) == 0 )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0002400, op : 'blt',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( pdp11.psw.getN( ) ^ pdp11.psw.getV( ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0003000, op : 'bgt',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( ! ( pdp11.psw.getZ( ) || ( pdp11.psw.getN( ) ^ pdp11.psw.getV( ) ) ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0003400, op : 'ble',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( ( pdp11.psw.getZ( ) || ( pdp11.psw.getN( ) ^ pdp11.psw.getV( ) ) ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0100000, op : 'bpl',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ! pdp11.ps.n )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0100400, op : 'bmi',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( pdp11.psw.getN( ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0101000, op : 'bhi',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( ! ( pdp11.psw.getC( ) || pdp11.psw.getZ( ) ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0101400, op : 'blos',  type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( pdp11.psw.getC( ) ^ pdp11.psw.getZ( ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0102000, op : 'bvc',   type : OpType.I_BRANCH },
  { judge : 0177400, value : 0102400, op : 'bvs',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( pdp11.ps.v )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0103000, op : 'bcc',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( ! pdp11.psw.getC( ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177400, value : 0103400, op : 'bcs',   type : OpType.I_BRANCH,
    run : function( pdp11, code ) {
      if( pdp11.psw.getC( ) )
        OpHandler.br( pdp11, code ) ;
  } },
  { judge : 0177777, value : 0000241, op : 'clc',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000261, op : 'sec',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000242, op : 'clv',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000262, op : 'sev',   type : OpType.I_CONDITION,
    run : function( pdp11, proc, code, ahead ) {
      pdp11.ps.v = true ;
  } },
  { judge : 0177777, value : 0000244, op : 'clz',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000264, op : 'sez',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000254, op : 'cln',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000274, op : 'sen',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000257, op : 'ccc',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000277, op : 'scc',   type : OpType.I_CONDITION },
  { judge : 0177000, value : 0004000, op : 'jsr',   type : OpType.I_JSR,
    run : function( pdp11, code ) {
      var reg  = pdp11._calculateOperandAddress( ( code & 0000700 ) >> 6, Pdp11._WIDTH_WORD ) ;
      var addr = pdp11._calculateOperandAddress( code & 0000077, Pdp11._WIDTH_WORD ) ;
      pdp11._pushStack( pdp11._getReg( ( code & 0000700 ) >> 6 ).readWord( ) ) ;
      pdp11._getReg( ( code & 0000700 ) >> 6 ).writeWord( pdp11._getPc( ).readWord( ) ) ;
      pdp11._getPc( ).writeWord( addr ) ;
  } },
  { judge : 0177770, value : 0000200, op : 'rts',   type : OpType.I_RTS,
    run : function( pdp11, code ) {
      var reg_num = code & 07 ;
      pdp11._getPc( ).writeWord( pdp11._getReg( reg_num ).readWord( ) ) ;
      pdp11._getReg( reg_num ).writeWord( pdp11._popStack( ) ) ;
  } },
  /**
   * TODO: implement Exception
   */
  { judge : 0177700, value : 0000100, op : 'jmp',   type : OpType.I_JMP,
    run : function( pdp11, code ) {
//      if( ( code & 070 ) == 0 )
//        throw Exception( ) ;
      var addr = pdp11._calculateOperandAddress( code & 0000077, Pdp11._WIDTH_WORD ) ;
      pdp11._getPc( ).writeWord( addr ) ;
  } },
  { judge : 0177777, value : 0000240, op : 'nop',   type : OpType.I_OTHER },
  { judge : 0177777, value : 0000000, op : 'halt',  type : OpType.I_OTHER },
  { judge : 0177777, value : 0000001, op : 'wait',  type : OpType.I_OTHER,
    run : function( pdp11, code, ahead ) {
      pdp11.wait = true ;
  } }, // not implemented yet.
  { judge : 0177777, value : 0000002, op : 'rti',   type : OpType.I_OTHER,
    run : function( pdp11, code, ahead ) {
      pdp11.get_reg( 7 ).set_word( pdp11.mmu.load_word( pdp11.get_reg( 6 ).get_word( ) ) ) ;
      pdp11.get_reg( 6 ).increment( ) ;
      pdp11.psw.set_word( pdp11.mmu.load_word( pdp11.get_reg( 6 ).get_word( ) ) ) ;
      pdp11.get_reg( 6 ).increment( ) ;
  } },
  // TODO: implement
  { judge : 0177777, value : 0000006, op : 'rtt',   type : OpType.I_OTHER,
    run : function( pdp11, code ) {
      pdp11._getPc( ).writeWord( pdp11._popStack( ) ) ;
      pdp11.psw.writeWord( pdp11._popStack( ) ) ;
  } },
  { judge : 0177777, value : 0000004, op : 'bpt',   type : OpType.I_OTHER },
  { judge : 0177777, value : 0000005, op : 'reset', type : OpType.I_OTHER,
    run : function( pdp11, code, ahead ) { } }, // not implemented yet.
  { judge : 0177400, value : 0104400, op : 'trap',   type : OpType.I_SYSTEM,
    run : function( pdp11, proc, code, ahead ) {
      pdp11.trap( 034 ) ;
  } },
  { judge : 0000000, value : 0000000, op : '??',    type : OpType.I_OTHER } // general

] ;
