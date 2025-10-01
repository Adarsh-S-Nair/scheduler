import { 
  FiCalendar, 
  FiClock, 
  FiList, 
  FiSettings, 
  FiUser,
  FiLogOut
} from 'react-icons/fi'

// Export icons for use in components
export const CalendarIcon = FiCalendar
export const ClockIcon = FiClock
export const ListIcon = FiList
export const SettingsIcon = FiSettings
export const UserIcon = FiUser
export const LogOutIcon = FiLogOut

export const NAV_GROUPS = [
  {
    title: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: CalendarIcon,
        disabled: false,
      },
      {
        label: "Schedule",
        href: "/schedule",
        icon: ClockIcon,
        disabled: false,
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: ListIcon,
        disabled: false,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        label: "Preferences",
        href: "/settings",
        icon: SettingsIcon,
        disabled: false,
      },
      {
        label: "Profile",
        href: "/profile",
        icon: UserIcon,
        disabled: true,
      },
    ],
  },
]
