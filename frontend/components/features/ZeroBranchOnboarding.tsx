'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  useSaveProgress,
  useResumeProgress,
  useGetProgress,
  usePerformBiometricMatch,
  useCaptureSignature,
  useCompleteOnboarding,
  usePauseOnboarding,
} from '@/lib/hooks/useOnboarding';
import { OnboardingStep, Platform } from '@/lib/api/onboarding';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Tooltip, FieldWithTooltip } from '@/components/ui/Tooltip';
import { offlineStorageService } from '@/lib/services/offline-storage.service';
import { timeEstimationService } from '@/lib/utils/time-estimation';
import { getErrorMessage, formatApiError, getErrorResolutionSteps } from '@/lib/utils/error-messages';
import { ONBOARDING_TOOLTIPS } from '@/lib/constants/onboarding-tooltips';
import {
  User,
  FileText,
  Camera,
  CheckCircle,
  PenTool,
  ArrowRight,
  ArrowLeft,
  Pause,
  Smartphone,
  Monitor,
  Tablet,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ZeroBranchOnboardingProps {
  applicationId: string;
  onComplete?: () => void;
}

const steps = [
  { id: OnboardingStep.PROFILE, label: 'Profile', icon: User },
  { id: OnboardingStep.ID_VERIFICATION, label: 'ID Verification', icon: FileText },
  { id: OnboardingStep.BIOMETRIC, label: 'Biometric', icon: Camera },
  { id: OnboardingStep.DOCUMENTS, label: 'Documents', icon: FileText },
  { id: OnboardingStep.REVIEW, label: 'Review', icon: CheckCircle },
  { id: OnboardingStep.SIGNATURE, label: 'Signature', icon: PenTool },
];

export function ZeroBranchOnboarding({ applicationId, onComplete }: ZeroBranchOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [platform, setPlatform] = useState<Platform>(Platform.WEB);
  const [selfieImage, setSelfieImage] = useState<string>('');
  const [idPhotoUrl, setIdPhotoUrl] = useState<string>('');
  const [signatureData, setSignatureData] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offlineDataSaved, setOfflineDataSaved] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const saveProgress = useSaveProgress();
  const resumeProgress = useResumeProgress();
  const { data: progress, isLoading: isLoadingProgress } = useGetProgress(applicationId, !!applicationId);
  const biometricMatch = usePerformBiometricMatch();
  const captureSignature = useCaptureSignature();
  const completeOnboarding = useCompleteOnboarding();
  const pauseOnboarding = usePauseOnboarding();

  // Detect platform
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform(Platform.IOS);
      } else if (/android/.test(userAgent)) {
        setPlatform(Platform.ANDROID);
      } else {
        setPlatform(Platform.WEB);
      }
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Sync offline data when coming back online
      offlineStorageService.syncWhenOnline(async (entry) => {
        try {
          await saveProgress.mutateAsync({
            applicationId: entry.applicationId || applicationId,
            currentStep: entry.step as OnboardingStep,
            formData: entry.data,
            platform,
          });
        } catch (error) {
          console.error('Failed to sync offline data:', error);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [applicationId, platform, saveProgress]);

  // Track time spent on current step
  useEffect(() => {
    setStepStartTime(Date.now());
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - stepStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStepIndex, stepStartTime]);

  // Load offline data on mount
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!offlineStorageService.isAvailable()) return;

      try {
        const savedData = await offlineStorageService.getFormData(
          applicationId,
          steps[currentStepIndex]?.id || OnboardingStep.PROFILE,
        );
        if (savedData) {
          setFormData(savedData);
          Object.keys(savedData).forEach((key) => {
            setValue(key, savedData[key]);
          });
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadOfflineData();
  }, [applicationId, currentStepIndex, setValue]);

  // Resume progress on mount
  useEffect(() => {
    if (applicationId && !isLoadingProgress) {
      resumeProgress.mutate({ applicationId });
    }
  }, [applicationId, isLoadingProgress]);

  // Set current step from progress
  useEffect(() => {
    if (progress) {
      const stepIndex = steps.findIndex((s) => s.id === progress.currentStep);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
      if (progress.metadata) {
        setFormData(progress.metadata);
        // Populate form with saved data
        Object.keys(progress.metadata).forEach((key) => {
          setValue(key, progress.metadata[key]);
        });
      }
    }
  }, [progress, setValue]);

  const currentStep = steps[currentStepIndex];
  const completionPercentage = progress?.completionPercentage || ((currentStepIndex + 1) / steps.length) * 100;

  // Calculate time estimate
  const timeEstimate = timeEstimationService.estimateRemainingTime(
    currentStepIndex,
    steps.length,
    steps.map((s) => s.id),
    timeSpent,
  );

  // Record step completion time when moving to next step
  const recordStepTime = (stepId: string) => {
    const timeTaken = Math.floor((Date.now() - stepStartTime) / 1000);
    if (timeTaken > 0) {
      timeEstimationService.recordStepTime(stepId, timeTaken);
    }
  };

  const handleNext = async () => {
    setErrorMessage(null);
    const currentFormData = watch();
    const updatedFormData = { ...formData, ...currentFormData };

    // Record time spent on current step
    recordStepTime(currentStep.id);

    try {
      // Save to offline storage first
      if (offlineStorageService.isAvailable()) {
        await offlineStorageService.saveFormData(
          applicationId,
          currentStep.id,
          updatedFormData,
        );
        setOfflineDataSaved(true);
      }

      // Save progress to server if online
      if (isOnline) {
        await saveProgress.mutateAsync({
          applicationId,
          currentStep: steps[currentStepIndex + 1]?.id || OnboardingStep.COMPLETE,
          formData: updatedFormData,
          platform,
        });
      } else {
        // Show offline message
        setOfflineDataSaved(true);
      }

      setFormData(updatedFormData);
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setStepStartTime(Date.now());
        setTimeSpent(0);
      }
    } catch (error) {
      const errorMsg = formatApiError(error);
      setErrorMessage(errorMsg);
      console.error('Failed to save progress:', error);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handlePause = async () => {
    const currentFormData = watch();
    await pauseOnboarding.mutateAsync({
      applicationId,
    });
  };

  const handleBiometricMatch = async () => {
    setErrorMessage(null);
    if (!selfieImage || !idPhotoUrl) {
      const errorMsg = getErrorMessage('required', { field: 'Selfie and ID photo' });
      setErrorMessage(errorMsg);
      return;
    }

    try {
      await biometricMatch.mutateAsync({
        applicationId,
        selfieImage,
        idPhotoUrl,
        platform,
      });
      // Move to next step on success
      if (biometricMatch.data?.matchStatus === 'MATCHED') {
        recordStepTime(OnboardingStep.BIOMETRIC);
        handleNext();
      } else {
        const errorMsg = getErrorMessage('biometricMatchFailed');
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      const errorMsg = formatApiError(error) || getErrorMessage('biometricMatchFailed');
      setErrorMessage(errorMsg);
      console.error('Biometric match failed:', error);
    }
  };

  const handleCaptureSignature = async () => {
    setErrorMessage(null);
    if (!signatureData) {
      const errorMsg = getErrorMessage('signatureRequired');
      setErrorMessage(errorMsg);
      return;
    }

    try {
      await captureSignature.mutateAsync({
        applicationId,
        signatureData,
        platform,
        ipAddress: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      });
    } catch (error) {
      const errorMsg = formatApiError(error);
      setErrorMessage(errorMsg);
      console.error('Signature capture failed:', error);
    }
  };

  const handleComplete = async () => {
    setErrorMessage(null);
    recordStepTime(OnboardingStep.SIGNATURE);

    try {
      await completeOnboarding.mutateAsync({
        applicationId,
        platform,
      });
      
      // Clear offline data after successful completion
      if (offlineStorageService.isAvailable()) {
        await offlineStorageService.clearAll();
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      const errorMsg = formatApiError(error) || getErrorMessage('submissionFailed');
      setErrorMessage(errorMsg);
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'selfie' | 'id') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'selfie') {
          setSelfieImage(base64);
        } else {
          setIdPhotoUrl(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case OnboardingStep.PROFILE:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <FieldWithTooltip
              label="Full Name"
              tooltip={ONBOARDING_TOOLTIPS.PROFILE.fullName}
              required
            >
              <Input
                {...register('fullName', { required: true })}
                defaultValue={formData.fullName}
                error={errors.fullName ? getErrorMessage('required', { field: 'Full Name' }) : undefined}
              />
            </FieldWithTooltip>
            <FieldWithTooltip
              label="Email"
              tooltip={ONBOARDING_TOOLTIPS.PROFILE.email}
              required
            >
              <Input
                type="email"
                {...register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                defaultValue={formData.email}
                error={errors.email ? (errors.email.type === 'required' ? getErrorMessage('required', { field: 'Email' }) : getErrorMessage('email')) : undefined}
              />
            </FieldWithTooltip>
            <FieldWithTooltip
              label="Phone Number"
              tooltip={ONBOARDING_TOOLTIPS.PROFILE.phoneNumber}
              required
            >
              <Input
                {...register('phoneNumber', { required: true, minLength: 10 })}
                defaultValue={formData.phoneNumber}
                error={errors.phoneNumber ? getErrorMessage('required', { field: 'Phone Number' }) : undefined}
              />
            </FieldWithTooltip>
            <FieldWithTooltip
              label="Date of Birth"
              tooltip={ONBOARDING_TOOLTIPS.PROFILE.dateOfBirth}
              required
            >
              <Input
                type="date"
                {...register('dateOfBirth', { required: true })}
                defaultValue={formData.dateOfBirth}
                error={errors.dateOfBirth ? getErrorMessage('required', { field: 'Date of Birth' }) : undefined}
              />
            </FieldWithTooltip>
            <FieldWithTooltip
              label="Address"
              tooltip={ONBOARDING_TOOLTIPS.PROFILE.address}
            >
              <Input
                {...register('address')}
                defaultValue={formData.address}
              />
            </FieldWithTooltip>
          </div>
        );

      case OnboardingStep.ID_VERIFICATION:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ID Verification</h3>
            <FieldWithTooltip
              label="ID Type"
              tooltip={ONBOARDING_TOOLTIPS.ID_VERIFICATION.idType}
              required
            >
              <Input
                {...register('idType', { required: true })}
                defaultValue={formData.idType}
                error={errors.idType ? getErrorMessage('required', { field: 'ID Type' }) : undefined}
              />
            </FieldWithTooltip>
            <FieldWithTooltip
              label="ID Number"
              tooltip={ONBOARDING_TOOLTIPS.ID_VERIFICATION.idNumber}
              required
            >
              <Input
                {...register('idNumber', { required: true })}
                defaultValue={formData.idNumber}
                error={errors.idNumber ? getErrorMessage('required', { field: 'ID Number' }) : undefined}
              />
            </FieldWithTooltip>
            <FieldWithTooltip
              label="ID Document Photo"
              tooltip={ONBOARDING_TOOLTIPS.ID_VERIFICATION.idDocumentPhoto}
              required
            >
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'id')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {idPhotoUrl && (
                  <img src={idPhotoUrl} alt="ID Photo" className="mt-2 max-w-xs rounded-lg" />
                )}
              </div>
            </FieldWithTooltip>
          </div>
        );

      case OnboardingStep.BIOMETRIC:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Biometric Verification</h3>
            <p className="text-sm text-gray-600">
              Please take a selfie that matches your ID photo
            </p>
            <FieldWithTooltip
              label="Selfie Photo"
              tooltip={ONBOARDING_TOOLTIPS.BIOMETRIC.selfiePhoto}
              required
            >
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => handleFileUpload(e, 'selfie')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selfieImage && (
                  <img src={selfieImage} alt="Selfie" className="mt-2 max-w-xs rounded-lg" />
                )}
              </div>
            </FieldWithTooltip>
            {biometricMatch.data && (
              <div className={`p-4 rounded-lg ${
                biometricMatch.data.matchStatus === 'MATCHED'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-semibold ${
                  biometricMatch.data.matchStatus === 'MATCHED' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {biometricMatch.data.message}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Confidence: {(biometricMatch.data.confidence * 100).toFixed(1)}%
                </p>
              </div>
            )}
            <Button
              onClick={handleBiometricMatch}
              isLoading={biometricMatch.isPending}
              disabled={!selfieImage || !idPhotoUrl}
              className="w-full"
            >
              Verify Biometric Match
            </Button>
          </div>
        );

      case OnboardingStep.DOCUMENTS:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Documents</h3>
            <p className="text-sm text-gray-600">
              Upload any additional required documents
            </p>
            <FieldWithTooltip
              label="Document Upload"
              tooltip={ONBOARDING_TOOLTIPS.DOCUMENTS.documentUpload}
            >
              <div>
                <input
                  type="file"
                  multiple
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </FieldWithTooltip>
          </div>
        );

      case OnboardingStep.REVIEW:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Review Information</h3>
              <Tooltip content={ONBOARDING_TOOLTIPS.REVIEW.reviewInfo} />
            </div>
            <div className="space-y-2">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case OnboardingStep.SIGNATURE:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Digital Signature</h3>
              <Tooltip content={ONBOARDING_TOOLTIPS.SIGNATURE.signature} />
            </div>
            <p className="text-sm text-gray-600">
              Please sign below to complete your onboarding
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-8 bg-white">
              <SignatureCanvas
                onSignatureChange={(dataUrl) => setSignatureData(dataUrl)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSignatureData('');
                }}
              >
                Clear
              </Button>
              <Button
                onClick={handleCaptureSignature}
                isLoading={captureSignature.isPending}
                disabled={!signatureData}
                className="flex-1"
              >
                Save Signature
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Signature Canvas Component
  const SignatureCanvas = ({ onSignatureChange }: { onSignatureChange: (dataUrl: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200;

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const getCoordinates = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e && e.touches.length > 0) {
          return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top,
          };
        } else {
          return {
            x: (e as MouseEvent).clientX - rect.left,
            y: (e as MouseEvent).clientY - rect.top,
          };
        }
      };

      const startDrawing = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDrawingRef.current = true;
        const coords = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        if (!isDrawingRef.current) return;
        const coords = getCoordinates(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        onSignatureChange(canvas.toDataURL());
      };

      const stopDrawing = () => {
        isDrawingRef.current = false;
        onSignatureChange(canvas.toDataURL());
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [onSignatureChange]);

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-48 border border-gray-200 rounded cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      />
    );
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case Platform.IOS:
        return <Smartphone className="h-5 w-5" />;
      case Platform.ANDROID:
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Zero-Branch Onboarding</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete your application remotely - No branch visit required
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" title="Online" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-500" title="Offline - Data will sync when online" />
            )}
            {getPlatformIcon()}
            <Badge variant="info">{platform}</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <div className="flex items-center gap-4">
              <span>{Math.round(completionPercentage)}% Complete</span>
              {timeEstimate.estimatedSeconds > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>~{timeEstimate.formatted} remaining</span>
                </div>
              )}
            </div>
          </div>
          <Progress value={completionPercentage} />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center flex-1 ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isActive
                      ? 'border-blue-600 bg-blue-50'
                      : isCompleted
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1 text-center">{step.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
              {errorMessage.includes('network') || errorMessage.includes('connection') ? (
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {getErrorResolutionSteps('network').map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Offline Data Saved Indicator */}
      {offlineDataSaved && !isOnline && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Your data has been saved offline. It will sync automatically when you're back online.
          </p>
        </div>
      )}

      {/* Step Content */}
      <Card>
        <form onSubmit={handleSubmit(handleNext)}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
            <div>
              {currentStepIndex > 0 && (
                <Button type="button" variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={handlePause} isLoading={pauseOnboarding.isPending}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              {currentStepIndex < steps.length - 1 ? (
                <Button type="submit">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleComplete}
                  isLoading={completeOnboarding.isPending}
                >
                  Complete Onboarding
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Progress Saved Indicator */}
      {progress && progress.status === 'PAUSED' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Your progress has been saved. You can resume anytime.
          </p>
        </div>
      )}
    </div>
  );
}

