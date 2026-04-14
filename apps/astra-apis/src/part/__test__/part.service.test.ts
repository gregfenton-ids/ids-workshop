import type {PagedResponseDto} from '@ids/data-models';
import {BadRequestException, ConflictException, NotFoundException} from '@nestjs/common';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RavenDocumentStoreProvider} from '../../infrastructure/ravendb/document-store.provider';
import {RavenSessionFactory} from '../../infrastructure/ravendb/session-factory';
import type {PartCreateDto} from '../dto/part-create.dto';
import {PartCreateResponseDto} from '../dto/part-create.dto';
import {PartWithInventoryResponseDto} from '../dto/part-list.query.dto';
import type {PartUpdateDto} from '../dto/part-update.dto';
import {Part, PartStatus} from '../entities/part.entity';
import {PartService} from '../part.service';

function createQueryChain(parts: Part[] = [], totalResults = 0) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['whereEquals', 'search', 'orderBy', 'skip', 'take'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain['statistics'] = vi.fn().mockImplementation((cb: (s: {totalResults: number}) => void) => {
    cb({totalResults});
    return chain;
  });
  chain['all'] = vi.fn().mockResolvedValue(parts);
  return chain;
}

function createMockSession() {
  const session = {
    load: vi.fn(),
    store: vi.fn(),
    saveChanges: vi.fn(),
    dispose: vi.fn(),
    query: vi.fn().mockReturnValue(createQueryChain()),
    [Symbol.dispose]() {
      (this as {dispose: () => void}).dispose();
    },
  };
  return session;
}

function createMockSessionFactory(session: ReturnType<typeof createMockSession>) {
  return {openSession: vi.fn().mockReturnValue(session)} as unknown as RavenSessionFactory;
}

function createMockStoreProvider() {
  return {
    getStore: vi.fn().mockReturnValue({
      executeIndex: vi.fn().mockResolvedValue(undefined),
    }),
  } as unknown as RavenDocumentStoreProvider;
}

const mockVendor = (overrides: Partial<{id: string; vendorNumber: string; name: string}> = {}) => ({
  id: 'vendors/ACME',
  vendorNumber: 'ACME',
  name: 'ACME Corp',
  ...overrides,
});

const mockPart = (overrides: Partial<Part> = {}): Part => ({
  id: 'parts/PART-001',
  partNumber: 'PART-001',
  description: 'Test Part',
  status: PartStatus.Active,
  totalOnHand: 0,
  totalCommitted: 0,
  totalSpecialOrderCommitted: 0,
  totalOnOrder: 0,
  totalBackordered: 0,
  totalAvailable: 0,
  totalNetAvailable: 0,
  vendors: [],
  locations: [],
  createdBy: 'user-123',
  updatedBy: 'user-123',
  createdDate: new Date(),
  updatedDate: new Date(),
  isDeleted: false,
  version: 1,
  ...overrides,
});

const baseCreateDto: PartCreateDto = {
  partNumber: 'PART-001',
  description: 'Test Part',
  vendors: [{vendorNumber: 'ACME', isPrimary: true}],
};

