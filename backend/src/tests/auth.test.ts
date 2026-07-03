import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../common/schemas/auth.schema';

describe('Auth Schema Validation', () => {
  it('should validate a correct login', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('should reject login with empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('should reject login with invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'secret' });
    expect(result.success).toBe(false);
  });
});

describe('Register Schema Validation', () => {
  it('should validate a correct registration', () => {
    const result = registerSchema.safeParse({
      name: 'User',
      email: 'user@test.com',
      password: 'StrongPass1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject weak password', () => {
    const result = registerSchema.safeParse({
      name: 'User',
      email: 'user@test.com',
      password: 'weak',
    });
    expect(result.success).toBe(false);
  });
});
