__jsimport( "pdp11/Memory.js" ) ;
__jsimport( "pdp11/Psw.js" ) ;
__jsimport( "pdp11/Apr.js" ) ;
__jsimport( "pdp11/Clock.js" ) ;
__jsimport( "pdp11/Terminal.js" ) ;
__jsimport( "pdp11/Disk.js" ) ;
__jsimport( "pdp11/Mmu.js" ) ;
__jsimport( "pdp11/Register.js" ) ;
__jsimport( "pdp11/Util.js" ) ;
__jsimport( "pdp11/OpCode.js" ) ;
__jsimport( "pdp11/Disassembler.js" ) ;
__jsimport( "pdp11/SystemCall.js" ) ;

function Pdp11( ) {
  // may be better to move these lines to other class.
  this.memory = new Memory( ) ;
  this.psw = new Psw( ) ;
  this.apr = new Apr( ) ;
  this.apr.setPsw( this.psw ) ;
  this.clock = new Clock( this ) ;
  this.terminal = new Terminal( this ) ;
  this.disk = new Disk( this ) ;

  this.mmu = new Mmu( ) ;
  this.mmu.setApr( this.apr ) ;
  this.mmu.setPsw( this.psw ) ;
  this.mmu.setClock( this.clock ) ;
  this.mmu.setTerminal( this.terminal ) ;
  this.mmu.setMemory( this.memory ) ;
  this.mmu.setDisk( this.disk ) ;

  this.kernelRegs = new Array( ) ;
  this.userRegs = new Array( ) ;
  for( var i = 0; i < Pdp11._NUM_OF_REGISTERS; i++ ) {
    this.kernelRegs.push( new Register( ) ) ;
    this.userRegs.push( new Register( ) ) ;
  }
  this.symbols = { } ;
  this.history = [ ] ;
  this.br = [ ] ;
  for( var i = 0; i < 8; i++ )
    this.br.push( [ ] ) ; // bri

  this.interrupt_vector = 0 ;
  this.interrupt_level = 0 ;
  this.trap_vector = 0 ;
  this.wait = false ;
  this.stop = false ;

  this.disassembler = new Disassembler( this ) ;
}

Pdp11._NUM_OF_REGISTERS = 8 ;
Pdp11._REGISTER_SP = 6 ;
Pdp11._REGISTER_PC = 7 ;

Pdp11._WIDTH_BYTE = 1 ;
Pdp11._WIDTH_WORD = 2 ;

Pdp11._LIMIT_STEP = 1500000 ;
Pdp11._INTERVAL   = 0 ;

Pdp11._HISTORY_LENGTH = 20 ;

Pdp11.prototype.setSymbols = function( symbols ) {
  this.symbols = symbols ;
} ;

Pdp11.prototype._getReg = function( index ) {
  // temporal
  if( index != 6 ) {
    return this.kernelRegs[ index ]
  }
  return this.psw.currentModeIsKernel( )
    ? this.kernelRegs[ index ]
    : this.userRegs[ index ] ;
} ;

Pdp11.prototype._getSp = function( ) {
  return this._getReg( Pdp11._REGISTER_SP ) ;
} ;

Pdp11.prototype._getPc = function( ) {
  return this._getReg( Pdp11._REGISTER_PC ) ;
} ;

Pdp11.prototype._fetch = function( ) {
  var data = this.mmu.loadWord( this._getPc( ).readWord( ) ) ;
  this._nextStep( ) ;
  return data ;
} ;

Pdp11.prototype._nextStep = function( ) {
  this._getPc( ).incrementWord( ) ;
} ;

/**
 * TODO: make it faster?
 */
Pdp11.prototype._decode = function( code ) {
  for( var i = 0; i < OpCode.length; i++ ) {
    if( ( code & OpCode[ i ].judge ) == OpCode[ i ].value ) {
      return OpCode[ i ] ;
    }
  }
  return null ;
} ;

Pdp11.prototype.dump = function( ) {
  var buffer = this.psw.dump( ) ;
  buffer += ' ' ;
  for( var i = 0; i < Pdp11._NUM_OF_REGISTERS; i++ ) {
    buffer += 'r' + i + ':' + format( this._getReg( i ).readWord( ) ) ;
    buffer += '(' + format( this.mmu.loadWord( this._getReg( i ).readWord( ) ) ) + ')' ;
    buffer += ', ' ;
  }
  buffer += this.mmu.dump( ) ;
  buffer += this.apr.dump( ) ;
  return buffer ;
} ;

