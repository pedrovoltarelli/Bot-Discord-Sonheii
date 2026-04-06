/**
 * Logger centralizado com cores e timestamp.
 * Níveis: info | warn | error | success | debug
 */

const COLORS = {
  reset: '\x1b[0m',
  info:    '\x1b[36m',   // Ciano
  warn:    '\x1b[33m',   // Amarelo
  error:   '\x1b[31m',   // Vermelho
  success: '\x1b[32m',   // Verde
  debug:   '\x1b[35m',   // Magenta
};

function timestamp() {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function log(level, message) {
  const color = COLORS[level] || COLORS.reset;
  const label = level.toUpperCase().padEnd(7);
  console.log(`${color}[${timestamp()}] [${label}]${COLORS.reset} ${message}`);
}

module.exports = {
  info:    (msg) => log('info', msg),
  warn:    (msg) => log('warn', msg),
  error:   (msg) => log('error', msg),
  success: (msg) => log('success', msg),
  debug:   (msg) => log('debug', msg),
};
