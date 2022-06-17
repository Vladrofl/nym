import { object, string, ObjectSchema, boolean } from 'yup';
import { NodeData } from './types';

export const nodeIdentitySchema: ObjectSchema<NodeData> = object({
  nodeType: string<'mixnode' | 'gateway'>().required(),
  identityKey: string().required(),
  sphinxKey: string().required(),
  signature: string().required(),
  host: string().required(),
  version: string().required(),
  advancedOpt: boolean().required(),
});
