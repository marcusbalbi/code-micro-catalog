import * as commands from './commands';

const command = process.argv[2] || null;
if (!command) {
  // show disponiveis
}
const commandKey: string | undefined = Object.keys(commands).find(
  //@ts-ignore
  c => commands[c].command === command,
);

if (!commandKey) {
  // show disponiveis
}

console.log(commandKey);

// executar comando
