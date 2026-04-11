import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page for unauthenticated users', () => {
  render(<App />);
  const heading = screen.getByText(/BuildSync/i);
  expect(heading).toBeInTheDocument();
});
