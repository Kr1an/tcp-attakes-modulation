const ECONNECTION = 'ECONNECTION';

class Machine {
    constructor() {
        this.processes = {};
    }
    start(port, processName) {
        this.processes[port] = processName;
        return this;
    }
    receive(port, message) {
        const process = this.processes[port];
        return process && process(message);
    }
}

class FireWallProxy {
    constructor(machine, validate) {
        this.machine = machine;
        this.validate = validate;
    }
    receive(port, message) {
        return this.validate(port, message) || this.machine.receive(port, message);
    }
}

class Scanner {
    constructor(machine) {
        this.machine = machine;
        this.PORT_MAX_NUMBER = 65535;
    }
    scan() {
        return new Array(this.PORT_MAX_NUMBER).fill({})
            .map((_, port) => ({ port, result: this.machine.receive(port, 'SCANNER MESSAGE') }))
    }
}

const
    makeServiceHandler = securityLevel => port => message => `${securityLevel} service running on port ${port}. Received ${message}`,
    makePublicServiceHandler = makeServiceHandler('public'),
    makePrivateServiceHandler = makeServiceHandler('private'),
    openedPorts = [80, 190, 2000];

const machine = new Machine()
    .start(1000, makePublicServiceHandler(1000))
    .start(1001, makePublicServiceHandler(1001))
    .start(1005, makePublicServiceHandler(1005))
    .start(190, makePublicServiceHandler(190))
    .start(2000, makePublicServiceHandler(2000))
    .start(80, makePublicServiceHandler(80))
    .start(6999, makePrivateServiceHandler(6999))
    .start(75, makePrivateServiceHandler(75))
    .start(12, makePrivateServiceHandler(12))
    
const
    validate = (port, message) => openedPorts.find(openPort => openPort === port) ? null : ECONNECTION,
    firewalledMachine = new FireWallProxy(machine, validate),
    scanner = new Scanner(machine),
    scanResult = scanner.scan();


console.log(scanResult.filter(x => x.result));
