import { useState } from 'react';
import ConfiguratorStepper from '../ConfiguratorStepper';

export default function ConfiguratorStepperExample() {
  const [currentStep, setCurrentStep] = useState(2);

  return (
    <ConfiguratorStepper 
      currentStep={currentStep} 
      onStepChange={setCurrentStep}
    />
  );
}