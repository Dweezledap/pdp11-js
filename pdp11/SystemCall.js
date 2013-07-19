// trace must be global.

var wait_flag = false ;
var fork_flag = false ;

var SystemCall = {

   0 : { name : 'indir',   argc : 1,
         run : function( pdp11, proc, code, ahead ) {
           var tmp = ahead.shift( ) ;
           pdp11.nextStep( ) ;
           var sys_op = proc.get_word( tmp ) ;
           var backup = pdp11.regs[ 7 ].get( ) ;
           pdp11.regs[ 7 ].set( tmp ) ;
           var buffer = '{'
                      + SystemCall[ sys_op & 0377 ].name ;
           for( var i = 0; i < SystemCall[ sys_op & 0377 ].argc; i++ ) {
             buffer += ' ' + sprintf( 16, proc.get_word( pdp11.regs[ 7 ].get( ) + 2 + i * 2 ), 5 ) ;
           }
           SystemCall[ sys_op & 0377 ].run( pdp11, proc, code, ahead ) ;
           buffer += '}' ;
           trace.append( buffer ) ;
           if( ( sys_op & 0377 ) != 11 )
             pdp11.regs[ 7 ].set( backup ) ;
       } },
   1 : { name : 'exit',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           proc.exit_flag = true ;
           pdp11.regs[ 0 ].set( 1 ) ;
           pdp11.ps.c = false ;
           if( proc_queue.length != 0 )
             Kernel.swtch( proc ) ;
           proc.set_word( pdp11.regs[ 6 ].get( ), 1 ) ; // temporary
       } },
   2 : { name : 'fork',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           // not implemented yet
           Kernel.newproc( proc ) ;
           pdp11.nextStep( ) ;
           pdp11.regs[0].set( 1 ) ;
       } },
   3 : { name : 'read',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var buffer = '('
                      + 'buffer:' + sprintf( 16, opr1, 5 )
                      + ' length:' + sprintf( 16, opr2, 5 )
                      + ' r0:' + sprintf( 16, pdp11.regs[ 0 ].get( ), 5 )
                      + ')' ;
           trace.append( buffer ) ;
           var count = 0 ;
           if( pdp11.regs[ 0 ].get( ) == 0 ) { // stdin
             if( opr2 > stdin.length )
               opr2 = stdin.length ;
             for( var i = 0; i < opr2; i++ ) {
               proc.set_byte( opr1++, stdin.shift( ) ) ;
               count++ ;
             }
           } else {
             var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
             if( opr2 > f.inode.size( ) - f.offsetr )
               opr2 = f.inode.size( ) - f.offsetr ;
             var file = object( File ).create( f.inode ) ;
             for( var i = 0; i < opr2; i++ ) {
               proc.set_byte( opr1++, file.byte_data( f.offsetr++ ) ) ;
               count++ ;
             }
           }
           pdp11.regs[ 0 ].set( count ) ;
           pdp11.ps.c = false ;
       } },
   4 : { name : 'write',   argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           var result = '' ;
           var result_hex = '' ;
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) );
           var opr1_org = opr1 ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var opr2_org = opr2 ;
           var count = 0 ;
           if( pdp11.regs[ 0 ].get( ) == 1 ) { // stdout
             while( proc.get_byte( opr1 ) ) {
               if( pdp11.regs[ 0 ].get( ) == 1 ) {
                 result += String.fromCharCode( proc.get_byte( opr1 ) ) ;
                 result_hex = sprintf( 16, proc.get_byte( opr1 ), 2 ) ;
               }
               opr1++ ;
               count++ ;
             }
           } else {
             var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
             var file = object( File ).create( f.inode ) ;
//             if( opr2 > f.inode.size( ) - f.offsetw )
//               expand.size( ) ;?
             for( var i = 0; i < opr2; i ++ ) {
               // too slow and heavy logic
               // it's better to place in another class
               if( ! file.inode.is_ILARG( ) ) {
                 if( ! file.inode.addr( parseInt( f.offsetw / 512 ) ) ) {
                   file.inode.set_addr( parseInt( f.offsetw / 512 ), Kernel.alloc( ) ) ;
                 }
               }
               file.set_byte_data( f.offsetw++, proc.get_byte( opr1++ ) ) ;
               count++ ;
             }
             if( f.inode.size( ) < f.offsetw ) {
               f.inode.set_size( f.offsetw ) ;
             }
           }
           runview.value += result ;
           if( terminal )
             terminal.value += result ;
           var buffer  = ' ('
                       + 'strings:\'' + result.replace( /\n/g, "\\n" ) + '\'(' + result_hex + ')'
                       + ' buffer:' + sprintf( 16, opr1_org, 5 )
                       + ' length:' + sprintf( 16, opr2_org, 5 )
                       + ' r0:' + sprintf( 16, pdp11.regs[ 0 ].get( ), 5 )
                       + ')' ;
           trace.append( buffer ) ;
           pdp11.regs[ 0 ].set( count ) ;
       } },
   5 : { name : 'open',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.regs[ 0 ].set( 0 ) ;
             pdp11.ps.c = true ;
             return ;
           }
           var num = Kernel.falloc( proc, inode ) ;
           pdp11.regs[ 0 ].set( num ) ;
       } },
   6 : { name : 'close',   argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
           if( f ) {
             proc.files[ pdp11.regs[ 0 ].get( ) ] = null ;
           }
       } },
   7 : { name : 'wait',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           Kernel.swtch( proc ) ;
       } },
   8 : { name : 'creat',   argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             inode = Kernel.maknod( ) ;
           } else {
             for( var i = 0; i < 8; i++ ) {
               var index = inode.addr( i ) ;
               if( index )
                 superblock.push_free( index ) ;
               inode.set_addr( i, 0 ) ;
             }
             inode.set_size( 0 ) ;
           }
           var num = Kernel.falloc( proc, inode ) ;
           pdp11.regs[ 0 ].set( num ) ;
           pdp11.ps.c = false ;
       } },
   9 : { name : 'link',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.ps.c = true ;
             return ;
           }

           var path2 = '' ;
           while( proc.get_byte( opr2 ) ) {
             path2 += String.fromCharCode( proc.get_byte( opr2 ) ) ;
             opr2++ ;
           }
           var inode2 = Kernel.namei( path2 ) ;
           if( inode2 ) {
             pdp11.ps.c = true ;
             return ;
           }
           Kernel.wdir( inode ) ;
           pdp11.ps.c = false ;
       } },
  10 : { name : 'unlink',  argc : 1,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.ps.c = true ;
             return ;
           }
           u_dir.remove_entry( u_index ) ;
           pdp11.ps.c = false ;
       } },
  11 : { name : 'exec',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             pdp11.ps.c = true ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.regs[ 0 ].set( 0 ) ;
             return ;
           }
           var args = '' ;
           var addr = 0 ;
           var str  = '' ;
           var first = true ;
           while( addr = proc.get_word( opr2 ) ) {
             while( str = proc.get_byte( addr++ ) ) {
               if( ! first )
                 args += String.fromCharCode( str ) ;
             }

             if( ! first )
               args += ' ' ;
             opr2 += 2 ;
             first = false ;
           }

           var file = object( File ).create( inode ) ;

           if( ! file.isExe( ) )
             return ;

           var old_argview_value = argview.value ;
           argview.value = args.trim( ) ;
           var exe = object( Exe ).create( file ) ;

           proc.load( exe ) ;
           proc.init( ) ;

       } },
  12 : { name : 'chdir',   argc : 1,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.ps.c = true ;
             return ;
           }
           if( ! inode.is_IFDIR( ) ) {
             pdp11.ps.c = true ;
             return ;
           }
           current_dir_i_number = inode.i_number ;
       } },
  13 : { name : 'time',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           var now = parseInt( ( new Date( ) ).getTime( ) / 1000 ) ;
           pdp11.regs[ 0 ].set( ( now & 0xffff0000 ) >> 16 ) ;
           pdp11.regs[ 1 ].set( now & 0xffff ) ;
       } },
  14 : { name : 'mknod',   argc : 3,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr3 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( inode ) {
             pdp11.ps.c = true ;
             return ;
           }
           var ino = Kernel.makdir( opr2 ) ;
           ino.set_addr( 0, opr3 ) ;
           pdp11.ps.c = false ;
       } },
  15 : { name : 'chmod',   argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode )
             return ;
           inode.set_mode( opr2 & 0xffff ) ;
       } },
  16 : { name : 'chown',   argc : 2,
         // not implemented yet
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
       } },
  17 : { name : 'break',   argc : 1,
         // not implemented yet
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
       } },
  18 : { name : 'stat',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.ps.c = true ;
             return ;
           }
           proc.set_word( opr2, 0 ) ; // dev : temporary
           opr2 += 2 ;
           proc.set_word( opr2, inode.i_number ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.mode( ) ) ;
           opr2 += 2 ;
           proc.set_byte( opr2++,  inode.nlink( ) ) ;
           proc.set_byte( opr2++,  inode.uid( ) ) ;
           proc.set_byte( opr2++,  inode.gid( ) ) ;
           proc.set_byte( opr2++,  inode.size0( ) ) ;
           proc.set_word( opr2, inode.size1( ) ) ;
           opr2 += 2 ;
           for( var i = 0; i < 8; i++ ) {
             proc.set_word( opr2, inode.addr( i ) ) ;
             opr2 += 2 ;
           }
           proc.set_word( opr2, inode.atime( 0 ) ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.atime( 1 ) ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.mtime( 0 ) ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.mtime( 1 ) ) ;
           opr2 += 2 ;
       } },
  19 : { name : 'seek',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           // is this right?
           if( pdp11.regs[ 0 ].get( ) >= 0 && pdp11.regs[ 0 ].get( ) <= 2 )
             return ;
           var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
           if( opr2 > 2 ) {
             opr1 *= 512 ;
             opr2 -= 3 ;
           }
           switch( opr2 ) {

             case 0:
               f.offsetr = opr1 ;
               f.offsetw = opr1 ;
               break ;

             case 1:
               f.offsetr += opr1 ;
               f.offsetw += opr1 ;
               break ;

             case 2:
               var inode = f.inode ;
               f.offsetr = inode.size( ) + opr1 ;
               f.offsetw = inode.size( ) + opr1 ;
               break ;

             default:
               break ;

           }
       } },
  20 : { name : 'getpid',  argc : 0,
         run : function( pdp11, proc, code, ahead ) {
         // not implemented yet.
       } },
  21 : { name : 'mount',   argc : 3 },
  22 : { name : 'unmount', argc : 1 },
  23 : { name : 'setuid',  argc : 0,
         run : function( pdp11, proc, code, ahead ) {
         // not implemented yet.
       } },
  24 : { name : 'setgid',  argc : 0,
         run : function( pdp11, proc, code, ahead ) {
         // not implemented yet.
       } },
  25 : { name : 'stime',   argc : 0 },
  26 : { name : 'ptrace',  argc : 3 },
  28 : { name : 'fstat',   argc : 1,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
           var inode = f.inode ;
           proc.set_word( opr1, 0 ) ; // dev : temporary
           opr1 += 2 ;
           proc.set_word( opr1, inode.i_number ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.mode( ) ) ;
           opr1 += 2 ;
           proc.set_byte( opr1++,  inode.nlink( ) ) ;
           proc.set_byte( opr1++,  inode.uid( ) ) ;
           proc.set_byte( opr1++,  inode.gid( ) ) ;
           proc.set_byte( opr1++,  inode.size0( ) ) ;
           proc.set_word( opr1, inode.size1( ) ) ;
           opr1 += 2 ;
           for( var i = 0; i < 8; i++ ) {
             proc.set_word( opr1, inode.addr( i ) ) ;
             opr1 += 2 ;
           }
           proc.set_word( opr1, inode.atime( 0 ) ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.atime( 1 ) ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.mtime( 0 ) ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.mtime( 1 ) ) ;
           opr1 += 2 ;
       } },
  30 : { name : 'smdate',  argc : 1 },
  31 : { name : 'stty',    argc : 1 },
  32 : { name : 'gtty',    argc : 1 },
  34 : { name : 'nice',    argc : 0 },
  35 : { name : 'sleep',   argc : 0 },
  36 : { name : 'sync',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
         // not implemented yet.
       } },
  37 : { name : 'kill',    argc : 0 },
  38 : { name : 'switch',  argc : 0 },
  41 : { name : 'dup',     argc : 0,
         run : function( pdp11, proc, code, ahead ) {
         // not implemented yet.
       } },
  42 : { name : 'pipe',    argc : 0 },
  43 : { name : 'times',   argc : 1 },
  44 : { name : 'prof',    argc : 4 },
  45 : { name : 'tiu',     argc : 0 },
  46 : { name : 'setgid',  argc : 0 },
  47 : { name : 'getgid',  argc : 0 },
  48 : { name : 'sig',     argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
         // not implemented yet.
       } }


} ;