Pdp11.prototype.run = function( ) {

  var self = this ;
  var stepNum = 0 ;
  var symbolName = null ;
  var runStep = function( ) {

    try {
      if( ! self.wait )
        __logger.log( self.dump( ) ) ;

      if( self.psw.getTrap( ) ) {
        __logger.log( "trap occured. " + format( self.trap_vector ) ) ;
        console.log( "trap occured. " + format( self.trap_vector ) ) ;
        self.psw.setTrap( false ) ;
        var tmp_psw = self.psw.readWord( ) ;
        var tmp_pc = self._getPc( ).readWord( ) ;
        var tmp_mode = self.psw.getCurrentMode( ) ;

        self.psw.setCurrentMode( Psw.KERNEL_MODE ) ;
        self._pushStack( tmp_psw ) ;
        self._pushStack( tmp_pc ) ;

        self._getPc( ).writeWord( self.mmu.loadWordByPhysicalAddress( self.trap_vector ) ) ;
        self.psw.writeWord( self.mmu.loadWordByPhysicalAddress( self.trap_vector + 2 ) ) ;
        self.psw.setPreviousMode( tmp_mode ) ;

        self.trap_vector = 0 ;
        __logger.log( self.dump( ) ) ;
      } else if( self.interrupt_vector && self.interrupt_level > self.psw.getPriority( ) ) {
        __logger.log( "interrupt occured. " + format( self.interrupt_vector ) ) ;
        console.log( "interrupt occured. " + format( self.interrupt_vector ) ) ;
        var tmp_psw = self.psw.readWord( ) ;
        var tmp_pc = self._getPc( ).readWord( ) ;
        var tmp_mode = self.psw.getCurrentMode( ) ;

        self.psw.setCurrentMode( Psw.KERNEL_MODE ) ;

        self._pushStack( tmp_psw ) ;
        self._pushStack( tmp_pc ) ;

        self._getPc( ).writeWord( self.mmu.loadWordByPhysicalAddress( self.interrupt_vector ) ) ;
        self.psw.writeWord( self.mmu.loadWordByPhysicalAddress( self.interrupt_vector + 2 ) ) ;
        self.psw.setPreviousMode( tmp_mode ) ;

        self.interrupt_vector = 0 ;
        self.interrupt_level = 0 ;
        self.wait = false ;
        __logger.log( self.dump( ) ) ;
      }

      if( self.wait ) {
        setTimeout( runStep, Pdp11._INTERVAL ) ;
        return ;
      }

      var symbol = null ;
      var num = 0 ;
      for ( var key in self.symbols ) {
        if( self._getPc( ).readWord( ) >= self.symbols[ key ] && self.symbols[ key ] > num ) {
          symbol = key ;
          num = self.symbols[ key ] ;
        }
      }
      if( self.psw.currentModeIsKernel( ) && symbol )
        __logger.log( format( self._getPc( ).readWord( ) ) + ':' + symbol + '+' + format( self._getPc( ).readWord( ) - self.symbols[ symbol ] ) ) ;
      else
        __logger.log( format( self._getPc( ).readWord( ) ) + ':' ) ;

      var code = self._fetch( ) ;
      var op = self._decode( code ) ;
      __logger.log( self.disassembler.run( op, code ) ) ;
      op.run( self, code ) ;
      if( self.psw.currentModeIsKernel( ) && symbolName != symbol && symbol != 'csv' && symbol != 'cret' ) {
        symbolName = symbol ;
        self._addHistory( symbolName ) ;
//        console.log( symbolName ) ;
      }
      if( op && op.op == 'trap' ) {
        var buffer = 'trap ' + SystemCall[ code & 0xff ].name ;
        if( ( code & 0xff ) == 0 ) {
          var tmp = self.mmu.loadWord( self._getPc( ).readWord( ) ) ;
          var sys_op = self.mmu.loadWord( tmp ) ;
          buffer += '(' + SystemCall[ sys_op & 0xff ].name + ')' ;
        }
        console.log( buffer ) ;
      }
      stepNum++ ;
      if( /* stepNum < Pdp11._LIMIT_STEP && */ ! self.stop )
        setTimeout( runStep, Pdp11._INTERVAL ) ;
      else
        self._dumpLog( ) ;
    } catch( e ) {
      console.log( e.stack ) ;
      __logger.log( e.stack ) ;
      self._dumpLog( ) ;
    }
  } ;
  runStep( ) ;
} ;

