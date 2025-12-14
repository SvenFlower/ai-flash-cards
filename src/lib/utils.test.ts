import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should merge Tailwind classes correctly', () => {
    // twMerge should handle conflicting Tailwind classes
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, 'bar', null, 'baz')).toBe('foo bar baz');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn('', '')).toBe('');
  });

  it('should handle complex Tailwind class merging', () => {
    // Test that later classes override earlier ones
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('rounded-md', 'rounded-lg')).toBe('rounded-lg');
  });

  it('should preserve non-conflicting classes', () => {
    expect(cn('px-2 py-3', 'px-4 text-center')).toBe('py-3 px-4 text-center');
  });

  it('should handle responsive classes', () => {
    expect(cn('text-sm', 'md:text-lg', 'lg:text-xl')).toBe(
      'text-sm md:text-lg lg:text-xl'
    );
  });

  it('should handle state variants', () => {
    expect(cn('hover:bg-blue-500', 'focus:bg-green-500')).toBe(
      'hover:bg-blue-500 focus:bg-green-500'
    );
  });

  it('should merge classes in object notation', () => {
    const isActive = true;
    const isDisabled = false;
    expect(
      cn({
        'bg-blue-500': isActive,
        'bg-gray-300': isDisabled,
        'text-white': true,
      })
    ).toBe('bg-blue-500 text-white');
  });

  it('should handle mixed input types', () => {
    expect(
      cn('base-class', { 'conditional-class': true }, ['array-class'], 'final-class')
    ).toBe('base-class conditional-class array-class final-class');
  });

  it('should handle complex real-world scenarios', () => {
    // Button component example
    const disabled = false;
    const variant = 'primary';

    expect(
      cn(
        'px-4 py-2 rounded-md font-medium',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )
    ).toBe('px-4 py-2 rounded-md font-medium bg-blue-500 text-white');
  });
});
