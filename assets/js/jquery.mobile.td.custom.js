/* 
	jQuery Mobile Boilerplate
	biz.js
*/

//Se asocian los eventos necesarios
$(document).live("pageinit", function(event){
            
    //Se asocian los eventos necesarios        
    $('a[data-role="button"]', 'div.ui-bar').live('click', function () {
        $(this).parents('div.ui-bar').remove(); 
        
        var current= TBL_User.all() ;
        current.list(null, function (results) {
            results.forEach(function (r) {
                alert(r.path);
                alert(r.data);
            });
        });
        
        
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
    
    //Preparar persistencia
    prepare_database('tudescuenton', 
        'Base de datos de persistencia para la app movil', 5 * 1024 * 1024); 
    
    
    //Realizar prueba de persistencia
    var user = new TBL_User();
    user.path = '192.168.1.10';
    user.data = 'Esta es la data';
    persistence.add(user);
    persistence.flush();
    
});

//Declarar las tablas necesarias
var TBL_User = null;

/** Prepara la persistencia y la base de datos */
function prepare_database (database, description, time) {
    
    //Se configura la persistencia
    if (window.openDatabase) { //Se carga la base de datos        
        persistence.store.websql.config(persistence, database, description, time);        
    } else { //Usa la memoria
        persistence.store.memory.config(persistence);
    }      
    persistence.debug = false;
    
    //Definir las tablas
    TBL_User = persistence.define('User', {
        path: "TEXT",
        data: "TEXT"        
    });               
    persistence.schemaSync(); //Configura la base de datos inicial
}

/** Elimina las tablas de tu descuenton */
function remove_database () {
    persistence.reset();    
}