//This is used to handle multiple submits events
var lock = false;
var server = 'http://192.168.1.118';
//Se asocian los eventos necesarios para TODAS LAS PAGINAS
function prepare_initial_binds() {
      
     alert('Initial binds'); 
      
    //Se asocian los eventos necesarios        
    $('a[data-role="button"]', 'div.ui-bar').live('click', function () {
        $(this).parent().hide(); 
    });
   
    $('input,textarea').live('focus', function () {
        $(this).removeAttr('placeholder');       
    });
        
    //Preparar persistencia
    prepare_database('neo_descuenton', 
        'Base de datos de persistencia para la app movil', 5 * 1024 * 1024); 
   
    window.scrollTo(0, 0);    
    
    //Probar la base de datos
    $('#testing_user').live('click', function(event) {
        
        event.preventDefault();
        
        alert('Usuario Almacenado');
        //Buscar al usuario logueado
        var current= TBL_User.all() ;
        current.list(null, function (results) {
            results.forEach(function (r) {
                alert(r.realname);
                alert(r.email);                
            });
        });
        
    });
    
}

//Los eventos necesarios para la página de iniciar
$('#iniciar').bind('pageinit', function () {
    
    alert('Iniciar');
    
    prepare_initial_binds();
    
    $('form#iniciar_sesion').live('submit', function (event) { 
        event.preventDefault();
        
        $.mobile.showPageLoadingMsg ();
        
        //Handling android multiple submit, by adding a timeout
        if (lock !== false)
             clearTimeout(lock);
        lock = setTimeout(iniciar_submit, 500); 

    });    
});

//Los eventos necesarios para la página...
$('#registrar').bind('pageinit', function () {
    
    alert('Registrar binds');
    
    prepare_initial_binds();
        
    //Cambia Municipio en caso de que se modifique ciudades
    $('select#city_id').live('change', function () {

        //Si la ciudad es Caracas
        if ($(this).val() == 1) {
            $('div#municipio_input').hide();
            $('div#municipio_select').show();
        } else {
            $('div#municipio_select').hide();
            $('div#municipio_input').show();
        }
    });

});

/** Funcion que valida el input */
function iniciar_submit() {
    
    alert('Iniciar submit');
    
    
    clearMessages();
        
    var email = $("input#email", 'form#iniciar_sesion').val();
    var password = $("input#password", 'form#iniciar_sesion').val();
    
    //If required attribute is not available, validate
    if (!email) {        
        setErrorMessage("El campo 'Correo' es Obligatorio");                
    }
    if (!password) {
        setErrorMessage("El campo 'Contraseña' es Obligatorio");        
    }
         
    $.ajax({
        url: server + '/td/restful/account/login',
        type: 'POST',
        data:  {
            email: email,
            password: password          
        },
        dataType : "json",
        timeout: 6000,
        success : function (json) {

             if (json.status) {
                setInfoMessage(
                    'Bienvenid@, ' + json.user.realname +
                    ', ingresaste exitosamente usando tu correo: ' + json.user.email);                
                
                var current= TBL_User.all() ;
                current.list(null, function (results) {
                    results.forEach(function (r) {
                        persistence.remove(r);                                 
                    });
                });
                persistence.flush(
                    null, function() {                        
                        //Almacenar el usuario registrado
                        var user = new TBL_User();
                        user.user_id = json.user.id;
                        user.email = json.user.email;
                        user.gender = json.user.gender;
                        user.cedula = json.user.cedula;
                        user.realname = json.user.realname;
                        persistence.add(user);
                        persistence.flush();
                        
                        $.mobile.hidePageLoadingMsg ();          
                    });                                  
             } else {
                 setErrorMessage(json.message);
                 $.mobile.hidePageLoadingMsg ();          
             }                        
        },
        error: function () {                        
            setErrorMessage('No es posible conectarse al servidor');            
            $.mobile.hidePageLoadingMsg ();          
        }
     });     
}

/************  Se realiza la configuracion de la base de datos ****************/

//Declarar las tablas necesarias
var TBL_User = null;

/** Prepara la persistencia y la base de datos */
function prepare_database (database, description, time) {
    
    alert('Prepared database');
    
    //Se configura la persistencia
    if (window.openDatabase) { //Se carga la base de datos        
        persistence.store.websql.config(persistence, database, description, time);        
    } else { //Usa la memoria
        persistence.store.memory.config(persistence);
    }      
    //persistence.debug = false;
    
    //Definir las tablas
    TBL_User = persistence.define('TBL_User', {
        user_id: "BIGINT",
        email: "TEXT",
        realname: "TEXT", 
        gender: "TEXT",        
        cedula: "TEXT"        
    });               
    persistence.schemaSync(); //Configura la base de datos inicial
}

/** Elimina las tablas de tu descuenton */
function remove_database () {
    persistence.reset();    
}


/*************  Métodos de envios de mensajes ******************/

/** Permite declarar mensajes informativos */
function setErrorMessage(text) {        
    $('div#error_message h3').append('<p>' + text + '</p>');
    $('div#error_message').show();
}

/** Permite declarar mensajes informativos */
function setInfoMessage(text) {
    $('div#info_message h3').append('<p>' + text + '</p>');
    $('div#info_message').show();
}

function clearMessages() {
    $('div#info_message h3').html('');
    $('div#error_message h3').html('');
    $('div#info_message').hide();
    $('div#error_message').hide();
}