// Função para calcular dígitos verificadores de CNPJ
function calculateCNPJCheckDigits(base) {
  // Calcula primeiro dígito
  let sum = 0;
  let multiplier = 5;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(base[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;

  // Calcula segundo dígito
  sum = 0;
  multiplier = 6;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(base[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  sum += firstDigit * 2;
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;

  return firstDigit.toString() + secondDigit.toString();
}

// Gerar CNPJs válidos
const base1 = '51757300000';
const digits1 = calculateCNPJCheckDigits(base1);
const cnpj1 = base1 + digits1;
console.log('CNPJ 1:', cnpj1.slice(0, 2) + '.' + cnpj1.slice(2, 5) + '.' + cnpj1.slice(5, 8) + '/' + cnpj1.slice(8, 12) + '-' + cnpj1.slice(12));

const base2 = '27758181000';
const digits2 = calculateCNPJCheckDigits(base2);
const cnpj2 = base2 + digits2;
console.log('CNPJ 2:', cnpj2.slice(0, 2) + '.' + cnpj2.slice(2, 5) + '.' + cnpj2.slice(5, 8) + '/' + cnpj2.slice(8, 12) + '-' + cnpj2.slice(12));
