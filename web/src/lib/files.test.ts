import { describe, expect, it } from 'vitest';
import { checkFile } from './files';

describe('checkFile', () => {
  it('accepts PDF, JPG and PNG files up to 3 MB', () => {
    expect(checkFile({ type: 'application/pdf', size: 3 * 1024 * 1024 })).toBeNull();
    expect(checkFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(checkFile({ type: 'image/png', size: 1000 })).toBeNull();
  });

  it('refuses other types and larger files', () => {
    expect(checkFile({ type: 'application/msword', size: 1000 })).toBe('upload.wrongType');
    expect(checkFile({ type: 'image/heic', size: 1000 })).toBe('upload.wrongType');
    expect(checkFile({ type: 'application/pdf', size: 3 * 1024 * 1024 + 1 })).toBe('upload.tooLarge');
  });
});
