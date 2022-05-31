import React, { FC, useEffect, useState } from 'react';
import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { CopyToClipboard } from '@nymproject/react/clipboard/CopyToClipboard';
import { DelegationEvent, DelegationWithEverything } from '@nymproject/types';
import { ArrowDropDown } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof DelegationEvent;
  label: string;
  sortable: boolean;
  disablePadding?: boolean;
}

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof DelegationEvent) => void;
  order: Order;
  orderBy: string;
}

const headCells: HeadCell[] = [
  { id: 'node_identity', label: 'Node ID', sortable: true },
  { id: 'amount', label: 'Delegation', sortable: true },
  { id: 'kind', label: 'Type', sortable: true },
];

const EnhancedTableHead: React.FC<EnhancedTableProps> = ({ order, orderBy, onRequestSort }) => {
  const createSortHandler = (property: keyof DelegationEvent) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="left"
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            color="secondary"
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              IconComponent={ArrowDropDown}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export const PendingEvents: FC<{ pendingEvents: DelegationEvent[]; explorerUrl: string }> = ({
  pendingEvents,
  explorerUrl,
}) => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof DelegationEvent>('node_identity');

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof DelegationEvent) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (pendingEvents.length === 0) return <Typography>No pending events</Typography>;

  return (
    <TableContainer>
      <Table sx={{ width: '100%' }}>
        <EnhancedTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
        <TableBody>
          {pendingEvents.map((item, index) => (
            <TableRow key={item.node_identity + index}>
              <TableCell>
                <CopyToClipboard
                  sx={{ fontSize: 16, mr: 1 }}
                  value={item.node_identity}
                  tooltip={
                    <>
                      Copy identity key <strong>{item.node_identity}</strong> to clipboard
                    </>
                  }
                />
                <Tooltip
                  title={
                    <>
                      Click to view <strong>{item.node_identity}</strong> in the Network Explorer
                    </>
                  }
                  placement="right"
                  arrow
                >
                  <Link
                    target="_blank"
                    href={`${explorerUrl}/network-components/mixnode/${item.node_identity}`}
                    color="inherit"
                    underline="none"
                  >
                    {item.node_identity.slice(0, 6)}...{item.node_identity.slice(-6)}
                  </Link>
                </Tooltip>
              </TableCell>
              <TableCell>{!item.amount ? '-' : `${item.amount?.amount} ${item.amount?.denom}`}</TableCell>
              <TableCell>{item.kind === 'Delegate' ? 'Delegation' : 'Undelegation'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
