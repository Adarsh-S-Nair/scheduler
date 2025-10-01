import { useState, useEffect, useMemo } from 'react'
import TitleBar from './components/TitleBar'
import AppTopBar from './components/AppTopBar'
import Button from './components/Button'
import MultiStepModal from './components/MultiStepModal'
import BotConfigForm from './components/BotConfigForm'
import RepositoryPathForm from './components/RepositoryPathForm'
import botsData from './data/bots.json'
import { initializeUserData, activateBot, getActiveBots, getBotConfig, saveBotConfig, getRepositoryPath, saveRepositoryPath } from './utils/userDataManager'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBot, setSelectedBot] = useState(null)
  const [bots] = useState(botsData)
  const [activeBotIds, setActiveBotIds] = useState([])
  const [needsConfig, setNeedsConfig] = useState(false)
  const [currentModalStep, setCurrentModalStep] = useState(0)
  const [isCredentialsFormValid, setIsCredentialsFormValid] = useState(false)

  useEffect(() => {
    // Initialize user data on app startup
    initializeUserData()
    setActiveBotIds(getActiveBots())

    // Listen for messages from the main process
    if (window.ipcRenderer) {
      window.ipcRenderer.on('main-process-message', (event, message) => {
        setMessage(`Connected: ${message}`)
      })
    }
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBot(null)
    setNeedsConfig(false)
    setCurrentModalStep(0)
    setIsCredentialsFormValid(false)
  }

  const handleBotSelect = ({ handleClose }) => {
    if (!selectedBot) return
    
    // Check if bot already has config
    const existingConfig = getBotConfig(selectedBot.id)
    
    if (existingConfig && existingConfig.username && existingConfig.password) {
      // Config exists, activate bot directly
      activateBot(selectedBot.id)
      setActiveBotIds(getActiveBots())
      console.log('Bot activated with existing config:', selectedBot.name)
      handleClose()
    } else {
      // No config, we need to show configuration steps
      // Set both states together
      setNeedsConfig(true)
      setCurrentModalStep(1)
    }
  }

  const handleConfigSubmit = (formData) => {
    // Just save the config, don't activate yet
    // We need to get the repository path first
    if (selectedBot) {
      saveBotConfig(selectedBot.id, formData)
    }
  }

  const handleRepoPathSubmit = ({ repoPath }) => {
    // Save repository path
    saveRepositoryPath(repoPath)
    
    // Now activate the bot
    if (selectedBot) {
      activateBot(selectedBot.id)
      setActiveBotIds(getActiveBots())
      console.log('Bot activated:', selectedBot.name, 'Repository:', repoPath)
    }
    
    handleCloseModal()
  }

  // Define modal steps dynamically
  const modalSteps = useMemo(() => {
    const steps = [
      // Step 1: Select a Bot
      {
        title: 'Select a Bot',
        content: (
          <div className="bot-list">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={`bot-item ${selectedBot?.id === bot.id ? 'selected' : ''}`}
                onClick={() => setSelectedBot(bot)}
              >
                <div className="bot-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                </div>
                <div className="bot-info">
                  <h3 className="bot-name">{bot.name}</h3>
                  <p className="bot-description">{bot.description}</p>
                </div>
                <div className="bot-select-indicator">
                  {selectedBot?.id === bot.id && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        ),
        primaryButton: {
          text: 'Next',
          onClick: handleBotSelect,
          disabled: !selectedBot
        },
        secondaryButton: {
          text: 'Cancel',
          onClick: ({ handleClose }) => handleClose()
        }
      }
    ]

    // Step 2: Configure Credentials (only if needed)
    if (needsConfig) {
      steps.push({
        title: 'Configure Wizard101 Credentials',
        content: (
          <BotConfigForm
            bot={selectedBot}
            onSubmit={handleConfigSubmit}
            initialConfig={getBotConfig(selectedBot?.id)}
            onValidChange={setIsCredentialsFormValid}
          />
        ),
        primaryButton: {
          text: 'Next',
          disabled: !isCredentialsFormValid,
          onClick: ({ goToNextStep }) => {
            // Trigger form submission
            const form = document.querySelector('.bot-config-form')
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
              form.dispatchEvent(submitEvent)
              // Move to next step after a brief delay to ensure form is processed
              setTimeout(() => {
                setCurrentModalStep(2)
                goToNextStep()
              }, 100)
            }
          }
        },
        secondaryButton: {
          text: 'Back',
          onClick: ({ goToPreviousStep }) => {
            setCurrentModalStep(0)
            goToPreviousStep()
          }
        }
      })

      // Step 3: Repository Path
      steps.push({
        title: 'Repository Path',
        content: (
          <RepositoryPathForm
            onSubmit={handleRepoPathSubmit}
            initialPath={getRepositoryPath()}
          />
        ),
        primaryButton: {
          text: 'Connect Bot',
          onClick: () => {
            // Trigger form submission
            const form = document.querySelector('.repo-path-form')
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
              form.dispatchEvent(submitEvent)
            }
          }
        },
        secondaryButton: {
          text: 'Back',
          onClick: ({ goToPreviousStep }) => {
            setCurrentModalStep(1)
            goToPreviousStep()
          }
        }
      })
    }

    return steps
  }, [bots, selectedBot, needsConfig, isCredentialsFormValid])

  return (
    <div className="App">
      <TitleBar />
      <AppTopBar />
      <main className="main-content">
        <div className="placeholder-content">
          <div className="placeholder-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M9 9h6v6H9z"/>
              <path d="M9 1v6"/>
              <path d="M15 1v6"/>
              <path d="M9 17v6"/>
              <path d="M15 17v6"/>
              <path d="M1 9h6"/>
              <path d="M17 9h6"/>
              <path d="M1 15h6"/>
              <path d="M17 15h6"/>
            </svg>
          </div>
          <h1 className="placeholder-title">No Bots Activated</h1>
          <p className="placeholder-subtitle">
            Get started by activating your first bot to begin scheduling tasks
          </p>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setIsModalOpen(true)}
          >
            Select a Bot
          </Button>
        </div>
        
        {message && (
          <div className="message">
            {message}
          </div>
        )}
      </main>

      {/* Multi-Step Modal */}
      <MultiStepModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        steps={modalSteps}
        initialStep={currentModalStep}
        size="md"
      />
    </div>
  )
}

export default App
