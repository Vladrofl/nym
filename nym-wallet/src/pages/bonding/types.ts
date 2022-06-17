export type FormStep = 1 | 2 | 3;
export type NodeType = 'mixnode' | 'gateway';

export type ACTIONTYPE =
  | { type: 'change_bond_type'; payload: 'mixnode' | 'gateway' }
  | { type: 'set_node_data'; payload: NodeData }
  | { type: 'set_amount_data'; payload: AmountData }
  | { type: 'set_step'; payload: FormStep }
  | { type: 'next_step' }
  | { type: 'previous_step' }
  | { type: 'show_modal' }
  | { type: 'close_modal' }
  | { type: 'reset' };

export interface NodeData {
  nodeType: NodeType;
  identityKey: string;
  sphinxKey: string;
  signature: string;
  host: string;
  version: string;
  advancedOpt: boolean;
}

export interface MixnodeAmountData {
  profitMargin: string;
  amount: string;
}

export type GatewayAmountData = Pick<MixnodeAmountData, 'amount'>;
export type AmountData = MixnodeAmountData | GatewayAmountData;

export interface BondState {
  showModal: boolean;
  formStep: FormStep;
  nodeData?: NodeData;
  amountData?: AmountData;
}
