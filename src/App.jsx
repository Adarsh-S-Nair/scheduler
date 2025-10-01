import { useState, useEffect, useMemo } from 'react'
import TitleBar from './components/TitleBar'
import AppTopBar from './components/AppTopBar'
import Button from './components/Button'
import MultiStepModal from './components/MultiStepModal'
import BotConfigForm from './components/BotConfigForm'
import RepositoryPathForm from './components/RepositoryPathForm'
import botsData from './data/bots.json'
import { initializeUserData, loadUserData, activateBot, getActiveBots, getBotConfig, saveBotConfig, getRepositoryPath, saveRepositoryPath } from './utils/userDataManager'
import './App.css'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBot, setSelectedBot] = useState(null)
  const [bots] = useState(botsData)
  const [activeBotIds, setActiveBotIds] = useState([])
  const [needsConfig, setNeedsConfig] = useState(false)
  const [currentModalStep, setCurrentModalStep] = useState(0)
  const [isCredentialsFormValid, setIsCredentialsFormValid] = useState(false)

  useEffect(() => {
    // Initialize user data on app startup
    const init = async () => {
      // Clear any old localStorage data (one-time cleanup)
      if (localStorage.getItem('scheduler_user_data')) {
        console.log('Clearing old localStorage data...')
        localStorage.removeItem('scheduler_user_data')
      }
      
      await loadUserData()
      await initializeUserData()
      setActiveBotIds(getActiveBots())
    }
    
    init()
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBot(null)
    setNeedsConfig(false)
    setCurrentModalStep(0)
    setIsCredentialsFormValid(false)
    setTempCredentials(null)
  }

  const handleBotSelect = ({ handleClose }) => {
    if (!selectedBot) return
    
    console.log('handleBotSelect called for:', selectedBot.name)
    
    // Check if bot already has config
    const existingConfig = getBotConfig(selectedBot.id)
    console.log('Existing config:', existingConfig)
    
    if (existingConfig && existingConfig.username && existingConfig.password) {
      // Config exists, activate bot directly
      activateBot(selectedBot.id)
      setActiveBotIds(getActiveBots())
      console.log('Bot activated with existing config:', selectedBot.name)
      handleClose()
    } else {
      // No config, we need to show configuration steps
      console.log('No config found, setting needsConfig=true and currentModalStep=1')
      // Use React's batched state updates
      setNeedsConfig(true)
      // Use requestAnimationFrame to ensure state is updated before changing step
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('Now setting currentModalStep to 1')
          setCurrentModalStep(1)
        })
      })
    }
  }

  const [tempCredentials, setTempCredentials] = useState(null)

  const handleConfigSubmit = (formData) => {
    // Store credentials temporarily, don't save yet
    console.log('Storing credentials temporarily')
    setTempCredentials(formData)
  }

  const handleRepoPathSubmit = ({ repoPath }) => {
    // Now save everything at once
    if (selectedBot && tempCredentials) {
      // Save bot configuration
      saveBotConfig(selectedBot.id, tempCredentials)
      console.log('Credentials saved for:', selectedBot.name)
    }
    
    // Save repository path
    saveRepositoryPath(repoPath)
    
    // Activate the bot
    if (selectedBot) {
      activateBot(selectedBot.id)
      setActiveBotIds(getActiveBots())
      console.log('Bot activated:', selectedBot.name, 'Repository:', repoPath)
    }
    
    // Clear temp data and close
    setTempCredentials(null)
    handleCloseModal()
  }

  // Define modal steps dynamically
  const modalSteps = useMemo(() => {
    console.log('Rebuilding modal steps. needsConfig:', needsConfig, 'currentModalStep:', currentModalStep)
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
            console.log('Next button clicked on credentials step')
            // Trigger form submission
            const form = document.querySelector('.bot-config-form')
            console.log('Form found:', !!form)
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
              form.dispatchEvent(submitEvent)
              // Move to next step after a brief delay to ensure form is processed
              setTimeout(() => {
                console.log('Moving to step 2 (Repository Path)')
                setCurrentModalStep(2)
                goToNextStep()
              }, 100)
            } else {
              console.error('Could not find .bot-config-form')
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

    console.log('Total modal steps:', steps.length)
    return steps
  }, [bots, selectedBot, needsConfig, isCredentialsFormValid])

  return (
    <div className="App">
      <TitleBar />
      <AppTopBar />
      <main className="main-content">
        {activeBotIds.length === 0 ? (
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
        ) : (
          <div className="active-bots-container">
            <div className="active-bots-header">
              <h2 className="active-bots-title">Active Bots</h2>
              <Button 
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
              >
                Connect Bot
              </Button>
            </div>
            <div className="active-bots-list">
              {activeBotIds.map((botId) => {
                const bot = bots.find(b => b.id === botId)
                if (!bot) return null
                
                return (
                  <div key={botId} className="active-bot-card">
                    <div className="active-bot-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <circle cx="12" cy="5" r="2" />
                        <path d="M12 7v4" />
                        <line x1="8" y1="16" x2="8" y2="16" />
                        <line x1="16" y1="16" x2="16" y2="16" />
                      </svg>
                    </div>
                    <div className="active-bot-info">
                      <h3 className="active-bot-name">{bot.name}</h3>
                      <p className="active-bot-description">{bot.description}</p>
                      <div className="active-bot-status">
                        <div className="status-indicator"></div>
                        <span>Connected</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
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
