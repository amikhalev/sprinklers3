/* tslint:disable:interface-name */

declare namespace Paho {
    namespace MQTT {
        interface MQTTError { errorCode: string; errorMessage: string; }
        interface WithInvocationContext { invocationContext: object; }
        interface ErrorWithInvocationContext extends MQTTError, WithInvocationContext {}
        interface OnSubscribeSuccessParams extends WithInvocationContext { grantedQos: number; }
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
            hosts?: string[];
            ports?: number[];
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
            public readonly clientId: string;
            public readonly host: string;
            public readonly path: string;
            public readonly port: number;

            public onConnectionLost: OnConnectionLostHandler;
            public onMessageArrived: OnMessageHandler;
            public onMessageDelivered: OnMessageHandler;

            // tslint:disable unified-signatures
            constructor(host: string, port: number, path: string, clientId: string);
            constructor(host: string, port: number, clientId: string);
            constructor(hostUri: string, clientId: string);

            public connect(connectionOptions?: ConnectionOptions);
            public disconnect();

            public getTraceLog(): object[];
            public startTrace();
            public stopTrace();

            public send(message: Message);
            public subscribe(filter: string, subcribeOptions?: SubscribeOptions);
            public unsubscribe(filter: string, unsubcribeOptions?: UnsubscribeOptions);
        }

        class Message {
            public destinationName: string;
            public readonly duplicate: boolean;
            public readonly payloadBytes: ArrayBuffer;
            public readonly payloadString: string;
            public qos: number;
            public retained: boolean;

            constructor(payload: string | ArrayBuffer);
        }
    }
}
