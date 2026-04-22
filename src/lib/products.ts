import { slugifyLabel } from './slug';
import { directusAssetUrl } from './directus';

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

type AssetOptions = {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png';
};

type ProductImageSource = {
	foto_prodotto?: unknown;
	[key: string]: unknown;
};

type BrandSource = {
	id?: number | string;
	logo_marchio?: unknown;
	logo?: unknown;
	immagine?: unknown;
	image?: unknown;
};

export function resolveRecordId(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'number' || typeof value === 'string') return String(value).trim();
	if (typeof value === 'object') {
		const nestedId = (value as { id?: unknown }).id;
		if (typeof nestedId === 'number' || typeof nestedId === 'string') return String(nestedId).trim();
	}
	return '';
}

export function resolveAssetId(value: unknown): string {
	if (!value) return '';
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'object') {
		const record = value as Record<string, unknown>;
		const candidates = [record.id, record.asset, record.file, record.src];
		for (const candidate of candidates) {
			const resolved = resolveRecordId(candidate);
			if (resolved) return resolved;
		}
	}
	return '';
}

function resolveBrandLogoFromObject(value: unknown): string {
	if (!value || typeof value !== 'object') return '';
	const brand = value as Record<string, unknown>;
	const candidates = [brand.logo_marchio, brand.logo, brand.immagine, brand.image];
	for (const candidate of candidates) {
		const asset = resolveAssetId(candidate);
		if (asset) return asset;
	}
	return '';
}

export function resolveProductBrandId(product: ProductImageSource): string {
	const candidates = [
		product.marchio,
		product.Marchio,
		product.marchio_id,
		product.marchioId,
		product.Marchi_id,
		product.brand,
		product.brand_id,
		product.brandId,
	] as unknown[];

	for (const candidate of candidates) {
		const id = resolveRecordId(candidate);
		if (id) return id;
	}

	return '';
}

export function buildBrandLogoMap(brands: BrandSource[]) {
	const map = new Map<string, string>();

	for (const brand of brands) {
		const id = resolveRecordId(brand?.id);
		if (!id) continue;
		const logo =
			resolveAssetId(brand.logo_marchio) ||
			resolveAssetId(brand.logo) ||
			resolveAssetId(brand.immagine) ||
			resolveAssetId(brand.image);
		if (!logo) continue;
		map.set(id, logo);
	}

	return map;
}

export function resolveProductThumbnailSrc(
	product: ProductImageSource,
	options: AssetOptions & { defaultImage: string; brandLogoById?: Map<string, string> }
) {
	const { brandLogoById, defaultImage, ...assetOptions } = options;
	const productAsset = resolveAssetId(product?.foto_prodotto);
	if (productAsset) return directusAssetUrl(productAsset, assetOptions);

	const brandCandidates = [
		product.marchio,
		product.Marchio,
		product.brand,
		product.marchio_id,
		product.marchioId,
		product.Marchi_id,
		product.brand_id,
		product.brandId,
	] as unknown[];

	for (const candidate of brandCandidates) {
		const logoFromObject = resolveBrandLogoFromObject(candidate);
		if (logoFromObject) return directusAssetUrl(logoFromObject, assetOptions);
	}

	const brandId = resolveProductBrandId(product);
	const brandAsset = (brandId && brandLogoById?.get(brandId)) || '';
	if (brandAsset) return directusAssetUrl(brandAsset, assetOptions);

	return defaultImage;
}
