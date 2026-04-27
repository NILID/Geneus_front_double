import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('./components/FamilyChartEditor', () => ({
  FamilyChartEditor: () => <div data-testid="family-chart-root" />,
}));

import App from './App';

const samplePayload = [
  {
    id: '1',
    data: {
      'first name': 'John',
      'last name': 'Doe',
      birthday: '1980',
      gender: 'M' as const,
    },
    rels: { spouses: ['2'], children: ['3'], parents: [] as string[] },
  },
  {
    id: '2',
    data: {
      'first name': 'Jane',
      'last name': 'Doe',
      birthday: '1982',
      gender: 'F' as const,
    },
    rels: { spouses: ['1'], children: ['3'], parents: [] as string[] },
  },
  {
    id: '3',
    data: {
      'first name': 'Bob',
      'last name': 'Doe',
      birthday: '2005',
      gender: 'M' as const,
    },
    rels: { spouses: [] as string[], children: [] as string[], parents: ['1', '2'] },
  },
];

beforeEach(() => {
  window.localStorage.setItem('geneus_jwt', 'test-token');
  global.fetch = jest
    .fn()
    .mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 1, email: 'user@example.com' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => samplePayload,
      });
    }) as jest.Mock;
});

afterEach(() => {
  window.localStorage.removeItem('geneus_jwt');
  jest.restoreAllMocks();
});

test('loads chart and renders editor placeholder when authenticated', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  await waitFor(() => {
    expect(screen.getByTestId('family-chart-root')).toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalled();
});
