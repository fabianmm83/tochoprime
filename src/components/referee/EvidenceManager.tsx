import React, { useState, useRef, useEffect } from 'react';
import { MatchEvidence, Match } from '../../types';
import { refereeService } from '../../services/refereeService';
import {
  Camera,
  Video,
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Image as ImageIcon,
  Film,
  File,
  Mic,
  Link
} from 'lucide-react';

interface EvidenceManagerProps {
  matchId: string;
  refereeId: string;
  onEvidenceAdded?: (evidence: MatchEvidence) => void;
}

const EvidenceManager: React.FC<EvidenceManagerProps> = ({ matchId, refereeId, onEvidenceAdded }) => {
  const [evidence, setEvidence] = useState<MatchEvidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<MatchEvidence['type']>('photo');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [relatedEventId, setRelatedEventId] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    loadEvidence();
  }, [matchId]);

  const loadEvidence = async () => {
    try {
      // ✅ CORRECTO - getMatchEvidence recibe solo 1 parámetro
      const evidenceData = await refereeService.getMatchEvidence(matchId);
      setEvidence(evidenceData);
    } catch (error) {
      console.error('Error cargando evidencia:', error);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Crear preview
    if (selectedType === 'photo' || selectedType === 'video') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      // ✅ CORRECTO - uploadMatchEvidence recibe 5 parámetros
      const result = await refereeService.uploadMatchEvidence(
        matchId,
        file,
        selectedType,
        description,
        relatedEventId || undefined
      );

      if (result.success && result.evidenceId) {
        const newEvidence: MatchEvidence = {
          id: result.evidenceId,
          matchId,
          refereeId,
          type: selectedType,
          fileName: file.name,
          fileUrl: result.url || '',
          fileSize: file.size,
          description: description || '',
          uploadDate: new Date().toISOString(),
          uploadedBy: refereeId,
          tags: [],
          relatedEventId: relatedEventId || undefined,
          verified: false
        };

        setEvidence(prev => [newEvidence, ...prev]);
        onEvidenceAdded?.(newEvidence);
        
        // Reset form
        setDescription('');
        setRelatedEventId('');
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(result.error || 'Error subiendo archivo');
      }
    } catch (error) {
      console.error('Error subiendo evidencia:', error);
      alert('Error subiendo archivo');
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: selectedType === 'video',
        audio: true 
      });
      
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: selectedType === 'video' ? 'video/mp4' : 'audio/webm' 
        });
        
        // ✅ CORRECCIÓN: Usando un enfoque diferente para crear el File
        // El problema es que TypeScript no reconoce el constructor File en algunos entornos
        // Solución: Crear un Blob y luego convertirlo a File
        
        // Método alternativo seguro
        const fileName = `recording_${Date.now()}.${selectedType === 'video' ? 'mp4' : 'webm'}`;
        
        // Crear el File usando el constructor Blob primero
        const audioFile = new Blob([blob], { type: blob.type }) as any;
        audioFile.name = fileName;
        audioFile.lastModified = Date.now();
        
        // Para TypeScript, forzamos el tipo File
        const file: File = audioFile as File;
        
        uploadFile(file);
        setRecordedChunks([]);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Si es video, mostrar preview
      if (selectedType === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error iniciando grabación:', error);
      alert('No se pudo acceder a la cámara/micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Detener streams
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  };

  const deleteEvidence = async (evidenceId: string, fileName: string) => {
    if (window.confirm(`¿Eliminar evidencia "${fileName}"?`)) {
      try {
        setEvidence(prev => prev.filter(e => e.id !== evidenceId));
        alert('Evidencia eliminada localmente');
      } catch (error) {
        console.error('Error eliminando evidencia:', error);
        alert('Error al eliminar evidencia');
      }
    }
  };

  const getEvidenceIcon = (type: MatchEvidence['type']) => {
    switch (type) {
      case 'photo': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Film className="w-5 h-5" />;
      case 'document': return <File className="w-5 h-5" />;
      case 'audio': return <Mic className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: MatchEvidence['type']) => {
    switch (type) {
      case 'photo': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-green-100 text-green-800';
      case 'audio': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel de subida */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Evidencia</h3>
        
        {/* Selector de tipo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evidencia</label>
          <div className="grid grid-cols-4 gap-2">
            {(['photo', 'video', 'document', 'audio'] as MatchEvidence['type'][]).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                  selectedType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getEvidenceIcon(type)}
                <span className="text-xs mt-1 capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview de video/foto */}
        {previewUrl && (selectedType === 'photo' || selectedType === 'video') && (
          <div className="mb-4">
            <div className="relative">
              {selectedType === 'photo' ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Grabación en vivo */}
        {(selectedType === 'video' || selectedType === 'audio') && !previewUrl && (
          <div className="mb-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Grabación en vivo</span>
                {isRecording && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-red-600">Grabando...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <div className="w-3 h-3 bg-white rounded-full mr-2"></div>
                    Iniciar Grabación
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center"
                  >
                    <div className="w-3 h-3 bg-white rounded mr-2"></div>
                    Detener Grabación
                  </button>
                )}
                
                {selectedType === 'video' && isRecording && (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-32 h-24 object-cover rounded"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campos de descripción */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Describe la evidencia..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID de Evento Relacionado (opcional)
            </label>
            <input
              type="text"
              value={relatedEventId}
              onChange={(e) => setRelatedEventId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: goal_123, card_456"
            />
          </div>

          {/* Botón de subida de archivo */}
          <div>
            <button
              onClick={handleFileSelect}
              disabled={uploading || isRecording}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center disabled:opacity-50"
            >
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium">
                {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PNG, JPG, MP4, PDF, DOC (máx. 10MB)
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept={selectedType === 'photo' ? 'image/*' : 
                     selectedType === 'video' ? 'video/*' : 
                     selectedType === 'audio' ? 'audio/*' : 
                     '.pdf,.doc,.docx'}
            />
          </div>
        </div>
      </div>

      {/* Lista de evidencia subida */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Evidencia Subida</h3>
          <button
            onClick={loadEvidence}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Actualizar lista
          </button>
        </div>
        
        {evidence.length > 0 ? (
          <div className="space-y-3">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      {getEvidenceIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{item.fileName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        {item.verified && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verificada
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        {item.description || 'Sin descripción'}
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <span>
                          {new Date(item.uploadDate).toLocaleDateString()}
                        </span>
                        {item.fileSize && (
                          <span>
                            {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                        {item.relatedEventId && (
                          <span className="flex items-center">
                            <Link className="w-3 h-3 mr-1" />
                            Evento: {item.relatedEventId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.fileUrl && (
                      <>
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={item.fileUrl}
                          download
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => deleteEvidence(item.id, item.fileName)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No hay evidencia subida</p>
            <p className="text-sm text-gray-500 mt-1">Sube fotos, videos o documentos del partido</p>
            <button
              onClick={loadEvidence}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              Recargar evidencia
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceManager;