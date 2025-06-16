import { useEffect, useRef, useState } from "react";
import { VideoOff, CheckCircle, X } from "lucide-react";

// Qr Scanner
import QrScanner from "qr-scanner";

interface QrReaderProps {
  onScan: (result: string) => void;
  onError: (error: string) => void;
  onRetry?: () => void;
}

const QrReader = ({ onScan, onError, onRetry }: QrReaderProps) => {
  // QR States
  const scanner = useRef<QrScanner | null>(null);
  const videoEl = useRef<HTMLVideoElement>(null);
  const qrBoxEl = useRef<HTMLDivElement>(null);
  const [qrOn, setQrOn] = useState<boolean>(true);

  // Result
  const [scannedResult, setScannedResult] = useState<string | undefined>("");
  const [showResult, setShowResult] = useState<boolean>(false);
  const resultTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Success
  const onScanSuccess = (result: QrScanner.ScanResult) => {
    setScannedResult(result?.data);
    setShowResult(true);
    onScan(result?.data);

    // Clear existing timer
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }

    // Auto-hide after 10 seconds (increased from 5 seconds)
    resultTimerRef.current = setTimeout(() => {
      setShowResult(false);
    }, 10000);
  };

  // Dismiss result manually
  const dismissResult = () => {
    setShowResult(false);
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }
  };

  // Fail
  const onScanFail = (err: string | Error) => {
    console.log(err);
  };

  useEffect(() => {
    if (videoEl?.current && !scanner.current) {
      scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
        onDecodeError: onScanFail,
        preferredCamera: "environment",
        highlightScanRegion: false, // 👈 Removed scan region highlight
        highlightCodeOutline: false, // 👈 Removed outline around QR
        overlay: qrBoxEl?.current || undefined,
      });

      scanner?.current
        ?.start()
        .then(() => setQrOn(true))
        .catch((err) => {
          if (err) {
            setQrOn(false);
            onError("Camera is blocked or not accessible. Please allow camera in your browser permissions and reload.");
          }
        });
    }

    return () => {
      if (scanner?.current) {
        scanner.current.stop();
        scanner.current.destroy();
        scanner.current = null;
      }
      // Clean up timer
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
    };
  }, [onScan, onError]);

  useEffect(() => {
    if (!qrOn && onRetry) {
      onError(
        "Camera is blocked or not accessible. Please allow camera in your browser settings and reload."
      );
    }
  }, [qrOn, onError, onRetry]);

  if (!qrOn) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-2">Camera access denied</p>
          <p className="text-xs text-gray-500 mb-4">Please enable camera in browser settings</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-gradient-to-br from-white to-gray-50">
      {/* Video Feed */}
      <video
        ref={videoEl}
        className="w-full aspect-square object-cover bg-gray-100"
      />

      {/* Overlay + QR Box */}
      <div
        ref={qrBoxEl}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {/* QR Scan Box - Only Corners Remain, Fully Responsive */}
        <div className="relative w-4/5 max-w-xs aspect-square sm:max-w-sm md:max-w-md flex items-center justify-center">
          {/* Scanning Line Animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-lg shadow-blue-500/50"
              style={{
                animation: 'scanLine 2s ease-in-out infinite alternate',
                top: '0%'
              }}
            />
          </div>

          {/* Corner Indicators */}
          <div className="absolute top-0 left-0 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
        </div>
      </div>

      {/* Scanned Result Display */}
      {scannedResult && showResult && (
        <div className="absolute top-3 left-3 right-3 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 mb-1">Scanned successfully:</p>
                <p className="text-sm font-medium text-gray-900 break-all">
                  <span className="text-blue-600">{scannedResult}</span>
                </p>
              </div>
            </div>
            <button
              onClick={dismissResult}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Custom CSS for scanning animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scanLine {
            0% { 
              top: 0%; 
              opacity: 1; 
            }
            50% { 
              opacity: 0.8; 
            }
            100% { 
              top: calc(100% - 2px); 
              opacity: 1; 
            }
          }
        `
      }} />
    </div>
  );
};

export default QrReader;