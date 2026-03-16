import React, { useState, useEffect } from 'react';
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
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../config';
import { FileViewer } from './FileViewer';

interface FileUploaderProps {
  open: boolean;
  onClose: () => void;
  candidateId: number;
  onUploadSuccess?: () => void;
}

interface FileItem {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  file_path?: string;
  mime_type: string;
  created_at: string;
  uploaded_by: number;
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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const api = useApi();

  useEffect(() => {
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
    formData.append('candidate_id', candidateId.toString());

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
    try {
      const response = await fetch(ENDPOINTS.DOWNLOAD_FILE(fileId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Ошибка при скачивании файла');
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
      if (selectedFile?.id === fileId) {
        setViewerOpen(false);
        setSelectedFile(null);
      }
    }
  };

  const handleView = (file: FileItem) => {
    setSelectedFile(file);
    setViewerOpen(true);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PdfIcon />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <DocIcon />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <ExcelIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon /> Файлы кандидата
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
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
                sx={{ mb: uploading ? 1 : 0 }}
              >
                Загрузить файл
              </Button>
            </label>
            {uploading && <LinearProgress sx={{ mt: 1 }} />}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Максимальный размер файла: 10 MB
            </Typography>
          </Paper>

          {files.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Нет загруженных файлов
            </Typography>
          ) : (
            <List>
              {files.map((file) => (
                <Paper
                  key={file.id}
                  variant="outlined"
                  sx={{ mb: 1 }}
                >
                  <ListItem
                    button
                    onClick={() => handleView(file)}
                    sx={{
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                      },
                    }}
                  >
                    <ListItemIcon>
                      {getFileIcon(file.mime_type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.original_name}
                      secondary={`${formatFileSize(file.file_size)} • ${new Date(file.created_at).toLocaleDateString()}`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        noWrap: true,
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.id, file.original_name);
                        }}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id);
                        }}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <FileViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        file={selectedFile}
        onDownload={(fileId) => handleDownload(fileId, selectedFile?.original_name || 'file')}
        onDelete={handleDelete}
      />
    </>
  );
};
