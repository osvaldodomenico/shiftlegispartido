import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

/**
 * Estratégia dual para CPF:
 *
 * cpf_hash      → HMAC-SHA256 determinístico. Índice/unicidade. Sem valor recuperável.
 * cpf_encrypted → AES-256-CBC com IV aleatório por registro + versão da chave.
 *                 Formato em banco: "<keyVersion>:<ivHex>:<ciphertextHex>"
 *
 * Rotação de chave:
 *   - Cada versão tem sua própria env var: CPF_ENCRYPTION_KEY_V1, CPF_ENCRYPTION_KEY_V2, ...
 *   - CPF_CURRENT_KEY_VERSION indica a versão ativa para novos registros.
 *   - Registros antigos continuam legíveis via a versão gravada com eles.
 *   - Para rotacionar: bump CPF_CURRENT_KEY_VERSION + script que re-encripta registros antigos.
 *
 * Variáveis de ambiente obrigatórias:
 *   CPF_ENCRYPTION_KEY_V1   → 64 hex chars (32 bytes AES-256), primeira versão
 *   CPF_CURRENT_KEY_VERSION → número inteiro da versão ativa (ex: "1")
 *   CPF_HMAC_SECRET         → string aleatória forte (mínimo 32 chars)
 */

const ALGORITHM = 'aes-256-cbc';
const IV_BYTES = 16;

// ── Chaves ────────────────────────────────────────────────────────────────────

function getCurrentKeyVersion(): number {
  const raw = process.env.CPF_CURRENT_KEY_VERSION;
  const version = parseInt(raw ?? '1', 10);
  if (isNaN(version) || version < 1) {
    throw new Error('CPF_CURRENT_KEY_VERSION inválida: deve ser inteiro >= 1');
  }
  return version;
}

function getEncryptionKey(version: number): Buffer {
  const raw = process.env[`CPF_ENCRYPTION_KEY_V${version}`];
  if (!raw || raw.length !== 64) {
    throw new Error(
      `CPF_ENCRYPTION_KEY_V${version} inválida: deve ter 64 caracteres hex (32 bytes)`,
    );
  }
  return Buffer.from(raw, 'hex');
}

function getHmacSecret(): string {
  const secret = process.env.CPF_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CPF_HMAC_SECRET inválida: deve ter ao menos 32 caracteres');
  }
  return secret;
}

// ── Normalização e validação ──────────────────────────────────────────────────

/** Remove tudo que não for dígito. Usado antes de hash/encrypt/validate. */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Sanitiza input de busca por CPF.
 * Retorna os 11 dígitos normalizados, ou null se o input não tiver exatamente 11 dígitos.
 * Nunca aceita busca parcial — retorna null para qualquer input fora do padrão.
 * Não valida o algoritmo do CPF (a busca é apenas por hash exato).
 */
export function sanitizeCpfForSearch(rawInput: string): string | null {
  const digits = normalizeCpf(rawInput.trim());
  if (digits.length !== 11) return null;
  return digits;
}

/**
 * Valida CPF pelo algoritmo oficial da Receita Federal.
 * Rejeita sequências repetidas (111.111.111-11, etc).
 */
export function validateCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder >= 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder >= 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}

// ── HMAC ─────────────────────────────────────────────────────────────────────

/**
 * Gera HMAC-SHA256 determinístico do CPF normalizado.
 * Mesmo CPF + mesma secret → mesmo hash.
 */
export function hashCpf(cpf: string): string {
  const normalized = normalizeCpf(cpf);
  return createHmac('sha256', getHmacSecret())
    .update(normalized)
    .digest('hex');
}

/**
 * Compara dois hashes de CPF usando timingSafeEqual.
 * Evita timing attacks: o tempo de comparação não varia com os valores.
 * Retorna false se os hashes tiverem comprimentos diferentes (não chegam ao compare).
 */
export function cpfHashEquals(storedHash: string, candidateHash: string): boolean {
  if (storedHash.length !== candidateHash.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(storedHash, 'hex'),
      Buffer.from(candidateHash, 'hex'),
    );
  } catch {
    return false;
  }
}

// ── Criptografia ──────────────────────────────────────────────────────────────

/**
 * Criptografa o CPF com AES-256-CBC.
 * IV de 16 bytes gerado aleatoriamente por chamada — nunca reutilizado.
 * Retorna o dado cifrado e a versão da chave usada.
 *
 * Formato armazenado: "<keyVersion>:<ivHex>:<ciphertextHex>"
 * O keyVersion embutido no payload garante que a descriptografia
 * sempre usa a chave correta mesmo após uma rotação.
 */
export function encryptCpf(cpf: string): { encrypted: string; keyVersion: number } {
  const keyVersion = getCurrentKeyVersion();
  const key = getEncryptionKey(keyVersion);
  const iv = randomBytes(IV_BYTES);        // IV único por chamada — nunca reutilizado

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(normalizeCpf(cpf), 'utf8'),
    cipher.final(),
  ]);

  // Versão da chave prefixada no payload: permite descriptografar com a chave certa
  const encrypted = `${keyVersion}:${iv.toString('hex')}:${ciphertext.toString('hex')}`;
  return { encrypted, keyVersion };
}

/**
 * Descriptografa o CPF.
 * Lê a versão da chave do próprio payload — resiliente a rotações.
 * USO INTERNO APENAS — resultado nunca deve ser exposto em response ou log.
 */
export function decryptCpf(encryptedData: string): string {
  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error('Formato de CPF criptografado inválido');
  }

  const [versionStr, ivHex, ciphertextHex] = parts;
  const keyVersion = parseInt(versionStr, 10);

  if (isNaN(keyVersion) || keyVersion < 1) {
    throw new Error('Versão de chave inválida no payload');
  }

  const key = getEncryptionKey(keyVersion);
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

// ── Mascaramento ──────────────────────────────────────────────────────────────

/**
 * Mascara no formato do design system: ***.XXX.***-**
 * Apenas os dígitos 4-6 são visíveis. Ex: 123.456.789-09 → ***.456.***-**
 */
export function maskCpf(cpf: string): string {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return '***.***.***-**';
  return `***.${digits.slice(3, 6)}.***-**`;
}
