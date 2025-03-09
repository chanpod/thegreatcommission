import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (photoDataUrl: string, photoFile: File) => void;
    title?: string;
    description?: string;
}

export function CameraCapture({
    isOpen,
    onClose,
    onCapture,
    title = "Take a Photo",
    description = "Position the subject clearly in the frame"
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    // Start the camera
    const startCamera = useCallback(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setCameraStream(stream);
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    toast.error("Unable to access camera. Please ensure camera permissions are granted.");
                });
        } else {
            toast.error("Your browser doesn't support camera access.");
        }
    }, []);

    // Stop the camera stream
    const stopCamera = useCallback(() => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    }, [cameraStream]);

    // Capture a photo from the video stream
    const capturePhoto = useCallback(() => {
        if (videoRef.current) {
            // Create a canvas with the video dimensions
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            // Draw the current video frame to the canvas
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                // Convert the canvas to a data URL
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedPhoto(dataUrl);
            }
        }
    }, []);

    // Reset the captured photo and restart the camera
    const resetCapture = useCallback(() => {
        setCapturedPhoto(null);
        startCamera();
    }, [startCamera]);

    // Use the captured photo
    const usePhoto = useCallback(() => {
        if (capturedPhoto) {
            // Convert base64 to file
            fetch(capturedPhoto)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
                    onCapture(capturedPhoto, file);
                    onClose();
                });
        }
    }, [capturedPhoto, onCapture, onClose]);

    // Handle dialog close
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            stopCamera();
            onClose();
        }
    };

    // Start camera when dialog opens
    useEffect(() => {
        if (isOpen && !capturedPhoto) {
            startCamera();
        }

        // Clean up resources when the component unmounts
        return () => {
            stopCamera();
        };
    }, [isOpen, capturedPhoto, startCamera, stopCamera]);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="relative">
                    {!capturedPhoto ? (
                        <>
                            <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="border-4 border-white border-opacity-50 rounded-full w-32 h-32"></div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-center">
                                <Button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="rounded-full p-3"
                                >
                                    <Camera className="h-6 w-6" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden">
                                <img
                                    src={capturedPhoto}
                                    alt="Captured"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="mt-4 flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetCapture}
                                >
                                    Retake
                                </Button>
                                <Button
                                    type="button"
                                    onClick={usePhoto}
                                >
                                    Use Photo
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Custom hook for using the camera functionality
export function useCamera() {
    const [showCamera, setShowCamera] = useState(false);
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const openCamera = useCallback(() => {
        setShowCamera(true);
    }, []);

    const closeCamera = useCallback(() => {
        setShowCamera(false);
    }, []);

    const handleCapture = useCallback((dataUrl: string, file: File) => {
        setPhotoDataUrl(dataUrl);
        setPhotoFile(file);
    }, []);

    const resetPhoto = useCallback(() => {
        setPhotoDataUrl(null);
        setPhotoFile(null);
    }, []);

    const CameraComponent = useCallback(() => (
        <CameraCapture
            isOpen={showCamera}
            onClose={closeCamera}
            onCapture={handleCapture}
        />
    ), [showCamera, closeCamera, handleCapture]);

    return {
        showCamera,
        photoDataUrl,
        photoFile,
        openCamera,
        closeCamera,
        resetPhoto,
        CameraComponent,
    };
} 