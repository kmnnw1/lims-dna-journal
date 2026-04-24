/**
 * Клиентское шифрование (Zero-Knowledge) на базе Web Crypto API.
 */

export async function deriveKey(email: string, salt: string): Promise<CryptoKey> {
	const enc = new TextEncoder();
	const baseKey = await window.crypto.subtle.importKey(
		'raw',
		enc.encode(email),
		'PBKDF2',
		false,
		['deriveKey'],
	);

	return window.crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: enc.encode(salt),
			iterations: 100000,
			hash: 'SHA-256',
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt'],
	);
}

export async function encryptData(
	text: string,
	key: CryptoKey,
): Promise<{ cipher: string; iv: string }> {
	const enc = new TextEncoder();
	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	const encrypted = await window.crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		enc.encode(text),
	);

	return {
		cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
		iv: btoa(String.fromCharCode(...iv)),
	};
}

export async function decryptData(
	encrypted: { cipher: string; iv: string },
	key: CryptoKey,
): Promise<string> {
	const dec = new TextDecoder();
	const iv = new Uint8Array(
		atob(encrypted.iv)
			.split('')
			.map((c) => c.charCodeAt(0)),
	);
	const cipher = new Uint8Array(
		atob(encrypted.cipher)
			.split('')
			.map((c) => c.charCodeAt(0)),
	);

	const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);

	return dec.decode(decrypted);
}

export function isEncrypted(data: string): boolean {
	return typeof data === 'string' && data.startsWith('zk:');
}

export function unwrapEncrypted(data: string): { iv: string; cipher: string } {
	const [, iv, cipher] = data.split(':');
	return { iv, cipher };
}

export function wrapEncrypted(data: { cipher: string; iv: string }): string {
	return `zk:${data.iv}:${data.cipher}`;
}
