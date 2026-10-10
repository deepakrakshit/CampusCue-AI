import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingView } from '../components/LandingView';

describe('LandingView Component', () => {
  it('renders title, hero description, and both practice options', () => {
    const handleStartGd = vi.fn();
    const handleStartInterview = vi.fn();

    render(<LandingView onStartGd={handleStartGd} onStartInterview={handleStartInterview} />);

    expect(screen.getByText(/Master Group Discussions & Technical Interviews/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Group Discussion/i)).toBeInTheDocument();
    expect(screen.getByText(/Technical Deep-Dive/i)).toBeInTheDocument();
    expect(screen.getByText(/Configure GD Room/i)).toBeInTheDocument();
    expect(screen.getByText(/Setup Technical Interview/i)).toBeInTheDocument();
  });

  it('triggers onStartGd when user clicks Configure GD Room button', () => {
    const handleStartGd = vi.fn();
    const handleStartInterview = vi.fn();

    render(<LandingView onStartGd={handleStartGd} onStartInterview={handleStartInterview} />);

    const gdButton = screen.getByText(/Configure GD Room/i);
    fireEvent.click(gdButton);

    expect(handleStartGd).toHaveBeenCalledTimes(1);
    expect(handleStartInterview).not.toHaveBeenCalled();
  });

  it('triggers onStartInterview when user clicks Setup Technical Interview button', () => {
    const handleStartGd = vi.fn();
    const handleStartInterview = vi.fn();

    render(<LandingView onStartGd={handleStartGd} onStartInterview={handleStartInterview} />);

    const interviewButton = screen.getByText(/Setup Technical Interview/i);
    fireEvent.click(interviewButton);

    expect(handleStartInterview).toHaveBeenCalledTimes(1);
    expect(handleStartGd).not.toHaveBeenCalled();
  });

  it('displays the responsible AI notice', () => {
    render(<LandingView onStartGd={vi.fn()} onStartInterview={vi.fn()} />);

    expect(screen.getByText(/Student Privacy & Responsible AI Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero fabricated claims/i)).toBeInTheDocument();
  });
});
