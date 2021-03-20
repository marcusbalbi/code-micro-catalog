import * as commands from './commands';
import {default as chalk} from 'chalk';
const command = process.argv[2] || null;
if (!command) {
  showAvailableCommands();
}
const commandKey: string | undefined = Object.keys(commands).find(
  //@ts-ignore
  c => commands[c].command === command,
);

if (!commandKey) {
  showAvailableCommands();
}
//@ts-ignore
const commandInstance = new commands[commandKey]();

commandInstance.run().catch((error: any) => console.dir(error, {depth: 5}));

function showAvailableCommands() {
  console.log(chalk.green('Loopback console'));
  console.log('');
  console.log(chalk.green('Available commands'));
  console.log('');
  for (const c of Object.keys(commands)) {
    //@ts-ignore
    console.log(
      //@ts-ignore
      `- ${chalk.green(commands[c].command)} - ${commands[c].description}`,
    );
  }
  console.log('');
  process.exit();
}
