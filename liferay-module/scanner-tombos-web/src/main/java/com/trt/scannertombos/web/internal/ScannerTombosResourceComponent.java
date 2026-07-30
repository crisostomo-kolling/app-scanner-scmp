package com.trt.scannertombos.web.internal;

import org.osgi.service.component.annotations.Component;

/**
 * Marker component: nao expoe nenhuma logica, apenas registra os arquivos
 * embutidos em static/ (veja bnd.bnd) como recurso estatico via OSGi HTTP
 * Whiteboard, acessivel em /scanner-tombos/*.
 */
@Component(
	immediate = true,
	property = {
		"osgi.http.whiteboard.context.select=(osgi.http.whiteboard.context.name=default)",
		"osgi.http.whiteboard.resource.pattern=/scanner-tombos/*",
		"osgi.http.whiteboard.resource.prefix=/static"
	},
	service = Object.class
)
public class ScannerTombosResourceComponent {
}
