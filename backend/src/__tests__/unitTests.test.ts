// thumbnailUtils.test.ts
import * as moduleUnderTest from '../util';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import path = require('path');

// --- Mock for fs ---
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return Object.assign({}, actualFs, {
    promises: {
      access: jest.fn(),
      readFile: jest.fn(),
    },
  });
});

// --- Mock for sharp ---
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  }));
});

const mockedSharp = jest.mocked(sharp, { shallow: true });

const imagePath = path.resolve(__dirname, "assets", "testImage.png");
const dummyTextPath = path.resolve(__dirname, "assets", "dummy.txt");

/*describe('ensureDefaultThumbnailExists', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  

    it('should log "Default thumbnail already exists." when the thumbnail exists', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  
      await moduleUnderTest.ensureDefaultThumbnailExists();
  
      expect(consoleLogSpy).toHaveBeenCalledWith('Creating default thumbnail...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Default thumbnail created:", "/builds/mwa/ws24/swapmybytes-developers/swapmybytes-webapp/backend/src/uploads/default-thumbnail.png');

    });

    it('should log "Creating default thumbnail..." when the thumbnail does not exist', async () => {
      jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
  
      await moduleUnderTest.ensureDefaultThumbnailExists();
  
      expect(consoleLogSpy).toHaveBeenCalledWith('Default thumbnail already exists.');
    });
});*/

describe('hashFile', () => {
  let readFileMock: jest.Mock;

  beforeEach(() => {
    readFileMock = fsPromises.readFile as jest.Mock;
    readFileMock.mockReset();
  });

  it('should return a hash with the correct length', async () => {
    const fileContent = Buffer.from('test content');
    readFileMock.mockResolvedValue(fileContent);
      
    const result = await moduleUnderTest.hashFile(dummyTextPath);
    expect(result.length).toBe(64); 
  });

  it('should throw an error when readFile fails', async () => {
    readFileMock.mockRejectedValue(new Error('File not found'));

    await expect(moduleUnderTest.hashFile('C:/noFileFound'))
      .rejects
      .toThrow("Error hashing file: ENOENT: no such file or directory, open 'C:/noFileFound'");
  });
});

describe('createImgThumbnail', () => {
  it('should create a thumbnail and return the thumbnail path', async () => {
    const thumbnailPath = 'thumb.jpg';

    const result = await moduleUnderTest.createImgThumbnail(imagePath, thumbnailPath);

    expect(result).toBe(thumbnailPath);
    expect(sharp).toHaveBeenCalledWith(imagePath);
  });

  it('should throw an error when thumbnail creation fails', async () => {
    const thumbnailPath = 'thumb.jpg';
    const errorMessage = 'Processing error';

    mockedSharp.mockImplementationOnce(() => ({
      resize: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockRejectedValue(new Error(errorMessage)),
    }) as unknown as sharp.Sharp);

    await expect(moduleUnderTest.createImgThumbnail(imagePath, thumbnailPath))
      .rejects
      .toThrow(`Image thumbnail creation failed for ${thumbnailPath}`);
  });
});
