import type { APIRoute } from 'astro';
import { DIRECTUS_URL } from '../../lib/directus';

export const POST: APIRoute = async ({ request }) => {
	const webhookUrl =
		import.meta.env.DIRECTUS_WEBHOOK_RICHIESTE ||
		import.meta.env.PUBLIC_DIRECTUS_WEBHOOK_RICHIESTE ||
		(import.meta.env.DIRECTUS_FLOW_TRIGGER_ID || import.meta.env.PUBLIC_DIRECTUS_FLOW_TRIGGER_ID
			? `${DIRECTUS_URL}/flows/trigger/${import.meta.env.DIRECTUS_FLOW_TRIGGER_ID || import.meta.env.PUBLIC_DIRECTUS_FLOW_TRIGGER_ID}`
			: '');

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

	try {
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
		return new Response(JSON.stringify({ error: 'Errore invio richiesta' }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
