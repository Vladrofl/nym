import React from 'react';
import {
  Box,
  Grid,
  IconButton,
  Stack,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { InfoOutlined, MoreVert } from '@mui/icons-material';
import { Link } from '@nymproject/react/link/Link';
import { NymCard } from '../../components';
import { BondedMixnode } from '../../context';

const CellHeader = ({
  children,
  tooltip,
  sx,
  size,
  align,
}: {
  children?: React.ReactNode;
  tooltip?: string;
  align?: 'center' | 'inherit' | 'justify' | 'left' | 'right';
  size?: 'small' | 'medium';
  sx?: SxProps;
}) => (
  <TableCell sx={{ py: 1.2, ...sx }} size={size} align={align}>
    {tooltip ? (
      <Tooltip title={tooltip} arrow placement="top-start">
        <Stack direction="row" alignItems="center" fontSize="0.8rem">
          <InfoOutlined fontSize="inherit" sx={{ mr: 0.5 }} />
          <Typography>{children}</Typography>
        </Stack>
      </Tooltip>
    ) : (
      <Typography>{children}</Typography>
    )}
  </TableCell>
);

const CellValue = ({
  children,
  align,
  size,
  sx,
}: {
  children: React.ReactNode;
  align?: 'center' | 'inherit' | 'justify' | 'left' | 'right';
  size?: 'small' | 'medium';
  sx?: SxProps;
}) => (
  <TableCell component="th" scope="row" sx={{ py: 1, ...sx }} align={align} size={size}>
    {children}
  </TableCell>
);

export const MixnodeCard = ({ mixnode }: { mixnode: BondedMixnode }) => {
  const { stake, bond, stakeSaturation, profitMargin, nodeRewards, operatorRewards, delegators } = mixnode;
  return (
    <NymCard title="Monster node">
      <Grid container direction="column" spacing={2}>
        <Grid item>bonded mixnode data table</Grid>
      </Grid>
      <TableContainer component={Box}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <CellHeader sx={{ pl: 0 }}>Stake</CellHeader>
              <CellHeader>Bond</CellHeader>
              <CellHeader tooltip="TODO">Stake saturation</CellHeader>
              <CellHeader
                tooltip="The percentage of the node rewards
that you as the node operator will take
before the rest of the reward is shared
between you and the delegators. "
              >
                PM
              </CellHeader>
              <CellHeader
                tooltip="This is the total rewards for this node
in this epoch including delegates
and the operators share. "
              >
                Node rewards
              </CellHeader>
              <CellHeader
                tooltip="This is your (operator) new rewards
including the PM and cost. You can
compound your rewards manually
every epoch or unbond your node
to redeem them.  "
              >
                Operator rewards
              </CellHeader>
              <CellHeader>No. delegators</CellHeader>
              <CellHeader size="small" sx={{ pr: 0 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow key="mixnode">
              <CellValue sx={{ pl: 0 }}>{`${stake.amount} ${stake.denom}`}</CellValue>
              <CellValue>{`${bond.amount} ${bond.denom}`}</CellValue>
              <CellValue>{`${stakeSaturation}%`}</CellValue>
              <CellValue>{`${profitMargin}%`}</CellValue>
              <CellValue>{`${nodeRewards.amount} ${nodeRewards.denom}`}</CellValue>
              <CellValue>{`${operatorRewards.amount} ${operatorRewards.denom}`}</CellValue>
              <CellValue>{`${delegators}`}</CellValue>
              <CellValue align="center" size="small" sx={{ pr: 0 }}>
                <IconButton sx={{ fontSize: '1rem', padding: 0 }}>
                  <MoreVert fontSize="inherit" sx={{ color: 'text.primary' }} />
                </IconButton>
              </CellValue>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Typography sx={{ mt: 2 }}>
        Check more stats of your node on the{' '}
        <Link href="url" target="_blank">
          explorer
        </Link>
      </Typography>
    </NymCard>
  );
};
