import {Box} from '@mui/material';

interface IdsLogoImageProps {
  width?: number | string;
  height?: number | string;
  /* Additional styles to apply. For example, to force the logo to be all white: {filter: 'brightness(0) invert(1)' } */
  sxExtras?: object;
}

export function IdsLogoImage({width = 200, height = 'auto', sxExtras}: IdsLogoImageProps) {
  return (
    <Box
      component="img"
      src="/ids-logo-2025.svg"
      alt="IDS Logo"
      sx={{
        width,
        height,
        display: 'block',
        ...sxExtras,
      }}
    />
  );
}
