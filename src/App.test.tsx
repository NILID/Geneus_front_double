import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('family-chart', () => ({
  createChart: jest.fn(() => ({
    setCardHtml: jest.fn().mockReturnThis(),
    setCardDisplay: jest.fn().mockReturnThis(),
    updateTree: jest.fn().mockReturnThis(),
  })),
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
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => samplePayload,
  }) as jest.Mock;
});

test('renders family chart container', async () => {
  render(<App />);
  const chartElement = screen.getByTestId('family-chart-root');
  expect(chartElement).toBeInTheDocument();
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
});
