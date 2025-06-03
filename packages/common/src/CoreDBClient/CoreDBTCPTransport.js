import { BaseTransport } from './BaseTransport';
import * as net from 'net';
export class CoreDBTCPTransport extends BaseTransport {
    host;
    port;
    socket;
    buffer = '';
    constructor(host = "localhost", port = 3000) {
        super();
        this.host = host;
        this.port = port;
    }
    async connect() {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();
            this.socket.connect(this.port, this.host, () => {
                this.handleConnect();
                resolve();
            });
            this.socket.on('data', (data) => {
                this.buffer += data.toString();
                this.processBuffer();
            });
            this.socket.on('close', () => {
                this.handleDisconnect();
            });
            this.socket.on('error', reject);
        });
    }
    processBuffer() {
        let messageEnd = this.buffer.indexOf('\n');
        while (messageEnd !== -1) {
            const messageStr = this.buffer.substring(0, messageEnd);
            this.buffer = this.buffer.substring(messageEnd + 1);
            try {
                const message = JSON.parse(messageStr);
                this.messageHandler?.(message);
            }
            catch (error) {
                console.error('Failed to parse TCP message:', error);
            }
            messageEnd = this.buffer.indexOf('\n');
        }
    }
    disconnect() {
        this.socket?.end();
    }
    send(message) {
        if (!this.socket) {
            throw new Error('TCP socket is not connected');
        }
        this.socket.write(JSON.stringify(message) + '\n');
    }
}
