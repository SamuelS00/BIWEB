import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, IconButton, Switch, Banner, FieldTypeIcon } from '../src';

describe('ui', () => {
  it('Button aplica variante e dispara onPress', () => {
    let n = 0;
    render(<Button variant="primary" onPress={() => n++}>Aplicar</Button>);
    const b = screen.getByRole('button', { name: 'Aplicar' });
    expect(b.className).toContain('bw-btn--primary');
    fireEvent.click(b);
    expect(n).toBe(1);
  });
  it('IconButton exige nome acessível', () => {
    render(<IconButton icon="undo" label="Desfazer" shortcut="⌘Z" />);
    expect(screen.getByRole('button', { name: 'Desfazer' })).toBeTruthy();
  });
  it('Switch expõe papel switch e alterna', () => {
    render(<Switch>Legenda</Switch>);
    const s = screen.getByRole('switch', { name: 'Legenda' }) as HTMLInputElement;
    expect(s.checked).toBe(false);
    fireEvent.click(s);
    expect(s.checked).toBe(true);
  });
  it('Banner de erro usa role alert e texto', () => {
    render(<Banner tone="danger">sap-estoque: falha de credencial</Banner>);
    expect(screen.getByRole('alert').textContent).toContain('falha de credencial');
  });
  it('FieldTypeIcon tem rótulo além da cor', () => {
    render(<FieldTypeIcon kind="metric" />);
    expect(screen.getByRole('img', { name: 'Métrica' })).toBeTruthy();
  });
});
