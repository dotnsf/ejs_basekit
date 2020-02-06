//. jquery puzzle
var slide_settings = {
  rows: 4,
  cols: 4,
  hole: 16,
  shuffle: true,
  numbers: true,
  language: 'ja',
  control: {
    shufflePieces: false,
    confirmShuffle: true,
    toggleOriginal: true,
    toggleNumbers: true,
    counter: true,
    timer: true,
    pauseTimer: true
  },
  success: {
    fadeOriginal: false,
    callback: function( result ){
      var data = { moves: result.moves, seconds: result.seconds };
      alert( '移動回数: ' + result.moves + '回, かかった時間: ' + result.seconds + '秒' );

      $.ajax({
        url: '/api/result',
        type: 'POST',
        data: data,
        success: function( body ){
          //. { status: true, result: { .. } }
          $.ajax({
            url: '/api/results',
            type: 'GEt',
            success: function( body ){
              //. { status: true, results: [{ .. }, ..] }
              if( body && body.status ){
                var results = JSON.parse( JSON.stringify( body.results ) );
                results.sort( sortByMoves );
                var message = '';
                for( var i = 0; i < 10 && i < results.length; i ++ ){
                  var r = results[i];
                  var rank = "(" + ( i + 1 ) + "): " + r.moves + " : " + r.seconds;
                  if( r.moves == data.moves && r.seconds == data.seconds ){
                    rank += " * <--";
                  }

                  rank += "\n";
                  message += rank;
                }
                alert( message );
              }
            },
            error: function( e0, e1, e2 ){
              console.log( e1 + " : " + e2 );
            }
          });
        },
        error: function( e0, e1, e2 ){
          alert( "記録に失敗しました。オフライン時には記録はできません。" );
          console.log( e1 + " : " + e2 );
        }

      });
    },
    callbackTimeout: 300
  },
  animation: {
    shuffleRounds: 3,
    shuffleSpeed: 800,
    slidingSpeed: 200,
    fadeOriginalSpeed: 600
  },
  style: {
    gridSize: 2,
    overlap: true,
    backgroundOpacity: 0.1
  }
};
var slide_texts = {
  shuffleLabel: 'シャッフル',
  toggleOriginalLabel: '元画像',
  toggleNumbersLabel: '数値表示／非表示',
  confirmShuffleMessage: 'シャッフルしてよろしいですか？',
  movesLabel: '回',
  secondsLabel: '秒'
};

var nexturl = '';
var inner = '';
var displaySlide = 0;
$(function(){
  $.ajax({
    type: 'GET',
    url: '/api/categories',
    success: function( result ){
      if( result && result.length ){
        result.forEach( function( category ){
          var option = '<option value="' + category.url + '">' + category.name + '</option>';
          $('#categories').append( option );
        });

        $('#categories').change( function(){
          inner = '';
          $('#mycarousel').html( inner );

          var url = $(this).val();
          //console.log( 'url = ' + url );
          if( url ){
            if( url.indexOf( '/label' ) > -1 ){
              $('#search').css( 'display', 'none' );
              showByUrl( url );
            }else{
              $('#search').val( '' );
              $('#search').css( 'display', 'block' );
              $('#searchform').submit( function(){
                search( $('#search').val() );
                return false;
              });
            }
          }
        });

        $('#iModal').modal();
      }
    },
    error: function( xhr, err, status ){
      console.log( err );
    }
  });
});

function search( keyword ){
  if( keyword ){
    $.ajax({
      type: 'GET',
      url: '/api/search?q=' + keyword,
      success: function( data ){
        //console.log( data );
        nexturl = data.next;
        if( data && data.list ){
          data.list.forEach( function( item ){
            var figure = '<figure>'
              + '<p class="caption">' + item.name + '</p>'
              + '<a href ="#" title="' + item.name + '" onClick="imgClick(\'' + item.img_src + '\');">'
              + '<img src="' + item.img_src + '" width="100%" alt="' + item.name + '"/>'
              + '</a>'
              + '</figure>';
            inner += figure;
            //$('#mycarousel').append( figure );
          });

          $('#mycarousel').html( '<div id="mycarousel-inner"></div>' );
          $('#mycarousel-inner').html( inner );
          $('#mycarousel-inner').slick({
            arrows: true,
            autoplay: false,
            infinite: false,
            initialSlide: displaySlide,
            slidesToShow: 1,
            slidesToScroll: 1
          });
          $('#mycarousel-inner').on( 'afterChange', function( evt, slick, currentSlide ){
            //console.log( 'currentSlide: ' + currentSlide );
            if( nexturl && currentSlide + 1 == slick.slideCount ){
              displaySlide = currentSlide;
              showByUrl( nexturl );
            }
          });
        }
      },
      error: function( xhr, err, status ){
        console.log( err );
      }
    });
  }
}

function showByUrl( url ){
  //console.log( 'showByUrl : url = ' + url );
  if( url ){
    $.ajax({
      type: 'GET',
      url: '/api/category_list?url=' + url,
      success: function( data ){
        //console.log( data );
        nexturl = data.next;
        if( data && data.list ){
          data.list.forEach( function( item ){
            var figure = '<figure>'
              + '<p class="caption">' + item.name + '</p>'
              + '<a href ="#" title="' + item.name + '" onClick="imgClick(\'' + item.img_src + '\');">'
              + '<img src="' + item.img_src + '" width="100%" alt="' + item.name + '"/>'
              + '</a>'
              + '</figure>';
            inner += figure;
            //$('#mycarousel').append( figure );
          });

          $('#mycarousel').html( '<div id="mycarousel-inner"></div>' );
          $('#mycarousel-inner').html( inner );
          $('#mycarousel-inner').slick({
            arrows: true,
            autoplay: false,
            infinite: false,
            initialSlide: displaySlide,
            slidesToShow: 1,
            slidesToScroll: 1
          });
          $('#mycarousel-inner').on( 'afterChange', function( evt, slick, currentSlide ){
            //console.log( 'currentSlide: ' + currentSlide );
            if( nexturl && currentSlide + 1 == slick.slideCount ){
              displaySlide = currentSlide;
              showByUrl( nexturl );
            }
          });
        }
      },
      error: function( xhr, err, status ){
        console.log( err );
      }
    });
  }
}

function imgClick( img_url ){
  //alert( img_url );
  $('body').removeClass( 'modal-open' );
  $('.modal-backdrop').remove();
  $('#iModal').modal( 'hide' );

  $('#slidegame_img').prop( 'src', img_url );
  //$('#slidegame_img').prop( 'width', '600' );

  var t = $('img.jqPuzzle');
  t.jqPuzzle( slide_settings, slide_texts );
}

function sortByMoves( a, b ){
  var r = 0;
  if( a.moves < b.moves ){
    r = -1;
  }else if( a.moves > b.moves ){
    r = 1;
  }

  return r;
}
