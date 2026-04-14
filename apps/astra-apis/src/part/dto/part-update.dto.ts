import {ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {PartBaseResponseDto} from './part-base.dto';
import {PartBinCreateDto, PartVendorCreateDto} from './part-create.dto';

/**
 * DTO for updating an existing part. All fields are optional (partial update).
 * Part number is excluded — it comes from the URL param and cannot be changed.
 */
export class PartUpdateDto {
  @ApiPropertyOptional({
    description:
      'Location ID scoping this update — required when updating bins so the correct location entry is targeted',
  })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({description: 'Part description'})
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({description: 'Part status code'})
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({description: 'Internal notes / comments'})
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({description: 'Selling unit of measure code'})
  @IsString()
  @IsOptional()
  sellUom?: string;

  @ApiPropertyOptional({description: 'Purchase unit of measure code'})
  @IsString()
  @IsOptional()
  purchaseUom?: string;

  @ApiPropertyOptional({description: 'Sale-to-purchase ratio', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  salePurchaseRatio?: number;

  @ApiPropertyOptional({description: 'Shipping weight', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingWeight?: number;

  @ApiPropertyOptional({description: 'Shipping unit code (e.g. LB, KG)'})
  @IsString()
  @IsOptional()
  shippingUnit?: string;

  @ApiPropertyOptional({description: 'List price', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  listPrice?: number;

  @ApiPropertyOptional({description: 'Sale category / price group code'})
  @IsString()
  @IsOptional()
  priceGroup?: string;

  @ApiPropertyOptional({description: 'GL group code'})
  @IsString()
  @IsOptional()
  glGroup?: string;

  @ApiPropertyOptional({description: 'Tax code'})
  @IsString()
  @IsOptional()
  taxCode?: string;

  @ApiPropertyOptional({
    description: 'Planogram number — ties the part to shelf layout (max 8 chars, stored uppercase)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(8)
  pogNumber?: string;

  @ApiPropertyOptional({
    description: 'Popularity/classification code (e.g. 1–5 rating for dealership use)',
  })
  @IsString()
  @IsOptional()
  popCode?: string;

  @ApiPropertyOptional({description: 'Standard case quantity', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  caseQty?: number;

  @ApiPropertyOptional({description: 'Minimum stocking quantity', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  minQty?: number;

  @ApiPropertyOptional({description: 'Maximum stocking quantity', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxQty?: number;

  @ApiPropertyOptional({description: 'Minimum days of supply', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  minDays?: number;

  @ApiPropertyOptional({description: 'Minimum order quantity', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrder?: number;

  @ApiPropertyOptional({description: 'Enable serial number prompting on sale'})
  @IsBoolean()
  @IsOptional()
  serialized?: boolean;

  @ApiPropertyOptional({description: 'Bypass vendor price updates'})
  @IsBoolean()
  @IsOptional()
  bypassPriceUpdate?: boolean;

  @ApiPropertyOptional({description: 'Alternate part numbers'})
  @IsOptional()
  alternatePartNumbers?: string[];

  @ApiPropertyOptional({
    description:
      'Replace all vendors — at least one required if provided; exactly one must be primary',
    type: [PartVendorCreateDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({each: true})
  @Type(() => PartVendorCreateDto)
  vendors?: PartVendorCreateDto[];

  @ApiPropertyOptional({
    description: 'Replace bins at the part location — exactly one must have isMain: true',
    type: [PartBinCreateDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({each: true})
  @Type(() => PartBinCreateDto)
  bins?: PartBinCreateDto[];
}

export class PartUpdateResponseDto extends PartBaseResponseDto {}
