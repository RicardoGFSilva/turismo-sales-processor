/**
 * Módulo de validação de dados para faturas de turismo
 * Valida CNPJs, valores monetários e datas
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida formato e dígitos verificadores de CNPJ
 * Formato esperado: XX.XXX.XXX/XXXX-XX
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  const errors: string[] = [];

  if (!cnpj) {
    errors.push('CNPJ não pode estar vazio');
    return { isValid: false, errors };
  }

  // Remove caracteres especiais
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    errors.push(`CNPJ deve ter 14 dígitos, encontrado ${cleanCNPJ.length}`);
    return { isValid: false, errors };
  }

  // Verifica se não é uma sequência repetida (ex: 11111111111111)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    errors.push('CNPJ com dígitos repetidos não é válido');
    return { isValid: false, errors };
  }

  // Calcula primeiro dígito verificador
  let sum = 0;
  let multiplier = 5;

  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanCNPJ[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }

  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCNPJ[8]) !== firstDigit) {
    errors.push('Primeiro dígito verificador do CNPJ inválido');
    return { isValid: false, errors };
  }

  // Calcula segundo dígito verificador
  sum = 0;
  multiplier = 6;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCNPJ[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }

  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCNPJ[9]) !== secondDigit) {
    errors.push('Segundo dígito verificador do CNPJ inválido');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida valor monetário
 * Deve ser um número positivo com até 2 casas decimais
 */
export function validateMonetaryValue(value: number | string): ValidationResult {
  const errors: string[] = [];

  if (value === null || value === undefined || value === '') {
    errors.push('Valor não pode estar vazio');
    return { isValid: false, errors };
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    errors.push('Valor deve ser um número válido');
    return { isValid: false, errors };
  }

  if (numValue < 0) {
    errors.push('Valor não pode ser negativo');
    return { isValid: false, errors };
  }

  // Verifica se tem mais de 2 casas decimais
  const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    errors.push('Valor deve ter no máximo 2 casas decimais');
    return { isValid: false, errors };
  }

  // Verifica se o valor é razoável (máximo 1 milhão)
  if (numValue > 1000000) {
    errors.push('Valor excede o limite máximo permitido (R$ 1.000.000,00)');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida data em formato DD/MM/YYYY ou YYYY-MM-DD
 */
export function validateDate(dateString: string): ValidationResult {
  const errors: string[] = [];

  if (!dateString) {
    errors.push('Data não pode estar vazia');
    return { isValid: false, errors };
  }

  let date: Date | null = null;

  // Tenta formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/').map(Number);
    date = new Date(year, month - 1, day);
  }
  // Tenta formato YYYY-MM-DD
  else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    date = new Date(dateString);
  } else {
    errors.push('Data deve estar em formato DD/MM/YYYY ou YYYY-MM-DD');
    return { isValid: false, errors };
  }

  // Verifica se é uma data válida
  if (isNaN(date.getTime())) {
    errors.push('Data inválida');
    return { isValid: false, errors };
  }

  // Verifica se a data não é muito antiga (antes de 2000)
  if (date.getFullYear() < 2000) {
    errors.push('Data deve ser posterior a 2000');
    return { isValid: false, errors };
  }

  // Verifica se a data não é no futuro (com margem de 1 dia)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date > tomorrow) {
    errors.push('Data não pode ser no futuro');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida nome de passageiro
 * Deve ter pelo menos 3 caracteres e conter apenas letras, espaços e barras
 */
