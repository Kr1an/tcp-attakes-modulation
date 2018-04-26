const encode = (payload) => payload; 

class DB {
    constructor() {
        this.store = {};
        this.MAX_ROW = 20;
    }
    insert(key, value) {
        if (Object.keys(this.store).length > this.MAX_ROW) {
            throw new Error('db is not available');
        }
        console.log('saved: ', key, value);
        this.store[key] = value;
    }
}
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
    server = new Machine(SERVER_MACHINE_ID),
    db = new DB();

function serverReceive({
    payload,
    transmitter,
}) {
    console.log('received: ', payload, transmitter)
    if (payload.SYN) {
        const objectToSave = { id: transmitter, SYN: payload.SYN, ACK: 60 };
        const secret = null || encode(JSON.stringify(objectToSave));
//        db.insert(transmitter, objectToSave);
        const objToSend = { SYN: 60, ACK: payload.SYN + 1, secret: secret || undefined };
        this.send(objToSend, transmitter);
        console.log('send: ', objToSend, transmitter);
    }
    return `Connection with ${transmitter} established`;
}

const router = new Router()
    .register(client)
    .register(server);

const fakeClients = new Array(30).fill({}).map((_, idx) => new Machine(idx));

fakeClients.forEach(fakeClient => {
    router.register(fakeClient);
    fakeClient.router = router;
    fakeClient.receive = () => null;
});

server.receive = serverReceive.bind(server);
client.receive = () => null;
server.router = router;
client.router = router;
fakeClients.forEach(fakeClient => fakeClient.send({ SYN: 30 }, SERVER_MACHINE_ID));

