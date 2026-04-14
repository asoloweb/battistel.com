import { slugifyLabel } from './slug';

type ProductSlugSource = {
	id?: number;
	titolo?: string;
	codice_prodotto?: string;
};

export function getProductTitle(product: ProductSlugSource) {
	return product?.titolo?.trim() || product?.codice_prodotto?.trim() || '';
}

export function buildProductSlugMap(products: ProductSlugSource[]) {
	const map = new Map<number, string>();
	const usedSlugs = new Set<string>();

	for (const product of products) {
		if (typeof product?.id !== 'number') continue;
		const baseSlug = slugifyLabel(getProductTitle(product)) || String(product.id);
		let resolvedSlug = baseSlug;
		if (usedSlugs.has(resolvedSlug)) {
			resolvedSlug = `${baseSlug}-${product.id}`;
		}
		usedSlugs.add(resolvedSlug);
		map.set(product.id, resolvedSlug);
	}

	return map;
}
