class Machine {
    constructor(id) {
        this.id = id;
        this.router = null;
        this.receive = null;
    }
    send(payload, receiver) {
        return this.router.transport({
            receiver,
            payload,
            transmitter: this.id,
        });
    }
}

class Router {
    constructor() {
        this.map = {};
        this.middlewares = [];
    }
    register(machine) {
        this.map[machine.id] = machine;
        return this;
    }
    use(middleware) {
        this.middlewares = [
            ...this.middlewares,
            middleware,
        ];
        return this;
    }
    transport({
        transmitter,
        receiver,
        payload,
    }) {
        return this.map[receiver]
            .receive({
                payload: this.middlewares.reduce((a, c) => c(a), payload),
                transmitter,
            });
    }
}

const
    CLIENT_MACHINE_ID = 'CLIENT_MACHINE_ID',
    SERVER_MACHINE_ID = 'SERVER_MACHINE_ID',
    ECONNECTION = 'ECONNECTION',
    client = new Machine(CLIENT_MACHINE_ID),
    server = new Machine(SERVER_MACHINE_ID);

const serverReceive = ({
    payload,
    transmitter,
}) => {
    if (payload.reset) {
        return ECONNECTION;
    }
    return `Connection with ${transmitter} established`;
}

const router = new Router()
    .register(client)
    .register(server);

router.use(payload => ({ ...payload, reset: true }));

server.receive = serverReceive.bind(server);
server.router = router;
client.router = router;

const result = client.send({}, SERVER_MACHINE_ID);

console.log(result);
