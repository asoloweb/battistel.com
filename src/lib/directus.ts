import { Agent } from 'undici';

const rawDirectusUrl =
	import.meta.env.PUBLIC_DIRECTUS_URL ||
	import.meta.env.DIRECTUS_URL ||
	'https://battistel.prometeo.com';

export const DIRECTUS_URL = rawDirectusUrl.replace(/\/+$/, '');
const shouldRejectUnauthorized =
	(
		import.meta.env.DIRECTUS_TLS_REJECT_UNAUTHORIZED ||
		(DIRECTUS_URL.includes('battistel.prometeo.com') ? 'false' : 'true')
	) !== 'false';
const directusDispatcher =
	DIRECTUS_URL.startsWith('https://') && !shouldRejectUnauthorized
		? new Agent({
				connect: {
					rejectUnauthorized: false,
				},
			})
		: undefined;

export function directusItemsUrl(path: string) {
	const cleanedPath = path.replace(/^\/+/, '');
	return new URL(`/items/${cleanedPath}`, DIRECTUS_URL);
}

export function directusFetch(input: URL | string, init: RequestInit = {}) {
	if (!directusDispatcher) {
		return fetch(input, init);
	}

	return fetch(input, {
		...init,
		dispatcher: directusDispatcher,
	} as RequestInit & { dispatcher: Agent });
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