Pdp11.prototype._dumpLog = function( ) {
  if( __logger.getUrl ) {
    var a = document.createElement( 'a' ) ;
    a.download = 'log' ;
    a.href = __logger.getUrl( ) ;
    a.textContent = 'log' ;
    document.getElementsByTagName( 'body' )[ 0 ].appendChild( a ) ;
//    open( __logger.getUrl( ), false ) ;
  }
}

/**
 * TODO: separate BYTE WIDTH one and WORD WIDTH one?
 */
Pdp11.prototype._calculateOperandAddress = function( num, width ) {

  var reg_num = num & 07 ;
  var reg     = this._getReg( reg_num ) ;
  var mode    = ( num & 070 ) >> 3 ;

  // TODO: separate general one and pc one?
  // TODO: what happen when address overflow happen?
  switch( mode ) {

    // TODO: throw Exception or mapped address of register?
    // General and PC : Register contains operand.
    case 0:
      return reg_num ;

    // General and PC : Register contains address.
    case 1:
      return reg.readWord( ) ;

    // General : Register contains address, then increments.
    // PC      : the next word of PC is operand.
    case 2:
      // TODO: throw Exception?
      if( reg_num == 7 ) {
        // throw Exception
      }
      var value = reg.readWord( ) ;
      if( width == Pdp11._WIDTH_BYTE )
        reg.incrementByte( ) ;
      else
        reg.incrementWord( ) ;
      return value ;

    // General : Register contains address of address, then increments by 2.
    // PC      : the next word of PC is address
    case 3:
      if( reg_num == 7 ) {
        return this._fetch( ) ;
      }
      var value = this.mmu.loadWord( reg.readWord( ) ) ;
      reg.incrementWord( ) ;
      return value ;

    // General and PC : Register decrements, then contains address.
    case 4:
      if( width == Pdp11._WIDTH_BYTE )
        reg.decrementByte( ) ;
      else
        reg.decrementWord( ) ;
      return reg.readWord( ) ;

    // General and PC : Register decrements by 2, then contains address of address.
    case 5:
      reg.decrementWord( ) ;
      return this.mmu.loadWord( reg.readWord( ) ) ;

    // General : The value of register plus next word of PC is adress.
    // PC      : The sum of next two words of PC is address?
    case 6:
      if( reg_num == 7 ) {
         return this._fetch( ) + this._getPc( ).readWord( ) ;
      }
      return reg.readWord( ) + this._fetch( ) ;

    // General : The value of register plus next word of PC is adress of address.
    // PC      : The sum of next two words of PC is address of address?
    case 7:
      if( reg_num == 7 ) {
         return this.mmu.loadWord( this._fetch( ) + this._getPc( ).readWord( ) ) ;
      }
      return this.mmu.loadWord( reg.readWord( ) + this._fetch( ) ) ;

    // unnecessary?
    default:
      break ;

  }

} ;

Pdp11.prototype._load = function( num, width ) {

  var reg_num = num & 07 ;
  var reg     = this._getReg( reg_num ) ;
  var mode    = ( num & 070 ) >> 3 ;

  switch( mode ) {

    case 0:
      return width == Pdp11._WIDTH_BYTE
               ? reg.readLowByte( )
               : reg.readWord( ) ;

    case 2:
      if( reg_num == 7 ) {
        return width == Pdp11._WIDTH_BYTE
                 ? to_uint8( this._fetch( ) ) // this._fetch( ) & 0xff is also ok?
                 : this._fetch( ) ;
      }

    case 1:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      var addr = this._calculateOperandAddress( num, width ) ;
      return width == Pdp11._WIDTH_BYTE
               ? this.mmu.loadByte( addr )
               : this.mmu.loadWord( addr ) ;

    // unnecessary?
    default:
      break ;

  }

} ;

