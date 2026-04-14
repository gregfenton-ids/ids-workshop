import type {User as IUser} from '@ids/data-models';
import {IdsBaseEntity} from '../../common/entities/ids-base.entity';

/**
 * User Entity
 *
 * Application-specific user profile stored in RavenDB.
 * Linked to Logto user via logtoUserId field.
 * Extends IdsBaseClass for common audit and soft-delete functionality
 */
export class User extends IdsBaseEntity implements IUser {
  public logtoUserId!: string;

  public email!: string;

  public username?: string | null;

  // Custom application fields
  public nickname?: string | null;

  public displayName?: string | null;

  public bio?: string | null;

  public preferredLanguage?: string | null;

  public timezone?: string | null;

  // Application preferences
  public emailNotifications!: boolean;

  public smsNotifications!: boolean;

  public marketingEmails!: boolean;

  // Profile metadata
  public profileCompleteness!: number;

  public lastLoginAt?: Date | null;

  public hasProfilePhoto?: boolean;
}
