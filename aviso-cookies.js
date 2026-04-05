const botonAceptarCookies = document.getElementById('btn-aceptar-cookies');
const avisoCookies = document.getElementById('aviso-cookies');
const fondoAvisoCookies = document.getElementById('fondo-aviso-cookies');

window.dataLayer = window.dataLayer || [];

// Only proceed if all elements exist
if (botonAceptarCookies && avisoCookies && fondoAvisoCookies) {
	try {
		if (!localStorage.getItem('cookies-aceptadas')) {
			avisoCookies.classList.add('activo');
			fondoAvisoCookies.classList.add('activo');
		} else {
			window.dataLayer.push({'event': 'cookies-aceptadas'});
		}

		botonAceptarCookies.addEventListener('click', () => {
			avisoCookies.classList.remove('activo');
			fondoAvisoCookies.classList.remove('activo');

			try {
				localStorage.setItem('cookies-aceptadas', 'true');
			} catch (e) {
				console.warn('localStorage not available:', e);
			}

			window.dataLayer.push({'event': 'cookies-aceptadas'});
		});
	} catch (e) {
		console.warn('Cookie banner error:', e);
	}
}