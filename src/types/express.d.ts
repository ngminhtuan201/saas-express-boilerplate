declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    rawBody?: Buffer;
  }
}

declare module "express" {
  interface Request {
    rawBody?: Buffer;
  }
}

export {};
