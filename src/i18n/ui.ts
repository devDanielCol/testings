const year = new Date().getFullYear();

export const ui = {
	es: {
		// Navigation
		'nav.home': 'Inicio',
		'nav.projects': 'Proyectos',
		'nav.blog': 'Blog',
		'nav.podcast': 'Podcast',
		'nav.about': 'Sobre mí',
		'nav.openMenu': 'Abrir menú',
		'nav.closeMenu': 'Cerrar menú',
		'nav.mobileFooter': 'Daniel Cubillos',

		// Footer
		'footer.copyright': `© ${year} Daniel Cubillos. Todos los derechos reservados.`,
		'footer.builtWith': 'Hecho con',

		// Language switcher
		'lang.switchTo': 'Cambiar idioma',
	},
	en: {
		// Navigation
		'nav.home': 'Home',
		'nav.projects': 'Projects',
		'nav.blog': 'Blog',
		'nav.podcast': 'Podcast',
		'nav.about': 'About',
		'nav.openMenu': 'Open menu',
		'nav.closeMenu': 'Close menu',
		'nav.mobileFooter': 'Daniel Cubillos',

		// Footer
		'footer.copyright': `© ${year} Daniel Cubillos. All rights reserved.`,
		'footer.builtWith': 'Built with',

		// Language switcher
		'lang.switchTo': 'Switch language',
	},
} as const;
