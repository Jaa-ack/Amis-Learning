import axios from 'axios';

// Ensure baseURL always points to the /api path to avoid misconfigured envs
function resolveApiBase() {
	const env = process.env.NEXT_PUBLIC_API_BASE?.trim();
	if (!env) return '/api';
	try {
		// If a full URL is provided, ensure it ends with /api
		if (env.startsWith('http://') || env.startsWith('https://')) {
			const url = new URL(env);
			// If path already includes /api, keep; otherwise append
			const path = url.pathname.endsWith('/api') ? url.pathname : `${url.pathname.replace(/\/$/, '')}/api`;
			url.pathname = path;
			return url.toString();
		}
	} catch {
		// Fallback to /api on invalid URL
	}
	// Relative base: ensure it is /api
	return '/api';
}

export const api = axios.create({ baseURL: resolveApiBase() });