describe('PartService', () => {
  let service: PartService;
  let session: ReturnType<typeof createMockSession>;
  let storeProvider: RavenDocumentStoreProvider;

  beforeEach(async () => {
    session = createMockSession();
    storeProvider = createMockStoreProvider();
    service = new PartService(storeProvider, createMockSessionFactory(session));
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId: string = 'user-123';

    it('should create a part successfully with one vendor', async () => {
      session.load
        .mockResolvedValueOnce(null) // existing part check
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()}); // vendor batch load

      const result: PartCreateResponseDto = await service.create(baseCreateDto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({
          partNumber: 'PART-001',
          description: 'Test Part',
          vendors: expect.arrayContaining([expect.objectContaining({isPrimary: true})]),
        }),
        'parts/PART-001',
      );
      expect(session.saveChanges).toHaveBeenCalled();
      expect(result.partNumber).toBe('PART-001');
      expect(result.locationId).toBeNull();
    });

    it('should create a part with multiple vendors', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        partNumber: 'PART-MULTI',
        vendors: [
          {vendorNumber: 'ACME', isPrimary: true, cost: 500},
          {vendorNumber: 'GLOBEX', isPrimary: false, cost: 600},
        ],
      };
      session.load.mockResolvedValueOnce(null).mockResolvedValueOnce({
        'vendors/ACME': mockVendor({id: 'vendors/ACME', vendorNumber: 'ACME', name: 'ACME Corp'}),
        'vendors/GLOBEX': mockVendor({
          id: 'vendors/GLOBEX',
          vendorNumber: 'GLOBEX',
          name: 'Globex Inc',
        }),
      });

      const result: PartCreateResponseDto = await service.create(dto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({
          vendors: expect.arrayContaining([
            expect.objectContaining({
              isPrimary: true,
              vendor: expect.objectContaining({vendorNumber: 'ACME'}),
            }),
            expect.objectContaining({
              isPrimary: false,
              vendor: expect.objectContaining({vendorNumber: 'GLOBEX'}),
            }),
          ]),
        }),
        'parts/PART-MULTI',
      );
      expect(result.partNumber).toBe('PART-MULTI');
    });

    it('should set avgCost from primary vendor cost', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        vendors: [{vendorNumber: 'ACME', isPrimary: true, cost: 2500}],
      };
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(dto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({
          avgCost: {amount: 250000, currency: 'USD'},
        }),
        expect.any(String),
      );
    });

    it('should default avgCost to 0 when primary vendor has no cost', async () => {
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(baseCreateDto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({avgCost: {amount: 0, currency: 'USD'}}),
        expect.any(String),
      );
    });

    it('should initialize listPrice to 0 when not provided', async () => {
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(baseCreateDto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({listPrice: {amount: 0, currency: 'USD'}}),
        expect.any(String),
      );
    });

    it('should store provided listPrice', async () => {
      const dto: PartCreateDto = {...baseCreateDto, listPrice: 9999};
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(dto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({listPrice: {amount: 999900, currency: 'USD'}}),
        expect.any(String),
      );
    });

    it('should default vendorPartNumber to partNumber when not provided', async () => {
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(baseCreateDto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({
          vendors: expect.arrayContaining([
            expect.objectContaining({vendorPartNumber: 'PART-001'}),
          ]),
        }),
        expect.any(String),
      );
    });

    it('should use provided vendorPartNumber when given', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        vendors: [{vendorNumber: 'ACME', isPrimary: true, vendorPartNumber: 'VPN-XYZ'}],
      };
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(dto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({
          vendors: expect.arrayContaining([expect.objectContaining({vendorPartNumber: 'VPN-XYZ'})]),
        }),
        expect.any(String),
      );
    });

    it('should set top-level vendorPartNumber from primary vendor', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        vendors: [{vendorNumber: 'ACME', isPrimary: true, vendorPartNumber: 'ACME-PN-001'}],
      };
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(dto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({vendorPartNumber: 'ACME-PN-001'}),
        expect.any(String),
      );
    });

    it('should map optional fields to entity', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        sellUom: 'EA',
        purchaseUom: 'BOX',
        salePurchaseRatio: 12,
        minQty: 5,
        maxQty: 100,
        minDays: 3,
        serialized: true,
        glGroup: 'PARTS',
        taxCode: 'TAX-STD',
      };
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});

      await service.create(dto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({
          sellUom: 'EA',
          purchaseUom: 'BOX',
          salePurchaseRatio: 12,
          minQty: 5,
          maxQty: 100,
          minDays: 3,
          promptForSerialNumber: true,
          glGroup: 'PARTS',
          taxCode: 'TAX-STD',
        }),
        expect.any(String),
      );
    });

    it('should throw ConflictException when part already exists', async () => {
      session.load
        .mockResolvedValueOnce(mockPart({isDeleted: false}))
        .mockResolvedValueOnce(mockPart({isDeleted: false}));

      await expect(service.create(baseCreateDto, userId)).rejects.toThrow(ConflictException);
      await expect(service.create(baseCreateDto, userId)).rejects.toThrow(
        'Part "PART-001" already exists.',
      );
    });

    it('should throw BadRequestException when no primary vendor', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        vendors: [{vendorNumber: 'ACME', isPrimary: false}],
      };
      session.load.mockResolvedValueOnce(null);

      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto, userId)).rejects.toThrow('A Primary Vendor is required.');
    });

    it('should throw BadRequestException when multiple primary vendors', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        vendors: [
          {vendorNumber: 'ACME', isPrimary: true},
          {vendorNumber: 'GLOBEX', isPrimary: true},
        ],
      };
      session.load.mockResolvedValueOnce(null);

      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto, userId)).rejects.toThrow(
        'Only one Primary Vendor is allowed.',
      );
    });

    it('should throw BadRequestException when duplicate vendor codes', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        vendors: [
          {vendorNumber: 'ACME', isPrimary: true},
          {vendorNumber: 'ACME', isPrimary: false},
        ],
      };
      session.load.mockResolvedValueOnce(null);

      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto, userId)).rejects.toThrow('Duplicate Vendor is not allowed.');
    });

    it('should throw BadRequestException when vendor not found', async () => {
      session.load
        .mockResolvedValueOnce(null) // existing part check
        .mockResolvedValueOnce({'vendors/ACME': null}); // vendor batch load returns null entry

      await expect(service.create(baseCreateDto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when location not found', async () => {
      const dto: PartCreateDto = {
        ...baseCreateDto,
        partNumber: 'PART-LOC',
        locationId: 'MISSING-LOC',
      };
      session.load
        .mockResolvedValueOnce(null) // existing part check
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()}) // vendor batch load
        .mockResolvedValueOnce(null); // location lookup

      await expect(service.create(dto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when bin not found', async () => {
      const mockLocation = {id: 'locations/LOC-1', name: 'LOC-1'};
      const dto: PartCreateDto = {
        ...baseCreateDto,
        partNumber: 'PART-BIN',
        locationId: 'LOC-1',
        bins: [{binCode: 'MISSING-BIN', isMain: true}],
      };
      session.load
        .mockResolvedValueOnce(null) // existing part check
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()}) // vendor batch load
        .mockResolvedValueOnce(mockLocation) // location lookup
        .mockResolvedValueOnce({'bins/LOC-1/MISSING-BIN': null}); // bin batch load — not found

      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should bubble raw error on save failure', async () => {
      session.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({'vendors/ACME': mockVendor()});
      session.saveChanges.mockRejectedValue(new Error('Store failed'));

      await expect(service.create(baseCreateDto, userId)).rejects.toThrow('Store failed');
    });
  });

  describe('findOne', () => {
    it('should return a part by part number', async () => {
      session.load.mockResolvedValue(mockPart());

      const result: PartWithInventoryResponseDto = await service.findOne('PART-001');

      expect(session.load).toHaveBeenCalledWith('parts/PART-001');
      expect(result.partNumber).toBe('PART-001');
    });

    it('should throw NotFoundException when part not found', async () => {
      session.load.mockResolvedValue(null);

      await expect(service.findOne('MISSING')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('MISSING')).rejects.toThrow(
        'Part with part number MISSING not found',
      );
    });

    it('should throw NotFoundException when part is soft-deleted', async () => {
      session.load.mockResolvedValue(mockPart({isDeleted: true}));

      await expect(service.findOne('PART-001')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId: string = 'user-456';

    const partWithVendors = () =>
      mockPart({
        vendors: [
          {
            vendor: {id: 'vendors/ACME', vendorNumber: 'ACME', name: 'ACME Corp'},
            vendorPartNumber: 'PART-001',
            isPrimary: true,
            cost: {amount: 100000, currency: 'USD'},
          },
        ],
        locations: [
          {
            location: {id: 'locations/LOC-1', name: 'LOC-1'},
            numOnHand: 10,
            numCommitted: 0,
            numSpecialOrderCommitted: 0,
            numOnOrder: 0,
            numBackordered: 0,
            numAvailable: 10,
            bins: [
              {
                bin: {id: 'bins/LOC-1/A1', binNumber: 'A1', description: 'Bin A1'},
                numOnHand: 10,
                isMain: true,
              },
            ],
          },
        ],
      });

    it('should update description only (partial update)', async () => {
      session.load.mockResolvedValueOnce(partWithVendors());
      const dto: PartUpdateDto = {description: 'Updated Description'};

      const result = await service.update('PART-001', dto, userId);

      expect(result.description).toBe('Updated Description');
      expect(session.saveChanges).toHaveBeenCalled();
    });

    it('should clear an optional field when null is sent', async () => {
      const part = partWithVendors();
      part.comments = 'Old comment';
      session.load.mockResolvedValueOnce(part);

      const dto: PartUpdateDto = {comments: undefined};
      // Simulate three-way: comments not in payload → undefined → skip
      await service.update('PART-001', dto, userId);
      expect(part.comments).toBe('Old comment');
    });

    it('should replace vendors on update', async () => {
      session.load
        .mockResolvedValueOnce(partWithVendors()) // part load
        .mockResolvedValueOnce({
          'vendors/GLOBEX': mockVendor({
            id: 'vendors/GLOBEX',
            vendorNumber: 'GLOBEX',
            name: 'Globex Inc',
          }),
        }); // vendor batch load

      const dto: PartUpdateDto = {
        vendors: [{vendorNumber: 'GLOBEX', isPrimary: true, cost: 2000}],
      };

      const result = await service.update('PART-001', dto, userId);

      expect(result.partNumber).toBe('PART-001');
      expect(session.saveChanges).toHaveBeenCalled();
    });

    it('should replace bins and preserve existing on-hand quantities', async () => {
      session.load
        .mockResolvedValueOnce(partWithVendors()) // part load
        .mockResolvedValueOnce({
          'bins/LOC-1/A1': {id: 'bins/LOC-1/A1', binNumber: 'A1', description: 'Bin A1'},
          'bins/LOC-1/B2': {id: 'bins/LOC-1/B2', binNumber: 'B2', description: 'Bin B2'},
        }); // bin batch load

      const dto: PartUpdateDto = {
        bins: [
          {binCode: 'A1', isMain: true},
          {binCode: 'B2', isMain: false},
        ],
      };

      await service.update('PART-001', dto, userId);
      expect(session.saveChanges).toHaveBeenCalled();
    });

    it('should throw NotFoundException when part not found', async () => {
      session.load.mockResolvedValueOnce(null);

      await expect(service.update('MISSING', {description: 'x'}, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when part is soft-deleted', async () => {
      session.load.mockResolvedValueOnce(mockPart({isDeleted: true}));

      await expect(service.update('PART-001', {description: 'x'}, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when no primary vendor in vendor update', async () => {
      session.load.mockResolvedValueOnce(partWithVendors());

      const dto: PartUpdateDto = {
        vendors: [{vendorNumber: 'ACME', isPrimary: false}],
      };

      await expect(service.update('PART-001', dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when duplicate vendors in update', async () => {
      session.load.mockResolvedValueOnce(partWithVendors());

      const dto: PartUpdateDto = {
        vendors: [
          {vendorNumber: 'ACME', isPrimary: true},
          {vendorNumber: 'ACME', isPrimary: false},
        ],
      };

      await expect(service.update('PART-001', dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for cross-field validation (maxQty < minQty)', async () => {
      session.load.mockResolvedValueOnce(partWithVendors());

      const dto: PartUpdateDto = {minQty: 100, maxQty: 10};

      await expect(service.update('PART-001', dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when bin not found in update', async () => {
      session.load
        .mockResolvedValueOnce(partWithVendors()) // part load
        .mockResolvedValueOnce({'bins/LOC-1/MISSING': null}); // bin batch load

      const dto: PartUpdateDto = {
        bins: [{binCode: 'MISSING', isMain: true}],
      };

      await expect(service.update('PART-001', dto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllWithInventory', () => {
    const locationId: string = 'loc-123';

    it('should return parts with inventory for a location', async () => {
      const parts = [mockPart()];
      const queryChain = createQueryChain(parts, 1);
      session.query.mockReturnValue(queryChain);

      const result: PagedResponseDto<PartWithInventoryResponseDto> =
        await service.findAllWithInventory({locationId});

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(queryChain.whereEquals).toHaveBeenCalledWith('isDeleted', false);
      expect(queryChain.whereEquals).toHaveBeenCalledWith('locationIds', `locations/${locationId}`);
    });

    it('should apply search term filter', async () => {
      const queryChain = createQueryChain([], 0);
      session.query.mockReturnValue(queryChain);

      await service.findAllWithInventory({locationId, searchTerm: 'test'});

      expect(queryChain.search).toHaveBeenCalledWith('query', 'test*', 'AND');
    });

    it('should apply pagination', async () => {
      const queryChain = createQueryChain([], 0);
      session.query.mockReturnValue(queryChain);

      await service.findAllWithInventory({locationId, page: 3, pageSize: 25});

      expect(queryChain.skip).toHaveBeenCalledWith(50);
      expect(queryChain.take).toHaveBeenCalledWith(25);
    });

    it('should use defaults for page and pageSize', async () => {
      const queryChain = createQueryChain([], 0);
      session.query.mockReturnValue(queryChain);

      await service.findAllWithInventory({locationId});

      expect(queryChain.skip).toHaveBeenCalledWith(0);
      expect(queryChain.take).toHaveBeenCalledWith(50);
    });
  });
});
