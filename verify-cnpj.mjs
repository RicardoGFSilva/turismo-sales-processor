// Verificar CNPJ 51757300000150
const cnpj = '51757300000150';

// Calcula primeiro dígito verificador
let sum = 0;
let multiplier = 5;

for (let i = 0; i < 8; i++) {
  sum += parseInt(cnpj[i]) * multiplier;
  multiplier = multiplier === 2 ? 9 : multiplier - 1;
}

let remainder = sum % 11;
let firstDigit = remainder < 2 ? 0 : 11 - remainder;

console.log('CNPJ:', cnpj);
console.log('Sum for first digit:', sum);
console.log('Remainder:', remainder);
console.log('Calculated first digit:', firstDigit);
console.log('Actual first digit:', cnpj[8]);
console.log('Match:', parseInt(cnpj[8]) === firstDigit);

// Calcula segundo dígito verificador
sum = 0;
multiplier = 6;

for (let i = 0; i < 9; i++) {
  sum += parseInt(cnpj[i]) * multiplier;
  multiplier = multiplier === 2 ? 9 : multiplier - 1;
}

remainder = sum % 11;
let secondDigit = remainder < 2 ? 0 : 11 - remainder;

console.log('\nSum for second digit:', sum);
console.log('Remainder:', remainder);
console.log('Calculated second digit:', secondDigit);
console.log('Actual second digit:', cnpj[9]);
console.log('Match:', parseInt(cnpj[9]) === secondDigit);
