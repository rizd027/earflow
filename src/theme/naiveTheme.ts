import { type GlobalThemeOverrides, darkTheme } from 'naive-ui'

export { darkTheme }

export const darkThemeOverrides: GlobalThemeOverrides = {
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
    textColorBase: '#f9fafb',
    textColor1: '#f9fafb',
    textColor2: '#e5e7eb',
    textColor3: '#9ca3af',
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    heightMedium: '38px'
  },
  Card: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: 'none',
    color: '#111827',
    textColor: '#f9fafb',
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
    textColor: '#f9fafb',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    headerColor: '#1e293b',
    thTextColor: '#94a3b8',
    tdColor: '#111827',
    tdColorHover: '#1e293b',
    tdTextColor: '#e5e7eb',
    borderRadius: '6px'
  },
  Tabs: {
    tabTextColorActiveBar: '#14b8a6',
    barColor: '#14b8a6'
  }
}

export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#0f766e', // Teal 700 for high light contrast
    primaryColorHover: '#14b8a6',
    primaryColorPressed: '#115e59',
    primaryColorSuppl: '#0f766e',
    bodyColor: '#f8fafc',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    borderColor: '#e2e8f0',
    textColorBase: '#0f172a',
    textColor1: '#0f172a',
    textColor2: '#1e293b',
    textColor3: '#475569',
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    heightMedium: '38px'
  },
  Card: {
    borderColor: '#e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    color: '#ffffff',
    textColor: '#0f172a',
    borderRadius: '6px'
  },
  Button: {
    fontWeight: '600',
    borderRadiusMedium: '6px',
    borderRadiusSmall: '4px'
  },
  Input: {
    color: '#ffffff',
    colorFocus: '#ffffff',
    textColor: '#0f172a',
    border: '1px solid #cbd5e1',
    borderHover: '1px solid #0f766e',
    borderFocus: '1px solid #0f766e',
    borderRadius: '6px'
  },
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '6px',
        color: '#ffffff',
        textColor: '#0f172a',
        border: '1px solid #cbd5e1'
      }
    }
  },
  DataTable: {
    borderColor: '#e2e8f0',
    headerColor: '#f1f5f9',
    thTextColor: '#334155',
    tdColor: '#ffffff',
    tdColorHover: '#f8fafc',
    tdTextColor: '#0f172a',
    borderRadius: '6px'
  },
  Tabs: {
    tabTextColorActiveBar: '#0f766e',
    barColor: '#0f766e'
  }
}

export const earflowThemeOverrides = darkThemeOverrides
