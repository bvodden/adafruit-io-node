'use strict';

const Client = require('../client'),
      CLI = require('./index'),
      Yargs = require('yargs'),
      uuid = require('hap-nodejs').uuid,
      Bridge = require('hap-nodejs').Bridge,
      Accessory = require('hap-nodejs').Accessory,
      inquirer = require('inquirer'),
      Accessories = require('../homekit');

class ClientCLI extends CLI {

  constructor() {

    super('homekit');

    this.completions = [
      'help',
      'light'
    ];

    this.yargs = Yargs(process.argv.slice(3));
    this.client = false;
  }

  init() {

    if(! process.env.AIO_CLIENT_USER || ! process.env.AIO_CLIENT_KEY)
      return this.requireAuth(this.yargs);

    const options = {
      success: this.clientReady.bind(this, this.yargs),
      failure: this.error.bind(this)
    };

    if(process.env.AIO_CLIENT_HOST)
      options.host = process.env.AIO_CLIENT_HOST;

    if(process.env.AIO_CLIENT_PORT)
      options.port = process.env.AIO_CLIENT_PORT;

    this.client = new Client(process.env.AIO_CLIENT_USER, process.env.AIO_CLIENT_KEY, options);

  }

  clientReady(yargs) {

    const argv = yargs
      .command('light', 'Light')
      .command('help', 'Show help')
      .demand(1, 'You must supply a valid homekit command')
      .argv;

    if(! argv)
      return;

    const command = argv._[0],
          run = `homekit${command.toUppercase()}`;

    if(command === 'help')
      return yargs.showHelp();

    if(! this[run])
      return yargs.showHelp();

    this[run](Yargs(process.argv.slice(4)));

  }

  homekitLight() {

    yargs.usage(`Usage: adafruit-io homekit light [options]`)
         .command('help', 'Show help')
         .alias('n', 'name').demand('name')
         .nargs('n', 1).describe('n', 'the name of the light');

    const argv = yargs.argv,
          command = argv._[0];

    if(command === 'help')
      return yargs.showHelp();

    const name = argv.name || 'light',
          bridge = new Bridge('Adafruit IO Bridge', uuid.generate('Adafruit IO Bridge'));

    bridge.on('identify', (paired, cb) => cb());
    bridge.addBridgedAccessory((new Accessories.light(name, this.client)));

    bridge.publish({
      username: "CC:22:3D:E3:CE:F6",
      port: 51826,
      pincode: "031-45-154",
      category: Accessory.Categories.BRIDGE
    });

  }

  requireAuth(yargs) {

    const argv = yargs
      .usage('Usage: adafruit-io homekit config [options]')
      .alias('h', 'host').nargs('h', 1).default('h', process.env.AIO_CLIENT_HOST || 'io.adafruit.com').describe('h', 'Server hostname')
      .alias('p', 'port').nargs('p', 1).default('p', process.env.AIO_CLIENT_PORT || '80').describe('p', 'Server port')
      .alias('u', 'username').demand('username').nargs('u', 1).describe('u', 'Adafruit IO Username')
      .alias('k', 'key').demand('key').nargs('k', 1).describe('k', 'Adafruit IO Key')
      .command('help', 'Show help')
      .argv;

    process.env.AIO_CLIENT_HOST = argv.host;
    process.env.AIO_CLIENT_PORT = argv.port;
    process.env.AIO_CLIENT_USER = argv.username;
    process.env.AIO_CLIENT_KEY  = argv.key;

    this.saveEnv();

  }

}

exports = module.exports = ClientCLI;
