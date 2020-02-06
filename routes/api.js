//. api.js

var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    router = express.Router();
var settings = require( '../settings' );

//. https://www.npmjs.com/package/@cloudant/cloudant
var Cloudantlib = require( '@cloudant/cloudant' );
var cloudant = null;
var db = null;

if( !settings.db_host ){
  cloudant = Cloudantlib( { account: settings.db_username, password: settings.db_password } );
}else{
  var url = settings.db_protocol + '://';
  if( settings.db_username && settings.db_password ){
    url += ( settings.db_username + ':' + settings.db_password + '@' );
  }
  url += ( settings.db_host + ':' + settings.db_port );
  cloudant = Cloudantlib( url );
}

if( cloudant ){
  cloudant.db.get( settings.db_name, function( err, body ){
    if( err ){
      if( err.statusCode == 404 ){
        cloudant.db.create( settings.db_name, function( err, body ){
          if( err ){
            db = null;
          }else{
            db = cloudant.db.use( settings.db_name );
          }
        });
      }else{
        db = cloudant.db.use( settings.db_name );
      }
    }else{
      db = cloudant.db.use( settings.db_name );
    }
  });
}

router.use( bodyParser.urlencoded( { extended: true } ) );
router.use( bodyParser.json() );

router.get( '/items', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db ){
    var _limit = req.query.limit ? parseInt( req.query.limit ) : 0;
    var _offset = req.query.offset ? parseInt( req.query.offset ) : 0;
    var limit = isNaN( _limit ) ? 0 : _limit;
    var offset = isNaN( _offset ) ? 0 : _offset;
    db.list( function( err, result ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err } ) );
        res.end();
      }else{
        var item_ids = [];
        result.rows.forEach( function( item ){
          item_ids.push( item.id );
        });

        if( offset ){
          if( limit ){
            item_ids = item_ids.slice( offset, limit );
          }else{
            item_ids = item_ids.slice( offset );
          }
        }else if( limit ){
          item_ids = item_ids.slice( 0, limit );
        }

        res.write( JSON.stringify( { status: true, item_ids: item_ids } ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.get( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db ){
    var id = req.params.id;
    if( id ){
      db.get( id, { include_docs: true }, function( err, item ){
        if( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err } ) );
          res.end();
        }else{
          delete item['_rev'];
          res.write( JSON.stringify( { status: true, item: item } ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'parameter id not specified.' } ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.post( '/item', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db ){
    var item = req.body;
    if( item ){
      db.insert( item, function( err, body, header ){
        if( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err } ) );
          res.end();
        }else{
          res.write( JSON.stringify( { status: true, item: body } ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no post data found.' } ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.put( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db ){
    var id = req.params.id;
    if( id ){
      var item = req.body;
      if( item ){
        db.get( id, { include_docs: true }, function( err, body, header ){
          if( err ){
            res.status( 400 );
            res.write( JSON.stringify( { status: false, error: err } ) );
            res.end();
          }else{
            for( var key in item ){
              body[key] = item[key];
            }
            db.insert( body, function( err, body ){
              if( err ){
                res.status( 400 );
                res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
                res.end();
              }else{
                res.write( JSON.stringify( { status: true, item: body }, 2, null ) );
                res.end();
              }
            });
          }
        });
      }else{
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: 'no post data found.' } ) );
        res.end();
      }
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'parameter id not specified.' } ) );
      res.end();
    }
    var item = req.body;
    if( item ){
      db.insert( item, function( err, body, header ){
        if( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err } ) );
          res.end();
        }else{
          res.write( JSON.stringify( { status: true, item: body } ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no post data found.' } ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});

router.delete( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( db ){
    var id = req.params.id;
    if( id ){
      db.get( id, null, function( err, body, header ){
        if( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err } ) );
          res.end();
        }else{
          var rev = body._rev;
          db.destroy( id, rev, function( err, body, header ){
            if( err ){
              res.status( 400 );
              res.write( JSON.stringify( { status: false, error: err } ) );
              res.end();
            }else{
              res.write( JSON.stringify( { status: true } ) );
              res.end();
            }
          });
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'parameter id not specified.' } ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'db is not initialized.' } ) );
    res.end();
  }
});


module.exports = router;
