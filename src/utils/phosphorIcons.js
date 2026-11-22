import {
  Bell,
  CalendarCheck,
  House,
  Question,
  Ticket,
} from '@phosphor-icons/react'

const iconRegistry = {
  House,
  CalendarCheck,
  Bell,
  Ticket,
}

export function resolvePhosphorIcon(iconName) {
  return iconRegistry[iconName] ?? Question
}
