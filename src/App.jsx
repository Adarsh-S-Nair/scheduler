import { useState, useEffect, useMemo } from 'react'
import { FaPlay, FaTerminal } from 'react-icons/fa'
import TitleBar from './components/TitleBar'
import Button from './components/Button'
import MultiStepModal from './components/MultiStepModal'
import BotConfigForm from './components/BotConfigForm'
import RepositoryPathForm from './components/RepositoryPathForm'
import Terminal from './components/Terminal'
import botsData from './data/bots.json'
import { getBotIcon } from './utils/iconMap'
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
  
  // Terminal state
  const [terminalState, setTerminalState] = useState({
    isOpen: false,
    isRunning: false,
    botType: null,
    isFullscreen: false
  })

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

  // Set up hotkey event listeners
  useEffect(() => {
    if (!window.ipcRenderer) return

    // Handle hotkey notifications
    const handleHotkeyNoBotSelected = () => {
      console.log('Hotkey pressed but no bot selected')
      alert('No bot selected! Please select a bot first by clicking the Play button.')
    }

    const handleHotkeyBotToggled = (event, data) => {
      console.log('Bot toggled via hotkey:', data)
      // Update terminal state to reflect the change
      if (terminalState.isOpen && terminalState.botType === data.botType) {
        setTerminalState(prev => ({ ...prev, isRunning: data.isRunning }))
      }
    }

    const handleHotkeyError = (event, error) => {
      console.error('Hotkey error:', error)
      alert(`Hotkey error: ${error}`)
    }

    const handleHotkeyEmergencyStop = (event, result) => {
      console.log('Emergency stop triggered via hotkey:', result)
      if (terminalState.isOpen) {
        setTerminalState(prev => ({ ...prev, isRunning: false }))
      }
      alert(`Emergency stop completed: ${result.message}`)
    }

    const handleHotkeyRequestRepoPath = async (event, botType) => {
      console.log('Hotkey requesting repo path for bot:', botType)
      const repoPath = getRepositoryPath()
      
      if (repoPath) {
        try {
          const result = await window.ipcRenderer.invoke('hotkey:start-bot-with-repo', botType, repoPath)
          if (result.success) {
            // Open terminal and start the bot
            setTerminalState({
              isOpen: true,
              isRunning: true,
              botType,
              isFullscreen: false
            })
            console.log('Bot started via hotkey:', result)
          } else {
            alert(`Failed to start bot via hotkey: ${result.error}`)
          }
        } catch (error) {
          console.error('Error starting bot via hotkey:', error)
          alert(`Error starting bot via hotkey: ${error.message}`)
        }
      } else {
        alert('Repository path not set! Please configure it in settings first.')
      }
    }

    // Register event listeners
    window.ipcRenderer.on('hotkey:no-bot-selected', handleHotkeyNoBotSelected)
    window.ipcRenderer.on('hotkey:bot-toggled', handleHotkeyBotToggled)
    window.ipcRenderer.on('hotkey:error', handleHotkeyError)
    window.ipcRenderer.on('hotkey:emergency-stop', handleHotkeyEmergencyStop)
    window.ipcRenderer.on('hotkey:request-repo-path', handleHotkeyRequestRepoPath)

    // Cleanup
    return () => {
      if (window.ipcRenderer) {
        window.ipcRenderer.off('hotkey:no-bot-selected', handleHotkeyNoBotSelected)
        window.ipcRenderer.off('hotkey:bot-toggled', handleHotkeyBotToggled)
        window.ipcRenderer.off('hotkey:error', handleHotkeyError)
        window.ipcRenderer.off('hotkey:emergency-stop', handleHotkeyEmergencyStop)
        window.ipcRenderer.off('hotkey:request-repo-path', handleHotkeyRequestRepoPath)
      }
    }
  }, [terminalState.isOpen, terminalState.botType])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBot(null)
    setNeedsConfig(false)
    setCurrentModalStep(0)
    setIsCredentialsFormValid(false)
    setTempCredentials(null)
  }

  // Terminal control functions
  const openTerminal = (botType) => {
    setTerminalState({
      isOpen: true,
      isRunning: false,
      botType,
      isFullscreen: false
    })
    
    // Set current bot for hotkeys
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('hotkey:set-current-bot', botType)
    }
  }

  const closeTerminal = () => {
    setTerminalState({
      isOpen: false,
      isRunning: false,
      botType: null,
      isFullscreen: false
    })
  }

  const startTerminal = () => {
    setTerminalState(prev => ({ ...prev, isRunning: true }))
    
    // Update bot state for hotkeys
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('hotkey:set-bot-state', true, terminalState.botType)
    }
  }

  const stopTerminal = () => {
    setTerminalState(prev => ({ ...prev, isRunning: false }))
    
    // Update bot state for hotkeys
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('hotkey:set-bot-state', false, null)
    }
  }

  const toggleTerminalFullscreen = () => {
    setTerminalState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))
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
            {bots.map((bot) => {
              const BotIcon = getBotIcon(bot.icon)
              
              return (
                <div
                  key={bot.id}
                  className={`bot-item ${selectedBot?.id === bot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBot(bot)}
                >
                  <div className="bot-icon">
                    <BotIcon />
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
              )
            })}
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
      
      <div className="app-layout">
        {/* Main Content */}
        <main className={`main-content ${terminalState.isOpen ? 'terminal-open' : ''}`}>
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
                  
                  const BotIcon = getBotIcon(bot.icon)
                  const isSelected = terminalState.isOpen && terminalState.botType === bot.id
                  const isRunning = terminalState.isOpen && terminalState.botType === bot.id && terminalState.isRunning
                  
                  return (
                    <div key={botId} className={`active-bot-row ${isSelected ? 'selected' : ''} ${isRunning ? 'running' : ''}`}>
                      <div className="active-bot-main">
                        <div className="active-bot-icon">
                          <BotIcon />
                          {isRunning && <div className="running-indicator"></div>}
                        </div>
                        <div className="active-bot-info">
                          <h3 className="active-bot-name">{bot.name}</h3>
                          <p className="active-bot-description">{bot.description}</p>
                        </div>
                      </div>
                      <button
                        className="bot-run-button"
                        onClick={() => openTerminal(bot.id)}
                        title={`Run ${bot.name} bot in integrated terminal`}
                      >
                        <FaPlay />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>

        {/* Terminal Panel */}
        <div className={`terminal-panel ${terminalState.isOpen ? 'open' : ''} ${terminalState.isFullscreen ? 'fullscreen' : ''}`}>
          <Terminal
            repoPath={getRepositoryPath()}
            botType={terminalState.botType}
            isRunning={terminalState.isRunning}
            onStart={startTerminal}
            onStop={stopTerminal}
            onToggleFullscreen={toggleTerminalFullscreen}
            onClose={closeTerminal}
            isFullscreen={terminalState.isFullscreen}
            className="dashboard-terminal"
          />
        </div>
      </div>

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
