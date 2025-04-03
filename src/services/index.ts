/**
 * @fileoverview Barrel file for exporting all service modules.
 * This provides a single point of import for services throughout the application.
 */

export * from './UserService';
export * from './DoctorService';
export * from './ClinicalResourceService';
export * from './LocationService';
export * from './PatientDataService';
export * from './QuestionScoreService';

// Export any shared interfaces or types if needed, for example:
// export type { UserProfile } from './UserService';
// export type { ClinicalResource } from './ClinicalResourceService';
// etc.
// Note: Interfaces are already exported from their respective files,
// so explicit re-export here might be redundant unless desired for clarity.