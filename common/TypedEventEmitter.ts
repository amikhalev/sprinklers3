import { EventEmitter } from "events";

type TEventName = string | symbol;

type AnyListener = (...args: any[]) => void;

type Arguments<TListener> = TListener extends (...args: infer TArgs) => any
  ? TArgs
  : any[];
type Listener<TEvents, TEvent extends keyof TEvents> = TEvents[TEvent] extends (
  ...args: infer TArgs
) => any
  ? (...args: TArgs) => void
  : AnyListener;

export interface DefaultEvents {
  newListener: (event: TEventName, listener: AnyListener) => void;
  removeListener: (event: TEventName, listener: AnyListener) => void;
}

export type AnyEvents = DefaultEvents & { [event in TEventName]: any[] };

type IEventSubscriber<TEvents extends DefaultEvents, This> = <
  TEvent extends keyof TEvents & TEventName
>(
  event: TEvent,
  listener: Listener<TEvents, TEvent>
) => This;

// tslint:disable:ban-types

interface ITypedEventEmitter<TEvents extends DefaultEvents = AnyEvents> {
  on: IEventSubscriber<TEvents, this>;
  off: IEventSubscriber<TEvents, this>;
  once: IEventSubscriber<TEvents, this>;
  addListener: IEventSubscriber<TEvents, this>;
  removeListener: IEventSubscriber<TEvents, this>;
  prependListener: IEventSubscriber<TEvents, this>;
  prependOnceListener: IEventSubscriber<TEvents, this>;

  emit<TEvent extends keyof TEvents & TEventName>(
    event: TEvent,
    ...args: Arguments<TEvents[TEvent]>
  ): boolean;
  listeners<TEvent extends keyof TEvents & TEventName>(
    event: TEvent
  ): Function[];
  rawListeners<TEvent extends keyof TEvents & TEventName>(
    event: TEvent
  ): Function[];
  eventNames(): Array<keyof TEvents | TEventName>;
  setMaxListeners(maxListeners: number): this;
  getMaxListeners(): number;
  listenerCount<TEvent extends keyof TEvents & TEventName>(
    event: TEvent
  ): number;
}

const TypedEventEmitter = EventEmitter as {
  new <TEvents extends DefaultEvents = AnyEvents>(): TypedEventEmitter<TEvents>;
};
type TypedEventEmitter<
  TEvents extends DefaultEvents = AnyEvents
> = ITypedEventEmitter<TEvents>;

type Constructable = new (...args: any[]) => any;

export function typedEventEmitter<
  TBase extends Constructable,
  TEvents extends DefaultEvents = AnyEvents
>(Base: TBase): TBase & TypedEventEmitter<TEvents> {
  const NewClass = class extends Base {
    constructor(...args: any[]) {
      super(...args);
      EventEmitter.call(this);
    }
  };
  Object.getOwnPropertyNames(EventEmitter.prototype).forEach(name => {
    NewClass.prototype[name] = (EventEmitter.prototype as any)[name];
  });
  return NewClass as any;
}

export { TypedEventEmitter };
