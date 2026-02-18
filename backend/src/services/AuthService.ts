import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';
const SALT_ROUNDS = 10;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

// In-memory token blacklist (in production, use Redis)
const tokenBlacklist = new Set<string>();

export class AuthService {
  /**
   * Hash a password using bcrypt with minimum 10 salt rounds
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token with 24-hour expiration
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): TokenPayload {
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been invalidated');
    }
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  /**
   * Login with username and password
   * Note: This method requires a user lookup function to be passed in
   */
  static async loginWithUser(
    credentials: LoginCredentials,
    findUser: (username: string) => Promise<User | null>
  ): Promise<AuthResult> {
    const { username, password } = credentials;

    // Find user by username
    const user = await findUser(username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = this.generateToken(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Logout and invalidate token
   */
  static logout(token: string): void {
    tokenBlacklist.add(token);
  }

  /**
   * Check if token is blacklisted
   */
  static isTokenBlacklisted(token: string): boolean {
    return tokenBlacklist.has(token);
  }

  /**
   * Clear token blacklist (for testing)
   */
  static clearBlacklist(): void {
    tokenBlacklist.clear();
  }
}
