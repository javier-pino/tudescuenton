/**
 * En este archivo se declaran aquellas funcionalidades que se refieren al
 * comportamiento de la aplicacion 
 **/

//Se hace la llamada a los binds iniciales
prepare_initial_binds();

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
$(document).delegate('#iniciar' ,"pageinit", function() {    
    $('form#iniciar_sesion').submit(function(event) {        
        start_loader();
        if (lock !== false)
             clearTimeout(lock);
        lock = setTimeout(iniciar_submit, 500);
        return false;
    });       
});
    
//Los eventos necesarios para la página...
$(document).delegate('#registrar' ,"pageinit", function() {  
    
    var request = new XMLHttpRequest();    
    request.open("GET", server + '/td/restful/account/ciudades_municipios', false);
    request_time_out(request);
    request.onreadystatechange = function() {                
        process_ajax_request(request, process_buscar_ciudades);        
    };            
    request.send();   
    
    $('select#city_id').change(function() { //Cambia Municipio en caso de que se modifique ciudades
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
   
    $('form#registrar_usuario').submit(function(event) {            
        start_loader();                     
        if (lock !== false)
             clearTimeout(lock);
        lock = setTimeout(registrar_usuario, 500); 
        return false;        
    });   
});


/** Inicia el submit */
function iniciar_submit() {
    
    clearMessages();        
    var email = $("input#email", 'form#iniciar_sesion').val();
    var password = $("input#password", 'form#iniciar_sesion').val();        
    if (!validInput($('form#iniciar_sesion'))) {
        stop_loader_message();
        return;
    }    
    var request = new XMLHttpRequest();    
    request.open("GET", server + '/td/restful/account/login' 
        + '?email=' + email + '&password=' + password, true);
    request_time_out(request);
    request.onreadystatechange = function() {                
        process_ajax_request(request, process_iniciar_sesion);        
    };            
    request.send();    
}

/** Función que registra al usuario */
function registrar_usuario() {
    
    $form = $('form#registrar_usuario');      
    clearMessages();    
    if (!validInput($form)) { //Hacer validaciones de obligatoriedad
        stop_loader_message();
        return;
    }        
    var field = $form.find('input#realname').val();
    if (field.length > 32) {
        setErrorMessage(messages["REALNAME_MAX"]);
        stop_loader_message();
        return;
    }    
    // Validaciones más complicadas 
    field = $form.find('input#birthday').val();
    if (!validDate(field)) {
        setErrorMessage(messages["INVALID_DATE"]);
        stop_loader_message();
        return;
    }        
    field = $form.find('input#identifier').val();
    if (!validNumber(field)) {
        setErrorMessage(messages["INVALID_ID"]);
        stop_loader_message();
        return;
    }
    field = $form.find('input#mobile').val();
    if (!validNumber(field)) {
        setErrorMessage(messages["INVALID_MOBILE"]);
        stop_loader_message();
        return;
    }   
    field = $form.find('input#email').val();
    if (!validEmail(field)) {
        setErrorMessage(messages["INVALID_EMAIL"]);
        stop_loader_message();
        return;
    }        
    if (field != $form.find('input#email2').val()) {
        setErrorMessage(messages["EMAIL_NOT_MATCH"]);
        stop_loader_message();
        return;
    }    
    field = $form.find('input#password').val();
    if (field.length < 4) {
        setErrorMessage(messages["PASSWORD_MIN_SIZE"]);
        stop_loader_message();
        return;
    }    
    if ($form.find('input#password').val() != 
            $form.find('input#password2').val()) {
        setErrorMessage(messages["PASSWORD_NOT_MATCH"]);
        stop_loader_message();
        return;
    }    
    
    var interest_checked = false;
    var $interest = $form.find('input[name^="interest"]');
    $.each($interest, function (key, $val) { 
        if ($val.checked) {
            interest_checked = true;
            return false;            
        }        
    });    
    if (!interest_checked) {
        setErrorMessage(messages["INTEREST_MIN"]);
        stop_loader_message();
        return;
    }
    
    field = $form.find('input#terminos').attr("checked");    
    if (field != "checked") {
        setErrorMessage(messages["TERMS_UNCHECK"]);
        stop_loader_message();
        return;
    }
    
    //Se crea la variable post y se realiza la petición
    post = encodeURI($form.serialize());    
    var request = new XMLHttpRequest();         
    request.open("POST", server + '/td/restful/account/register', true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");                
    request_time_out(request);
    request.onreadystatechange = function() {                
        process_ajax_request(request, process_registrar_usuario);        
    };        
    request.send(post);            
}

/** Esta función procesa el json de iniciar_sesion */
function process_iniciar_sesion (json) {
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
                setInfoMessage(
                    'Bienvenid@, ' + json.user.realname +
                    ', ingresaste exitosamente usando tu correo: ' 
                    + json.user.email);          
                stop_loader_message();
            });
        });                                 
    } else {
        setErrorMessage(json.message);
        stop_loader_message();
    }   
}

/** Esta función procesa el json de registrar usuario */
function process_registrar_usuario (json) {      
    if (json.status) {        
        setInfoMessage(
            'Bienvenid@, ' + json.user.realname +
            ', te has registrado exitosamente y pronto se te enviará un correo de confirmación');                                                               
    } else {
        setErrorMessage(json.message);        
    }
    stop_loader_message();
}

/**- Esta función procesa la informacióin recibida por buscar_ciudades */
function process_buscar_ciudades (json) {   
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
