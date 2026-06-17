const rawDirectusUrl =
	import.meta.env.PUBLIC_DIRECTUS_URL ||
	import.meta.env.DIRECTUS_URL ||
	'https://admin.battistel.com';

function normalizeDirectusUrl(value: string) {
	const cleaned = value.trim().replace('battistel.prometeo.com', 'admin.battistel.com');
	if (!cleaned) return 'https://admin.battistel.com';
	if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
	return `https://${cleaned}`;
}

const normalizedDirectusUrl = normalizeDirectusUrl(rawDirectusUrl);

export const DIRECTUS_URL = normalizedDirectusUrl.replace(/\/+$/, '');

export function directusItemsUrl(path: string) {
	const cleanedPath = path.replace(/^\/+/, '');
	return new URL(`/items/${cleanedPath}`, DIRECTUS_URL);
}

export function directusFetch(input: URL | string, init: RequestInit = {}) {
	return fetch(input, init);
}

type DirectusAssetOptions = {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png';
};

export function directusAssetUrl(value: string | undefined, options: DirectusAssetOptions = {}) {
	if (!value) return '';

	// Keep options in the signature for backward compatibility, but do not append
	// any transform params: image rendering is controlled via CSS only.
	const applyTransforms = (url: URL) => url.toString();

	if (value.startsWith('http://') || value.startsWith('https://')) {
		try {
			const url = new URL(value);
			if (url.origin !== DIRECTUS_URL || !url.pathname.startsWith('/assets/')) {
				return value;
			}
			return applyTransforms(url);
		} catch {
			return value;
		}
	}

	if (value.startsWith('/assets/')) {
		return applyTransforms(new URL(value, DIRECTUS_URL));
	}

	if (value.startsWith('/')) {
		return value;
	}

	return applyTransforms(new URL(`/assets/${value}`, DIRECTUS_URL));
}