Pdp11.prototype._store = function( num, width, value ) {

  var reg_num = num & 07 ;
  var reg     = this._getReg( reg_num ) ;
  var mode    = ( num & 070 ) >> 3 ;

  switch( mode ) {

    case 0:
//      if( width == Pdp11._WIDTH_BYTE )
//        reg.writeLowByte( value ) ;
//      else
        reg.writeWord( value ) ;
      break ;

    case 2:
      // TODO: confirm this logic correnspods to the specification or not.
      if( reg_num == 7 ) {
        // throw Exception
        break ;
      }

    case 1:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      var addr = this._calculateOperandAddress( num, width ) ;
      if( width == Pdp11._WIDTH_BYTE )
        this.mmu.storeByte( addr, value ) ;
      else
        this.mmu.storeWord( addr, value ) ;
      break ;

    // unnecessary?
    default:
      break ;

  }

} ;

/**
 * @param func 
 */
Pdp11.prototype._loadAndStore = function( num, width, value, func ) {

  // TODO: throw Exception if invalid mode is passed?
  var reg_num = num & 07 ;
  var reg     = this._getReg( reg_num ) ;
  var mode    = ( num & 070 ) >> 3 ;

  // TODO: confirm the logic
  switch( mode ) {

    case 0:
      if( width == Pdp11._WIDTH_BYTE )
        reg.writeLowByte( func( reg.readLowByte( ), value, this ) ) ;
      else
        reg.writeWord( func( reg.readWord( ), value, this ) ) ;
      break ;

    case 2:
      // TODO: confirm this logic correnspods to the specification or not.
      if( reg_num == 7 ) {
        // throw Exception
        break ;
      }

    case 1:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      var addr = this._calculateOperandAddress( num, width ) ;
      if( width == Pdp11._WIDTH_BYTE )
        this.mmu.storeByte( addr, func( this.mmu.loadByte( addr ), value, this ) ) ;
      else
        this.mmu.storeWord( addr, func( this.mmu.loadWord( addr ), value, this ) ) ;
      break ;

    // unnecessary?
    default:
      break ;

  }

} ;

Pdp11.prototype._isNegative = function( val, width ) {
  if( width == Pdp11._WIDTH_WORD && ( val & 0x8000 ) )
    return true ;
  if( width == Pdp11._WIDTH_BYTE && ( val & 0x80 ) )
    return true ;
  return false ;
} ;

Pdp11.prototype._isZero = function( val, width ) {
  if( width == Pdp11._WIDTH_WORD && ( val & 0xffff ) == 0 )
    return true ;
  if( width == Pdp11._WIDTH_BYTE && ( val & 0xff ) == 0 )
    return true ;
  return false ;
} ;

Pdp11.prototype._hasCarry = function( val, width ) {
  if( width == Pdp11._WIDTH_WORD && ( val > 0xffff || val < -0x10000 ) )
    return true ;
  if( width == Pdp11._WIDTH_BYTE && ( val > 0xff || val < -0x100 ) )
    return true ;
  return false ;
} ;

Pdp11.prototype._pushStack = function( val ) {
  this._getSp( ).decrementWord( ) ;
  this.mmu.storeWord( this._getSp( ).readWord( ), val ) ;
} ;

Pdp11.prototype._popStack = function( ) {
  var val = this.mmu.loadWord( this._getSp( ).readWord( ) ) ;
  this._getSp( ).incrementWord( ) ;
  return val ;
} ;

// not implemented yet.
Pdp11.prototype.interrupt = function( level, vector ) {
  this.interrupt_level = level ;
  this.interrupt_vector = vector ;
} ;

// not implemented yet.
Pdp11.prototype.trap = function( vector ) {
  this.trap_vector = vector ;
  this.psw.setTrap( true ) ;
} ;

Pdp11.prototype._addHistory = function( str ) {
  this.history.unshift( str ) ;
  while( this.history.length > __lognum.selectedOptions.item( ).value )
    this.history.pop( ) ;

  __logview.innerHTML = "" ;
  for( var i = 0; i < this.history.length; i++ ) {
    __logview.innerHTML += this.history[ i ] + "\n" ;
  }
} ;
