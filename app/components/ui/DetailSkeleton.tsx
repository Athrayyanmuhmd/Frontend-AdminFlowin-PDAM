'use client';

import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton } from '@mui/material';

export interface SkeletonSection {
  /** MUI Grid md colspan (1-12). Default: 6 */
  md?: number;
  /** Number of label-value rows to render. Default: 5 */
  rows?: number;
  /** Show an image/photo area at the bottom of this card */
  hasImage?: boolean;
}

interface DetailSkeletonProps {
  /** Array of card sections. Each entry = one Card in the Grid */
  sections?: SkeletonSection[];
  /** Show title + status chip skeleton in the header area */
  hasHeader?: boolean;
}

const DEFAULT_SECTIONS: SkeletonSection[] = [
  { md: 5, rows: 6 },
  { md: 7, rows: 5 },
];

function CardSkeleton({ rows = 5, hasImage }: { rows?: number; hasImage?: boolean }) {
  return (
    <Card>
      <CardContent>
        {/* Card title row: icon + text */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton variant='circular' width={24} height={24} />
          <Skeleton variant='text' width={160} height={28} />
        </Box>

        {/* InfoRow skeletons */}
        {Array.from({ length: rows }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              py: 0.75,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Skeleton variant='text' width={120} sx={{ mr: 2, flexShrink: 0 }} />
            <Skeleton variant='text' width={i % 3 === 0 ? '60%' : i % 3 === 1 ? '40%' : '75%'} />
          </Box>
        ))}

        {/* Optional image area */}
        {hasImage && (
          <Box sx={{ mt: 2 }}>
            <Skeleton variant='text' width={100} sx={{ mb: 1 }} />
            <Grid container spacing={1}>
              {[1, 2, 3, 4].map((k) => (
                <Grid item xs={6} key={k}>
                  <Skeleton variant='rectangular' width='100%' height={100} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton placeholder for detail pages while data is loading.
 * Mimics the card + InfoRow layout pattern used across all [id] pages.
 */
export default function DetailSkeleton({
  sections = DEFAULT_SECTIONS,
  hasHeader = true,
}: DetailSkeletonProps) {
  return (
    <Box>
      {/* Header: back button + title + status chip */}
      {hasHeader && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Skeleton variant='rounded' width={90} height={30} />
          <Skeleton variant='text' width={200} height={36} />
          <Skeleton variant='rounded' width={80} height={24} sx={{ borderRadius: 999 }} />
        </Box>
      )}

      <Grid container spacing={2}>
        {sections.map((section, i) => (
          <Grid item xs={12} md={section.md ?? 6} key={i}>
            <CardSkeleton rows={section.rows} hasImage={section.hasImage} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
