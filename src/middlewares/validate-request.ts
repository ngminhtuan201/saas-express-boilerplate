import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { errors } from "../libs/errors";

const setRequestProperty = (
  req: Request,
  prop: "body" | "query" | "params",
  value: unknown,
) => {
  Object.defineProperty(req, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

const formatJoiError = (error: Joi.ValidationError) => {
  return error.details.map((d) => ({
    message: d.message.replace(/['"]/g, ""),
    path: d.path.join("."),
  }));
};

export const validateRequest = (schemas: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errorDetails: { message: string; path: string }[] = [];

    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errorDetails.push(...formatJoiError(error));
      } else {
        setRequestProperty(req, "body", value);
      }
    }

    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errorDetails.push(...formatJoiError(error));
      } else {
        setRequestProperty(req, "query", value);
      }
    }

    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errorDetails.push(...formatJoiError(error));
      } else {
        setRequestProperty(req, "params", value);
      }
    }

    if (errorDetails.length > 0) {
      return next(errors.ValidationFailed(errorDetails));
    }

    next();
  };
};
