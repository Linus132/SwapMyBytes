import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RandomFileDownload } from '../../Views/Home/Home';
import { describe, test, expect, vi, Mock } from 'vitest';
import { downloadFile, getDownloadToken, getRandomFile } from '../../router/routes';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';


vi.mock('../../router/routes', () => ({
    downloadFile: vi.fn(),
    getRandomFile: vi.fn(),
    getDownloadToken: vi.fn(),
  }));

  vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
      ...actual,
      useNavigate: vi.fn(),
    };
  });

describe('RandomFileDownload Component', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as Mock).mockReturnValue(mockNavigate);
    });

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<Router>{ui}</Router>);
      };
    
    test('renders the download button', async () => {
        (getRandomFile as Mock).mockResolvedValueOnce({ id: 'file123' });
        (getDownloadToken as Mock).mockResolvedValueOnce({ token: 'test-token' });

        renderWithRouter(<RandomFileDownload />);

        await waitFor(() => expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument());
    });

    test('fetches and sets download token on mount', async () => {
        (getRandomFile as Mock).mockResolvedValueOnce({ id: 'file123' });
        (getDownloadToken as Mock).mockResolvedValueOnce({ token: 'test-token' });
    
        renderWithRouter(<RandomFileDownload />);
    
        await waitFor(() => expect(getRandomFile).toHaveBeenCalled());
        await waitFor(() => expect(getDownloadToken).toHaveBeenCalledWith({ id: 'file123' }));
    
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      });

      test('downt show download button when there is no download token', async () => {
        (getRandomFile as Mock).mockResolvedValueOnce({ id: 'file123' });
        (getDownloadToken as Mock).mockResolvedValueOnce(null);
    
        renderWithRouter(<RandomFileDownload />);
    
        await waitFor(() => expect(getDownloadToken).toHaveBeenCalled());
    
        expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
      });

    test('calls the download function when button is clicked', async () => {
        (getRandomFile as Mock).mockResolvedValueOnce({ id: 'file123' });
        (getDownloadToken as Mock).mockResolvedValueOnce({ token: 'test-token' });
        (downloadFile as Mock).mockResolvedValueOnce({});
    
        renderWithRouter(<RandomFileDownload />);
    
        const downloadButton = await screen.findByRole('button', { name: /download/i });
        fireEvent.click(downloadButton);
    
        await waitFor(() => expect(downloadFile).toHaveBeenCalledWith('test-token'));
    });

    test('displays an error message if download fails', async () => {
        (getRandomFile as Mock).mockResolvedValueOnce({ id: 'file123' });
    (getDownloadToken as Mock).mockResolvedValueOnce({ token: 'test-token' });
    (downloadFile as Mock).mockRejectedValueOnce(new Error('Download failed'));

    renderWithRouter(<RandomFileDownload />);

    const downloadButton = await screen.findByRole('button', { name: /download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => expect(screen.getByText(/Download failed/i)).toBeInTheDocument());
  });

  test('navigates to /files after download', async () => {
    (getRandomFile as Mock).mockResolvedValueOnce({ id: 'file123' });
    (getDownloadToken as Mock).mockResolvedValueOnce({ token: 'test-token' });
    (downloadFile as Mock).mockResolvedValueOnce({});

    renderWithRouter(<RandomFileDownload />);

    const downloadButton = await screen.findByRole('button', { name: /download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/files'));
  });

  test('displays an error if fetching file fails', async () => {
    (getRandomFile as Mock).mockRejectedValueOnce(new Error('File fetch error'));

    renderWithRouter(<RandomFileDownload />);

    await waitFor(() => expect(screen.getByText(/Failed to fetch the file/i)).toBeInTheDocument());
  });
});