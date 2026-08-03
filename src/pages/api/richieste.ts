import type { APIRoute } from 'astro';
import { DIRECTUS_URL } from '../../lib/directus';

const MAX_CV_SIZE = 5 * 1024 * 1024;

type RichiestaPayload = Record<string, unknown>;

function normalizeWebhookUrl(value: string) {
	const cleaned = value.trim().replace('battistel.prometeo.com', 'admin.battistel.com');
	if (!cleaned) return '';
	if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
	return `https://${cleaned}`;
}

function isPayload(value: unknown): value is RichiestaPayload {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeBase64(value: string) {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}

async function uploadCurriculum(payload: RichiestaPayload, token: string | undefined) {
	const base64 = typeof payload.cv_base64 === 'string' ? payload.cv_base64 : '';
	if (!base64) return null;

	if (!token) {
		throw new Error('Caricamento curriculum non configurato');
	}

	const filename = typeof payload.cv_filename === 'string' ? payload.cv_filename : 'curriculum.pdf';
	const mimeType = typeof payload.cv_mime === 'string' ? payload.cv_mime.toLowerCase() : '';
	if (!filename.toLowerCase().endsWith('.pdf') || !['application/pdf', 'application/x-pdf'].includes(mimeType)) {
		throw new Error('Formato curriculum non valido');
	}

	let bytes: Uint8Array;
	try {
		bytes = decodeBase64(base64);
	} catch {
		throw new Error('Curriculum non valido');
	}

	if (bytes.byteLength > MAX_CV_SIZE) {
		throw new Error('Il curriculum supera il limite massimo di 5MB');
	}

	const formData = new FormData();
	formData.append('file', new Blob([bytes], { type: 'application/pdf' }), filename);

	const response = await fetch(new URL('/files', DIRECTUS_URL), {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: formData,
	});
	const responseBody = await response.text();

	if (!response.ok) {
		console.error('Errore caricamento curriculum su Directus:', response.status, responseBody);
		throw new Error(`Caricamento curriculum rifiutato da Directus (${response.status})`);
	}

	let result: { data?: { id?: unknown } };
	try {
		result = JSON.parse(responseBody);
	} catch {
		throw new Error('Risposta non valida dal caricamento curriculum');
	}

	if (typeof result.data?.id !== 'string') {
		throw new Error('ID curriculum non ricevuto');
	}

	return result.data.id;
}

export const POST: APIRoute = async ({ request, locals }) => {
	const rawWebhookUrl =
		import.meta.env.DIRECTUS_WEBHOOK_RICHIESTE ||
		import.meta.env.PUBLIC_DIRECTUS_WEBHOOK_RICHIESTE ||
		(import.meta.env.DIRECTUS_FLOW_TRIGGER_ID || import.meta.env.PUBLIC_DIRECTUS_FLOW_TRIGGER_ID
			? `${DIRECTUS_URL}/flows/trigger/${import.meta.env.DIRECTUS_FLOW_TRIGGER_ID || import.meta.env.PUBLIC_DIRECTUS_FLOW_TRIGGER_ID}`
			: '');
	const webhookUrl = normalizeWebhookUrl(rawWebhookUrl);

	if (!webhookUrl) {
		return new Response(JSON.stringify({ error: 'Webhook richieste non configurato' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Payload non valido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	if (!isPayload(body)) {
		return new Response(JSON.stringify({ error: 'Payload non valido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const runtimeToken = locals.runtime.env.DIRECTUS_FILES_TOKEN;
		const token = typeof runtimeToken === 'string' ? runtimeToken : import.meta.env.DIRECTUS_FILES_TOKEN;
		const cvFileId = await uploadCurriculum(body, token);
		if (cvFileId) body.cv_file = cvFileId;

		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		const responseBody = await response.text();
		const emptyBodyStatus = response.status === 204 || response.status === 304;

		return new Response(emptyBodyStatus ? null : responseBody || JSON.stringify({ ok: response.ok }), {
			status: response.status,
			headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
		});
	} catch (error) {
		console.error('Errore invio richiesta a Directus:', error);
		const message = error instanceof Error ? error.message : 'Errore invio richiesta';
		return new Response(JSON.stringify({ error: message }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
