type EmailRequest = {
  email: string;
};

const basicEmailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const invalidDomainPatterns = [
  "example.com",
  "test.com",
  "invalid.com",
  "localhost",
];

export function normalizeEmail(data: EmailRequest) {
  if (!data.email || typeof data.email !== "string") {
    throw new Error("Email is required");
  }

  const original = data.email;
  const normalized = original.trim().toLowerCase();

  const [localPart, domain] = normalized.split("@");

  return {
    original,
    normalized,
    localPart: localPart || null,
    domain: domain || null,
  };
}

export function validateEmail(data: EmailRequest) {
  const normalizedData = normalizeEmail(data);

  const email = normalizedData.normalized;
  const domain = normalizedData.domain;

  const hasValidFormat = basicEmailRegex.test(email);
  const hasDomain = Boolean(domain);
  const isKnownInvalidDomain = domain
    ? invalidDomainPatterns.includes(domain)
    : false;

  const valid =
    hasValidFormat &&
    hasDomain &&
    !isKnownInvalidDomain;

  return {
    original: normalizedData.original,
    normalized: normalizedData.normalized,
    valid,
    checks: {
      hasValidFormat,
      hasDomain,
      isKnownInvalidDomain,
    },
    domain,
    localPart: normalizedData.localPart,
  };
}