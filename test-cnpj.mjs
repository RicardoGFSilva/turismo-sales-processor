import { validateCNPJ } from './server/validators.ts';

const result = validateCNPJ('51757300000150');
console.log('CNPJ sem formatação:', result);

const result2 = validateCNPJ('51.757.300/0001-50');
console.log('CNPJ com formatação:', result2);
