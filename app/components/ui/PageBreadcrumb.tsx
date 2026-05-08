'use client';

import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useRouter } from 'next/navigation';

interface Crumb {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  crumbs: Crumb[];
}

export default function PageBreadcrumb({ crumbs }: PageBreadcrumbProps) {
  const router = useRouter();
  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize='small' />} aria-label='breadcrumb'>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return isLast ? (
            <Typography key={i} variant='body2' color='text.primary' fontWeight={500}>
              {crumb.label}
            </Typography>
          ) : (
            <Link
              key={i}
              component='button'
              variant='body2'
              underline='hover'
              color='inherit'
              onClick={() => crumb.href && router.push(crumb.href)}
              sx={{ cursor: 'pointer' }}
            >
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
