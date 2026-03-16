import React from 'react';
import { Card, CardProps, CardContent, Box } from '@mui/material';

interface AnimatedCardProps extends CardProps {
  children: React.ReactNode;
  gradient?: boolean;
  hover?: boolean;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  gradient = false,
  hover = true,
  delay = 0,
  sx,
  ...props
}) => {
  return (
    <Card
      className="modern-card"
      sx={{
        animation: `fadeIn 0.5s ease ${delay}s both`,
        ...(gradient && {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }),
        ...sx,
      }}
      {...props}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};
