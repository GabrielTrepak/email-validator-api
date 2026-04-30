import dns from "dns/promises";

type EmailRequest = {
  email: string;
};

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

function calculateScore(checks: {
  hasValidFormat: boolean;
  hasDomain: boolean;
  isKnownInvalidDomain: boolean;
  hasMxRecords: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
}) {
  let score = 100;

  if (!checks.hasValidFormat) score -= 50;
  if (!checks.hasDomain) score -= 30;
  if (checks.isKnownInvalidDomain) score -= 40;
  if (!checks.hasMxRecords) score -= 30;
  if (checks.isDisposable) score -= 35;
  if (checks.isRoleBased) score -= 10;

  return Math.max(score, 0);
}

async function checkMxRecords(domain: string | null) {
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

export async function validateEmail(data: EmailRequest) {
  const normalizedData = normalizeEmail(data);

  const email = normalizedData.normalized;
  const domain = normalizedData.domain;
  const localPart = normalizedData.localPart;

  const hasValidFormat = basicEmailRegex.test(email);
  const hasDomain = Boolean(domain);

  const isKnownInvalidDomain = domain
    ? invalidDomainPatterns.includes(domain)
    : false;

  const isDisposable = domain
    ? disposableDomains.includes(domain)
    : false;

  const isRoleBased = localPart
    ? roleBasedLocalParts.includes(localPart)
    : false;

  const hasMxRecords =
    hasValidFormat && hasDomain
      ? await checkMxRecords(domain)
      : false;

  const checks = {
    hasValidFormat,
    hasDomain,
    isKnownInvalidDomain,
    hasMxRecords,
    isDisposable,
    isRoleBased,
  };

  const score = calculateScore(checks);

  const valid =
    hasValidFormat &&
    hasDomain &&
    !isKnownInvalidDomain &&
    hasMxRecords &&
    !isDisposable;

  return {
    original: normalizedData.original,
    normalized: normalizedData.normalized,
    valid,
    score,
    checks,
    domain,
    localPart,
  };
}