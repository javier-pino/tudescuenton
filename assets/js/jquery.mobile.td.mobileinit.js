/* 
	jQuery Mobile Boilerplate
	mobileinit.js
	http://jquerymobile.com/demos/1.0.1/docs/api/globalconfig.html

	This file is only required if you need to apply overrides to the
	page before anything else has run. It MUST be loaded before
	the jQuery Mobile javascript file.
*/
$(document).bind('mobileinit', function(event){
	$.mobile.loadingMessage = "Cargando ...";
        $.mobile.allowCrossDomainPages = true;        
        $.support.cors = true;        
        $.mobile.pageLoadErrorMessage = "Error al cargar la página";        
});