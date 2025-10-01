import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import './Modal.css'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  primaryButton,
  secondaryButton,
  customFooter,
  className = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  hideCloseButton = false
}) => {
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus()
      }
    } else {
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const handlePrimaryClick = () => {
    if (primaryButton?.onClick) {
      primaryButton.onClick()
    }
  }

  const handleSecondaryClick = () => {
    if (secondaryButton?.onClick) {
      secondaryButton.onClick()
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div 
      className="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`modal ${className} modal-${size}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        <div className="modal-header">
          {title && (
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
          )}
          {!hideCloseButton && (
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal-content">
          {children}
        </div>

        {/* Footer */}
        {customFooter ? (
          <div className="modal-footer">
            {customFooter}
          </div>
        ) : (primaryButton || secondaryButton) ? (
          <div className="modal-footer">
            {secondaryButton && (
              <Button
                variant={secondaryButton.variant || "secondary"}
                size={secondaryButton.size || "md"}
                onClick={handleSecondaryClick}
                disabled={secondaryButton.disabled}
                className={secondaryButton.className}
              >
                {secondaryButton.text || "Cancel"}
              </Button>
            )}
            {primaryButton && (
              <Button
                variant={primaryButton.variant || "primary"}
                size={primaryButton.size || "md"}
                onClick={handlePrimaryClick}
                disabled={primaryButton.disabled}
                className={primaryButton.className}
              >
                {primaryButton.text || "Confirm"}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}

export default Modal
