import { useEffect, useRef, useState } from "react";
import { VideoOff, CheckCircle, QrCode } from "lucide-react";

// Styles
import "./QrStyles.css";

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

  // Success
  const onScanSuccess = (result: QrScanner.ScanResult) => {
    setScannedResult(result?.data);
    onScan(result?.data);
  };

  // Fail
  const onScanFail = (err: string | Error) => {
    // 🖨 Print the "err" to browser console.
    console.log(err);
  };

  useEffect(() => {
    if (videoEl?.current && !scanner.current) {
      // 👉 Instantiate the QR Scanner
      scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
        onDecodeError: onScanFail,
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        overlay: qrBoxEl?.current || undefined,
      });

      // 🚀 Start QR Scanner
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
    };
  }, [onScan, onError]);

  useEffect(() => {
    if (!qrOn && onRetry) {
      onError(
        "Camera is blocked or not accessible. Please allow camera in your browser permissions and reload."
      );
    }
  }, [qrOn, onError, onRetry]);

  if (!qrOn) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
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
    <div className="qr-reader">
      <video ref={videoEl}></video>
      <div ref={qrBoxEl} className="qr-box">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
            <QrCode className="h-25 w-25 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Show Data Result if scan is success */}
      {scannedResult && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            right: "12px",
            zIndex: 99999,
          }}
          className="bg-white bg-opacity-95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 animate-pulse" />
            <p className="text-sm font-medium text-gray-900">
              Scanned: <span className="text-blue-600">{scannedResult}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrReader;
