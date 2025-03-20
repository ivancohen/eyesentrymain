import { PostgrestError } from '@supabase/supabase-js';

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

export type DatabaseError = PostgrestError | Error | ServiceError;

export function isServiceError(error: unknown): error is ServiceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ServiceError).message === 'string'
  );
}

export function getErrorMessage(error: unknown): string {
  if (isServiceError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
} 