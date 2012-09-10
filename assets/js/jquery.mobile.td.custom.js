//This is used to handle multiple submits events
var lock = false;
var server = 'http://192.168.1.102';
var timeout = 3000; 

//Mensajes a mostrar

var messages = [];
messages["TIME_OUT"] = 'Se excedió; el tiempo de espera de conexión a TuDescuentón';
messages["JSON_NULL"] = "El servidor TuDescuentón no responde";
messages["STATUS_NO_200"] = "El servidor TuDescuentón no responde correctamente";
messages["NO_CITIES"] = "No es posible obtener las ciudades disponibles";
messages["INVALID_DATE"] = 'El  campo "F. Nacimiento" no es una fecha válida: 09/06/1985'
messages["INVALID_ID"] = 'El campo "Cédula" acepta sólo números';
messages["INVALID_MOBILE"] = 'El campo "Tlf. Celular" acepta sólo números';
messages["INVALID_EMAIL"] = 'El campo "Correo Electrónico" no es válido';
messages["EMAIL_NOT_MATCH"] = 'Los campos "Correo Electrónico" y "Confirmar Correo" no coinciden';
messages["PASSWORD_NOT_MATCH"] = 'Los campos "Contraseña" y "Confirmar Contraseña" no coinciden';
messages["TERMS_UNCHECK"] = 'Aceptar los Términos y Condiciones es obligatorio';
messages["PASSWORD_MIN_SIZE"] = 'El campo "Contraseña" debe tener más de 4 caracteres';

//Se asocian los eventos necesarios para TODAS LAS PAGINAS
function prepare_initial_binds() {
            
    //Se asocian los eventos necesarios        
    $(document).delegate('div.ui-bar a[data-role="button"]', 'click', function() { 
        $(this).parent().hide(); 
    });       
    $(document).delegate('input,textarea', 'focus', function() { 
        $(this).removeAttr('placeholder');       
    });   
    //Preparar persistencia
    prepare_database('neo_descuenton', 
        'Base de datos de persistencia para la app movil', 5 * 1024 * 1024);         
    window.scrollTo(0, 0);       
}

//Los eventos necesarios para la página de iniciar
$('#iniciar').bind('pageinit', function () {    
    prepare_initial_binds();       
    $(document).delegate('#iniciar_sesion_button', 'click', function(event) { 
        //Handling android multiple submit, by adding a timeout
        if (lock !== false)
             clearTimeout(lock);
        lock = setTimeout(iniciar_submit, 500);         
    });       
});
    
//Los eventos necesarios para la página...
$('#registrar').bind('pageinit', function () {       
    prepare_initial_binds();    
    buscar_ciudades();
        
    //Cambia Municipio en caso de que se modifique ciudades
    $(document).delegate('select#city_id', 'change', function() {        
        if ($(this).val() == 1) {         //Si la ciudad es Caracas
            $('div#municipio_input').hide();
            $('div#municipio_select').show();
        } else if ($(this).val() != '' && $(this).val() != 1) {
            $('div#municipio_select').hide();
            $('div#municipio_input').show();
        } else {
            $('div#municipio_select').hide();
            $('div#municipio_input').hide();
        }
    });
    
    $(document).delegate('#registrar_usuario_button', 'click', function() {        
        //Handling android multiple submit, by adding a timeout
        if (lock !== false)
             clearTimeout(lock);
        lock = setTimeout(registrar_usuario, 500); 
    });   
});

  
/************  Se realiza la configuracion de la base de datos ****************/

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
    $('a[data-role=button]','div#error_message').focus();
}

/** Permite declarar mensajes informativos */
function setInfoMessage(text) {
    $('div#info_message h3').append('<p>' + text + '</p>');
    $('div#info_message').show();
    $('a[data-role=button]','div#info_message').focus();
}

function clearMessages() {
    $('div#info_message h3').html('');
    $('div#error_message h3').html('');
    $('div#info_message').hide();
    $('div#error_message').hide();
}


/***************** Funciones de validación del input *************/
/** Indica si lel texto es una direccion de correo válida */
function validEmail(dtValue) {    
    var dtRegex = new RegExp(/^.+@.+\..+$/);
    return dtRegex.test(dtValue);
}

/** Indica si el texto es un número válido */
function validNumber(dtValue) {
    if (!dtValue) 
        return false;
    else
        return (!isNaN(dtValue));
}

