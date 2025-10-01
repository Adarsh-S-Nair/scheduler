import { FaQuestionCircle, FaRobot } from 'react-icons/fa'

// Map of icon names to React Icon components
export const iconMap = {
  FaQuestionCircle: FaQuestionCircle,
  FaRobot: FaRobot,
  // Add more icons as needed
}

export const getBotIcon = (iconName) => {
  return iconMap[iconName] || FaRobot // Default to robot icon
}

export default iconMap
