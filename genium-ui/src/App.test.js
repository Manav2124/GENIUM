import { render, screen } from '@testing-library/react';
import App from './App';

test('renders GENIUM link', () => {
  render(<App />);
  const linkElement = screen.getByText(/GENIUM/i);;
  expect(linkElement).toBeInTheDocument();
});
