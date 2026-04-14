export function getCategoryIconSrc(title: string) {
	const normalized = (title || '').trim().toLowerCase();

	if (!normalized) return '';
	if (normalized.includes('non spray')) return '/icons/categories/drop.svg';
	if (normalized.includes('spray')) return '/icons/categories/spray.svg';
	if (normalized.includes('additiv')) return '/icons/categories/flask.svg';

	return '';
}
