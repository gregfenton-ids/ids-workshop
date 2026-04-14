import type {PaletteMode} from '@mui/material';
import {createTheme} from '@mui/material/styles';

// IDS AI Skeleton Theme
export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#42a5f5' : '#1565C0', // IDS Blue (lighter in dark mode for contrast)
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      secondary: {
        main: '#3C3938', // IDS Dark Gray
        contrastText: '#ffffff',
      },
      ...(mode === 'light' && {
        background: {
          default: '#f7f7f7', // Light grey content area (from design template)
          paper: '#ffffff',
        },
      }),
    },
    typography: {
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    },
  });
}