/** Indica si el texto es una fecha válida */
function validDate(dtValue) {
    //Declare Regex 
    var rxDatePattern = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/;
    var dtArray = dtValue.match(rxDatePattern); 

    if (dtArray == null)
        return false;

    //Checks for mm/dd/yyyy format.
    dtDay= dtArray[1];
    dtMonth = dtArray[3];	  
    dtYear = dtArray[5];

    if (dtMonth < 1 || dtMonth > 12)
        return false;
    else if (dtDay < 1 || dtDay> 31)
        return false;
    else if ((dtMonth==4 || dtMonth==6 || dtMonth==9 || dtMonth==11) && dtDay ==31)
        return false;
    else if (dtMonth == 2)
    {
        var isleap = (dtYear % 4 == 0 && (dtYear % 100 != 0 || dtYear % 400 == 0));
        if (dtDay> 29 || (dtDay ==29 && !isleap))
            return false;
    }
    return true;
}

/** Esta funcion evalua todos aquellos inputs, que estén visibles en el momento
 *actual, cuya clase sea required y retorna falso, si algun valor no esta lleno*/
function validInput($form) {   
    var validate = true;
    $form.find("[data-required='true']:visible").each(
        function () {        
            if (!$(this).val() || $(this).val() == '' ) {                
                setErrorMessage($(this).attr('data-message'));
                validate = false;             
                return false;
            }        
    });
    return validate;
}

/*************** Métodos de ajax *************/
/** Funcion que valida el input */
function iniciar_submit() {

    $.mobile.showPageLoadingMsg ();       
    clearMessages();
        
    var email = $("input#email", 'form#iniciar_sesion').val();
    var password = $("input#password", 'form#iniciar_sesion').val();
        
    if (!validInput($('form#iniciar_sesion'))) {
        $.mobile.hidePageLoadingMsg (); 
        return;
    }
    
    var request = new XMLHttpRequest();    
    request.open("GET", server + '/td/restful/account/login' 
        + '?email=' + email + '&password=' + password, true);
    
    //Se asocia el timeout
    var xmlHttpTimeout = setTimeout(function () {                   
        if (request.readyState < 4 ) {             
            request.abort();                    
            setErrorMessage(messages["TIME_OUT"]);                                    
        }   
        $.mobile.hidePageLoadingMsg ();                        
    }, timeout);      

    //Se asocia el 
    request.onreadystatechange = function() {
        
        if (request.readyState != 4)  { return; }                
        if (request.status == 200) {
            
            var json = null;
            if (request.responseText != null && request.responseText != '') {                
                json = JSON.parse(request.responseText);                
            }
            if (json != null) {
                if (json.status) {
                        TBL_User.all().one(null, function (one) {                    

                        if (one != null) {                        
                            persistence.remove(one);  
                        }                                     
                        var user = new TBL_User();                        
                        user.user_id = json.user.id;
                        user.email = json.user.email;
                        user.gender = json.user.gender;
                        user.cedula = json.user.cedula;
                        user.realname = json.user.realname;
                        persistence.add(user);

                        persistence.flush(null, function () {
                            $.mobile.hidePageLoadingMsg ();                                                                                          
                            setInfoMessage(
                                'Bienvenid@, ' + json.user.realname +
                                ', ingresaste exitosamente usando tu correo: ' 
                                + json.user.email);                
                        });
                    });                                 
                } else {
                    setErrorMessage(json.message);
                    $.mobile.hidePageLoadingMsg ();          
                }
            } else {
                setErrorMessage(messages["JSON_NULL"]);            
                $.mobile.hidePageLoadingMsg (); 
            }
        } else {
            setErrorMessage(messages["STATUS_NO_200"]);            
            $.mobile.hidePageLoadingMsg (); 
        }
    };   
    
    request.send();    
}


/** Busca las ciudades y municipios necesarios */
function buscar_ciudades () {

    var request = new XMLHttpRequest();    
    request.open("GET", server + '/td/restful/account/ciudades_municipios', false);
    
    //Se asocia el timeout
    var xmlHttpTimeout = setTimeout(function () {                   
        if (request.readyState < 4 ) {             
            request.abort();                    
            setErrorMessage(messages["NO_CITIES"]);                                    
        }           
    }, timeout);      

    //Se asocia el 
    request.onreadystatechange = function() {        
        if (request.readyState != 4)  { return; }                
        if (request.status == 200) {            
            var json = null;
            if (request.responseText != null && request.responseText != '')
                json = JSON.parse(request.responseText);
            if (json != null) {
                $select = $('select#city_id');
                $select.html('<option value="">Selecciona tu ciudad</option>');                
                $.each(json['ciudades'], function (key, val) { 
                    $select.append(
                        "<option value='" + key + "'>" + val + "</option"                    
                    );                    
                });   
                $select.selectmenu('refresh');
                
                $select = $('select#city_select');                
                $select.html('<option value="">Selecciona tu municipio</option>');
                $.each(json['municipios'], function (key, val) {                    
                    $select.append(
                        "<option value='" + key + "'>" + val + "</option"                    
                    );                    
                });
                $select.selectmenu('refresh');
                return;
            }
        }
        setErrorMessage(messages["NO_CITIES"]);
    };       
    request.send();    
}


