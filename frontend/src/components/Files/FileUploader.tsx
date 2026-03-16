import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';

interface FileUploaderProps {
  open: boolean;
  onClose: () => void;
  candidateId: number;
  onUploadSuccess?: () => void;
}

interface FileItem {
  id: number;
  original_name: string;
  file_size: number;
  created_at: string;
  mime_type: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  open,
  onClose,
  candidateId,
  onUploadSuccess
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  // Загружаем список файлов при открытии
  React.useEffect(() => {
    if (open && candidateId) {
      loadFiles();
    }
  }, [open, candidateId]);

  const loadFiles = async () => {
    const result = await api.execute(
      fetch(ENDPOINTS.CANDIDATE_FILES(candidateId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );
    if (result.success && result.data) {
      setFiles(result.data as FileItem[]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (candidateId) {
      formData.append('candidate_id', candidateId.toString());
    }

    const result = await api.execute(
      fetch(ENDPOINTS.UPLOAD_FILE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })
    );

    setUploading(false);

    if (result.success) {
      loadFiles();
      onUploadSuccess?.();
    } else {
      setError(result.error || 'Ошибка загрузки файла');
    }
  };

  const handleDownload = async (fileId: number, filename: string) => {
    const result = await api.execute(
      fetch(ENDPOINTS.DOWNLOAD_FILE(fileId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success && result.data) {
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!window.confirm('Удалить файл?')) return;

    const result = await api.execute(
      fetch(ENDPOINTS.DELETE_FILE(fileId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    );

    if (result.success) {
      loadFiles();
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PdfIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>📎 Файлы кандидата</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
              disabled={uploading}
              fullWidth
            >
              Загрузить файл
            </Button>
          </label>
          {uploading && <LinearProgress sx={{ mt: 1 }} />}
        </Box>

        <List>
          {files.map((file) => (
            <ListItem key={file.id}>
              <ListItemIcon>
                {getFileIcon(file.mime_type)}
              </ListItemIcon>
              <ListItemText
                primary={file.original_name}
                secondary={`${formatFileSize(file.file_size)} • ${new Date(file.created_at).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDownload(file.id, file.original_name)}
                  sx={{ mr: 1 }}
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(file.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {files.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              Нет загруженных файлов
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};
