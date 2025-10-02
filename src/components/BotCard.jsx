import React, { useState } from 'react'
import { FaPlay, FaStop, FaChartLine, FaTerminal, FaKeyboard } from 'react-icons/fa'
import { getBotIcon } from '../utils/iconMap'
import './BotCard.css'

const BotCard = ({ 
  bot, 
  isSelected, 
  isRunning, 
  onSelect, 
  onStart, 
  onStop, 
  onViewTerminal,
  metrics = {}
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const BotIcon = getBotIcon(bot.icon)
  
  const getStatusColor = () => {
    if (isRunning) return 'running'
    if (isSelected) return 'selected'
    return 'ready'
  }
  
  const getStatusText = () => {
    if (isRunning) return 'Running'
    if (isSelected) return 'Selected'
    return 'Ready'
  }
  
  const formatLastRun = () => {
    if (metrics.lastRun) {
      const now = new Date()
      const lastRun = new Date(metrics.lastRun)
      const diffMinutes = Math.floor((now - lastRun) / 60000)
      
      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return lastRun.toLocaleDateString()
    }
    return 'Never'
  }

  return (
    <div 
      className={`bot-card ${getStatusColor()} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="bot-card-header">
        <div className="bot-card-icon">
          <BotIcon />
          {isRunning && <div className="running-pulse"></div>}
        </div>
        <div className="bot-card-status">
          <span className={`status-badge ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="bot-card-content">
        <h3 className="bot-card-title">{bot.name}</h3>
        <p className="bot-card-description">{bot.description}</p>
        
        {/* Metrics */}
        <div className="bot-card-metrics">
          <div className="metric-item">
            <span className="metric-label">Last run</span>
            <span className="metric-value">{formatLastRun()}</span>
          </div>
          {metrics.questionsAnswered && (
            <div className="metric-item">
              <span className="metric-label">Questions</span>
              <span className="metric-value">{metrics.questionsAnswered}</span>
            </div>
          )}
          {metrics.uptime && (
            <div className="metric-item">
              <span className="metric-label">Uptime</span>
              <span className="metric-value">{metrics.uptime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="bot-card-actions">
        {!isRunning ? (
          <button 
            className="action-btn primary"
            onClick={() => onStart(bot.id)}
            title={`Start ${bot.name} bot`}
          >
            <FaPlay />
            <span>Start</span>
          </button>
        ) : (
          <button 
            className="action-btn danger"
            onClick={() => onStop(bot.id)}
            title={`Stop ${bot.name} bot`}
          >
            <FaStop />
            <span>Stop</span>
          </button>
        )}
        
        <button 
          className="action-btn secondary"
          onClick={() => onViewTerminal(bot.id)}
          title={`View ${bot.name} terminal`}
        >
          <FaTerminal />
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => onSelect(bot.id)}
          title={`Select ${bot.name} for hotkeys`}
        >
          <FaKeyboard />
        </button>
      </div>

      {/* Hotkey Indicator */}
      {isSelected && (
        <div className="hotkey-indicator">
          <FaKeyboard />
          <span>Ctrl+Shift+Z</span>
        </div>
      )}
    </div>
  )
}

export default BotCard
