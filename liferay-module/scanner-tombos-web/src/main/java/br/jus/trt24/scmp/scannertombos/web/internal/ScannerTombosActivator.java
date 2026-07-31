package br.jus.trt24.scmp.scannertombos.web.internal;

import java.util.Hashtable;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;

/**
 * Registra a pasta static/ (empacotada dentro deste jar, veja build.bat)
 * como recurso HTTP estatico via OSGi HTTP Whiteboard, acessivel em
 * /o/scanner-tombos/*. Nao ha nenhuma logica de negocio aqui.
 */
public class ScannerTombosActivator implements BundleActivator {

	public void start(BundleContext context) {
		Hashtable<String, Object> properties = new Hashtable<String, Object>();

		properties.put(
			"osgi.http.whiteboard.context.select",
			"(osgi.http.whiteboard.context.name=default)");
		properties.put("osgi.http.whiteboard.resource.pattern", "/scanner-tombos/*");
		properties.put("osgi.http.whiteboard.resource.prefix", "/static");

		_registration = context.registerService(Object.class, new Object(), properties);
	}

	public void stop(BundleContext context) {
		if (_registration != null) {
			_registration.unregister();
		}
	}

	private ServiceRegistration<?> _registration;
}
