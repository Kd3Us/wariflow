import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TokenVerificationService } from './token-verification.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TokenVerificationService', () => {
  let service: TokenVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenVerificationService],
    }).compile();

    service = module.get<TokenVerificationService>(TokenVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return true for valid token', async () => {
    const mockResponse = {
      data: {
        body: 'Valid token',
        code: 200,
        status: true,
      },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await service.verifyToken('valid-token');
    expect(result).toBe(true);
  });

  it('should return false for invalid token', async () => {
    const mockResponse = {
      data: {
        body: 'Invalid token',
        code: 401,
        status: false,
      },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await service.verifyToken('invalid-token');
    expect(result).toBe(false);
  });

  it('should throw HttpException for 401 error', async () => {
    const mockError = {
      isAxiosError: true,
      response: {
        status: 401,
      },
    };

    mockedAxios.post.mockRejectedValue(mockError);

    await expect(service.verifyToken('invalid-token')).rejects.toThrow(
      new HttpException('Invalid token', HttpStatus.UNAUTHORIZED),
    );
  });

  it('should throw HttpException for 500 error', async () => {
    const mockError = {
      isAxiosError: true,
      response: {
        status: 500,
      },
    };

    mockedAxios.post.mockRejectedValue(mockError);

    await expect(service.verifyToken('token')).rejects.toThrow(
      new HttpException('Token verification service unavailable', HttpStatus.SERVICE_UNAVAILABLE),
    );
  });
}); 