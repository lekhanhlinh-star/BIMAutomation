import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccessibleDialog from './AccessibleDialog';

describe('AccessibleDialog', () => {
  it('has dialog semantics and closes with Escape', () => {
    const onClose = vi.fn();
    render(<AccessibleDialog open onClose={onClose} title="Tiếp tục"><button>Đăng nhập</button></AccessibleDialog>);
    expect(screen.getByRole('dialog', { name: 'Tiếp tục' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
