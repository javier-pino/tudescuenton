/* 
	jQuery Mobile Boilerplate
	biz.js
*/

//Se asocian los eventos necesarios
$(document).live("pageinit", function(event){
        
    //Se asocian los eventos necesarios        
    $('a[data-role="button"]', 'div.ui-bar').live('click', function () {
        $(this).parents('div.ui-bar').remove();        
    });

    //Se manejan los eventos de swipe en listar cupones
    //Tomado de http://www.andymatthews.net/read/2011/02/18/Adding-iPhone-style-swipe-to-delete-button-to-a-listview-component-in-jQuery-Mobile
    $('div.coupon_mark_link h3').swiperight(function () {
            $('.aDeleteBtn').remove();

            // Create buttons and div container
            var $aDeleteBtn = $('<a>Marcar</a>')
                .attr({
                        'class': 'aDeleteBtn ui-btn-up-r',
                        'href': $(this).attr('data-page')
            });
            $(this).append($aDeleteBtn);
         }       
    );

    $('div.coupon_mark_link h3').swipeleft(function () {        
        $('.aDeleteBtn').remove();
    });

    $('.aDeleteBtn').click(function (event) {        
        event.stopPropagation();
    });

    //Cambia Municipio en caso de que se modifique ciudades
    $('select#city_id').change(function () {

        //Si la ciudad es Caracas
        if ($(this).val() == 1) {
            $('div#municipio_input').hide();
            $('div#municipio_select').show();
        } else {
            $('div#municipio_select').hide();
            $('div#municipio_input').show();
        }
    });

    $('input,textarea').focus(function () {
        $(this).removeAttr('placeholder');       
    });
    

    window.scrollTo(0, 0);    
});
