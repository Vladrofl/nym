import { number, object, string } from 'yup';
import { validateAmount } from '../../utils';

export const amountSchema = object().shape({
  amount: object().shape({
    amount: string()
      .required('An amount is required')
      .test('valid-amount', 'Pledge error', async function isValidAmount(this, value) {
        const isValid = await validateAmount(value || '', '100');
        if (!isValid) {
          return this.createError({ message: 'A valid amount is required (min 100)' });
        }
        return true;
      }),
  }),
  profitMargin: number().optional().min(0).max(100),

  /*  mixPort: number()
    .required('A mixport is required')
    .test('valid-mixport', 'A valid mixport is required', (value) => (value ? validateRawPort(value) : false)),

  verlocPort: number()
    .required('A verloc port is required')
    .test('valid-verloc', 'A valid verloc port is required', (value) => (value ? validateRawPort(value) : false)),

  httpApiPort: number()
    .required('A http-api port is required')
    .test('valid-http', 'A valid http-api port is required', (value) => (value ? validateRawPort(value) : false)),

  clientsPort: number()
    .required('A clients port is required')
    .test('valid-clients', 'A valid clients port is required', (value) => (value ? validateRawPort(value) : false)), */
});
