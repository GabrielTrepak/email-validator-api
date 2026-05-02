import dns from "dns/promises";
import NodeCache from "node-cache";

type EmailRequest = {
  email: string;
};

type BatchEmailRequest = {
  emails: string[];
};

type EmailValidationResult = {
  original: string;
  normalized: string;
  valid: boolean;
  score: number;
  reasons: string[];
  checks: {
    hasValidFormat: boolean;
    hasDomain: boolean;
    isKnownInvalidDomain: boolean;
    hasMxRecords: boolean;
    isDisposable: boolean;
    isRoleBased: boolean;
    isFreeProvider: boolean;
  };
  domain: string | null;
  localPart: string | null;
  provider: string | null;
  cached: boolean;
};

const cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS || 86400);

const emailCache = new NodeCache({
  stdTTL: cacheTtlSeconds,
  checkperiod: 120,
});

const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const invalidDomainPatterns = [
  "example.com",
  "test.com",
  "invalid.com",
  "localhost",
];

const disposableDomains = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
];

const roleBasedLocalParts = [
  "admin",
  "support",
  "info",
  "sales",
  "contact",
  "help",
  "billing",
  "office",
  "noreply",
  "no-reply",
];

const freeEmailProviders = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
];

function buildCacheKey(email: string): string {
  return `email:${email}`;
}

function getProvider(domain: string | null): string | null {
  if (!domain) return null;

  const providerMap: Record<string, string> = {
    "gmail.com": "gmail",
    "yahoo.com": "yahoo",
    "outlook.com": "outlook",
    "hotmail.com": "hotmail",
    "icloud.com": "icloud",
    "aol.com": "aol",
    "proton.me": "proton",
    "protonmail.com": "proton",
  };

  return providerMap[domain] || null;
}

function calculateScore(checks: {
  hasValidFormat: boolean;
  hasDomain: boolean;
  isKnownInvalidDomain: boolean;
  hasMxRecords: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
}): number {
  let score = 100;

  if (!checks.hasValidFormat) score -= 50;
  if (!checks.hasDomain) score -= 30;
  if (checks.isKnownInvalidDomain) score -= 40;
  if (!checks.hasMxRecords) score -= 30;
  if (checks.isDisposable) score -= 35;
  if (checks.isRoleBased) score -= 10;

  return Math.max(score, 0);
}

function getReasons(checks: {
  hasValidFormat: boolean;
  hasDomain: boolean;
  isKnownInvalidDomain: boolean;
  hasMxRecords: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
}): string[] {
  const reasons: string[] = [];

  if (!checks.hasValidFormat) reasons.push("invalid_format");
  if (!checks.hasDomain) reasons.push("missing_domain");
  if (checks.isKnownInvalidDomain) reasons.push("known_invalid_domain");
  if (!checks.hasMxRecords) reasons.push("no_mx_records");
  if (checks.isDisposable) reasons.push("disposable_email");
  if (checks.isRoleBased) reasons.push("role_based_email");

  return reasons;
}

async function checkMxRecords(domain: string | null): Promise<boolean> {
  if (!domain) return false;

  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

export function normalizeEmail(data: EmailRequest) {
  if (!data.email || typeof data.email !== "string") {
    throw new Error("Email is required");
  }

  const original = data.email;
  const normalized = original.trim().toLowerCase();

  const parts = normalized.split("@");

  const localPart = parts[0] || null;
  const domain = parts[1] || null;

  return {
    original,
    normalized,
    localPart,
    domain,
  };
}

export async function validateEmail(
  data: EmailRequest
): Promise<EmailValidationResult> {
  const normalizedData = normalizeEmail(data);

  const cacheKey = buildCacheKey(normalizedData.normalized);
  const cachedResult = emailCache.get<EmailValidationResult>(cacheKey);

  if (cachedResult) {
    return {
      ...cachedResult,
      cached: true,
    };
  }

  const email = normalizedData.normalized;
  const domain = normalizedData.domain;
  const localPart = normalizedData.localPart;

  const hasValidFormat = basicEmailRegex.test(email);
  const hasDomain = Boolean(domain);

  const isKnownInvalidDomain = domain
    ? invalidDomainPatterns.includes(domain)
    : false;

  const isDisposable = domain ? disposableDomains.includes(domain) : false;

  const isRoleBased = localPart
    ? roleBasedLocalParts.includes(localPart)
    : false;

  const hasMxRecords =
    hasValidFormat && hasDomain ? await checkMxRecords(domain) : false;

  const isFreeProvider = domain ? freeEmailProviders.includes(domain) : false;
  const provider = getProvider(domain);

  const checks = {
    hasValidFormat,
    hasDomain,
    isKnownInvalidDomain,
    hasMxRecords,
    isDisposable,
    isRoleBased,
    isFreeProvider,
  };

  const score = calculateScore({
    hasValidFormat,
    hasDomain,
    isKnownInvalidDomain,
    hasMxRecords,
    isDisposable,
    isRoleBased,
  });

  const reasons = getReasons({
  hasValidFormat,
  hasDomain,
  isKnownInvalidDomain,
  hasMxRecords,
  isDisposable,
  isRoleBased,
});

  const valid =
    hasValidFormat &&
    hasDomain &&
    !isKnownInvalidDomain &&
    hasMxRecords &&
    !isDisposable;

  const result: EmailValidationResult = {
    original: normalizedData.original,
    normalized: normalizedData.normalized,
    valid,
    score,
    reasons,
    checks,
    domain,
    localPart,
    provider,
    cached: false,
  };

  emailCache.set(cacheKey, result);

  return result;
}

export async function validateEmailBatch(data: BatchEmailRequest) {
  if (!Array.isArray(data.emails)) {
    throw new Error("Emails must be an array");
  }

  if (data.emails.length === 0) {
    throw new Error("At least one email is required");
  }

  if (data.emails.length > 50) {
    throw new Error("Maximum 50 emails allowed per request");
  }

  const uniqueEmails = Array.from(
    new Set(
      data.emails
        .filter((email) => typeof email === "string")
        .map((email) => email.trim())
        .filter(Boolean)
    )
  );

  const results = await Promise.all(
    uniqueEmails.map((email) => validateEmail({ email }))
  );

  return {
    results,
    meta: {
      total: results.length,
      valid: results.filter((item) => item.valid).length,
      invalid: results.filter((item) => !item.valid).length,
      cached: results.filter((item) => item.cached).length,
    },
  };
}