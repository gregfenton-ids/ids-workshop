import {randomUUID} from 'node:crypto';

export class IdsBaseEntity {
  public id!: string;
  public createdDate!: Date;
  public createdBy?: string;
  public updatedDate!: Date;
  public updatedBy?: string;
  public version!: number;
  public isDeleted!: boolean;
}

export function createIdsBaseEntity(userId?: string): IdsBaseEntity {
  const now = new Date();
  return {
    id: randomUUID(),
    createdDate: now,
    createdBy: userId,
    updatedDate: now,
    updatedBy: userId,
    version: 1,
    isDeleted: false,
  };
}

export function touchIdsBaseEntity(entity: IdsBaseEntity, userId?: string): void {
  entity.updatedDate = new Date();
  entity.updatedBy = userId;
  entity.version += 1;
}