/** Función que registra al usuario */
function registrar_usuario() {
    
    $form = $('form#registrar_usuario');  
    $.mobile.showPageLoadingMsg ();       
    clearMessages();
    
    if (!validInput($form)) { //Hacer validaciones de obligatoriedad
        $.mobile.hidePageLoadingMsg (); 
        return;
    }    
    
    var field = $form.find('input#realname').val();
    if (field.length > 32) {
        setErrorMessage(messages["REALNAME_MAX"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }
    
    // Validaciones más complicadas 
    field = $form.find('input#birthday').val();
    if (!validDate(field)) {
        setErrorMessage(messages["INVALID_DATE"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }
        
    field = $form.find('input#identifier').val();
    if (!validNumber(field)) {
        setErrorMessage(messages["INVALID_ID"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }

    field = $form.find('input#mobile').val();
    if (!validNumber(field)) {
        setErrorMessage(messages["INVALID_MOBILE"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }
   
    field = $form.find('input#email').val();
    if (!validEmail(field)) {
        setErrorMessage(messages["INVALID_EMAIL"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }    
    
    if (field != $form.find('input#email2').val()) {
        setErrorMessage(messages["EMAIL_NOT_MATCH"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }
    
    field = $form.find('input#password').val();
    if (field.length < 4) {
        setErrorMessage(messages["PASSWORD_MIN_SIZE"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }
    
    if ($form.find('input#password').val() != 
            $form.find('input#password2').val()) {
        setErrorMessage(messages["PASSWORD_NOT_MATCH"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }
    
    field = $form.find('input#terminos').attr("checked");    
    if (field != "checked") {
        setErrorMessage(messages["TERMS_UNCHECK"]);
        $.mobile.hidePageLoadingMsg ();
        return;
    }
    
    //Se crea la variable post
    post = encodeURI($form.serialize());
   
    var request = new XMLHttpRequest();         
    request.open("POST", server + '/td/restful/account/register', true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");    
        
    //Se asocia el timeout
    var xmlHttpTimeout = setTimeout(function () {                   
        if (request.readyState < 4 ) {             
            request.abort();                    
            setErrorMessage(messages["TIME_OUT"]);                                    
        }   
        $.mobile.hidePageLoadingMsg ();                        
    }, timeout);      

    //Se asocia el 
    request.onreadystatechange = function() {

        if (request.readyState != 4)  { return; }                
        if (request.status == 200) {

            alert(request.readyState);
            alert(request.status);
            alert(request.responseText);

            var json = null;
            if (request.responseText != null && request.responseText != '') {                
                json = JSON.parse(request.responseText);                
            }
            if (json != null) {
                if (json.status) {                    
                    alert('status fine');                        
                    /*                        
                        TBL_User.all().one(null, function (one) {                    

                        if (one != null) {                        
                            persistence.remove(one);  
                        }                                     
                        var user = new TBL_User();                        
                        user.user_id = json.user.id;
                        user.email = json.user.email;
                        user.gender = json.user.gender;
                        user.cedula = json.user.cedula;
                        user.realname = json.user.realname;
                        persistence.add(user);

                        persistence.flush(null, function () {
                            $.mobile.hidePageLoadingMsg ();                                                                                          
                            setInfoMessage(
                                'Bienvenid@, ' + json.user.realname +
                                ', ingresaste exitosamente usando tu correo: ' 
                                + json.user.email);                
                        });
                    });    
                     */                             
                } else {
                    setErrorMessage(json.message);
                    $.mobile.hidePageLoadingMsg ();          
                }
            } else {
                setErrorMessage(messages["JSON_NULL"]);            
                $.mobile.hidePageLoadingMsg (); 
            }
        } else {
            setErrorMessage(messages["STATUS_NO_200"]);            
            $.mobile.hidePageLoadingMsg (); 
        }
    };       
    request.send(post);            
}