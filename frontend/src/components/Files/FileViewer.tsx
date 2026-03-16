import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  file: {
    id: number;
    original_name: string;
    mime_type: string;
    file_path?: string;
  } | null;
  onDownload?: (fileId: number) => void;
  onDelete?: (fileId: number) => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  open,
  onClose,
  file,
  onDownload,
  onDelete
}) => {
  if (!file) return null;

  const isImage = file.mime_type?.startsWith('image/');
  const fileUrl = file.file_path || `http://localhost:8000/api/files/download/${file.id}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
          {file.original_name}
        </Typography>
        <Box>
          {onDownload && (
            <IconButton onClick={() => onDownload(file.id)} color="primary">
              <DownloadIcon />
            </IconButton>
          )}
          {onDelete && (
            <IconButton onClick={() => onDelete(file.id)} color="error">
              <DeleteIcon />
            </IconButton>
          )}
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            p: 2,
          }}
        >
          {isImage ? (
            <img
              src={fileUrl}
              alt={file.original_name}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                Этот тип файла нельзя просмотреть в браузере
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => onDownload?.(file.id)}
                sx={{ mt: 2 }}
              >
                Скачать файл
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
