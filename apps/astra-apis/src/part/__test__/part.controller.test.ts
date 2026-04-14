import type {PagedResponseDto} from '@ids/data-models';
import {ConflictException, NotFoundException} from '@nestjs/common';
import type {Response} from 'express';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AuthInfo} from '../../auth/auth-utils';
import type {PartCreateDto} from '../dto/part-create.dto';
import {PartCreateResponseDto} from '../dto/part-create.dto';
import {PartListQueryDto, PartWithInventoryResponseDto} from '../dto/part-list.query.dto';
import type {PartUpdateDto, PartUpdateResponseDto} from '../dto/part-update.dto';
import {PartStatus} from '../entities/part.entity';
import {PartController} from '../part.controller';
import type {PartService} from '../part.service';

type PartServiceMock = {
  create: ReturnType<typeof vi.fn>;
  findAllWithInventory: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

type ResponseHeaderMock = {
  setHeader: ReturnType<typeof vi.fn<(name: string, value: string) => void>>;
};

const mockCreateResponseHeader = (): Response => {
  const responseAdapter: ResponseHeaderMock = {
    setHeader: vi.fn(),
  };
  return responseAdapter as unknown as Response;
};

describe('PartController', () => {
  let controller: PartController;
  let partServiceMock: PartServiceMock;

  const authInfoMock: AuthInfo = new AuthInfo(
    'user-123',
    'test-client-id',
    'test-org-id',
    [],
    ['test-aud'],
    ['user'],
  );

  beforeEach(() => {
    partServiceMock = {
      create: vi.fn(),
      findAllWithInventory: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
    };
    controller = new PartController(partServiceMock as unknown as PartService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: PartCreateDto = {
      partNumber: 'PART-001',
      description: 'Test Part',
      vendors: [{vendorNumber: 'ACME', isPrimary: true}],
    };

    const responseMock: Response = mockCreateResponseHeader();

    it('should create a part successfully', async () => {
      const createResponseHeaderMock: PartCreateResponseDto = {
        partNumber: 'PART-001',
        description: 'Test Part',
        locationId: null,
      };
      partServiceMock.create.mockResolvedValue(createResponseHeaderMock);

      const result: PartCreateResponseDto = await controller.create(
        createDto,
        authInfoMock,
        responseMock,
      );

      expect(result).toEqual(createResponseHeaderMock);
      expect(responseMock.setHeader).toHaveBeenCalledWith('Location', '/api/parts/PART-001');
      expect(partServiceMock.create).toHaveBeenCalledWith(createDto, 'user-123');
      expect(partServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when part already exists', async () => {
      partServiceMock.create.mockRejectedValue(new ConflictException('Part already exists'));

      await expect(controller.create(createDto, authInfoMock, responseMock)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.create(createDto, authInfoMock, responseMock)).rejects.toThrow(
        'Part already exists',
      );
    });
  });

  describe('findAll', () => {
    const query: PartListQueryDto = {
      locationId: 'test-org-id',
      page: 1,
      pageSize: 50,
    };

    const responseMock: PagedResponseDto<PartWithInventoryResponseDto> = {
      items: [
        {
          id: 'parts/PART-001',
          partNumber: 'PART-001',
          description: 'Test Part 1',
          status: PartStatus.Active,
          listPrice: null,
          sellUom: null,
          totalOnHand: 0,
          totalCommitted: 0,
          totalSpecialOrderCommitted: 0,
          totalOnOrder: 0,
          totalBackordered: 0,
          totalAvailable: 0,
          totalNetAvailable: 0,
          primaryVendorName: null,
          primaryVendorPartNumber: null,
          primaryBinNumber: null,
          locationOnHand: null,
          locationCommitted: null,
          locationOnOrder: null,
          createdDate: new Date(),
          updatedDate: new Date(),
        },
      ],
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
    };

    it('should return paginated parts with inventory', async () => {
      partServiceMock.findAllWithInventory.mockResolvedValue(responseMock);

      const result: PagedResponseDto<PartWithInventoryResponseDto> =
        await controller.findAll(query);

      expect(result).toEqual(responseMock);
      expect(partServiceMock.findAllWithInventory).toHaveBeenCalledWith(query);
      expect(partServiceMock.findAllWithInventory).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    const partId: string = 'part-uuid';
    const partDtoMock: PartWithInventoryResponseDto = {
      id: 'parts/PART-001',
      partNumber: 'PART-001',
      description: 'Test Part',
      status: PartStatus.Active,
      listPrice: null,
      sellUom: null,
      totalOnHand: 0,
      totalCommitted: 0,
      totalSpecialOrderCommitted: 0,
      totalOnOrder: 0,
      totalAvailable: 0,
      totalNetAvailable: 0,
      totalBackordered: 0,
      primaryVendorName: null,
      primaryVendorPartNumber: null,
      primaryBinNumber: null,
      locationOnHand: null,
      locationCommitted: null,
      locationOnOrder: null,
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    it('should return a part by ID', async () => {
      partServiceMock.findOne.mockResolvedValue(partDtoMock);

      const result: PartWithInventoryResponseDto = await controller.findOne(partId);

      expect(result).toEqual(partDtoMock);
      expect(partServiceMock.findOne).toHaveBeenCalledWith(partId);
      expect(partServiceMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when part not found', async () => {
      partServiceMock.findOne.mockRejectedValue(
        new NotFoundException(`Part with ID ${partId} not found`),
      );

      await expect(controller.findOne(partId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: PartUpdateDto = {
      description: 'Updated Description',
    };

    it('should update a part successfully', async () => {
      const updateResponse: PartUpdateResponseDto = {
        partNumber: 'PART-001',
        description: 'Updated Description',
      };
      partServiceMock.update.mockResolvedValue(updateResponse);

      const result: PartUpdateResponseDto = await controller.update(
        'PART-001',
        updateDto,
        authInfoMock,
      );

      expect(result).toEqual(updateResponse);
      expect(partServiceMock.update).toHaveBeenCalledWith('PART-001', updateDto, 'user-123');
      expect(partServiceMock.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when part not found', async () => {
      partServiceMock.update.mockRejectedValue(
        new NotFoundException('Part with part number MISSING not found'),
      );

      await expect(controller.update('MISSING', updateDto, authInfoMock)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
