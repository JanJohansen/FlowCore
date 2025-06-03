export class BaseTransport {
    messageHandler;
    connectHandler;
    disconnectHandler;
    connected = false;
    onMessage(handler) {
        this.messageHandler = handler;
    }
    onConnect(handler) {
        this.connectHandler = handler;
    }
    onDisconnect(handler) {
        this.disconnectHandler = handler;
    }
    isConnected() {
        return this.connected;
    }
    handleConnect() {
        this.connected = true;
        this.connectHandler?.();
    }
    handleDisconnect() {
        this.connected = false;
        this.disconnectHandler?.();
    }
}
