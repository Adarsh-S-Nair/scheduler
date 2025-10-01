import { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'

/**
 * MultiStepModal - A flexible modal component that supports single or multi-step flows
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Called when modal closes
 * @param {Array} steps - Array of step configurations
 * @param {number} initialStep - Starting step index (default: 0)
 * @param {string} size - Modal size (sm, md, lg, xl)
 * 
 * Step configuration:
 * {
 *   title: string,              // Step title
 *   content: ReactNode,         // Step content/component
 *   primaryButton: {            // Optional primary button config
 *     text: string,
 *     onClick: function,
 *     disabled: boolean
 *   },
 *   secondaryButton: {          // Optional secondary button config
 *     text: string,
 *     onClick: function
 *   },
 *   customFooter: ReactNode,    // Optional custom footer (overrides buttons)
 *   hideCloseButton: boolean,   // Optional - hide X button
 *   onEnter: function,          // Optional - called when entering this step
 *   onLeave: function           // Optional - called when leaving this step
 * }
 */
const MultiStepModal = ({ 
  isOpen, 
  onClose, 
  steps = [], 
  initialStep = 0,
  size = 'md'
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep)

  // Reset to initial step when modal opens/closes or initialStep changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(initialStep)
      // Call onEnter for initial step
      if (steps[initialStep]?.onEnter) {
        steps[initialStep].onEnter()
      }
    }
  }, [isOpen, initialStep, steps])

  // Update current step when initialStep changes (for dynamic navigation)
  useEffect(() => {
    if (isOpen && initialStep !== currentStepIndex) {
      setCurrentStepIndex(initialStep)
    }
  }, [initialStep, isOpen])

  const currentStep = steps[currentStepIndex] || {}
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const isSingleStep = steps.length === 1

  const goToNextStep = () => {
    if (isLastStep) return

    // Call onLeave for current step
    if (currentStep.onLeave) {
      currentStep.onLeave()
    }

    const nextIndex = currentStepIndex + 1
    setCurrentStepIndex(nextIndex)

    // Call onEnter for next step
    if (steps[nextIndex]?.onEnter) {
      steps[nextIndex].onEnter()
    }
  }

  const goToPreviousStep = () => {
    if (isFirstStep) return

    // Call onLeave for current step
    if (currentStep.onLeave) {
      currentStep.onLeave()
    }

    const prevIndex = currentStepIndex - 1
    setCurrentStepIndex(prevIndex)

    // Call onEnter for previous step
    if (steps[prevIndex]?.onEnter) {
      steps[prevIndex].onEnter()
    }
  }

  const goToStep = (index) => {
    if (index < 0 || index >= steps.length) return

    // Call onLeave for current step
    if (currentStep.onLeave) {
      currentStep.onLeave()
    }

    setCurrentStepIndex(index)

    // Call onEnter for target step
    if (steps[index]?.onEnter) {
      steps[index].onEnter()
    }
  }

  const handleClose = () => {
    // Call onLeave for current step
    if (currentStep.onLeave) {
      currentStep.onLeave()
    }
    onClose()
  }

  // Build default footer if no custom footer provided
  const getFooter = () => {
    if (currentStep.customFooter) {
      return currentStep.customFooter
    }

    // If step has explicit button configs, use them
    if (currentStep.primaryButton || currentStep.secondaryButton) {
      return (
        <>
          {currentStep.secondaryButton && (
            <Button
              variant={currentStep.secondaryButton.variant || "secondary"}
              size={currentStep.secondaryButton.size || "md"}
              onClick={() => {
                if (currentStep.secondaryButton.onClick) {
                  currentStep.secondaryButton.onClick({ goToNextStep, goToPreviousStep, goToStep, handleClose })
                } else {
                  handleClose()
                }
              }}
              disabled={currentStep.secondaryButton.disabled}
            >
              {currentStep.secondaryButton.text || "Cancel"}
            </Button>
          )}
          {currentStep.primaryButton && (
            <Button
              variant={currentStep.primaryButton.variant || "primary"}
              size={currentStep.primaryButton.size || "md"}
              onClick={() => {
                if (currentStep.primaryButton.onClick) {
                  currentStep.primaryButton.onClick({ goToNextStep, goToPreviousStep, goToStep, handleClose })
                } else {
                  goToNextStep()
                }
              }}
              disabled={currentStep.primaryButton.disabled}
            >
              {currentStep.primaryButton.text || "Confirm"}
            </Button>
          )}
        </>
      )
    }

    // Default multi-step navigation
    if (!isSingleStep) {
      return (
        <>
          <Button
            variant="secondary"
            onClick={isFirstStep ? handleClose : goToPreviousStep}
          >
            {isFirstStep ? 'Cancel' : 'Back'}
          </Button>
          {!isLastStep && (
            <Button
              variant="primary"
              onClick={goToNextStep}
            >
              Next
            </Button>
          )}
        </>
      )
    }

    // Default single step with close button
    return (
      <Button variant="secondary" onClick={handleClose}>
        Close
      </Button>
    )
  }

  if (steps.length === 0) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentStep.title || ''}
      size={size}
      hideCloseButton={currentStep.hideCloseButton}
      customFooter={getFooter()}
    >
      {currentStep.content}
    </Modal>
  )
}

// Export helper to navigate programmatically if needed
export const useMultiStepModal = (totalSteps) => {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))
  const goToStep = (index) => setCurrentStep(Math.max(0, Math.min(index, totalSteps - 1)))
  const reset = () => setCurrentStep(0)

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    reset,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1
  }
}

export default MultiStepModal
