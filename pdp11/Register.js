/**
 * Register Emulation Suites for JavaScript
 */

/**
 * Register prototype
 *
 * This prototype provides Register emulation.
 * @author Takahiro <hogehoge@gachapin.jp>
 */
function Register( ) {
    var buffer = new ArrayBuffer( Register._wordSize ) ;
    this.uint8 = new Uint8Array( buffer ) ;
    this.uint16 = new Uint16Array( buffer ) ;
    this.int16 = new Int16Array( buffer ) ;
    this.uint16[ 0 ] = 0 ;
}

Register._wordSize = 2 ; // 2bytes

/**
 * Read word as unsigned 16bit integer.
 * @return the word of register
 */
Register.prototype.readWord = function( ) {
  return this.uint16[ 0 ] ;
} ;

/**
 * Read lower byte as unsigned 8bit integer.
 * @return the lower byte of register
 */
Register.prototype.readLowByte = function( ) {
  return this.uint8[ 0 ] ;
} ;

/**
 * Read higher byte as unsigned 8bit integer.
 * @return the higher byte of register
 */
Register.prototype.readHighByte = function( ) {
  return this.uint8[ 1 ] ;
} ;

/**
 * Partially read the data of register.
 * For instance, if the data of register is 0001_0010_0011_0100b,
 * offset is 2(bits), and mask is 3(11b), the result is 01b.
 * If mask were width bit, this API would be more straight forward.
 * But mask bit is easier to implement.
 * @param offset bit offset from LSB.
 * @param mask mask bit.
 * @return 
 */
Register.prototype.readPartial = function( offset, mask ) {
  return ( this.readWord( ) >> offset ) & mask ;
} ;

Register.prototype.readBit = function( bit ) {
  return this.readPartial( bit, 1 ) == 1 ? true : false ;
} ;

/**
 * Write word.
 * @param written unsigned 16bit integer.
 */
Register.prototype.writeWord = function( value ) {
  this.uint16[ 0 ] = value ;
} ;

/**
 * Write lower byte. Higher byte will be unchanged.
 * @param written unsigned 8bit integer.
 */
Register.prototype.writeLowByte = function( value ) {
  this.uint8[ 0 ] = value ;
} ;

/**
 * Write higher byte. Lower byte will be unchanged.
 * @param written unsigned 8bit integer.
 */
Register.prototype.writeHighByte = function( value ) {
  this.uint8[ 1 ] = value ;
} ;

/**
 * Partially writte the data of register.
 * For instance, if the data of register is 0001_0010_0011_0100b,
 * value is 10b, offset is 2(bits), and mask is 11b, the result is 0001_0010_0011_1000b.
 * @param value written data.
 * @param offset bit offset from LSB.
 * @param mask mask bit.
 * @see Register.read_partial
 * TODO: change 0xffff to word size unspecific one.
 */
Register.prototype.writePartial = function( value, offset, mask ) {
  this.writeWord( ( this.readWord( ) & ( 0xffff & ~( mask << offset ) ) ) | ( value << offset ) ) ;
} ;

Register.prototype.writeBit = function( bit, value ) {
  this.writePartial( value ? 1 : 0, bit, 1 ) ;
} ;

/**
 * Increment the value of refister by word size and then return the word.
 * This function is assumed to be called for CPU addressing mode.
 * @return incremented value as word.
 * TODO: rename to incrementByWord
 */
Register.prototype.incrementWord = function( ) {
  this.uint16[ 0 ] += 2 ;
  return this.readWord( ) ;
} ;

/**
 * Increment the value of refister by byte size and then return the word.
 * This function is assumed to be called for CPU addressing mode.
 * @return incremented value as word.
 * TODO: rename to incrementByByte
 */
Register.prototype.incrementByte = function( ) {
  this.uint16[ 0 ] += 1 ;
  return this.readWord( ) ;
} ;

/**
 * Decrement the value of refister by word size and then return the word.
 * This function is assumed to be called for CPU addressing mode.
 * @return incremented value as word.
 * TODO: rename to decrementByWord
 */
Register.prototype.decrementWord = function( ) {
  this.uint16[ 0 ] -= 2 ;
  return this.readWord( ) ;
} ;

/**
 * Decrement the value of refister by byte size and then return the word.
 * This function is assumed to be called for CPU addressing mode.
 * @return incremented value as word.
 * TODO: rename to decrementByByte
 */
Register.prototype.decrementByte = function( ) {
  this.uint16[ 0 ] -= 1 ;
  return this.readWord( ) ;
} ;