export function validatePassengerName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Nome do passageiro não pode estar vazio');
    return { isValid: false, errors };
  }

  if (name.trim().length < 3) {
    errors.push('Nome do passageiro deve ter pelo menos 3 caracteres');
    return { isValid: false, errors };
  }

  if (name.length > 100) {
    errors.push('Nome do passageiro não pode exceder 100 caracteres');
    return { isValid: false, errors };
  }

  // Verifica se contém apenas letras, espaços, barras e acentos
  if (!/^[a-zA-ZÀ-ÿ\s\/]+$/.test(name)) {
    errors.push('Nome do passageiro contém caracteres inválidos');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida rota aérea (ex: REC/GIG, SAO/MIA)
 * Formato: XXX/XXX ou XXX (3 letras maiúsculas, opcionalmente seguidas de / e mais 3 letras)
 */
export function validateRoute(route: string): ValidationResult {
  const errors: string[] = [];

  if (!route || route.trim().length === 0) {
    errors.push('Rota não pode estar vazia');
    return { isValid: false, errors };
  }

  // Verifica formato XXX/XXX ou XXX
  if (!/^[A-Z]{3}(\/[A-Z]{3})?$/.test(route)) {
    errors.push('Rota deve estar em formato XXX ou XXX/XXX (ex: REC/GIG)');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida código de companhia aérea (ex: LA, AA, JJ)
 * Formato: 2 letras maiúsculas
 */
export function validateAirlineCode(code: string): ValidationResult {
  const errors: string[] = [];

  if (!code || code.trim().length === 0) {
    errors.push('Código de companhia aérea não pode estar vazio');
    return { isValid: false, errors };
  }

  if (!/^[A-Z]{2}$/.test(code)) {
    errors.push('Código de companhia aérea deve ter 2 letras maiúsculas (ex: LA, AA)');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida ID de fatura
 * Formato: FTS-XXXXXXXXXXXXXXXX (FTS- seguido de 14+ caracteres)
 */
export function validateInvoiceId(id: string): ValidationResult {
  const errors: string[] = [];

  if (!id || id.trim().length === 0) {
    errors.push('ID da fatura não pode estar vazio');
    return { isValid: false, errors };
  }

  if (!/^FTS-[A-Z0-9]{14,}$/.test(id)) {
    errors.push('ID da fatura deve estar em formato FTS-XXXXXXXXXXXXXXXX');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida um objeto de fatura completo
 */
export interface InvoiceValidationData {
  invoiceId: string;
  agencyName: string;
  agencyCNPJ: string;
  clientName: string;
  clientCNPJ: string;
  tickets: Array<{
    passengerName: string;
    route: string | null | undefined;
    airline: string | null | undefined;
    tariff: number | null | undefined;
    tax: number | null | undefined;
  }>;
}

export function validateInvoice(invoice: InvoiceValidationData): ValidationResult {
  const errors: string[] = [];

  // Valida ID
  const idValidation = validateInvoiceId(invoice.invoiceId);
  if (!idValidation.isValid) {
    errors.push(...idValidation.errors.map(e => `ID da fatura: ${e}`));
  }

  // Valida nome da agência
  if (!invoice.agencyName || invoice.agencyName.trim().length === 0) {
    errors.push('Nome da agência não pode estar vazio');
  }

  // Valida CNPJ da agência
  const agencyCNPJValidation = validateCNPJ(invoice.agencyCNPJ);
  if (!agencyCNPJValidation.isValid) {
    errors.push(...agencyCNPJValidation.errors.map(e => `CNPJ da agência: ${e}`));
  }

  // Valida nome do cliente
  if (!invoice.clientName || invoice.clientName.trim().length === 0) {
    errors.push('Nome do cliente não pode estar vazio');
  }

  // Valida CNPJ do cliente
  const clientCNPJValidation = validateCNPJ(invoice.clientCNPJ);
  if (!clientCNPJValidation.isValid) {
    errors.push(...clientCNPJValidation.errors.map(e => `CNPJ do cliente: ${e}`));
  }

  // Valida tickets
  if (!invoice.tickets || invoice.tickets.length === 0) {
    errors.push('Fatura deve conter pelo menos um bilhete');
  } else {
    invoice.tickets.forEach((ticket, index) => {
      const ticketErrors: string[] = [];

      const nameValidation = validatePassengerName(ticket.passengerName);
      if (!nameValidation.isValid) {
        ticketErrors.push(...nameValidation.errors);
      }

      if (ticket.route) {
        const routeValidation = validateRoute(ticket.route);
        if (!routeValidation.isValid) {
          ticketErrors.push(...routeValidation.errors);
        }
      } else {
        ticketErrors.push('Rota nao pode estar vazia');
      }

      if (ticket.airline) {
        const airlineValidation = validateAirlineCode(ticket.airline);
        if (!airlineValidation.isValid) {
          ticketErrors.push(...airlineValidation.errors);
        }
      } else {
        ticketErrors.push('Codigo de companhia aerea nao pode estar vazio');
      }

      if (ticket.tariff !== null && ticket.tariff !== undefined) {
        const tariffValidation = validateMonetaryValue(ticket.tariff);
        if (!tariffValidation.isValid) {
          ticketErrors.push(`Tarifa: ${tariffValidation.errors.join(', ')}`);
        }
      } else {
        ticketErrors.push('Tarifa nao pode estar vazia');
      }

      if (ticket.tax !== null && ticket.tax !== undefined) {
        const taxValidation = validateMonetaryValue(ticket.tax);
        if (!taxValidation.isValid) {
          ticketErrors.push(`Taxa: ${taxValidation.errors.join(', ')}`);
        }
      } else {
        ticketErrors.push('Taxa nao pode estar vazia');
      }

      if (ticketErrors.length > 0) {
        errors.push(`Bilhete ${index + 1}: ${ticketErrors.join('; ')}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
