export const languages = { es: 'Español', en: 'English' } as const;
export const defaultLang = 'es';
export type Lang = keyof typeof languages;

export function getLangFromUrl(url: URL): Lang {
	const [, lang] = url.pathname.split('/');
	if (lang in languages) return lang as Lang;
	return defaultLang;
}

export function useTranslations<T extends Record<Lang, Record<string, string>>>(
	translations: T
) {
	type Keys = keyof T[typeof defaultLang];
	return function t(lang: Lang, key: Keys): string {
		return (translations[lang]?.[key as string] ?? translations[defaultLang]?.[key as string] ?? String(key)) as string;
	};
}

// Podcast slug mapping
const slugMap: Record<string, Record<Lang, string>> = {
	'/programa-tu-mente-podcast': {
		es: '/programa-tu-mente-podcast',
		en: '/en/program-your-mind-podcast',
	},
	'/program-your-mind-podcast': {
		es: '/programa-tu-mente-podcast',
		en: '/en/program-your-mind-podcast',
	},
};

export function getLocalizedPath(currentPath: string, targetLang: Lang): string {
	// Strip existing locale prefix to get the base path
	const cleanPath = currentPath.replace(/^\/(en)(?=\/|$)/, '') || '/';

	// Check slug mapping
	const mapped = slugMap[cleanPath]?.[targetLang];
	if (mapped) return mapped;

	// Default: prepend /en for English, no prefix for Spanish
	if (targetLang === 'es') return cleanPath;
	return `/en${cleanPath === '/' ? '' : cleanPath}`;
}
