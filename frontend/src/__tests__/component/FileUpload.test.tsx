import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileUpload } from '../../Views/Home/Home';
import { describe, test, expect, vi, Mock } from 'vitest';
import { fileUpload } from '../../router/routes';
import { BrowserRouter as Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

vi.mock('../../router/routes', () => ({
  fileUpload: vi.fn(),
  getRandomFile: vi.fn(),
  getDownloadToken: vi.fn(),
  downloadFile: vi.fn(),
}));

describe('FileUpload Component', () => {
  const setIsFileUploaded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<Router>{ui}</Router>);
  };

  test('renders FileUpload component', async () => {
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    expect(screen.getByText(/Upload & Unwrap a Random File/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats: audio, video, image, text and application./i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop or click to upload/i)).toBeInTheDocument();
  });

  test('handles file selection', async () => {
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });

    if (input) {
      await userEvent.upload(input as HTMLInputElement, file);
    }

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
  });

  test('removes file from dropzone', async () => {
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });

    if (input) {
      await userEvent.upload(input as HTMLInputElement, file);
    }

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();

    // Simulate removing the file
    const removeButton = screen.getByLabelText('Delete');
    fireEvent.click(removeButton);

    expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
  });

  test('disables upload button when file is removed', async () => {
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });

    if (input) {
      await userEvent.upload(input as HTMLInputElement, file);
    }

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();

    // Simulate removing the file
    const removeButton = screen.getByLabelText('Delete');
    fireEvent.click(removeButton);

    expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Upload/i })).not.toBeInTheDocument();
  });


  test('handles file upload', async () => {
    (fileUpload as Mock).mockResolvedValueOnce({});
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });

    if (input) {
      await userEvent.upload(input as HTMLInputElement, file);
    }

    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => expect(fileUpload).toHaveBeenCalledWith(file, expect.any(Function)));
    await waitFor(() => expect(screen.getByText(/Upload successful!/i)).toBeInTheDocument());
  });

  test('displays progress bar during file upload', async () => {
    (fileUpload as Mock).mockImplementation((file, onProgress) => {
      onProgress(50);
      return Promise.resolve({});
    });

    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });

    if (input) {
      await userEvent.upload(input as HTMLInputElement, file);
    }

    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => expect(screen.getByText(/Uploading... 50%/i)).toBeInTheDocument());
  });

  test('rejects file larger than 20MB and shows error message', async () => {
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
    
    const largeFile = new File([new ArrayBuffer(21 * 1024 * 1024)], 'large-file.mp4', { type: 'video/mp4' });
  
    if (input) {
      await userEvent.upload(input as HTMLInputElement, largeFile);
    }
  
    await waitFor(() => expect(screen.getByText(/File is too big./i)).toBeInTheDocument());
  });

  test('rejects multiple file uploads when filesLimit=1', async () => {
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
  
    const file1 = new File(['file content'], 'file1.txt', { type: 'text/plain' });
    const file2 = new File(['file content'], 'file2.txt', { type: 'text/plain' });
  
    if (input) {
      await userEvent.upload(input as HTMLInputElement, [file1, file2]);
    }
  
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
    expect(screen.queryByText('file2.txt')).not.toBeInTheDocument();
  });

  test('handles file upload error', async () => {
    (fileUpload as Mock).mockRejectedValueOnce(new Error('Upload failed'));
    await act(async () => {
      renderWithRouter(<FileUpload setIsFileUploaded={setIsFileUploaded} />);
    });
    const input = document.querySelector('input[type="file"]');
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });

    if (input) {
      await userEvent.upload(input as HTMLInputElement, file);
    }

    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => expect(screen.getByText(/Error uploading file/i)).toBeInTheDocument());
  });
});