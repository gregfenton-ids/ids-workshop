import type {PagedResponseDto} from '@ids/data-models';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import type {Response} from 'express';
import {Auth} from '../auth/auth.decorator';
import {AuthInfo} from '../auth/auth-utils';
import {PartCreateDto, PartCreateResponseDto} from './dto/part-create.dto';
import {PartDetailResponseDto} from './dto/part-detail.dto';
import {PartListQueryDto, PartWithInventoryResponseDto} from './dto/part-list.query.dto';
import {PartUpdateDto, PartUpdateResponseDto} from './dto/part-update.dto';
import {PartService} from './part.service';

@ApiTags('parts')
@ApiBearerAuth()
@Controller('parts')
export class PartController {
  constructor(private readonly _partService: PartService) {}

  /**
   * POST /api/parts
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create part with optional inventory and vendor',
    description:
      'Create a new part with optional inventory and vendor relationship. ' +
      'Can create just the catalog item (partNumber + description only), or a complete part with ' +
      'initial inventory at a location and vendor relationship. ' +
      'Bin code and vendor code will be resolved to their respective IDs. ' +
      'If isPrimary is true, the vendor will be set as the primary vendor for this part.',
  })
  @ApiResponse({status: 201, description: 'Part created successfully', type: PartCreateResponseDto})
  @ApiResponse({status: 400, description: 'Invalid input or cross-field validation failure'})
  @ApiResponse({status: 404, description: 'Location not found'})
  @ApiResponse({status: 409, description: 'Part already exists'})
  @ApiHeader({name: 'Location', description: 'URL of the newly created part'})
  public async create(
    @Body() dto: PartCreateDto,
    @Auth() auth: AuthInfo,
    @Res({passthrough: true}) res: Response,
  ): Promise<PartCreateResponseDto> {
    const result = await this._partService.create(dto, auth.sub);
    res.setHeader('Location', `/api/parts/${result.partNumber}`);
    return result;
  }

  /**
   * GET /api/parts
   */
  @Get()
  @ApiOperation({
    summary: 'List all parts with inventory',
    description:
      'Get all parts with pagination and inventory for a specific location. Location ID is required for multi-tenant data isolation. Includes inventory quantities, bins, and primary vendor information.',
  })
  @ApiResponse({status: 200, description: 'Paginated list of parts with inventory'})
  @ApiResponse({status: 400, description: 'Bad Request - locationId is required'})
  public async findAll(
    @Query() query: PartListQueryDto,
  ): Promise<PagedResponseDto<PartWithInventoryResponseDto>> {
    return await this._partService.findAllWithInventory(query);
  }

  /**
   * GET /api/parts/:partNumber
   */
  @Get(':partNumber')
  @ApiOperation({
    summary: 'Get part by part number',
    description:
      'Retrieve a single part with full detail including all editable fields, vendors, and inventory.',
  })
  @ApiResponse({status: 200, description: 'Part found', type: PartDetailResponseDto})
  @ApiResponse({status: 404, description: 'Part not found'})
  public async findOne(@Param('partNumber') partNumber: string): Promise<PartDetailResponseDto> {
    return await this._partService.findOne(partNumber);
  }

  /**
   * PATCH /api/parts/:partNumber
   */
  @Patch(':partNumber')
  @ApiOperation({
    summary: 'Update an existing part',
    description: 'Partial update of part fields. Only provided fields are updated.',
  })
  @ApiResponse({status: 200, description: 'Part updated successfully', type: PartUpdateResponseDto})
  @ApiResponse({status: 400, description: 'Invalid input or cross-field validation failure'})
  @ApiResponse({status: 404, description: 'Part not found'})
  public async update(
    @Param('partNumber') partNumber: string,
    @Body() dto: PartUpdateDto,
    @Auth() auth: AuthInfo,
  ): Promise<PartUpdateResponseDto> {
    return await this._partService.update(partNumber, dto, auth.sub);
  }
}
