declare namespace Paho {
    namespace MQTT {
        interface MQTTError { errorCode: string, errorMessage: string }
        interface WithInvocationContext { invocationContext: object }
        interface ErrorWithInvocationContext extends MQTTError, WithInvocationContext {}
        interface OnSubscribeSuccessParams extends WithInvocationContext { grantedQos: number }
        type OnConnectionLostHandler = (error: MQTTError) => void;
        type OnMessageHandler = (message: Message) => void;
        interface ConnectionOptions {
            timeout?: number;
            userName?: string;
            password?: string;
            willMessage?: Message;
            keepAliveInterval?: number;
            cleanSession?: boolean;
            useSSL?: boolean;
            invocationContext?: object;
            onSuccess?: (o: WithInvocationContext) => void;
            mqttVersion?: number;
            onFailure?: (e: ErrorWithInvocationContext) => void;
            hosts?: Array<string>; 
            ports?: Array<number>;
        }
        interface SubscribeOptions {
            qos?: number;
            invocationContext?: object;
            onSuccess?: (o: OnSubscribeSuccessParams) => void;
            onFailure?: (e: ErrorWithInvocationContext) => void;
            timeout?: number;
        }
        interface UnsubscribeOptions {
            invocationContext?: object;
            onSuccess?: (o: WithInvocationContext) => void;
            onFailure?: (e: ErrorWithInvocationContext) => void;
            timeout?: number;
        }
        class Client {

            constructor(host: string, port: number, path: string, clientId: string);
            constructor(host: string, port: number, clientId: string);
            constructor(hostUri: string, clientId: string);

            readonly clientId: string;
            readonly host: string;
            readonly path: string;
            readonly port: number;

            onConnectionLost: OnConnectionLostHandler;
            onMessageArrived: OnMessageHandler;
            onMessageDelivered: OnMessageHandler;

            connect(connectionOptions?: ConnectionOptions);
            disconnect();

            getTraceLog(): Object[];
            startTrace();
            stopTrace();

            send(message: Message);
            subscribe(filter: string, subcribeOptions?: SubscribeOptions);
            unsubscribe(filter: string, unsubcribeOptions?: UnsubscribeOptions);
        }

        class Message {
            constructor(payload: String | ArrayBuffer);

            destinationName: string;
            readonly duplicate: boolean;
            readonly payloadBytes: ArrayBuffer;
            readonly payloadString: string;
            qos: number;
            retained: boolean;
        }
    }
}
