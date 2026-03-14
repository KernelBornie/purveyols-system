import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page for unauthenticated users', () => {
  render(<App />);
  const heading = screen.getByText(/PURVEYOLS/i);
  expect(heading).toBeInTheDocument();
});
