const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error(
    'JWT_SECRET is not set. Refusing to start with a fallback secret, since that string ' +
      'would be a publicly known value anyone could use to forge login tokens.'
  );
}

export const JWT_SECRET: string = secret;
