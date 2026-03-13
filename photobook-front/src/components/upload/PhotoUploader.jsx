import { useState, useRef } from 'react';
import useUIStore from '../../stores/uiStore';

const PhotoUploader = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useUIStore();

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length !== selectedFiles.length) {
      showError('Seuls les fichiers image sont acceptés');
    }

    setFiles((prev) => [...prev, ...imageFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length !== droppedFiles.length) {
      showError('Seuls les fichiers image sont acceptés');
    }

    setFiles((prev) => [...prev, ...imageFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showError('Aucun fichier sélectionné');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simuler l'upload (à remplacer par votre API)
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('photo', files[i]);

        // TODO: Remplacer par votre endpoint d'upload
        // await api.post('/photos/upload', formData, {
        //   headers: { 'Content-Type': 'multipart/form-data' },
        //   onUploadProgress: (progressEvent) => {
        //     const percentCompleted = Math.round(
        //       ((i + progressEvent.loaded / progressEvent.total) / files.length) * 100
        //     );
        //     setProgress(percentCompleted);
        //   },
        // });

        // Simulation
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      showSuccess(`${files.length} photo(s) uploadée(s) avec succès`);
      setFiles([]);
      if (onUploadSuccess) onUploadSuccess();
    } catch {
      showError('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-6xl mb-4">📸</div>
        <p className="text-lg font-medium text-gray-700 mb-2">
          Glissez-déposez vos photos ici
        </p>
        <p className="text-sm text-gray-500 mb-4">
          ou cliquez pour sélectionner des fichiers
        </p>
        <button
          type="button"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Parcourir
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {files.length} fichier(s) sélectionné(s)
            </h3>
            <button
              onClick={() => setFiles([])}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Tout supprimer
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Barre de progression */}
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center mt-2 text-gray-600">
                Upload en cours... {progress}%
              </p>
            </div>
          )}

          {/* Bouton d'upload */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {uploading ? 'Upload en cours...' : `Uploader ${files.length} photo(s)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
