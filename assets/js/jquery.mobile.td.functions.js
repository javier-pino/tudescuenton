/**
 * En este archivo se declaran aquellas funcionalidades que se refieren a las operaciones
 * y los datos de la aplicación
 * 
 * Autor: Javier Pino
 * Fecha 10/09/2012
 */
var lock = false;
var server = 'http://107.22.208.22';
//var server = 'http://192.168.1.111';
var timeout = 30000; 

/************** FUNCIONES RELACIONADAS CON EL ENVIO DE MENSAJES ****************/

var messages = []; //Mensajes a mostrar
messages["TIME_OUT"] = 'Se excedió el tiempo de espera de conexión a TuDescuentón';
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
messages["INTEREST_MIN"] = 'Debe indicar al menos un interés';

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
/* */
function clearMessages() {
    $('div#info_message h3').html('');
    $('div#error_message h3').html('');
    $('div#info_message').hide();
    $('div#error_message').hide();
}
/** Quita el loader y hace focus */
function stop_loader_message() {
    $.mobile.hidePageLoadingMsg ();
    window.scrollTo(0, 0);
}

function start_loader() {
    $.mobile.showPageLoadingMsg ();                               
}

/********************* FUNCIONES DE VALIDACIÓN DE INPUT *********************/

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

/********************* FUNCIONES DE PETICIONES AJAX *********************/

/** Procesa las peticiones ajax, toma como parámetro la función a llamar */
function process_ajax_request(request, callback) {
    if (request.readyState != 4)  { return; }                
    if (request.status == 200) {         
        var json = null;
        if (request.responseText != null && request.responseText != '') {                
            json = JSON.parse(request.responseText);                
        }
        if (json != null) {
            callback(json);
        } else {
            setErrorMessage(messages["JSON_NULL"]);            
            stop_loader_message();
        }
    } else {
        setErrorMessage(messages["STATUS_NO_200"]);            
        stop_loader_message();
    }   
}

/** Esta función asigna un timeoput a una peticion */
function request_time_out(request) {
    
    //Se crea el timeout para esa peticion
    var xmlHttpTimeout = setTimeout(function () {                   
        if (request.readyState < 4 ) {             
            request.abort();             
            setErrorMessage(messages["TIME_OUT"]);            
        }   
        stop_loader_message();
    }, timeout);
}

/**************** FUNCIONES DE CONFIGURACION DE LA BD *********************/

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
