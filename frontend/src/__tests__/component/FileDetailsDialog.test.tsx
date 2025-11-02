import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import FileDetailsDialog from '../../components/FileDetailsDialog';

describe('FileDetailsDialog Component', () => {
  const file = {
    name: "test-file.txt",
    mimeType: "text/plain",
    likecount: 10,
    uploadDate: new Date().getTime(),
  };

  test('renders FileDetailsDialog component', () => {
    render(<FileDetailsDialog open={true} file={file} onClose={() => {}} onDownload={() => {}} />);
    expect(screen.getByText('File Name:')).toBeInTheDocument();
    expect(screen.getByText('File Type:')).toBeInTheDocument();
  });

  test('displays file details correctly', () => {
    render(<FileDetailsDialog open={true} file={file} onClose={() => {}} onDownload={() => {}} />);
    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    expect(screen.getByText('text/plain')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<FileDetailsDialog open={true} file={file} onClose={onClose} onDownload={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    render(<FileDetailsDialog open={true} file={file} onClose={() => {}} onDownload={onDownload} />);
    fireEvent.click(screen.getByRole('button', { name: /download file/i }));
    expect(onDownload).toHaveBeenCalled();
  });

  test('does not render when open is false', () => {
    render(<FileDetailsDialog open={false} file={file} onClose={() => {}} onDownload={() => {}} />);
    expect(screen.queryByText('File Name:')).not.toBeInTheDocument();
  });

  test('renders likes correctly', () => {
    render(<FileDetailsDialog open={true} file={file} onClose={() => {}} onDownload={() => {}} />);
    expect(screen.getByText('Likes:')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('renders upload date correctly', () => {
    render(<FileDetailsDialog open={true} file={file} onClose={() => {}} onDownload={() => {}} />);
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
    expect(screen.getByText(new Date(file.uploadDate).toLocaleString())).toBeInTheDocument();
  });
});