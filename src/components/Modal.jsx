import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

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

  // Size mappings
  const sizeMap = {
    sm: '400px',
    md: '500px',
    lg: '600px',
    xl: '800px'
  }

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'modalBackdropFadeIn 0.15s ease-out',
        willChange: 'opacity'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxHeight: 'calc(100vh - 40px)',
          width: '100%',
          maxWidth: sizeMap[size] || sizeMap.md,
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideIn 0.2s ease-out',
          outline: 'none',
          willChange: 'transform, opacity'
        }}
        className={className}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 0 20px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 0
        }}>
          {title && (
            <h2 id="modal-title" style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-fg)',
              lineHeight: 1.4
            }}>
              {title}
            </h2>
          )}
          {!hideCloseButton && (
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease-out',
                marginLeft: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                e.currentTarget.style.color = 'var(--color-fg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--color-muted)'
              }}
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
        <div style={{
          padding: '20px',
          flex: 1,
          overflowY: 'auto',
          color: 'var(--color-fg)',
          lineHeight: 1.6
        }}>
          {children}
        </div>

        {/* Footer */}
        {customFooter ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 20px 20px 20px',
            borderTop: '1px solid var(--color-border)',
            marginTop: 0
          }}>
            {customFooter}
          </div>
        ) : (primaryButton || secondaryButton) ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 20px 20px 20px',
            borderTop: '1px solid var(--color-border)',
            marginTop: 0
          }}>
            {secondaryButton && (
              <Button
                variant={secondaryButton.variant || "secondary"}
                size={secondaryButton.size || "md"}
                onClick={handleSecondaryClick}
                disabled={secondaryButton.disabled}
                className={secondaryButton.className}
                style={{ minWidth: '80px' }}
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
                style={{ minWidth: '80px' }}
              >
                {primaryButton.text || "Confirm"}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Animations keyframes - inject into document */}
      <style>{`
        @keyframes modalBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  )
}

export default Modal
