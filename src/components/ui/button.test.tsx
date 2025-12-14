import { describe, it, expect } from 'vitest';
import { buttonVariants } from './button';

describe('Button Component', () => {
    describe('buttonVariants', () => {
        it('should return default button classes', () => {
            const classes = buttonVariants();
            expect(classes).toContain('inline-flex');
            expect(classes).toContain('items-center');
            expect(classes).toContain('justify-center');
            expect(classes).toContain('bg-primary');
        });

        it('should apply destructive variant classes', () => {
            const classes = buttonVariants({ variant: 'destructive' });
            expect(classes).toContain('bg-destructive');
            expect(classes).toContain('text-white');
        });

        it('should apply outline variant classes', () => {
            const classes = buttonVariants({ variant: 'outline' });
            expect(classes).toContain('border');
            expect(classes).toContain('bg-background');
        });

        it('should apply secondary variant classes', () => {
            const classes = buttonVariants({ variant: 'secondary' });
            expect(classes).toContain('bg-secondary');
            expect(classes).toContain('text-secondary-foreground');
        });

        it('should apply ghost variant classes', () => {
            const classes = buttonVariants({ variant: 'ghost' });
            expect(classes).toContain('hover:bg-accent');
        });

        it('should apply link variant classes', () => {
            const classes = buttonVariants({ variant: 'link' });
            expect(classes).toContain('text-primary');
            expect(classes).toContain('underline-offset-4');
        });

        it('should apply sm size classes', () => {
            const classes = buttonVariants({ size: 'sm' });
            expect(classes).toContain('h-8');
        });

        it('should apply lg size classes', () => {
            const classes = buttonVariants({ size: 'lg' });
            expect(classes).toContain('h-10');
        });

        it('should apply icon size classes', () => {
            const classes = buttonVariants({ size: 'icon' });
            expect(classes).toContain('size-9');
        });

        it('should merge custom className with variant classes', () => {
            const classes = buttonVariants({ className: 'custom-class' });
            expect(classes).toContain('custom-class');
            expect(classes).toContain('bg-primary');
        });
    });
});
