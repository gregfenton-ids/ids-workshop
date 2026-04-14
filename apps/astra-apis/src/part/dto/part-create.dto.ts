import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {PartBaseDto, PartBaseResponseDto} from './part-base.dto';

export class PartVendorCreateDto {
  @ApiProperty({description: 'Vendor code — must exist in the vendors collection'})
  @IsString()
  vendorNumber!: string;

  @ApiPropertyOptional({
    description: "Vendor's part number — defaults to part number if omitted",
  })
  @IsString()
  @IsOptional()
  vendorPartNumber?: string;

  @ApiPropertyOptional({
    description: 'Vendor cost — defaults to 0 if omitted',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  cost?: number;

  @ApiProperty({description: 'Whether this is the primary vendor — exactly one must be true'})
  @IsBoolean()
  isPrimary!: boolean;
}

export class PartBinCreateDto {
  @ApiProperty({description: 'Bin code — must exist in the bins collection for the given location'})
  @IsString()
  binCode!: string;

  @ApiProperty({description: 'Whether this is the primary/main bin — exactly one must be true'})
  @IsBoolean()
  isMain!: boolean;
}

/**
 * DTO for creating a new part with optional inventory, pricing, UOM, restocking, and vendor information.
 * At least one vendor is required. Exactly one vendor must be marked as primary.
 */
export class PartCreateDto extends PartBaseDto {
  // ========== Status ==========

  @ApiPropertyOptional({
    description: 'Part status — defaults to active if omitted',
    enum: ['active', 'inactive', 'discontinued'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  // ========== Inventory ==========

  @ApiPropertyOptional({description: 'Location ID where inventory will be created'})
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'Bins for this part at the given location — exactly one must have isMain: true',
    type: [PartBinCreateDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({each: true})
  @Type(() => PartBinCreateDto)
  bins?: PartBinCreateDto[];

  @ApiPropertyOptional({description: 'Initial quantity on hand', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  onHandQty?: number;

  // ========== Pricing ==========

  @ApiPropertyOptional({description: 'List price — defaults to 0 if omitted', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  listPrice?: number;

  // ========== Unit of Measure ==========

  @ApiPropertyOptional({description: 'Selling unit of measure code (e.g., "EA", "SET")'})
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

  // ========== Shipping ==========

  @ApiPropertyOptional({description: 'Shipping weight in pounds', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingWeight?: number;

  @ApiPropertyOptional({description: 'Shipping unit descriptor (e.g. BOX, PALLET)'})
  @IsString()
  @IsOptional()
  shippingUnit?: string;

  // ========== Restocking ==========

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

  // ========== Controls ==========

  @ApiPropertyOptional({description: 'Enable serial number prompting on sale'})
  @IsBoolean()
  @IsOptional()
  serialized?: boolean;

  @ApiPropertyOptional({description: 'When true, price updates from vendor feeds are bypassed'})
  @IsBoolean()
  @IsOptional()
  bypassPriceUpdate?: boolean;

  @ApiPropertyOptional({description: 'Internal notes / comments'})
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({description: 'Standard case quantity', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  caseQty?: number;

  @ApiPropertyOptional({description: 'Minimum order quantity', minimum: 0})
  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrder?: number;

  // ========== Accounting (optional — no FK validation; reference tables not yet built) ==========

  @ApiPropertyOptional({description: 'Sale category / price group code'})
  @IsString()
  @IsOptional()
  priceGroup?: string;

  @ApiPropertyOptional({description: 'GL group code — maps to Inventory, Sales, and COGS accounts'})
  @IsString()
  @IsOptional()
  glGroup?: string;

  @ApiPropertyOptional({description: 'Tax code for taxable parts'})
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

  // ========== Alternates ==========

  @ApiPropertyOptional({description: 'Alternate part numbers for cross-reference'})
  @IsArray()
  @IsString({each: true})
  @IsOptional()
  alternatePartNumbers?: string[];

  // ========== Vendors ==========

  @ApiProperty({
    description: 'Vendor lines — at least one required; exactly one must have isPrimary: true',
    type: [PartVendorCreateDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({each: true})
  @Type(() => PartVendorCreateDto)
  vendors!: PartVendorCreateDto[];
}

export class PartCreateResponseDto extends PartBaseResponseDto {}
