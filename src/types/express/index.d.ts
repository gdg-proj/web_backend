import 'express-session';

declare module 'express-session' {
  interface SessionData {
    pendingUser?: {
      fullName: string;
      email: string;
      password: string;
      phone: string;
      verified: boolean;
    };
  }
}

declare module 'express' {
  interface Request {
    session: Express.Session & {
      pendingUser?: {
        fullName: string;
        email: string;
        password: string;
        phone: string;
        verified: boolean;
      };
    };
  }
}