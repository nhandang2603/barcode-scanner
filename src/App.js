import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Zap, ZapOff, RotateCcw, Check } from 'lucide-react';

const BarcodeScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [torch, setTorch] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState(['QRCode', 'DataMatrix', 'Code128']);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const allFormats = [
    'QRCode', 'DataMatrix', 'Aztec', 'PDF417', 'MaxiCode',
    'Code39', 'Code93', 'Code128', 'Codabar', 
    'EAN-8', 'EAN-13', 'UPC-A', 'UPC-E', 'ITF'
  ];

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setResult(null);
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Enable torch if supported and requested
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      if (capabilities?.torch && torch) {
        await track.applyConstraints({
          advanced: [{ torch: true }]
        });
      }

      setScanning(true);
      startBarcodeDetection();
    } catch (err) {
      setError('Không thể truy cập camera: ' + err.message);
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  const startBarcodeDetection = () => {
    scanIntervalRef.current = setInterval(() => {
      detectBarcode();
    }, 300);
  };

  const detectBarcode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Simulate barcode detection (replace with actual zxing-wasm when installed)
      // In real implementation: import { readBarcodesFromImageData } from 'zxing-wasm/reader';
      // const results = await readBarcodesFromImageData(imageData, { formats: selectedFormats });
      
      // For demo purposes, we'll show how to handle results
      const mockResult = simulateDetection(imageData);
      
      if (mockResult) {
        setResult(mockResult);
        stopScanning();
      }
    } catch (err) {
      console.error('Detection error:', err);
    }
  };

  // Mock detection for demo (replace with real zxing-wasm)
  const simulateDetection = (imageData) => {
    // This is just for demo UI - replace with real zxing-wasm
    return null;
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();
    
    if (capabilities?.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torch }]
        });
        setTorch(!torch);
      } catch (err) {
        setError('Không thể bật/tắt đèn flash');
      }
    } else {
      setError('Thiết bị không hỗ trợ đèn flash');
    }
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    if (scanning) {
      stopScanning();
      setTimeout(() => startScanning(), 100);
    }
  };

  const toggleFormat = (format) => {
    setSelectedFormats(prev => {
      if (prev.includes(format)) {
        return prev.filter(f => f !== format);
      } else {
        return [...prev, format];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Barcode Scanner</h1>
          <p className="text-gray-400">Hỗ trợ QR Code, Data Matrix & tất cả 1D/2D barcode</p>
        </div>

        {/* Format Selection */}
        {!scanning && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Chọn định dạng cần quét:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allFormats.map(format => (
                <button
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    selectedFormats.includes(format)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedFormats.includes(format) && <Check size={16} />}
                  {format}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Đã chọn: {selectedFormats.length} định dạng
            </p>
          </div>
        )}

        {/* Camera View */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
          {scanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scan Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-blue-500 rounded-lg animate-pulse"
                     style={{ width: '80%', height: '60%' }}>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <button
                  onClick={toggleTorch}
                  className="bg-gray-800 bg-opacity-80 p-3 rounded-full hover:bg-opacity-100 transition"
                >
                  {torch ? <Zap size={24} className="text-yellow-400" /> : <ZapOff size={24} />}
                </button>
                <button
                  onClick={switchCamera}
                  className="bg-gray-800 bg-opacity-80 p-3 rounded-full hover:bg-opacity-100 transition"
                >
                  <RotateCcw size={24} />
                </button>
                <button
                  onClick={stopScanning}
                  className="bg-red-600 bg-opacity-80 p-3 rounded-full hover:bg-opacity-100 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={startScanning}
                disabled={selectedFormats.length === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                  selectedFormats.length === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Camera size={24} />
                Bắt đầu quét
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        {scanning && (
          <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">💡 Mẹo quét tốt:</h3>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>• Giữ camera cách mã 5-15cm</li>
              <li>• Đảm bảo ánh sáng đủ sáng</li>
              <li>• Giữ camera thẳng, không xiên</li>
              <li>• Với mã nhỏ: zoom gần hơn hoặc bật đèn flash</li>
            </ul>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="bg-green-900 bg-opacity-50 border border-green-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Check className="text-green-400" />
              Quét thành công!
            </h3>
            <div className="bg-gray-800 rounded p-3 mb-2">
              <p className="text-xs text-gray-400 mb-1">Loại mã:</p>
              <p className="font-mono text-lg">{result.format}</p>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <p className="text-xs text-gray-400 mb-1">Nội dung:</p>
              <p className="font-mono break-all">{result.text}</p>
            </div>
            <button
              onClick={() => {
                setResult(null);
                startScanning();
              }}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold transition"
            >
              Quét tiếp
            </button>
          </div>
        )}

        {/* Installation Note */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 text-sm">
          <h3 className="font-semibold mb-2">📦 Để sử dụng trong dự án thật:</h3>
          <pre className="bg-gray-900 rounded p-2 mb-2 overflow-x-auto">
            <code>npm install zxing-wasm</code>
          </pre>
          <p className="text-gray-400 text-xs">
            Demo này chỉ hiển thị UI. Để quét thật, cần cài đặt zxing-wasm và thay thế hàm simulateDetection() 
            bằng readBarcodesFromImageData() từ zxing-wasm/reader
          </p>
        </div>

        {/* Format Support Info */}
        <div className="mt-4 bg-gray-800 rounded-lg p-4 text-sm">
          <h3 className="font-semibold mb-2">✅ Định dạng được hỗ trợ:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>
              <p className="font-semibold text-white mb-1">2D Barcodes:</p>
              <ul className="space-y-0.5">
                <li>• QR Code</li>
                <li>• Data Matrix</li>
                <li>• Aztec</li>
                <li>• PDF417</li>
                <li>• MaxiCode</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">1D Barcodes:</p>
              <ul className="space-y-0.5">
                <li>• Code 39/93/128</li>
                <li>• EAN-8/13</li>
                <li>• UPC-A/E</li>
                <li>• Codabar</li>
                <li>• ITF</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;