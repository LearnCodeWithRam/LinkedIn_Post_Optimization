import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyzingProfile } from './steps/AnalyzingProfile';
import { LearningAudience } from './steps/LearningAudience';
import { DefiningPillars } from './steps/DefiningPillars';
import { DesigningStrategy } from './steps/DesigningStrategy';
import { FinalizingSetup } from './steps/FinalizingSetup';
import { WelcomeToDashboard } from './steps/WelcomeToDashboard';
import { completeOnboarding } from '@/services/onboarding.service';

const ONBOARDING_STEPS = [
  { id: 1, component: AnalyzingProfile, duration: 3000 },
  { id: 2, component: LearningAudience, duration: 3000 },
  { id: 3, component: DefiningPillars, duration: 3000 },
  { id: 4, component: DesigningStrategy, duration: 3000 },
  { id: 5, component: FinalizingSetup, duration: 3000 },
  { id: 6, component: WelcomeToDashboard, duration: 2000 },
];

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed in backend
      try {
        await completeOnboarding();
        localStorage.setItem('onboarding_completed', 'true'); // Keep for backward compatibility
        navigate('/');
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        // Still navigate even if API fails
        localStorage.setItem('onboarding_completed', 'true');
        navigate('/');
      }
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboarding();
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/');
    }
  };

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep].component;
  const stepDuration = ONBOARDING_STEPS[currentStep].duration;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleNext();
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <CurrentStepComponent
        onNext={handleNext}
        onSkip={handleSkip}
        progress={(currentStep / ONBOARDING_STEPS.length) * 100}
      />
    </div>
  );
};
