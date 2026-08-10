import { type GlobalThemeOverrides, darkTheme } from 'naive-ui'

export { darkTheme }

export const earflowThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#14b8a6', // Teal 500
    primaryColorHover: '#2dd4bf',
    primaryColorPressed: '#0d9488',
    primaryColorSuppl: '#14b8a6',
    bodyColor: '#0b0f19',
    cardColor: '#111827',
    modalColor: '#111827',
    popoverColor: '#1e293b',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    heightMedium: '38px'
  },
  Card: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    boxShadow: 'none',
    color: '#111827',
    borderRadius: '6px'
  },
  Button: {
    fontWeight: '600',
    borderRadiusMedium: '6px',
    borderRadiusSmall: '4px'
  },
  Input: {
    color: '#1e293b',
    colorFocus: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderHover: '1px solid #14b8a6',
    borderFocus: '1px solid #14b8a6',
    borderRadius: '6px'
  },
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '6px'
      }
    }
  },
  DataTable: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    headerColor: '#1e293b',
    thTextColor: '#94a3b8',
    tdColor: '#111827',
    tdColorHover: '#1e293b',
    borderRadius: '6px'
  },
  Tabs: {
    tabTextColorActiveBar: '#14b8a6',
    barColor: '#14b8a6'
  }
}
